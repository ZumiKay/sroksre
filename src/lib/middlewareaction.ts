"use server";

export type methodtype = "POST" | "PUT" | "GET" | "DELETE";
export enum Roles {
  admin = "ADMIN",
  user = "USER",
}
interface Checkrouteprops {
  path: string;
  method: Array<methodtype>;
}
const alladminroute: Array<Checkrouteprops> = [
  {
    path: "/products/crud",
    method: ["POST", "PUT", "DELETE"],
  },
  {
    path: "/banner",
    method: ["POST", "PUT", "DELETE"],
  },
  { path: "/image", method: ["DELETE"] },
  { path: "/catories", method: ["POST", "PUT", "DELETE"] },
  { path: "/users", method: ["GET", "DELETE", "POST", "PUT"] },

  { path: "/product/cover", method: ["POST", "PUT", "DELETE"] },
  { path: "/promotion", method: ["POST", "PUT", "DELETE", "GET"] },
  { path: "/policy", method: ["POST", "PUT", "DELETE"] },
];
const userroute: Array<Checkrouteprops> = [
  {
    path: "/users/vfy",
    method: ["POST", "GET", "DELETE"],
  },
  { path: "/users/logout", method: ["DELETE"] },
  { path: "/auth/users/info", method: ["GET"] },
  { path: "/policy", method: ["GET"] },
];
export const VerifyApiRoute = (
  url: string,
  method: "POST" | "PUT" | "GET" | "DELETE",
  Role: string | null
) => {
  const isUserRoute = userroute.find(
    (i) => url === i.path && i.method.includes(method)
  );

  const isAdminRoute = alladminroute.find(
    (i) => url === i.path && i.method.includes(method)
  );

  if (isUserRoute) {
    if (Role === Roles.user) {
      return { success: true };
    }
  }

  if (isAdminRoute) {
    if (Role === Roles.admin) {
      return { success: true };
    }
    return { success: false };
  }

  return { success: true };
};
