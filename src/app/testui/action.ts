"use server";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const getLogo = async () => {
  const url =
    "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064";
  const jpgImageBytes = await fetch(url).then((res) => res.arrayBuffer());

  return jpgImageBytes;
};

export const generateInvoicePdf = async () => {
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
  page.drawText(`URL   :localhost`, {
    x: 400,
    y: 775,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText(`Open   :Mon - Sat (Not on holiday):`, {
    x: 400,
    y: 760,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText(`9am to 9pm`, {
    x: 400,
    y: 745,
    size: fontSize,
    font,
    color: textColor,
  });

  // Draw customer information
  page.drawText("Billing Address", {
    x: 30,
    y: 700,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Vish Singh", {
    x: 30,
    y: 680,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Regent Home Bangson 27", {
    x: 30,
    y: 665,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Building A, 873/1007", {
    x: 30,
    y: 650,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Chak Angre Kraom , 120602", {
    x: 30,
    y: 635,
    size: fontSize,
    font,
    color: textColor,
  });

  page.drawText("Shipping Address", {
    x: 400,
    y: 700,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Vish Singh", {
    x: 400,
    y: 680,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Regent Home Bangson 27", {
    x: 400,
    y: 665,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Building A, 873/1007", {
    x: 400,
    y: 650,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText("Chak Angre Kraom", {
    x: 400,
    y: 635,
    size: fontSize,
    font,
    color: textColor,
  });

  // Draw order details
  page.drawText(`Order No.   ATH68763166`, {
    x: 400,
    y: 600,
    size: fontSize,
    font,
    color: textColor,
  });
  page.drawText(`Invoice date:    20/08/2024`, {
    x: 400,
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

  // Draw product details (sample data)
  // Sample product data to demonstrate the table
  const products = [
    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },
    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },
    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },
    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },
    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },

    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },
    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },
    {
      id: "IE4931",
      name: "YZY FOAM RNRfdkafjdalkfd afkdafjlkd alfkldalf dafkldlajfkldjsaklfdlksa fldakjfkdlsamflkdsa flkdklfjkaldsfdsaf dsfkdjsafkldsjafkldsklfjsdklfjdskl",
      variant: "Mx Granite/Mx Granite/Mx Granite",
      qty: 1,
      price: "3,500.00",
    },

    // Add more products here...
  ];

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

  const productColumnWidths = {
    id: 65,
    name: 330,
    qty: 40,
    price: 95,
  };

  for (const product of products) {
    y -= 20; // Move y-position down for the next row
    checkAndAddPage(); // Check if we need to add a new page

    page.drawText(product.id, {
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
  page.drawText("Sub Total USD 100.00", {
    x: 30,
    y,
    size: fontSize,
    font,
    color: textColor,
  });

  page.drawText("Shipping & Handling USD 100.00", {
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

  page.drawText("Total USD 1,750.00", {
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
