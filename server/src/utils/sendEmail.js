const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  const { error } = await resend.emails.send({
    from: "We Deliver Mussoorie <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

module.exports = sendEmail;