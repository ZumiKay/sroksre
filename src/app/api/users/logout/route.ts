import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import { hashToken } from "@/src/lib/userlib";

export async function DELETE() {
  const user = await getUser();

  if (!user) {
    return Response.json({ success: false }, { status: 401 });
  }
  try {
    await Prisma.usersession.delete({
      where: {
        refresh_token_hash: hashToken(user.sessionid),
        userId: user.userId,
      },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log("Delete Session", error);
    return Response.json({ success: false });
  }
}
