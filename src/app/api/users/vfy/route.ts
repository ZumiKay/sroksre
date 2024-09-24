import Prisma from "@/src/lib/prisma";
import {
  generateRandomNumber,
  generateRandomPassword,
} from "@/src/lib/utilities";
import { z } from "zod";

import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";

interface Vfydatatype {
  email?: string;
  template?: string;
  type: "register" | "forgot";
}

const verifyEmail = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const data: Vfydatatype = await request.json();

    if (!data.email) {
      return Response.json({}, { status: 400 });
    }

    verifyEmail.parse({ email: data.email });

    let isUniqueOtp = false;
    let otp = generateRandomNumber();

    while (!isUniqueOtp) {
      const isNotUniqiueOtp = await Prisma.user.findFirst({
        where: { vfy: otp },
      });

      if (isNotUniqiueOtp) {
        otp = generateRandomNumber();
      } else {
        isUniqueOtp = true;
      }
    }

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
        warn: "Your emaikl will be use for this purpose only except if you subscribe to our newletter",
      };

      //initial user
      data.type === "register"
        ? await Prisma.user.create({
            data: {
              firstname: "",
              email: "",
              password: generateRandomPassword(),
              vfy: otp,
            },
          })
        : await Prisma.user.updateMany({
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
  } catch (error: any) {
    if (error?.issues) {
      return Response.json(
        { message: error.issues[0].message },
        { status: 500 }
      );
    }
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
          vfy: data.cid,
        },
      });
      if (allowdelete?.vfy) {
        await Prisma.user.deleteMany({
          where: { vfy: { equals: data.cid as string } },
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

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.toString();
    const params = extractQueryParams(url);
    if (params.cid) {
      const user = await Prisma.user.findFirst({
        where: { vfy: params.cid as string },
        select: { id: true },
      });
      if (user) {
        return Response.json({ data: { id: user.id } }, { status: 200 });
      }
      return Response.json({ message: "Incorrect Code" }, { status: 404 });
    }
    return Response.json({}, { status: 404 });
  } catch (error) {
    console.log("Verify User", error);
    return Response.json({ message: "Failed To Verify" }, { status: 500 });
  }
}
