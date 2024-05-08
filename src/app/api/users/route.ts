import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import Prisma from "@/src/lib/prisma";
import { caculateArrayPagination } from "@/src/lib/utilities";
import { UserState } from "@/src/context/GlobalContext";
import { revalidateTag } from "next/cache";

interface Userparam {
  lt?: number;
  ty?: "all" | "filter" | "uid";
  p?: number;
  n?: string;
  e?: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.toString();
    const params: Userparam = extractQueryParams(url);
    let alluser = await Prisma.user.findMany({});
    let totaluser: number = 0;
    let total: number = 0;

    if (params.ty === "all") {
      totaluser = alluser.length;
      total = alluser.length;
    } else {
      const filtered = alluser.filter((i) => {
        const isName =
          params.n &&
          (i.firstname.toLowerCase().includes(params.n.toLowerCase()) ||
            (i.lastname &&
              i.lastname.toLowerCase().includes(params.n.toLowerCase())));

        const isEmail =
          params.e && i.email.toLowerCase().includes(params.e.toLowerCase());

        return isName || isEmail;
      });

      total = filtered.length;
      alluser = filtered;
    }
    const result = caculateArrayPagination(
      alluser,
      params.p as number,
      params.lt as number
    );
    const caculatePage = params.lt && Math.ceil(total / params.lt);

    return Response.json(
      {
        data: result.map((i) => ({ ...i, password: null })),
        total: totaluser,
        totalpage: caculatePage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Get User", error);
    return Response.json({ message: "Hello This The Goat" }, { status: 200 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await Prisma.usersession.deleteMany({ where: { user_id: id } });

    await Prisma.user.delete({ where: { id } });

    return Response.json({ message: "User Deleted" }, { status: 200 });
  } catch (error) {
    console.log("User Delete", error);
    return Response.json({ message: "Failed To Delete" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updateData: UserState = await request.json();
    delete updateData.password;
    delete updateData.confirmpassword;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    await Prisma.user.update({
      where: {
        id: updateData.id,
      },
      data: { ...updateData },
    });
    revalidateTag("usermanagement");
    return Response.json({ message: "User Updated" }, { status: 200 });
  } catch (error) {
    console.log("Edit User", error);
    return Response.json({ message: "Failed To Update User" }, { status: 500 });
  }
}
