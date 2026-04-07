import { PrismaClient } from "@/prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.NODE_ENV === "production"
      ? process.env.DATABASE_PROD_POSTGRES_PRISMA_URL
      : process.env.DATABASE_URL,
});

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const Prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default Prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = Prisma;
