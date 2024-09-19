import { Shippingservice } from "@/src/context/Checkoutcontext";
import { Orderpricetype, totalpricetype } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { shippingtype } from "../../component/Modals/User";

//Edit Created Order Information
export async function PUT(req: NextRequest) {
  try {
    const { id, ty } = await req.json();
    if (!id) {
      return Response.json({}, { status: 403 });
    }

    const order = await Prisma.orders.findUnique({
      where: { id },
      select: {
        price: true,
        Orderproduct: {
          select: {
            quantity: true,
            product: {
              select: {
                price: true,
                discount: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return Response.json({}, { status: 404 });
    }

    if (ty === "removeAddress") {
      const updatedTotalPrice = order.Orderproduct.reduce((total, item) => {
        const { price, discount } = item.product;

        const calculatedPrice = calculateDiscountProductPrice({
          price,
          discount: discount ? discount : undefined,
        });

        const estimatedprice = calculatedPrice.discount
          ? calculatedPrice.discount.newprice
          : calculatedPrice.price;

        return total + (estimatedprice ?? 0) * item.quantity;
      }, 0);
      const updateprice: totalpricetype = {
        total: updatedTotalPrice,
        subtotal: updatedTotalPrice,
        shipping: 0,
      };

      await Prisma.orders.update({
        where: { id },
        data: {
          price: updateprice as any,
          shippingtype: Shippingservice[2].value, //Update to Pickup
        },
      });
    }

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.log("Update Order", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

const getLogo = async () => {
  const url =
    "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064";
  const jpgImageBytes = await fetch(url).then((res) => res.arrayBuffer());

  return jpgImageBytes;
};

interface GenerateInvoicePdf {
  id: string;
  product: {
    id: number;
    name: string;
    price: Orderpricetype;
    selectedVariant: string[];
    quantity: number;
    totalprice: number;
  }[];
  price: totalpricetype;
  shipping?: shippingtype;
  createdAt?: string;
}

export const generateInvoicePdf = async (Order: GenerateInvoicePdf) => {
  const pdfDoc = await PDFDocument.create();

  // Add a page to the PDF
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size: 595.28 x 841.89 points

  const maxYPosition = 100; // The y-position that triggers a new page

  let y = 500;

  const checkAndAddPage = () => {
    if (y < maxYPosition) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 800; // Reset y-position for the new page
    }
  };

  // Load a standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Set up some common styles
  const fontSize = 12;
  const textColor = rgb(0, 0, 0);

  // Draw the header section

  const logoimage = await getLogo();
  const jpgImage = await pdfDoc.embedPng(logoimage);
  const jpgDims = jpgImage.scale(0.5);

  page.drawImage(jpgImage, {
    x: 30,
    y: 800,
    width: jpgDims.width,
    height: jpgDims.height,
  });

  page.drawText("TAX INVOICE / RECEIPT", {
    x: 30,
    y: 770,
    size: 18,
    font,
    color: textColor,
  });

  //Contact Information
  page.drawText("Contact Infomation", {
    x: 400,
    y: 820,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText(`Phonenumber   :023880880`, {
    x: 400,
    y: 805,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText(`Email   :ssrecommerce@gmail.com`, {
    x: 400,
    y: 790,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText(`URL   :${process.env.NEXTAUTH_URL}`, {
    x: 400,
    y: 775,
    size: fontSize,
    font,
    color: textColor,
  });

  // Draw customer information

  if (Order.shipping) {
    page.drawText("Billing Address", {
      x: 30,
      y: 700,
      size: fontSize,
      font,
      color: textColor,
    });
    page.drawText(`${Order.shipping.firstname} ${Order.shipping.lastname}`, {
      x: 30,
      y: 680,
      size: fontSize,
      font,
      color: textColor,
    });
    page.drawText(
      `No${Order.shipping.houseId}, Street ${Order.shipping.street}`,
      {
        x: 30,
        y: 665,
        size: fontSize,
        font,
        color: textColor,
      }
    );
    page.drawText(`${Order.shipping.district}, ${Order.shipping.songkhat}`, {
      x: 30,
      y: 650,
      size: fontSize,
      font,
      color: textColor,
    });
    page.drawText(`${Order.shipping.province}, ${Order.shipping.postalcode}`, {
      x: 30,
      y: 635,
      size: fontSize,
      font,
      color: textColor,
    });

    page.drawText("Shipping Address", {
      x: 390,
      y: 700,
      size: fontSize,
      font,
      color: textColor,
    });
    page.drawText(`${Order.shipping.firstname} ${Order.shipping.lastname}`, {
      x: 390,
      y: 680,
      size: fontSize,
      font,
      color: textColor,
    });
    page.drawText(
      `No${Order.shipping.houseId}, Street ${Order.shipping.street}`,
      {
        x: 390,
        y: 665,
        size: fontSize,
        font,
        color: textColor,
      }
    );
    page.drawText(`${Order.shipping.district}, ${Order.shipping.songkhat}`, {
      x: 390,
      y: 650,
      size: fontSize,
      font,
      color: textColor,
    });
    page.drawText(`${Order.shipping.province}, ${Order.shipping.postalcode}`, {
      x: 390,
      y: 635,
      size: fontSize,
      font,
      color: textColor,
    });
  }

  // Draw order details
  page.drawText(`Order No. ${Order.id}`, {
    x: 390,
    y: 600,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText(`Invoice date: ${Order.createdAt}`, {
    x: 390,
    y: 580,
    size: fontSize,
    font,
    color: textColor,
  });

  // Draw product table header
  page.drawRectangle({
    width: 70,
    height: 30,
    x: 30,
    y: 500,
    color: rgb(0.286, 0.329, 0.392),
    opacity: 1,
  });
  page.drawText("Product ID", {
    x: 35,
    y: 510,
    size: fontSize,
    font,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    width: 330,
    height: 30,
    x: 100,
    y: 500,
    color: rgb(0.286, 0.329, 0.392),
    opacity: 1,
  });

  page.drawText("Product Name", {
    x: 100,
    y: 510,
    size: fontSize,
    font,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    width: 40,
    height: 30,
    x: 435,
    y: 500,
    color: rgb(0.286, 0.329, 0.392),
    opacity: 1,
  });
  page.drawText("Qty", {
    x: 440,
    y: 510,
    size: fontSize,
    font,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    width: 95,
    height: 30,
    x: 465,
    y: 500,
    color: rgb(0.286, 0.329, 0.392),
    opacity: 1,
  });

  page.drawText("Total Price USD", {
    x: 470,
    y: 510,
    size: fontSize,
    font,
    color: rgb(1, 1, 1),
  });
  y -= 30;

  const orderedProduct = Order.product.map((prob) => ({
    id: prob.id,
    name: prob.name,
    variant: prob.selectedVariant.join("/"),
    qty: prob.quantity,
    price: prob.totalprice,
  }));

  // Draw each product row in the table
  const wrapText = (text: string, maxWidth: number) => {
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    for (let word of words) {
      const testLine = currentLine + word + " ";
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }

    lines.push(currentLine.trim());
    return lines;
  };

  for (const product of orderedProduct) {
    y -= 20; // Move y-position down for the next row
    checkAndAddPage(); // Check if we need to add a new page

    page.drawText(product.id.toString(), {
      x: 35,
      y,
      size: fontSize,
      font,
      color: textColor,
    });

    const productLines = wrapText(product.name, 330);
    for (const line of productLines) {
      page.drawText(line, {
        x: 100,
        y,
        size: fontSize,
        font,
        color: textColor,
      });
      y -= 15; // Move y-position down for the next line
      checkAndAddPage(); // Check if we need to add a new page
    }

    const variantLines = wrapText(product.variant, 330);
    for (const line of variantLines) {
      page.drawText(line, {
        x: 100,
        y,
        size: fontSize,
        font,
        color: textColor,
      });
      y -= 15; // Move y-position down for the next line
      checkAndAddPage(); // Check if we need to add a new page
    }

    y += 15; // Adjust for final line space in a product entry

    page.drawText(`${product.qty}`, {
      x: 440,
      y,
      size: fontSize,
      font,
      color: textColor,
    });

    page.drawText(`${product.price}`, {
      x: 470,
      y,
      size: fontSize,
      font,
      color: textColor,
    });

    // Draw a line between rows
    page.drawLine({
      start: { x: 30, y: y - 5 },
      end: { x: 560, y: y - 5 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    checkAndAddPage();
  }

  // Ensure there is enough space to draw the totals
  y -= 40; // Decrease y position to leave space for totals

  if (y < maxYPosition) {
    page = pdfDoc.addPage([595.28, 841.89]);
    y = 800; // Reset y-position for the new page
  }

  // Draw totals at the bottom of the table
  page.drawText(`Sub Total USD ${Order.price.subtotal.toFixed(2)}`, {
    x: 30,
    y,
    size: fontSize,
    font,
    color: textColor,
  });

  page.drawText(`Shipping USD ${Order.price.shipping?.toFixed(2) ?? ""}`, {
    x: 30,
    y: y - 20,
    size: fontSize,
    font,
    color: textColor,
  });

  page.drawRectangle({
    width: 570,
    height: 20,
    x: 30,
    y: y - 55,
    color: rgb(0.286, 0.329, 0.392),
    opacity: 1,
  });

  page.drawText(`Total USD ${Order.price.total.toFixed(2)}`, {
    x: 30,
    y: y - 50,
    size: fontSize,
    font,
    color: rgb(1, 1, 1),
  });

  // Draw footer
  page.drawLine({
    start: { x: 30, y: 120 },
    thickness: 1,
    color: rgb(0, 0, 0),
    opacity: 1,
    end: { x: 570, y: 120 },
  });
  page.drawText(
    "If you are not satisfied with your purchase, you are able to cancel or return them by stating your\nintention within 30 days from the date that you receive product.\nPlease do so through our email.",
    {
      x: 50,
      y: 100,
      size: fontSize,
      font,
      color: textColor,
    }
  );

  // Serialize the PDF document to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
};
