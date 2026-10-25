/**
 * Seed only categories + products (no admin user, no promotions).
 *
 * Usage:
 *   npm run seed:products          # 100 products
 *   npm run seed:products -- 250   # custom count
 *
 * Products are added on top of existing data; re-running adds more.
 */

import Prisma from "@/src/lib/prisma";
import { seedAll } from "./seed";

async function main() {
  const arg = process.argv[2];
  const count = arg === undefined ? 100 : Number(arg);

  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Invalid product count "${arg}". Use a positive integer.`);
  }

  const before = await Prisma.products.count();
  const started = Date.now();

  await seedAll(count);

  const after = await Prisma.products.count();
  console.log(
    `\n📦 Products in database: ${before} → ${after} (+${after - before}) in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

main()
  .then(() => Prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Error seeding products:", e);
    await Prisma.$disconnect();
    process.exit(1);
  });
