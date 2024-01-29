import { DeleteImageFromStorage } from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import prisma from "../../../../lib/prisma";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/src/lib/firebase";
import { Imgurl } from "@/src/app/component/Modals";
import { randomUUID } from "crypto";

interface DataCoverType {
  url: string;
  name: string;
  type: string;
  id?: number;
  isSaved?: boolean;
}
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const allfile = Array.from(data.values());
    const ImgData: Imgurl[] = [];
    for (const file of allfile) {
      if (typeof file === "object" && "arrayBuffer" in file) {
        const randomName = randomUUID();
        const filedata = file as unknown as Blob;
        const buffer = Buffer.from(await filedata.arrayBuffer());
        const storageref = ref(storage, `productcovers/${randomName}`);
        await uploadBytes(storageref, buffer);
        const url = await getDownloadURL(storageref);
        ImgData.push({
          url: url,
          name: randomName,
          type: file.type,
          isSave: true,
        });
      }
    }

    return Response.json({ data: ImgData }, { status: 200 });
  } catch (error) {
    console.log("Save Image", error);
    return Response.json({ message: "Failed To Save" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
interface DeleteCoverData {
  covers: Array<DataCoverType>;
  type: "createproduct" | "createbanner" | "createpromotion";
}
export async function DELETE(request: NextRequest) {
  const data: DeleteCoverData = await request.json();
  try {
    const deleteFromStorage = await Promise.all(
      data.covers.map((i) => DeleteImageFromStorage(i.name)),
    );
    const isDelete = deleteFromStorage.every((i) => i.Sucess);
    if (!isDelete) {
      return Response.json({ message: "Image Not Found" }, { status: 200 });
    }
    //Delete File From DB If Exist

    if (data.type === "createproduct") {
      const isSaved = data.covers.every((i) => i.id);

      if (isSaved) {
        const isExist = await Promise.all(
          data.covers.map((i) =>
            prisma.productcover.findUnique({
              where: {
                id: i.id,
              },
            }),
          ),
        );
        if (isExist.length > 0) {
          await Promise.all(
            isExist.map((i) =>
              prisma.productcover.delete({ where: { id: i?.id } }),
            ),
          );
        }
      }
    }
    return Response.json({ message: "Image Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Cover", error);
    return Response.json({ message: "Failed To Delete Cover=" });
  } finally {
    await prisma.$disconnect();
  }
}
