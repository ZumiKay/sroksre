import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import Prisma from "@/src/lib/prisma";
import {
  caculateArrayPagination,
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { UserState } from "@/src/context/GlobalContext";
import { revalidateTag } from "next/cache";
import { IsNumber } from "../../product/page";

interface Userparam {
  lt?: number;
  ty?: "all" | "filter" | "uid";
  p?: number;
  search?: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.toString();
    const params: Userparam = extractQueryParams(url);

    let total = await Prisma.user.count({
      where: params.search
        ? !isNaN(Number(params.p))
          ? {
              id: parseInt(params.search.toString()),
            }
          : {
              OR: [
                {
                  email: {
                    contains: removeSpaceAndToLowerCase(params.search),
                    mode: "insensitive",
                  },
                },
                {
                  firstname: {
                    contains: removeSpaceAndToLowerCase(params.search),
                    mode: "insensitive",
                  },
                },
                {
                  lastname: {
                    contains: removeSpaceAndToLowerCase(params.search),
                    mode: "insensitive",
                  },
                },
              ],
            }
        : {},
    });
    let result;
    const { startIndex, endIndex } = calculatePagination(
      total,
      params.lt as number,
      params.p as number
    );

    if (params.ty === "all") {
      result = await Prisma.user.findMany({
        take: endIndex - startIndex + 1,
        skip: startIndex,
      });
    } else {
      result = await Prisma.user.findMany({
        where: params.search
          ? !isNaN(Number(params.p))
            ? {
                id: parseInt(params.search.toString()),
              }
            : {
                OR: [
                  {
                    email: {
                      contains: removeSpaceAndToLowerCase(params.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    firstname: {
                      contains: removeSpaceAndToLowerCase(params.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    lastname: {
                      contains: removeSpaceAndToLowerCase(params.search),
                      mode: "insensitive",
                    },
                  },
                ],
              }
          : {},
        take: endIndex - startIndex + 1,
        skip: startIndex,
      });
    }

    const caculatePage = params.lt && Math.ceil(total / params.lt);

    return Response.json(
      {
        data: result.map((i) => ({ ...i, password: null })),
        total,
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
