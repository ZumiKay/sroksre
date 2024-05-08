"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  Ordertype,
  Productorderdetailtype,
  Productordertype,
  getUser,
  totalpricetype,
} from "@/src/context/OrderContext";
import { Orderproduct } from "@prisma/client";
import { shippingtype } from "../component/Modals";
import { revalidatePath } from "next/cache";
import {
  CountryCode,
  Paypalamounttype,
  Paypalitemtype,
  PaypalshippingType,
  PurcahseUnitType,
  Shippingservice,
} from "@/src/context/Checkoutcontext";

import { calculateDiscountPrice, encrypt } from "@/src/lib/utilities";
import {
  getQtyBasedOnOptions,
  ProductStockType,
} from "../component/ServerComponents";
import { infovaluetype, Stocktype } from "@/src/context/GlobalContext";
import nodemailer from "nodemailer";

interface Returntype<k = string> {
  success: boolean;
  data?: any;
  message?: k;
  status?: number;
}

export async function getAddress() {
  const user: any = await getServerSession(authOptions);
  const userid = user?.user?.sub ?? "";

  const address = await Prisma.address.findMany({ where: { userId: userid } });

  return address;
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
      const create = await Prisma.orders.create({
        data: {
          buyer_id: userid as string,
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
    firstname: string;
    lastname?: string;
    email: string;
  };
  Orderproduct: Productordertype[];
  createdAt: Date;
}

export async function updateStatus(
  orderid: string,
  html: string,
  adminhtml: string
): Promise<Returntype> {
  try {
    const order = await Prisma.orders.findUnique({
      where: { id: orderid },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
          },
        },
        Orderproduct: {
          include: {
            product: {
              select: {
                id: true,
                stocktype: true,
                Stock: true,
                stock: true,
                details: true,
                price: true,
                discount: true,
                covers: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, status: 404 };
    }

    // Batch updates
    const updates: Array<Record<string, any>> = [];

    order.Orderproduct.forEach((cart) => {
      const stocktype = cart.product.stocktype;
      const detail = cart.details as Productorderdetailtype[];

      if (stocktype === ProductStockType.stock) {
        updates.push(
          Prisma.products.update({
            where: { id: cart.product.id },
            data: {
              stock: {
                decrement: cart.quantity,
              },
            },
          })
        );
      } else if (stocktype === ProductStockType.size) {
        const info = cart.product.details as unknown as infovaluetype[];
        const updatedInfo = info.map((i) => {
          if (i.val === detail[0].option_value) {
            i.qty -= cart.quantity;
          }
          return i;
        });

        updates.push(
          Prisma.info.updateMany({
            where: { product_id: cart.product.id },
            data: {
              info_value: updatedInfo as any,
            },
          })
        );
      } else {
        const stock = cart.product.Stock as unknown as Stocktype[];
        const prevqty = getQtyBasedOnOptions(stock, detail);

        updates.push(
          Prisma.stock.update({
            where: {
              id: prevqty.id,
            },
            data: {
              qty: {
                decrement: cart.quantity,
              },
            },
          })
        );
      }
    });

    // Execute all updates concurrently
    await Promise.all(updates);

    // Update order status
    await Prisma.orders.update({
      where: { id: orderid },
      data: {
        status: Allstatus.paid,
      },
    });

    await Prisma.orderproduct.updateMany({
      where: { orderId: orderid },
      data: { status: Allstatus.paid },
    });

    const emailSubject = `Order #${order.id} receipt and processing for shipping`;

    const htmltemplate = OrderReciptEmail(html);

    // Send order email
    await SendOrderEmail(htmltemplate, order.user.email, emailSubject);

    //Send for admin
    await SendOrderEmail(
      adminhtml,
      process.env.EMAIL as string,
      `Order #${order.id} request`
    );

    // Invalidate cache or revalidate path

    revalidatePath("/");
    revalidatePath("checkout");

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
          houseId: shippingdata.houseId.toString(),
          district: shippingdata.district,
          songkhat: shippingdata.songkhat,
          province: shippingdata.province,
          postalcode: shippingdata.postalcode,
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

export async function shippingType(
  selected: { type: string; price: number },
  orderId: string
): Promise<Returntype> {
  let order: Ordertype = (await Prisma.orders.findUnique({
    where: { id: orderId },
  })) as any;

  return { success: true };
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
  const paypal_id = process.env.PAYPAL_ID as string;
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
        ? calculateDiscountPrice(
            parseFloat(i.product.price.toString()),
            parseFloat(i.product.discount.toString())
          ).toFixed(2)
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

      address: {
        address_line_1: `StreetNumber StreetName`,
        address_line_2: `${order.shipping?.houseId} ${order.shipping?.songkhat} ${order.shipping?.district}`,
        admin_area_2: order.shipping?.province,
        postal_code: order.shipping?.postalcode ?? "",
        country_code: CountryCode.cambodia,
      },
    };

    const purchase_units: PurcahseUnitType = {
      amount: orderAmount,
      items: orderItems,
      shipping: shippingtype?.value === "Pickup" ? undefined : orderShipping,
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
  subject: string
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

    await transporter.sendMail(mailoptions);
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

    html: data.html ? OrderReciptEmail(data.html) : "",
  };
  try {
    await transporter.sendMail(mailoptions);
    return { success: true };
  } catch (error) {
    console.log("Send Email", error);
    return { success: true };
  }
};

//Html Template

export const OrderReciptEmail = (body: string) => `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>
  </title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!--[if mso]>
    <noscript>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
    </noscript>
  <![endif]-->
  <!--[if lte mso 11]>
  <style type="text/css">
  body {
    font-family: "Prompt", sans-serif;
  }
</style>
  <![endif]-->
  <!--[if !mso]><!-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
  <style type="text/css">
  @import url('https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap')
  </style>
  <!--<![endif]-->
</head>

<body style="font-family: "Prompt", sans-serif; width: fit-content;">
   ${body}
</body>

</html>

`;
