"use server";

import { getUser } from "@/src/app/action";
import { ProductState } from "@/src/context/GlobalType.type";
import {
  Allstatus,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType } from "@prisma/client";
import { calculateDiscountPrice } from "@/src/lib/utilities";

import { revalidatePath } from "next/cache";

interface returntype {
  success: boolean;
  message?: string;
  data?: unknown;
  user?: boolean;
  total?: totalpricetype;
  maxqty?: number;
  incart?: boolean;
  status?: number;
}

export async function Addtocart(data: Productordertype): Promise<returntype> {
  try {
    const { details, quantity, id } = data;
    const user = await getUser();

    // Early validation checks
    if (!user) {
      return {
        success: false,
        user: false,
        message: "Please register account",
      };
    }

    // Run product check in parallel with transaction
    const productCheckPromise = Prisma.products.findUnique({
      where: { id },
      select: { id: true },
    });

    // Execute transaction with optimized queries
    const transactionPromise = Prisma.$transaction(
      async (tx) => {
        // Check for recent cart with optimized query
        const isOrderInCart = await tx.orders.findFirst({
          where: {
            AND: [
              { status: Allstatus.incart },
              { buyer_id: user.id },
              {
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              },
            ],
          },
          select: { id: true },
        });

        // Prepare cart item data

        if (isOrderInCart) {
          // Update existing cart - more efficient update
          const orderproduct = await tx.orderproduct.create({
            data: {
              orderId: isOrderInCart.id,
              productId: id,
              user_id: user.id,
              quantity,
            },
          });

          if (details) {
            await Promise.all(
              details.map((selectedDetail) =>
                tx.orderproductVariant.create({
                  data: {
                    variantId: selectedDetail.variantId,
                    variantIdx: selectedDetail.variantIdx,
                    orderproductId: orderproduct.id,
                  },
                })
              )
            );
          }

          return { orderId: isOrderInCart.id };
        } else {
          // Generate SSC order ID with numeric suffix
          let orderId = generateSSCOrderId();

          // Single query validation
          const existingOrder = await tx.orders.findUnique({
            where: { id: orderId },
            select: { id: true },
          });

          // In the rare case of collision, generate another ID
          if (existingOrder) {
            orderId = generateSSCOrderId();
          }

          // Create new cart with custom ID
          const order = await tx.orders.create({
            data: {
              id: orderId,
              buyer_id: user.id,
              status: Allstatus.incart,
              price: {},
            },
            select: { id: true },
          });

          // Create cart item in separate query for better performance
          const orderproduct = await tx.orderproduct.create({
            data: {
              orderId: order.id,
              productId: id,
              user_id: user.id,
              quantity,
            },
          });

          if (details) {
            await Promise.all(
              details.map((selectedDetail) =>
                tx.orderproductVariant.create({
                  data: {
                    variantId: selectedDetail.variantId,
                    variantIdx: selectedDetail.variantIdx,
                    orderproductId: orderproduct.id,
                  },
                })
              )
            );
          }

          return { orderId: order.id };
        }
      },
      {
        maxWait: 2500, // Reduced wait time
        timeout: 5000, // Reduced timeout
        isolationLevel: PrismaType.TransactionIsolationLevel.ReadCommitted, // Less restrictive isolation
      }
    );

    // Run product check and transaction in parallel
    const [isProduct] = await Promise.all([
      productCheckPromise,
      transactionPromise,
    ]);

    // Product validation after transaction (prevents unnecessary transaction aborts)
    if (!isProduct) {
      return { success: false, message: "Product not found" };
    }

    revalidatePath("/product/detail/" + data.id);

    return { success: true, message: "Added to cart" };
  } catch (error) {
    console.error(
      "Cart error:",
      error instanceof Error ? error.message : error
    );
    return { success: false, message: "Error Occurred" };
  }
}

/**
 * Generate unique order ID that:
 * - Starts with "SSC"
 * - Followed by only numbers
 * - Total length exactly 10 characters
 *
 * Format: "SSC" + 7 digits (e.g., SSC1234567)
 */
function generateSSCOrderId(): string {
  // Get current timestamp milliseconds
  const timestamp = Date.now() % 10000000; // Last 7 digits of current timestamp

  // Generate random number between 0-9999999 (7 digits max)
  const randomNum = Math.floor(Math.random() * 10000000);

  // Combine timestamp and random for better uniqueness
  // Use modulo to ensure we get exactly 7 digits
  const combined = (timestamp + randomNum) % 10000000;

  // Pad with zeros to ensure 7 digits
  const paddedNumber = combined.toString().padStart(7, "0");

  // Prefix with SSC
  return `SSC${paddedNumber}`;
}

export async function CheckCart(pid: number): Promise<returntype> {
  try {
    // Improved query with proper OR condition for status
    const orderProducts = await Prisma.orderproduct.count({
      where: {
        AND: [
          {
            order: {
              status: {
                in: [Allstatus.incart, Allstatus.unpaid],
              },
            },
          },

          {
            productId: pid,
          },
        ],
      },
    });

    return { success: true, incart: orderProducts !== 0 };
  } catch (error) {
    console.error("Check cart", error);
    return { success: false, message: "Network error" };
  }
}

export const getRelatedProduct = async (
  targetId: number,
  parent_id: number,
  limit: number,
  child_id?: number,
  promoid?: number
) => {
  try {
    let maxprod = false;
    const result = await Prisma.products.findMany({
      where: {
        id: { not: targetId },
      },
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        parentcategory_id: true,
        promotion_id: true,
        childcategory_id: true,
        covers: {
          select: {
            name: true,
            url: true,
          },
        },
      },
    });

    const product = result.map((i) => {
      const discount =
        i.discount && calculateDiscountPrice(i.price, i.discount);
      return {
        ...i,
        discount,
      };
    }) as unknown as Array<ProductState>;

    //Finding The most similar product
    let relatedProducts = product
      .map((i) => {
        let score = 0;
        if (
          parent_id &&
          child_id &&
          promoid &&
          i.category.parent?.id === parent_id &&
          i.category?.child?.id === child_id &&
          i.promotion_id === promoid
        ) {
          score = 4;
        } else if (promoid && promoid === i.promotion_id) {
          score = 3;
        } else if (child_id && i.childcategory_id === child_id) {
          score = 2;
        } else if (i.parentcategory_id === parent_id) {
          score = 1;
        }
        return { ...i, score };
      })
      .sort((a, b) => b.score - a.score);

    relatedProducts = relatedProducts.filter((i) => i.score > 0);

    if (relatedProducts.length <= limit) {
      maxprod = true;
    }

    relatedProducts = relatedProducts.slice(0, limit);

    console.log(relatedProducts);

    return {
      success: true,
      data: relatedProducts,
      maxprod,
    };
  } catch (error) {
    console.log("Related product", error);
    return { success: false };
  }
};

export const AddWishlist = async (pid: number) => {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, message: "Please login or register account" };
    }
    const product = await Prisma.products.findUnique({
      where: { id: pid },
      select: { id: true },
    });

    if (!product) {
      return { success: false, message: "Product not found" };
    }
    await Prisma.wishlist.create({
      data: {
        pid,
        uid: user.id,
      },
    });

    await Prisma.products.update({
      where: { id: pid },
      data: { amount_wishlist: { increment: 1 } },
    });

    revalidatePath(`/product/detail/${pid}`);

    return { success: true, message: "Product Added" };
  } catch (error) {
    console.log("Wishlist", error);
    return { success: false, message: "Error occured" };
  }
};

export const Checkwishlist = async (pid: number) => {
  const user = await getUser();

  if (!user) {
    return { isExist: false };
  }

  try {
    const checkwishlist = await Prisma.wishlist.findFirst({
      where: {
        AND: [
          {
            uid: user.id,
          },
          {
            pid: parseInt(pid.toString()),
          },
        ],
      },
    });

    if (checkwishlist) {
      return { isExist: true };
    }
    return { isExist: false };
  } catch (error) {
    console.log("Wishlist", error);
    return null;
  }
};
