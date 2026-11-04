import Prisma from "./prisma";
import { Role } from "@/prisma/generated/prisma/enums";

/**
 * Deletes users and the rows that would block the delete. Wishlist has no
 * cascade in the schema, so it has to go first. Admin accounts are skipped
 * unless `includeAdmins` is set. Returns how many users were deleted.
 */
export async function deleteUsersWithData(
  ids: number[],
  { includeAdmins = false }: { includeAdmins?: boolean } = {},
): Promise<number> {
  const [, , , deleted] = await Prisma.$transaction([
    Prisma.wishlist.deleteMany({ where: { uid: { in: ids } } }),
    Prisma.orderproduct.deleteMany({ where: { user_id: { in: ids } } }),
    Prisma.usersession.deleteMany({ where: { userId: { in: ids } } }),
    Prisma.user.deleteMany({
      where: {
        id: { in: ids },
        ...(includeAdmins ? {} : { role: { not: Role.ADMIN } }),
      },
    }),
  ]);
  return deleted.count;
}
