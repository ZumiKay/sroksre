"use server";

import { escapeHtml, handleEmail } from "@/src/lib/email";

export interface contacttype {
  orderid?: string;
  fullname: string;
  email: string;
  subject: string;
  message: string;
  [key: string]: string | undefined;
}

export const SendInquiry = async (data: contacttype) => {
  // Public action: everything below is user input, so strip header-breaking
  // characters and escape it before it goes into the admin email.
  const oneLine = (v?: string) => (v ?? "").replace(/[\r\n<>"]/g, " ").trim();
  const sendemail = await handleEmail({
    from: oneLine(data.fullname),
    to: process.env.EMAIL as string,
    subject: `${oneLine(data.subject)} ${
      data.orderid ? `with order id #${oneLine(data.orderid)}` : ""
    }`,
    html: `<h3> From ${escapeHtml(data.fullname)} with email ${escapeHtml(data.email)} </h3> <h3>  ${escapeHtml(data.message)} </h3>`,
  });
  if (sendemail.success) {
    return { success: true, message: "Inquiry has sent" };
  } else {
    return { success: false, message: "Failed to sent" };
  }
};
