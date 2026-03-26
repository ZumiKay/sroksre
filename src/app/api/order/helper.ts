import {
  Orderpricetype,
  OrderSelectedVariantType,
  totalpricetype,
} from "@/src/types/order.type";
import { VariantValueObjType } from "@/src/types/product.type";
import { shippingtype } from "../../component/Modals/User";
import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";

// ─── Page constants ───────────────────────────────────────────────────────────

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const ML = 30; // margin left
const MR = 565; // margin right (content right edge)

// Table column layout
const COL_NUM_X = ML; // "#" col left,  width ≈ 24
const COL_DESC_X = 58; // Description left, width ≈ 272
const COL_UNIT_R = 420; // Unit Price right edge
const COL_QTY_R = 460; // Qty right edge
const COL_AMT_R = MR; // Amount right edge

// Colours
const C_DARK = rgb(0.286, 0.329, 0.392); // #495464
const C_ACCENT = rgb(0.18, 0.44, 0.78); // #2E70C7
const C_WHITE = rgb(1, 1, 1);
const C_BLACK = rgb(0.08, 0.08, 0.08);
const C_GRAY = rgb(0.45, 0.45, 0.45);
const C_LIGHT_ROW = rgb(0.965, 0.965, 0.97);
const C_BORDER = rgb(0.82, 0.82, 0.82);
const C_GREEN = rgb(0.1, 0.62, 0.38);
const C_RED = rgb(0.8, 0.18, 0.18);

// ─── Logo ─────────────────────────────────────────────────────────────────────

const getLogo = async (): Promise<ArrayBuffer | null> => {
  const url =
    "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064";
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateInvoicePdf {
  id: string;
  product: {
    id: number;
    name: string;
    price: Orderpricetype;
    selectedVariant:
      | Array<string | VariantValueObjType>
      | OrderSelectedVariantType;
    quantity: number;
    totalprice: number;
  }[];
  price: totalpricetype;
  shipping?: shippingtype;
  createdAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Right-align text: returns the x such that text ends at `rightEdge`. */
const rx = (text: string, rightEdge: number, size: number, font: PDFFont) =>
  rightEdge - font.widthOfTextAtSize(text, size);

/** Wrap text into lines no wider than maxWidth (in points). */
const wrapText = (text: string, maxWidth: number, size: number, font: PDFFont): string[] => {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

/** Format variant selection for display in the PDF. */
const formatVariantItem = (item: string | VariantValueObjType): string => {
  if (typeof item === "string") return item;
  const label = item.name || item.val;
  const p = item.price ? parseFloat(item.price.toString()) : 0;
  return p > 0 ? `${label} (+$${p.toFixed(2)})` : label;
};

const formatVariantDisplay = (
  selectedVariant: Array<string | VariantValueObjType> | OrderSelectedVariantType,
): string => {
  if (!selectedVariant) return "";
  if (Array.isArray(selectedVariant)) {
    return selectedVariant.map(formatVariantItem).join(" / ");
  }
  const parts: string[] = [];
  if (selectedVariant.variantsection) {
    selectedVariant.variantsection.forEach((sec) => {
      const name = sec.variantSection?.name ?? "";
      const vals = sec.variants.map(formatVariantItem).join(", ");
      parts.push(name ? `${name}: ${vals}` : vals);
    });
  }
  if (selectedVariant.variant?.length) {
    parts.push(selectedVariant.variant.map(formatVariantItem).join(" / "));
  }
  return parts.join(" | ");
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const generateInvoicePdf = async (Order: GenerateInvoicePdf) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Track current page and y cursor (y decreases as we go down)
  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H; // start at top

  /** Add a new page and reset cursor. */
  const newPage = () => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - 40;
  };

  /** Ensure at least `needed` points remain; add page if not. */
  const ensureSpace = (needed: number) => {
    if (y < 60 + needed) newPage();
  };

  // ── 1. Header band ──────────────────────────────────────────────────────────

  const HEADER_H = 70;
  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: C_DARK });

  // Accent stripe at top edge of band
  page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: C_ACCENT });

  // Logo (left side of band)
  const logoBytes = await getLogo();
  let logoWidth = 0;
  if (logoBytes) {
    try {
      const img = await pdfDoc.embedPng(logoBytes);
      const scaled = img.scaleToFit(50, 50);
      logoWidth = scaled.width + 10;
      page.drawImage(img, {
        x: ML,
        y: PAGE_H - HEADER_H + (HEADER_H - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      });
    } catch { /* skip broken logo */ }
  }

  const titleX = ML + logoWidth;
  page.drawText("TAX INVOICE / RECEIPT", {
    x: titleX,
    y: PAGE_H - HEADER_H + 38,
    size: 20,
    font: fontBold,
    color: C_WHITE,
  });
  page.drawText("SrokSre", {
    x: titleX,
    y: PAGE_H - HEADER_H + 18,
    size: 11,
    font,
    color: rgb(0.75, 0.78, 0.82),
  });

  y = PAGE_H - HEADER_H - 18; // cursor below header band

  // ── 2. Company info (left) + Invoice details (right) ─────────────────────

  const sectionTopY = y;
  const infoLineH = 14;

  // Left: company contact
  page.drawText("SrokSre", { x: ML, y, size: 11, font: fontBold, color: C_BLACK });
  y -= infoLineH;

  const phone = process.env.NEXT_PUBLIC_ADMIN_PHONENUMBER ?? "-";
  const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "-";
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "-";

  for (const [label, value] of [
    ["Phone", phone],
    ["Email", email],
    ["Web  ", siteUrl],
  ]) {
    page.drawText(`${label}:`, { x: ML, y, size: 9, font: fontBold, color: C_GRAY });
    page.drawText(value, { x: ML + 38, y, size: 9, font, color: C_BLACK });
    y -= infoLineH;
  }

  // Right: invoice meta (aligned to sectionTopY)
  const metaX = 330;
  const metaLabelW = 75;
  let metaY = sectionTopY;

  const metaRows: [string, string][] = [
    ["Invoice No.", `#${Order.id.slice(0, 12).toUpperCase()}`],
    ["Date", Order.createdAt ?? "-"],
    ["Currency", "USD"],
    ["Payment", "PayPal"],
  ];

  for (const [label, value] of metaRows) {
    page.drawText(label, { x: metaX, y: metaY, size: 9, font: fontBold, color: C_GRAY });
    const valLines = wrapText(value, MR - metaX - metaLabelW - 4, 9, font);
    page.drawText(valLines[0], {
      x: rx(valLines[0], MR, 9, font),
      y: metaY,
      size: 9,
      font,
      color: C_BLACK,
    });
    metaY -= infoLineH;
  }

  // Move cursor to whichever column ended lower
  y = Math.min(y, metaY) - 12;

  // ── 3. Divider ──────────────────────────────────────────────────────────────

  page.drawRectangle({ x: ML, y, width: MR - ML, height: 1, color: C_BORDER });
  y -= 14;

  // ── 4. Bill To / Ship To ────────────────────────────────────────────────────

  if (Order.shipping) {
    const s = Order.shipping;
    const addrLeftX = ML;
    const addrRightX = 310;
    let addrY = y;

    // Section labels
    page.drawRectangle({ x: addrLeftX, y: addrY - 2, width: 56, height: 14, color: C_DARK });
    page.drawText("BILL TO", { x: addrLeftX + 4, y: addrY, size: 8, font: fontBold, color: C_WHITE });

    page.drawRectangle({ x: addrRightX, y: addrY - 2, width: 62, height: 14, color: C_DARK });
    page.drawText("SHIP TO", { x: addrRightX + 4, y: addrY, size: 8, font: fontBold, color: C_WHITE });

    addrY -= 16;

    const addrLines = [
      `${s.firstname} ${s.lastname}`,
      `No. ${s.houseId}, Street ${s.street ?? ""}`.trim(),
      `${s.district}, ${s.songkhat}`,
      `${s.province}  ${s.postalcode}`,
    ];

    for (const line of addrLines) {
      page.drawText(line, { x: addrLeftX, y: addrY, size: 9, font, color: C_BLACK });
      page.drawText(line, { x: addrRightX, y: addrY, size: 9, font, color: C_BLACK });
      addrY -= 13;
    }

    y = addrY - 10;

    // Divider below addresses
    page.drawRectangle({ x: ML, y, width: MR - ML, height: 1, color: C_BORDER });
    y -= 14;
  }

  // ── 5. Table header ─────────────────────────────────────────────────────────

  ensureSpace(60);

  const TABLE_ROW_H = 22;

  page.drawRectangle({ x: ML, y: y - TABLE_ROW_H + 6, width: MR - ML, height: TABLE_ROW_H, color: C_DARK });

  const thY = y - TABLE_ROW_H + 14; // vertical centre of header row

  page.drawText("#",          { x: COL_NUM_X + 2, y: thY, size: 9, font: fontBold, color: C_WHITE });
  page.drawText("Description",{ x: COL_DESC_X,    y: thY, size: 9, font: fontBold, color: C_WHITE });
  page.drawText("Unit Price", { x: rx("Unit Price", COL_UNIT_R, 9, fontBold), y: thY, size: 9, font: fontBold, color: C_WHITE });
  page.drawText("Qty",        { x: rx("Qty", COL_QTY_R, 9, fontBold),         y: thY, size: 9, font: fontBold, color: C_WHITE });
  page.drawText("Amount",     { x: rx("Amount", COL_AMT_R, 9, fontBold),       y: thY, size: 9, font: fontBold, color: C_WHITE });

  y -= TABLE_ROW_H + 2;

  // ── 6. Table rows ───────────────────────────────────────────────────────────

  let rowIndex = 0;
  for (const prod of Order.product) {
    const discount = prod.price.discount;
    const basePrice = prod.price.price;
    const variantExtra = prod.price.extra ?? 0;
    const unitPrice =
      discount?.newprice ??
      (basePrice + variantExtra);

    const nameLines = wrapText(prod.name, COL_UNIT_R - COL_DESC_X - 8, 9, font);
    const variantStr = formatVariantDisplay(prod.selectedVariant);
    const variantLines = variantStr ? wrapText(variantStr, COL_UNIT_R - COL_DESC_X - 8, 8, font) : [];
    const discountLine = discount
      ? `Was $${basePrice.toFixed(2)}  –${discount.percent ?? 0}% off`
      : null;

    const lineCount = nameLines.length + variantLines.length + (discountLine ? 1 : 0);
    const rowH = Math.max(TABLE_ROW_H, lineCount * 12 + 10);

    ensureSpace(rowH + 4);

    // Alternating row background
    if (rowIndex % 2 === 0) {
      page.drawRectangle({ x: ML, y: y - rowH + 6, width: MR - ML, height: rowH, color: C_LIGHT_ROW });
    }

    // Vertical centre for single-value columns
    const midY = y - rowH / 2 + 3;

    // # column
    const numStr = (rowIndex + 1).toString();
    page.drawText(numStr, { x: rx(numStr, COL_NUM_X + 22, 9, font), y: midY, size: 9, font, color: C_GRAY });

    // Description: name lines
    let descY = y - 10;
    for (const line of nameLines) {
      page.drawText(line, { x: COL_DESC_X, y: descY, size: 9, font, color: C_BLACK });
      descY -= 12;
    }
    // Variant lines (smaller, gray)
    for (const line of variantLines) {
      page.drawText(line, { x: COL_DESC_X + 4, y: descY, size: 8, font, color: C_GRAY });
      descY -= 11;
    }
    // Discount line (red, smaller)
    if (discountLine) {
      page.drawText(discountLine, { x: COL_DESC_X + 4, y: descY, size: 7.5, font, color: C_RED });
    }

    // Unit Price (right-aligned)
    const unitStr = `$${unitPrice.toFixed(2)}`;
    page.drawText(unitStr, { x: rx(unitStr, COL_UNIT_R, 9, font), y: midY, size: 9, font, color: C_BLACK });

    // Qty (right-aligned)
    const qtyStr = prod.quantity.toString();
    page.drawText(qtyStr, { x: rx(qtyStr, COL_QTY_R, 9, font), y: midY, size: 9, font, color: C_BLACK });

    // Amount (right-aligned, bold)
    const amtStr = `$${prod.totalprice.toFixed(2)}`;
    page.drawText(amtStr, { x: rx(amtStr, COL_AMT_R, 9, fontBold), y: midY, size: 9, font: fontBold, color: C_BLACK });

    // Bottom border for row
    y -= rowH;
    page.drawRectangle({ x: ML, y, width: MR - ML, height: 0.5, color: C_BORDER });
    y -= 2;

    rowIndex++;
  }

  // ── 7. Totals block ─────────────────────────────────────────────────────────

  const TOTALS_LABEL_X = 380;
  const TOTALS_VALUE_R = MR;
  const totLineH = 16;

  y -= 10;
  ensureSpace(120);

  const drawTotalRow = (label: string, value: string, bold = false, color = C_BLACK) => {
    page.drawText(label, {
      x: TOTALS_LABEL_X,
      y,
      size: 9,
      font: bold ? fontBold : font,
      color: C_GRAY,
    });
    page.drawText(value, {
      x: rx(value, TOTALS_VALUE_R, 9, bold ? fontBold : font),
      y,
      size: 9,
      font: bold ? fontBold : font,
      color,
    });
    y -= totLineH;
  };

  drawTotalRow("Subtotal", `$${Order.price.subtotal.toFixed(2)}`);

  if (Order.price.extra && Order.price.extra > 0) {
    drawTotalRow("Variant Options", `+$${Order.price.extra.toFixed(2)}`, false, C_GREEN);
  }

  const shippingAmt = Order.price.shipping ?? 0;
  drawTotalRow(
    "Shipping",
    shippingAmt > 0 ? `$${shippingAmt.toFixed(2)}` : "Free",
    false,
    shippingAmt > 0 ? C_BLACK : C_GREEN,
  );

  if (Order.price.vat && Order.price.vat > 0) {
    drawTotalRow("VAT", `$${Order.price.vat.toFixed(2)}`);
  }

  // Divider above total
  y -= 4;
  page.drawRectangle({ x: TOTALS_LABEL_X - 4, y, width: MR - TOTALS_LABEL_X + 4, height: 1, color: C_BORDER });
  y -= 6;

  // Total row — highlighted background
  page.drawRectangle({ x: TOTALS_LABEL_X - 8, y: y - 4, width: MR - TOTALS_LABEL_X + 8 + 4, height: 20, color: C_DARK });
  page.drawText("TOTAL", {
    x: TOTALS_LABEL_X,
    y: y + 2,
    size: 10,
    font: fontBold,
    color: C_WHITE,
  });
  const totalStr = `$${Order.price.total.toFixed(2)}`;
  page.drawText(totalStr, {
    x: rx(totalStr, MR, 11, fontBold),
    y: y + 1,
    size: 11,
    font: fontBold,
    color: C_WHITE,
  });
  y -= 24;

  // ── 8. Thank-you note ───────────────────────────────────────────────────────

  y -= 20;
  ensureSpace(40);
  page.drawText("Thank you for your purchase!", {
    x: rx("Thank you for your purchase!", MR, 10, fontBold),
    y,
    size: 10,
    font: fontBold,
    color: C_ACCENT,
  });

  // ── 9. Footer ───────────────────────────────────────────────────────────────

  // Footer is always drawn at a fixed position near the bottom of the LAST page
  const footerY = 80;
  page.drawRectangle({ x: ML, y: footerY + 18, width: MR - ML, height: 0.75, color: C_BORDER });

  const footerLines = [
    "Returns & Cancellations: You may cancel or return your order within 30 days of receipt.",
    "To initiate a return, please contact us via the email address listed above.",
    `Order reference: #${Order.id}`,
  ];

  let fy = footerY + 10;
  for (const line of footerLines) {
    page.drawText(line, { x: ML, y: fy, size: 7.5, font, color: C_GRAY });
    fy -= 11;
  }

  // ── Serialize ────────────────────────────────────────────────────────────────

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
