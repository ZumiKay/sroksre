import { getUser } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { formatDate } from "@/src/app/component/EmailTemplate";

interface notificationParamType {
  ty?: "check" | "detail";
  p?: string;
  lt?: string;
}
export async function GET(req: NextRequest) {
  try {
    const param: notificationParamType = extractQueryParams(
      req.nextUrl.toString()
    );
    const user = await getUser();

    if (!user || !param.ty) {
      return Response.json({}, { status: 404 });
    }

    if (param.ty === "check") {
      const isNotCheck = await Prisma.notification.findMany({
        where: {
          AND: [
            {
              userid: user.id,
            },
            {
              checked: false,
            },
          ],
        },
        select: {
          id: true,
          checked: true,
        },
      });

      return Response.json({ data: isNotCheck }, { status: 200 });
    } else if (param.ty === "detail") {
      const page = parseInt(param.p ?? "1");
      const pageSize = parseInt(param.lt ?? "3");
      const skip = (page - 1) * pageSize;
      const take = pageSize;
      const result = await Prisma.notification.findMany({
        where: {
          userid: user?.id,
        },
        select: {
          id: true,
          type: true,
          content: true,
          link: true,
          checked: true,
          createdAt: true,
        },
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      });
      return Response.json(
        {
          data: result.map((i) => ({
            ...i,
            createdAt: formatDate(i.createdAt),
          })),
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.log("Notification Error", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id }: { id: number } = await req.json();
    if (!id) {
      return Response.json(null, { status: 404 });
    }

    await Prisma.notification.delete({ where: { id } });

    return Response.json({ message: "Delete Successfully" }, { status: 200 });
  } catch (error) {
    console.log("Notify", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
