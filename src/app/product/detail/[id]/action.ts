"use server";

import { ProductState } from "@/src/context/GlobalContext";
import {
  Allstatus,
  getUser,
  Productorderdetailtype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import {
  calculateDiscountProductPrice,
 
} from "@/src/lib/utilities";

import { revalidatePath } from "next/cache";

interface returntype {
  success: boolean;
  message?: string;
  data?: any;
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

    if (!user) {
      return {
        success: false,
        user: false,
        message: "Please register account",
      };
    }

    const isProduct = await Prisma.products.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!isProduct) {
      return { success: false, message: "Product not found" };
    }

    //create in cart product

    await Prisma.orderproduct.create({
      data: {
        productId: id,
        user_id: user.id,
        quantity: quantity,
        details: details ?? "",
        status: Allstatus.incart,
      },
    });

    return { success: true, message: "Added to cart" };
  } catch (error) {
    console.log("Cart", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function CheckCart(
  selectedDetail?: Productorderdetailtype[],
  product_id?: number
): Promise<returntype> {
  try {
    let isInCart = false;
    const user = await getUser();

    if (!user) {
      return { success: true };
    }

    const orderProducts = await Prisma.orderproduct.findMany({
      where: {
        AND: [
          {
            user_id: user.id,
          },
          {
            status: Allstatus.incart || Allstatus.unpaid,
          },
        ],
      },
      select: {
        details: true,
        productId: true,
        product: {
          select: {
            stocktype: true,
          },
        },
      },
    });

    if (orderProducts.length === 0) {
      return { success: true };
    }

    if (selectedDetail && selectedDetail.length > 0) {
      const cartItems = orderProducts as unknown as Productordertype[];
      if (cartItems.some((i) => i.details)) {
        isInCart = cartItems.some((cart) => {
          const detail = cart.details?.filter((i) => i);
          const areArraysEqual =
            detail?.length === selectedDetail.length &&
            detail?.every((obj, index) =>
              Object.entries(obj).every(
                ([key, value]) => value === selectedDetail[index][key]
              )
            );
          return areArraysEqual;
        });
      }
    } else {
      isInCart = orderProducts.some((cart) => cart.productId === product_id);
    }

    return { success: true, incart: isInCart };
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
    let result = await Prisma.products.findMany({
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

    let product = result.map((i) => {
      const discount =
        i.discount &&
        calculateDiscountProductPrice({
          price: i.price,
          discount: i.discount,
        });
      return {
        ...i,
        discount: discount && discount.discount,
        category: {
          parent_id: i.parentcategory_id,
          child_id: i.childcategory_id,
        },
      };
    }) as unknown as ProductState[];

    //Finding The most similar product
    let relatedProducts = product
      .map((i) => {
        let score = 0;
        if (
          parent_id &&
          child_id &&
          promoid &&
          i.category.parent_id === parent_id &&
          i.category?.child_id === child_id &&
          i.promotion_id === promoid
        ) {
          score = 4;
        } else if (promoid && promoid === i.promotion_id) {
          score = 3;
        } else if (child_id && i.category?.child_id === child_id) {
          score = 2;
        } else if (i.category.parent_id === parent_id) {
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
