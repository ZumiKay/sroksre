import { handleDeleteVariant } from "@/src/lib/admin/variant.operations";
import {
  CreateProduct,
  DeleteProduct,
  EditProduct,
  updateProductData,
} from "@/src/lib/adminlib";
import Prisma from "@/src/lib/prisma";

import { NextRequest } from "next/server";
export async function POST(req: NextRequest) {
  const { createdproduct } = await req.json();

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
    console.dir({ updated }, { depth: null });
    return Response.json(
      { message: "Product Updated", data: updated },
      { status: 200 },
    );
  } else {
    return Response.json(
      { message: updated.error, ...updated },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const data: {
    id: number;
    variantsectionIds?: Array<number>;
    variantId?: Array<number>;
  } = await req.json();
  try {
    if (data.variantsectionIds) {
      await Prisma.variantSection.deleteMany({
        where: {
          id: { in: data.variantsectionIds },
        },
      });

      //Update Variant
      await Promise.all(
        data.variantsectionIds.map((i) =>
          Prisma.variant.updateMany({
            where: { sectionId: i },
            data: {
              sectionId: null,
            },
          }),
        ),
      );

      return Response.json(
        { message: "Varaint Sections Deleted" },
        { status: 200 },
      );
    }
    //Delete Variant
    if (data.variantId) {
      const del = await handleDeleteVariant(data.id, data.variantId);
      if (del.success) {
        return Response.json({ message: "Variants Deleted" }, { status: 200 });
      }
    }

    await DeleteProduct(data.id);

    return Response.json({ message: "Product Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Product", error);
    return Response.json({ message: "Failed To Delete" }, { status: 500 });
  }
}
export async function GET() {
  const product = await Prisma.products.findMany({});

  return Response.json({ data: product.length }, { status: 200 });
}
