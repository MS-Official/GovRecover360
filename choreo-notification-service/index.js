const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8095;

app.use(cors());
app.use(express.json());

function sendSms(phone, message) {
  console.log(`SMS sent to ${phone}: ${message}`);
}

function sendEmail(email, subject, body) {
  console.log(`Email sent to ${email}: ${subject} - ${body}`);
}

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

// ── Core notification endpoint ──────────────────────
app.post("/api/notifications/send", (req, res) => {
  const { to, subject, message, type } = req.body;
  console.log(`Notification received: to=${to}, subject=${subject}, type=${type}`);

  if (type === "sms") {
    sendSms(to, message);
  } else if (type === "email") {
    sendEmail(to, subject, message);
  } else {
    sendSms(to, message);
    sendEmail(to, subject, message);
  }

  res.json({ success: true, message: "Notification sent" });
});

// ── Specific event endpoints ─────────────────────────
app.post("/api/notifications/application-approved", (req, res) => {
  const { applicationId, citizenName, citizenPhone, message } = req.body;
  console.log(`Application approved: ${applicationId} for ${citizenName}`);
  const smsText = `Dear ${citizenName}, your relief application (Ref: ${applicationId}) has been APPROVED. ${message}`;
  sendSms(citizenPhone, smsText);
  res.json({ success: true, message: "Approval notification sent" });
});

app.post("/api/notifications/dispatch-update", (req, res) => {
  const { dispatchId, status, notes } = req.body;
  console.log(`Dispatch update: ${dispatchId} is now ${status}`);
  console.log(`DISPATCH LOG: [${dispatchId}] status changed to ${status}. Notes: ${notes}`);
  res.json({ success: true, message: "Dispatch update logged" });
});

// ── Demo-friendly /notify/* aliases (used by demo.sh) ──
// These mirror the /api/notifications/* endpoints with a simpler path.
app.post("/notify/application-approved", (req, res) => {
  const { beneficiaryId, recipientName, recipientPhone, applicationStatus, message } = req.body;
  console.log(`[notify] Application approved for ${recipientName} (${beneficiaryId})`);
  sendSms(recipientPhone || "", message || applicationStatus || "approved");
  res.json({
    success: true,
    notificationType: "application-approved",
    beneficiaryId,
    recipientName,
    message: "Application approved notification sent",
    channel: "sms+email",
    mode: "demo",
  });
});

app.post("/notify/payment-approved", (req, res) => {
  const { beneficiaryId, recipientName, amount, currency, status } = req.body;
  console.log(`[notify] Payment approved for ${recipientName}: ${amount} ${currency}`);
  sendSms("", `Dear ${recipientName}, your payment of ${amount} ${currency} has been ${status}.`);
  res.json({
    success: true,
    notificationType: "payment-approved",
    beneficiaryId,
    recipientName,
    amount,
    currency,
    message: "Payment approved notification sent",
    channel: "sms+email",
    mode: "demo",
  });
});

app.post("/notify/dispatch-completed", (req, res) => {
  const { beneficiaryId, householdId, recipientName, items, dispatchStatus } = req.body;
  console.log(`[notify] Dispatch completed for ${recipientName}: ${JSON.stringify(items)}`);
  sendSms("", `Dear ${recipientName}, your relief package has been ${dispatchStatus}.`);
  res.json({
    success: true,
    notificationType: "dispatch-completed",
    beneficiaryId,
    householdId,
    recipientName,
    items,
    dispatchStatus,
    message: "Dispatch completed notification sent",
    channel: "sms+email",
    mode: "demo",
  });
});

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

module.exports = app;
