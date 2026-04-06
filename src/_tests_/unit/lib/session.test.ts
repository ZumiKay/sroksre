jest.mock("../../../lib/prisma", () => ({
  __esModule: true,
  default: {
    usersession: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock("@/prisma/generated/prisma/client");
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/src/lib/userlib", () => ({
  ...jest.requireActual("@/src/lib/userlib"),
  hashToken: jest.fn(),
}));
jest.mock("@/src/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

import Prisma from "../../../lib/prisma";
import { verifySessionInDB } from "@/src/lib/session";
import { generateExpirationDate } from "@/src/lib/userlib";
import { Usersessiontype } from "@/src/types/user.type";

const mockFindUnique = Prisma.usersession.findUnique as jest.Mock;
const mockDelete = Prisma.usersession.delete as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("Error Handler", () => {
  test("Throw DB Error", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB Error"));

    const verify = await verifySessionInDB("");

    expect(verify).toStrictEqual({
      success: false,
    });
  });

  test("Throw Expired Error", async () => {
    const expiredSession: Partial<Usersessiontype> = {
      sessionid: "expiredId",
      refresh_token_hash: "expiredRefreshToken",
      userId: 1,
      user: {
        id: 1,
        recapcha: null,
      },
      expireAt: generateExpirationDate(-1, "days"),
    };

    mockFindUnique.mockResolvedValue(expiredSession);
    mockDelete.mockResolvedValue({});

    const verify = await verifySessionInDB("expiredId");

    expect(verify).toStrictEqual({ success: false });
    expect(mockDelete).toHaveBeenCalledWith({
      where: { sessionid: "expiredId" },
    });
  });
});

describe("Session Not Found", () => {
  test("Returns false when session does not exist in DB", async () => {
    mockFindUnique.mockResolvedValue(null);

    const verify = await verifySessionInDB("nonExistentId");

    expect(verify).toStrictEqual({ success: false });
  });
});

describe("Revoked Session", () => {
  test("Returns false and deletes revoked session", async () => {
    const revokedSession: Partial<Usersessiontype> = {
      sessionid: "revokedId",
      refresh_token_hash: "revokedRefreshToken",
      userId: 1,
      user: { id: 1, recapcha: null },
      revoked: true,
    };

    mockFindUnique.mockResolvedValue(revokedSession);
    mockDelete.mockResolvedValue({});

    const verify = await verifySessionInDB("revokedId");

    expect(verify).toStrictEqual({ success: false });
    expect(mockDelete).toHaveBeenCalledWith({
      where: { sessionid: "revokedId" },
    });
  });
});

describe("Valid Session", () => {
  test("Returns success with user for a valid non-expired session", async () => {
    const userData = { id: 1, recapcha: null };
    const validSession: Partial<Usersessiontype> = {
      sessionid: "validId",
      refresh_token_hash: "validRefreshToken",
      userId: 1,
      user: userData,
      expireAt: generateExpirationDate(7, "days"),
      revoked: false,
    };

    mockFindUnique.mockResolvedValue(validSession);

    const verify = await verifySessionInDB("validId");

    expect(verify).toStrictEqual({ success: true, user: userData });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
