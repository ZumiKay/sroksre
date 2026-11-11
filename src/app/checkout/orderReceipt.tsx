// Server-only: renders order receipt emails from the database order.
// Not a "use server" module, so it can't be called from the browser.

import { Ordertype } from "@/src/types/order.type";
import { OrderReceiptTemplate } from "../component/EmailTemplate";

export async function renderOrderReceiptHtml(order: Ordertype) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return {
    html: renderToStaticMarkup(
      <OrderReceiptTemplate order={order} isAdmin={false} />,
    ),
    adminhtml: renderToStaticMarkup(
      <OrderReceiptTemplate order={order} isAdmin={true} />,
    ),
  };
}
