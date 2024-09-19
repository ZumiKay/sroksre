"use server";

import { NextRequest, NextResponse } from "next/server";
import { VerifyApiRoute, methodtype } from "./lib/middlewareaction";

import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const requestURL = (path: string) => req.nextUrl.pathname.endsWith(path);

  const url = req.nextUrl.pathname;

  const token = await getToken({ req });

  if (url.includes("dashboard")) {
    if (token) {
      if (url.includes("order")) {
        return NextResponse.next();
      }
      if (url.includes("products") || url.includes("usermanagement")) {
        if (token.role && token.role === "ADMIN") {
          const nextUrl = req.nextUrl.clone();
          const searchparam = nextUrl.searchParams;

          if (!searchparam.has("page")) {
            searchparam.append("page", "1");
          }
          if (!searchparam.has("show")) {
            searchparam.append("show", "1");
          }

          return NextResponse.rewrite(nextUrl);
        }
        return NextResponse.redirect(new URL("/", req.url));
      } else {
        return NextResponse.next();
      }
    } else {
      return NextResponse.redirect(new URL("/account", req.url));
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
      token && (token.role as string)
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
