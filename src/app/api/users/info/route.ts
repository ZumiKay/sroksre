import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { ProductState, UserState } from "@/src/context/GlobalType.type";
import { Address } from "@prisma/client";
import { hashedpassword } from "@/src/lib/userlib";
import { getUser } from "@/src/app/action";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 401 });
    }

    const { ty } = extractQueryParams(request.url.toString());

    // Define a type for our query results
    type QueryResult = UserState | Address | ProductState[] | null;
    let result: QueryResult = null;

    switch (ty) {
      case "shipping":
        result = (await Prisma.address.findMany({
          where: { userId: user.id },
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
        })) as unknown as Address;
        break;

      case "userinfo":
        result = (await Prisma.user.findUnique({
          where: { id: user.id },
          select: {
            firstname: true,
            lastname: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
            addresses: { select: { id: true } },
          },
        })) as unknown as UserState;

        if (!result) {
          return Response.json(
            { message: "User details not found" },
            { status: 404 }
          );
        }
        break;

      case "wishlist":
        const productwishlist = await Prisma.wishlist.findMany({
          where: { uid: user.id },
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

        result = productwishlist.map(({ product }) => {
          const discount = product.discount
            ? calculateDiscountProductPrice({
                price: product.price,
                discount: product.discount,
              })
            : null;

          return {
            ...product,
            discount: discount?.discount || null,
          };
        }) as unknown as ProductState[];
        break;

      default:
        return Response.json(
          { message: "Invalid query type" },
          { status: 400 }
        );
    }

    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return Response.json({ message: "An error occurred" }, { status: 500 });
  }
}

interface EditUserInfoType extends UserState {
  ty: "userinfo" | "address" | "wishlist" | "password";
  updateaddress: Address;
  delwishlist: number[];
}

export async function PUT(req: NextRequest) {
  try {
    const requestData: EditUserInfoType = await req.json();

    if (!requestData.ty) {
      return Response.json({}, { status: 400 });
    }
    const user = await getUser();

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 401 });
    }

    const updateData: Partial<UserState | Address> = {};

    for (const [key, value] of Object.entries(requestData)) {
      if (value !== undefined && value !== null) {
        updateData[key as never] = value as never;
      }
    }

    // Only perform update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      if (requestData.ty === "address") {
        await Prisma.address.update({
          where: { id: user.id },
          data: updateData,
        });
      } else if (requestData.ty === "userinfo") {
        await Prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      } else if (requestData.ty === "password") {
        const { password, newpassword } = requestData;

        if (!password || !newpassword) {
          return Response.json(
            { message: "Old and new passwords are required" },
            { status: 400 }
          );
        }

        const userInfo = await Prisma.user.findUnique({
          where: { id: user.id },
        });

        if (!userInfo || userInfo.password !== password) {
          return Response.json(
            { message: "Password is inccorect" },
            { status: 400 }
          );
        }

        await Prisma.user.update({
          where: { id: user.id },
          data: { password: hashedpassword(newpassword) },
        });
      } else if (requestData.ty === "wishlist" && requestData.delwishlist) {
        await Prisma.wishlist.deleteMany({
          where: { id: { in: requestData.delwishlist } },
        });
      }

      return Response.json({ message: "User info updated" }, { status: 200 });
    } else {
      return Response.json({}, { status: 400 });
    }
  } catch (error) {
    console.error("Edit User Info error:", error);
    return Response.json(
      { error: "Error occurred while updating user information" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const user = await getUser();

  if (!user) {
    return Response.json({}, { status: 401 });
  }

  try {
    await Prisma.$transaction([
      // Delete related records first
      Prisma.wishlist.deleteMany({ where: { uid: user.id } }),
      Prisma.orderproduct.deleteMany({ where: { user_id: user.id } }),
      Prisma.orders.deleteMany({ where: { buyer_id: user.id } }),
      Prisma.usersession.deleteMany({ where: { user_id: user.id } }),
      Prisma.user.delete({ where: { id: user.id } }),
    ]);

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
