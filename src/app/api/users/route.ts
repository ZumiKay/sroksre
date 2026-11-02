import { NextRequest } from "next/server";
import Prisma from "@/src/lib/prisma";
import { calculatePagination, IsNumber, removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import { requireAdmin } from "@/src/lib/session";
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
  if (!(await requireAdmin())) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Userparam = {
      lt: parseInt(searchParams.get("lt") ?? "10", 10),
      p: parseInt(searchParams.get("p") ?? "1", 10),
      search: searchParams.get("search") ?? undefined,
      sort:
        (searchParams.get("sort") as "newest" | "oldest" | "name" | "name-desc" | null) ??
        undefined,
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

    const { startIndex, endIndex } = calculatePagination(total, safeLt, safePage);

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

const MAX_BULK_DELETE = 100;

/**
 * Self account cannot be delete */
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const rawIds: unknown[] = Array.isArray(body?.userIds) ? body.userIds : [body?.id];
    const ids = [...new Set(rawIds.map(Number))];

    if (
      ids.length === 0 ||
      ids.length > MAX_BULK_DELETE ||
      !ids.every((id) => Number.isInteger(id) && id > 0)
    ) {
      return Response.json({ message: "Invalid user id" }, { status: 400 });
    }

    if (ids.includes(admin.userId)) {
      return Response.json({ message: "You can't delete your own account here" }, { status: 400 });
    }

    const adminTargets = await Prisma.user.count({
      where: { id: { in: ids }, role: Role.ADMIN },
    });
    if (adminTargets > 0) {
      return Response.json({ message: "Admin accounts can't be deleted" }, { status: 403 });
    }

    const [, , , deleted] = await Prisma.$transaction([
      Prisma.wishlist.deleteMany({ where: { uid: { in: ids } } }),
      Prisma.orderproduct.deleteMany({ where: { user_id: { in: ids } } }),
      Prisma.usersession.deleteMany({ where: { userId: { in: ids } } }),
      Prisma.user.deleteMany({
        where: { id: { in: ids }, role: { not: Role.ADMIN } },
      }),
    ]);

    revalidateTag("usermanagement", "max");
    return Response.json({ message: "User Deleted", deleted: deleted.count }, { status: 200 });
  } catch (error) {
    console.log("User Delete", error);
    return Response.json({ message: "Failed To Delete" }, { status: 500 });
  }
}
