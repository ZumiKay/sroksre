import prisma from '../../../lib/prisma'
import { NextRequest } from "next/server";

interface producttypes {
  name: string;
  price: number;
  buyer_id: number;
  seller_id: number;
  stock: number;
  cover: string;
  category: number;
}
export async function POST(request: NextRequest) {
  const data: producttypes = await request.json();
  try {
    await prisma.products.create({
      data: {
        name: data.name,
        price: data.price,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        stock: data.stock,
        cover: data.cover,
        category_id: data.category,
      },
    });
    return Response.json({ message: "Products Created" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
interface updateproduct extends producttypes {
  id: number;
}
export async function PUT(request: NextRequest) {
  const data: updateproduct = await request.json();
  try {
    await prisma.products.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        price: data.price,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        stock: data.stock,
        cover: data.cover,
        category_id: data.category,
      },
    });
    return Response.json({ message: "Product Updated" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
