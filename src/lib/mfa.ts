import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomInt,
  randomBytes,
} from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import Prisma from "./prisma";

/**
 * Two-factor login with an authenticator app (TOTP, RFC 6238).
 */
export const MFA_CONFIG = {
  ISSUER: "SrokSre",
  PERIOD_SECONDS: 30,
  DIGITS: 6,
  WINDOW: 1,
  RECOVERY_CODE_COUNT: 10,
} as const;

/** When true, admin pages and APIs require a login that passed 2FA. */
export const isAdminMfaRequired = () =>
  process.env.ADMIN_MFA_REQUIRED === "true";

export class MfaConfigError extends Error {}

function encryptionKey(): Buffer {
  const raw = process.env.MFA_ENCRYPTION_KEY;
  const key = raw ? Buffer.from(raw, "base64") : Buffer.alloc(0);
  if (key.length !== 32) {
    throw new MfaConfigError(
      "MFA_ENCRYPTION_KEY must be set to 32 random bytes, base64-encoded",
    );
  }
  return key;
}

//check env config
export function isMfaConfigured(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    data.toString("base64"),
  ].join(":");
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1" || !iv || !tag || !data) {
    throw new Error("Unknown 2FA secret format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

// TOTP (Time-Based One-Time password) codes

const totpFor = (secretBase32: string, label = "") =>
  new OTPAuth.TOTP({
    issuer: MFA_CONFIG.ISSUER,
    label,
    algorithm: "SHA1",
    digits: MFA_CONFIG.DIGITS,
    period: MFA_CONFIG.PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

// random secret
export const createTotpSecret = () => new OTPAuth.Secret({ size: 20 }).base32;

//link that the QR code encodes.
export const totpUri = (secretBase32: string, accountName: string) =>
  totpFor(secretBase32, accountName).toString();

const looksLikeTotp = (code: string) => /^\d{6}$/.test(code);

/**
 * Returns the 30-second valid code.
 */
export function matchTotpStep(
  secretBase32: string,
  code: unknown,
  now = Date.now(),
): number | null {
  if (typeof code !== "string" || !looksLikeTotp(code)) return null;
  const delta = totpFor(secretBase32).validate({
    token: code,
    timestamp: now,
    window: MFA_CONFIG.WINDOW,
  });
  if (delta === null) return null;
  return Math.floor(now / 1000 / MFA_CONFIG.PERIOD_SECONDS) + delta;
}

// Checks a code with the user's secret
export async function consumeTotpCode(
  userId: number,
  code: unknown,
  { requireEnabled = true }: { requireEnabled?: boolean } = {},
): Promise<boolean> {
  const user = await Prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });
  if (!user?.totpSecret) return false;
  if (requireEnabled && !user.totpEnabledAt) return false;

  const step = matchTotpStep(decryptSecret(user.totpSecret), code);
  if (step === null) return false;

  // Check if the code is used.
  const claimed = await Prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: step } }],
    },
    data: { lastTotpStep: step },
  });
  return claimed.count === 1;
}

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECOVERY_CODE_LENGTH = 10;

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const normalizeRecoveryCode = (input: string) =>
  input.toUpperCase().replace(/[^A-Z0-9]/g, "");

function newRecoveryCode(): string {
  let code = "";
  for (let i = 0; i < RECOVERY_CODE_LENGTH; i++) {
    code += RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)];
  }
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/** Replaces all of a user's recovery codes. Returns the new codes (shown once). */
export async function replaceRecoveryCodes(userId: number): Promise<string[]> {
  const codes = Array.from(
    { length: MFA_CONFIG.RECOVERY_CODE_COUNT },
    newRecoveryCode,
  );
  await Prisma.$transaction([
    Prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    Prisma.mfaRecoveryCode.createMany({
      data: codes.map((code) => ({
        userId,
        codeHash: sha256(normalizeRecoveryCode(code)),
      })),
    }),
  ]);
  return codes;
}

/** Uses up one recovery code. Returns false if it's wrong or already used. */
export async function consumeRecoveryCode(
  userId: number,
  input: unknown,
): Promise<boolean> {
  if (typeof input !== "string") return false;
  const normalized = normalizeRecoveryCode(input);
  if (normalized.length !== RECOVERY_CODE_LENGTH) return false;

  const used = await Prisma.mfaRecoveryCode.updateMany({
    where: { userId, codeHash: sha256(normalized), usedAt: null },
    data: { usedAt: new Date() },
  });
  return used.count > 0;
}

/** Second step verify */
export async function verifySecondFactor(
  userId: number,
  code: string,
): Promise<boolean> {
  const trimmed = code.trim();
  return looksLikeTotp(trimmed)
    ? consumeTotpCode(userId, trimmed)
    : consumeRecoveryCode(userId, trimmed);
}

//Confirmation for the account mfa status
export async function getMfaStatus(userId: number) {
  const [user, recoveryCodesLeft] = await Promise.all([
    Prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabledAt: true },
    }),
    Prisma.mfaRecoveryCode.count({ where: { userId, usedAt: null } }),
  ]);
  return {
    enabled: !!user?.totpEnabledAt,
    enabledAt: user?.totpEnabledAt ?? null,
    recoveryCodesLeft,
  };
}

/**
 * Initial steps to start the mfaSetup
 */
export async function startMfaSetup(userId: number, accountName: string) {
  const secret = createTotpSecret();
  const updated = await Prisma.user.updateMany({
    where: { id: userId, totpEnabledAt: null },
    data: { totpSecret: encryptSecret(secret), lastTotpStep: null },
  });
  if (updated.count !== 1) return null; // already enabled

  const uri = totpUri(secret, accountName);
  return { secret, uri, qrDataUrl: await QRCode.toDataURL(uri, { margin: 1 }) };
}

/**
 * Marks the current login as verified, signs out every other login (they never passed 2FA) and
 * returns the recovery codes.
 */
export async function enableMfa(
  userId: number,
  code: unknown,
  currentSessionHash: string,
): Promise<string[] | null> {
  const user = await Prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabledAt: true },
  });
  if (!user || user.totpEnabledAt) return null;

  if (!(await consumeTotpCode(userId, code, { requireEnabled: false }))) {
    return null;
  }

  await Prisma.$transaction([
    Prisma.user.update({
      where: { id: userId },
      data: { totpEnabledAt: new Date() },
    }),
    Prisma.usersession.updateMany({
      where: { userId, refresh_token_hash: currentSessionHash },
      data: { mfaVerified: true },
    }),
    Prisma.usersession.deleteMany({
      where: { userId, NOT: { refresh_token_hash: currentSessionHash } },
    }),
  ]);

  return replaceRecoveryCodes(userId);
}

/** Turns 2FA off and signs the user out everywhere. Used by the reset script. */
export async function resetMfa(userId: number) {
  await Prisma.$transaction([
    Prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpEnabledAt: null, lastTotpStep: null },
    }),
    Prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    Prisma.usersession.deleteMany({ where: { userId } }),
  ]);
}
