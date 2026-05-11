module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      res.status(400).json({ error: "name, email and message are required" });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";
    const toEmail = "shubham.kashyap@rumango.com";

    if (!resendApiKey) {
      res.status(500).json({ error: "Missing RESEND_API_KEY" });
      return;
    }

    const safeName = String(name).trim().slice(0, 120);
    const safeEmail = String(email).trim().slice(0, 200);
    const safeMessage = String(message).trim().slice(0, 5000);

    const html = `
      <h2>New Portfolio Contact</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage.replace(/\n/g, "<br />")}</p>
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
      res.status(502).json({ error: "Resend request failed", details: resendErrorText });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error" });
  }
};
