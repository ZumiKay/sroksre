import { UserState } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import { registerUser } from "@/src/lib/userlib";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const userdata: any = await req.json();
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
