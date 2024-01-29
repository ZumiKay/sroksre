"use server";

import { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { VerifyApiRoute, methodtype } from "./lib/middlewareaction";

export default async function middleware(req: NextRequest) {
  const requestURL = (path: string) => req.nextUrl.pathname.endsWith(path);
  const url = req.nextUrl.pathname;

  const token: any = await getToken({ req });

  if (url.includes("dashboard")) {
    if (token) {
      if (
        url.includes("/products") ||
        url.includes("usermanagement") ||
        url.includes("ordermanagement")
      ) {
        if (token.role && token.role === Role.ADMIN) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/", req.url));
      } else {
        return NextResponse.next();
      }
    } else {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  if (requestURL("account")) {
    if (!token) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  //API ROUTE
  if (url.startsWith("/api")) {
    const method: methodtype = req.method as methodtype;
    const verifyroute = VerifyApiRoute(
      url.replace("/api", ""),
      method,
      token ? token.role : "USER",
    );

    if (verifyroute.success) {
      return NextResponse.next();
    } else {
      return NextResponse.error();
    }
  }
}
export const config = {
  matcher: ["/dashboard/:path*", "/account", "/api/:path*"],
};
