"use server";

import { generateInvoicePdf } from "../../testui/action";

export async function GET() {
  try {
    const pdfBytes = await generateInvoicePdf();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="invoice.pdf"',
      },
    });
  } catch (error) {
    console.log("Download File", error);
    return Response.json({}, { status: 500 });
  }
}
