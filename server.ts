import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARTNER_NOTIFICATION_EMAIL = 'socalcustomcanopies@gmail.com';

interface QuoteLogoAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
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
  logos?: QuoteLogoAttachment[];
  submittedAt?: string;
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailTemplates(payload: QuoteRequestPayload) {
  const submittedAt = payload.submittedAt || new Date().toISOString();
  const submittedDateFormatted = new Date(submittedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const productsText =
    Array.isArray(payload.selectedProducts) && payload.selectedProducts.length > 0
      ? payload.selectedProducts.join(', ')
      : 'None specified';

  const logos = Array.isArray(payload.logos) ? payload.logos : [];
  const logosText =
    logos.length > 0
      ? logos.map((l) => `${l.name} (${(l.size / (1024 * 1024)).toFixed(2)} MB)`).join(', ')
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

  return {
    vendorSubject,
    vendorHtml,
    confirmationSubject,
    confirmationHtml
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '120mb' }));

  app.post('/api/quote-request', async (req, res) => {
    try {
      const payload = req.body as QuoteRequestPayload;

      if (!payload?.fullName || !payload?.clubOrganization || !payload?.email || !payload?.phone) {
        res.status(400).json({
          ok: false,
          error: 'Missing required fields (Full Name, Club / Organization, Email, or Phone).'
        });
        return;
      }

      const { vendorSubject, vendorHtml, confirmationSubject, confirmationHtml } =
        buildEmailTemplates(payload);

      const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER || PARTNER_NOTIFICATION_EMAIL;
      const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = Number(process.env.SMTP_PORT) || 465;
      const resendApiKey = process.env.RESEND_API_KEY;
      const webhookUrl = process.env.QUOTE_WEBHOOK_URL || process.env.VITE_PRSL_QUOTE_WEBHOOK_URL;

      let vendorEmailSent = false;
      let confirmationEmailSent = false;
      let webhookForwarded = false;

      // 1. Send via SMTP / Gmail App Password if configured
      if (smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        const attachments = (payload.logos || [])
          .filter((item) => item.dataUrl && item.dataUrl.includes(';base64,'))
          .map((item) => ({
            filename: item.name,
            content: Buffer.from(item.dataUrl!.split(';base64,')[1], 'base64'),
            contentType: item.type || 'application/octet-stream'
          }));

        // Send notification email to socalcustomcanopies@gmail.com
        await transporter.sendMail({
          from: `"PRSL Partner Portal" <${smtpUser}>`,
          to: PARTNER_NOTIFICATION_EMAIL,
          replyTo: payload.email,
          subject: vendorSubject,
          html: vendorHtml,
          attachments
        });
        vendorEmailSent = true;

        // Send confirmation email to the person entering the form
        await transporter.sendMail({
          from: `"SoCal Custom Canopies & Print" <${smtpUser}>`,
          to: payload.email,
          replyTo: PARTNER_NOTIFICATION_EMAIL,
          subject: confirmationSubject,
          html: confirmationHtml
        });
        confirmationEmailSent = true;
      } else if (resendApiKey) {
        // 2. Or send via Resend API if RESEND_API_KEY is configured
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        const vendorRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [PARTNER_NOTIFICATION_EMAIL],
            reply_to: payload.email,
            subject: vendorSubject,
            html: vendorHtml
          })
        });
        vendorEmailSent = vendorRes.ok;

        const confirmRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [payload.email],
            reply_to: PARTNER_NOTIFICATION_EMAIL,
            subject: confirmationSubject,
            html: confirmationHtml
          })
        });
        confirmationEmailSent = confirmRes.ok;
      }

      // 3. Optional Webhook forwarding
      if (webhookUrl) {
        const whRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            partnerRecipient: PARTNER_NOTIFICATION_EMAIL,
            submittedAt: payload.submittedAt || new Date().toISOString()
          })
        });
        webhookForwarded = whRes.ok;
      }

      const emailConfigured = Boolean(smtpPass || resendApiKey || webhookUrl);

      res.json({
        ok: true,
        emailConfigured,
        vendorEmailSent,
        confirmationEmailSent,
        webhookForwarded,
        partnerRecipient: PARTNER_NOTIFICATION_EMAIL,
        customerRecipient: payload.email
      });
    } catch (error) {
      console.error('Error processing /api/quote-request:', error);
      res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process quote request on server.'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
