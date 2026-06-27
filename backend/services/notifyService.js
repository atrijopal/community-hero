const nodemailer = require('nodemailer');
const axios      = require('axios');
const { admin }  = require('../config/firebase');

// ─── Nodemailer (Gmail) ───────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const APP_URL = () => process.env.FRONTEND_URL || 'https://community-hero.app';

// Convert raw Indian mobile → Green API chatId format (91XXXXXXXXXX@c.us)
const toChatId = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10)                          return `91${digits}@c.us`;
  if (digits.length === 12 && digits.startsWith('91')) return `${digits}@c.us`;
  if (digits.length === 13 && digits.startsWith('091')) return `${digits.slice(1)}@c.us`;
  return `${digits}@c.us`;
};

// ─── Transport helpers ────────────────────────────────────────────────────────
const sendWhatsApp = async (rawPhone, message) => {
  const id    = process.env.GREEN_API_INSTANCE;
  const token = process.env.GREEN_API_TOKEN;
  if (!rawPhone || !id || !token) return;
  const chatId = toChatId(rawPhone);
  if (!chatId) return;
  try {
    const base = process.env.GREEN_API_URL || 'https://api.green-api.com';
    await axios.post(
      `${base}/waInstance${id}/sendMessage/${token}`,
      { chatId, message },
      { timeout: 10000 }
    );
    console.log(`[WhatsApp] ✓ Sent to ${chatId}`);
  } catch (err) {
    console.error(`[WhatsApp] ✗ ${chatId}: ${err.response?.data?.message || err.message}`);
  }
};

const sendEmail = async (to, subject, html, text) => {
  if (!to || !process.env.EMAIL_USER) return;
  try {
    await mailer.sendMail({
      from:    `"Community Hero" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text:    text || html.replace(/<[^>]+>/g, ''),
      html,
    });
    console.log(`[Email] ✓ Sent to ${to} — ${subject}`);
  } catch (err) {
    console.error(`[Email] ✗ ${to}: ${err.message}`);
  }
};

const sendPush = async (userId, title, body, data = {}) => {
  if (!userId) return;
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const token   = userDoc.data()?.fcmToken;
    if (!token) return;
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (err) {
    console.error(`[FCM] ✗ ${err.message}`);
  }
};

// ─── Email HTML builder ───────────────────────────────────────────────────────
const emailHtml = ({ title, lines, btnText, btnUrl, footerNote = '' }) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#F5F3F0;font-family:Inter,Arial,sans-serif;}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #E5E2DE;}
  .hdr{background:#C13B2A;padding:24px 28px;}
  .hdr-logo{color:#fff;font-size:13px;font-weight:800;letter-spacing:1px;}
  .hdr-title{color:#fff;font-size:20px;font-weight:700;margin:8px 0 0;}
  .body{padding:28px;}
  .line{font-size:14px;line-height:1.7;color:#4A4A48;margin:0 0 10px;}
  .id-pill{display:inline-block;background:#FDF1EF;color:#C13B2A;font-family:monospace;
            font-size:13px;font-weight:700;padding:4px 12px;border-radius:4px;
            border:1px solid #F5C9C3;letter-spacing:.05em;margin:8px 0 16px;}
  .btn{display:inline-block;background:#C13B2A;color:#fff;text-decoration:none;
       font-size:13px;font-weight:600;padding:11px 24px;border-radius:6px;margin:16px 0 0;}
  .divider{height:1px;background:#F0EDE9;margin:20px 0;}
  .footer{font-size:11px;color:#B8B5B0;padding:16px 28px;background:#FAFAF9;border-top:1px solid #E5E2DE;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-logo">COMMUNITY HERO</div>
    <div class="hdr-title">${title}</div>
  </div>
  <div class="body">
    ${lines.map(l => `<p class="line">${l}</p>`).join('')}
    ${btnText && btnUrl ? `<a class="btn" href="${btnUrl}">${btnText}</a>` : ''}
    <div class="divider"></div>
    <p class="line" style="font-size:12px;color:#7A7875;">
      You can always track your ticket at<br>
      <a href="${btnUrl || APP_URL()}" style="color:#C13B2A;">${btnUrl || APP_URL()}</a>
    </p>
  </div>
  <div class="footer">
    Community Hero · Kolkata Municipal Corporation<br>
    ${footerNote || 'You received this because you submitted a civic report.'}
  </div>
</div>
</body>
</html>`;

// ─── Notification events ──────────────────────────────────────────────────────

const ticketCreated = async ({ publicId, phone, email, name, issueType, severity, dangerLevel, location }) => {
  const trackUrl    = `${APP_URL()}/track/${publicId}`;
  const greeting    = name ? `Hi ${name.split(' ')[0]}! 👋` : 'Hello!';
  const issueLabel  = (issueType || '').replace(/_/g, ' ');
  const locLine     = location?.address || location?.ward
    ? (location.address ? location.address.substring(0, 60) : location.ward) + (location.city ? `, ${location.city}` : '')
    : 'Kolkata';
  const sevEmoji    = severity >= 9 ? '🔴' : severity >= 6 ? '🟠' : '🟢';
  const dangerLabel = dangerLevel === 'critical' ? 'Critical' : dangerLevel === 'safe' ? 'Safe' : 'Moderate';

  const wa = [
    `✅ *Community Hero — Report Received*`,
    ``,
    `${greeting} Your civic report has been submitted successfully.`,
    ``,
    `📋 *Ticket ID:* ${publicId}`,
    `🏷️ *Issue:* ${issueLabel || 'Civic Issue'}`,
    `📍 *Location:* ${locLine}`,
    `${sevEmoji} *Severity:* ${severity}/10 (${dangerLabel})`,
    ``,
    `An officer will be assigned shortly. You'll get another message when that happens.`,
    ``,
    `🔗 *Track your ticket:*`,
    `${trackUrl}`,
    ``,
    `_Community Hero · Kolkata Municipal Corporation_`,
  ].join('\n');

  const html = emailHtml({
    title: 'Report Submitted Successfully',
    lines: [
      `${name ? `Hi <strong>${name.split(' ')[0]}</strong>, t` : 'T'}hank you for reporting a civic issue. Your report has been received and is under review.`,
      `<span class="id-pill">${publicId}</span>`,
      `<strong>Issue:</strong> ${issueLabel || 'Civic Issue'}<br><strong>Location:</strong> ${locLine}<br><strong>Severity:</strong> ${severity}/10 — ${dangerLabel}`,
      'An officer will be assigned shortly. You\'ll receive another notification when that happens.',
    ],
    btnText: 'Track Your Ticket',
    btnUrl:  trackUrl,
  });

  await Promise.all([
    sendWhatsApp(phone, wa),
    sendEmail(email, `✅ Report Received — ${publicId}`, html),
  ]);
};

const officerAssigned = async ({ ticket, officer }) => {
  const trackUrl = `${APP_URL()}/track/${ticket.publicId}`;
  const sla = ticket.slaDeadline ? new Date(ticket.slaDeadline).toDateString() : 'TBD';
  const wa = `👷 *Community Hero*\nAn officer has been assigned to your issue.\n\n*Ticket:* ${ticket.publicId}\n*Officer:* ${officer.name}\n*Department:* ${(officer.departmentId || '').replace(/_/g, ' ')}\n*SLA Deadline:* ${sla}\n\nTrack: ${trackUrl}`;
  const html = emailHtml({
    title: 'Officer Assigned to Your Report',
    lines: [
      `Good news — an officer has been assigned to your ticket <strong>${ticket.publicId}</strong>.`,
      `<strong>Officer:</strong> ${officer.name}<br><strong>Department:</strong> ${(officer.departmentId || '').replace(/_/g, ' ')}`,
      `<strong>SLA Deadline:</strong> ${sla}<br>The officer is required to resolve your issue by this date.`,
    ],
    btnText: 'View Ticket Progress',
    btnUrl:  trackUrl,
  });
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, wa),
    sendEmail(ticket.citizenEmail, `👷 Officer Assigned — ${ticket.publicId}`, html),
    sendPush(ticket.citizenId, 'Officer assigned', `${officer.name} will handle your ${(ticket.issueType || '').replace(/_/g, ' ')} report.`, { ticketId: ticket.publicId }),
  ]);
};

const ticketResolved = async ({ ticket }) => {
  const trackUrl = `${APP_URL()}/track/${ticket.publicId}`;
  const wa = `✅ *Community Hero*\nYour issue has been RESOLVED!\n\n*Ticket:* ${ticket.publicId}\n*Issue:* ${(ticket.issueType || '').replace(/_/g, ' ')}\n\nPlease verify the fix and rate the resolution:\n${trackUrl}`;
  const html = emailHtml({
    title: 'Issue Resolved ✅',
    lines: [
      `Your issue <strong>${ticket.publicId}</strong> has been marked as resolved by the assigned officer.`,
      'Please visit the ticket page to verify the fix and submit a resolution rating within 7 days.',
      '<strong>Note:</strong> If the issue re-appears, the system will automatically detect it and re-open the ticket.',
    ],
    btnText: 'Verify & Rate Resolution',
    btnUrl:  trackUrl,
    footerNote: 'Community Hero ghost-detection actively monitors resolutions.',
  });
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, wa),
    sendEmail(ticket.citizenEmail, `✅ Issue Resolved — ${ticket.publicId}`, html),
    sendPush(ticket.citizenId, 'Issue resolved!', 'Please rate the resolution.', { ticketId: ticket.publicId }),
  ]);
};

const ghostDetected = async ({ originalTicket, newTicket }) => {
  const msg = `⚠️ Ghost issue detected on ${originalTicket.publicId} — marked resolved but re-appeared. Ticket reopened.`;
  await sendPush(originalTicket.citizenId, 'Issue re-opened', msg, { ticketId: originalTicket.publicId });
};

const rtiReady = async ({ ticket, pdfUrl }) => {
  const trackUrl = `${APP_URL()}/track/${ticket.publicId}`;
  const wa = `📋 *Community Hero — RTI Filed*\nYour RTI application is ready for ticket ${ticket.publicId}.\n\nThe issue has been unresolved for 30+ days.\nDownload RTI: ${pdfUrl}\nTrack: ${trackUrl}`;
  const html = emailHtml({
    title: 'RTI Application Filed',
    lines: [
      `Your ticket <strong>${ticket.publicId}</strong> has been unresolved for more than 30 days.`,
      'Community Hero has automatically filed a Right to Information (RTI) application on your behalf as required by law.',
      'The responsible department is now legally obligated to respond within 30 days.',
    ],
    btnText: 'Download RTI Document',
    btnUrl:  pdfUrl || trackUrl,
    footerNote: 'RTI filed under the Right to Information Act, 2005.',
  });
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, wa),
    sendEmail(ticket.citizenEmail, `📋 RTI Filed — ${ticket.publicId}`, html),
  ]);
};

const escalated = async ({ ticket, note }) => {
  const days = Math.floor((Date.now() - new Date(ticket.createdAt)) / 86400000);
  const msg  = `⬆️ Your ticket ${ticket.publicId} has been escalated (unresolved for ${days} days). A senior officer will review it.`;
  await sendPush(ticket.citizenId, 'Issue escalated', msg, { ticketId: ticket.publicId });
};

const officerReminder = async ({ ticket }) => {
  if (!ticket.assignedOfficerId) return;
  await sendPush(ticket.assignedOfficerId, 'SLA Reminder', `Ticket ${ticket.publicId} is approaching its deadline.`, { ticketId: ticket.publicId });
};

const appealReady = async ({ ticket, appealText }) => {
  const trackUrl = `${APP_URL()}/track/${ticket.publicId}`;
  const wa = `📋 *Community Hero — First Appeal Ready*\nFirst appeal document ready for ${ticket.publicId} (unresolved 60+ days).`;
  const html = emailHtml({
    title: 'First Appeal Document Ready',
    lines: [
      `Your ticket <strong>${ticket.publicId}</strong> has been unresolved for over 60 days.`,
      'A first appeal document has been prepared under Section 19 of the RTI Act.',
    ],
    btnText: 'View Ticket',
    btnUrl:  trackUrl,
  });
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, wa),
    sendEmail(ticket.citizenEmail, `📋 First Appeal Ready — ${ticket.publicId}`, html),
  ]);
};

const adminGhostEscalation = async ({ ticket, officer }) => {
  console.log(`[Admin Alert] Officer ${officer.name} has 3+ ghost closures. Ticket: ${ticket.publicId}`);
};

const escalatedAfterFailedResolution = async ({ ticket }) => {
  const msg = `Ticket ${ticket.publicId} escalated after 3 failed resolution attempts.`;
  await sendPush(ticket.citizenId, 'Issue escalated', msg, { ticketId: ticket.publicId });
};

module.exports = {
  ticketCreated, officerAssigned, ticketResolved,
  ghostDetected, rtiReady, escalated, officerReminder,
  appealReady, adminGhostEscalation, escalatedAfterFailedResolution,
};
