import Prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";

export async function GET(request: NextRequest) {
  try {
    const URL = request.nextUrl.toString();

    const { ty }: { ty?: string } = extractQueryParams(URL);
    const user = await getServerSession(authOptions);

    if (!user) {
      return Response.json({}, { status: 404 });
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
          street: true,
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
        return Response.json({ message: "No user" }, { status: 404 });
      }
      result = info;
    }
    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    console.log("Fetch User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
