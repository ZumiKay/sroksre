import { DeleteImageFromStorage } from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/src/lib/firebase";
import { Imgurl } from "@/src/app/component/Modals";
import { randomUUID } from "crypto";
import Prisma from "@/src/lib/prisma";

interface DataCoverType {
  url: string;
  name: string;
  type: string;
  id?: number;
  isSaved?: boolean;
}
export async function POST(request: NextRequest) {
  try {
    //remove unused image
    const images = await Prisma.tempimage.findMany({});
    if (images.length !== 0) {
      await Promise.all(images.map((i) => DeleteImageFromStorage(i.name)));
    }

    //Upload to storage
    const data = await request.formData();

    const allfile = Array.from(data.values());
    const ImgData: Imgurl[] = [];

    const Savetotemp = async (name: string) => {
      const saved = await Prisma.tempimage.create({ data: { name } });
      if (!saved) {
        throw Error("Failed saved to temp");
      }
    };

    for (const file of allfile) {
      if (typeof file === "object" && "arrayBuffer" in file) {
        const randomName = `${randomUUID()}_${Date.now()}`;
        await Savetotemp(randomName);

        const storageref = ref(storage, `productcovers/${randomName}`);
        await uploadBytes(storageref, file);
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
  }
}
interface DeleteCoverData {
  covers: Array<DataCoverType>;
  type: "createproduct" | "createbanner" | "createpromotion";
}
export async function DELETE(request: NextRequest) {
  const data: DeleteCoverData = await request.json();
  try {
    await Promise.all(data.covers.map((i) => DeleteImageFromStorage(i.name)));

    ///Delete File From DB If Exist

    if (data.type === "createproduct") {
      const isSaved = data.covers.every((i) => i.id);

      if (isSaved) {
        const isExist = await Promise.all(
          data.covers.map((i) =>
            Prisma.productcover.findUnique({
              where: {
                id: i.id,
              },
            })
          )
        );
        if (isExist.length > 0) {
          await Promise.all(
            isExist.map((i) =>
              Prisma.productcover.delete({ where: { id: i?.id } })
            )
          );
        }
      }
    }
    return Response.json({ message: "Image Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Cover", error);
    return Response.json({ message: "Failed To Delete Cover=" });
  }
}
