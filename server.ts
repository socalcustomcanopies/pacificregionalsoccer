import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARTNER_NOTIFICATION_EMAIL = 'socalcustomcanopies@gmail.com';
const PRSL_CONTACT_TO_EMAIL = 'pacificregionalsoccerleague@gmail.com';
const PRSL_CONTACT_CC_EMAIL = 'pacificregionalsl@gmail.com';
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB per file
const CONTACT_MAX_BODY_BYTES = 64 * 1024; // 64 KB limit for contact form requests
const CONTACT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CONTACT_RATE_LIMIT_MAX_REQUESTS = 10;
const contactRateLimitMap = new Map<string, { count: number; windowStart: number }>();

const uploadDir = path.join(os.tmpdir(), 'prsl-quote-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 10
  }
});

interface UploadedLogoMeta {
  name: string;
  size: number;
  type: string;
  filePath?: string;
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
  logos: UploadedLogoMeta[];
  submittedAt: string;
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildEmailTemplates(payload: QuoteRequestPayload) {
  const submittedDateFormatted = new Date(payload.submittedAt).toLocaleString('en-US', {
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
      ? logos.map((l) => `${l.name} (${formatBytes(l.size)})`).join(', ')
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

interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  submittedAt: string;
}

function sanitizeSingleLine(value: string): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function isValidEmailAddress(email: string): boolean {
  if (!email || email.length > 254 || /[\r\n]/.test(email)) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildContactEmailTemplates(payload: ContactFormPayload) {
  const submittedDateFormatted = new Date(payload.submittedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/Los_Angeles'
  });

  const safeName = sanitizeSingleLine(payload.name);
  const notificationSubject = `New PRSL Website Contact Form Submission – ${safeName}`;

  const phoneDisplay = payload.phone ? payload.phone : 'Not provided';
  const subjectDisplay = payload.subject ? payload.subject : 'Not provided';

  const notificationText = [
    'New PRSL Website Contact Form Submission',
    '----------------------------------------',
    `Customer Name: ${safeName}`,
    `Email Address: ${payload.email}`,
    `Phone Number: ${phoneDisplay}`,
    `Subject: ${subjectDisplay}`,
    `Date & Time: ${submittedDateFormatted} (${payload.submittedAt})`,
    '',
    'Message:',
    payload.message
  ].join('\n');

  const notificationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #C8102E; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #111111; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #C8102E; margin-bottom: 6px;">
          Pacific Regional Soccer League (PRSL)
        </div>
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">
          New PRSL Website Contact Form Submission
        </h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #111111;">
        <p style="margin-top: 0; color: #333333; font-size: 15px;">
          A new inquiry was submitted through the PRSL Home Page contact form on <strong>${escapeHtml(submittedDateFormatted)}</strong>.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 36%; background-color: #f9fafb;">Customer Name</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><strong>${escapeHtml(safeName)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Email Address</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(payload.email)}" style="color: #C8102E;">${escapeHtml(payload.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Phone Number</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(phoneDisplay)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Subject</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(subjectDisplay)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Date &amp; Time</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(submittedDateFormatted)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; background-color: #f9fafb; vertical-align: top;">Message</td>
            <td style="padding: 10px 12px; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(payload.message)}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; margin-bottom: 0; font-size: 13px; color: #555555;">
          You can reply directly to this email to respond to <strong>${escapeHtml(safeName)}</strong> (${escapeHtml(payload.email)}).
        </p>
      </div>
    </div>
  `;

  const customerConfirmationSubject = `We Received Your Inquiry – Pacific Regional Soccer League (PRSL)`;

  const customerConfirmationText = [
    `Hi ${safeName},`,
    '',
    'Thank you for contacting the Pacific Regional Soccer League (PRSL). We have received your inquiry and a member of our league administration team will get back to you as soon as possible.',
    '',
    'Summary of Your Submission:',
    `Name: ${safeName}`,
    `Email: ${payload.email}`,
    ...(payload.phone ? [`Phone: ${payload.phone}`] : []),
    ...(payload.subject ? [`Subject: ${payload.subject}`] : []),
    `Submitted: ${submittedDateFormatted}`,
    '',
    'Your Message:',
    payload.message,
    '',
    'Best regards,',
    'Pacific Regional Soccer League (PRSL)',
    PRSL_CONTACT_TO_EMAIL
  ].join('\n');

  const customerConfirmationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-top: 5px solid #C8102E; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #111111; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #C8102E; margin-bottom: 6px;">
          Pacific Regional Soccer League (PRSL)
        </div>
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">
          Thank You for Contacting PRSL
        </h2>
      </div>
      <div style="padding: 24px; background-color: #ffffff; color: #111111;">
        <p style="margin-top: 0; font-size: 15px; line-height: 1.6; color: #222222;">
          Hi <strong>${escapeHtml(safeName)}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #333333;">
          Thank you for reaching out to the <strong>Pacific Regional Soccer League (PRSL)</strong>. We have received your message and our administration team will review your inquiry and follow up with you shortly.
        </p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #C8102E; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #C8102E; margin-bottom: 8px;">
            Copy of Your Submission
          </div>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${escapeHtml(safeName)}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          ${payload.phone ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>` : ''}
          ${payload.subject ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p>` : ''}
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

function cleanupTempFiles(files: Express.Multer.File[]) {
  for (const file of files) {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, () => {});
    }
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  const PORT = Number(process.env.PORT) || 3000;

  const contactJsonParser = express.json({ limit: '64kb' });

  app.post(
    '/api/contact',
    (req: Request, res: Response, next: NextFunction) => {
      const contentLength = Number(req.headers['content-length'] || 0);
      if (contentLength > CONTACT_MAX_BODY_BYTES) {
        res.status(413).json({
          ok: false,
          error: 'Request payload exceeds the 64KB size limit.'
        });
        return;
      }
      contactJsonParser(req, res, (err: unknown) => {
        if (err && typeof err === 'object') {
          const status = (err as { status?: number; statusCode?: number }).status ||
            (err as { status?: number; statusCode?: number }).statusCode;
          if (status === 413 || (err as { type?: string }).type === 'entity.too.large') {
            res.status(413).json({
              ok: false,
              error: 'Request payload exceeds the 64KB size limit.'
            });
            return;
          }
          res.status(400).json({
            ok: false,
            error: 'Invalid JSON request payload.'
          });
          return;
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        const contentLength = Number(req.headers['content-length'] || 0);
        if (contentLength > CONTACT_MAX_BODY_BYTES) {
          res.status(413).json({
            ok: false,
            error: 'Request payload is too large.'
          });
          return;
        }

        const clientIp =
          (typeof req.headers['cf-connecting-ip'] === 'string'
            ? req.headers['cf-connecting-ip'].trim()
            : typeof req.headers['x-forwarded-for'] === 'string'
              ? req.headers['x-forwarded-for'].split(',')[0].trim()
              : req.ip) || 'unknown';
        const now = Date.now();
        const rateEntry = contactRateLimitMap.get(clientIp);
        if (!rateEntry || now - rateEntry.windowStart > CONTACT_RATE_LIMIT_WINDOW_MS) {
          contactRateLimitMap.set(clientIp, { count: 1, windowStart: now });
        } else {
          if (rateEntry.count >= CONTACT_RATE_LIMIT_MAX_REQUESTS) {
            res.status(429).json({
              ok: false,
              error: 'Too many contact submissions from this address. Please wait a few minutes and try again.'
            });
            return;
          }
          rateEntry.count += 1;
        }

        const body = req.body && typeof req.body === 'object' ? req.body : {};

        // Basic spam protection: honeypot check
        const honeypot = String(body.website || body._gotcha || body.honeypot || '').trim();
        if (honeypot.length > 0) {
          res.status(400).json({
            ok: false,
            error: 'Spam submission detected.'
          });
          return;
        }

        const name = sanitizeSingleLine(body.name || '');
        const email = sanitizeSingleLine(body.email || '');
        const phone = sanitizeSingleLine(body.phone || '');
        const subject = sanitizeSingleLine(body.subject || '');
        const message = String(body.message || '').trim();
        const submittedAt = new Date().toISOString();

        if (!name || !email || !message) {
          res.status(400).json({
            ok: false,
            error: 'Please fill in all required fields (Name, Email, and Message).'
          });
          return;
        }

        if (name.length > 120) {
          res.status(400).json({
            ok: false,
            error: 'Name must be 120 characters or fewer.'
          });
          return;
        }

        if (!isValidEmailAddress(email)) {
          res.status(400).json({
            ok: false,
            error: 'Please provide a valid email address.'
          });
          return;
        }

        if (phone.length > 50) {
          res.status(400).json({
            ok: false,
            error: 'Phone number must be 50 characters or fewer.'
          });
          return;
        }

        if (subject.length > 200) {
          res.status(400).json({
            ok: false,
            error: 'Subject must be 200 characters or fewer.'
          });
          return;
        }

        if (message.length > 5000) {
          res.status(400).json({
            ok: false,
            error: 'Message must be 5,000 characters or fewer.'
          });
          return;
        }

        const prslSmtpUser = String(process.env.PRSL_GMAIL_USER || '').trim();
        const prslSmtpPass = String(process.env.PRSL_GMAIL_APP_PASSWORD || '').trim();
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = Number(process.env.SMTP_PORT) || 465;

        if (!prslSmtpUser || !prslSmtpPass) {
          res.status(503).json({
            ok: false,
            error:
              'PRSL email service is not yet configured. Please set PRSL_GMAIL_USER and PRSL_GMAIL_APP_PASSWORD in the environment secrets.'
          });
          return;
        }

        if (prslSmtpUser.toLowerCase() !== PRSL_CONTACT_TO_EMAIL.toLowerCase()) {
          res.status(503).json({
            ok: false,
            error: `PRSL_GMAIL_USER must be authenticated as ${PRSL_CONTACT_TO_EMAIL}.`
          });
          return;
        }

        const payload: ContactFormPayload = {
          name,
          email,
          ...(phone ? { phone } : {}),
          ...(subject ? { subject } : {}),
          message,
          submittedAt
        };

        const {
          notificationSubject,
          notificationText,
          notificationHtml,
          customerConfirmationSubject,
          customerConfirmationText,
          customerConfirmationHtml
        } = buildContactEmailTemplates(payload);

        const prslTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: prslSmtpUser,
            pass: prslSmtpPass
          }
        });

        const prslFromHeader = `Pacific Regional Soccer League <${PRSL_CONTACT_TO_EMAIL}>`;

        const notificationInfo = await prslTransporter.sendMail({
          from: prslFromHeader,
          to: PRSL_CONTACT_TO_EMAIL,
          cc: PRSL_CONTACT_CC_EMAIL,
          replyTo: payload.email,
          subject: notificationSubject,
          text: notificationText,
          html: notificationHtml
        });

        const acceptedList = Array.isArray(notificationInfo.accepted)
          ? notificationInfo.accepted.map((entry) => String(entry).toLowerCase())
          : [];
        const notificationEmailAccepted = acceptedList.length > 0;

        if (!notificationEmailAccepted) {
          res.status(502).json({
            ok: false,
            error: 'The email server did not accept the notification message. Please try again.'
          });
          return;
        }

        let confirmationEmailSent = false;
        try {
          const confirmationInfo = await prslTransporter.sendMail({
            from: prslFromHeader,
            to: payload.email,
            replyTo: PRSL_CONTACT_TO_EMAIL,
            subject: customerConfirmationSubject,
            text: customerConfirmationText,
            html: customerConfirmationHtml
          });
          confirmationEmailSent =
            Array.isArray(confirmationInfo.accepted) && confirmationInfo.accepted.length > 0;
        } catch (confirmErr) {
          console.error(
            'Error sending customer confirmation email on /api/contact:',
            confirmErr instanceof Error ? confirmErr.message : 'Unknown SMTP error'
          );
        }

        res.json({
          ok: true,
          notificationEmailAccepted: true,
          confirmationEmailSent,
          submittedAt
        });
      } catch (err) {
        console.error(
          'Error processing /api/contact:',
          err instanceof Error ? err.message : 'Unknown error'
        );
        res.status(500).json({
          ok: false,
          error: 'Unable to send your message right now. Please try again shortly.'
        });
      }
    }
  );

  app.use(express.json({ limit: '120mb' }));
  app.use(express.urlencoded({ extended: true, limit: '120mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const prslUser = String(process.env.PRSL_GMAIL_USER || '').trim().toLowerCase();
    res.json({
      ok: true,
      prslContactSmtpConfigured:
        Boolean(process.env.PRSL_GMAIL_USER && process.env.PRSL_GMAIL_APP_PASSWORD) &&
        prslUser === PRSL_CONTACT_TO_EMAIL.toLowerCase(),
      socalQuoteSmtpConfigured: Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS),
      smtpConfigured: Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS),
      resendConfigured: Boolean(process.env.RESEND_API_KEY)
    });
  });

  app.post(
    '/api/quote-request',
    (req: Request, res: Response, next: NextFunction) => {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        upload.array('logos', 10)(req, res, (err: unknown) => {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              res.status(400).json({
                ok: false,
                error: 'One or more uploaded logo files exceed the 100MB per-file size limit.'
              });
              return;
            }
            res.status(400).json({
              ok: false,
              error: `Logo upload error: ${err.message}`
            });
            return;
          } else if (err) {
            res.status(500).json({
              ok: false,
              error: err instanceof Error ? err.message : 'Error uploading logo files.'
            });
            return;
          }
          next();
        });
      } else {
        next();
      }
    },
    async (req: Request, res: Response) => {
      const multerFiles = (req.files as Express.Multer.File[] | undefined) || [];

      try {
        const body = req.body || {};

        let selectedProducts: string[] = [];
        if (Array.isArray(body.selectedProducts)) {
          selectedProducts = body.selectedProducts;
        } else if (typeof body.selectedProducts === 'string') {
          try {
            const parsed = JSON.parse(body.selectedProducts);
            selectedProducts = Array.isArray(parsed) ? parsed : [body.selectedProducts];
          } catch {
            selectedProducts = body.selectedProducts ? [body.selectedProducts] : [];
          }
        }

        const logos: UploadedLogoMeta[] =
          multerFiles.length > 0
            ? multerFiles.map((f) => ({
                name: f.originalname,
                size: f.size,
                type: f.mimetype || 'application/octet-stream',
                filePath: f.path
              }))
            : Array.isArray(body.logos)
              ? body.logos
              : [];

        const payload: QuoteRequestPayload = {
          fullName: String(body.fullName || '').trim(),
          clubOrganization: String(body.clubOrganization || '').trim(),
          teamName: String(body.teamName || '').trim(),
          email: String(body.email || '').trim(),
          phone: String(body.phone || '').trim(),
          selectedProducts,
          quantityNeeded: String(body.quantityNeeded || '').trim(),
          projectDetails: String(body.projectDetails || '').trim(),
          preferredContactMethod:
            body.preferredContactMethod === 'Phone' || body.preferredContactMethod === 'Text'
              ? body.preferredContactMethod
              : 'Email',
          isPrslAffiliated:
            body.isPrslAffiliated === true || body.isPrslAffiliated === 'true',
          logos,
          submittedAt: body.submittedAt || new Date().toISOString()
        };

        if (
          !payload.fullName ||
          !payload.clubOrganization ||
          !payload.email ||
          !payload.phone
        ) {
          cleanupTempFiles(multerFiles);
          res.status(400).json({
            ok: false,
            error: 'Missing required fields (Full Name, Club / Organization, Email, or Phone).'
          });
          return;
        }

        const { vendorSubject, vendorHtml, confirmationSubject, confirmationHtml } =
          buildEmailTemplates(payload);

        const smtpUser =
          process.env.GMAIL_USER || process.env.SMTP_USER || PARTNER_NOTIFICATION_EMAIL;
        const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = Number(process.env.SMTP_PORT) || 465;

        let vendorEmailSent = false;
        let confirmationEmailSent = false;

        // 1. Send via SMTP / Gmail if configured
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

          // Gmail SMTP allows up to ~25MB total message size; attach files within limit
          let runningBytes = 0;
          const maxEmailAttachmentBytes = 20 * 1024 * 1024;
          const attachments: {
            filename: string;
            path?: string;
            content?: Buffer;
            contentType?: string;
          }[] = [];

          for (const item of logos) {
            if (runningBytes + item.size > maxEmailAttachmentBytes) {
              continue;
            }
            if (item.filePath && fs.existsSync(item.filePath)) {
              attachments.push({
                filename: item.name,
                path: item.filePath,
                contentType: item.type
              });
              runningBytes += item.size;
            } else if (item.dataUrl && item.dataUrl.includes(';base64,')) {
              attachments.push({
                filename: item.name,
                content: Buffer.from(item.dataUrl.split(';base64,')[1], 'base64'),
                contentType: item.type
              });
              runningBytes += item.size;
            }
          }

          try {
            await transporter.sendMail({
              from: `"PRSL Partner Portal" <${smtpUser}>`,
              to: PARTNER_NOTIFICATION_EMAIL,
              replyTo: payload.email,
              subject: vendorSubject,
              html: vendorHtml,
              attachments
            });
            vendorEmailSent = true;
          } catch (err) {
            console.error('Error sending vendor notification email via SMTP:', err);
          }

          try {
            await transporter.sendMail({
              from: `"SoCal Custom Canopies & Print" <${smtpUser}>`,
              to: payload.email,
              replyTo: PARTNER_NOTIFICATION_EMAIL,
              subject: confirmationSubject,
              html: confirmationHtml
            });
            confirmationEmailSent = true;
          } catch (err) {
            console.error('Error sending customer confirmation email via SMTP:', err);
          }
        }

        if (!vendorEmailSent) {
          // 2. Zero-API-key fallback via FormSubmit AJAX endpoint
          try {
            const originUrl =
              process.env.APP_URL ||
              (req.headers.origin as string) ||
              'https://pacificregionalsoccer.com';
            const formSubmitRes = await fetch(
              `https://formsubmit.co/ajax/${PARTNER_NOTIFICATION_EMAIL}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  Origin: originUrl,
                  Referer: originUrl
                },
                body: JSON.stringify({
                  _subject: vendorSubject,
                  _replyto: payload.email,
                  _template: 'table',
                  _autoresponse: `Thank you for submitting your Pacific Regional Soccer League (PRSL) Member Pricing request with SoCal Custom Canopies & Print for ${payload.clubOrganization}. A representative will review your club details and follow up with you via ${payload.preferredContactMethod}.`,
                  fullName: payload.fullName,
                  clubOrganization: payload.clubOrganization,
                  teamName: payload.teamName || 'N/A',
                  email: payload.email,
                  phone: payload.phone,
                  preferredContactMethod: payload.preferredContactMethod,
                  selectedProducts:
                    payload.selectedProducts.length > 0
                      ? payload.selectedProducts.join(', ')
                      : 'None specified',
                  quantityNeeded: payload.quantityNeeded || 'Not specified',
                  projectDetails: payload.projectDetails || 'None provided',
                  uploadedLogos:
                    logos.length > 0
                      ? logos.map((l) => `${l.name} (${formatBytes(l.size)})`).join(', ')
                      : 'No logo files attached',
                  prslAffiliation: 'Confirmed PRSL Member Club / Team'
                })
              }
            );
            vendorEmailSent = formSubmitRes.ok;
            confirmationEmailSent = formSubmitRes.ok;
          } catch {
            // Non-fatal fallback
          }
        }

        cleanupTempFiles(multerFiles);

        res.json({
          ok: true,
          emailConfigured: true,
          vendorEmailSent,
          confirmationEmailSent,
          uploadedFilesCount: logos.length,
          partnerRecipient: PARTNER_NOTIFICATION_EMAIL,
          customerRecipient: payload.email
        });
      } catch (error) {
        cleanupTempFiles(multerFiles);
        console.error('Error processing /api/quote-request:', error);
        res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to process quote request on server.'
        });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: NextFunction | ((req: Request, res: Response, next: NextFunction) => void) | null = null;
    const viteReadyPromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: { middlewareMode: true },
          appType: 'spa'
        })
      )
      .then((vite) => {
        viteMiddleware = vite.middlewares;
      });

    app.use(async (req: Request, res: Response, next: NextFunction) => {
      if (!viteMiddleware) {
        await viteReadyPromise;
      }
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      next();
    });
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
