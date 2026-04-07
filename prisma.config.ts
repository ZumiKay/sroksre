import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --tsconfig tsconfig.json prisma/seed.ts",
  },
  datasource: {
    url:
      env("NODE_ENV") === "development"
        ? env("DATABASE_URL")
        : env("DATABASE_PROD_POSTGRES_PRISMA_URL"),
  },
});
