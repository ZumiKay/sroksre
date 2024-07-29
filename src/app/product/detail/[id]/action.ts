"use server";

import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { ProductStockType } from "@/src/app/component/ServerComponents";
import { ProductState, Usersessiontype } from "@/src/context/GlobalContext";
import {
  Allstatus,
  getUser,
  Orderpricetype,
  Productorderdetailtype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import {
  calculateCartTotalPrice,
  calculateDiscountProductPrice,
  getDiscountedPrice,
  getmaxqtybaseStockType,
} from "@/src/lib/utilities";
import e from "express";
import { getServerSession } from "next-auth";
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
    const user = await getServerSession(authOptions);
    const userid = user?.user as Usersessiontype;

    if (!userid) {
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
        user_id: userid.id,
        quantity: quantity,
        details: details.filter((i) => i) ?? [],
        status: Allstatus.incart,
      },
    });
    await Prisma.products.update({
      where: { id },
      data: { amount_wishlist: { increment: 1 } },
    });

    revalidatePath(`/product/detail/${data.productId}`);
    revalidatePath("/checkout");

    return { success: true, message: "Added to cart" };
  } catch (error) {
    console.log("Cart", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function Editcart(data: {
  id: number;
  qty: number;
}): Promise<returntype> {
  try {
    const user = await getServerSession(authOptions);
    const userid = user?.user as Usersessiontype;
    let totalPrice: totalpricetype = {
      vat: 1,
      subtotal: 0,
      total: 0,
    };

    if (!userid.sub) {
      return {
        success: false,
        user: false,
        message: "Please register and account",
        status: 401,
      };
    }

    //update totalprice

    const editProduct = await Prisma.orderproduct.findUnique({
      where: { id: data.id },
    });

    if (!editProduct) {
      return { success: false, status: 404 };
    }

    let orderProducts = [];

    if (editProduct.orderId) {
      orderProducts = await Prisma.orderproduct.findMany({
        where: { orderId: editProduct.orderId },
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              price: true,
              discount: true,
            },
          },
        },
      });
    } else {
      orderProducts = await Prisma.orderproduct.findMany({
        where: { AND: [{ user_id: userid.id }, { status: Allstatus.incart }] },
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              price: true,
              discount: true,
            },
          },
        },
      });
    }
    orderProducts.forEach((i) => {
      const price = parseFloat(i.product.price.toString());

      if (i.id === editProduct.id) {
        totalPrice.subtotal += price * data.qty;
      } else {
        totalPrice.subtotal += price * i.quantity;
      }
    });

    if (editProduct.orderId) {
      await Prisma.orders.update({
        where: { id: editProduct.orderId },
        data: { price: JSON.stringify(totalPrice) },
      });
    }

    await Prisma.orderproduct.updateMany({
      where: { AND: [{ id: data.id }, { user_id: userid.id }] },
      data: { quantity: data.qty },
    });

    revalidatePath("/checkout");
    return { success: true, total: totalPrice };
  } catch (error) {
    console.log("edit cart", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function Deletecart(id: number): Promise<returntype> {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, status: 401 };
    }

    const order = await Prisma.orderproduct.findUnique({
      where: {
        id,
      },
      select: {
        order: { select: { id: true } },
        details: true,
        quantity: true,
        product: {
          select: {
            stocktype: true,
            stock: true,
          },
        },
      },
    });

    if (order && order.order) {
      const orderItem = await Prisma.orderproduct.findMany({
        where: {
          AND: [{ orderId: order.order.id }, { user_id: user.id }],
        },
      });
      if (orderItem.length === 1) {
        await Prisma.orders.delete({ where: { id: order.order.id } });
      }
    }

    await Prisma.orderproduct.delete({ where: { id } });
    const { total } = await Getcarts();
    revalidatePath("/checkout");
    return { success: true, message: "Delete successfully", total };
  } catch (error) {
    return { success: false, message: "Failed to delete" };
  }
}

export async function Getcarts(): Promise<returntype> {
  try {
    const user = await getServerSession(authOptions);
    const userid = user?.user as Usersessiontype;

    if (!userid.sub) {
      return {
        success: true,
        message: "No items in cart",
      };
    }

    const orderprodct = await Prisma.orderproduct.findMany({
      where: {
        AND: [
          {
            user_id: userid.id,
          },
          {
            status: Allstatus.incart,
          },
        ],
      },
      select: {
        id: true,
        productId: true,
        quantity: true,
        details: true,
        orderId: true,
        product: {
          select: {
            name: true,
            covers: true,
            price: true,
            discount: true,
            stocktype: true,
            stock: true,
            Stock: true,
            details: true,
          },
        },
      },
    });

    let cartitems = orderprodct.map((i) => {
      return {
        ...i,

        product: {
          ...i.product,
          varaintstock: i.product.Stock,
          Stock: undefined,
        },
      };
    });

    if (cartitems) {
      cartitems = cartitems.map((i) => {
        if (i.product) {
          const oldprice = i.product.price;
          const percent = i.product.discount;
          const detail = i.details as unknown as Productorderdetailtype[];
          const price: Orderpricetype = {
            price: oldprice,
            discount: percent
              ? {
                  percent: percent,
                  newprice: oldprice - (oldprice * percent) / 100,
                }
              : undefined,
          };

          const maxqty = getmaxqtybaseStockType(
            i.product as unknown as ProductState,
            detail.filter((i) => i).map((i) => i.option_value)
          );

          return { ...i, price, maxqty };
        } else {
          return i;
        }
      });

      //Calculate total price
      const price = calculateCartTotalPrice(
        cartitems as unknown as Productordertype[]
      );
      const total: totalpricetype = {
        subtotal: price,
        total: price,
      };

      return { success: true, data: cartitems, total };
    }

    return { success: true, message: "No item in cart" };
  } catch (error) {
    console.log("Get Cart", error);
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

    if (selectedDetail) {
      const cartItems = orderProducts as unknown as Productordertype[];
      isInCart = cartItems.some((cart) => {
        const detail = cart.details.filter((i) => i);
        const areArraysEqual =
          detail.length === selectedDetail.length &&
          detail.every((obj, index) =>
            Object.entries(obj).every(
              ([key, value]) => value === selectedDetail[index][key]
            )
          );
        return areArraysEqual;
      });
    } else {
      isInCart =
        orderProducts.filter(
          (i) => i.product.stocktype === ProductStockType.stock
        ).length !== 0;
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
      const discount = i.discount && getDiscountedPrice(i.discount, i.price);
      return {
        ...i,
        discount: discount && {
          ...discount,
          newprice: discount.newprice.toFixed(2),
        },
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
    return;
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
