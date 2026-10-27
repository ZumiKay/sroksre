import Prisma from "@/src/lib/prisma";
import { z } from "zod";
import { NextRequest } from "next/server";
import {
  deleteVerification,
  issueResetToken,
  issueSignupCode,
} from "@/src/lib/emailVerification";
import {
  sendPasswordResetEmail,
  sendVerificationCodeEmail,
} from "@/src/lib/verificationEmail";

const requestSchema = z.object({
  email: z.email(),
  type: z.enum(["register", "forgot"]),
});

// Same reply whether or not the account exists, so this can't be used to
// find out which emails are registered.
const RESET_SENT_MESSAGE =
  "If an account exists for this email, a reset link has been sent";

/**
 * Send a sign-up code or a password reset link by email.
 * The code / link is never included in the response.
 */
export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: "Invalid email" }, { status: 400 });
  }
  const { email, type } = parsed.data;

  try {
    const user = await Prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (type === "register") {
      if (user) {
        return Response.json(
          { message: "Email already exist" },
          { status: 409 },
        );
      }

      const issued = await issueSignupCode(email);
      if (!issued.ok) {
        return Response.json(
          { message: "Please wait a minute before requesting another code" },
          { status: 429 },
        );
      }

      const sent = await sendVerificationCodeEmail(
        email,
        issued.secret,
        "signup",
      );
      if (!sent.success) {
        // Let the user retry right away instead of waiting out the cooldown.
        await deleteVerification(issued.id);
        return Response.json(
          { message: "Failed to send email, please try again" },
          { status: 502 },
        );
      }

      return Response.json({ message: "Code sent" }, { status: 200 });
    }

    // type === "forgot"
    if (user) {
      const issued = await issueResetToken(user.id, email);
      if (issued.ok) {
        const sent = await sendPasswordResetEmail(email, issued.secret);
        if (!sent.success) await deleteVerification(issued.id);
      }
    }
    return Response.json({ message: RESET_SENT_MESSAGE }, { status: 200 });
  } catch (error) {
    console.log("Verify User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
