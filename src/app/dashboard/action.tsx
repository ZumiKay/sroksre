"use server";

import Prisma from "@/src/lib/prisma";
import { hashedpassword } from "@/src/lib/userlib";
import { compareSync } from "bcryptjs";
import { generateRandomNumber } from "@/src/lib/utilities";
import { revalidateTag } from "next/cache";
import { getUser } from "@/src/context/OrderContext";
import { handleEmail } from "../checkout/action";

interface returntype {
  success: boolean;
  message?: string;
  data?: any;
}

export async function Editprofileaction(
  data: FormData,
  type: "name" | "email" | "password" | "shipping" | "none"
): Promise<returntype> {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    if (type === "name") {
      const formedname = data.get("name");
      const namess = JSON.parse(formedname as string);
      let names = {
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
        where: { id: user.id },
        data: {
          firstname: names.firstname as string,
          lastname: names.lastname as string,
        },
      });
    } else if (type === "email") {
      const email = data.get("email");

      await Prisma.user.update({
        where: { id: user.id },
        data: {
          email: email as string,
        },
      });
      await Prisma.usersession.deleteMany({
        where: {
          user_id: user.id,
        },
      });
    } else {
      let password = data.get("password")?.toString() as string;
      let pass = JSON.parse(password);
      let User = await Prisma.user.findUnique({ where: { id: user.id } });
      if (User) {
        const isValid = compareSync(pass.oldpassword as string, User?.password);
        if (isValid) {
          let newpassword = pass.newpassword as string;
          await Prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              password: hashedpassword(newpassword),
            },
          });
          await Prisma.usersession.deleteMany({ where: { user_id: user.id } });
        } else {
          return { success: false, message: "Invalid Password" };
        }
      }
    }

    revalidateTag("userinfo");

    return { success: true, message: "Update Successfully" };
  } catch (error) {
    console.log("Update Userdata", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function Addaddress(
  data: FormData,
  isEdit: boolean,
  id?: number
): Promise<returntype> {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, message: "Unauthenticated" };
    }
    const alldata = Array.from(data.entries());

    let address: any = {};
    let message: string = "";

    for (const [name, value] of alldata) {
      address[name] = value;
    }

    if (!isEdit) {
      const created = await Prisma.address.create({
        data: {
          userId: user.id,
          ...address,
        },
      });
      id = created.id;
      message = "Address Added";
    } else {
      await Prisma.address.updateMany({
        where: {
          userId: user.id,
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

export const VerifyEmail = async (
  email: string,
  verified: boolean,
  code?: string
): Promise<returntype> => {
  try {
    const user = await getUser();

    if (!verified) {
      const isEmail = await Prisma.user.findFirst({
        where: {
          email: email,
        },
      });
      if (isEmail) {
        return { success: false, message: "Email Already Exist" };
      }
      const otp = generateRandomNumber();

      await Prisma.user.update({
        where: {
          id: user?.id,
        },
        data: {
          vfy: otp,
        },
      });
      await handleEmail({
        subject: "Verify Email",
        to: email,
        message: `Verify Code: ${otp}`,
        title: "Email Verification",
        warn: "",
      });
      return { success: true, message: "Please Check Email" };
    } else {
      const verifyemail = await Prisma.user.updateMany({
        where: { vfy: code },
        data: {
          vfy: null,
        },
      });
      if (!verifyemail) {
        return { success: false, message: "Invalid Code" };
      } else {
        return { success: true, message: "Verified" };
      }
    }
  } catch (error) {
    console.log("Verify Email", error);
    return { success: false, message: "Error Occured" };
  }
};

export const checkloggedsession = async (sessionid: string) => {
  try {
    const usersession = await Prisma.usersession.findUnique({
      where: {
        session_id: sessionid,
      },
    });

    if (usersession) {
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.error("Error checking session:", error);
    return { success: false, error: "Error checking session" };
  }
};
