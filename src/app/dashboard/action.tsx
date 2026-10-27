"use server";

import Prisma from "@/src/lib/prisma";
import { compareSync } from "bcryptjs";
import { revalidateTag } from "next/cache";
import { getUser } from "@/src/lib/session";
import { hashPassword } from "@/src/lib/userlib";
import { z } from "zod";
import { VerificationPurpose } from "@/prisma/generated/prisma/enums";
import {
  CHECK_FAILURE_MESSAGE,
  checkCode,
  deleteVerification,
  issueChangeEmailCode,
} from "@/src/lib/emailVerification";
import { sendVerificationCodeEmail } from "@/src/lib/verificationEmail";

interface returntype {
  success: boolean;
  message?: string;
  data?: any;
}

export async function Editprofileaction(
  data: FormData,
  type: "name" | "email" | "password" | "shipping" | "none",
): Promise<returntype> {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    if (type === "name") {
      const formedname = data.get("name");
      const namess = JSON.parse(formedname as string);
      const names = {
        firstname: namess.firstname,
        lastname: namess.lastname,
      };

      const isName = await Prisma.user.findFirst({
        where: {
          OR: [
            {
              firstname: names.firstname,
            },
            {
              lastname: names.lastname,
            },
          ],
        },
      });

      if (isName) {
        return { success: false, message: "Name is already in used" };
      }

      await Prisma.user.update({
        where: { id: user.userId },
        data: {
          firstname: names.firstname as string,
          lastname: names.lastname as string,
        },
      });
    } else if (type === "email") {
      // Email changes must go through VerifyEmail so the new address is
      // confirmed with a code first.
      return { success: false, message: "Please verify your new email" };
    } else {
      const password = data.get("password")?.toString() as string;
      const pass = JSON.parse(password);
      const User = await Prisma.user.findUnique({ where: { id: user.userId } });
      if (User) {
        const isValid = compareSync(pass.oldpassword as string, User?.password);
        if (isValid) {
          const newpassword = pass.newpassword as string;
          await Prisma.user.update({
            where: {
              id: user.userId,
            },
            data: {
              password: hashPassword(newpassword),
            },
          });
          await Prisma.usersession.deleteMany({
            where: { userId: user.userId },
          });
        } else {
          return { success: false, message: "Invalid Password" };
        }
      }
    }

    revalidateTag("userinfo", "max");

    return { success: true, message: "Update Successfully" };
  } catch (error) {
    console.log("Update Userdata", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function Addaddress(
  data: FormData,
  isEdit: boolean,
  id?: number,
): Promise<returntype> {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, message: "Unauthenticated" };
    }
    const alldata = Array.from(data.entries());

    const address: any = {};
    let message: string = "";

    for (const [name, value] of alldata) {
      address[name] = value;
    }

    if (!isEdit) {
      const created = await Prisma.address.create({
        data: {
          userId: user.userId,
          ...address,
        },
      });
      id = created.id;
      message = "Address Added";
    } else {
      await Prisma.address.updateMany({
        where: {
          userId: user.userId,
          id: id,
        },
        data: {
          ...address,
        },
      });
      message = "Address Updated";
    }

    return { success: true, message: message, data: { id: id } };
  } catch (error) {
    console.log("Add Address", error);
    return { success: false, message: "Error Occured" };
  }
}

export const Deleteaddress = async (id: number): Promise<returntype> => {
  try {
    await Prisma.address.delete({
      where: {
        id: id,
      },
    });

    return { success: true, message: "Address Deleted" };
  } catch (error) {
    return { success: false, message: "Failed To Delete" };
  }
};

/**
 * Change the logged-in user's email in two steps:
 * 1. verified=false: email a code to the new address.
 * 2. verified=true: check the code, then switch to the address the code was
 *    sent to and log out all sessions. `email` is ignored in this step.
 */
export const VerifyEmail = async (
  email: string,
  verified: boolean,
  code?: string,
): Promise<returntype> => {
  try {
    const user = await getUser();
    if (!user?.userId) {
      return { success: false, message: "Unauthorized" };
    }

    if (!verified) {
      if (!z.email().safeParse(email).success) {
        return { success: false, message: "Invalid email" };
      }
      const isEmail = await Prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (isEmail) {
        return { success: false, message: "Email Already Exist" };
      }

      const issued = await issueChangeEmailCode(user.userId, email);
      if (!issued.ok) {
        return {
          success: false,
          message: "Please wait a minute before requesting another code",
        };
      }

      const sent = await sendVerificationCodeEmail(
        email,
        issued.secret,
        "change_email",
      );
      if (!sent.success) {
        await deleteVerification(issued.id);
        return { success: false, message: "Failed to send email" };
      }
      return { success: true, message: "Please Check Email" };
    }

    const result = await checkCode({
      purpose: VerificationPurpose.CHANGE_EMAIL,
      userId: user.userId,
      code,
    });
    if (!result.ok) {
      return { success: false, message: CHECK_FAILURE_MESSAGE[result.reason] };
    }

    try {
      await Prisma.$transaction([
        Prisma.user.update({
          where: { id: user.userId },
          data: { email: result.email },
        }),
        Prisma.usersession.deleteMany({ where: { userId: user.userId } }),
        Prisma.emailVerification.deleteMany({ where: { id: result.id } }),
      ]);
    } catch (error) {
      // Someone registered this address after the code was sent.
      if ((error as { code?: string } | null)?.code === "P2002") {
        return { success: false, message: "Email Already Exist" };
      }
      throw error;
    }

    revalidateTag("userinfo", "max");
    return { success: true, message: "Email Updated" };
  } catch (error) {
    console.log("Verify Email", error);
    return { success: false, message: "Error Occured" };
  }
};

export const checkloggedsession = async (sessionid: string) => {
  try {
    const usersession = await Prisma.usersession.findUnique({
      where: {
        sessionid: sessionid,
      },
    });

    if (usersession) {
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.log("Error checking session:", error);
    return { success: false, error: "Error checking session" };
  }
};
