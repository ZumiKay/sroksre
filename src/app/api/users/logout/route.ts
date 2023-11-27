import { verifyToken } from "@/src/lib/protectedLib";
import { prisma } from "@/src/lib/userlib";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    const uid = await verifyToken(token as string);
    await prisma.usersession.delete({
      where: {
        session_id: uid.sessionid as string,
      },
    });
    request.cookies.delete("token");
    return Response.json({ message: "Refreshing..." }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        message: "Error Occured",
      },
      { status: 500 },
    );
  }
}
