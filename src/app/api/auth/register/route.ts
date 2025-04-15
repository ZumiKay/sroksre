import Prisma from "@/src/lib/prisma";
import { RegisterUser, registerUser } from "@/src/lib/userlib";
import { NextRequest } from "next/server";
import { UserState } from "@/src/context/GlobalType.type";

export async function POST(req: NextRequest) {
  const userdata: RegisterUser = await req.json();
  const user = await registerUser(userdata);
  if (user.success) {
    return Response.json({ message: "Registered" }, { status: 200 });
  } else {
    return Response.json({ message: user.message }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  try {
    const updateData: UserState = await request.json();

    // First, fetch the existing user data
    const existingUser = await Prisma.user.findUnique({
      where: {
        id: updateData.id,
      },
    });

    if (!existingUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const changedFields: Partial<UserState> = {};

    Object.keys(updateData).forEach((key) => {
      if (
        key !== "id" &&
        updateData[key as never] !== existingUser[key as never]
      ) {
        changedFields[key as never] = updateData[key as never] as never;
      }
    });

    // Only update if there are changed fields
    if (Object.keys(changedFields).length > 0) {
      await Prisma.user.update({
        where: {
          id: updateData.id,
        },
        data: changedFields,
      });
      return Response.json({ message: "User Updated" }, { status: 200 });
    } else {
      return Response.json({ error: "No changes detected" }, { status: 200 });
    }
  } catch (error) {
    console.log("Edit User", error);
    return Response.json({ error: "Failed To Update User" }, { status: 500 });
  }
}
