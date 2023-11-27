import { NextRequest, NextResponse } from "next/server";
import {
  RegisterUser,
  checkpassword,
  validateUserInput,
  verfyUserLoginInput,
} from "./lib/userlib";
import { protectedRoutes, verifyToken } from "./lib/protectedLib";

export async function middleware(request: NextRequest) {
  const requestURL = (url: string) => request.nextUrl.pathname.endsWith(url);
  const token = request.cookies.get("token")?.value;
  const verifiedtoken = token && (await verifyToken(token));
  if (requestURL("users")) {
    const data: RegisterUser = await request.json();

    const verifypassword = checkpassword(data.password);
    try {
      validateUserInput.parse(data);
      if (verifypassword.isValid) {
        NextResponse.next();
      }
    } catch (error: any) {
      return Response.json(
        {
          message: error.errors ?? verifypassword.error.join("\n"),
        },
        { status: 500 },
      );
    }
  }

  if (requestURL("login")) {
    const data = await request.json();
    try {
      verfyUserLoginInput.parse(data);
      return NextResponse.next();
    } catch (err) {
      console.log(err);
      return Response.json({ message: err }, { status: 500 });
    }
  }

  //ProtectedRoutes

  protectedRoutes.user.routes.forEach((route) => {
    if (requestURL(route)) {
      if (verifiedtoken) {
        NextResponse.next();
      } else {
        return Response.json({ message: "Access Denied" }, { status: 403 });
      }
    }
  });

  if (protectedRoutes.admin.routes.length > 0 && verifiedtoken) {
    for (const route of protectedRoutes.admin.routes) {
      if (requestURL(route)) {
        NextResponse.next();
      } else {
        return Response.json({ message: "Access Denied" }, { status: 403 });
      }
    }
  }
}
