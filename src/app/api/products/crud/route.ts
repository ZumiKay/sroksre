import { NextRequest } from "next/server";
import { CreateProduct, DeleteProduct } from "./createProductHandler";
import { EditProduct, updateProductData } from "./editProductHandler";

export async function POST(req: NextRequest) {
  const createdproduct = await req.json();

  const created = await CreateProduct(createdproduct);
  if (created.success) {
    return Response.json({ data: { id: created.id } }, { status: 200 });
  } else {
    return Response.json({ message: created.error }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  const data: updateProductData = await req.json();
  const updated = await EditProduct(data);
  if (updated.success) {
    return Response.json({ message: "Product Updated" }, { status: 200 });
  } else {
    return Response.json({ message: updated.error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const data: { id: Array<number> } = await req.json();
  try {
    await DeleteProduct(data.id);

    return Response.json({ message: "Product Deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete Product", error);
    return Response.json({ message: "Failed To Delete" }, { status: 500 });
  }
}
