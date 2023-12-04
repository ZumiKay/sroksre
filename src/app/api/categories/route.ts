import { prisma } from "@/src/lib/userlib";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const data: { name: string } = await request.json();
  try {
    await prisma.categories.create({
      data: {
        name: data.name,
      },
    });
    return Response.json({ message: "Category Created" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
export async function GET() {
  const allcategories = await prisma.categories.findMany();

  if (allcategories.length > 0) {
    return Response.json({ data: allcategories }, { status: 200 });
  } else {
    return Response.json({ message: "No Category Found" }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  const data: { id: number; name: string } = await request.json();

  try {
    await prisma.categories.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
      },
    });
    return Response.json(
      {
        message: "Category Updated",
      },
      { status: 200 },
    );
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
