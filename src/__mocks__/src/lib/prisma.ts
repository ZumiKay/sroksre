import { PrismaClient } from "@/prisma/generated/prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

export default prismaMock;
