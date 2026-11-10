import { NextRequest } from "next/server";
import { getUser, requireAdmin } from "@/src/lib/session";
import {
  ConfirmAction,
  getConfirmRequirements,
} from "@/src/lib/confirmIdentity";
import {
  deleteVerification,
  issueDeleteAccountCode,
} from "@/src/lib/emailVerification";
import { sendVerificationCodeEmail } from "@/src/lib/verificationEmail";

/**
 * What the current user must enter to confirm a delete (see confirmIdentity).
 *
 * GET  ?action=delete_account|delete_users   → { password, emailCode, totp }
 * POST { action: "delete_account" }          → emails a confirmation code
 */

const json = (body: object, status = 200) => Response.json(body, { status });

const parseAction = (value: unknown): ConfirmAction | null =>
  value === "delete_account" || value === "delete_users" ? value : null;

async function currentUser(action: ConfirmAction) {
  if (action === "delete_users") {
    const admin = await requireAdmin();
    return admin?.userId ? { id: admin.userId } : null;
  }
  const session = await getUser({ user: { select: { email: true } } });
  return session?.userId
    ? { id: session.userId, email: session.user?.email as string | undefined }
    : null;
}

export async function GET(request: NextRequest) {
  const action = parseAction(request.nextUrl.searchParams.get("action"));
  if (!action) return json({ message: "Unknown action" }, 400);

  const user = await currentUser(action);
  if (!user) return json({ message: "Unauthorized" }, 403);

  const needs = await getConfirmRequirements(user.id, action);
  if (!needs) return json({ message: "Account not found" }, 404);
  return json(needs);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = parseAction(body?.action);
  if (action !== "delete_account") {
    return json({ message: "Unknown action" }, 400);
  }

  const user = await currentUser(action);
  if (!user?.email) return json({ message: "Unauthorized" }, 403);

  const needs = await getConfirmRequirements(user.id, action);
  if (!needs?.emailCode) {
    return json({ message: "This account confirms with its password" }, 400);
  }

  try {
    const issued = await issueDeleteAccountCode(user.id, user.email);
    if (!issued.ok) {
      return json(
        { message: "Please wait a minute before requesting another code" },
        429,
      );
    }
    const sent = await sendVerificationCodeEmail(
      user.email,
      issued.secret,
      "delete_account",
    );
    if (!sent.success) {
      await deleteVerification(issued.id);
      return json({ message: "Failed to send email, please try again" }, 502);
    }
    return json({ message: `Code sent to ${user.email}` });
  } catch (error) {
    console.log("Delete confirmation code error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
}
