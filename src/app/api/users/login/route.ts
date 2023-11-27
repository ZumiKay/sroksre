import { createToken, prisma } from "@/src/lib/userlib";
import { compare } from "bcryptjs";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

type logindata = {
  email: string;
  password: string;
};
export async function POST(req: NextRequest) {
  const data: logindata = await req.json();
  const now: Date = new Date();
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });
    if (user) {
      const valid = await compare(data.password, user.password);
      if (valid) {
        const session = await prisma.usersession.create({
          data: {
            user_id: user.id,
          },
        });

        const token = await createToken({
          userid: user.id,
          sessionid: session.session_id,
        });

        cookies().set("token", token, {
          maxAge: 60 * 60,
          expires: new Date(now.getTime() + 60 * 60 * 1000),
          sameSite: "lax",
          httpOnly: true,
        });

        return Response.json({ message: token }, { status: 200 });
      } else {
        return Response.json(
          { message: "Incorrect Credential" },
          { status: 500 },
        );
      }
    } else {
      return Response.json({ message: "No User Found" }, { status: 500 });
    }
  } catch (err) {
    console.log(err);
    return Response.json({ message: err }, { status: 500 });
  }
}
