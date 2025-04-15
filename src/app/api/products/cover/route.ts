import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/src/lib/prisma";
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { extractQueryParams } from "../../banner/route";
import { getUser } from "@/src/app/action";

interface DataCoverType {
  url: string;
  name: string;
  type: string;
  id?: number;
  isSaved?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { pid } = extractQueryParams(request.nextUrl.toString());

    if (!pid) return NextResponse.json({}, { status: 400 });

    const ImageCovers = await Prisma.image.findMany({
      where: {
        productId: Number(pid),
      },
      select: {
        id: true,
        url: true,
        name: true,
      },
    });
    return NextResponse.json({ data: ImageCovers }, { status: 200 });
  } catch (error) {
    console.log("Get Image", error);
    return NextResponse.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    //Upload to storage
    const UploadImage = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname
        /* clientPayload */
      ) => {
        // Generate a client token for the browser to upload the file
        // ⚠️ Authenticate and authorize users before generating the token.
        // Otherwise, you're allowing anonymous uploads.
        const user = await getUser();

        if (!user) {
          throw new Error("Unauthorized");
        }

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
      onUploadCompleted: async () => {
        // Get notified of client upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow
      },
    });
    return NextResponse.json(UploadImage);
  } catch (error) {
    console.log("Save Image", error);
    return NextResponse.json(
      { message: "Failed To Save" },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
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
        const isExist = await Prisma.image.findMany({
          where: {
            id: {
              in: data.covers.map((i) => i.id ?? 0),
            },
          },
        });
        if (isExist.length > 0) {
          await Promise.all(
            isExist.map((i) => Prisma.image.delete({ where: { id: i?.id } }))
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
