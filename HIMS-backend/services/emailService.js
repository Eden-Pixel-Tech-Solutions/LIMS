import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import db from '../config/db.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64ToBuffer(dataUrl) {
  // data:image/png;base64,XXXXXX  →  Buffer
  const base64 = dataUrl.split(',')[1];
  return Buffer.from(base64, 'base64');
}

function mimeType(dataUrl) {
  return dataUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
}

/**
 * Build a transporter — DB settings take priority, .env is the fallback.
 */
async function getTransporter() {
  let smtpHost, smtpPort, smtpUser, smtpPass, fromName, settings;

  try {
    const [rows] = await db.query(`SELECT * FROM hospital_settings LIMIT 1`);
    if (rows.length) {
      settings = rows[0];
      smtpHost = settings.smtp_host;
      smtpPort = settings.smtp_port;
      smtpUser = settings.smtp_user;
      smtpPass = settings.smtp_pass;
      fromName = settings.smtp_from_name;
    }
  } catch (_) { /* fall through */ }

  // Fallback to .env
  if (!smtpHost || !smtpUser || !smtpPass) {
    smtpHost = process.env.SMTP_HOST;
    smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    smtpUser = process.env.SMTP_USER;
    smtpPass = process.env.SMTP_PASS;
    fromName = process.env.SMTP_FROM_NAME || 'HIMS Procurement';
  }

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured. Set them in Settings → Email & SMTP, or add SMTP_HOST/SMTP_USER/SMTP_PASS to your .env file.');
  }

  return {
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    }),
    settings: settings || {
      hospital_name: fromName || 'HIMS',
      smtp_user: smtpUser,
      smtp_from_name: fromName,
      email: smtpUser,
      logo_url: null,
      address: null,
      phone: null,
    },
  };
}

import { generatePOPdf } from '../utils/inventoryPdfGenerator.js';


// ─── Main Email Sender ───────────────────────────────────────────────────────

export async function sendPOEmail(po, vendorEmail, ccEmail, pdfBuffer = null) {
  const { transporter, settings } = await getTransporter();

  const hospitalName = settings?.hospital_name || 'HIMS';
  const hasLogo = settings?.logo_url && settings.logo_url.startsWith('data:image');

  // ── Build item rows for HTML ──
  const itemsRows = (po.items || []).map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${item.item_code || ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;">${item.item_name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.quantity} ${item.unit || ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${parseFloat(item.unit_price || 0).toFixed(2)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">₹${parseFloat(item.subtotal || 0).toFixed(2)}</td>
    </tr>`
  ).join('');

  // Use CID reference for logo so it renders in email clients
  const logoHtml = hasLogo
    ? `<img src="cid:hospital_logo" alt="Logo" style="height:50px;object-fit:contain;" />`
    : `<span style="font-size:22px;font-weight:800;color:#fff;">${hospitalName}</span>`;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:24px 28px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${logoHtml}
        <div>
          <div style="color:#fff;font-size:18px;font-weight:800;">${hospitalName}</div>
          <div style="color:rgba(255,255,255,0.75);font-size:12px;">${settings?.address || ''}</div>
        </div>
      </div>
      <div style="text-align:right;color:#fff;">
        <div style="font-size:22px;font-weight:800;letter-spacing:1px;">PURCHASE ORDER</div>
        <div style="font-size:16px;font-weight:600;margin-top:4px;">${po.po_number}</div>
      </div>
    </div>

    <div style="padding:28px;">
      <p style="color:#475569;margin:0 0 18px;">Dear <strong>${po.vendor_name}</strong>,</p>
      <p style="color:#475569;margin:0 0 18px;">Please find below and attached the Purchase Order issued by <strong>${hospitalName}</strong>. Kindly confirm receipt and proceed as per the details below.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#f8fafc;border-radius:8px;">
        <tr>
          <td style="padding:10px 14px;color:#64748b;font-size:13px;">PO Number</td>
          <td style="padding:10px 14px;font-weight:700;color:#1e293b;">${po.po_number}</td>
          <td style="padding:10px 14px;color:#64748b;font-size:13px;">Issue Date</td>
          <td style="padding:10px 14px;font-weight:700;color:#1e293b;">${new Date(po.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#64748b;font-size:13px;">Expected Delivery</td>
          <td style="padding:10px 14px;font-weight:700;color:#1e293b;">${po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('en-IN') : 'ASAP'}</td>
          <td style="padding:10px 14px;color:#64748b;font-size:13px;">Authorized By</td>
          <td style="padding:10px 14px;font-weight:700;color:#1e293b;">${po.created_by_name || 'Admin'}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#1e40af;">
            <th style="padding:11px;text-align:left;color:#fff;font-size:12px;">Code</th>
            <th style="padding:11px;text-align:left;color:#fff;font-size:12px;">Description</th>
            <th style="padding:11px;text-align:right;color:#fff;font-size:12px;">Qty</th>
            <th style="padding:11px;text-align:right;color:#fff;font-size:12px;">Unit Price</th>
            <th style="padding:11px;text-align:right;color:#fff;font-size:12px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:28px;">
        <div style="background:#1e40af;color:#fff;padding:14px 22px;border-radius:8px;text-align:right;">
          <div style="font-size:12px;opacity:0.8;">TOTAL ORDER AMOUNT</div>
          <div style="font-size:22px;font-weight:800;margin-top:3px;">₹${parseFloat(po.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <p style="color:#64748b;font-size:13px;margin:0;">
        📎 The official Purchase Order PDF is attached to this email.<br/>
        For queries, contact us at <a href="mailto:${settings?.email || ''}" style="color:#3b82f6;">${settings?.email || ''}</a>
        ${settings?.phone ? `or call <strong>${settings.phone}</strong>` : ''}.
      </p>
    </div>

    <div style="background:#f1f5f9;padding:14px 28px;text-align:center;color:#94a3b8;font-size:12px;">
      This is a system-generated email from ${hospitalName}. Please do not reply directly.
    </div>
  </div>`;

  // ── Build attachments ──
  const attachments = [];

  // Use the frontend-generated PDF (high fidelity) if provided, otherwise fallback to backend generator
  if (pdfBuffer) {
    attachments.push({
      filename: `${po.po_number}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  } else {
    try {
      const pdfBuf = await generatePOPdf(po, settings);
      attachments.push({
        filename: `${po.po_number}.pdf`,
        content: pdfBuf,
        contentType: 'application/pdf',
      });
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr.message);
    }
  }

  // Embed logo as CID inline attachment
  if (hasLogo) {
    attachments.push({
      filename: 'logo.png',
      content: base64ToBuffer(settings.logo_url),
      contentType: mimeType(settings.logo_url),
      cid: 'hospital_logo',
    });
  }

  await transporter.sendMail({
    from: `"${settings?.smtp_from_name || hospitalName}" <${settings?.smtp_user || process.env.SMTP_USER}>`,
    to: vendorEmail,
    cc: ccEmail || undefined,
    subject: `Purchase Order ${po.po_number} — ${hospitalName}`,
    html,
    attachments,
  });

  console.log(`✅ PO email sent to ${vendorEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''}`);
}
