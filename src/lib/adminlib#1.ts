import {
  handleUpdateProductVariant,
  updateDetails,
  updateProductData,
  updateProductVariantStock,
} from "./adminlib";
import Prisma from "./prisma";
import { Prisma as prisma, Products } from "@prisma/client";
import {
  calculateDiscountProductPrice,
  removeSpaceAndToLowerCase,
} from "./utilities";
import { ProductState } from "../context/GlobalType.type";

export type GetProductReturnType = {
  success: boolean;
  data?: unknown;
  total?: number;
  lowstock?: number;
  totalfilter?: number;
};

export const GetAllProduct = async (
  limit: number,
  ty: string,
  page: number,
  query?: string,
  parent_cate?: number,
  sk?: string,
  child_cate?: number,
  promotionid?: number,
  priceorder?: number,
  detailcolor?: string,
  detailtext?: string,
  selectpromo?: number,
  promotionids?: string
): Promise<GetProductReturnType> => {
  try {
    // Base where clause
    const where: prisma.ProductsWhereInput | prisma.ProductsWhereUniqueInput = {
      ...(query && {
        name: {
          contains: removeSpaceAndToLowerCase(query),
          mode: "insensitive",
        },
      }),
      ...(parent_cate && { parentcategory_id: parent_cate }),
      ...(child_cate && { childcategory_id: child_cate }),
      ...(promotionids && {
        promotion_id: promotionids.includes(",")
          ? { in: promotionids.split(",").map((id) => parseInt(id, 10)) }
          : parseInt(promotionids, 10),
      }),
      ...(selectpromo === 1 && !promotionids && { promotion_id: null }),
      ...(promotionid &&
        promotionid !== -1 && {
          OR: [{ promotion_id: null }, { promotion_id: promotionid }],
        }),
    };

    // Common select clause
    const select: prisma.ProductsSelect = {
      id: true,
      name: true,
      price: true,
      discount: true,
      stock: true,
      stocktype: true,
      promotion_id: true,
      covers: {
        orderBy: { id: "asc" },
        take: 1,
        select: { id: true, url: true },
      }, // Adjust fields as needed
      parentcateogries: { select: { id: true, name: true } },
      childcategories: { select: { id: true, name: true } },
      Stock: {
        select: { id: true, Stockvalue: { select: { id: true, qty: true } } },
      },
    };

    let totalproduct = 0;
    let allproduct: Array<Partial<Products | ProductState>> = [];
    let lowstock = 0;

    if (ty === "filter" || ty === "all") {
      // Add low stock filter
      if (sk === "Low") {
        where.Stock = { some: { Stockvalue: { some: { qty: { lte: 5 } } } } };
      }

      const products = await Prisma.products.findMany({
        where,
        select: {
          ...select,
          Stock: {
            select: {
              id: true,
              Stockvalue: { select: { id: true, qty: true } },
            },
          },
        },
        orderBy: { price: priceorder === 1 ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      totalproduct = await Prisma.products.count({ where });
      allproduct = products.map((prod) => ({
        ...prod,
        category: {
          parent: prod.parentcateogries,
          child: prod.childcategories,
        },
        lowstock: prod.Stock.some((stock) =>
          stock.Stockvalue.some((val) => val.qty <= 5)
        ),
      })) as unknown as Array<ProductState>;
      lowstock = allproduct.filter((p) => (p as ProductState)?.lowstock).length;
    } else if (ty === "detail") {
      const colors = detailcolor?.split(",");
      const texts = detailtext?.split(",");
      where.Variant = {
        some: {
          OR: [
            ...(colors
              ? [
                  {
                    option_type: "COLOR",
                    option_value: { some: { val: { in: colors } } },
                  },
                ]
              : []),
            ...(texts
              ? [{ option_type: "TEXT", option_value: { contains: texts } }]
              : []),
          ],
        },
      } as never;

      const products = await Prisma.products.findMany({
        where,
        select: {
          ...select,
          Variant: true,
          details: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      totalproduct = await Prisma.products.count({ where });
      allproduct = products as never;
    } else {
      // Default case for promotionid handling
      const products = await Prisma.products.findMany({
        where,
        select: {
          id: true,
          discount: true,
          price: true,
          name: true,
          covers: select.covers,
          promotion_id: true,
        },
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      totalproduct = await Prisma.products.count({ where });
      allproduct = products as unknown as ProductState[];
    }

    // Transform results
    const result: ProductState[] = allproduct.map((product) => {
      const prod = product as Products;
      return {
        ...product,
        ...(product.discount && {
          discount: calculateDiscountProductPrice({
            price: prod.price,
            discount: prod.discount as never,
          }),
        }),
      } as ProductState;
    });

    return {
      success: true,
      data: result,
      lowstock,
      total: Math.ceil(totalproduct / limit),
      totalfilter: totalproduct,
    };
  } catch (error) {
    console.error("Get Allproduct:", error);
    return { success: false, data: [], lowstock: 0, total: 0, totalfilter: 0 };
  }
};

export const EditProduct = async (
  data: updateProductData
): Promise<{ success: boolean; error?: string; id?: number }> => {
  try {
    const {
      id,
      name,
      description,
      price,
      stock,
      category,
      covers,
      details,
      variants,
      varaintstock,
      stocktype,
      type,
      relatedproductid,
    } = data;

    const existProduct = await Prisma.products.findUnique({
      where: { id },
      include: {
        Variant: true,
        Stock: true,
        covers: true,
        details: true,
        relatedproduct: true,
      },
    });

    if (!existProduct) {
      return { success: false };
    }

    // Batch updates into a single Prisma transaction
    const updates: Promise<Products>[] = [];

    // Stocktype and price updates
    if (
      (stocktype || price) &&
      (stocktype !== existProduct.stocktype || price !== existProduct.price)
    ) {
      updates.push(
        Prisma.products.update({
          where: { id },
          data: {
            stock:
              stocktype === "variant" || stocktype === "size"
                ? null
                : undefined,
            stocktype,
            price: price ? parseFloat(price.toString()) : undefined,
          },
        })
      );
    }

    // Name and description updates
    if (
      (name || description) &&
      (name !== existProduct.name || description !== existProduct.description)
    ) {
      updates.push(
        Prisma.products.update({
          where: { id },
          data: { name, description },
        })
      );
    }

    // Category updates
    const isCategoryChange =
      (category?.parent.id &&
        existProduct.parentcategory_id !== category.parent.id) ||
      (category?.child?.id &&
        existProduct.childcategory_id !== category.child.id);
    if (isCategoryChange) {
      updates.push(
        Prisma.products.update({
          where: { id },
          data: {
            parentcategory_id: category.parent.id,
            childcategory_id: category.child?.id,
          },
        })
      );
    }

    // Stock updates
    if (stock && stock !== 0 && stock !== existProduct.stock) {
      updates.push(
        Prisma.products.update({
          where: { id },
          data: { stock: parseInt(stock.toString()) },
        })
      );
    }

    // Execute all basic updates in a transaction
    if (updates.length > 0) {
      await Prisma.$transaction(updates as never);
    }

    // Type-specific updates
    if (type) {
      if (type === "editsize" && details) {
        const updatedetail = await updateDetails(details, id);
        if (updatedetail) return { success: true };
      } else if (type === "editvariantstock" && varaintstock?.length) {
        const updatestock = await updateProductVariantStock(varaintstock, id);
        if (updatestock) return { success: true };
      } else if (!varaintstock?.length) {
        await Prisma.stock.deleteMany({ where: { product_id: id } });
        return { success: true };
      }
      return { success: false };
    }

    // Covers updates
    if (covers?.length) {
      const [existingCovers, newCovers] = [
        covers.filter((i) => i.id),
        covers.filter((i) => !i.id),
      ];

      await Prisma.$transaction([
        ...existingCovers.map((i) =>
          Prisma.productcover.update({
            where: { id: i.id },
            data: { url: i.url, name: i.name, type: i.type },
          })
        ),
        ...newCovers.map((i) =>
          Prisma.productcover.create({
            data: {
              productId: id,
              name: i.name,
              type: i.type,
              url: i.url,
            },
          })
        ),
        Prisma.tempimage.deleteMany({
          where: { name: { in: covers.map((i) => i.name) } },
        }),
      ]);
    }

    // Details updates
    if (details?.length) {
      await updateDetails(details, id);
    }

    // Variants and variant stock
    if (variants?.length) {
      const updatevariant = await handleUpdateProductVariant(id, variants);
      if (!updatevariant) return { success: false };

      if (varaintstock?.length) {
        const updatestock = await updateProductVariantStock(varaintstock, id);
        if (!updatestock) return { success: false };
      } else {
        await Prisma.stock.deleteMany({ where: { product_id: id } });
      }
    } else {
      await Prisma.variant.deleteMany({ where: { product_id: id } });
    }

    // Related products
    if (relatedproductid) {
      if (relatedproductid.length === 0) {
        await Prisma.products.update({
          where: { id },
          data: { relatedproduct: { delete: {} } },
        });
      } else {
        const transaction = [
          Prisma.products.update({
            where: { id },
            data: {
              relatedproduct: {
                upsert: {
                  create: { productId: relatedproductid },
                  update: { productId: relatedproductid },
                },
              },
            },
            include: { relatedproduct: true },
          }),
        ];

        if (existProduct.relatedproduct?.productId) {
          const ids = existProduct.relatedproduct.productId as number[];
          const notinids = ids.filter((i) => !relatedproductid.includes(i));
          if (notinids.length > 0) {
            transaction.push(
              Prisma.products.updateMany({
                where: { id: { in: notinids } },
                data: { relatedproductId: null },
              }) as any
            );
          }
        }

        const [updaterelated] = await Prisma.$transaction(transaction);

        await Prisma.products.updateMany({
          where: { id: { in: relatedproductid } },
          data: { relatedproductId: updaterelated.relatedproduct?.id },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Edit Product", error);
    return { success: false, error: "Failed To Update Product" };
  }
};
