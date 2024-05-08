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
  getmaxqtybaseStockType,
} from "@/src/lib/utilities";
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
      where: { AND: [{ id: data.id }, { user_id: userid.sub }] },
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
    const user = await getServerSession(authOptions);
    const userId = user?.user as Usersessiontype;

    if (!userId) {
      return { success: true };
    }

    const orderProducts = await Prisma.orderproduct.findMany({
      where: {
        AND: [
          {
            user_id: userId.id,
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
