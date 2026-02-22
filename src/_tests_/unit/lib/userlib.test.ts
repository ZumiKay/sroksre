// Mock definitions (hoisted by Jest)
jest.mock("@/prisma/generated/prisma/client");
jest.mock("@/src/lib/prisma");
jest.mock("bcryptjs");
jest.mock("@/src/lib/utilities");
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
      object: jest.fn((schema) => ({
        parse: jest.fn((data) => data),
        safeParse: jest.fn(),
      })),
    },
  };
});

// Imports after mocks
import { registerUser, RegisterUser, userlogin } from "@/src/lib/userlib";
import { z } from "zod";
import * as bcryptjs from "bcryptjs";
import * as utilities from "@/src/lib/utilities";
import Prisma from "@/src/lib/prisma";
import { Role } from "@/prisma/generated/prisma/enums";

// Create mock types
const mockCompare = bcryptjs.compare as jest.MockedFunction<
  typeof bcryptjs.compare
>;
const mockGenSaltSync = bcryptjs.genSaltSync as jest.MockedFunction<
  typeof bcryptjs.genSaltSync
>;
const mockHashSync = bcryptjs.hashSync as jest.MockedFunction<
  typeof bcryptjs.hashSync
>;
const mockGetOneWeekFromToday =
  utilities.getOneWeekFromToday as jest.MockedFunction<
    typeof utilities.getOneWeekFromToday
  >;
const mockCheckPassword = utilities.checkpassword as jest.MockedFunction<
  typeof utilities.checkpassword
>;

// Mock Prisma methods
const mockPrisma = Prisma as {
  //Types
  user: { findFirst: jest.Func; create: jest.Func };
  usersession: { create: jest.Func; findFirst: jest.Func };
};
mockPrisma.user = {
  findFirst: jest.fn(),
  create: jest.fn(),
};
mockPrisma.usersession = {
  findFirst: jest.fn(),
  create: jest.fn(),
};

describe("Testing Authentication && Authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("userlogin", () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      password: "$2a$10$hashedpassword123456",
      role: Role.USER,
      firstname: "Test",
      lastname: "User",
      phonenumber: null,
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isverify: false,
      vfy: null,
      oauthId: null,
    };

    const mockSession = {
      session_id: "session-123",
      user_id: 1,
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    const mockReq = {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "x-forwarded-for": "127.0.0.1",
        "x-real-ip": "127.0.0.1",
      },
    };

    it("should successfully login a user with valid credentials", async () => {
      // Arrange
      mockGetOneWeekFromToday.mockReturnValue(mockSession.expireAt);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      mockCompare.mockResolvedValue(true as never);
      (mockPrisma.usersession.create as jest.Mock).mockResolvedValue(
        mockSession as never,
      );

      // Act
      const result = await userlogin(
        {
          email: "test@example.com",
          password: "ValidPassword123!",
          recapcha: null,
        },
        mockReq,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.userId).toBe(1);
      expect(result.data?.role).toBe(Role.USER);
      expect(result.data?.sessionid).toBe(mockSession.session_id);
      expect(mockPrisma.usersession.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("userregister", () => {
    let mockRegisterData: RegisterUser = {
      firstname: "test",
      lastname: "user1",
      email: "test@example.com",
      password: "Validpassword@123",
      role: Role.USER,
    };

    it("Should Register user", async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      mockCheckPassword.mockReturnValue({
        isValid: true,
        error: "",
      });
      mockHashSync.mockReturnValue("randomhashed");
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({});

      const register = await registerUser(mockRegisterData);

      expect(register).toEqual({ success: true, message: undefined });
    });
    it("Should return validation error for invalid email", async () => {
      // Arrange - Mock Zod to throw validation error
      const mockZodError = {
        issues: [
          {
            message: "Invalid email",
            path: ["email"],
            code: "invalid_string",
          },
        ],
      };

      // Mock z.object to return a parse function that throws
      (z.object as jest.Mock).mockReturnValue({
        parse: jest.fn(() => {
          throw mockZodError;
        }),
      });

      const invalidData: RegisterUser = {
        firstname: "test",
        lastname: "user1",
        email: "invalid-email", // Invalid email format
        password: "Validpassword@123",
        role: Role.USER,
      };

      // Act
      const result = await registerUser(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid email");
    });

    it("Should return validation error for firstname exceeding max length", async () => {
      // Arrange
      const mockZodError = {
        issues: [
          {
            message: "String must contain at most 50 character(s)",
            path: ["firstname"],
            code: "too_big",
          },
        ],
      };

      (z.object as jest.Mock).mockReturnValue({
        parse: jest.fn(() => {
          throw mockZodError;
        }),
      });

      const invalidData: RegisterUser = {
        firstname: "a".repeat(51), // Exceeds 50 character limit
        lastname: "user",
        email: "test@example.com",
        password: "Validpassword@123",
        role: Role.USER,
      };

      // Act
      const result = await registerUser(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "String must contain at most 50 character(s)",
      );
    });

    it("Should return validation error for missing required fields", async () => {
      // Arrange
      const mockZodError = {
        issues: [
          {
            message: "Required",
            path: ["firstname"],
            code: "invalid_type",
          },
        ],
      };

      (z.object as jest.Mock).mockReturnValue({
        parse: jest.fn(() => {
          throw mockZodError;
        }),
      });

      const invalidData = {
        email: "test@example.com",
        password: "Validpassword@123",
        // Missing firstname
      } as RegisterUser;

      // Act
      const result = await registerUser(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Required");
    });

    it("Should successfully register user when validation passes", async () => {
      // Arrange - Reset Zod mock to pass validation
      (z.object as jest.Mock).mockReturnValue({
        parse: jest.fn((data) => data), // Pass through data
      });

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      mockCheckPassword.mockReturnValue({
        isValid: true,
        error: "",
      });
      mockHashSync.mockReturnValue("randomhashed");
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({});

      const validData: RegisterUser = {
        firstname: "test",
        lastname: "user1",
        email: "test@example.com",
        password: "Validpassword@123",
        role: Role.USER,
      };

      // Act
      const result = await registerUser(validData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });
  });
});
