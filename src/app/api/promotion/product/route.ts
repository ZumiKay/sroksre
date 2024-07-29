import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";

interface UpdateProductPriceType {
  data: {
    id: number;
    discount?: number;
  }[];
  create?: boolean;
}
export async function PUT(request: NextRequest) {
  try {
    const data = (await request.json()) as UpdateProductPriceType;

    if (data.data.some((i) => !i.id)) {
      return Response.json({ message: "Invalid Request" }, { status: 400 });
    }

    if (data.create) {
      await Promise.all(
        data.data.map((prod) =>
          Prisma.products.update({
            where: { id: prod.id },
            data: { discount: prod.discount },
          })
        )
      );
    } else {
      await Promise.all(
        data.data.map((prod) =>
          Prisma.products.update({
            where: { id: prod.id },
            data: { discount: null },
          })
        )
      );
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log("Update product price", error);

    return Response.json({ success: false }, { status: 500 });
  }
}
