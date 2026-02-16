import * as jose from "jose";
import { z } from "zod";
import { compare, genSaltSync, hashSync } from "bcryptjs";
import { checkpassword, getOneWeekFromToday } from "./utilities";
import Prisma from "./prisma";
import { Role } from "@/prisma/generated/prisma/enums";
import { userdata, Usersessiontype } from "../types/user.type";
import { createHash } from "crypto";

export interface RegisterUser {
  id?: number;
  oauthId?: string;
  firstname: string;
  email: string;
  password: string;
  lastname?: string;
  role?: Role;
  type?: string;
  phonenumber?: string;
}

export interface DeviceInfo {
  device: string;
  userAgent: string;
  ipAddress: string;
}

interface AuthReturnType {
  success: boolean;
  data?: Partial<Usersessiontype>;
  message?: string;
}

//encode secret
export const secretkey = new TextEncoder().encode(
  process.env.JWT_SECRET as string,
);

/**@requires For Usersession ONLY */
const generateSessionId = (): string => {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}-${process.env.NEXTAUTH_SECRET}`)
    .digest("hex");
};

export async function createUniqueSessionId(): Promise<string> {
  let sessionId = generateSessionId();

  while (true) {
    const exists = await Prisma.usersession.findUnique({
      where: { sessionid: sessionId },
      select: { sessionid: true },
    });

    if (!exists) return sessionId;
    sessionId = generateSessionId();
  }
}

export const extractDeviceInfo = (request: Request | any): DeviceInfo => {
  // Handle both Request object and NextAuth req object
  const getHeader = (name: string) => {
    if (request.headers?.get) {
      return request.headers.get(name);
    }
    // Handle plain object headers (NextAuth format)
    return request.headers?.[name] || request.headers?.[name.toLowerCase()];
  };

  const userAgent = getHeader("user-agent") || "Unknown";
  const ua = userAgent.toLowerCase();

  // Extract IP address from various possible headers
  const ipAddress =
    getHeader("cf-connecting-ip") ||
    getHeader("x-forwarded-for")?.split(",")[0].trim() ||
    getHeader("x-real-ip") ||
    "Unknown";

  // Determine device type from user agent with detailed detection
  let device: string;

  if (ua.includes("iphone")) {
    device = "iPhone";
  } else if (ua.includes("ipad")) {
    device = "iPad";
  } else if (ua.includes("android")) {
    // Distinguish between Android phone and tablet
    if (ua.includes("mobile")) {
      device = "Android Phone";
    } else {
      device = "Android Tablet";
    }
  } else if (ua.includes("macintosh") || ua.includes("mac os x")) {
    // Check if it's a MacBook or Mac Desktop
    if (ua.includes("mobile") || ua.includes("safari")) {
      device = "MacBook";
    } else {
      device = "Mac Desktop";
    }
  } else if (ua.includes("windows")) {
    device = "Windows Desktop";
  } else if (ua.includes("linux")) {
    device = "Linux Desktop";
  } else if (ua.includes("mobile")) {
    device = "Mobile";
  } else if (ua.includes("tablet")) {
    device = "Tablet";
  } else {
    device = "Desktop";
  }

  return { device, userAgent, ipAddress };
};

/**
 * Generate new expiration timestamp
 * @param duration - Time duration number
 * @param unit - Time unit ('seconds' | 'minutes' | 'hours' | 'days')
 * @returns Unix timestamp in seconds (for JWT cexp claim)
 */
export const generateExpiration = (
  duration: number,
  unit: "seconds" | "minutes" | "hours" | "days" = "hours",
): number => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  const multipliers = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
  };

  return now + duration * multipliers[unit];
};

/**
 * Generate new expiration Date object
 * @param duration - Time duration number
 * @param unit - Time unit ('seconds' | 'minutes' | 'hours' | 'days')
 * @returns Date object for database expiration fields
 */
export const generateExpirationDate = (
  duration: number,
  unit: "seconds" | "minutes" | "hours" | "days" = "days",
): Date => {
  const multipliers = {
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
  };

  return new Date(Date.now() + duration * multipliers[unit]);
};

export const createToken = async (payload: {
  userid: number;
  sessionid: string;
}): Promise<string> => {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretkey);
};

export const validateUserInput = z.object({
  firstname: z.string().max(50),
  lastname: z.string().max(50),
  email: z.string().email(),
});

export const verifyUserLoginInput = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const hashPassword = (password: string): string => {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
};

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

// Helper function to create user session
const createUserSession = async (
  userId: number,
  deviceInfo: DeviceInfo,
): Promise<string> => {
  const refreshToken = await createUniqueSessionId();

  await Prisma.usersession.create({
    data: {
      refresh_token_hash: hashToken(refreshToken),
      userId,
      expireAt: getOneWeekFromToday(),
      ...deviceInfo,
    },
  });

  return refreshToken;
};

/**
 * Login Attempt Tracking Configuration
 */
const LOGIN_ATTEMPT_CONFIG = {
  MAX_ATTEMPTS: 5, // Maximum failed attempts before lockout
  LOCKOUT_DURATION_MINUTES: 15, // Duration of lockout in minutes
  ATTEMPT_WINDOW_MINUTES: 30, // Time window to track attempts
};

/**
 * Check if account is currently locked
 * @param identifier - Email or IP address
 * @returns Lock status and remaining time
 */
export const checkAccountLockStatus = async (
  identifier: string,
): Promise<{
  isLocked: boolean;
  remainingTime?: number;
  attempts?: number;
}> => {
  try {
    const attempt = await Prisma.loginAttempt.findUnique({
      where: { identifier },
    });

    if (!attempt) {
      return { isLocked: false, attempts: 0 };
    }

    // Check if account is locked and lock hasn't expired
    if (attempt.isLocked && attempt.lockedUntil) {
      const now = new Date();
      if (now < attempt.lockedUntil) {
        const remainingMs = attempt.lockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        return {
          isLocked: true,
          remainingTime: remainingMinutes,
          attempts: attempt.failedAttempts,
        };
      } else {
        // Lock expired, reset the attempt
        await Prisma.loginAttempt.update({
          where: { identifier },
          data: {
            isLocked: false,
            lockedUntil: null,
            failedAttempts: 0,
            lastAttemptAt: now,
          },
        });
        return { isLocked: false, attempts: 0 };
      }
    }

    return {
      isLocked: false,
      attempts: attempt.failedAttempts,
    };
  } catch (error) {
    console.log("Error checking lock status:", error);
    return { isLocked: false, attempts: 0 };
  }
};

/**
 * Record a failed login attempt
 * @param identifier - Email or IP address
 * @returns Updated lock status
 */
export const recordFailedLoginAttempt = async (
  identifier: string,
): Promise<{
  isLocked: boolean;
  remainingTime?: number;
  attempts: number;
}> => {
  try {
    const now = new Date();
    const attemptWindowStart = new Date(
      now.getTime() - LOGIN_ATTEMPT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60 * 1000,
    );

    const existingAttempt = await Prisma.loginAttempt.findUnique({
      where: { identifier },
    });

    if (!existingAttempt) {
      // Create new attempt record
      await Prisma.loginAttempt.create({
        data: {
          identifier,
          failedAttempts: 1,
          lastAttemptAt: now,
        },
      });
      return { isLocked: false, attempts: 1 };
    }

    // Reset attempts if last attempt was outside the window
    const shouldReset = existingAttempt.lastAttemptAt < attemptWindowStart;
    const newAttemptCount = shouldReset
      ? 1
      : existingAttempt.failedAttempts + 1;

    // Check if account should be locked
    const shouldLock = newAttemptCount >= LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(
          now.getTime() +
            LOGIN_ATTEMPT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000,
        )
      : null;

    await Prisma.loginAttempt.update({
      where: { identifier },
      data: {
        failedAttempts: newAttemptCount,
        isLocked: shouldLock,
        lockedUntil,
        lastAttemptAt: now,
      },
    });

    return {
      isLocked: shouldLock,
      remainingTime: shouldLock
        ? LOGIN_ATTEMPT_CONFIG.LOCKOUT_DURATION_MINUTES
        : undefined,
      attempts: newAttemptCount,
    };
  } catch (error) {
    console.log("Error recording failed attempt:", error);
    return { isLocked: false, attempts: 0 };
  }
};

/**
 * Clear login attempts on successful login
 * @param identifier - Email or IP address
 */
export const clearLoginAttempts = async (identifier: string): Promise<void> => {
  try {
    const existingAttempt = await Prisma.loginAttempt.findUnique({
      where: { identifier },
    });

    if (existingAttempt) {
      await Prisma.loginAttempt.update({
        where: { identifier },
        data: {
          failedAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        },
      });
    }
  } catch (error) {
    console.log("Error clearing login attempts:", error);
  }
};

/**Login method
 * @param credential - User credentials
 * @param req - Request object for device info extraction
 * @returns Authentication result with session data
 */
export const userlogin = async (
  credential: userdata,
  req: Request | any,
): Promise<AuthReturnType> => {
  try {
    // Validate email exists
    if (!credential.email) {
      return { success: false, message: "Email is required" };
    }

    const identifier = credential.email;

    // Check if account is locked
    const lockStatus = await checkAccountLockStatus(identifier);
    if (lockStatus.isLocked) {
      return {
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockStatus.remainingTime} minute(s).`,
      };
    }

    const user = await Prisma.user.findUnique({
      where: { email: credential.email },
      select: { id: true, password: true, role: true },
    });

    if (!user) {
      // Record failed attempt for non-existent user
      await recordFailedLoginAttempt(identifier);
      return { success: false, message: "Incorrect Information" };
    }

    const isValidPassword = await compare(
      credential.password as string,
      user.password,
    );

    if (!isValidPassword) {
      // Record failed attempt
      const attemptResult = await recordFailedLoginAttempt(identifier);

      if (attemptResult.isLocked) {
        return {
          success: false,
          message: `Too many failed attempts. Account is locked for ${attemptResult.remainingTime} minute(s).`,
        };
      }

      const remainingAttempts =
        LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS - attemptResult.attempts;
      return {
        success: false,
        message: `Incorrect Information. ${remainingAttempts} attempt(s) remaining before account lockout.`,
      };
    }

    // Successful login - clear any failed attempts
    await clearLoginAttempts(identifier);

    const deviceInfo = extractDeviceInfo(req);
    const sessionid = await createUserSession(user.id, deviceInfo);

    return {
      success: true,
      data: {
        userId: user.id,
        sessionid,
        role: user.role,
        ...deviceInfo,
      },
    };
  } catch (error: unknown) {
    console.log("Login error:", error);
    return { success: false, message: "Error occurred" };
  }
};

/**Logout method
 * @param sessionid - Session identifier to invalidate
 * @returns True if logout successful
 */
export const logout = async (sessionid: string): Promise<boolean> => {
  try {
    await Prisma.usersession.delete({
      where: {
        refresh_token_hash: hashToken(sessionid),
      },
    });
    return true;
  } catch (error) {
    console.log("Logout error:", error);
    throw new Error("Error occurred");
  }
};

interface RegisterReturnType {
  success: boolean;
  message?: string;
}

export const registerUser = async (
  data: RegisterUser,
): Promise<RegisterReturnType> => {
  try {
    validateUserInput.parse(data);

    const userExists = await Prisma.user.findUnique({
      where: { email: data.email },
      select: { email: true },
    });

    if (userExists) {
      return { success: false, message: "User already exists" };
    }

    const passwordValidation = checkpassword(data.password);
    if (!passwordValidation.isValid) {
      return { success: false, message: passwordValidation.error };
    }

    const userData = {
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname ?? null,
      password: hashPassword(data.password),
    };

    if (!data.id) {
      await Prisma.user.create({ data: userData });
    } else {
      await Prisma.user.update({
        where: { id: data.id },
        data: { ...userData, vfy: null },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.log("Register user error:", error);
    return {
      success: false,
      message: error.issues?.[0]?.message || "Registration failed",
    };
  }
};

export const handleCheckandRegisterUser = async ({
  data,
}: {
  data: RegisterUser;
}): Promise<AuthReturnType> => {
  try {
    const existingUser = await Prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, role: true, email: true },
    });

    if (existingUser) {
      return {
        success: true,
        data: {
          userId: existingUser.id,
        },
      };
    }

    const createdUser = await Prisma.user.create({
      data: {
        ...data,
        password: hashPassword(data.password),
      },
      select: { id: true, role: true, email: true },
    });

    return {
      success: true,
      message: "User created successfully",
      data: {
        userId: createdUser.id,
      },
    };
  } catch (error) {
    console.log("Register user error:", error);
    return {
      success: false,
      message: "Error occurred",
    };
  }
};

export const getOAuthInfo = async (
  oauthId: string,
  email: string,
  deviceInfo?: Pick<
    Usersessiontype,
    "device" | "userAgent" | "ipAddress"
  > | null,
): Promise<{
  id: number;
  oauthId: string;
  sessionid: string;
  role: Role;
} | null> => {
  try {
    const user = await Prisma.user.findFirst({
      where: { OR: [{ email }, { oauthId }] },
      select: { id: true, oauthId: true, role: true },
    });

    if (!user) return null;

    const defaultDeviceInfo = {
      device: "Unknown",
      userAgent: "OAuth Provider",
      ipAddress: "Unknown",
    };

    const sessionid = await createUserSession(
      user.id,
      (deviceInfo as any) || defaultDeviceInfo,
    );

    return {
      id: user.id,
      oauthId: user.oauthId || oauthId,
      sessionid,
      role: user.role,
    };
  } catch (error) {
    console.log("OAuth info error:", error);
    return null;
  }
};
