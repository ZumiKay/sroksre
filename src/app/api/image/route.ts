import { ImageDatatype } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { getUser } from "../../action";
import { del } from "@vercel/blob";
interface Deleteimagedata {
  ids: Array<number>;
  type?: "normal" | "temp";
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body only once
    const imgdata: Array<ImageDatatype> = await req.json();
    const user = await getUser();

    if (!user) {
      return Response.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (imgdata.length === 0) {
      return Response.json({ error: "No images provided" }, { status: 400 });
    }

    if (imgdata.some((img) => !img.name)) {
      return Response.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Prepare data once outside the transaction
    const imagesToCreate = imgdata.map((i) => ({
      url: i.url,
      name: i.name,
      type: i.type as string,
      userId: user.id,
      temp: true,
    }));

    // Execute the transaction
    await Prisma.$transaction(async (tx) => {
      return tx.image.createMany({
        data: imagesToCreate,
      });
    });

    // Use the names for the query to find created images
    const imageNames = imgdata.map((img) => img.name);

    // Optimize the query by only selecting what you need
    const createdData = await Prisma.image.findMany({
      where: {
        name: { in: imageNames },
        userId: user.id, // Add this filter for better security and performance
      },
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
    console.error("Save Image Error:", error); // Use console.error for better logging
    return Response.json({ error: "Can't Save Image" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Validate request data
    const data = (await req.json()) as Deleteimagedata;

    if (!data.ids?.length || !data.type) {
      return Response.json(
        {
          success: false,
          message: "Missing required fields: ids array or type",
        },
        { status: 400 }
      );
    }

    // Handle temporary image deletion (with file storage cleanup)
    if (data.type === "temp") {
      const images = await Prisma.image.findMany({
        where: { id: { in: data.ids } },
        select: { url: true, id: true },
      });

      if (images.length === 0) {
        return Response.json(
          { success: false, message: "No images found with the provided ids" },
          { status: 404 }
        );
      }

      // Fix: Use Promise.all correctly
      await Promise.all([
        // Delete files from storage
        ...images.map((img) => del(img.url)),
        // Delete database records
        Prisma.image.deleteMany({ where: { id: { in: data.ids } } }),
      ]);

      return Response.json(
        {
          success: true,
          message: "Images deleted successfully",
          count: images.length,
        },
        { status: 200 }
      );
    }

    // Handle non-temporary image deletion (database only)
    const result = await Prisma.image.deleteMany({
      where: { id: { in: data.ids } },
    });

    return Response.json(
      {
        success: true,
        message: "Images deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting image(s):", error);

    return Response.json(
      {
        success: false,
        message: "Failed to delete image(s)",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
