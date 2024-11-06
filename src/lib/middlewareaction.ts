"use server";

import { Role } from "@prisma/client";

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
  ["/users/vfy", ["POST", "DELETE"]],
  ["/user/vfy/", ["GET"]],
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
  role: Role | null
): { success: boolean } => {
  const normalizedUrl = url.toLowerCase();

  if (!Role) {
    return { success: false };
  }

  const isUserRoute = userRoute.get(normalizedUrl)?.includes(method);

  // Check if it's a valid user route
  if (isUserRoute && role === Role.USER) {
    return { success: true };
  }

  // Check if it's a valid admin route
  const isAdminRoute = allAdminRoute.get(normalizedUrl)?.includes(method);
  if (isAdminRoute && role === Role.ADMIN) {
    return { success: true };
  }

  if (isAdminRoute && role !== Role.ADMIN) {
    return { success: false };
  }

  if (!isAdminRoute && !isUserRoute) {
    return { success: true };
  }

  return { success: false };
};
