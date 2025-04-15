import { ImageDatatype } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { getUser } from "../../action";
interface Deleteimagedata {
  names: Array<string>;
}

export async function POST(req: NextRequest) {
  try {
    const imgdata: Array<ImageDatatype> = await req.json();
    const user = await getUser();

    if (imgdata.some((img) => !img.isSave || !img.name) || !user)
      return Response.json({ error: "Invalid Data" }, { status: 400 });

    const savedData = await Prisma.$transaction(async (tx) => {
      const created = await tx.image.createMany({
        data: imgdata.map((i) => ({
          url: i.url,
          name: i.name,
          type: i.type as string,
          userId: user.id,
          temp: true,
        })),
      });
      return created;
    });

    const createdData = await Prisma.image.findMany({
      where: { name: { in: imgdata.map((img) => img.name) } },
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
      },
    });

    return Response.json(
      { message: "Images Saved", data: createdData },
      { status: 200 }
    );
  } catch (error) {
    console.log("Save Image", error);
    return Response.json({ error: "Can't Save Image" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const data: Deleteimagedata = await req.json();
    if (!data) {
      return Response.json({ message: "Nothing To Delete" }, { status: 403 });
    }

    return Response.json({ message: "Delete Successfully" }, { status: 200 });
  } catch (error) {
    console.log("Delete Image", error);
    return Response.json({ message: "Error Delete Image" }, { status: 500 });
  }
}
