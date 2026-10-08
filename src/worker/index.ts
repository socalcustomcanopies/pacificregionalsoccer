/**
 * Cloudflare Worker Backend for Pacific Regional Soccer League (PRSL)
 * Handles:
 *  - GET  /api/health
 *  - POST /api/contact           (PRSL Home Page General Contact Form via PRSL Gmail OAuth2 REST API)
 *  - POST /api/quote-request     (SoCal Custom Canopies Quote Request Form via SoCal Gmail OAuth2 REST API + Private R2 Storage)
 *  - GET  /api/quote-files/*     (Private, HMAC-signed expiring download route for R2 quote artwork files)
 *  - Static SPA Assets fallback via env.ASSETS
 *  - Scheduled Cron handler for automatic 14-day R2 temporary file cleanup
 */

export interface R2ObjectBodyLike {
  body: ReadableStream;
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
  };
  customMetadata?: Record<string, string>;
  size: number;
  uploaded: Date;
}

export interface R2ObjectsListLike {
  objects: Array<{
    key: string;
    uploaded: Date;
    customMetadata?: Record<string, string>;
  }>;
  truncated: boolean;
  cursor?: string;
}

export interface R2BucketBinding {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: {
      httpMetadata?: {
        contentType?: string;
        contentDisposition?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
    }
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<R2ObjectsListLike>;
}

export interface FetcherBinding {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export interface WorkerEnv {
  ENVIRONMENT?: 'development' | 'staging' | 'production' | string;
  APP_URL?: string;

  // Static Assets binding (automatically injected by Cloudflare Workers Static Assets)
  ASSETS?: FetcherBinding;

  // Private R2 Bucket binding for SoCal Custom Canopies quote artwork uploads
  QUOTE_UPLOADS_BUCKET?: R2BucketBinding;
  R2_DOWNLOAD_SIGNING_SECRET?: string;

  // Shared Google OAuth2 Client credentials (can also be overridden per account)
  GMAIL_OAUTH_CLIENT_ID?: string;
  GMAIL_OAUTH_CLIENT_SECRET?: string;

  // 1. PRSL Home Page Contact Form (/api/contact) — Dedicated Gmail OAuth2 credentials
  PRSL_GMAIL_USER?: string;
  PRSL_GMAIL_REFRESH_TOKEN?: string;
  PRSL_GMAIL_CLIENT_ID?: string;
  PRSL_GMAIL_CLIENT_SECRET?: string;

  // 2. SoCal Custom Canopies Quote Form (/api/quote-request) — Dedicated Gmail OAuth2 credentials
  GMAIL_USER?: string;
  SOCAL_GMAIL_REFRESH_TOKEN?: string;
  GMAIL_REFRESH_TOKEN?: string;
  SOCAL_GMAIL_CLIENT_ID?: string;
  SOCAL_GMAIL_CLIENT_SECRET?: string;
}

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface ScheduledControllerLike {
  scheduledTime: number;
  cron: string;
}

// Email Constants (Strictly Preserved)
const PRSL_CONTACT_FROM_NAME = 'Pacific Regional Soccer League';
const PRSL_CONTACT_FROM_EMAIL = 'pacificregionalsoccerleague@gmail.com';
const PRSL_CONTACT_TO_EMAIL = 'pacificregionalsoccerleague@gmail.com';
const PRSL_CONTACT_CC_EMAIL = 'pacificregionalsl@gmail.com';

const PARTNER_NOTIFICATION_EMAIL = 'socalcustomcanopies@gmail.com';
const SOCAL_VENDOR_FROM_NAME = 'PRSL Partner Portal';
const SOCAL_CONFIRMATION_FROM_NAME = 'SoCal Custom Canopies & Print';

// Cloudflare Worker Safe Limits
const CONTACT_MAX_BODY_BYTES = 64 * 1024; // 64 KB max payload for /api/contact
const QUOTE_MAX_FILES = 10;
const QUOTE_MAX_SINGLE_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file (safe for 128 MB Worker memory)
const QUOTE_MAX_TOTAL_FILES_BYTES = 50 * 1024 * 1024; // 50 MB total per request
const DIRECT_EMAIL_ATTACHMENT_MAX_BYTES = 12 * 1024 * 1024; // Attach directly in MIME when total <= 12 MB
const R2_RETENTION_DAYS = 14;
const R2_RETENTION_MS = R2_RETENTION_DAYS * 24 * 60 * 60 * 1000;

// Allowed Upload Extensions & MIME Types for Quote Requests
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.ai',
  '.eps',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp'
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/postscript',
  'application/illustrator',
  'application/eps',
  'application/x-eps',
  'image/x-eps',
  'application/octet-stream', // Common browser fallback for .ai and .eps files
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp'
]);

// Rate Limiting (Per Worker Isolate)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CONTACT_RATE_LIMIT_MAX = 10;
const QUOTE_RATE_LIMIT_MAX = 8;
const contactRateMap = new Map<string, { count: number; windowStart: number }>();
const quoteRateMap = new Map<string, { count: number; windowStart: number }>();

// In-Memory OAuth2 Access Token Cache (Keyed by account email)
const oauthTokenCache = new Map<
  string,
  { accessToken: string; expiresAtMs: number; verifiedEmail: string }
>();

function checkRateLimit(
  map: Map<string, { count: number; windowStart: number }>,
  clientIp: string,
  maxRequests: number
): boolean {
  const now = Date.now();
  const entry = map.get(clientIp);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    map.set(clientIp, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (xff && xff.trim()) return xff.split(',')[0].trim();
  return 'unknown';
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeSingleLine(value: string): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

function validateUploadedFile(file: File): { valid: boolean; reason?: string } {
  const ext = getFileExtension(file.name || '');
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      reason: `Unsupported file type "${file.name}". Allowed formats: PDF, AI, EPS, PNG, JPG, SVG, WEBP.`
    };
  }
  const mime = (file.type || 'application/octet-stream').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return {
      valid: false,
      reason: `Unsupported file MIME type "${mime}" for "${file.name}". Allowed formats: PDF, AI, EPS, PNG, JPG, SVG, WEBP.`
    };
  }
  if (file.size <= 0) {
    return {
      valid: false,
      reason: `Uploaded file "${file.name}" is empty (0 bytes).`
    };
  }
  if (file.size > QUOTE_MAX_SINGLE_FILE_BYTES) {
    return {
      valid: false,
      reason: `File "${file.name}" (${formatBytes(file.size)}) exceeds the 25 MB per-file limit.`
    };
  }
  return { valid: true };
}

// --- Web Crypto HMAC-SHA256 Signing for Expiring Private R2 Download Links ---

async function computeHmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  const bytes = new Uint8Array(sigBuffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function createSignedR2DownloadUrl(
  origin: string,
  objectKey: string,
  expiresAtMs: number,
  signingSecret: string
): Promise<string> {
  const expSeconds = Math.floor(expiresAtMs / 1000);
  const payloadToSign = `${objectKey}:${expSeconds}`;
  const sig = await computeHmacHex(signingSecret, payloadToSign);
  const encodedKey = objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${origin}/api/quote-files/${encodedKey}?exp=${expSeconds}&sig=${sig}`;
}

// --- Base64 & RFC 2822 MIME Email Builder for Gmail REST API ---

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

function utf8ToBase64Url(text: string): string {
  return utf8ToBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function wrapBase64Lines(base64Str: string, lineLength = 76): string {
  const lines: string[] = [];
  for (let i = 0; i < base64Str.length; i += lineLength) {
    lines.push(base64Str.slice(i, i + lineLength));
  }
  return lines.join('\r\n');
}

function encodeMimeHeaderUtf8(value: string): string {
  const clean = sanitizeSingleLine(value);
  if (/^[\x20-\x7E]*$/.test(clean)) {
    return clean;
  }
  return `=?UTF-8?B?${utf8ToBase64(clean)}?=`;
}

interface MimeAttachment {
  filename: string;
  contentType: string;
  contentBytes: Uint8Array;
}

interface MimeMessageOptions {
  fromName: string;
  fromEmail: string;
  to: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: MimeAttachment[];
}

function buildRawMimeMessage(options: MimeMessageOptions): string {
  const mixedBoundary = `----=_Part_Mixed_${crypto.randomUUID().replace(/-/g, '')}`;
  const altBoundary = `----=_Part_Alt_${crypto.randomUUID().replace(/-/g, '')}`;

  const escapedFromName = options.fromName.replace(/"/g, '\\"');
  const headers: string[] = [
    `From: "${escapedFromName}" <${ sanitizeSingleLine(options.fromEmail) }>`,
    `To: ${sanitizeSingleLine(options.to)}`
  ];

  if (options.cc) {
    headers.push(`Cc: ${sanitizeSingleLine(options.cc)}`);
  }
  if (options.replyTo) {
    headers.push(`Reply-To: ${sanitizeSingleLine(options.replyTo)}`);
  }

  headers.push(`Subject: ${encodeMimeHeaderUtf8(options.subject)}`);
  headers.push('MIME-Version: 1.0');

  const hasAttachments = Array.isArray(options.attachments) && options.attachments.length > 0;

  const textPart = options.text
    ? [
        `--${altBoundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        wrapBase64Lines(utf8ToBase64(options.text))
      ].join('\r\n')
    : '';

  const htmlPart = [
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64Lines(utf8ToBase64(options.html)),
    `--${altBoundary}--`
  ].join('\r\n');

  if (!hasAttachments) {
    headers.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    return [headers.join('\r\n'), '', textPart, htmlPart].filter(Boolean).join('\r\n');
  }

  headers.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
  const bodySections: string[] = [
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    textPart,
    htmlPart
  ].filter(Boolean);

  for (const att of options.attachments!) {
    const safeFilename = sanitizeSingleLine(att.filename).replace(/"/g, '');
    const contentType = sanitizeSingleLine(att.contentType || 'application/octet-stream');
    bodySections.push(
      [
        `--${mixedBoundary}`,
        `Content-Type: ${contentType}; name="${safeFilename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${safeFilename}"`,
        '',
        wrapBase64Lines(bytesToBase64(att.contentBytes))
      ].join('\r\n')
    );
  }

  bodySections.push(`--${mixedBoundary}--`);
  return [headers.join('\r\n'), '', ...bodySections].join('\r\n');
}

// --- Google OAuth2 Token Exchange & Gmail REST API Sender ---

interface GmailOAuthAccountConfig {
  expectedEmail: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

async function getGmailAccessToken(
  config: GmailOAuthAccountConfig,
  forceRefresh = false
): Promise<string> {
  const cacheKey = config.expectedEmail.toLowerCase();
  const now = Date.now();
  const cached = oauthTokenCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAtMs - now > 60_000) {
    return cached.accessToken;
  }

  const tokenParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token'
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString()
  });

  if (!tokenRes.ok) {
    let errorReason = `HTTP ${tokenRes.status}`;
    try {
      const errData = (await tokenRes.json()) as { error?: string; error_description?: string };
      errorReason = errData.error_description || errData.error || errorReason;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(`Gmail OAuth2 token refresh failed for ${config.expectedEmail}: ${errorReason}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!tokenData.access_token) {
    throw new Error(`Gmail OAuth2 response did not include an access_token for ${config.expectedEmail}.`);
  }

  const expiresInMs = Math.max((Number(tokenData.expires_in) || 3600) * 1000, 120_000);
  oauthTokenCache.set(cacheKey, {
    accessToken: tokenData.access_token,
    expiresAtMs: now + expiresInMs,
    verifiedEmail: config.expectedEmail.toLowerCase()
  });

  return tokenData.access_token;
}

async function sendEmailViaGmailRestApi(
  accountConfig: GmailOAuthAccountConfig,
  mimeOptions: MimeMessageOptions
): Promise<{ id: string; threadId?: string }> {
  const rawMime = buildRawMimeMessage(mimeOptions);
  const encodedMessage = utf8ToBase64Url(rawMime);

  const attemptSend = async (forceTokenRefresh: boolean) => {
    const accessToken = await getGmailAccessToken(accountConfig, forceTokenRefresh);
    return fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });
  };

  let res = await attemptSend(false);
  if (res.status === 401) {
    // Handle unexpected access token expiration safely by forcing a single refresh
    res = await attemptSend(true);
  }

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errJson = (await res.json()) as { error?: { message?: string } };
      if (errJson?.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // Ignore parse errors
    }
    throw new Error(`Gmail API send failed (${accountConfig.expectedEmail}): ${errorDetail}`);
  }

  return (await res.json()) as { id: string; threadId?: string };
}

// --- Email Template Builders ---

interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  submittedAt: string;
}

function buildContactEmailTemplates(payload: ContactFormPayload) {
  const submittedDateFormatted = new Date(payload.submittedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/Los_Angeles'
  });

  const safeName = sanitizeSingleLine(payload.name);
  const safeSubject = payload.subject ? sanitizeSingleLine(payload.subject) : 'Not provided';
  const safePhone = payload.phone ? sanitizeSingleLine(payload.phone) : 'Not provided';

  const notificationSubject = `New PRSL Website Contact Form Submission – ${safeName}`;

  const notificationText = [
    'New Pacific Regional Soccer League (PRSL) Website Contact Form Submission',
    '-------------------------------------------------------------------------',
    `Customer Name: ${safeName}`,
    `Email Address: ${payload.email}`,
    `Phone Number: ${safePhone}`,
    `Subject: ${safeSubject}`,
    `Date & Time of Submission: ${submittedDateFormatted}`,
    '',
    'Message:',
    payload.message
  ].join('\n');

  const notificationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #C8102E; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0A192F; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; margin-bottom: 6px;">
          Pacific Regional Soccer League
        </div>
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">
          New Website Contact Form Submission
        </h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #111111;">
        <p style="margin-top: 0; color: #333333; font-size: 15px;">
          A new inquiry was submitted through the PRSL Home Page contact form on <strong>${escapeHtml(submittedDateFormatted)}</strong>.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 35%; background-color: #f9fafb;">Customer Name</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(safeName)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Email Address</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(payload.email)}" style="color: #C8102E;">${escapeHtml(payload.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Phone Number</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(safePhone)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Subject</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(safeSubject)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Date &amp; Time</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(submittedDateFormatted)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb; vertical-align: top;">Message</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(payload.message)}</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const customerConfirmationSubject =
    'We Received Your Message – Pacific Regional Soccer League';

  const customerConfirmationText = [
    `Hi ${safeName},`,
    '',
    'Thank you for contacting the Pacific Regional Soccer League (PRSL). We have received your inquiry and a league representative will get back to you shortly.',
    '',
    'Summary of Your Submission:',
    `Date & Time: ${submittedDateFormatted}`,
    ...(payload.subject ? [`Subject: ${safeSubject}`] : []),
    ...(payload.phone ? [`Phone: ${safePhone}`] : []),
    '',
    'Your Message:',
    payload.message,
    '',
    'Best regards,',
    'Pacific Regional Soccer League',
    PRSL_CONTACT_TO_EMAIL
  ].join('\n');

  const customerConfirmationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #0A192F; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0A192F; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; margin-bottom: 6px;">
          Pacific Regional Soccer League
        </div>
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">
          Thank You for Contacting PRSL
        </h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #111111;">
        <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">
          Hi <strong>${escapeHtml(safeName)}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #333333;">
          Thank you for reaching out to the <strong>Pacific Regional Soccer League (PRSL)</strong>. We have received your message and our league administration team will review your inquiry and respond as soon as possible.
        </p>
        <div style="background-color: #f9fafb; border-left: 4px solid #C8102E; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 8px;">
            Copy of Your Submission
          </div>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${escapeHtml(safeName)}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          ${payload.phone ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${escapeHtml( safePhone )}</p>` : ''}
          ${payload.subject ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml( safeSubject )}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px;"><strong>Submitted:</strong> ${escapeHtml(submittedDateFormatted)}</p>
          <p style="margin: 10px 0 4px 0; font-size: 14px;"><strong>Message:</strong></p>
          <div style="font-size: 14px; color: #333333; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(payload.message)}</div>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #444444; margin-bottom: 0;">
          If you have any additional details to share, you may reply directly to this email or contact us at <a href="mailto:${PRSL_CONTACT_TO_EMAIL}" style="color: #C8102E; font-weight: bold;">${PRSL_CONTACT_TO_EMAIL}</a>.
        </p>
      </div>
    </div>
  `;

  return {
    notificationSubject,
    notificationText,
    notificationHtml,
    customerConfirmationSubject,
    customerConfirmationText,
    customerConfirmationHtml
  };
}

interface StoredArtworkFileMeta {
  name: string;
  size: number;
  type: string;
  r2Key?: string;
  signedDownloadUrl?: string;
  expiresAtIso?: string;
}

interface QuoteRequestPayload {
  fullName: string;
  clubOrganization: string;
  teamName?: string;
  email: string;
  phone: string;
  selectedProducts: string[];
  quantityNeeded?: string;
  projectDetails?: string;
  preferredContactMethod: 'Email' | 'Phone' | 'Text';
  isPrslAffiliated: boolean;
  logos: StoredArtworkFileMeta[];
  submittedAt: string;
}

function buildQuoteEmailTemplates(payload: QuoteRequestPayload) {
  const submittedDateFormatted = new Date(payload.submittedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles'
  });

  const productsText =
    Array.isArray(payload.selectedProducts) && payload.selectedProducts.length > 0
      ? payload.selectedProducts.join(', ')
      : 'None specified';

  const logos = Array.isArray(payload.logos) ? payload.logos : [];
  const logosText =
    logos.length > 0
      ? logos.map((l) => `${l.name} (${formatBytes(l.size)})`).join(', ')
      : 'No logo files attached';

  const logosHtmlRows =
    logos.length > 0
      ? logos
          .map((l) => {
            if (l.signedDownloadUrl) {
              return `<div style="margin-bottom: 6px;">
                <strong>${escapeHtml(l.name)}</strong> (${escapeHtml(formatBytes(l.size))}) —
                <a href="${escapeHtml(l.signedDownloadUrl)}" style="color: #C8102E; font-weight: bold;">Download Artwork File</a>
                <span style="font-size: 11px; color: #6b7280;">(Secure link expires in 14 days)</span>
              </div>`;
            }
            return `<div>${escapeHtml(l.name)} (${escapeHtml(formatBytes(l.size))})</div>`;
          })
          .join('')
      : 'No logo files attached';

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
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.clubOrganization)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Team Name / Age Group</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.teamName || 'N/A')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Email Address</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(payload.email)}" style="color: #C8102E;">${escapeHtml(payload.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Phone Number</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><a href="tel:${escapeHtml(payload.phone)}" style="color: #0A192F;">${escapeHtml(payload.phone)}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Preferred Contact</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.preferredContactMethod)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">PRSL Affiliation</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #15803d; font-weight: bold;">Confirmed PRSL Member Club / Team</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Selected Products</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(productsText)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Estimated Quantity</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(payload.quantityNeeded || 'Not specified')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Project Details</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(payload.projectDetails || 'None provided')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Uploaded Artwork</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${logosHtmlRows}</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const confirmationSubject = `Your PRSL Member Pricing Request – SoCal Custom Canopies & Print`;

  const confirmationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #0A192F; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0A192F; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; margin-bottom: 6px;">
          Official PRSL Partner Confirmation
        </div>
        <h2 style="margin: 0; font-size: 22px; text-transform: uppercase;">
          We Received Your PRSL Quote Request
        </h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #111111;">
        <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">
          Hi <strong>${escapeHtml(payload.fullName)}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #333333;">
          Thank you for submitting your <strong>Pacific Regional Soccer League (PRSL) Member Pricing</strong> request with <strong>SoCal Custom Canopies &amp; Print</strong>. A representative will review your club details and artwork and follow up with you via <strong>${escapeHtml(payload.preferredContactMethod)}</strong>.
        </p>
        <div style="background-color: #f9fafb; border-left: 4px solid #C8102E; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 8px;">
            Request Summary
          </div>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Club / Organization:</strong> ${escapeHtml(payload.clubOrganization)}</p>
          ${payload.teamName ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Team Name:</strong> ${escapeHtml(payload.teamName)}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px;"><strong>Selected Items:</strong> ${escapeHtml(productsText)}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Quantity Needed:</strong> ${escapeHtml(payload.quantityNeeded || 'Not specified')}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Artwork Files:</strong> ${escapeHtml(logosText)}</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #444444; margin-bottom: 0;">
          Questions or additional files? Reply directly to this email at <a href="mailto:${PARTNER_NOTIFICATION_EMAIL}" style="color: #C8102E; font-weight: bold;">${PARTNER_NOTIFICATION_EMAIL}</a> or call <a href="tel:7147173264" style="color: #0A192F; font-weight: bold;">714-717-3264</a>.
        </p>
      </div>
    </div>
  `;

  return {
    vendorSubject,
    vendorHtml,
    confirmationSubject,
    confirmationHtml
  };
}

// --- Route Handlers ---

function handleHealth(env: WorkerEnv): Response {
  const prslClientId = env.PRSL_GMAIL_CLIENT_ID || env.GMAIL_OAUTH_CLIENT_ID;
  const prslClientSecret = env.PRSL_GMAIL_CLIENT_SECRET || env.GMAIL_OAUTH_CLIENT_SECRET;
  const prslRefreshToken = env.PRSL_GMAIL_REFRESH_TOKEN;

  const socalClientId = env.SOCAL_GMAIL_CLIENT_ID || env.GMAIL_OAUTH_CLIENT_ID;
  const socalClientSecret = env.SOCAL_GMAIL_CLIENT_SECRET || env.GMAIL_OAUTH_CLIENT_SECRET;
  const socalRefreshToken = env.SOCAL_GMAIL_REFRESH_TOKEN || env.GMAIL_REFRESH_TOKEN;

  return Response.json({
    status: 'ok',
    runtime: 'cloudflare-workers',
    environment: env.ENVIRONMENT || 'production',
    prslContactOAuthConfigured: Boolean(prslClientId && prslClientSecret && prslRefreshToken),
    socalQuoteOAuthConfigured: Boolean(socalClientId && socalClientSecret && socalRefreshToken),
    r2BucketConfigured: Boolean(env.QUOTE_UPLOADS_BUCKET),
    r2SigningSecretConfigured: Boolean(env.R2_DOWNLOAD_SIGNING_SECRET)
  });
}

async function handleContactPost(request: Request, env: WorkerEnv): Promise<Response> {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > CONTACT_MAX_BODY_BYTES) {
      return Response.json(
        { ok: false, error: 'Request payload exceeds the 64KB size limit.' },
        { status: 413 }
      );
    }

    const rawText = await request.text();
    if (new TextEncoder().encode(rawText).byteLength > CONTACT_MAX_BODY_BYTES) {
      return Response.json(
        { ok: false, error: 'Request payload exceeds the 64KB size limit.' },
        { status: 413 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return Response.json({ ok: false, error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    if (!checkRateLimit(contactRateMap, clientIp, CONTACT_RATE_LIMIT_MAX)) {
      return Response.json(
        {
          ok: false,
          error: 'Too many contact submissions from this address. Please wait a few minutes and try again.'
        },
        { status: 429 }
      );
    }

    // Honeypot check
    const honeypot = String(body.website || body._gotcha || body.honeypot || '').trim();
    if (honeypot.length > 0) {
      return Response.json({ ok: false, error: 'Spam submission detected.' }, { status: 400 });
    }

    const name = sanitizeSingleLine(String(body.name || ''));
    const email = sanitizeSingleLine(String(body.email || '')).toLowerCase();
    const phone = sanitizeSingleLine(String(body.phone || ''));
    const subject = sanitizeSingleLine(String(body.subject || ''));
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return Response.json(
        { ok: false, error: 'Please provide your name, email address, and message.' },
        { status: 400 }
      );
    }

    if (name.length > 120) {
      return Response.json(
        { ok: false, error: 'Name must be 120 characters or fewer.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 254 || !emailRegex.test(email)) {
      return Response.json(
        { ok: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (phone.length > 40) {
      return Response.json(
        { ok: false, error: 'Phone number must be 40 characters or fewer.' },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return Response.json(
        { ok: false, error: 'Subject must be 200 characters or fewer.' },
        { status: 400 }
      );
    }

    if (message.length < 2 || message.length > 5000) {
      return Response.json(
        { ok: false, error: 'Message must be between 2 and 5,000 characters.' },
        { status: 400 }
      );
    }

    const prslUser = String(env.PRSL_GMAIL_USER || PRSL_CONTACT_FROM_EMAIL).trim();
    const prslClientId = String(env.PRSL_GMAIL_CLIENT_ID || env.GMAIL_OAUTH_CLIENT_ID || '').trim();
    const prslClientSecret = String(
      env.PRSL_GMAIL_CLIENT_SECRET || env.GMAIL_OAUTH_CLIENT_SECRET || ''
    ).trim();
    const prslRefreshToken = String(env.PRSL_GMAIL_REFRESH_TOKEN || '').trim();

    if (!prslClientId || !prslClientSecret || !prslRefreshToken) {
      return Response.json(
        {
          ok: false,
          error:
            'PRSL email service is temporarily unavailable (missing OAuth2 configuration). Please try again later.'
        },
        { status: 503 }
      );
    }

    if (prslUser.toLowerCase() !== PRSL_CONTACT_FROM_EMAIL.toLowerCase()) {
      return Response.json(
        {
          ok: false,
          error: 'PRSL email sender configuration mismatch. Please contact the site administrator.'
        },
        { status: 503 }
      );
    }

    const prslOAuthConfig: GmailOAuthAccountConfig = {
      expectedEmail: PRSL_CONTACT_FROM_EMAIL,
      clientId: prslClientId,
      clientSecret: prslClientSecret,
      refreshToken: prslRefreshToken
    };

    const payload: ContactFormPayload = {
      name,
      email,
      phone: phone || undefined,
      subject: subject || undefined,
      message,
      submittedAt: new Date().toISOString()
    };

    const {
      notificationSubject,
      notificationText,
      notificationHtml,
      customerConfirmationSubject,
      customerConfirmationText,
      customerConfirmationHtml
    } = buildContactEmailTemplates(payload);

    // 1. Send PRSL notification email to TO + CC
    const notifyResult = await sendEmailViaGmailRestApi(prslOAuthConfig, {
      fromName: PRSL_CONTACT_FROM_NAME,
      fromEmail: PRSL_CONTACT_FROM_EMAIL,
      to: PRSL_CONTACT_TO_EMAIL,
      cc: PRSL_CONTACT_CC_EMAIL,
      replyTo: payload.email,
      subject: notificationSubject,
      text: notificationText,
      html: notificationHtml
    });

    if (!notifyResult?.id) {
      return Response.json(
        {
          ok: false,
          error: 'The email server did not accept the notification email. Please try again.'
        },
        { status: 502 }
      );
    }

    // 2. Send customer automatic confirmation email
    let confirmationEmailSent = false;
    try {
      const confirmResult = await sendEmailViaGmailRestApi(prslOAuthConfig, {
        fromName: PRSL_CONTACT_FROM_NAME,
        fromEmail: PRSL_CONTACT_FROM_EMAIL,
        to: payload.email,
        replyTo: PRSL_CONTACT_FROM_EMAIL,
        subject: customerConfirmationSubject,
        text: customerConfirmationText,
        html: customerConfirmationHtml
      });
      confirmationEmailSent = Boolean(confirmResult?.id);
    } catch (confirmErr) {
      console.error('Error sending PRSL customer confirmation email:', confirmErr);
    }

    return Response.json({
      ok: true,
      notificationEmailAccepted: true,
      confirmationEmailSent,
      submittedAt: payload.submittedAt
    });
  } catch (error) {
    console.error('Error processing /api/contact on Worker:', error);
    return Response.json(
      {
        ok: false,
        error:
          'We were unable to deliver your message at this time. Please check your connection and try again.'
      },
      { status: 502 }
    );
  }
}

async function handleQuoteRequestPost(request: Request, env: WorkerEnv): Promise<Response> {
  const uploadedR2Keys: string[] = [];
  try {
    const clientIp = getClientIp(request);
    if (!checkRateLimit(quoteRateMap, clientIp, QUOTE_RATE_LIMIT_MAX)) {
      return Response.json(
        {
          ok: false,
          error: 'Too many quote requests from this address. Please wait a few minutes and try again.'
        },
        { status: 429 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let fullName = '';
    let clubOrganization = '';
    let teamName = '';
    let email = '';
    let phone = '';
    let selectedProducts: string[] = [];
    let quantityNeeded = '';
    let projectDetails = '';
    let preferredContactMethod: 'Email' | 'Phone' | 'Text' = 'Email';
    let isPrslAffiliated = false;
    let submittedAt = new Date().toISOString();
    const rawFiles: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      fullName = sanitizeSingleLine(String(formData.get('fullName') || ''));
      clubOrganization = sanitizeSingleLine(String(formData.get('clubOrganization') || ''));
      teamName = sanitizeSingleLine(String(formData.get('teamName') || ''));
      email = sanitizeSingleLine(String(formData.get('email') || '')).toLowerCase();
      phone = sanitizeSingleLine(String(formData.get('phone') || ''));
      quantityNeeded = sanitizeSingleLine(String(formData.get('quantityNeeded') || ''));
      projectDetails = String(formData.get('projectDetails') || '').trim();
      const pref = String(formData.get('preferredContactMethod') || 'Email');
      if (pref === 'Email' || pref === 'Phone' || pref === 'Text') {
        preferredContactMethod = pref;
      }
      const aff = String(formData.get('isPrslAffiliated') || '');
      isPrslAffiliated = aff === 'true' || aff === '1' || aff === 'on';
      submittedAt = String(formData.get('submittedAt') || new Date().toISOString());

      const rawProducts = formData.get('selectedProducts');
      if (typeof rawProducts === 'string') {
        try {
          const parsed = JSON.parse(rawProducts);
          selectedProducts = Array.isArray(parsed) ? parsed.map(String) : [rawProducts];
        } catch {
          selectedProducts = rawProducts
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      const fileEntries = formData.getAll('logos');
      for (const entry of fileEntries) {
        if (entry instanceof File && entry.size > 0) {
          rawFiles.push(entry);
        }
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      fullName = sanitizeSingleLine(String(body.fullName || ''));
      clubOrganization = sanitizeSingleLine(String(body.clubOrganization || ''));
      teamName = sanitizeSingleLine(String(body.teamName || ''));
      email = sanitizeSingleLine(String(body.email || '')).toLowerCase();
      phone = sanitizeSingleLine(String(body.phone || ''));
      selectedProducts = Array.isArray(body.selectedProducts)
        ? body.selectedProducts.map(String)
        : [];
      quantityNeeded = sanitizeSingleLine(String(body.quantityNeeded || ''));
      projectDetails = String(body.projectDetails || '').trim();
      const pref = String(body.preferredContactMethod || 'Email');
      if (pref === 'Email' || pref === 'Phone' || pref === 'Text') {
        preferredContactMethod = pref;
      }
      isPrslAffiliated = Boolean(body.isPrslAffiliated);
      submittedAt = String(body.submittedAt || new Date().toISOString());
    }

    if (!fullName || !clubOrganization || !email || !phone || !isPrslAffiliated) {
      return Response.json(
        {
          ok: false,
          error: 'Missing required fields or PRSL affiliation confirmation.'
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { ok: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (rawFiles.length > QUOTE_MAX_FILES) {
      return Response.json(
        { ok: false, error: `Maximum ${QUOTE_MAX_FILES} artwork files allowed per submission.` },
        { status: 400 }
      );
    }

    let totalUploadBytes = 0;
    for (const file of rawFiles) {
      const check = validateUploadedFile(file);
      if (!check.valid) {
        return Response.json({ ok: false, error: check.reason }, { status: 400 });
      }
      totalUploadBytes += file.size;
    }

    if (totalUploadBytes > QUOTE_MAX_TOTAL_FILES_BYTES) {
      return Response.json(
        {
          ok: false,
          error: `Total artwork upload size (${formatBytes(totalUploadBytes)}) exceeds the 50 MB limit.`
        },
        { status: 413 }
      );
    }

    // Verify SoCal Custom Canopies Gmail OAuth2 configuration
    const socalUser = String(env.GMAIL_USER || PARTNER_NOTIFICATION_EMAIL).trim();
    const socalClientId = String(
      env.SOCAL_GMAIL_CLIENT_ID || env.GMAIL_OAUTH_CLIENT_ID || ''
    ).trim();
    const socalClientSecret = String(
      env.SOCAL_GMAIL_CLIENT_SECRET || env.GMAIL_OAUTH_CLIENT_SECRET || ''
    ).trim();
    const socalRefreshToken = String(
      env.SOCAL_GMAIL_REFRESH_TOKEN || env.GMAIL_REFRESH_TOKEN || ''
    ).trim();

    if (!socalClientId || !socalClientSecret || !socalRefreshToken) {
      return Response.json(
        {
          ok: false,
          error:
            'Quote request email service is temporarily unavailable (missing OAuth2 configuration). Please try again later.'
        },
        { status: 503 }
      );
    }

    // Require R2 bucket & signing secret when artwork files are uploaded
    if (rawFiles.length > 0 && (!env.QUOTE_UPLOADS_BUCKET || !env.R2_DOWNLOAD_SIGNING_SECRET)) {
      return Response.json(
        {
          ok: false,
          error:
            'Secure artwork storage (R2) is not configured on this environment. Please contact the administrator.'
        },
        { status: 503 }
      );
    }

    const requestUrl = new URL(request.url);
    const origin = (env.APP_URL || requestUrl.origin).replace(/\/+$/, '');
    const nowMs = Date.now();
    const expiresAtMs = nowMs + R2_RETENTION_MS;
    const expiresAtIso = new Date(expiresAtMs).toISOString();
    const dateFolder = new Date(nowMs).toISOString().slice(0, 10);

    const storedLogos: StoredArtworkFileMeta[] = [];
    const directAttachments: MimeAttachment[] = [];
    const includeDirectAttachments = totalUploadBytes <= DIRECT_EMAIL_ATTACHMENT_MAX_BYTES;

    for (const file of rawFiles) {
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const objectKey = `quotes/${dateFolder}/${nowMs}-${crypto.randomUUID()}/${safeFilename}`;
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      await env.QUOTE_UPLOADS_BUCKET!.put(objectKey, fileBytes, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          contentDisposition: `attachment; filename="${safeFilename}"`,
          cacheControl: 'private, no-store'
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date(nowMs).toISOString(),
          expiresAt: expiresAtIso,
          clubOrganization,
          customerEmail: email
        }
      });

      uploadedR2Keys.push(objectKey);

      const signedDownloadUrl = await createSignedR2DownloadUrl(
        origin,
        objectKey,
        expiresAtMs,
        env.R2_DOWNLOAD_SIGNING_SECRET!
      );

      storedLogos.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        r2Key: objectKey,
        signedDownloadUrl,
        expiresAtIso
      });

      if (includeDirectAttachments) {
        directAttachments.push({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          contentBytes: fileBytes
        });
      }
    }

    const payload: QuoteRequestPayload = {
      fullName,
      clubOrganization,
      teamName: teamName || undefined,
      email,
      phone,
      selectedProducts,
      quantityNeeded: quantityNeeded || undefined,
      projectDetails: projectDetails || undefined,
      preferredContactMethod,
      isPrslAffiliated,
      logos: storedLogos,
      submittedAt
    };

    const { vendorSubject, vendorHtml, confirmationSubject, confirmationHtml } =
      buildQuoteEmailTemplates(payload);

    const socalOAuthConfig: GmailOAuthAccountConfig = {
      expectedEmail: socalUser,
      clientId: socalClientId,
      clientSecret: socalClientSecret,
      refreshToken: socalRefreshToken
    };

    // 1. Send vendor notification email (must succeed before returning ok: true)
    const vendorSendResult = await sendEmailViaGmailRestApi(socalOAuthConfig, {
      fromName: SOCAL_VENDOR_FROM_NAME,
      fromEmail: socalUser,
      to: PARTNER_NOTIFICATION_EMAIL,
      replyTo: payload.email,
      subject: vendorSubject,
      html: vendorHtml,
      attachments: directAttachments
    });

    if (!vendorSendResult?.id) {
      throw new Error('Vendor notification email was not accepted by Gmail REST API.');
    }

    // 2. Send customer confirmation email
    let confirmationEmailSent = false;
    try {
      const confirmResult = await sendEmailViaGmailRestApi(socalOAuthConfig, {
        fromName: SOCAL_CONFIRMATION_FROM_NAME,
        fromEmail: socalUser,
        to: payload.email,
        replyTo: PARTNER_NOTIFICATION_EMAIL,
        subject: confirmationSubject,
        html: confirmationHtml
      });
      confirmationEmailSent = Boolean(confirmResult?.id);
    } catch (confirmErr) {
      console.error('Error sending SoCal customer confirmation email:', confirmErr);
    }

    return Response.json({
      ok: true,
      emailConfigured: true,
      vendorEmailSent: true,
      confirmationEmailSent,
      uploadedFilesCount: storedLogos.length,
      partnerRecipient: PARTNER_NOTIFICATION_EMAIL,
      customerRecipient: payload.email
    });
  } catch (error) {
    // Roll back any R2 uploads if the quote request email failed so no orphan files remain
    if (uploadedR2Keys.length > 0 && env.QUOTE_UPLOADS_BUCKET) {
      try {
        await env.QUOTE_UPLOADS_BUCKET.delete(uploadedR2Keys);
      } catch {
        // Ignore cleanup failure
      }
    }
    console.error('Error processing /api/quote-request on Worker:', error);
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process quote request on server.'
      },
      { status: 502 }
    );
  }
}

async function handlePrivateQuoteFileDownload(
  request: Request,
  env: WorkerEnv,
  url: URL
): Promise<Response> {
  if (!env.QUOTE_UPLOADS_BUCKET || !env.R2_DOWNLOAD_SIGNING_SECRET) {
    return Response.json({ ok: false, error: 'Storage service unavailable.' }, { status: 503 });
  }

  const encodedPath = url.pathname.replace(/^\/api\/quote-files\//, '');
  const objectKey = encodedPath
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .join('/');

  if (!objectKey || !objectKey.startsWith('quotes/') || objectKey.includes('..')) {
    return Response.json({ ok: false, error: 'Invalid file key.' }, { status: 400 });
  }

  const expParam = url.searchParams.get('exp') || '';
  const sigParam = url.searchParams.get('sig') || '';
  const expSeconds = Number(expParam);

  if (!expParam || !sigParam || !Number.isFinite(expSeconds)) {
    return Response.json(
      { ok: false, error: 'Missing authorization signature for private artwork file.' },
      { status: 401 }
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds > expSeconds) {
    return Response.json(
      { ok: false, error: 'This download link has expired (14-day retention limit).' },
      { status: 410 }
    );
  }

  const expectedSig = await computeHmacHex(
    env.R2_DOWNLOAD_SIGNING_SECRET,
    `${objectKey}:${expSeconds}`
  );

  if (!timingSafeEqualHex(sigParam.toLowerCase(), expectedSig.toLowerCase())) {
    return Response.json(
      { ok: false, error: 'Invalid authorization signature for private artwork file.' },
      { status: 403 }
    );
  }

  const r2Object = await env.QUOTE_UPLOADS_BUCKET.get(objectKey);
  if (!r2Object) {
    return Response.json({ ok: false, error: 'Artwork file not found or expired.' }, { status: 404 });
  }

  // Enforce 14-day automatic deletion on access as defense-in-depth
  const ageMs = Date.now() - r2Object.uploaded.getTime();
  if (ageMs > R2_RETENTION_MS) {
    await env.QUOTE_UPLOADS_BUCKET.delete(objectKey);
    return Response.json(
      { ok: false, error: 'Artwork file has passed the 14-day retention period and was deleted.' },
      { status: 410 }
    );
  }

  const headers = new Headers();
  headers.set(
    'Content-Type',
    r2Object.httpMetadata?.contentType || 'application/octet-stream'
  );
  if (r2Object.httpMetadata?.contentDisposition) {
    headers.set('Content-Disposition', r2Object.httpMetadata.contentDisposition);
  }
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Robots-Tag', 'noindex, nofollow');

  return new Response(r2Object.body, {
    status: 200,
    headers
  });
}

// --- Automatic 14-Day R2 Cleanup via Scheduled Worker Cron ---

async function purgeExpiredQuoteUploads(env: WorkerEnv): Promise<number> {
  if (!env.QUOTE_UPLOADS_BUCKET) return 0;
  let cursor: string | undefined;
  let deletedCount = 0;
  const nowMs = Date.now();

  do {
    const listed = await env.QUOTE_UPLOADS_BUCKET.list({
      prefix: 'quotes/',
      cursor,
      limit: 500
    });

    const keysToDelete: string[] = [];
    for (const obj of listed.objects) {
      const expiresAtStr = obj.customMetadata?.expiresAt;
      const isExpiredByMeta = expiresAtStr ? Date.parse(expiresAtStr) < nowMs : false;
      const isExpiredByAge = nowMs - obj.uploaded.getTime() > R2_RETENTION_MS;
      if (isExpiredByMeta || isExpiredByAge) {
        keysToDelete.push(obj.key);
      }
    }

    if (keysToDelete.length > 0) {
      await env.QUOTE_UPLOADS_BUCKET.delete(keysToDelete);
      deletedCount += keysToDelete.length;
    }

    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return deletedCount;
}

// --- Main Cloudflare Worker Export ---

export default {
  async fetch(request: Request, env: WorkerEnv, _ctx: ExecutionContextLike): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return handleHealth(env);
    }

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return Response.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
      }
      return handleContactPost(request, env);
    }

    if (url.pathname === '/api/quote-request') {
      if (request.method !== 'POST') {
        return Response.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
      }
      return handleQuoteRequestPost(request, env);
    }

    if (url.pathname.startsWith('/api/quote-files/')) {
      if (request.method !== 'GET') {
        return Response.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
      }
      return handlePrivateQuoteFileDownload(request, env, url);
    }

    // Serve static frontend assets and SPA routes via Cloudflare Workers Static Assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(
    _controller: ScheduledControllerLike,
    env: WorkerEnv,
    ctx: ExecutionContextLike
  ): Promise<void> {
    ctx.waitUntil(purgeExpiredQuoteUploads(env));
  }
};
