import type { TurnstileServerValidationResponse } from "@marsidev/react-turnstile";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Server-side Cloudflare Turnstile check. Tokens are single-use and expire
// after 5 minutes, so the client must reset the widget after every attempt.
export async function verifyTurnstile(token: unknown) {
  if (typeof token !== "string" || !token) return { success: false };

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("Verify Turnstile: TURNSTILE_SECRET_KEY is not set");
    return { success: false };
  }

  try {
    const request = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
    });
    const responseJson: TurnstileServerValidationResponse =
      await request.json();

    if (!request.ok || !responseJson.success) {
      console.log("Verify Turnstile failed", responseJson["error-codes"]);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.log("Verify Turnstile", error);
    return { success: false };
  }
}
