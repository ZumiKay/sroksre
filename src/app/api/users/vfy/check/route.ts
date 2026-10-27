import { NextRequest } from "next/server";
import { VerificationPurpose } from "@/prisma/generated/prisma/enums";
import { CHECK_FAILURE_MESSAGE, checkCode } from "@/src/lib/emailVerification";

/**
 * Check a sign-up code so the form can move on to the password step.
 * The code is not used up here; POST /api/auth/register checks it again.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";

  try {
    const result = await checkCode({
      purpose: VerificationPurpose.SIGNUP,
      email,
      code: body?.code,
    });

    if (!result.ok) {
      return Response.json(
        { message: CHECK_FAILURE_MESSAGE[result.reason] },
        { status: 400 },
      );
    }
    return Response.json({ message: "Verified" }, { status: 200 });
  } catch (error) {
    console.log("Check verification code", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
