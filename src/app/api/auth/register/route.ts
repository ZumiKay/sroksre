import Prisma from "@/src/lib/prisma";
import { Role } from "@/prisma/generated/prisma/enums";
import { registerUser } from "@/src/lib/userlib";
import { getUser } from "@/src/lib/session";
import { verifyTurnstile } from "@/src/lib/turnstile";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const userdata: any = await req.json();

  // Public sign-ups must pass Turnstile. Admins creating users from the
  // dashboard have no captcha widget, so they skip it.
  const session = await getUser();
  if (session?.role !== "ADMIN") {
    const captcha = await verifyTurnstile(userdata?.recapcha);
    if (!captcha.success) {
      return Response.json(
        { message: "Captcha verification failed, please try again" },
        { status: 400 },
      );
    }
  }

  const user = await registerUser(userdata);
  if (user.success) {
    return Response.json({ message: "Registered" }, { status: 200 });
  } else {
    return Response.json({ message: user.message }, { status: 500 });
  }
}
// Fields an admin may edit from the user management modal.
const EDITABLE_TEXT_FIELDS = ["firstname", "lastname", "email", "phonenumber"] as const;
const NULLABLE_FIELDS = new Set(["lastname", "phonenumber"]);

export async function PUT(request: NextRequest) {
  // /api/auth/* skips the proxy's role checks, so enforce admin here.
  const session = await getUser();
  if (session?.role !== "ADMIN") {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ message: "Invalid user" }, { status: 400 });
    }

    const target = await Prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!target) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const data: Record<string, string | null> = {};
    for (const field of EDITABLE_TEXT_FIELDS) {
      const value = body[field];
      if (typeof value !== "string") continue;
      // "" would collide on the unique phonenumber column; store null instead.
      data[field] = value === "" && NULLABLE_FIELDS.has(field) ? null : value;
    }

    // Matches the modal: an existing admin's role cannot be changed.
    if (
      target.role !== Role.ADMIN &&
      Object.values(Role).includes(body.role as Role)
    ) {
      data.role = body.role;
    }

    await Prisma.user.update({ where: { id }, data });
    return Response.json({ message: "User Updated" }, { status: 200 });
  } catch (error) {
    console.log("Edit User", error);
    return Response.json({ message: "Failed To Update User" }, { status: 500 });
  }
}
