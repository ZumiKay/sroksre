import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import Prisma from "@/src/lib/prisma";
import {
  calculatePagination,
  IsNumber,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { Prisma as prisma } from "@prisma/client";
import { UserState } from "@/src/context/GlobalType.type";

interface Userparam {
  lt?: number;
  ty?: "all" | "filter" | "uid";
  p?: number;
  search?: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = request.url.toString();
    const params: Userparam = extractQueryParams(url);

    const searchCondition: prisma.UserWhereInput = params.search
      ? IsNumber(params.search.toString())
        ? { id: parseInt(params.search.toString()) }
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
      : {};

    const total = await Prisma.user.count({
      where: { AND: [searchCondition, { role: { not: "ADMIN" } }] },
    });

    const { startIndex, endIndex } = calculatePagination(
      total,
      params.lt as number,
      params.p as number
    );

    const result = await Prisma.user.findMany({
      where: { AND: [searchCondition, { role: { not: "ADMIN" } }] },
      take: endIndex - startIndex + 1,
      skip: startIndex,
    });

    const totalpage = params.lt ? Math.ceil(total / params.lt) : 1;

    return Response.json(
      {
        data: result.map((user) => ({ ...user, password: null })),
        total,
        totalpage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get User Error:", error);
    return Response.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: "Invalid Data" }, { status: 400 });
    }

    await Prisma.$transaction([
      Prisma.wishlist.deleteMany({ where: { uid: id } }),
      Prisma.orderproduct.deleteMany({ where: { user_id: id } }),
      Prisma.orders.deleteMany({ where: { buyer_id: id } }),
      Prisma.usersession.deleteMany({ where: { user_id: id } }),
      Prisma.user.delete({ where: { id: id } }),
    ]);
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
    return Response.json({ message: "User Updated" }, { status: 200 });
  } catch (error) {
    console.log("Edit User", error);
    return Response.json({ message: "Failed To Update User" }, { status: 500 });
  }
}
