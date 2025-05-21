import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import Prisma from "@/src/lib/prisma";
import { generateRandomNumber, IsNumber } from "@/src/lib/utilities";
import { UserState } from "@/src/context/GlobalType.type";

interface AdminGetUserParamType {
  uid: string;
}
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.toString();
    const { uid } = extractQueryParams(url) as unknown as AdminGetUserParamType;

    if (uid) {
      const id = IsNumber(`${uid}`);
      if (!id) return Response.json({ error: "Invalid Data" }, { status: 400 });
    }

    const data = await Prisma.user.findUnique({
      where: { id: Number(uid) },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
      },
    });

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.log("Admin Get User", error);
    return Response.json({ erorr: "Error Occured" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updateUserData = (await req.json()) as UserState;

    const isUser = await Prisma.user.findUnique({
      where: { id: updateUserData.id },
    });

    if (!isUser)
      return Response.json({ error: "Can't Find User" }, { status: 400 });

    let vfycode: string | undefined;
    if (isUser.email !== updateUserData.email) {
      let isUnique = false;

      do {
        vfycode = generateRandomNumber(8);
        const isCode = await Prisma.user.findFirst({ where: { vfy: vfycode } });
        if (!isCode) isUnique = true;
        else vfycode = generateRandomNumber(8);
      } while (!isUnique);
    }

    await Prisma.user.update({
      where: { id: updateUserData.id },
      data: updateUserData as never,
    });

    return Response.json(
      { messsage: "User Updated", data: vfycode },
      { status: 200 }
    );
  } catch (error) {
    console.log("Edit User", error);
    return Response.json({ error: "Can't Edit User" }, { status: 500 });
  }
}
