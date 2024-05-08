"use server";

import { handleEmail } from "../checkout/action";

export interface contacttype {
  orderid?: string;
  fullname: string;
  email: string;
  subject: string;
  message: string;
  [key: string]: string | undefined;
}

export const SendInquiry = async (data: contacttype) => {
  const sendemail = await handleEmail({
    from: `${data.fullname}`,
    to: process.env.EMAIL as string,
    subject: `${data.subject} ${
      data.orderid ? `with order id #${data.orderid}` : ""
    }`,
    html: `<h3> From ${data.fullname} with email ${data.email} </h3> <h3>  ${data.message} </h3>`,
  });
  if (sendemail.success) {
    return { success: true, message: "Inquiry has sent" };
  } else {
    return { success: false, message: "Failed to sent" };
  }
};
