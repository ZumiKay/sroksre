"use server";

import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  InvoiceProductPdfType,
  Ordertype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { Address, Orderproduct } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  CountryCode,
  Paypalamounttype,
  Paypalitemtype,
  PaypalshippingType,
  PurcahseUnitType,
  Shippingservice,
} from "@/src/context/Checkoutcontext";
import {
  calculateDiscountPrice,
  encrypt,
  OrderReciptEmail,
} from "@/src/lib/utilities";
import { ProductStockType } from "../component/ServerComponents";
import nodemailer from "nodemailer";
import { generateInvoicePdf } from "../api/order/route";
import { formatDate } from "../component/EmailTemplate";
import getCheckoutdata from "@/src/app/checkout/getCheckOutData";
import { getUser } from "../action";
import { ActionReturnType } from "@/src/context/GlobalType.type";

interface Returntype<k = string> {
  success: boolean;
  data?: unknown;
  message?: k;
  status?: number;
}

export async function getAddress(orderid?: string) {
  const user = await getUser();

  const address = await Prisma.address.findMany({
    where: { userId: user?.id },
  });

  let selectedaddress;

  if (orderid) {
    selectedaddress = await Prisma.orders.findUnique({
      where: { id: orderid },
      select: { shipping_id: true, shipping: true },
    });
  }

  return { address, selectedaddress };
}

export async function getOrderAddress(orderId: string) {
  const address = await Prisma.orders.findUnique({
    where: { id: orderId },
    select: { shipping_id: true, shipping: true },
  });

  return address;
}

type CreateOrderData = {
  orderId: string;
};

export async function Createorder(data: {
  price: totalpricetype;
}): Promise<ActionReturnType<CreateOrderData>> {
  const user = await getUser();

  const userid = user?.id;
  let orderId = "";
  try {
    const secretKey = process.env.KEY || null;

    if (!secretKey) {
      return { success: false, message: "Error Occured" };
    }

    const checkOrder = await Prisma.orders.findFirst({
      where: {
        AND: [
          {
            buyer_id: userid,
          },
          {
            status: {
              in: [Allstatus.incart, Allstatus.unpaid],
            },
          },
        ],
      },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!checkOrder) {
      return { success: false, message: "No Item Found" };
    } else {
      orderId = checkOrder?.id as string;
    }

    //Update Price of the order
    await Prisma.orders.update({
      where: {
        id: orderId,
      },
      data: {
        price: data.price as never,
        ...(checkOrder.status === Allstatus.incart
          ? { status: Allstatus.unpaid }
          : {}),
      },
    });

    const encryptId = encrypt(orderId, process.env.KEY as string);

    return {
      success: true,
      data: { orderId: encryptId },
    };
  } catch (error) {
    console.log("Create Order", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function checkOrder(id: string) {
  const isOrder = await Prisma.orders.findUnique({
    where: { id },
    select: { id: true, status: true, shipping_id: true },
  });

  return isOrder;
}

export async function getOrderProduct(
  orderId: string
): Promise<Returntype<Array<Orderproduct>>> {
  const getProduct = await Prisma.orderproduct.findMany({
    where: { orderId },
    include: {
      product: {
        select: {
          id: true,
          covers: true,
          price: true,
          discount: true,
        },
      },
    },
  });
  return { success: true, data: getProduct };
}

export interface OrderUserType {
  user: {
    id: number;
    firstname: string;
    lastname?: string;
    email: string;
  };
  Orderproduct: Productordertype[];
  createdAt: Date;
  shipping?: Address;
}

export async function updateStatus(
  orderid: string,
  html: string,
  adminhtml: string
): Promise<Returntype> {
  try {
    const order = (await getCheckoutdata(orderid)) as unknown as Ordertype;

    if (!order) {
      return { success: false, status: 404, message: "Order not found" };
    }

    // Extract product IDs for batch operations
    const productIds = order.Orderproduct.map((cart) => cart.productId).filter(
      Boolean
    ) as number[];

    if (productIds.length === 0) {
      return { success: false, message: "No products found in order" };
    }

    // Prepare batch updates
    const updates: Promise<unknown>[] = [];

    // Group products by stock type for efficient updates
    const stockProducts: number[] = [];
    const variantProducts: {
      productId: number;
      stockValueIds: number[];
      quantity: number;
    }[] = [];

    order.Orderproduct.forEach((cart) => {
      if (!cart.product) return;

      const { stocktype, Stock } = cart.product;

      if (stocktype === ProductStockType.stock) {
        stockProducts.push(cart.product.id as number);
      } else if (Stock?.length) {
        const stockValueIds =
          cart.details?.map((i) => i.Orderproduct?.stock_selected_id) ?? [];

        if (stockValueIds.length > 0) {
          variantProducts.push({
            productId: cart.product.id as number,
            stockValueIds: stockValueIds as number[],
            quantity: cart.quantity,
          });
        }
      }
    });

    // Batch update stock products
    if (stockProducts.length > 0) {
      updates.push(
        Prisma.products.updateMany({
          where: {
            id: { in: stockProducts },
            stock: { gt: 0 },
          },
          data: { stock: { decrement: 1 } },
        })
      );
    }

    // Batch update variant products
    variantProducts.forEach(({ stockValueIds, quantity }) => {
      updates.push(
        Prisma.stockvalue.updateMany({
          where: {
            id: { in: stockValueIds },
            qty: { gt: 0 },
          },
          data: { qty: { decrement: quantity } },
        })
      );
    });

    // Add other updates
    updates.push(
      // Update sold amount for all products
      Prisma.products.updateMany({
        where: { id: { in: productIds } },
        data: { amount_sold: { increment: 1 } },
      }),
      // Update order status
      Prisma.orders.update({
        where: { id: orderid },
        data: { status: Allstatus.paid },
      })
    );

    // Execute all database updates concurrently
    await Promise.all(updates);

    // Prepare invoice data
    const invoiceProducts = order.Orderproduct.map(
      (prob) =>
        prob.product && {
          id: prob.product.id,
          name: prob.product.name,
          price: {
            price: prob.product.price,
            discount: (prob.product.discount as never) ?? undefined,
          },
          selectedVariant: prob.selectedvariant?.map((variant) =>
            typeof variant === "string" ? variant : variant?.name ?? ""
          ),
          quantity: prob.quantity,
          totalprice:
            prob.quantity *
            (prob.product.discount
              ? Number(prob.product.discount.newprice)
              : prob.product.price),
        }
    ).filter(Boolean) as Array<InvoiceProductPdfType>;

    // Generate invoice and send emails concurrently
    const invoice = await generateInvoicePdf({
      id: order.id as string,
      product: invoiceProducts,
      price: order.price as unknown as totalpricetype,
      shipping: order.shipping as never,
      createdAt: formatDate(order.createAt as Date),
    });

    const emailSubject = `Order #${order.id} receipt and processing for shipping`;
    const htmlTemplate = OrderReciptEmail(html);

    // Send emails concurrently
    await Promise.all([
      order.user?.email &&
        SendOrderEmail(
          htmlTemplate,
          order?.user?.email as string,
          emailSubject,
          invoice
        ),
      SendOrderEmail(
        adminhtml,
        process.env.EMAIL as string,
        `Order #${order.id} request`,
        invoice
      ),
    ]);

    return { success: true, message: "Payment completed" };
  } catch (error) {
    console.error("Update status error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error occurred",
      status: 500,
    };
  }
}

export async function handleShippingAdddress(
  orderId: string,
  selected?: number,
  shippingdata?: Address,
  isSave?: string
): Promise<Returntype> {
  try {
    let shipId = selected;

    // Only get user if needed (when saving address or creating new one)
    const shouldGetUser = (!shipId && shippingdata) || isSave === "1";
    const user = shouldGetUser ? await getUser() : null;

    // Create new address if needed
    if (!shipId && shippingdata) {
      // Extract only the needed fields to avoid unnecessary object spread
      const addressData = {
        userId: isSave === "1" ? user?.id : undefined,
        firstname: shippingdata.firstname,
        lastname: shippingdata.lastname,
        houseId: shippingdata.houseId.toString(),
        district: shippingdata.district,
        songkhat: shippingdata.songkhat,
        province: shippingdata.province,
        postalcode: shippingdata.postalcode,
        street: shippingdata.street,
      };

      const create = await Prisma.address.create({ data: addressData });
      shipId = create.id;
    }

    // Update existing address with user ID if needed
    else if (shipId && isSave === "1" && user?.id) {
      // Only fetch and update if we need to save the address for the user
      const address = await Prisma.address.findUnique({
        where: { id: shipId },
        select: { userId: true }, // Only select the field we need
      });

      if (address && !address.userId) {
        await Prisma.address.update({
          where: { id: shipId },
          data: { userId: user.id },
        });
      }
    }

    // Update order with shipId
    await Prisma.orders.update({
      where: { id: orderId },
      data: {
        shipping_id: shipId === 0 ? null : shipId,
        status: Allstatus.unpaid,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Shipping Address Error:", error);
    return {
      success: false,
      message: "Error occurred while updating shipping information",
    };
  }
}

export async function updateShippingService(
  orderId: string,
  shippingtype: string
): Promise<Returntype> {
  try {
    let updatePrice: totalpricetype = {
      subtotal: 0,
      total: 0,
      shipping: 0,
    };

    const order = await Prisma.orders.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return { success: false, message: "Order not found" };
    }

    const subprice = order.price as unknown as totalpricetype;
    const shippingPrice =
      Shippingservice.find((i) => i.value === shippingtype)?.price ?? 0;

    updatePrice = {
      subtotal: subprice.subtotal,
      shipping: shippingPrice,
      total: subprice.subtotal + shippingPrice,
    };

    await Prisma.orders.update({
      where: {
        id: orderId,
      },
      data: {
        shippingtype,
        price: updatePrice as never,
      },
    });

    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.log("Shipping Service", error);
    return { success: false, message: "Error occured" };
  }
}

//Paypal Handler

const generateAccessToken = async () => {
  const paypal_id = process.env.NEXT_PUBLIC_PAYPAL_ID as string;
  const paypal_secret = process.env.PAYPAL_KEY as string;

  try {
    const auth = Buffer.from(paypal_id + ":" + paypal_secret).toString(
      "base64"
    );
    const response = await fetch(`${process.env.PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
    return null;
  }
};

export async function Createpaypalorder(orderId: string) {
  try {
    const accessToken = await generateAccessToken();

    const order = await Prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyer_id: true,
        status: true,
        estimate: true,
        price: true,
        shippingtype: true,
        shipping: true,
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        Orderproduct: {
          select: {
            id: true,
            details: true,
            quantity: true,
            product: {
              select: {
                id: true,
                covers: {
                  select: {
                    id: true,
                    url: true,
                  },
                },
                name: true,
                price: true,
                discount: true,
                stocktype: true,
                stock: true,
                Variant: true,
                Stock: {
                  select: {
                    Stockvalue: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, message: "Invalid Order", status: 404 };
    }

    if (!accessToken) {
      return { success: false, message: "Invalid Token" };
    }
    const currency_code = "USD";
    const orderPrice = order.price as unknown as totalpricetype;
    const shippingtype = Shippingservice.find(
      (i) => i.value === order.shippingtype
    );
    const url = `${process.env.PAYPAL_BASE}/v2/checkout/orders`;
    const header = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const orderItems: Paypalitemtype[] = order.Orderproduct.map((i) => {
      const price = i.product.discount
        ? calculateDiscountPrice(i.product.price, i.product.discount).newprice
        : parseFloat(i.product.price.toString()).toFixed(2);
      return {
        name: i.product.name,
        quantity: i.quantity.toString(),
        url: `${process.env.NEXTAUTH_URL}/product/detail/${i.product.id}`,
        unit_amount: {
          currency_code,
          value: price,
        },
      };
    });

    const orderAmount: Paypalamounttype = {
      currency_code,
      value: orderPrice.total.toFixed(2),
      breakdown: {
        shipping: {
          currency_code,
          value: orderPrice.shipping?.toFixed(2) ?? "0.00",
        },
        item_total: { currency_code, value: orderPrice.subtotal.toFixed(2) },
      },
    };

    const orderShipping: PaypalshippingType = {
      type: shippingtype?.value !== "Pickup" ? "SHIPPING" : "NO_SHIPPING",
      name: {
        full_name: `${order.shipping?.firstname || order.user.firstname} ${
          order.shipping?.lastname || order.user.lastname || ""
        }`.trim(),
      },
      ...(order.shipping && {
        address: {
          address_line_1: `${order.shipping?.street}`,
          address_line_2: `${order.shipping?.houseId} ${order.shipping?.songkhat} ${order.shipping?.district}`,
          admin_area_2: order.shipping?.province,
          postal_code: order.shipping?.postalcode ?? "",
          country_code: CountryCode.cambodia,
        },
      }),
    };

    const purchase_units: PurcahseUnitType = {
      amount: orderAmount,
      items: orderItems,
      shipping: orderShipping,
    };
    const payload = {
      intent: "CAPTURE",
      purchase_units: [purchase_units],
    };

    const request = await fetch(url, {
      headers: header,
      method: "POST",
      body: JSON.stringify(payload),
    });

    const jsonResponse = await request.json();

    return { success: true, data: jsonResponse, status: request.status };
  } catch (error) {
    console.log("Paypal Error", error);
    return { success: false, status: 500 };
  }
}

export async function CaptureOrder(orderId: string) {
  try {
    const accessToken = await generateAccessToken();
    const url = `${process.env.PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: response.statusText,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.log("Capture Order", error);
    return { success: false, status: 500 };
  }
}

//helper function

export const SendOrderEmail = async (
  html: string,
  to: string,
  subject: string,
  attachment?: Uint8Array
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APPKEY,
      },
    });
    const mailoptions = {
      from: `SrokSre <${process.env.EMAIL}>`,
      to: `<${to}>`,
      subject: subject,
      html: html,
    };

    await transporter.sendMail({
      ...mailoptions,
      attachments: attachment
        ? [
            {
              filename: `Invoice.pdf`,
              content: Buffer.from(attachment),
              contentType: "apllication/pdf",
            },
          ]
        : [],
    });
  } catch (error) {
    console.log("Send email", error);
    throw new Error("Email can't sent");
  }
};

interface Emaildata {
  to: string;
  subject: string;
  from?: string;
  html?: string;
  message?: string;
  warn?: string;
  title?: string;
}
export const handleEmail = async (data: Emaildata) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_APPKEY,
    },
  });

  const mailoptions = {
    from: data.from ? data.from : `SrokSre <${process.env.EMAIL}>`,
    to: `<${data.to}>`,
    subject: data.subject,
    html: OrderReciptEmail(data.html ?? ""),
  };
  try {
    await transporter.sendMail(mailoptions);
    return { success: true };
  } catch (error) {
    console.log("Send Email", error);
    return { success: false };
  }
};
