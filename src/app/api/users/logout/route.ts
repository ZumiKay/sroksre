import { getUser } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";

export async function DELETE() {
  const user = await getUser();

  if (!user) {
    return Response.json({ success: false }, { status: 401 });
  }
  try {
    await Prisma.usersession.deleteMany({
      where: {
        session_id: user.session_id,
      },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log("Delete Session", error);
    return Response.json({ success: false });
  }
}
