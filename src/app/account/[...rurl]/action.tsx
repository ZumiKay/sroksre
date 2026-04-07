"use server";

import Prisma from "@/src/lib/prisma";
import { hashPassword } from "@/src/lib/userlib";
import { checkpassword } from "@/src/lib/utilities";

interface returntype {
  message: string;
  success: boolean;
}

/**Use for verify user of reset password form
 * @param prevState (optional) ,
 * @param formData,
 * @returns success and message
 */
export const verifyUser = async (
  prevState: returntype,
  formData: FormData,
): Promise<returntype> => {
  try {
    const dt = {
      password: formData.get("password"),
      cfpassword: formData.get("confirmpassword"),
      cid: formData.get("cid"),
    };

    if (dt.cid) {
      const check = checkpassword(dt.password as string);
      if (!check.isValid) {
        return {
          message: check.error,
          success: false,
        };
      }
      if (dt.password !== dt.cfpassword) {
        return { message: "Confirm Password Not Match", success: false };
      }

      const password = hashPassword(dt.password as string);
      const user = await Prisma.user.findFirst({
        where: { vfy: dt.cid as string },
        select: { id: true },
      });

      await Prisma.user.updateMany({
        where: {
          vfy: dt.cid as string,
        },
        data: {
          password: password,
          vfy: null,
        },
      });

      //Delete Session
      await Prisma.usersession.deleteMany({ where: { userId: user?.id } });

      return {
        message: "Password Updated",
        success: true,
      };
    }
    return {
      message: "Not Found",
      success: false,
    };
  } catch (error) {
    console.log("Change Password", error);
    return {
      message: "Failed To Update",
      success: false,
    };
  }
};
