jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    usersession: { findUnique: jest.fn(), deleteMany: jest.fn() },
    user: { count: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn() },
    wishlist: { deleteMany: jest.fn() },
    orderproduct: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
// Files in src/lib import "./prisma"; Jest keys that apart from the alias,
// so point it at the same mock.
jest.mock("../../lib/prisma", () => jest.requireMock("@/src/lib/prisma"));
jest.mock("@/src/lib/session", () => ({ requireAdmin: jest.fn() }));
jest.mock("@/src/lib/confirmIdentity", () => ({ confirmIdentity: jest.fn() }));
jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }));

import Prisma from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/session";
import { confirmIdentity } from "@/src/lib/confirmIdentity";
import {
  getAdminSessionStatus,
  getOrderPageAccess,
  isActiveAdminSession,
} from "@/src/lib/adminGuard";
import { isAdminOnlyRoute } from "@/src/lib/middlewareaction";
import { DELETE, GET } from "@/src/app/api/users/route";
import { hashToken } from "@/src/lib/userlib";
import type { NextRequest } from "next/server";

const db = Prisma as unknown as {
  usersession: { findUnique: jest.Mock; deleteMany: jest.Mock };
  user: { count: jest.Mock; deleteMany: jest.Mock; findMany: jest.Mock };
  wishlist: { deleteMany: jest.Mock };
  orderproduct: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
};
const mockRequireAdmin = requireAdmin as jest.Mock;
const mockConfirmIdentity = confirmIdentity as jest.Mock;

const req = (body: unknown) =>
  ({ json: async () => body }) as unknown as NextRequest;

const future = () => new Date(Date.now() + 60_000);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("isActiveAdminSession", () => {
  it("rejects a missing session id without querying the database", async () => {
    expect(await isActiveAdminSession(undefined)).toBe(false);
    expect(await isActiveAdminSession("")).toBe(false);
    expect(db.usersession.findUnique).not.toHaveBeenCalled();
  });

  it("accepts a live session whose user is an admin in the database", async () => {
    db.usersession.findUnique.mockResolvedValue({
      revoked: false,
      expireAt: future(),
      user: { role: "ADMIN" },
    });

    expect(await isActiveAdminSession("sid")).toBe(true);
    expect(db.usersession.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { refresh_token_hash: hashToken("sid") },
      }),
    );
  });

  it.each([
    ["the session is gone", null],
    [
      "the session was revoked",
      { revoked: true, expireAt: future(), user: { role: "ADMIN" } },
    ],
    [
      "the session expired",
      { revoked: false, expireAt: new Date(0), user: { role: "ADMIN" } },
    ],
    [
      "the user is no longer an admin",
      { revoked: false, expireAt: future(), user: { role: "USER" } },
    ],
  ])("rejects when %s", async (_, row) => {
    db.usersession.findUnique.mockResolvedValue(row);
    expect(await isActiveAdminSession("sid")).toBe(false);
  });

  it("fails closed when the database errors", async () => {
    db.usersession.findUnique.mockRejectedValue(new Error("down"));
    expect(await isActiveAdminSession("sid")).toBe(false);
  });

  describe("with ADMIN_MFA_REQUIRED=true", () => {
    const original = process.env.ADMIN_MFA_REQUIRED;
    beforeEach(() => {
      process.env.ADMIN_MFA_REQUIRED = "true";
    });
    afterEach(() => {
      process.env.ADMIN_MFA_REQUIRED = original;
    });

    const adminSession = (mfaVerified: boolean) => ({
      revoked: false,
      expireAt: future(),
      mfaVerified,
      user: { role: "ADMIN" },
    });

    it("asks an admin login without two-factor to set it up", async () => {
      db.usersession.findUnique.mockResolvedValue(adminSession(false));
      expect(await getAdminSessionStatus("sid")).toBe("mfa_required");
      expect(await isActiveAdminSession("sid")).toBe(false);
    });

    it("lets a login that passed two-factor through", async () => {
      db.usersession.findUnique.mockResolvedValue(adminSession(true));
      expect(await getAdminSessionStatus("sid")).toBe("ok");
    });

    it("still denies non-admins outright", async () => {
      db.usersession.findUnique.mockResolvedValue({
        ...adminSession(true),
        user: { role: "USER" },
      });
      expect(await getAdminSessionStatus("sid")).toBe("denied");
    });
  });

  it("does not require two-factor while ADMIN_MFA_REQUIRED is off", async () => {
    const original = process.env.ADMIN_MFA_REQUIRED;
    process.env.ADMIN_MFA_REQUIRED = "false";
    db.usersession.findUnique.mockResolvedValue({
      revoked: false,
      expireAt: future(),
      mfaVerified: false,
      user: { role: "ADMIN" },
    });
    expect(await getAdminSessionStatus("sid")).toBe("ok");
    process.env.ADMIN_MFA_REQUIRED = original;
  });
});

describe("getOrderPageAccess", () => {
  const original = process.env.ADMIN_MFA_REQUIRED;
  beforeEach(() => {
    process.env.ADMIN_MFA_REQUIRED = "true";
  });
  afterEach(() => {
    process.env.ADMIN_MFA_REQUIRED = original;
  });

  const session = (mfaVerified: boolean, role = "ADMIN") => ({
    revoked: false,
    expireAt: future(),
    mfaVerified,
    user: { role },
  });
  const admin = { role: "ADMIN", buyer_id: "admin-buyer" };

  it("shows every order to an admin who passed two-factor", async () => {
    db.usersession.findUnique.mockResolvedValue(session(true));
    expect(await getOrderPageAccess(admin, "sid")).toEqual({ view: "all" });
  });

  it("sends an admin who hasn't passed two-factor to set it up", async () => {
    db.usersession.findUnique.mockResolvedValue(session(false));
    expect(await getOrderPageAccess(admin, "sid")).toEqual({
      view: "setup_mfa",
    });
  });

  it("denies an admin whose session was demoted or revoked", async () => {
    db.usersession.findUnique.mockResolvedValue(session(true, "USER"));
    expect(await getOrderPageAccess(admin, "sid")).toEqual({ view: "denied" });
  });

  it("limits a customer to their own orders", async () => {
    expect(
      await getOrderPageAccess({ role: "USER", buyer_id: "b-1" }, "sid"),
    ).toEqual({ view: "own", buyerId: "b-1" });
    expect(db.usersession.findUnique).not.toHaveBeenCalled();
  });

  it("never falls back to every order", async () => {
    expect(await getOrderPageAccess({ role: "USER", buyer_id: "" }, "sid")).toEqual(
      { view: "denied" },
    );
    expect(await getOrderPageAccess(undefined, "sid")).toEqual({
      view: "denied",
    });
    expect(
      await getOrderPageAccess({ role: "EDITOR", buyer_id: "b-1" }, "sid"),
    ).toEqual({ view: "denied" });
  });
});

describe("isAdminOnlyRoute", () => {
  it("flags admin-only routes", () => {
    expect(isAdminOnlyRoute("/users", "DELETE")).toBe(true);
    expect(isAdminOnlyRoute("/products/crud", "POST")).toBe(true);
  });

  it("does not flag public, user or unlisted routes", () => {
    expect(isAdminOnlyRoute("/products", "GET")).toBe(false);
    expect(isAdminOnlyRoute("/order", "GET")).toBe(false);
    expect(isAdminOnlyRoute("/promotion/check", "PUT")).toBe(false);
  });
});

describe("/api/users", () => {
  const admin = { userId: 1, sessionid: "sid" };

  beforeEach(() => {
    db.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));
    db.user.deleteMany.mockResolvedValue({ count: 2 });
    db.user.count.mockResolvedValue(0);
    mockConfirmIdentity.mockResolvedValue({ ok: true });
  });

  it("GET refuses non-admins", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const res = await GET({} as NextRequest);
    expect(res.status).toBe(403);
  });

  it("GET pages correctly past a shrunken end and hides secrets", async () => {
    mockRequireAdmin.mockResolvedValue(admin);
    db.user.count.mockResolvedValue(3); // page 2 of 10 is now past the end
    db.user.findMany.mockResolvedValue([
      { id: 9, password: "hash", totpSecret: "v1:enc", lastTotpStep: 5 },
    ]);

    const res = await GET({
      nextUrl: { searchParams: new URLSearchParams("p=2&lt=10") },
    } as unknown as NextRequest);
    const body = await res.json();

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 10 }),
    );
    expect(body.data[0]).toEqual({ id: 9, password: null });
  });

  it("DELETE refuses non-admins without deleting anything", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const res = await DELETE(req({ id: 5 }));
    expect(res.status).toBe(403);
    expect(db.user.deleteMany).not.toHaveBeenCalled();
  });

  it.each([
    ["no id", {}],
    ["an empty list", { userIds: [] }],
    ["a non-numeric id", { userIds: [2, "abc"] }],
    ["a negative id", { id: -1 }],
  ])(
    "DELETE rejects %s and never runs an unfiltered delete",
    async (_, body) => {
      mockRequireAdmin.mockResolvedValue(admin);
      const res = await DELETE(req(body));
      expect(res.status).toBe(400);
      expect(db.user.deleteMany).not.toHaveBeenCalled();
      expect(db.wishlist.deleteMany).not.toHaveBeenCalled();
    },
  );

  it("DELETE removes the selected users only", async () => {
    mockRequireAdmin.mockResolvedValue(admin);
    const res = await DELETE(req({ userIds: [2, 3, 3] }));

    expect(res.status).toBe(200);
    expect(db.user.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [2, 3] }, role: { not: "ADMIN" } },
    });
    expect(db.wishlist.deleteMany).toHaveBeenCalledWith({
      where: { uid: { in: [2, 3] } },
    });
  });

  it("DELETE needs the admin to confirm with a code first", async () => {
    mockRequireAdmin.mockResolvedValue(admin);
    mockConfirmIdentity.mockResolvedValue({
      ok: false,
      status: 400,
      message: "Incorrect or already used two-factor code",
    });

    const res = await DELETE(req({ userIds: [2], code: "000000" }));

    expect(res.status).toBe(400);
    expect(mockConfirmIdentity).toHaveBeenCalledWith(1, "delete_users", {
      userIds: [2],
      code: "000000",
    });
    expect(db.user.deleteMany).not.toHaveBeenCalled();
    expect(db.wishlist.deleteMany).not.toHaveBeenCalled();
  });

  it("DELETE refuses to delete the caller's own account", async () => {
    mockRequireAdmin.mockResolvedValue(admin);
    const res = await DELETE(req({ userIds: [1, 2] }));
    expect(res.status).toBe(400);
    expect(db.user.deleteMany).not.toHaveBeenCalled();
  });

  it("DELETE refuses to delete admin accounts", async () => {
    mockRequireAdmin.mockResolvedValue(admin);
    db.user.count.mockResolvedValue(1);
    const res = await DELETE(req({ id: 7 }));
    expect(res.status).toBe(403);
    expect(db.user.deleteMany).not.toHaveBeenCalled();
  });
});
