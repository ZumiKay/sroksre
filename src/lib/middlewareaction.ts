"use server";

import { Role } from "@/prisma/generated/prisma/enums";

export type methodtype = "POST" | "PUT" | "GET" | "DELETE";

const allAdminRoute: Map<string, methodtype[]> = new Map([
  ["/products/crud", ["POST", "PUT", "DELETE"]],
  ["/banner", ["POST", "PUT", "DELETE"]],
  ["/image", ["DELETE"]],
  ["/categories", ["POST", "PUT", "DELETE"]],
  ["/users", ["GET", "DELETE", "POST", "PUT"]],
  ["/users/info", ["GET", "DELETE"]],
  ["/products", ["POST", "PUT", "DELETE"]],
  ["/products/cover", ["POST", "PUT", "DELETE", "GET"]],
  ["/products/variant/template", ["POST", "PUT", "GET", "DELETE"]],
  ["/promotion", ["POST", "PUT", "DELETE", "GET"]],
  ["/policy", ["POST", "PUT", "DELETE", "GET"]],
  ["/users/notification", ["POST", "GET", "DELETE"]],
  ["/order", ["POST", "PUT", "GET", "DELETE"]],
  ["/home/product", ["GET"]],
  ["/home/banner", ["GET"]],
  ["/home", ["POST", "PUT", "DELETE", "GET"]],
  ["/users/logout", ["DELETE"]],
]);

const allPublicRoute: Map<string, methodtype[]> = new Map([
  ["/products", ["GET"]],
  ["/products/relatedproduct", ["GET"]],
  ["/categories", ["GET"]],
  ["/categories/select", ["GET"]],
  ["/auth/register", ["POST"]],
  ["/order/cart/check", ["POST"]],
  ["/users/vfy", ["POST", "DELETE", "GET"]],
]);

const userRoute: Map<string, methodtype[]> = new Map([
  ["/users/logout", ["DELETE"]],
  ["/auth/users/info", ["GET", "DELETE"]],
  ["/policy", ["GET"]],
  ["/order", ["POST", "PUT", "GET", "DELETE"]],
  ["/order/cart", ["POST", "GET", "DELETE"]],
  ["/users/info", ["GET", "DELETE"]],
  ["/users/logout", ["DELETE"]],
]);

export const VerifyApiRoute = (
  url: string,
  method: methodtype,
  role: Role | null,
): { success: boolean } => {
  const normalizedUrl = url.toLowerCase();

  // Check public routes first (no auth required)
  const isPublicRoute = allPublicRoute.get(normalizedUrl)?.includes(method);
  if (isPublicRoute) {
    return { success: true };
  }

  // Require authentication for protected routes
  if (!role) {
    return { success: false };
  }

  // Check admin-only routes
  const isAdminRoute = allAdminRoute.get(normalizedUrl)?.includes(method);
  if (isAdminRoute) {
    return { success: role === Role.ADMIN };
  }

  // Check user routes (accessible by authenticated users)
  const isUserRoute = userRoute.get(normalizedUrl)?.includes(method);
  if (isUserRoute) {
    return { success: true };
  }

  // Default: allow if not explicitly restricted
  return { success: true };
};
