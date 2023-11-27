import { NextRequest } from "next/server";
import { RegisterUser, Role, hashedpassword, prisma } from "@/src/lib/userlib";

export async function POST(request: NextRequest) {
  const data: RegisterUser = await request.json();
  try {
    const password = hashedpassword(data.password);
    await prisma.user.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        password: password,
        role: Role.USER,
      },
    });
    return Response.json({ message: "Account Created" }, { status: 200 });
  } catch (err: any) {
    console.log(err);
    return Response.json(
      {
        message: err,
      },
      { status: 500 },
    );
  }
}
