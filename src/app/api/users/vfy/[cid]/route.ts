import Prisma from "@/src/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { cid: string } }
) {
  try {
    console.log({ params });
    if (params.cid) {
      const user = await Prisma.user.findFirst({
        where: { vfy: params.cid },
        select: { id: true },
      });
      if (user) {
        return Response.json({ data: { id: user.id } }, { status: 200 });
      }
      return Response.json({ message: "Incorrect Code" }, { status: 404 });
    }
    return Response.json({}, { status: 404 });
  } catch (error) {
    console.log("Verify User", error);
    return Response.json({ message: "Failed To Verify" }, { status: 500 });
  }
}
