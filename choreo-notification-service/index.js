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

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

module.exports = app;
