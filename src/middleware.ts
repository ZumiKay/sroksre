import { NextRequest, NextResponse } from "next/server";
import { VerifyApiRoute, methodtype } from "./lib/middlewareaction";
import { getToken } from "next-auth/jwt";
import { Role } from "@/prisma/generated/prisma/enums";

/**
 * Middleware - runs on Edge Runtime
 */

const isTokenExpired = (token: any | null): boolean => {
  if (!token) return true;
  return token.isExpired === true;
};

// Helper to add default pagination params
const addPaginationParams = (url: URL): void => {
  if (!url.searchParams.has("page")) {
    url.searchParams.set("page", "1");
  }
  if (!url.searchParams.has("show")) {
    url.searchParams.set("show", "1");
  }
};

const nextAuthPath = "/api/auth";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = (await getToken({ req })) as unknown as any;

  // Handle dashboard routes
  if (pathname.includes("/dashboard")) {
    // Redirect to account if no token or expired
    if (!token || isTokenExpired(token)) {
      req.nextUrl.pathname = "/account";
      return NextResponse.redirect(req.nextUrl);
    }

    // Allow access to order pages for all authenticated users
    if (pathname.includes("/order")) {
      return NextResponse.next();
    }

    // Admin-only routes: products and user management
    if (
      pathname.includes("/products") ||
      pathname.includes("/usermanagement")
    ) {
      if (token.role !== "ADMIN") {
        req.nextUrl.pathname = "/";
        return NextResponse.redirect(req.nextUrl);
      }

      // Add default pagination params for admin routes
      addPaginationParams(req.nextUrl);
      return NextResponse.rewrite(req.nextUrl);
    }

    // Allow access to other dashboard pages
    return NextResponse.next();
  }

  // Handle account route
  if (pathname.endsWith("/account")) {
    // Redirect authenticated users to dashboard
    if (token && !isTokenExpired(token)) {
      req.nextUrl.pathname = "/dashboard";
      return NextResponse.redirect(req.nextUrl);
    }
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith("/api") && !pathname.startsWith(nextAuthPath)) {
    const method = req.method as methodtype;
    const role = token?.role as Role | null;
    const apiPath = pathname.replace("/api", "");

    const { success } = VerifyApiRoute(apiPath, method, role);
    return success ? NextResponse.next() : NextResponse.error();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/account", "/api/:path*"],
};
