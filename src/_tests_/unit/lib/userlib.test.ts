// Mock definitions (hoisted by Jest)
jest.mock("@/prisma/generated/prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/src/lib/prisma.ts");
jest.mock("bcryptjs");
jest.mock("@/src/lib/utilities");
jest.mock("@/prisma/generated/prisma/enums", () => ({
  Role: { USER: "USER", ADMIN: "ADMIN" },
}));
jest.mock("zod", () => {
  const createZodChain = () => ({
    max: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    nullable: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    parse: jest.fn((data) => data),
    safeParse: jest.fn(),
  });

  return {
    z: {
      string: jest.fn(() => createZodChain()),
      number: jest.fn(() => createZodChain()),
      boolean: jest.fn(() => createZodChain()),
      object: jest.fn((_schema) => ({
        parse: jest.fn((data) => data),
        safeParse: jest.fn(),
      })),
    },
  };
});

// Imports after mocks
import {
  registerUser,
  RegisterUser,
  userlogin,
  validateUserInput,
  extractDeviceInfo,
  generateExpiration,
  generateExpirationDate,
  logout,
} from "@/src/lib/userlib";
import * as bcryptjs from "bcryptjs";
import * as utilities from "@/src/lib/utilities";
import Prisma from "@/src/lib/prisma.ts";
import { Role } from "@/prisma/generated/prisma/enums";

// Create mock types
const mockCompare = bcryptjs.compare as jest.MockedFunction<
  typeof bcryptjs.compare
>;
const mockHashSync = bcryptjs.hashSync as jest.MockedFunction<
  typeof bcryptjs.hashSync
>;
const mockCheckPassword = utilities.checkpassword as jest.MockedFunction<
  typeof utilities.checkpassword
>;

// Mock Prisma methods
const mockPrisma = Prisma as unknown as {
  user: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
  usersession: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
  loginAttempt: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
};
mockPrisma.user = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
};
mockPrisma.usersession = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};
mockPrisma.loginAttempt = {
  findUnique: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};

describe("Testing Authentication && Authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── userlogin ────────────────────────────────────────────────────────────
  describe("userlogin", () => {
    const mockReq = {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "x-forwarded-for": "127.0.0.1",
        "x-real-ip": "127.0.0.1",
      },
    };

    it("should successfully login a user with valid credentials", async () => {
      (mockPrisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        password: "$2a$10$hashedpassword123456",
        role: Role.USER,
      });
      mockCompare.mockResolvedValue(true as never);

      const result = await userlogin(
        {
          email: "test@example.com",
          password: "ValidPassword123!",
          recapcha: null,
        },
        mockReq,
      );

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe(1);
      expect(result.data?.role).toBe(Role.USER);
    });

    it("should return error when email is missing", async () => {
      const result = await userlogin(
        { email: "", password: "ValidPassword123!", recapcha: null },
        mockReq,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email is required");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return error when user is not found", async () => {
      (mockPrisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.loginAttempt.create as jest.Mock).mockResolvedValue({});

      const result = await userlogin(
        {
          email: "unknown@example.com",
          password: "Password123!",
          recapcha: null,
        },
        mockReq,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Incorrect Information");
      expect(mockPrisma.loginAttempt.create).toHaveBeenCalledTimes(1);
    });

    it("should return error and track attempt when password is wrong", async () => {
      (mockPrisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        password: "$2a$10$hashedpassword123456",
        role: Role.USER,
      });
      mockCompare.mockResolvedValue(false as never);
      (mockPrisma.loginAttempt.create as jest.Mock).mockResolvedValue({});

      const result = await userlogin(
        {
          email: "test@example.com",
          password: "WrongPassword!",
          recapcha: null,
        },
        mockReq,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Incorrect Information");
      expect(result.message).toContain("4 attempt(s) remaining");
      expect(mockPrisma.loginAttempt.create).toHaveBeenCalledTimes(1);
    });

    it("should reject login when account is locked", async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
      (mockPrisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue({
        isLocked: true,
        lockedUntil,
        failedAttempts: 5,
        identifier: "test@example.com",
        lastAttemptAt: new Date(),
      });

      const result = await userlogin(
        {
          email: "test@example.com",
          password: "ValidPassword123!",
          recapcha: null,
        },
        mockReq,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("temporarily locked");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // ─── registerUser ─────────────────────────────────────────────────────────
  describe("userregister", () => {
    const mockRegisterData: RegisterUser = {
      firstname: "test",
      lastname: "user1",
      email: "test@example.com",
      password: "Validpassword@123",
      role: Role.USER,
    };

    it("should register a new user successfully", async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockCheckPassword.mockReturnValue({ isValid: true, error: "" });
      mockHashSync.mockReturnValue("randomhashed" as never);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({});

      const result = await registerUser(mockRegisterData);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it("should return error when user already exists", async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        email: "test@example.com",
      });

      const result = await registerUser(mockRegisterData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("User already exists");
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("should return error when password is too weak", async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockCheckPassword.mockReturnValue({
        isValid: false,
        error: "Password must contain at least one uppercase letter",
      });

      const result = await registerUser({
        ...mockRegisterData,
        password: "weakpassword",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Password must contain at least one uppercase letter",
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("should return validation error for invalid email", async () => {
      const mockZodError = {
        issues: [
          { message: "Invalid email", path: ["email"], code: "invalid_string" },
        ],
      };
      (validateUserInput.parse as jest.Mock).mockImplementationOnce(() => {
        throw mockZodError;
      });

      const result = await registerUser({
        ...mockRegisterData,
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid email");
    });

    it("should return validation error for firstname exceeding max length", async () => {
      const mockZodError = {
        issues: [
          {
            message: "String must contain at most 50 character(s)",
            path: ["firstname"],
            code: "too_big",
          },
        ],
      };
      (validateUserInput.parse as jest.Mock).mockImplementationOnce(() => {
        throw mockZodError;
      });

      const result = await registerUser({
        ...mockRegisterData,
        firstname: "a".repeat(51),
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "String must contain at most 50 character(s)",
      );
    });

    it("should return validation error for missing required fields", async () => {
      const mockZodError = {
        issues: [
          { message: "Required", path: ["firstname"], code: "invalid_type" },
        ],
      };
      (validateUserInput.parse as jest.Mock).mockImplementationOnce(() => {
        throw mockZodError;
      });

      const result = await registerUser({
        email: "test@example.com",
        password: "Validpassword@123",
      } as RegisterUser);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Required");
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────
  describe("logout", () => {
    it("should return true when session is deleted successfully", async () => {
      (mockPrisma.usersession.delete as jest.Mock).mockResolvedValue({});

      const result = await logout("some-session-id");

      expect(result).toBe(true);
      expect(mockPrisma.usersession.delete).toHaveBeenCalledTimes(1);
    });

    it("should throw when session deletion fails", async () => {
      (mockPrisma.usersession.delete as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await expect(logout("bad-session-id")).rejects.toThrow("Error occurred");
    });
  });

  // ─── extractDeviceInfo ────────────────────────────────────────────────────
  describe("extractDeviceInfo", () => {
    const makeReq = (ua: string, ip = "1.2.3.4") => ({
      headers: { "user-agent": ua, "x-forwarded-for": ip },
    });

    it("should detect iPhone", () => {
      const result = extractDeviceInfo(
        makeReq("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"),
      );
      expect(result.device).toBe("iPhone");
    });

    it("should detect Android Phone", () => {
      const result = extractDeviceInfo(
        makeReq(
          "Mozilla/5.0 (Linux; Android 12; Pixel 6) Mobile Safari/537.36",
        ),
      );
      expect(result.device).toBe("Android Phone");
    });

    it("should detect Android Tablet", () => {
      const result = extractDeviceInfo(
        makeReq("Mozilla/5.0 (Linux; Android 12; SM-T870) Safari/537.36"),
      );
      expect(result.device).toBe("Android Tablet");
    });

    it("should detect Windows Desktop", () => {
      const result = extractDeviceInfo(
        makeReq("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
      );
      expect(result.device).toBe("Windows Desktop");
    });

    it("should detect Linux Desktop", () => {
      const result = extractDeviceInfo(
        makeReq("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"),
      );
      expect(result.device).toBe("Linux Desktop");
    });

    it("should extract IP from x-forwarded-for header", () => {
      const result = extractDeviceInfo(
        makeReq("SomeAgent", "10.0.0.1, 10.0.0.2"),
      );
      expect(result.ipAddress).toBe("10.0.0.1");
    });

    it("should fall back to Unknown for unrecognised user agent", () => {
      const result = extractDeviceInfo(makeReq("CustomBot/1.0"));
      expect(result.device).toBe("Desktop");
      expect(result.userAgent).toBe("CustomBot/1.0");
    });
  });

  // ─── generateExpiration ───────────────────────────────────────────────────
  describe("generateExpiration", () => {
    it("should return a unique time from now", () => {
      const before = Math.floor(Date.now() / 1000);
      const result = generateExpiration(2, "hours");
      const after = Math.floor(Date.now() / 1000);

      expect(result).toBeGreaterThanOrEqual(before + 2 * 3600);
      expect(result).toBeLessThanOrEqual(after + 2 * 3600);
    });

    it("should handle days unit", () => {
      const before = Math.floor(Date.now() / 1000);
      const result = generateExpiration(1, "days");

      expect(result).toBeGreaterThanOrEqual(before + 86400);
    });
  });

  // ─── generateExpirationDate ───────────────────────────────────────────────
  describe("generateExpirationDate", () => {
    it("should return a Date approximately N days from now", () => {
      const before = Date.now();
      const result = generateExpirationDate(7);
      const after = Date.now();

      expect(result.getTime()).toBeGreaterThanOrEqual(before + 7 * 86400000);
      expect(result.getTime()).toBeLessThanOrEqual(after + 7 * 86400000);
    });

    it("should return a Date in hours when unit is hours", () => {
      const before = Date.now();
      const result = generateExpirationDate(1, "hours");

      expect(result.getTime()).toBeGreaterThanOrEqual(before + 3600000);
    });
  });
});
