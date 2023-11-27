import { Role, prisma } from "./userlib";

export const adminRoutes: string[] = ["adminRoutes"];
export const isAdmin = async (id: number) => {
  const admin = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (admin && admin.role === Role.ADMIN) {
    return true;
  } else {
    return false;
  }
};
