//Middleware
//
"use server";

import { NextRequest, NextResponse } from "next/server";
import {
  VerifyApiRoute,
  isAdminOnlyRoute,
  methodtype,
} from "./lib/middlewareaction";
import { getAdminSessionStatus, isActiveAdminSession } from "./lib/adminGuard";

import { getToken } from "next-auth/jwt";
import { Role } from "@/prisma/generated/prisma/enums";

export default async function proxy(req: NextRequest) {
  const requestURL = (path: string) => req.nextUrl.pathname.endsWith(path);

  const url = req.nextUrl.pathname;

  const token = await getToken({ req });

  if (url.includes("dashboard")) {
    if (token) {
      if (url.includes("order")) {
        return NextResponse.next();
      }
      if (
        url.includes("products") ||
        url.includes("usermanagement") ||
        url.includes("inventory")
      ) {
        // The cookie's role can be days old; confirm with the database.
        const status =
          token.role === "ADMIN"
            ? await getAdminSessionStatus(token.sessionid)
            : "denied";

        if (status === "mfa_required") {
          return NextResponse.redirect(new URL("/dashboard/security", req.url));
        }
        if (status === "ok" && url.includes("inventory")) {
          return NextResponse.next();
        }
        if (status === "ok") {
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
  if (url.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (url.startsWith("/api")) {
    const method: methodtype = req.method as methodtype;

    const role = token?.role as Role;

    const route = url.replace("/api", "");
    const verifyroute = VerifyApiRoute(route, method, role);
    if (!verifyroute.success) {
      return NextResponse.error();
    }

    // Admin routes: the cookie's role can be days old, so confirm the
    // session is still live and the user is still an admin.
    if (
      isAdminOnlyRoute(route, method) &&
      !(await isActiveAdminSession(token?.sessionid))
    ) {
      return NextResponse.error();
    }

    return NextResponse.next();
  }
}
export const config = {
  matcher: ["/dashboard/:path*", "/account", "/api/:path*"],
};
