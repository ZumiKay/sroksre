import { hashedpassword, prisma } from "@/src/lib/userlib";
import { NextRequest } from "next/server";
export type resetdata = {
  email: string;
  newpassword: string;
};
export async function POST(request: NextRequest) {
  try {
    const data: resetdata = await request.json();
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });
    if (user) {
      // Generate Link and Sent email for reset
      // http://localhost/api/users/reset/qe4qwee123123
      return Response.json({ message: "Update Password" }, { status: 200 });
    } else {
      return Response.json({ message: "User Not Found" }, { status: 500 });
    }
  } catch (error) {
    console.log(error);
    return Response.json({ message: "Can't Reset" }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  const data: resetdata = await request.json();
  const password = hashedpassword(data.newpassword);
  const updatePass = await prisma.user.update({
    where: {
      email: data.email,
    },
    data: {
      password: password,
    },
  });
  if (updatePass) {
    return Response.json({ message: "Reset Successfully" }, { status: 200 });
  } else {
    return Response.json({ message: "Something Wrong" }, { status: 500 });
  }
}
