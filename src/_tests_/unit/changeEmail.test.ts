//Module mock
jest.mock("@/src/lib/prisma");
jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }));
jest.mock("@/src/lib/session", () => ({ getUser: jest.fn() }));
jest.mock("@/src/lib/userlib", () => ({ hashPassword: jest.fn() }));
jest.mock("@/src/lib/emailVerification", () => ({
  issueChangeEmailCode: jest.fn(),
  checkCode: jest.fn(),
  deleteVerification: jest.fn(),
  CHECK_FAILURE_MESSAGE: {
    invalid: "Incorrect code",
    expired: "Code expired, please request a new one",
    too_many_attempts: "Too many attempts, please request a new code",
  },
}));
jest.mock("@/src/lib/verificationEmail", () => ({
  sendVerificationCodeEmail: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
import { Editprofileaction, VerifyEmail } from "@/src/app/dashboard/action";
import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import {
  checkCode,
  deleteVerification,
  issueChangeEmailCode,
} from "@/src/lib/emailVerification";
import { sendVerificationCodeEmail } from "@/src/lib/verificationEmail";

const db = Prisma as unknown as {
  $transaction: jest.Mock;
  user: { findUnique: jest.Mock; update: jest.Mock };
  usersession: { deleteMany: jest.Mock };
  emailVerification: { deleteMany: jest.Mock };
};
const mockGetUser = getUser as jest.Mock;
const mockIssue = issueChangeEmailCode as jest.Mock;
const mockCheck = checkCode as jest.Mock;
const mockDelete = deleteVerification as jest.Mock;
const mockSend = sendVerificationCodeEmail as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  mockGetUser.mockResolvedValue({ userId: 9 });
  mockIssue.mockResolvedValue({ ok: true, id: 4, secret: "112233" });
  mockSend.mockResolvedValue({ success: true });
  db.$transaction.mockResolvedValue([]);
});

describe("VerifyEmail step 1 — send code", () => {
  it("emails a code to the new address for the logged-in user", async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await VerifyEmail("new@b.com", false);

    expect(res).toEqual({ success: true, message: "Please Check Email" });
    expect(mockIssue).toHaveBeenCalledWith(9, "new@b.com");
    expect(mockSend).toHaveBeenCalledWith("new@b.com", "112233", "change_email");
    expect(JSON.stringify(res)).not.toContain("112233");
  });

  it("requires a logged-in user", async () => {
    mockGetUser.mockResolvedValue(null);

    const res = await VerifyEmail("new@b.com", false);

    expect(res.success).toBe(false);
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it("rejects an address that is already in use", async () => {
    db.user.findUnique.mockResolvedValue({ id: 2 });

    const res = await VerifyEmail("taken@b.com", false);

    expect(res).toEqual({ success: false, message: "Email Already Exist" });
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it("rejects an invalid address", async () => {
    const res = await VerifyEmail("nope", false);
    expect(res.success).toBe(false);
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it("deletes the code if the email fails to send", async () => {
    db.user.findUnique.mockResolvedValue(null);
    mockSend.mockResolvedValue({ success: false });

    const res = await VerifyEmail("new@b.com", false);

    expect(res.success).toBe(false);
    expect(mockDelete).toHaveBeenCalledWith(4);
  });
});

describe("VerifyEmail step 2 — confirm code", () => {
  it("checks the code for this user and switches to the address it was sent to", async () => {
    mockCheck.mockResolvedValue({ ok: true, id: 4, email: "new@b.com", userId: 9 });

    // The email argument is ignored in this step.
    const res = await VerifyEmail("attacker@evil.com", true, "112233");

    expect(res).toEqual({ success: true, message: "Email Updated" });
    expect(mockCheck).toHaveBeenCalledWith({
      purpose: "CHANGE_EMAIL",
      userId: 9,
      code: "112233",
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { email: "new@b.com" },
    });
    expect(db.usersession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 9 },
    });
  });

  it.each([undefined, "000000"])(
    "does not change anything when the code (%p) is wrong",
    async (code) => {
      mockCheck.mockResolvedValue({ ok: false, reason: "invalid" });

      const res = await VerifyEmail("new@b.com", true, code);

      expect(res).toEqual({ success: false, message: "Incorrect code" });
      expect(db.$transaction).not.toHaveBeenCalled();
    },
  );

  it("reports a clash if the address was taken after the code was sent", async () => {
    mockCheck.mockResolvedValue({ ok: true, id: 4, email: "new@b.com", userId: 9 });
    db.$transaction.mockRejectedValue({ code: "P2002" });

    const res = await VerifyEmail("new@b.com", true, "112233");

    expect(res).toEqual({ success: false, message: "Email Already Exist" });
  });
});

describe("Editprofileaction", () => {
  it("refuses to change the email directly", async () => {
    const form = new FormData();
    form.set("email", "new@b.com");

    const res = await Editprofileaction(form, "email");

    expect(res.success).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
