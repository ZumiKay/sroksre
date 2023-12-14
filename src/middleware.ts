"use server";

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const requestURL = (path: string) => req.nextUrl.pathname.endsWith(path);
  const token = await getToken({ req });

  if (requestURL("dashboard")) {
    if (token) {
      return NextResponse.next();
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
}
export const config = {
  matcher: ["/dashboard/:path*", "/account"],
};
