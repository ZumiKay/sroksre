import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import {
  calculateDiscountPrice,
  generateRandomNumber,
} from "@/src/lib/utilities";
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

    const { ty, vc, uid, id } = extractQueryParams(request.url.toString());

    if (vc) {
      return await handleVfyEmailByLink(user.id, vc as string);
    }

    // Define a type for our query results
    type QueryResult = UserState | Address | ProductState[] | null;
    let result: QueryResult = null;

    switch (ty) {
      case "shipping": {
        if (user.role === "ADMIN" && !uid && Number(uid)) {
          return Response.json({ error: "Invalid Data" }, { status: 400 });
        }
        result = (await Prisma.address.findMany({
          where: { userId: user.role === "ADMIN" ? Number(uid) : user.id },
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
      }

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
            isVerified: true,
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
            ? calculateDiscountPrice(product.price, product.discount)
            : null;

          return {
            ...product,
            discount,
          };
        }) as unknown as ProductState[];
        break;
      case "address":
        if (!id)
          return Response.json({ message: "Invalid Param" }, { status: 400 });
        result = await Prisma.address.findUnique({
          where: { id: id as number },
        });
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
  ty: "userinfo" | "address" | "wishlist" | "password" | "email" | "vfyemail";
  updateaddress: Address;
  delwishlist: number[];
}

export async function PUT(req: NextRequest) {
  try {
    const requestData: EditUserInfoType = await req.json();

    if (!requestData.ty) {
      return Response.json(
        { message: "Type parameter is required" },
        { status: 400 }
      );
    }

    const user = await getUser();
    if (!user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Handle different types of updates
    switch (requestData.ty) {
      case "userinfo": {
        return await handleUserInfoUpdate(user.id, requestData);
      }

      case "password": {
        return await handlePasswordUpdate(user.id, requestData);
      }

      case "wishlist": {
        return await handleWishlistUpdate(requestData);
      }
      case "email":
      case "vfyemail": {
        return await handleEmailUpdate(requestData, user.id);
      }

      default:
        return Response.json(
          { message: "Invalid update type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Edit User Info error:", error);
    return Response.json(
      { error: "Error occurred while updating user information" },
      { status: 500 }
    );
  }
}

// Helper function to handle user info updates
async function handleUserInfoUpdate(
  userId: number,
  requestData: EditUserInfoType
) {
  // Fetch current user data to compare against
  const currentUserInfo = await Prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstname: true,
      lastname: true,
      email: true,
      phonenumber: true,
      username: true,
      addresses: true,
    },
  });

  if (!currentUserInfo) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  // Prepare update object with only changed fields for user info
  const updateData: Partial<UserState> = {};
  const userInfoFields = [
    "firstname",
    "lastname",
    "email",
    "phonenumber",
    "username",
  ] as const;

  for (const key of userInfoFields) {
    if (
      requestData[key] !== undefined &&
      requestData[key] !== null &&
      requestData[key] !== currentUserInfo[key]
    ) {
      updateData[key] = requestData[key];
    }
  }

  // Track what was updated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operations: Promise<any>[] = [];

  // Update user info if needed
  if (Object.keys(updateData).length > 0) {
    operations.push(
      Prisma.user.update({
        where: { id: userId },
        data: updateData as never,
      })
    );
  }

  // Handle address updates if provided
  if (requestData.addresses) {
    //Delete Address
    operations.push(
      Prisma.address.deleteMany({
        where: {
          AND: [
            { userId },
            { id: { notIn: requestData.addresses.map((i) => i.id) } },
          ],
        },
      })
    );
  }

  if (operations.length > 0) {
    // Execute all database operations
    await Promise.all(operations);

    return Response.json(
      {
        message: "User info updated",
      },
      { status: 200 }
    );
  } else {
    return Response.json({ message: "No changes detected" }, { status: 200 });
  }
}

// Helper function to handle password updates
async function handlePasswordUpdate(
  userId: number,
  requestData: EditUserInfoType
) {
  const { password, newpassword } = requestData;

  if (!password || !newpassword) {
    return Response.json(
      { message: "Old and new passwords are required" },
      { status: 400 }
    );
  }

  const userInfo = await Prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!userInfo || userInfo.password !== password) {
    return Response.json(
      { message: "Current password is incorrect" },
      { status: 400 }
    );
  }

  // Only update if the new password is different
  if (password === newpassword) {
    return Response.json(
      { message: "New password must be different from current password" },
      { status: 400 }
    );
  }

  await Prisma.user.update({
    where: { id: userId },
    data: { password: hashedpassword(newpassword) },
  });

  return Response.json(
    { message: "Password updated successfully" },
    { status: 200 }
  );
}

// Helper function to handle wishlist updates
async function handleWishlistUpdate(requestData: EditUserInfoType) {
  if (requestData.delwishlist && requestData.delwishlist.length > 0) {
    const result = await Prisma.wishlist.deleteMany({
      where: { id: { in: requestData.delwishlist } },
    });

    return Response.json(
      {
        message: "Wishlist items removed",
        count: result.count,
      },
      { status: 200 }
    );
  } else {
    return Response.json(
      { message: "No wishlist items to delete" },
      { status: 400 }
    );
  }
}

async function handleEmailUpdate(
  requestData: EditUserInfoType,
  userId: number
) {
  if (requestData.ty === "email") {
    let vfyCode = generateRandomNumber(8);
    let codeUnique = false;

    while (!codeUnique) {
      const isCode = await Prisma.user.findFirst({ where: { vfy: vfyCode } });
      if (!isCode) {
        codeUnique = true;
      }
      vfyCode = generateRandomNumber(8);
    }

    await Prisma.user.update({
      where: { id: userId },
      data: { vfy: vfyCode },
    });

    return Response.json({ data: vfyCode }, { status: 200 });
  } else if (requestData.ty === "vfyemail") {
    if (!requestData.code || !requestData.email)
      return Response.json({ error: "Invalid Data" }, { status: 400 });
    const isCode = await Prisma.user.findFirst({
      where: { vfy: requestData.code },
    });

    if (!isCode)
      return Response.json({ error: "Can't Verify Email" }, { status: 400 });

    await Prisma.user.update({
      where: { id: userId },
      data: { email: requestData.email, isVerified: true, vfy: null },
    });
  }

  return Response.json({}, { status: 200 });
}

async function handleVfyEmailByLink(userId: number, vc: string) {
  const isCode = await Prisma.user.findFirst({ where: { vfy: vc } });

  if (!isCode) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  await Prisma.user.update({
    where: { id: userId },
    data: { isVerified: true, vfy: null },
  });

  return Response.json({ message: "Verified" }, { status: 200 });
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
