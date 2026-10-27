import { notFound } from "next/navigation";
import { findResetToken } from "@/src/lib/emailVerification";
import ResetPasswordForm from "./ResetPasswordForm";

// Password reset link: /account/reset/<token>
export default async function ResetPage({
  params,
}: {
  params: Promise<{ rurl: string[] }>;
}) {
  const { rurl } = await params;
  if (rurl.length !== 2 || rurl[0] !== "reset") {
    notFound();
  }

  const token = decodeURIComponent(rurl[1]);
  const record = await findResetToken(token);

  if (!record) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col gap-y-5 items-center justify-center">
        <h1 className="text-xl font-black text-incart">
          This reset link is invalid or has expired
        </h1>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
