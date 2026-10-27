"use server";

import { hashPassword } from "@/src/lib/userlib";
import { checkpassword } from "@/src/lib/utilities";
import { resetPasswordWithToken } from "@/src/lib/emailVerification";

interface returntype {
  message: string;
  success: boolean;
}

/**Reset password with the token from the emailed reset link
 * @param prevState (optional) ,
 * @param formData,
 * @returns success and message
 */
export const verifyUser = async (
  prevState: returntype,
  formData: FormData,
): Promise<returntype> => {
  try {
    const token = formData.get("token");
    const password = formData.get("password");
    const cfpassword = formData.get("confirmpassword");

    if (typeof password !== "string") {
      return { message: "Password Required", success: false };
    }

    const check = checkpassword(password);
    if (!check.isValid) {
      return { message: check.error, success: false };
    }
    if (password !== cfpassword) {
      return { message: "Confirm Password Not Match", success: false };
    }

    // Changes the password, uses up the token and logs out all sessions.
    const updated = await resetPasswordWithToken(token, hashPassword(password));
    if (!updated) {
      return {
        message: "This reset link is invalid or has expired",
        success: false,
      };
    }

    return { message: "Password Updated", success: true };
  } catch (error) {
    console.log("Change Password", error);
    return {
      message: "Failed To Update",
      success: false,
    };
  }
};
