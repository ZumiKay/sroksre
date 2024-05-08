import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const Prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default Prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = Prisma;
