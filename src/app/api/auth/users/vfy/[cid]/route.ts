import Prisma from "@/src/lib/prisma";
import { handleEmail } from "@/src/lib/userlib";
import {
  generateRandomNumber,
  generateRandomPassword,
} from "@/src/lib/utilities";
import { NextRequest, NextResponse } from "next/server";
import { extractQueryParams } from "../../../../banner/route";

interface Vfydatatype {
  email?: string;
  type: "register" | "forgot";
}

export async function POST(request: NextRequest) {
  try {
    await Prisma.user.deleteMany({
      where: {
        vfy: {
          not: null,
        },
      },
    });

    const data: Vfydatatype = await request.json();
    const otp = generateRandomNumber();
    const isUser =
      data.type === "register"
        ? await Prisma.user.findFirst({
            where: { email: data.email },
          })
        : false;

    //send email
    if (!isUser) {
      await handleEmail({
        subject: "Verify Email",
        to: data.email as string,
        message: `Verify Code: ${
          data.type === "register"
            ? otp
            : `${process.env.NEXTAUTH_URL}/account/reset&cid=${otp}`
        }`,
        title: `${
          data.type === "register" ? "Email Verification" : "Reset Password"
        }`,
        warn:
          data.type === "register"
            ? "This email serve purpose of verify your email"
            : "Please click on the link to reset before reload the login page",
      });

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
        { message: "Successfully Sent Code" },
        { status: 200 },
      );
    } else {
      return Response.json({ message: "Email already exist" }, { status: 500 });
    }
  } catch (error) {
    console.log("Verify User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  } finally {
    await Prisma.$disconnect();
  }
}

export async function GET(
  request: Request,
  { params }: { params: { cid: string } },
) {
  try {
    if (params.cid) {
      const cid = params.cid.toString();
      const user = await Prisma.user.findFirst({ where: { vfy: cid } });
      if (user) {
        return Response.json({ data: { id: user.id } }, { status: 200 });
      }
      return Response.error();
    }
    return Response.error();
  } catch (error) {
    console.log("Verify User", error);
    return Response.json({ message: "Failed To Verify" }, { status: 500 });
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
          { status: 404 },
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
