import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { MethodType, verifyApiRoute } from "./lib/middlewareaction";
import {
  apiRateLimiter,
  authRateLimiter,
  getRateLimitKey,
  globalRateLimiter,
} from "./lib/rateLimiter";
import { getCsrfToken } from "next-auth/react";

function createRateLimitResponse(result: {
  limit: number;
  remaining: number;
  retryAfter?: number;
  reset: number;
}) {
  return new NextResponse(
    JSON.stringify({
      error: "Too many requests, please try again later",
      retryAfter: result.retryAfter || 60,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}

// Define sensitive routes that need extra protection
const SENSITIVE_ROUTES = ["/api/auth/r23646"];

const RateLimitRoute = [
  "/api/vfy",
  "/api/users/vfy",
  "/api/auth/signin",
  "/api/auth/register",
  "/api/users/logout",
];

// Get or create a rate limiter for a specific config key

/**
 * Enhanced middleware with stronger security measures
 */
export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const method = req.method;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // Add security headers to all responses
  const secureHeaders = new Headers();
  secureHeaders.set("X-Content-Type-Options", "nosniff");
  secureHeaders.set("X-Frame-Options", "DENY");
  secureHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  secureHeaders.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  const globalKey = getRateLimitKey(ip, "global");
  const globalResult = globalRateLimiter.try(globalKey);

  if (!globalResult.success) {
    return createRateLimitResponse(globalResult);
  }

  // Apply rate limiting for authentication endpoints
  if (RateLimitRoute.includes(url)) {
    const rateLimitResult = authRateLimiter.try(ip);

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests, please try again later" }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(secureHeaders),
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateLimitResult.remaining / 1000)),
          },
        }
      );
    }
  }

  // Special handling for sensitive endpoints (additional rate limiting)
  // if (SENSITIVE_ROUTES.some((route) => url.startsWith(route))) {
  //   const rateLimitResult = await rateLimit({
  //     ip,
  //     path: url,
  //     maxRequests: MAX_API_REQUESTS / 2, // More strict for sensitive routes
  //     windowMs: RATE_LIMIT_WINDOW,
  //   });

  //   if (!rateLimitResult.success) {
  //     return new NextResponse(
  //       JSON.stringify({
  //         error: "Rate limit exceeded for sensitive operation",
  //       }),
  //       {
  //         status: 429,
  //         headers: {
  //           ...Object.fromEntries(secureHeaders),
  //           "Content-Type": "application/json",
  //           "Retry-After": String(
  //             Math.ceil(rateLimitResult.timeRemaining / 1000)
  //           ),
  //         },
  //       }
  //     );
  //   }
  // }

  // Get token in a more secure way
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in your environment
  });

  // Verify CSRF token for mutating operations
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(method) &&
    url.startsWith("/api")
  ) {
    const passedToken = await getCsrfToken({});

    if (!passedToken) {
      return new NextResponse(JSON.stringify({ error: "Invalid CSRF token" }), {
        status: 403,
        headers: {
          ...Object.fromEntries(secureHeaders),
          "Content-Type": "application/json",
        },
      });
    }
  }

  // Handle dashboard routes with enhanced security
  if (url.includes("dashboard")) {
    if (!token) {
      // Redirect to login with secure redirect handling
      const redirectUrl = new URL("/account", req.url);
      redirectUrl.searchParams.set("callback", encodeURIComponent(url));

      return NextResponse.redirect(redirectUrl, {
        headers: secureHeaders,
      });
    }

    // Validate token expiration
    const tokenExpiry = token.exp as number;
    const currentTime = Math.floor(Date.now() / 1000);

    if (tokenExpiry && currentTime > tokenExpiry) {
      const redirectUrl = new URL("/account", req.url);
      redirectUrl.searchParams.set("expired", "true");

      return NextResponse.redirect(redirectUrl, {
        headers: secureHeaders,
      });
    }

    // Enhanced role-based access control for dashboard
    if (url.includes("order")) {
      // Validate that the user can access this specific order
      const orderId = extractOrderIdFromUrl(url);
      if (orderId && token.role !== "ADMIN") {
        // For non-admins, check if they own this order
        const canAccessOrder = await validateOrderAccess(orderId, token.sub);
        if (!canAccessOrder) {
          return new NextResponse(
            JSON.stringify({
              error: "You don't have permission to access this order",
            }),
            {
              status: 403,
              headers: {
                ...Object.fromEntries(secureHeaders),
                "Content-Type": "application/json",
              },
            }
          );
        }
      }

      return NextResponse.next({
        headers: secureHeaders,
      });
    }

    if (url.includes("products") || url.includes("usermanagement")) {
      if (token.role && token.role === "ADMIN") {
        const nextUrl = req.nextUrl.clone();
        const searchParams = nextUrl.searchParams;

        // Validate and sanitize query parameters
        if (!searchParams.has("page")) {
          searchParams.append("page", "1");
        } else {
          // Ensure page is a valid number
          const page = parseInt(searchParams.get("page") || "", 10);
          if (isNaN(page) || page < 1) {
            searchParams.set("page", "1");
          }
        }

        if (!searchParams.has("show")) {
          searchParams.append("show", "10");
        } else {
          // Ensure show is a valid number and within reasonable limits
          const show = parseInt(searchParams.get("show") || "", 10);
          if (isNaN(show) || show < 1 || show > 100) {
            searchParams.set("show", "10");
          }
        }

        return NextResponse.rewrite(nextUrl, {
          headers: secureHeaders,
        });
      }

      return NextResponse.redirect(new URL("/", req.url), {
        headers: secureHeaders,
      });
    } else {
      return NextResponse.next({
        headers: secureHeaders,
      });
    }
  }

  // Handle account page access
  if (url.endsWith("/account")) {
    if (!token) {
      return NextResponse.next({
        headers: secureHeaders,
      });
    } else {
      return NextResponse.redirect(new URL("/dashboard", req.url), {
        headers: secureHeaders,
      });
    }
  }

  // API Route handling with enhanced security
  if (url.startsWith("/api")) {
    // Apply general rate limiting for API endpoints
    // if (url !== "/api/auth/session") {
    //   const rateLimitResult = apiRateLimiter.try(ip);

    //   if (!rateLimitResult.success) {
    //     return new NextResponse(
    //       JSON.stringify({
    //         error: "Too many requests, please try again later",
    //       }),
    //       {
    //         status: 429,
    //         headers: {
    //           ...Object.fromEntries(secureHeaders),
    //           "Content-Type": "application/json",
    //           "Retry-After": String(
    //             Math.ceil(rateLimitResult.remaining / 1000)
    //           ),
    //         },
    //       }
    //     );
    //   }
    // }

    const method: MethodType = req.method as MethodType;
    const role = token?.role as Role | null;

    // Verify route access with enhanced security
    const apiPath = url.replace("/api", "");
    const verifyResult = verifyApiRoute(apiPath, method, role);

    if (!verifyResult.success) {
      if (verifyResult.reason === "AUTHENTICATION_REQUIRED") {
        return new NextResponse(
          JSON.stringify({
            error: "Authentication required",
            code: "UNAUTHENTICATED",
          }),
          {
            status: 401,
            headers: {
              ...Object.fromEntries(secureHeaders),
              "Content-Type": "application/json",
              "WWW-Authenticate": "Bearer",
            },
          }
        );
      }

      return new NextResponse(
        JSON.stringify({
          error: "Access denied",
          code: "FORBIDDEN",
          reason: verifyResult.reason,
        }),
        {
          status: 403,
          headers: {
            ...Object.fromEntries(secureHeaders),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Log sensitive operations for audit purposes
    if (
      ["POST", "PUT", "DELETE", "PATCH"].includes(method) &&
      SENSITIVE_ROUTES.some((route) => url.startsWith(route))
    ) {
      await logSensitiveOperation({
        path: url,
        method,
        userId: token?.sub || null,
        userRole: role || null,
        ip,
        timestamp: new Date().toISOString(),
      });
    }

    // Add security headers to the response
    return NextResponse.next({
      headers: secureHeaders,
    });
  }

  // For all other routes, apply security headers
  return NextResponse.next({
    headers: secureHeaders,
  });
}

// Configure matcher to only run middleware on specific routes
export const config = {
  matcher: ["/dashboard/:path*", "/account", "/api/:path*"],
};

/**
 * Helper function to extract order ID from URL
 */
function extractOrderIdFromUrl(url: string): string | null {
  const match = url.match(/\/order\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Validate if a user has access to a specific order
 */
async function validateOrderAccess(
  orderId: string,
  userId: string | undefined
): Promise<boolean> {
  if (!userId) return false;

  try {
    // Implement logic to check if user owns this order
    // This should connect to your database or API service
    // For example:
    // const orderAccess = await prisma.orders.findFirst({
    //   where: {
    //     id: orderId,
    //     userId: userId
    //   }
    // });
    // return !!orderAccess;

    // Placeholder implementation
    return true;
  } catch (error) {
    console.error("Error validating order access:", error);
    return false;
  }
}

/**
 * Log sensitive operations for security audit
 */
async function logSensitiveOperation(data: {
  path: string;
  method: string;
  userId: string | null;
  userRole: string | null;
  ip: string;
  timestamp: string;
}): Promise<void> {
  try {
    // Implement logging to secure storage
    // This could be a database, log management system, etc.
    console.log("SECURITY AUDIT:", JSON.stringify(data));

    // In production, you might want to use:
    // await prisma.auditLog.create({ data });
  } catch (error) {
    console.error("Error logging sensitive operation:", error);
  }
}
