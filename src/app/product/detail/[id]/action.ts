"use server";

import { getUser } from "@/src/app/action";
import {
  Allstatus,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType, Products } from "@prisma/client";
import { calculateDiscountPrice } from "@/src/lib/utilities";

import { revalidatePath } from "next/cache";
import { ShippingOptionTypes } from "@/src/context/Checkoutcontext";

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
    const { details, quantity, id, stock_selected_id } = data;
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
      select: { id: true, price: true, discount: true },
    }) as unknown as Products;

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
              stock_selected_id: stock_selected_id,
              price: productCheckPromise.price,
              discount: productCheckPromise.discount,
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
              shippingtype: ShippingOptionTypes.pickup,
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
              price: productCheckPromise.price,
              discount: productCheckPromise.discount,
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

    // Build optimized query with proper filters and includes
    const whereClause: PrismaType.ProductsWhereInput = {
      id: { not: targetId },
      // Pre-filter to only get products that might be related
      OR: [
        { parentcategory_id: parent_id },
        ...(child_id ? [{ childcategory_id: child_id }] : []),
        ...(promoid ? [{ promotion_id: promoid }] : []),
      ],
    };

    const result = await Prisma.products.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        parentcategory_id: true,
        childcategory_id: true,
        promotion_id: true,
        stock: true,
        // Include category relations for proper access
        parentcateogries: {
          select: {
            id: true,
            name: true,
          },
        },
        childcategories: {
          select: {
            id: true,
            name: true,
          },
        },
        promotion: {
          select: {
            id: true,
            name: true,
            expireAt: true,
          },
        },
        covers: {
          take: 1, // Only get the first cover for performance
          select: {
            name: true,
            url: true,
          },
        },
      },
      // Add initial ordering to improve performance
      orderBy: [{ parentcategory_id: "asc" }, { createdAt: "desc" }],

      // Fetch more than needed for better scoring, but limit database load
      take: Math.min(limit * 3, 50),
    });

    // Enhanced scoring algorithm
    const now = new Date();
    const scoredProducts = result
      .map((product) => {
        let score = 0;
        const reasons: string[] = [];

        // Perfect match: same parent, child category, and promotion
        if (
          parent_id &&
          child_id &&
          promoid &&
          product.parentcategory_id === parent_id &&
          product.childcategory_id === child_id &&
          product.promotion_id === promoid &&
          product.promotion?.expireAt &&
          product.promotion.expireAt >= now
        ) {
          score = 100;
          reasons.push("Perfect match");
        }
        // High relevance: same promotion (active)
        else if (
          promoid &&
          product.promotion_id === promoid &&
          product.promotion?.expireAt &&
          product.promotion.expireAt >= now
        ) {
          score = 80;
          reasons.push("Same active promotion");
        }
        // Good relevance: same child category and parent category
        else if (
          child_id &&
          parent_id &&
          product.childcategory_id === child_id &&
          product.parentcategory_id === parent_id
        ) {
          score = 60;
          reasons.push("Same subcategory");
        }
        // Medium relevance: same child category only
        else if (child_id && product.childcategory_id === child_id) {
          score = 40;
          reasons.push("Same category");
        }
        // Low relevance: same parent category only
        else if (parent_id && product.parentcategory_id === parent_id) {
          score = 20;
          reasons.push("Same parent category");
        }

        // Bonus points for additional factors
        if (product.discount && product.discount > 0) {
          score += 5;
          reasons.push("Has discount");
        }

        if (product.stock && product.stock > 0) {
          score += 3;
          reasons.push("In stock");
        }

        // Calculate discounted price if applicable
        const discountInfo = product.discount
          ? calculateDiscountPrice(product.price, product.discount)
          : null;

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          discount: discountInfo,
          parentcategory_id: product.parentcategory_id,
          childcategory_id: product.childcategory_id,
          promotion_id: product.promotion_id,
          stock: product.stock,
          covers: product.covers,
          // Include category information properly
          category: {
            parent: product.parentcateogries,
            child: product.childcategories,
          },
          promotion: product.promotion,
          score,
          reasons, // For debugging
        };
      })
      // Filter out products with no relevance
      .filter((product) => product.score > 0)
      // Sort by score (highest first), then by stock status, then by discount
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.stock !== a.stock) return (b.stock || 0) - (a.stock || 0);
        return (b.discount?.percent || 0) - (a.discount?.percent || 0);
      });

    // Check if we have enough products
    maxprod = scoredProducts.length <= limit;

    // Get final selection
    const relatedProducts = scoredProducts.slice(0, limit);

    // Enhanced logging for debugging
    // console.log(`Related products for ${targetId}:`, {
    //   totalFound: result.length,
    //   afterScoring: scoredProducts.length,
    //   returned: relatedProducts.length,
    //   maxprod,
    //   topScores: relatedProducts.slice(0, 3).map((p) => ({
    //     id: p.id,
    //     name: p.name,
    //     score: p.score,
    //     reasons: p.reasons,
    //   })),
    // });

    return {
      success: true,
      data: relatedProducts,
      maxprod,
    };
  } catch (error) {
    console.error("Related product error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch related products",
    };
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
