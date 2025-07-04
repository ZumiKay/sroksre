"use server";

import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  InvoiceProductPdfType,
  Ordertype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { Address } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  CountryCode,
  Paypalamounttype,
  Paypalitemtype,
  PaypalshippingType,
  PurcahseUnitType,
  ShippingOptionTypes,
  Shippingservice,
} from "@/src/context/Checkoutcontext";
import {
  calculateDiscountPrice,
  decrypt,
  encrypt,
  OrderReciptEmail,
} from "@/src/lib/utilities";
import nodemailer from "nodemailer";
import { generateInvoicePdf } from "../api/order/route";
import { formatDate } from "../component/EmailTemplate";
import getCheckoutdata from "@/src/app/checkout/getCheckOutData";
import { getUser } from "../action";
import { ActionReturnType } from "@/src/context/GlobalType.type";
import { StockType } from "../dashboard/inventory/inventory.type";
import {
  CheckOrderProduct,
  generateSessionId,
  getDateFromSessionId,
  isTimePassedByMinutes,
} from "./helper";

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
  sessionId: string;
};

export async function Createorder(data: {
  price: totalpricetype;
}): Promise<ActionReturnType<CreateOrderData>> {
  try {
    const [user, secretKey, sessionKey] = await Promise.all([
      getUser(),
      Promise.resolve(process.env.KEY),
      Promise.resolve(process.env.SESSION_KEY),
    ]);

    if (!secretKey || !sessionKey) {
      return { success: false, message: "Error Occurred" };
    }

    const checkOrder = await Prisma.orders.findFirst({
      where: {
        buyer_id: user?.id,
        status: { in: [Allstatus.incart, Allstatus.unpaid] },
      },
      select: {
        id: true,
        status: true,
        Orderproduct: {
          select: {
            quantity: true,
            stock_selected_id: true,
            stockvar: true,
            product: {
              select: {
                stock: true,
                stocktype: true,
              },
            },
          },
        },
      },
    });

    if (!checkOrder) {
      return { success: false, message: "No Item Found" };
    }

    const isOutOfStock = CheckOrderProduct({
      orderProduct: checkOrder.Orderproduct as unknown as Productordertype[],
    });

    if (isOutOfStock.length > 0) {
      return { success: false, message: isOutOfStock as string };
    }

    // Generate unique session ID with timestamp

    let uniqueSessionId = generateSessionId();

    // Check for uniqueness (very unlikely collision with timestamp + random)
    const existingSession = await Prisma.orders.findFirst({
      where: { sessionId: uniqueSessionId },
      select: { id: true },
    });

    if (existingSession) {
      uniqueSessionId = generateSessionId();
    }

    // Update order
    await Prisma.orders.update({
      where: { id: checkOrder.id },
      data: {
        sessionId: uniqueSessionId,
        price: data.price as never,
        ...(checkOrder.status === Allstatus.incart && {
          status: Allstatus.unpaid,
        }),
      },
    });

    // Encrypt IDs concurrently
    const [encryptId, encryptSessionId] = await Promise.all([
      Promise.resolve(encrypt(checkOrder.id, secretKey)),
      Promise.resolve(encrypt(uniqueSessionId, sessionKey)),
    ]);

    return {
      success: true,
      data: { orderId: encryptId, sessionId: encryptSessionId },
    };
  } catch (error) {
    console.error("Create Order Error:", error);
    return { success: false, message: "Error Occurred" };
  }
}

export async function checkOrder(id: string, sessionId: string) {
  try {
    const sessionKey = process.env.SESSION_KEY;
    if (!sessionKey) {
      return null;
    }

    const [order, decryptedSessionId] = await Promise.all([
      Prisma.orders.findFirst({
        where: {
          AND: [
            { id: id as string },
            { status: { in: [Allstatus.unpaid, Allstatus.paid] } },
          ],
        },
        select: { id: true, status: true, shipping_id: true, sessionId: true },
      }),
      Promise.resolve(decrypt(sessionId, sessionKey)),
    ]);

    if (!order?.sessionId || order.sessionId !== decryptedSessionId) {
      return null;
    }

    // Extract timestamp and verify expiration
    const timestamp = getDateFromSessionId(sessionId);

    if (!timestamp) return null;
    return isTimePassedByMinutes(timestamp.toISOString()) ? order : null;
  } catch (error) {
    console.error("Check order error:", error);
    return null;
  }
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

    const { stockProducts, variantProducts, productIds } =
      order.Orderproduct.reduce(
        (acc, cart) => {
          if (!cart.product) return acc;

          acc.productIds.push(cart.product.id as number);

          if (cart.product.stocktype === StockType.Stock) {
            acc.stockProducts.push(cart.product.id as number);
          } else if (
            cart.product.stocktype === StockType.Variant &&
            cart.stock_selected_id
          ) {
            acc.variantProducts.push({
              stockValueId: cart.stock_selected_id,
              quantity: cart.quantity,
            });
          }

          return acc;
        },
        {
          stockProducts: [] as number[],
          variantProducts: [] as { stockValueId: number; quantity: number }[],
          productIds: [] as number[],
        }
      );

    if (productIds.length === 0) {
      return { success: false, message: "No products found in order" };
    }

    // Prepare invoice data before transaction
    const invoiceProducts = order.Orderproduct.filter(
      (prob) => prob.product
    ).map((prob) => {
      const product = prob.product!;
      return {
        id: product.id,
        name: product.name,
        price: {
          price: product.price,
          discount: (product.discount as never) ?? undefined,
        },
        selectedVariant: prob.selectedvariant?.map((variant) =>
          typeof variant === "string" ? variant : variant?.name ?? ""
        ),
        quantity: prob.quantity,
        totalprice:
          prob.quantity *
          (product.discount
            ? Number(product.discount.newprice)
            : product.price),
      };
    }) as Array<InvoiceProductPdfType>;

    // Execute database transaction and generate invoice concurrently
    const [, invoice] = await Promise.all([
      Prisma.$transaction(async (tx) => {
        const operations = [
          // Update order status first (fastest operation)
          tx.orders.update({
            where: { id: orderid },
            data: { status: Allstatus.paid },
          }),

          // Update sold amount for all products
          tx.products.updateMany({
            where: { id: { in: productIds } },
            data: { amount_sold: { increment: 1 } },
          }),
        ];

        // Add stock operations if needed
        if (stockProducts.length > 0) {
          operations.push(
            tx.products.updateMany({
              where: {
                id: { in: stockProducts },
                stock: { gt: 0 },
              },
              data: { stock: { decrement: 1 } },
            })
          );
        }

        // Execute main operations
        await Promise.all(operations);

        // Handle variant products sequentially (due to individual stock values)
        if (variantProducts.length > 0) {
          await Promise.all(
            variantProducts.map(({ stockValueId, quantity }) =>
              tx.stockvalue.update({
                where: {
                  id: stockValueId,
                  qty: { gt: 0 },
                },
                data: { qty: { decrement: quantity } },
              })
            )
          );
        }
      }),

      // Generate invoice concurrently with database operations
      generateInvoicePdf({
        id: order.id as string,
        product: invoiceProducts,
        price: order.price as unknown as totalpricetype,
        shipping: order.shipping as never,
        createdAt: formatDate(order.createdAt as Date),
      }),
    ]);

    // Send emails concurrently
    const emailSubject = `Order #${order.id} receipt and processing for shipping`;
    const htmlTemplate = OrderReciptEmail(html);

    await Promise.all([
      order.user?.email &&
        SendOrderEmail(htmlTemplate, order.user.email, emailSubject, invoice),
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
            stockvar: true,
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

    // Check for product stock availability
    const isOutOfStock = CheckOrderProduct({
      orderProduct: order.Orderproduct as unknown as Productordertype[],
    });

    if (isOutOfStock.length > 0) {
      return {
        success: true,
        error: isOutOfStock,
      };
    }

    if (!accessToken) {
      return { success: false, message: "Invalid Token" };
    }
    const currency_code = "USD";
    const orderPrice = order.price as unknown as totalpricetype;
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
      type: "SHIPPING",
      name: {
        full_name: `${order.shipping?.firstname || order.user.firstname} ${
          order.shipping?.lastname || order.user.lastname || ""
        }`.trim(),
      },
      ...(order.shipping
        ? {
            address: {
              address_line_1: `${order.shipping?.street}`,
              address_line_2: `${order.shipping?.houseId} ${order.shipping?.songkhat} ${order.shipping?.district}`,
              admin_area_2: order.shipping?.province,
              postal_code: order.shipping?.postalcode ?? "",
              country_code: CountryCode.cambodia,
            },
          }
        : {}),
    };

    const purchase_units: PurcahseUnitType =
      order.shippingtype !== ShippingOptionTypes.pickup
        ? {
            amount: orderAmount,
            items: orderItems,
          }
        : { amount: orderAmount, items: orderItems, shipping: orderShipping };
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
