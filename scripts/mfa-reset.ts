/**
 * Turns off two-factor login for one account and signs it out everywhere.
 * For an admin who lost both their phone and their recovery codes.
 *
 *   npm run mfa:reset -- admin@example.com
 *
 * Needs database access
 * */
import "dotenv/config";
import Prisma from "@/src/lib/prisma";
import { resetMfa } from "@/src/lib/mfa";

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error("Usage: npm run mfa:reset -- <email>");
    process.exit(1);
  }

  const user = await Prisma.user.findUnique({
    where: { email },
    select: { id: true, totpEnabledAt: true },
  });
  if (!user) {
    console.error(`No account with email ${email}`);
    process.exit(1);
  }

  await resetMfa(user.id);
  console.log(
    `Two-factor ${user.totpEnabledAt ? "turned off" : "was already off"} for ${email}. All of its sessions were signed out.`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("Reset failed:", error);
  process.exit(1);
});
