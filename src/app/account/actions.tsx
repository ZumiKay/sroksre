"use server";

import { handleEmail } from "../checkout/action";

export interface userdata {
  id?: number;
  email?: string;
  password?: string;
  confirmpassword?: string;
  firstname?: string;
  lastname?: string;
  sessionid?: string;
  role?: "ADMIN" | "USER" | "EDITOR";
  agreement?: boolean;
  cid?: string;
}

export const SendVfyEmail = async (
  html: string,
  to: string,
  subject: string
) => {
  try {
    const sent = await handleEmail({
      subject,
      to,
      html,
    });

    if (!sent.success) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.log("Send email", error);
    return { success: false };
  }
};
