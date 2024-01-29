import Prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../[...nextauth]/route";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../../banner/route";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest) {
  try {
    const URL = request.nextUrl.toString();
    const { ty }: { ty?: string } = extractQueryParams(URL);
    const user = await getServerSession(authOptions);
    if (!user) {
      return notFound();
    }
    const uID = user?.user && "sub" in user.user && user.user.sub;

    let result: any = null;

    if (ty === "shipping") {
      result = await Prisma.address.findMany({
        where: {
          userId: uID as string,
        },
        select: {
          id: true,
          houseId: true,
          district: true,
          songkhat: true,
          province: true,
          postalcode: true,
        },
      });
    } else if (ty === "userinfo") {
      const info = await Prisma.user.findUnique({
        where: {
          id: uID as string,
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          createdAt: true,
        },
      });
      if (!info) {
        return notFound();
      }
      result = info;
    }
    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    console.log("Fetch User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  } finally {
    await Prisma.$disconnect();
  }
}
