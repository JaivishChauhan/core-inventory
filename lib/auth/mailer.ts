import nodemailer from "nodemailer"

/**
 * Creates a configured nodemailer transport.
 * For development: use an Ethereal account (https://ethereal.email).
 * For production: set SMTP_HOST to your real SMTP provider.
 * @security Never log auth credentials.
 */
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/**
 * Sends a one-time password email to the specified address.
 * @param email - Recipient email address
 * @param otp - The 6-digit raw OTP code (NOT the hash)
 * @throws Will throw if SMTP connection or delivery fails — caller must catch.
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"Core Inventory" <${process.env.SMTP_FROM ?? "no-reply@coreinventory.app"}>`,
    to: email,
    subject: "Your Sign-In Code — Core Inventory",
    text: `Your one-time code: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #E2E8F0;border-radius:12px">
        <h2 style="margin:0 0 16px;color:#0F172A">Core Inventory</h2>
        <p style="color:#64748B">Your one-time sign-in code:</p>
        <p style="font-size:36px;font-weight:800;letter-spacing:8px;color:#4F46E5;margin:8px 0">${otp}</p>
        <p style="color:#64748B;font-size:14px">Expires in 10 minutes. Do not share this code.</p>
      </div>
    `,
  })
}
