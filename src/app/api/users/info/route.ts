import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { getUser } from "@/src/lib/session";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { syncExpiredPromotions } from "@/src/lib/promotion";
import { confirmIdentity } from "@/src/lib/confirmIdentity";
import { deleteUsersWithData } from "@/src/lib/accountDeletion";
import { getAdminSessionStatus } from "@/src/lib/adminGuard";
import { Role } from "@/prisma/generated/prisma/enums";

export async function GET(request: NextRequest) {
  await syncExpiredPromotions();
  try {
    const URL = request.url.toString();

    const { ty }: { ty?: string } = extractQueryParams(URL);
    const user = await getUser();

    if (!user) {
      return Response.json({}, { status: 404 });
    }

    let result: any = null;

    if (ty === "shipping") {
      result = await Prisma.address.findMany({
        where: {
          userId: user.userId,
        },
        select: {
          id: true,
          houseId: true,
          firstname: true,
          lastname: true,
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
          id: user.userId,
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!info) {
        return Response.json({ message: "No user" }, { status: 404 });
      }
      result = info;
    } else if (ty === "wishlist") {
      const productwishlist = await Prisma.wishlist.findMany({
        where: { uid: user.userId },
        select: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discount: true,
              parentcategory_id: true,
              childcategory_id: true,
              covers: {
                select: {
                  url: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      result = productwishlist.map((wish) => {
        const discount =
          wish.product.discount &&
          calculateDiscountProductPrice({
            price: wish.product.price,
            discount: wish.product.discount,
          });

        return {
          ...wish.product,
          discount: discount && discount.discount,
        };
      });
    }
    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    console.log("Fetch User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

/**
 * Deletes the caller's own account. Body: { password?, emailCode?, code? },
 * whichever confirmIdentity asks for. Admins also need a session that passed
 * 2FA, and the last admin account can't be deleted.
 */
export async function DELETE(request: NextRequest) {
  const user = await getUser({ user: { select: { role: true } } });
  if (!user?.userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    if (user.user?.role === Role.ADMIN) {
      if ((await getAdminSessionStatus(user.sessionid)) !== "ok") {
        return Response.json(
          { message: "Finish two-factor login before deleting this account" },
          { status: 403 },
        );
      }
      const admins = await Prisma.user.count({ where: { role: Role.ADMIN } });
      if (admins <= 1) {
        return Response.json(
          { message: "The last admin account can't be deleted" },
          { status: 403 },
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const confirmed = await confirmIdentity(user.userId, "delete_account", body ?? {});
    if (!confirmed.ok) {
      return Response.json({ message: confirmed.message }, { status: confirmed.status });
    }

    await deleteUsersWithData([user.userId], { includeAdmins: true });
    return Response.json({ message: "Account deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete User", error);
    return Response.json({ message: "Failed to delete account" }, { status: 500 });
  }
}
