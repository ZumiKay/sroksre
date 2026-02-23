import Prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { seedAll } from "./seed/product/seed";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // ===== ADMIN USER SEEDING =====
  console.log("👤 Seeding Admin User...");

  // Default admin credentials
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sroksre.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
  const adminFirstname = process.env.ADMIN_FIRSTNAME || "Admin";
  const adminLastname = process.env.ADMIN_LASTNAME || "User";
  const adminPhone = process.env.ADMIN_PHONE || "+85512345678";

  // Check if admin already exists
  const existingAdmin = await Prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists:", adminEmail);
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await Prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstname: adminFirstname,
        lastname: adminLastname,
        phonenumber: adminPhone,
        role: "ADMIN",
        vfy: "verified", // Mark as verified
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Password:", adminPassword);
    console.log("👤 Name:", `${admin.firstname} ${admin.lastname}`);
    console.log("📱 Phone:", admin.phonenumber);
    console.log("⚠️  Please change the password after first login!");
  }

  // ===== PRODUCTS & CATEGORIES SEEDING =====
  // Check if we should seed products (optional)
  const shouldSeedProducts =
    process.env.SEED_PRODUCTS === "true" || process.env.SEED_PRODUCTS === "1";
  const productCount = parseInt(process.env.SEED_PRODUCT_COUNT || "20");

  if (shouldSeedProducts) {
    console.log("🛍️  Seeding Products & Categories...");
    await seedAll(productCount);
  } else {
    console.log(
      "ℹ️  Skipping product seeding (set SEED_PRODUCTS=true to enable)",
    );
  }

  console.log("\n✅ Database seeding completed!");
}

main()
  .then(async () => {
    await Prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    await Prisma.$disconnect();
    process.exit(1);
  });
