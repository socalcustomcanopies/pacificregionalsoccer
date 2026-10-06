import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets'
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory ONLY (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface QuoteSubmissionPayload {
  fullName: string;
  clubOrganization: string;
  teamName: string;
  email: string;
  phone: string;
  selectedProducts: string[];
  quantityNeeded: string;
  projectDetails: string;
  preferredContactMethod: 'Email' | 'Phone' | 'Text';
  isPrslAffiliated: boolean;
  logos: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  }[];
  submittedAt: string;
}

export const PARTNER_NOTIFICATION_EMAIL = 'socalcustomcanopies@gmail.com';

function toBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
    const chunk = utf8Bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeMimeHeader(text: string): string {
  const utf8Bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMimeMessageWithAttachments(params: {
  to: string;
  replyTo?: string;
  subject: string;
  htmlBody: string;
  attachments?: { name: string; type: string; dataUrl?: string }[];
}): string {
  const boundaryMixed = `boundary_mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const validAttachments = (params.attachments || []).filter(
    (att) => att.dataUrl && att.dataUrl.includes(';base64,')
  );

  const headers = [
    `To: ${params.to}`,
    ...(params.replyTo ? [`Reply-To: ${params.replyTo}`] : []),
    `Subject: ${encodeMimeHeader(params.subject)}`,
    'MIME-Version: 1.0'
  ];

  if (validAttachments.length === 0) {
    headers.push('Content-Type: text/html; charset="UTF-8"');
    headers.push('Content-Transfer-Encoding: base64');
    const htmlBase64 = btoa(
      Array.from(new TextEncoder().encode(params.htmlBody), (b) => String.fromCharCode(b)).join('')
    );
    return `${headers.join('\r\n')}\r\n\r\n${htmlBase64}`;
  }

  headers.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);

  const htmlBase64 = btoa(
    Array.from(new TextEncoder().encode(params.htmlBody), (b) => String.fromCharCode(b)).join('')
  );

  const parts: string[] = [
    `--${boundaryMixed}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBase64
  ];

  for (const att of validAttachments) {
    const base64Data = att.dataUrl!.split(';base64,')[1];
    const mimeType = att.type || 'application/octet-stream';
    const safeFilename = att.name.replace(/["\r\n]/g, '_');
    parts.push(
      `--${boundaryMixed}`,
      `Content-Type: ${mimeType}; name="${safeFilename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${safeFilename}"`,
      '',
      base64Data
    );
  }

  parts.push(`--${boundaryMixed}--`, '');
  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`;
}

async function sendGmailRawMessage(accessToken: string, rawMime: string): Promise<void> {
  const encodedMessage = toBase64Url(rawMime);
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData?.error?.message || `Gmail API failed with status ${res.status}`;
    throw new Error(errorMessage);
  }
}

export async function sendQuoteEmails(
  accessToken: string,
  payload: QuoteSubmissionPayload
): Promise<{ vendorEmailSent: boolean; confirmationEmailSent: boolean }> {
  const productsText =
    payload.selectedProducts.length > 0
      ? payload.selectedProducts.join(', ')
      : 'None specified';
  const logosText =
    payload.logos.length > 0
      ? payload.logos
          .map((l) => `${l.name} (${(l.size / (1024 * 1024)).toFixed(2)} MB)`)
          .join(', ')
      : 'No logo files attached';

  const submittedDateFormatted = new Date(payload.submittedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // 1. Email to socalcustomcanopies@gmail.com
  const vendorSubject = `New PRSL Member Pricing Request: ${payload.clubOrganization}${
    payload.teamName ? ` (${payload.teamName})` : ''
  }`;

  const vendorHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #C8102E; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0A192F; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; margin-bottom: 6px;">
          Pacific Regional Soccer League × SoCal Custom Canopies
        </div>
        <h2 style="margin: 0; font-size: 22px; text-transform: uppercase;">
          New PRSL Member Pricing Request
        </h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #111111;">
        <p style="margin-top: 0; color: #333333; font-size: 15px;">
          A new PRSL Member Pricing request was submitted on <strong>${escapeHtml(submittedDateFormatted)}</strong>.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 38%; background-color: #f9fafb;">Full Name</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.fullName)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Club / Organization</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><strong>${escapeHtml(payload.clubOrganization)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Team Name</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.teamName || 'N/A')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Email Address</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(payload.email)}" style="color: #C8102E;">${escapeHtml(payload.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Phone Number</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.phone)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Preferred Contact</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.preferredContactMethod)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Products Interested In</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(productsText)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Quantity Needed</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.quantityNeeded || 'Not specified')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Project / Design Details</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(payload.projectDetails || 'None provided')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Uploaded Logo Files</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(logosText)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; background-color: #f9fafb;">PRSL Affiliation</td>
            <td style="padding: 10px 12px; color: #15803d; font-weight: bold;">Confirmed PRSL Member Club / Team</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // Include attachments if total size is under 15MB
  const totalAttachmentBytes = payload.logos.reduce((acc, item) => acc + item.size, 0);
  const attachmentsToSend =
    totalAttachmentBytes <= 15 * 1024 * 1024 ? payload.logos : [];

  const vendorMime = buildMimeMessageWithAttachments({
    to: PARTNER_NOTIFICATION_EMAIL,
    replyTo: payload.email,
    subject: vendorSubject,
    htmlBody: vendorHtml,
    attachments: attachmentsToSend
  });

  await sendGmailRawMessage(accessToken, vendorMime);

  // 2. Confirmation email to the person entering the form
  const confirmationSubject = `PRSL Member Pricing Request Received — SoCal Custom Canopies & Print`;

  const confirmationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #C8102E; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0A192F; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; margin-bottom: 6px;">
          Official PRSL Partner Confirmation
        </div>
        <h2 style="margin: 0; font-size: 22px; text-transform: uppercase;">
          Thank You! Your PRSL Quote Request Has Been Received
        </h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #111111;">
        <p style="margin-top: 0; font-size: 15px; line-height: 1.6; color: #222222;">
          Hi <strong>${escapeHtml(payload.fullName)}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #333333;">
          Thank you for submitting your <strong>Pacific Regional Soccer League (PRSL) Member Pricing</strong> request with <strong>SoCal Custom Canopies &amp; Print</strong>. A representative will review your club details and follow up with you via your preferred contact method (<strong>${escapeHtml(payload.preferredContactMethod)}</strong>).
        </p>

        <div style="background-color: #f8f9fa; border-left: 4px solid #C8102E; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #C8102E; margin-bottom: 8px;">
            Summary of Your Request
          </div>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Club / Organization:</strong> ${escapeHtml(payload.clubOrganization)}</p>
          ${payload.teamName ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Team Name:</strong> ${escapeHtml(payload.teamName)}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px;"><strong>Products Interested In:</strong> ${escapeHtml(productsText)}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Quantity Needed:</strong> ${escapeHtml(payload.quantityNeeded || 'Not specified')}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Project / Design Details:</strong> ${escapeHtml(payload.projectDetails || 'None provided')}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Uploaded Logos:</strong> ${escapeHtml(logosText)}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #444444;">
          If you have any immediate questions or additional artwork files to share, you can reply directly to <a href="mailto:${PARTNER_NOTIFICATION_EMAIL}" style="color: #C8102E; font-weight: bold;">${PARTNER_NOTIFICATION_EMAIL}</a> or visit <a href="https://www.socalcustomcanopies.com/" style="color: #0A192F; font-weight: bold;">www.socalcustomcanopies.com</a>.
        </p>
      </div>
    </div>
  `;

  const confirmationMime = buildMimeMessageWithAttachments({
    to: payload.email,
    replyTo: PARTNER_NOTIFICATION_EMAIL,
    subject: confirmationSubject,
    htmlBody: confirmationHtml
  });

  await sendGmailRawMessage(accessToken, confirmationMime);

  return {
    vendorEmailSent: true,
    confirmationEmailSent: true
  };
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

const SHEET_HEADERS = [
  'Submitted At',
  'Full Name',
  'Club / Organization',
  'Team Name',
  'Email Address',
  'Phone Number',
  'Products Interested In',
  'Quantity Needed',
  'Project / Design Details',
  'Preferred Contact Method',
  'PRSL Affiliated',
  'Uploaded Logo Files'
];

export async function createQuoteSpreadsheet(
  accessToken: string,
  title = 'PRSL Member Pricing Requests — SoCal Custom Canopies'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Quote Requests',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create Google Sheet (${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId: string = data.spreadsheetId;
  const spreadsheetUrl: string =
    data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const firstTabTitle: string = data.sheets?.[0]?.properties?.title || 'Quote Requests';

  // Populate header row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${firstTabTitle}!A1:L1`
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [SHEET_HEADERS]
      })
    }
  );

  return { spreadsheetId, spreadsheetUrl };
}

export async function appendQuoteToGoogleSheet(
  accessToken: string,
  payload: QuoteSubmissionPayload,
  existingSpreadsheetIdOrUrl?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetTabName: string }> {
  let spreadsheetId = existingSpreadsheetIdOrUrl
    ? extractSpreadsheetId(existingSpreadsheetIdOrUrl)
    : '';

  if (!spreadsheetId) {
    const created = await createQuoteSpreadsheet(accessToken);
    spreadsheetId = created.spreadsheetId;
  }

  // Fetch spreadsheet metadata first to identify the actual tab name (never assume "Sheet1")
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,spreadsheetUrl,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ||
        `Unable to access Google Sheet (${metaRes.status}). Check the Sheet ID or permissions.`
    );
  }

  const metaData = await metaRes.json();
  const firstSheetTitle: string = metaData.sheets?.[0]?.properties?.title;
  if (!firstSheetTitle) {
    throw new Error('No worksheet tabs found in the target Google Sheet.');
  }

  const spreadsheetUrl: string =
    metaData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Check if the first row has headers; if empty, add headers first
  const headerCheckRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${firstSheetTitle}!A1:L1`
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (headerCheckRes.ok) {
    const headerData = await headerCheckRes.json();
    if (!headerData.values || headerData.values.length === 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          `${firstSheetTitle}!A1:L1`
        )}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [SHEET_HEADERS]
          })
        }
      );
    }
  }

  const rowValues = [
    new Date(payload.submittedAt).toLocaleString('en-US'),
    payload.fullName,
    payload.clubOrganization,
    payload.teamName || '',
    payload.email,
    payload.phone,
    payload.selectedProducts.join(', '),
    payload.quantityNeeded || '',
    payload.projectDetails || '',
    payload.preferredContactMethod,
    payload.isPrslAffiliated ? 'Yes' : 'No',
    payload.logos.map((l) => `${l.name} (${(l.size / (1024 * 1024)).toFixed(2)} MB)`).join(', ')
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      firstSheetTitle
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowValues]
      })
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to insert row into Google Sheet (${appendRes.status})`
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    sheetTabName: firstSheetTitle
  };
}
