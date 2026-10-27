//Module mock
jest.mock("@/src/lib/prisma");
jest.mock("@/src/lib/emailVerification", () => ({
  issueSignupCode: jest.fn(),
  issueResetToken: jest.fn(),
  deleteVerification: jest.fn(),
  checkCode: jest.fn(),
  CHECK_FAILURE_MESSAGE: {
    invalid: "Incorrect code",
    expired: "Code expired, please request a new one",
    too_many_attempts: "Too many attempts, please request a new code",
  },
}));
jest.mock("@/src/lib/verificationEmail", () => ({
  sendVerificationCodeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
import { POST } from "@/src/app/api/users/vfy/route";
import { POST as CHECK } from "@/src/app/api/users/vfy/check/route";
import Prisma from "@/src/lib/prisma";
import {
  checkCode,
  deleteVerification,
  issueResetToken,
  issueSignupCode,
} from "@/src/lib/emailVerification";
import {
  sendPasswordResetEmail,
  sendVerificationCodeEmail,
} from "@/src/lib/verificationEmail";
import type { NextRequest } from "next/server";

const mockFindUser = Prisma.user.findUnique as unknown as jest.Mock;
const mockIssueCode = issueSignupCode as jest.Mock;
const mockIssueReset = issueResetToken as jest.Mock;
const mockDelete = deleteVerification as jest.Mock;
const mockCheck = checkCode as jest.Mock;
const mockSendCode = sendVerificationCodeEmail as jest.Mock;
const mockSendReset = sendPasswordResetEmail as jest.Mock;

const req = (body: unknown) =>
  ({ json: async () => body }) as unknown as NextRequest;

const CODE = "482913";
const TOKEN = "T".repeat(43);

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  mockIssueCode.mockResolvedValue({ ok: true, id: 1, secret: CODE });
  mockIssueReset.mockResolvedValue({ ok: true, id: 2, secret: TOKEN });
  mockSendCode.mockResolvedValue({ success: true });
  mockSendReset.mockResolvedValue({ success: true });
});

describe("POST /api/users/vfy — sign-up code", () => {
  it("emails the code and never returns it", async () => {
    mockFindUser.mockResolvedValue(null);

    const res = await POST(req({ email: "new@b.com", type: "register" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockSendCode).toHaveBeenCalledWith("new@b.com", CODE, "signup");
    expect(JSON.stringify(body)).not.toContain(CODE);
  });

  it("rejects an email that is already registered", async () => {
    mockFindUser.mockResolvedValue({ id: 3 });

    const res = await POST(req({ email: "taken@b.com", type: "register" }));

    expect(res.status).toBe(409);
    expect(mockIssueCode).not.toHaveBeenCalled();
  });

  it("returns 429 during the resend cooldown", async () => {
    mockFindUser.mockResolvedValue(null);
    mockIssueCode.mockResolvedValue({ ok: false, reason: "cooldown" });

    const res = await POST(req({ email: "new@b.com", type: "register" }));

    expect(res.status).toBe(429);
    expect(mockSendCode).not.toHaveBeenCalled();
  });

  it("deletes the code if the email fails to send, so the user can retry", async () => {
    mockFindUser.mockResolvedValue(null);
    mockSendCode.mockResolvedValue({ success: false });

    const res = await POST(req({ email: "new@b.com", type: "register" }));

    expect(res.status).toBe(502);
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it.each([
    { email: "not-an-email", type: "register" },
    { email: "a@b.com", type: "something" },
    { type: "register" },
    null,
  ])("rejects bad input %p", async (body) => {
    const res = await POST(req(body));

    expect(res.status).toBe(400);
    expect(mockIssueCode).not.toHaveBeenCalled();
    expect(mockIssueReset).not.toHaveBeenCalled();
  });
});

describe("POST /api/users/vfy — forgot password", () => {
  it("emails a reset link to an existing account and never returns the token", async () => {
    mockFindUser.mockResolvedValue({ id: 5 });

    const res = await POST(req({ email: "user@b.com", type: "forgot" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockIssueReset).toHaveBeenCalledWith(5, "user@b.com");
    expect(mockSendReset).toHaveBeenCalledWith("user@b.com", TOKEN);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });

  it("gives the same reply for an unknown email and sends nothing", async () => {
    mockFindUser.mockResolvedValueOnce({ id: 5 });
    const known = await POST(req({ email: "user@b.com", type: "forgot" }));

    mockFindUser.mockResolvedValueOnce(null);
    const unknown = await POST(req({ email: "nobody@b.com", type: "forgot" }));

    expect(unknown.status).toBe(known.status);
    expect(await unknown.json()).toEqual(await known.json());
    expect(mockIssueReset).toHaveBeenCalledTimes(1);
    expect(mockSendReset).toHaveBeenCalledTimes(1);
  });

  it("gives the same reply during the cooldown", async () => {
    mockFindUser.mockResolvedValue({ id: 5 });
    mockIssueReset.mockResolvedValue({ ok: false, reason: "cooldown" });

    const res = await POST(req({ email: "user@b.com", type: "forgot" }));

    expect(res.status).toBe(200);
    expect(mockSendReset).not.toHaveBeenCalled();
  });
});

describe("POST /api/users/vfy/check", () => {
  it("confirms a valid code", async () => {
    mockCheck.mockResolvedValue({ ok: true, id: 1, email: "a@b.com", userId: null });

    const res = await CHECK(req({ email: "a@b.com", code: CODE }));

    expect(res.status).toBe(200);
    expect(mockCheck).toHaveBeenCalledWith({
      purpose: "SIGNUP",
      email: "a@b.com",
      code: CODE,
    });
  });

  it("explains why a code was rejected", async () => {
    mockCheck.mockResolvedValue({ ok: false, reason: "too_many_attempts" });

    const res = await CHECK(req({ email: "a@b.com", code: "000000" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "Too many attempts, please request a new code",
    });
  });
});
