import { NextRequest } from "next/server";
import {
  Categorydata,
  Deletecategorydata,
  createCategory,
  deleteCategory,
  updateCategory,
  updateCategoryData,
} from "@/src/lib/adminlib";
import Prisma from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  const data: Categorydata = await req.json();
  try {
    const isCreate = await createCategory(data);
    if (isCreate.success) {
      return Response.json({ data: { id: isCreate.id } }, { status: 200 });
    } else {
      return Response.json({ message: isCreate.error }, { status: 500 });
    }
  } catch (error) {
    console.error("createCategory", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  const data: updateCategoryData = await req.json();
  try {
    const update = await updateCategory(data);
    if (update.success) {
      return Response.json({ message: "Category Updated" }, { status: 200 });
    } else {
      return Response.json({ message: update.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Category Error", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
export async function GET() {
  const allcat = await Prisma.parentcategories.findMany({
    where: {},
    include: { sub: true },
  });
  if (allcat) {
    const categories: any = [];
    allcat.forEach((obj) => {
      categories.push({
        id: obj.id,
        name: obj.name,
        subcategories: obj.sub,
      });
    });
    return Response.json({ data: categories }, { status: 200 });
  } else {
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const data: Deletecategorydata = await req.json();

  try {
    await deleteCategory(data);
    return Response.json({ message: "Category Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Category", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
