// mfa.ts imports "./prisma"; mock it by the same relative file.
jest.mock("../../lib/prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    usersession: { updateMany: jest.fn(), deleteMany: jest.fn() },
    mfaRecoveryCode: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { createHash, randomBytes } from "crypto";
import Prisma from "../../lib/prisma";
import {
  consumeRecoveryCode,
  consumeTotpCode,
  decryptSecret,
  enableMfa,
  encryptSecret,
  isMfaConfigured,
  matchTotpStep,
  MfaConfigError,
  normalizeRecoveryCode,
  replaceRecoveryCodes,
  verifySecondFactor,
} from "@/src/lib/mfa";

const db = Prisma as unknown as {
  user: { findUnique: jest.Mock; updateMany: jest.Mock; update: jest.Mock };
  usersession: { updateMany: jest.Mock; deleteMany: jest.Mock };
  mfaRecoveryCode: {
    deleteMany: jest.Mock;
    createMany: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

// RFC 6238 appendix B test secret ("12345678901234567890" in base32).
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

const ORIGINAL_KEY = process.env.MFA_ENCRYPTION_KEY;
beforeEach(() => {
  jest.resetAllMocks();
  process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  db.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));
});
afterAll(() => {
  process.env.MFA_ENCRYPTION_KEY = ORIGINAL_KEY;
});

describe("secret encryption", () => {
  it("round-trips and never stores the plain secret", () => {
    const stored = encryptSecret(RFC_SECRET);
    expect(stored).not.toContain(RFC_SECRET);
    expect(decryptSecret(stored)).toBe(RFC_SECRET);
  });

  it("can't be read with a different key", () => {
    const stored = encryptSecret(RFC_SECRET);
    process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decryptSecret(stored)).toThrow();
  });

  it("refuses to work without a valid key", () => {
    process.env.MFA_ENCRYPTION_KEY = "too-short";
    expect(isMfaConfigured()).toBe(false);
    expect(() => encryptSecret("x")).toThrow(MfaConfigError);
  });
});

describe("matchTotpStep", () => {
  it.each([
    [59_000, "287082", 1],
    [1_111_111_109_000, "081804", 37_037_036],
    [1_234_567_890_000, "005924", 41_152_263],
  ])("accepts the RFC 6238 code at %i ms", (now, code, step) => {
    expect(matchTotpStep(RFC_SECRET, code, now)).toBe(step);
  });

  it("allows one step of clock drift and no more", () => {
    // Code for step 1 (59 s) checked 30 s and 60 s later.
    expect(matchTotpStep(RFC_SECRET, "287082", 89_000)).toBe(1);
    expect(matchTotpStep(RFC_SECRET, "287082", 119_000)).toBeNull();
  });

  it.each([["000000"], ["28708"], ["abcdef"], [123456]])(
    "rejects %p",
    (code) => {
      expect(matchTotpStep(RFC_SECRET, code, 59_000)).toBeNull();
    },
  );
});

describe("consumeTotpCode", () => {
  const enabledUser = () => ({
    totpSecret: encryptSecret(RFC_SECRET),
    totpEnabledAt: new Date(),
  });

  beforeEach(() => {
    jest.useFakeTimers({ now: 59_000 });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("accepts a valid code once and records its step", async () => {
    db.user.findUnique.mockResolvedValue(enabledUser());
    db.user.updateMany.mockResolvedValue({ count: 1 });

    expect(await consumeTotpCode(1, "287082")).toBe(true);
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 1,
        OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: 1 } }],
      },
      data: { lastTotpStep: 1 },
    });
  });

  it("rejects a code whose step was already used (replay)", async () => {
    db.user.findUnique.mockResolvedValue(enabledUser());
    db.user.updateMany.mockResolvedValue({ count: 0 });
    expect(await consumeTotpCode(1, "287082")).toBe(false);
  });

  it("ignores an unfinished setup unless asked to accept it", async () => {
    db.user.findUnique.mockResolvedValue({
      totpSecret: encryptSecret(RFC_SECRET),
      totpEnabledAt: null,
    });
    db.user.updateMany.mockResolvedValue({ count: 1 });

    expect(await consumeTotpCode(1, "287082")).toBe(false);
    expect(await consumeTotpCode(1, "287082", { requireEnabled: false })).toBe(
      true,
    );
  });

  it("rejects wrong codes without touching the database", async () => {
    db.user.findUnique.mockResolvedValue(enabledUser());
    expect(await consumeTotpCode(1, "111111")).toBe(false);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });
});

describe("recovery codes", () => {
  it("creates 10 readable codes and stores only hashes", async () => {
    const codes = await replaceRecoveryCodes(7);

    expect(codes).toHaveLength(10);
    codes.forEach((c) =>
      expect(c).toMatch(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/),
    );
    expect(new Set(codes).size).toBe(10);

    const saved = db.mfaRecoveryCode.createMany.mock.calls[0][0].data;
    expect(saved).toHaveLength(10);
    expect(saved[0]).toEqual({
      userId: 7,
      codeHash: sha256(normalizeRecoveryCode(codes[0])),
    });
    expect(JSON.stringify(saved)).not.toContain(codes[0]);
    expect(db.mfaRecoveryCode.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7 },
    });
  });

  it("uses up a code, ignoring case and dashes", async () => {
    db.mfaRecoveryCode.updateMany.mockResolvedValue({ count: 1 });

    expect(await consumeRecoveryCode(7, " abcde-fghjk ")).toBe(true);
    expect(db.mfaRecoveryCode.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, codeHash: sha256("ABCDEFGHJK"), usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
  });

  it("rejects a used or unknown code", async () => {
    db.mfaRecoveryCode.updateMany.mockResolvedValue({ count: 0 });
    expect(await consumeRecoveryCode(7, "ABCDE-FGHJK")).toBe(false);
  });

  it("rejects malformed input without a query", async () => {
    expect(await consumeRecoveryCode(7, "short")).toBe(false);
    expect(await consumeRecoveryCode(7, 12345)).toBe(false);
    expect(db.mfaRecoveryCode.updateMany).not.toHaveBeenCalled();
  });

  it("verifySecondFactor sends 6 digits to the app check, anything else to recovery codes", async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.mfaRecoveryCode.updateMany.mockResolvedValue({ count: 1 });

    expect(await verifySecondFactor(7, "123456")).toBe(false);
    expect(db.mfaRecoveryCode.updateMany).not.toHaveBeenCalled();

    expect(await verifySecondFactor(7, "ABCDE-FGHJK")).toBe(true);
  });
});

describe("enableMfa", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 59_000 });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("does nothing when two-factor is already on", async () => {
    db.user.findUnique.mockResolvedValue({ totpEnabledAt: new Date() });
    expect(await enableMfa(1, "287082", "hash")).toBeNull();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("does nothing on a wrong code", async () => {
    db.user.findUnique.mockResolvedValue({
      totpSecret: encryptSecret(RFC_SECRET),
      totpEnabledAt: null,
    });
    expect(await enableMfa(1, "111111", "hash")).toBeNull();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("turns it on, verifies this login, signs out the others and returns codes", async () => {
    db.user.findUnique.mockResolvedValue({
      totpSecret: encryptSecret(RFC_SECRET),
      totpEnabledAt: null,
    });
    db.user.updateMany.mockResolvedValue({ count: 1 });

    const codes = await enableMfa(1, "287082", "current-hash");

    expect(codes).toHaveLength(10);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { totpEnabledAt: expect.any(Date) },
    });
    expect(db.usersession.updateMany).toHaveBeenCalledWith({
      where: { userId: 1, refresh_token_hash: "current-hash" },
      data: { mfaVerified: true },
    });
    expect(db.usersession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 1, NOT: { refresh_token_hash: "current-hash" } },
    });
  });
});
