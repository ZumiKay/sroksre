"use client";

import ReactDomServer from "react-dom/server";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Allstatus, Ordertype } from "@/src/context/OrderContext";
import { SendNotification, useSocket } from "@/src/context/SocketContext";
import { useRouter } from "next/navigation";
import {
  CaptureOrder,
  Createpaypalorder,
  updateStatus,
} from "../checkout/action";
import { errorToast, successToast } from "./Loading";
import {
  OnApproveBraintreeActions,
  OnApproveBraintreeData,
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { OrderReceiptTemplate } from "./EmailTemplate";
import { useCallback, memo, useMemo } from "react";

interface PaypalButtonProps {
  orderId: string;
  encripyid: string;
  order: Ordertype;
  sessionId: string;
}

const PaypalButton = memo(
  ({ orderId, order, encripyid, sessionId }: PaypalButtonProps) => {
    const router = useRouter();
    const socket = useSocket();
    const { setcarttotal } = useGlobalContext();

    // Memoize PayPal script options
    const scriptOptions = useMemo(
      () => ({
        clientId: process.env.NEXT_PUBLIC_PAYPAL_ID as string,
        components: "buttons",
        currency: "USD",
      }),
      []
    );

    // Memoize button styles
    const buttonStyles = useMemo(() => ({ disableMaxWidth: true }), []);

    // Memoize order data for templates
    const paidOrder = useMemo(
      () => ({ ...order, status: Allstatus.paid }),
      [order]
    );

    const createOrder = useCallback(async () => {
      try {
        const request = await Createpaypalorder(orderId);

        if (!request.success) {
          errorToast(request.message ?? "Server error");
          return null;
        }

        if (request?.data?.id) {
          return request.data.id;
        }

        const errorDetail = request.data?.details?.[0];
        const errorMessage = errorDetail
          ? `${errorDetail.issue} ${errorDetail.description} (${request.data.debug_id})`
          : JSON.stringify(request);

        errorToast(errorMessage);
        return null;
      } catch (error) {
        errorToast("Failed to create PayPal order");
        console.error("PayPal create order error:", error);
        return null;
      }
    }, [orderId]);

    const handleApprove = useCallback(
      async (
        data: OnApproveBraintreeData,
        actions: OnApproveBraintreeActions
      ) => {
        try {
          const request = await CaptureOrder(data.orderID);

          if (!request.success) {
            errorToast("Server error");
            return;
          }

          const orderData = request.data as unknown as {
            details?: {
              issue: string;
              description: string;
              debug_id: string;
            }[];
            purchase_units?: Record<string, unknown>[];
            debug_id: string;
          };

          const errorDetail = orderData?.details?.[0];

          if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
            return actions.restart();
          } else if (errorDetail) {
            throw new Error(
              `${errorDetail.description} (${orderData?.debug_id})`
            );
          } else if (!orderData.purchase_units) {
            throw new Error(JSON.stringify(orderData));
          }

          // Generate templates
          const htmltemplate = ReactDomServer.renderToString(
            <OrderReceiptTemplate order={paidOrder} isAdmin={false} />
          );

          const adminhtmltemplate = ReactDomServer.renderToString(
            <OrderReceiptTemplate order={paidOrder} isAdmin={true} />
          );

          // Update order status
          const makeReq = await updateStatus(
            orderId,
            htmltemplate,
            adminhtmltemplate
          );

          if (!makeReq.success) {
            errorToast(makeReq.message ?? "Failed to update order status");
            return;
          }

          // Send notification if socket is available
          if (socket) {
            await SendNotification(
              {
                type: "New Order",
                content: `Order #${orderId} has requested`,
                checked: false,
                link: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order?&q=${orderId}`,
              },
              socket
            );
          }

          // Complete checkout process
          successToast("Purchase Complete");
          setcarttotal(0);
          router.replace(
            `/checkout?orderid=${encripyid}&sid=${sessionId}&step=4`
          );
          router.refresh();
        } catch (error) {
          console.error("Payment error", error);
          errorToast("Payment failed, please try again!");
        }
      },
      [paidOrder, orderId, socket, setcarttotal, router, encripyid, sessionId]
    );

    return (
      <PayPalScriptProvider options={scriptOptions}>
        <PayPalButtons
          createOrder={createOrder}
          onApprove={handleApprove as never}
          style={buttonStyles}
        />
      </PayPalScriptProvider>
    );
  }
);

PaypalButton.displayName = "PaypalButton";

export { PaypalButton as Paypalbutton };
