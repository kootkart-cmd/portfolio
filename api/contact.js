const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { name, email, message } = body;

    if (!name || !email || !message) {
      res.status(400).json({ error: "name, email and message are required" });
      return;
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
      res.status(400).json({ error: "Invalid sender email" });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";
    const toEmail = "sk.skashyap1998@gmail.com";

    if (!resendApiKey) {
      res.status(500).json({ error: "Missing RESEND_API_KEY" });
      return;
    }

    const safeName = String(name).trim().slice(0, 120);
    const safeEmail = String(email).trim().slice(0, 200);
    const safeMessage = String(message).trim().slice(0, 5000);

    const htmlMessage = escapeHtml(safeMessage).replace(/\n/g, "<br />");

    const html = `
      <h2>New Portfolio Contact</h2>
      <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
      <p><strong>Message:</strong></p>
      <p>${htmlMessage}</p>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: safeEmail,
        subject: `Portfolio Contact: ${safeName}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const resendErrorText = await resendResponse.text();
      res.status(502).json({
        error: "Resend request failed",
        details: resendErrorText,
      });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: "Unexpected server error",
      details: error && error.message ? error.message : "Unknown error",
    });
  }
};
