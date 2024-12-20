"use server";

import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  Ordertype,
  Productordertype,
  getUser,
  totalpricetype,
} from "@/src/context/OrderContext";
import { Orderproduct } from "@prisma/client";
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
  calculateDiscountProductPrice,
  encrypt,
  generateRandomNumber,
  OrderReciptEmail,
} from "@/src/lib/utilities";
import { ProductStockType } from "../component/ServerComponents";
import nodemailer from "nodemailer";
import { shippingtype } from "../component/Modals/User";
import { getCheckoutdata } from "./page";
import { generateInvoicePdf } from "../api/order/route";
import { formatDate } from "../component/EmailTemplate";

interface Returntype<k = string> {
  success: boolean;
  data?: any;
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

export async function Createorder(data: {
  price: totalpricetype;
  incartProduct: number[];
}): Promise<Returntype<any>> {
  const user = await getUser();

  const userid = user?.id;
  let orderId = "";
  try {
    const checkOrder = await Prisma.orders.findFirst({
      where: {
        AND: [
          {
            buyer_id: userid,
          },
          {
            status: Allstatus.unpaid,
          },
        ],
      },
    });

    if (!checkOrder) {
      let generateID = "SSC" + generateRandomNumber();
      let isExist = true;
      while (isExist) {
        const isId = await Prisma.orders.findUnique({
          where: { id: generateID },
        });
        if (isId) {
          isExist = true;
          generateID = "SSC" + generateRandomNumber();
        } else {
          isExist = false;
        }
      }

      const create = await Prisma.orders.create({
        data: {
          id: generateID,
          buyer_id: userid as any,
          status: Allstatus.unpaid,
          price: data.price as any,
          shippingtype: Shippingservice[2].value,
        },
      });
      orderId = create.id;
    } else {
      orderId = checkOrder?.id as string;
    }

    //Update incart product

    await Promise.all(
      data.incartProduct.map((i) =>
        Prisma.orderproduct.updateMany({
          where: { id: i },
          data: {
            orderId,
          },
        })
      )
    );

    const encryptId = encrypt(orderId, process.env.KEY as string);
    return {
      success: true,
      data: { orderId, encrypt: encryptId },
    };
  } catch (error) {
    console.log("Create Order", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function checkOrder(id: string) {
  const isOrder = await Prisma.orders.findUnique({
    where: { id },
    select: { id: true, status: true },
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

export interface OrderUserType extends Ordertype {
  user: {
    id: number;
    firstname: string;
    lastname?: string;
    email: string;
  };
  Orderproduct: Productordertype[];
  createdAt: Date;
  shipping?: shippingtype;
}

export async function updateStatus(
  orderid: string,
  html: string,
  adminhtml: string
): Promise<Returntype> {
  try {
    const order = await getCheckoutdata(orderid);

    if (!order) {
      return { success: false, status: 404 };
    }

    // Prepare updates
    const productUpdates: Array<Promise<any>> = [];
    const stockUpdates: Array<Promise<any>> = [];

    order.Orderproduct.forEach((cart) => {
      const { stocktype, Stock } = cart.product;

      if (stocktype === ProductStockType.stock) {
        productUpdates.push(
          Prisma.products.updateMany({
            where: {
              AND: [
                {
                  id: cart.product.id,
                },
                {
                  stock: { not: 0 },
                },
              ],
            },
            data: { stock: { decrement: cart.quantity } },
          })
        );
      } else {
        const stockValueIds = Stock.flatMap((sk) =>
          sk.Stockvalue.map((sv) => sv.id)
        );
        stockUpdates.push(
          Prisma.stockvalue.updateMany({
            where: {
              AND: [
                {
                  id: { in: stockValueIds },
                },
                { qty: { not: 0 } },
              ],
            },
            data: { qty: { decrement: cart.quantity } },
          })
        );
      }
    });

    // Execute all updates concurrently
    await Promise.all([
      ...productUpdates,
      ...stockUpdates,
      Prisma.products.updateMany({
        where: {
          id: { in: order.Orderproduct.map((i) => i.productId) },
        },
        data: { amount_sold: { increment: 1 } },
      }),
      Prisma.orders.update({
        where: { id: orderid },
        data: { status: Allstatus.paid },
      }),
      Prisma.orderproduct.updateMany({
        where: { orderId: orderid },
        data: { status: Allstatus.paid },
      }),
    ]);

    // Prepare email sending concurrently
    const emailSubject = `Order #${order.id} receipt and processing for shipping`;
    const htmltemplate = OrderReciptEmail(html);

    const createInvoice = await generateInvoicePdf({
      id: order.id,
      product: order.Orderproduct.map((prob) => ({
        id: prob.product.id,
        name: prob.product.name,
        price: prob.price,
        selectedVariant: prob.selectedvariant.map((i) =>
          typeof i === "string" ? i : i?.name ?? ""
        ),
        quantity: prob.quantity,
        totalprice:
          prob.quantity * (prob.price.discount?.newprice ?? prob.price.price),
      })),
      price: order.price as unknown as totalpricetype,
      shipping: order.shipping as any,
      createdAt: formatDate(order.createdAt),
    });

    await Promise.all([
      SendOrderEmail(
        htmltemplate,
        order.user.email,
        emailSubject,
        createInvoice
      ),
      SendOrderEmail(
        adminhtml,
        process.env.EMAIL as string,
        `Order #${order.id} request`,
        createInvoice
      ),
    ]);

    return { success: true, message: "Payment completed" };
  } catch (error) {
    console.error("Update status error:", error);
    return { success: false, message: "Error occurred" };
  }
}

export async function handleShippingAdddress(
  orderId: string,
  selected?: number,
  shippingdata?: shippingtype,
  isSave?: string
): Promise<Returntype> {
  try {
    let shipId = selected;
    const user = await getUser();

    if (!shipId && shippingdata && user && isSave) {
      //create shipping addresss
      const create = await Prisma.address.create({
        data: {
          userId: isSave === "1" ? user.id : undefined,
          firstname: shippingdata.firstname,
          lastname: shippingdata.lastname,
          houseId: shippingdata.houseId.toString(),
          district: shippingdata.district,
          songkhat: shippingdata.songkhat,
          province: shippingdata.province,
          postalcode: shippingdata.postalcode,
          street: shippingdata.street,
        },
      });
      shipId = create.id;
    }

    if (isSave) {
      const address = await Prisma.address.findUnique({
        where: { id: shipId },
      });

      if (address && !address.userId && isSave === "1") {
        await Prisma.address.update({
          where: { id: shipId },
          data: { userId: user?.id },
        });
      }
    }

    //Update order
    await Prisma.orders.update({
      where: { id: orderId },
      data: {
        shipping_id: shipId === 0 ? null : shipId,
        status: Allstatus.unpaid,
      },
    });
    return { success: true };
  } catch (error) {
    console.log("Shipping Address", error);
    return { success: false, message: "Error Occured" };
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
        price: updatePrice as any,
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

export async function Createpaypalorder(orderId: string): Promise<Returntype> {
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

    let orderItems: Paypalitemtype[] = order.Orderproduct.map((i) => {
      const price = i.product.discount
        ? calculateDiscountProductPrice({
            price: i.product.price,
            discount: i.product.discount,
          }).discount?.newprice?.toFixed(2) ?? "0.00"
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

    let orderAmount: Paypalamounttype = {
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

    let orderShipping: PaypalshippingType = {
      type: shippingtype?.value !== "Pickup" ? "SHIPPING" : "NO_SHIPPING",
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

export async function CaptureOrder(orderId: string): Promise<Returntype> {
  try {
    const accessToken = await generateAccessToken();
    const url = `${process.env.PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`;
    const header = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const request = await fetch(url, {
      method: "POST",
      headers: header,
    });
    const jsonResponse = await request.json();
    return { success: true, data: jsonResponse };
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
