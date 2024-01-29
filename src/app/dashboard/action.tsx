"use server";

import Prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { handleEmail, hashedpassword } from "@/src/lib/userlib";
import { compareSync } from "bcryptjs";
import { generateRandomNumber } from "@/src/lib/utilities";
import { revalidateTag } from "next/cache";

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
    const user = await getServerSession(authOptions);
    const uID: any = user?.user && "sub" in user.user && user.user.sub;

    if (type === "name") {
      const formedname = data.get("name");
      const namess = JSON.parse(formedname as string);
      let names = {
        firstname: namess.firstname,
        lastname: namess.lastname,
      };

      await Prisma.user.update({
        where: { id: uID as string },
        data: {
          firstname: names.firstname as string,
          lastname: names.lastname as string,
        },
      });
    } else if (type === "email") {
      const email = data.get("email");

      await Prisma.user.update({
        where: { id: uID },
        data: {
          email: email as string,
        },
      });
      await Prisma.usersession.deleteMany({
        where: {
          user_id: uID,
        },
      });
    } else {
      let password = data.get("password")?.toString() as string;
      let pass = JSON.parse(password);
      let user = await Prisma.user.findUnique({ where: { id: uID } });
      if (user) {
        const isValid = compareSync(pass.oldpassword as string, user?.password);
        if (isValid) {
          let newpassword = pass.newpassword as string;
          await Prisma.user.update({
            where: {
              id: uID as string,
            },
            data: {
              password: hashedpassword(newpassword),
            },
          });
          await Prisma.usersession.deleteMany({ where: { user_id: uID } });
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
  } finally {
    await Prisma.$disconnect();
  }
}

export async function Addaddress(
  data: FormData,
  isEdit: boolean,
  id?: number
): Promise<returntype> {
  try {
    const user = await getServerSession(authOptions);
    const uID: any = user?.user && "sub" in user.user && user.user.sub;
    const alldata = Array.from(data.entries());
    let address: any = {};
    let message: string = "";
    for (const [name, value] of alldata) {
      address[name] = value;
    }

    if (!isEdit) {
      const created = await Prisma.address.create({
        data: {
          userId: uID as string,
          ...address,
        },
      });
      id = created.id;
      message = "Address Added";
    } else {
      await Prisma.address.updateMany({
        where: {
          userId: uID as string,
          id: id,
        },
        data: {
          ...address,
        },
      });
      message = "Address Updated";
    }

    revalidateTag("userinfo");

    return { success: true, message: message, data: { id: id } };
  } catch (error) {
    console.log("Add Address", error);
    return { success: false, message: "Error Occured" };
  } finally {
    await Prisma.$disconnect();
  }
}

export const Deleteaddress = async (id: number): Promise<returntype> => {
  try {
    const user = await getServerSession(authOptions);
    const uID: any = user?.user && "sub" in user.user && user.user.sub;

    await Prisma.address.delete({
      where: {
        userId: uID,
        id: id,
      },
    });
    revalidateTag("userinfo");

    return { success: true, message: "Address Deleted" };
  } catch (error) {
    return { success: false, message: "Failed To Delete" };
  } finally {
    await Prisma.$disconnect();
  }
};

export const VerifyEmail = async (
  email: string,
  verified: boolean,
  code?: string
): Promise<returntype> => {
  try {
    const user = await getServerSession(authOptions);
    const uID: any = user?.user && "sub" in user.user && user.user.sub;
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
          id: uID,
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
  } finally {
    await Prisma.$disconnect();
  }
};
