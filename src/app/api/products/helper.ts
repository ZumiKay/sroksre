import Prisma from "@/src/lib/prisma";

export async function updateProductPromotion(pid: number[]) {
  if (pid.length === 0) return;

  return Prisma.products.updateMany({
    where: { id: { in: pid } },
    data: { promotion_id: null, discount: null },
  });
}
