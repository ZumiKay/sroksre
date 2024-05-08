import Prisma from "@/src/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { cid: string } }
) {
  try {
    if (params.cid) {
      const cid = params.cid.toString();
      const user = await Prisma.user.findFirst({ where: { vfy: cid } });
      if (user) {
        return Response.json({ data: { id: user.id } }, { status: 200 });
      }
      return Response.error();
    }
    return Response.error();
  } catch (error) {
    console.log("Verify User", error);
    return Response.json({ message: "Failed To Verify" }, { status: 500 });
  }
}
