import { Role } from "@prisma/client";

export type MethodType = "POST" | "PUT" | "GET" | "DELETE";

// Immutable route definitions using Maps for O(1) lookup performance
const ADMIN_ROUTES: ReadonlyMap<string, ReadonlySet<MethodType>> = new Map([
  ["/products/crud", new Set(["POST", "PUT", "DELETE"])],
  ["/banner", new Set(["POST", "PUT", "DELETE", "GET"])],
  ["/image", new Set(["POST", "DELETE"])],
  ["/categories", new Set(["POST", "PUT", "DELETE"])],
  ["/users", new Set(["GET", "DELETE", "POST", "PUT"])],
  ["/users/admin", new Set(["GET", "PUT"])],
  ["/users/info", new Set(["GET", "POST", "PUT", "DELETE"])],
  ["/products", new Set(["POST", "PUT", "DELETE"])],
  ["/products/cover", new Set(["POST", "PUT", "DELETE", "GET"])],
  ["/products/variant/template", new Set(["POST", "PUT", "GET", "DELETE"])],
  ["/products/select", new Set(["GET"])],
  ["/promotion", new Set(["POST", "PUT", "DELETE", "GET"])],
  ["/policy", new Set(["POST", "PUT", "DELETE", "GET"])],
  ["/users/notification", new Set(["POST", "GET", "DELETE"])],
  ["/order", new Set(["POST", "PUT", "GET", "DELETE"])],
  ["/home/product", new Set(["GET"])],
  ["/home/banner", new Set(["GET"])],
  ["/home", new Set(["POST", "PUT", "DELETE", "GET"])],
  ["/users/logout", new Set(["DELETE"])],
  ["/order/list", new Set(["GET"])],
]) as never;

const PUBLIC_ROUTES: ReadonlyMap<string, ReadonlySet<MethodType>> = new Map([
  ["/products", new Set(["GET"])],
  ["/products/relatedproduct", new Set(["GET"])],
  ["/categories", new Set(["GET"])],
  ["/categories/select", new Set(["GET"])],
  ["/auth/register", new Set(["POST"])],
  ["/order/cart/check", new Set(["POST"])],
  ["/users/vfy", new Set(["POST", "DELETE", "GET"])],
]) as never;

const USER_ROUTES: ReadonlyMap<string, ReadonlySet<MethodType>> = new Map([
  ["/users/logout", new Set(["DELETE"])],
  ["/auth/users/info", new Set(["GET", "DELETE"])],
  ["/policy", new Set(["GET"])],
  ["/order", new Set(["POST", "PUT", "GET", "DELETE"])],
  ["/order/cart", new Set(["POST", "GET", "DELETE", "PUT"])],
  ["/users/info", new Set(["GET", "POST", "PUT", "DELETE"])],
  ["/order/list", new Set(["GET"])],
]) as never;

/**
 * Verifies if a request to a specific API route is allowed based on the user's role.
 *
 * @param path The API route path
 * @param method The HTTP method
 * @param role The user's role (or null if not authenticated)
 * @returns Object indicating whether access is allowed, with optional reason
 */
export const verifyApiRoute = (
  path: string,
  method: MethodType,
  role: Role | null
): { success: boolean; reason?: string } => {
  // Security validation: Ensure parameters are valid
  if (!path || !method) {
    return { success: false, reason: "INVALID_PARAMETERS" };
  }

  // Normalize path by removing trailing slashes and converting to lowercase
  const normalizedPath = path.toLowerCase().replace(/\/+$/, "");

  if (normalizedPath.startsWith("/auth")) {
    return { success: true };
  }
  if (role === null) {
    // Check if user is authenticated when required
    // Check if this is a public route that doesn't require authentication
    const isPublicPath = PUBLIC_ROUTES.has(normalizedPath);
    const isPublicMethod =
      isPublicPath && PUBLIC_ROUTES.get(normalizedPath)?.has(method);

    if (isPublicMethod) {
      return { success: true };
    }

    return { success: false, reason: "AUTHENTICATION_REQUIRED" };
  }

  // ADMIN role has access to both admin and user routes
  if (role === Role.ADMIN) {
    // Check admin routes
    const isAdminPath = ADMIN_ROUTES.has(normalizedPath);
    const isAdminMethod =
      isAdminPath && ADMIN_ROUTES.get(normalizedPath)?.has(method);

    if (isAdminMethod) {
      return { success: true };
    }

    // Check user routes as admin can access user routes too
    const isUserPath = USER_ROUTES.has(normalizedPath);
    const isUserMethod =
      isUserPath && USER_ROUTES.get(normalizedPath)?.has(method);

    if (isUserMethod) {
      return { success: true };
    }

    // Check public routes
    const isPublicPath = PUBLIC_ROUTES.has(normalizedPath);
    const isPublicMethod =
      isPublicPath && PUBLIC_ROUTES.get(normalizedPath)?.has(method);

    if (isPublicMethod) {
      return { success: true };
    }

    return { success: false, reason: "ACCESS_DENIED" };
  }

  // USER role can only access user routes and public routes
  if (role === Role.USER) {
    // Check user routes
    const isUserPath = USER_ROUTES.has(normalizedPath);
    const isUserMethod =
      isUserPath && USER_ROUTES.get(normalizedPath)?.has(method);

    if (isUserMethod) {
      return { success: true };
    }

    // Check public routes
    const isPublicPath = PUBLIC_ROUTES.has(normalizedPath);
    const isPublicMethod =
      isPublicPath && PUBLIC_ROUTES.get(normalizedPath)?.has(method);

    if (isPublicMethod) {
      return { success: true };
    }

    return { success: false, reason: "ACCESS_DENIED" };
  }

  return { success: false, reason: "INVALID_ROLE" };
};

// Export route maps for testing purposes
export const ROUTES = {
  ADMIN: ADMIN_ROUTES,
  USER: USER_ROUTES,
  PUBLIC: PUBLIC_ROUTES,
};
