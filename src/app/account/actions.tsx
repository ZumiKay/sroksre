"use server";

import { Role } from "@prisma/client";
import { handleEmail, OrderReciptEmail } from "../checkout/action";

export interface userdata {
  id?: string;
  email?: string;
  password?: string;
  confirmpassword?: string;
  firstname?: string;
  lastname?: string;
  sessionid?: string;
  role?: Role;
  agreement?: boolean;
  cid?: string;
}

export const SendVfyEmail = async (
  html: string,
  to: string,
  subject: string
) => {
  try {
    await handleEmail({
      subject,
      to,
      html: OrderReciptEmail(html),
    });

    return { success: true };
  } catch (error) {
    console.log("Send email", error);
    return { success: false };
  }
};
