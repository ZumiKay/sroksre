// Server-only mail helpers.
import nodemailer from "nodemailer";
import { OrderReciptEmail } from "@/src/lib/utilities";

const createMailTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_APPKEY,
    },
  });

/** Escape user-provided text before placing it in an HTML email. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const SendOrderEmail = async (
  html: string,
  to: string,
  subject: string,
  attachment?: Uint8Array,
) => {
  try {
    const transporter = createMailTransporter();
    const mailoptions = {
      from: `SrokSre <${process.env.EMAIL}>`,
      to: `<${to}>`,
      subject: subject,
      html: html,
    };

    await transporter.sendMail({
      ...mailoptions,
      attachments: attachment
        ? [
            {
              filename: `Invoice.pdf`,
              content: Buffer.from(attachment),
              contentType: "application/pdf",
            },
          ]
        : [],
    });
  } catch (error) {
    console.log("Send email", error);
    throw new Error("Email can't sent");
  }
};

export interface Emaildata {
  to: string;
  subject: string;
  from?: string;
  html?: string;
  message?: string;
  warn?: string;
  title?: string;
}

export const handleEmail = async (data: Emaildata) => {
  const transporter = createMailTransporter();

  const mailoptions = {
    from: data.from ? data.from : `SrokSre <${process.env.EMAIL}>`,
    to: `<${data.to}>`,
    subject: data.subject,
    html: OrderReciptEmail(data.html ?? ""),
  };
  try {
    await transporter.sendMail(mailoptions);
    return { success: true };
  } catch (error) {
    console.log("Send Email", error);
    return { success: false };
  }
};
