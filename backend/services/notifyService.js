const nodemailer = require('nodemailer');
const { admin }  = require('../config/firebase');

let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (_) {}

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendWhatsApp = async (to, message) => {
  if (!to || !twilioClient) return;
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message,
    });
  } catch (err) {
    console.error('[WhatsApp] Failed:', err.message);
  }
};

const sendEmail = async (to, subject, text) => {
  if (!to || !process.env.EMAIL_USER) return;
  try {
    await mailer.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch (err) {
    console.error('[Email] Failed:', err.message);
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
      data: Object.fromEntries(Object.entries(data).map(([k,v]) => [k, String(v)])),
    });
  } catch (err) {
    console.error('[FCM] Failed:', err.message);
  }
};

const APP_URL = () => process.env.FRONTEND_URL || 'https://community-hero.app';

const ticketCreated = async ({ publicId, phone, email }) => {
  const msg = `✅ Your civic report has been submitted!\nTicket ID: ${publicId}\nTrack: ${APP_URL()}/track/${publicId}\nWe'll notify you when an officer is assigned.`;
  await Promise.all([
    sendWhatsApp(phone, msg),
    sendEmail(email, `Ticket ${publicId} — Report Received`, msg),
  ]);
};

const officerAssigned = async ({ ticket, officer }) => {
  const msg = `Your issue ${ticket.publicId} has been assigned to ${officer.name} (${officer.departmentId}).\nSLA Deadline: ${new Date(ticket.slaDeadline).toDateString()}\nTrack: ${APP_URL()}/track/${ticket.publicId}`;
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, msg),
    sendEmail(ticket.citizenEmail, `Officer Assigned — ${ticket.publicId}`, msg),
    sendPush(ticket.citizenId, 'Officer assigned', `${officer.name} will handle your ${ticket.issueType} report.`, { ticketId: ticket.publicId }),
  ]);
};

const ticketResolved = async ({ ticket }) => {
  const msg = `✅ Your issue ${ticket.publicId} has been RESOLVED.\nPlease rate the resolution in the app within 7 days.\nTrack: ${APP_URL()}/track/${ticket.publicId}`;
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, msg),
    sendEmail(ticket.citizenEmail, `Resolved — ${ticket.publicId}`, msg),
    sendPush(ticket.citizenId, 'Issue resolved!', 'Please rate the resolution.', { ticketId: ticket.publicId }),
  ]);
};

const ghostDetected = async ({ originalTicket, newTicket }) => {
  const msg = `⚠️ Ghost issue detected: ${originalTicket.publicId} was marked resolved but the issue re-appeared. Ticket has been reopened.`;
  await sendPush(originalTicket.citizenId, 'Issue re-opened', msg, { ticketId: originalTicket.publicId });
};

const rtiReady = async ({ ticket, pdfUrl }) => {
  const msg = `📋 Your RTI application is ready for ticket ${ticket.publicId}.\nThe issue has been unresolved for 30+ days.\nDownload: ${pdfUrl}`;
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, msg),
    sendEmail(ticket.citizenEmail, `RTI Application Ready — ${ticket.publicId}`, msg),
  ]);
};

const escalated = async ({ ticket, note }) => {
  const days = Math.floor((Date.now() - new Date(ticket.createdAt)) / 86400000);
  const msg = `⬆️ Your ticket ${ticket.publicId} has been escalated (unresolved for ${days} days). A senior officer will review.`;
  await sendPush(ticket.citizenId, 'Issue escalated', msg, { ticketId: ticket.publicId });
};

const officerReminder = async ({ ticket }) => {
  if (!ticket.assignedOfficerId) return;
  await sendPush(ticket.assignedOfficerId, 'SLA Reminder', `Ticket ${ticket.publicId} is approaching its deadline.`, { ticketId: ticket.publicId });
};

const appealReady = async ({ ticket, appealText }) => {
  const msg = `📋 First appeal document ready for ${ticket.publicId} (unresolved 60+ days).`;
  await Promise.all([
    sendWhatsApp(ticket.citizenPhone, msg),
    sendEmail(ticket.citizenEmail, `First Appeal Ready — ${ticket.publicId}`, msg),
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
