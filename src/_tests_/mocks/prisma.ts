/** Mock of Prisma ORM */

import { PrismaClient } from "@/prisma/generated/prisma/client";
import { mockDeep } from "jest-mock-extended";

export const prismaMock = mockDeep<PrismaClient>();
