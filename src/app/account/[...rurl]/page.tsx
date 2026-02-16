import Prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPage({
  params,
}: {
  params: Promise<{ rurl: string }>;
}) {
  const { rurl } = await params;
  const URL = decodeURIComponent(rurl);
  const match = URL.match(/cid=(\d+)/);

  if (!match) {
    notFound();
  }

  // Verify user on server side
  const user = await Prisma.user.findFirst({
    where: { vfy: match[1] },
    select: { id: true, vfy: true },
  });

  if (!user || !user.vfy) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col gap-y-5 items-center justify-center">
        <h1 className="text-xl font-black text-[#495464]"> 404 | Not Found</h1>
      </div>
    );
  }

  return <ResetPasswordForm cid={match[1]} />;
}
