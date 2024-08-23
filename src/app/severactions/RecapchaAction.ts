"use server";

interface ResponseType {
  success: boolean;
  challenge_ts: number | string | Date;
  hostname: string;
}
export async function VerifyRecapcha(token: string) {
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRETKEY}&response=${token}`;
  try {
    const request = await fetch(url, {
      method: "POST",
    });
    const responseJson: ResponseType = await request.json();

    if (!request.ok || !responseJson.success) {
      return { success: false };
    }

    return { success: responseJson.success };
  } catch (error) {
    console.log("Verify Recapcha", error);
    return { success: false };
  }
}
