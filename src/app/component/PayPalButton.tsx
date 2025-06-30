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
import { useCallback, memo } from "react";

interface PaypalButtonProps {
  orderId: string;
  encripyid: string;
  order: Ordertype;
}

const PaypalButton = memo(
  ({ orderId, order, encripyid }: PaypalButtonProps) => {
    const router = useRouter();
    const socket = useSocket();
    const { setcarttotal } = useGlobalContext();

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
          const capReq = CaptureOrder.bind(null, data.orderID);

          const request = await capReq();

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

          const htmltemplate = ReactDomServer.renderToString(
            <OrderReceiptTemplate
              order={{ ...order, status: Allstatus.paid }}
              isAdmin={false}
            />
          );

          const adminhtmltemplate = ReactDomServer.renderToString(
            <OrderReceiptTemplate
              order={{ ...order, status: Allstatus.paid }}
              isAdmin={true}
            />
          );

          // Update order status
          const updateReq = updateStatus.bind(
            null,
            orderId,
            htmltemplate,
            adminhtmltemplate
          );
          const makeReq = await updateReq();

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
          successToast(`Purchase Complete`);
          setcarttotal(0);
          router.replace(`/checkout?orderid=${encripyid}&step=4`);
          router.refresh();
        } catch (error) {
          console.error("Payment error", error);
          errorToast("Payment failed, please try again!");
        }
      },
      [orderId, order, encripyid, socket, router, setcarttotal]
    );

    return (
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_ID as string,
          components: "buttons",
          currency: "USD",
        }}
      >
        <PayPalButtons
          createOrder={createOrder}
          onApprove={(data, actions) =>
            handleApprove(data as never, actions as never)
          }
          style={{ disableMaxWidth: true }}
        />
      </PayPalScriptProvider>
    );
  }
);

PaypalButton.displayName = "PaypalButton";

export { PaypalButton as Paypalbutton };
