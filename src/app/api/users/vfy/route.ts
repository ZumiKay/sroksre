import { handleEmail } from "@/src/app/checkout/action";
import { RenderCredentailEmailToString } from "@/src/app/component/SevComponent";
import Prisma from "@/src/lib/prisma";
import {
  generateRandomNumber,
  generateRandomPassword,
} from "@/src/lib/utilities";

import { NextRequest } from "next/server";

interface Vfydatatype {
  email?: string;
  template?: string;
  type: "register" | "forgot";
}

export async function POST(request: NextRequest) {
  try {
    const data: Vfydatatype = await request.json();

    const otp = generateRandomNumber();

    const isUser =
      data.type === "register"
        ? await Prisma.user.findFirst({
            where: { email: data.email },
          })
        : false;

    if (!data.type) {
      return Response.json({}, { status: 400 });
    }

    //send email
    if (!isUser) {
      const emailTemplate = {
        type: data.type === "register" ? "code" : "link",
        infovalue:
          data.type === "register"
            ? `Verify Code: ${otp}`
            : `${process.env.NEXTAUTH_URL}/account/reset&cid=${otp}`,
        message:
          data.type === "register"
            ? "Please use this code for verify email"
            : "Please use this link for reset password",
        warn: "Your email will be use for this purpose only except if you subscribe to our newletter",
      };

      //initial user
      data.type === "register"
        ? await Prisma.user.create({
            data: {
              firstname: "",
              email: data.email as string,
              password: generateRandomPassword(),
              vfy: otp,
            },
          })
        : await Prisma.user.update({
            where: { email: data.email },
            data: {
              vfy: otp,
            },
          });

      return Response.json(
        { message: "Successfully Sent Code", data: emailTemplate },
        { status: 200 }
      );
    } else {
      return Response.json({ message: "Email already exist" }, { status: 500 });
    }
  } catch (error) {
    console.log("Verify User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    if (data.type === "email") {
      const allowdelete = await Prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });
      if (allowdelete?.vfy) {
        await Prisma.user.deleteMany({
          where: { email: { equals: data.email as string } },
        });
        return Response.json({ status: 200 });
      } else {
        return Response.json(
          { message: "what you try to do?" },
          { status: 404 }
        );
      }
    } else {
      const alluser = await Prisma.user.findMany({
        where: {
          vfy: { not: null },
        },
      });
      if (alluser) {
        await Prisma.usersession.deleteMany({
          where: {
            user_id: { in: alluser.map((i) => i.id) },
          },
        });
        await Prisma.user.updateMany({
          where: {
            id: { in: alluser.map((i) => i.id) },
          },
          data: {
            vfy: null,
          },
        });
        return Response.json({}, { status: 200 });
      }
      return Response.json({}, { status: 200 });
    }
  } catch (error) {
    console.log("Delete Error", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
