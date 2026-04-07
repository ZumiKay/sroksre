import { NextRequest } from "next/server";
import Prisma from "@/src/lib/prisma";
import {
  calculatePagination,
  IsNumber,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { UserState } from "@/src/types/user.type";
import { revalidateTag } from "next/cache";

import type { Prisma as PrismaTypes } from "@/prisma/generated/prisma/client";
import { Role } from "@/prisma/generated/prisma/enums";

interface Userparam {
  lt?: number;
  p?: number;
  search?: string;
  sort?: "newest" | "oldest" | "name" | "name-desc";
  role?: Role | "all";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Userparam = {
      lt: parseInt(searchParams.get("lt") ?? "10", 10),
      p: parseInt(searchParams.get("p") ?? "1", 10),
      search: searchParams.get("search") ?? undefined,
      sort:
        (searchParams.get("sort") as
          | "newest"
          | "oldest"
          | "name"
          | "name-desc"
          | null) ?? undefined,
      role: (searchParams.get("role") as Role | "all" | null) ?? undefined,
    };

    const safeLt = params.lt && params.lt > 0 ? params.lt : 10;
    const safePage = params.p && params.p > 0 ? params.p : 1;

    const searchCondition: PrismaTypes.UserWhereInput = params.search
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

    const roleCondition: PrismaTypes.UserWhereInput =
      params.role && params.role !== "all" ? { role: params.role } : {};

    const whereClause: PrismaTypes.UserWhereInput = {
      AND: [searchCondition, roleCondition],
    };

    const orderBy: PrismaTypes.UserOrderByWithRelationInput =
      params.sort === "oldest"
        ? { createdAt: "asc" }
        : params.sort === "name"
          ? { firstname: "asc" }
          : params.sort === "name-desc"
            ? { firstname: "desc" }
            : { createdAt: "desc" };

    const total = await Prisma.user.count({
      where: whereClause,
    });

    const { startIndex, endIndex } = calculatePagination(
      total,
      safeLt,
      safePage,
    );

    const result = await Prisma.user.findMany({
      where: whereClause,
      orderBy,
      take: endIndex - startIndex + 1,
      skip: startIndex,
    });

    const totalpage = Math.ceil(total / safeLt);

    return Response.json(
      {
        data: result.map((user) => ({ ...user, password: null })),
        total,
        totalpage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Get User Error:", error);
    return Response.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id, type } = await request.json();

    await Prisma.wishlist.deleteMany({ where: { uid: id } });
    await Prisma.orderproduct.deleteMany({ where: { user_id: id } });
    await Prisma.usersession.deleteMany({ where: { userId: id } });
    await Prisma.user.deleteMany({ where: { id: id } });

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
