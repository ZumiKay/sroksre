import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/src/lib/prisma";
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { getUser } from "@/src/lib/session";
import { del } from "@vercel/blob";

interface DataCoverType {
  url: string;
  name: string;
  type: string;
  id?: number;
  isSaved?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    //Upload to storage
    const UploadImage = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname,
        /* clientPayload */
      ) => {
        // Generate a client token for the browser to upload the file

        const user = await getUser();

        if (!user) {
          throw new Error("Unauthorized");
        }

        //Save To Temp DB

        await Prisma.tempimage.create({
          data: {
            name: pathname,
            user_id: user.userId,
          },
        });

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
          tokenPayload: JSON.stringify({
            pathname,
          }),
        };
      },
    });

    return NextResponse.json(UploadImage);
  } catch (error) {
    console.log("Save Image", error);
    return NextResponse.json(
      { message: "Failed To Save" },
      { status: 400 }, // The webhook will retry 5 times waiting for a 200
    );
  }
}
interface DeleteCoverData {
  covers: Array<DataCoverType>;
  type: "createproduct" | "createbanner" | "createpromotion";
}

export async function DELETE(request: NextRequest) {
  const data: DeleteCoverData = await request.json();
  try {
    ///Delete File From DB If Exist

    if (data.type === "createproduct") {
      const isSaved = data.covers.every((i) => i.id);

      if (isSaved) {
        const isExist = await Prisma.productcover.findMany({
          where: {
            id: {
              in: data.covers.map((i) => i.id ?? 0),
            },
          },
        });
        if (isExist.length > 0) {
          await Promise.all(
            isExist.map((i) =>
              Prisma.productcover.delete({ where: { id: i?.id } }),
            ),
          );
          await Promise.all(isExist.map((cover) => del(cover.url)));
        }
      }
    } else if (data.type === "createbanner") {
      await Promise.all(data.covers.map((i) => del(i.url)));
    }
    return Response.json({ message: "Image Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Cover", error);
    return Response.json({ message: "Failed To Delete Cover=" });
  }
}
