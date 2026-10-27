import { handleEmail } from "@/src/app/checkout/action";
import { VERIFICATION_CONFIG } from "./emailVerification";

// Verification emails are built and sent on the server only. The markup
// mirrors CredentialEmail (src/app/component/EmailTemplate.tsx) as a plain
// string, because route handlers can't import react-dom/server.

const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function credentialEmailHtml({
  message,
  code,
  link,
  warn,
}: {
  message: string;
  warn: string;
} & ({ code: string; link?: never } | { link: string; code?: never })) {
  const highlight = code
    ? `<p style="font-size:24px;font-weight:bold;color:#ffffff;margin:0;letter-spacing:4px;">${escapeHtml(code)}</p>`
    : `<a href="${escapeHtml(link!)}" style="font-size:20px;font-weight:bold;color:#ffffff;text-decoration:none;">Reset your password</a>`;

  return `<div style="width:100%;font-family:Arial,sans-serif;background-color:#f4f4f4;padding:20px;text-align:center;">
  <table cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0px 4px 10px rgba(0,0,0,0.1);">
    <tbody>
      <tr><td style="padding:20px;text-align:center;"><img src="${LOGO_URL}" width="100" alt="Logo" style="display:block;margin:auto;"></td></tr>
      <tr><td style="padding:20px;text-align:center;"><p style="font-size:20px;font-weight:bold;color:#333333;margin:0;">${escapeHtml(message)}</p></td></tr>
      <tr><td style="padding:20px;background-color:#495464;text-align:center;border-radius:5px;">${highlight}</td></tr>
      <tr><td style="padding:20px;font-size:16px;color:#333333;text-align:right;"><p style="margin:0;">${escapeHtml(warn)}</p></td></tr>
      <tr><td style="padding:0 20px 20px;font-size:14px;color:#666666;text-align:right;"><span>All rights reserved © SrokSre</span></td></tr>
    </tbody>
  </table>
</div>`;
}

const minutes = (ms: number) => Math.round(ms / 60000);

export function sendVerificationCodeEmail(
  to: string,
  code: string,
  purpose: "signup" | "change_email",
) {
  const html = credentialEmailHtml({
    code,
    message:
      purpose === "signup"
        ? "Use this code to verify your email"
        : "Use this code to confirm your new email",
    warn: `This code expires in ${minutes(VERIFICATION_CONFIG.CODE_TTL_MS)} minutes. If you didn't request it, you can ignore this email.`,
  });
  return handleEmail({ to, subject: "Email Verification", html });
}

export function sendPasswordResetEmail(to: string, token: string) {
  const html = credentialEmailHtml({
    link: `${process.env.NEXTAUTH_URL}/account/reset/${token}`,
    message: "Use this link to reset your password",
    warn: `This link expires in ${minutes(VERIFICATION_CONFIG.RESET_TTL_MS)} minutes. If you didn't request it, you can ignore this email.`,
  });
  return handleEmail({ to, subject: "Reset Password", html });
}
