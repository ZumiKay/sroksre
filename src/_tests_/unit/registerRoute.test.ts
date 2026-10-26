//Module mock
jest.mock("@/src/lib/prisma");
jest.mock("@/src/lib/session", () => ({ getUser: jest.fn() }));
jest.mock("@/src/lib/userlib", () => ({ registerUser: jest.fn() }));
jest.mock("@/src/lib/turnstile", () => ({ verifyTurnstile: jest.fn() }));

// ── Imports ───────────────────────────────────────────────────────────────────
import { POST, PUT } from "@/src/app/api/auth/register/route";
import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { registerUser } from "@/src/lib/userlib";
import { verifyTurnstile } from "@/src/lib/turnstile";
import type { NextRequest } from "next/server";

const mockGetUser = getUser as jest.Mock;
const mockRegisterUser = registerUser as jest.Mock;
const mockVerify = verifyTurnstile as jest.Mock;
const mockFindUnique = Prisma.user.findUnique as unknown as jest.Mock;
const mockUpdate = Prisma.user.update as unknown as jest.Mock;

const req = (body: object) =>
  ({ json: async () => body }) as unknown as NextRequest;

const signup = {
  email: "a@b.com",
  password: "Password1!",
  firstname: "A",
  recapcha: "tok",
};

describe("POST /api/auth/register captcha", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockRegisterUser.mockResolvedValue({ success: true });
  });

  it("rejects a public sign-up when Turnstile fails, without registering", async () => {
    mockGetUser.mockResolvedValue(null);
    mockVerify.mockResolvedValue({ success: false });

    const res = await POST(req(signup));

    expect(res.status).toBe(400);
    expect(mockVerify).toHaveBeenCalledWith("tok");
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("rejects a direct API call with no token", async () => {
    mockGetUser.mockResolvedValue(null);
    mockVerify.mockResolvedValue({ success: false });

    const res = await POST(req({ ...signup, recapcha: undefined }));

    expect(res.status).toBe(400);
    expect(mockVerify).toHaveBeenCalledWith(undefined);
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("registers a public sign-up when Turnstile passes", async () => {
    mockGetUser.mockResolvedValue({ role: "USER" });
    mockVerify.mockResolvedValue({ success: true });

    const res = await POST(req(signup));

    expect(res.status).toBe(200);
    expect(mockRegisterUser).toHaveBeenCalledWith(signup);
  });

  it("lets an admin create a user without a captcha", async () => {
    mockGetUser.mockResolvedValue({ role: "ADMIN" });

    const res = await POST(req({ ...signup, recapcha: null }));

    expect(res.status).toBe(200);
    expect(mockVerify).not.toHaveBeenCalled();
    expect(mockRegisterUser).toHaveBeenCalled();
  });
});

describe("PUT /api/auth/register (admin user edit)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it.each([null, { role: "USER" }, { role: "EDITOR" }])(
    "rejects a non-admin caller (%p) without touching the database",
    async (session) => {
      mockGetUser.mockResolvedValue(session);

      const res = await PUT(req({ id: 1, role: "ADMIN" }));

      expect(res.status).toBe(403);
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    },
  );

  it("only writes the editable fields", async () => {
    mockGetUser.mockResolvedValue({ role: "ADMIN" });
    mockFindUnique.mockResolvedValue({ role: "USER" });

    const res = await PUT(
      req({
        id: 7,
        firstname: "New",
        lastname: "",
        email: "new@b.com",
        phonenumber: "",
        role: "EDITOR",
        password: "hacked",
        vfy: "123",
        buyer_id: "x",
        oauthId: "y",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        firstname: "New",
        lastname: null,
        email: "new@b.com",
        phonenumber: null,
        role: "EDITOR",
      },
    });
  });

  it("does not change an existing admin's role", async () => {
    mockGetUser.mockResolvedValue({ role: "ADMIN" });
    mockFindUnique.mockResolvedValue({ role: "ADMIN" });

    await PUT(req({ id: 2, firstname: "Boss", role: "USER" }));

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { firstname: "Boss" },
    });
  });

  it("ignores an invalid role value", async () => {
    mockGetUser.mockResolvedValue({ role: "ADMIN" });
    mockFindUnique.mockResolvedValue({ role: "USER" });

    await PUT(req({ id: 3, role: "SUPERUSER" }));

    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 3 }, data: {} });
  });

  it.each([undefined, "abc", 0, -1, 1.5])(
    "rejects an invalid id (%p)",
    async (id) => {
      mockGetUser.mockResolvedValue({ role: "ADMIN" });

      const res = await PUT(req({ id, firstname: "x" }));

      expect(res.status).toBe(400);
      expect(mockUpdate).not.toHaveBeenCalled();
    },
  );

  it("returns 404 for an unknown user", async () => {
    mockGetUser.mockResolvedValue({ role: "ADMIN" });
    mockFindUnique.mockResolvedValue(null);

    const res = await PUT(req({ id: 99, firstname: "x" }));

    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
