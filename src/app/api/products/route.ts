import { NextRequest } from "next/server";

import {
  calculateDiscountPrice,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";

import { extractQueryParams } from "../banner/route";
import Prisma from "@/src/lib/prisma";
import {
  ContainerItemType,
  Stocktype,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { GetAllProduct } from "@/src/lib/adminlib#1";

interface paramsType {
  ty: string;
  limit: number;
  q?: string;
  pc?: number;
  cc?: number;
  sk?: string;
  p?: number;
  id?: number;
  pid?: number; //Promotion id
  pids?: string; //Promotion Ids
  po?: number;
  dc?: string;
  ds?: string;
  dt?: string;
  vr?: number;
  vs?: number;
  sp?: number;
}

const convertStockData = (stock: Stocktype[]) => {
  const lowstock = parseInt(process.env.NEXT_PUBLIC_LOWSTOCK ?? "3");

  const Stock = stock.map((i) => {
    const isLowStock = i.Stockvalue.some((sub) => sub.qty <= lowstock);

    return {
      id: i.id,
      Stockvalue: i.Stockvalue,
      isLowStock,
    };
  });

  return Stock;
};
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.toString();
    const { ty, limit, q, pc, sk, cc, p, pid, po, dc, dt, sp, pids, id } =
      extractQueryParams(url) as unknown as paramsType;

    if (!ty) {
      return Response.json({}, { status: 400 });
    }

    switch (ty) {
      case "all":
      case "filter":
      case "detail": {
        const allProduct = await GetAllProduct({
          limit,
          ty,
          page: p as number,
          query: q,
          parent_cate: pc,
          child_cate: cc,
          sk,
          promotionid: pid,
          priceorder: po,
          detailcolor: dc,
          detailtext: dt,
          selectpromo: sp,
          promotionids: (typeof pids === "string" || typeof pids === "number"
            ? [pids]
            : pids) as string[],
        });

        return allProduct.success
          ? Response.json(
              {
                data: allProduct.data,
                totalpage: allProduct.total,
                lowstock: allProduct.lowstock,
                totalfilter: allProduct.totalfilter,
              },
              { status: 200 }
            )
          : Response.json({ message: "Error Occurred" }, { status: 500 });
      }

      case "getfilval": {
        const allfilter = await Prisma.products.findMany({
          where: {
            parentcategory_id: pc,
            childcategory_id: cc,
          },
          select: {
            Variant: true,
          },
        });

        // Using Map instead of Set for better performance with large data
        const allval = {
          size: new Set<string>(),
          color: new Set<string>(),
          text: new Set<string>(),
        };

        // Process variants in a single loop
        for (const filval of allfilter) {
          for (const variant of filval.Variant) {
            if (variant.option_type === "COLOR") {
              const opt_val = variant.option_value as VariantColorValueType[];
              for (const item of opt_val) {
                if (item.val) allval.color.add(item.val);
              }
            } else if (variant.option_type === "TEXT") {
              const opt_val = variant.option_value as string[];
              for (const item of opt_val) {
                allval.text.add(item);
              }
            }
          }
        }

        const allvalarr = {
          text: Array.from(allval.text),
          size: Array.from(allval.size),
          color: Array.from(allval.color).filter(Boolean),
        };

        return Response.json({ data: allvalarr }, { status: 200 });
      }

      case "info": {
        const product = await Prisma.products.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            price: true,
            discount: true,
            stock: true,
            stocktype: true,
            Variant: {
              orderBy: { id: "asc" },
            },
            Stock: {
              orderBy: { id: "asc" },
              select: {
                id: true,
                Stockvalue: {
                  select: {
                    id: true,
                    qty: true,
                    variant_val: true,
                  },
                },
              },
            },
            description: true,
            parentcategory_id: true,
            childcategory_id: true,
            relatedproductId: true,
            promotion_id: true,
            details: true,
            relatedproduct: {
              select: {
                id: true,
                productId: true,
              },
            },
            covers: {
              select: {
                id: true,
                url: true,
                type: true,
              },
            },
          },
        });

        if (!product) {
          return new Response(null, { status: 404 });
        }

        // Only fetch related products if needed
        const otherProduct =
          product.relatedproductId && product.relatedproduct
            ? await Prisma.products.findMany({
                where: {
                  id: { in: product.relatedproduct.productId as number[] },
                  // Exclude the current product
                  NOT: { id: product.id },
                },
                select: {
                  id: true,
                  name: true,
                  parentcategory_id: true,
                  childcategory_id: true,
                  covers: {
                    select: {
                      id: true,
                      url: true,
                    },
                  },
                },
              })
            : [];

        // Calculate discount only once if needed
        const calculatedDiscount =
          product.promotion_id && product.discount
            ? calculateDiscountPrice(product.price, product.discount)
            : undefined;

        // Use object destructuring and spread to create the result
        const { parentcategory_id, childcategory_id, Variant, Stock, ...rest } =
          product;

        const result = {
          ...rest,
          discount: calculatedDiscount,
          category: {
            parent: { id: parentcategory_id },
            child: { id: childcategory_id },
          },
          variants: Variant,
          varaintstock: convertStockData(Stock as Stocktype[]),
          relatedproduct: otherProduct,
        };

        return Response.json({ data: result }, { status: 200 });
      }

      case "stock": {
        // Execute both queries in parallel
        const [variant, stock] = await Promise.all([
          Prisma.variant.findMany({
            where: { product_id: id },
            orderBy: { id: "asc" },
            select: {
              id: true,
              option_title: true,
              option_type: true,
              option_value: true,
            },
          }),
          Prisma.stock.findMany({
            where: { product_id: id },
            orderBy: { id: "asc" },
            select: {
              id: true,
              Stockvalue: {
                select: {
                  id: true,
                  qty: true,
                  variant_val: true,
                },
              },
            },
          }),
        ]);

        return Response.json(
          {
            data: {
              varaintstock: convertStockData(stock as unknown as Stocktype[]),
              variants: variant,
            },
          },
          { status: 200 }
        );
      }

      case "search": {
        if (!q) {
          return Response.json({ data: [] }, { status: 200 });
        }

        const searchproduct = await Prisma.products.findMany({
          where: {
            name: {
              contains: removeSpaceAndToLowerCase(q),
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            name: true,
            covers: { select: { id: true, name: true, url: true }, take: 1 },
            parentcategory_id: true,
            childcategory_id: true,
            price: true,
            discount: true,
          },
        });

        const result = searchproduct.map(({ price, discount, ...rest }) => ({
          ...rest,
          price,
          discount: discount && calculateDiscountPrice(price, discount),
        }));

        return Response.json({ data: result }, { status: 200 });
      }
      case "homecontainer": {
        const result = await Prisma.products.findMany({
          where: {
            AND: [
              { ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
              { ...(pc && { parentcategory_id: pc }) },
              { ...(cc && { childcategory_id: cc }) },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            covers: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        });
        const ItemData: Array<ContainerItemType> = result.map((prod) => ({
          ...prod,
          image: prod.covers[0].url,
          name: prod.name,
          covers: undefined,
        })) as never;
        return Response.json(
          {
            data: ItemData,
            isLimit: ItemData.length > limit,
          },
          { status: 200 }
        );
      }

      default:
        return new Response(null, { status: 404 });
    }
  } catch (error) {
    console.error("Fetch Product Error:", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}
