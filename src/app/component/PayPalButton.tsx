"use client";

import ReactDomServer from "react-dom/server";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Ordertype, Productordertype } from "@/src/context/OrderContext";
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
import { ApiRequest } from "@/src/context/CustomHook";
import { OrderReceiptTemplate } from "./EmailTemplate";
import { useCallback, memo } from "react";

interface OrderUserType extends Ordertype {
  user: {
    id: number;
    firstname: string;
    lastname?: string;
    email: string;
  };
  Orderproduct: Productordertype[];
  createdAt: Date;
}

interface PaypalButtonProps {
  orderId: string;
  encripyid: string;
  order: OrderUserType;
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
          const request = await CaptureOrder(data.orderID);

          if (!request.success) {
            errorToast("Server error");
            return;
          }

          const orderData = request.data;
          const errorDetail = orderData?.details?.[0];

          if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
            return actions.restart();
          } else if (errorDetail) {
            throw new Error(
              `${errorDetail.description} (${orderData.debug_id})`
            );
          } else if (!orderData.purchase_units) {
            throw new Error(JSON.stringify(orderData));
          }

          // Get policy and generate email templates
          const getPolicy = await ApiRequest({
            url: `/api/policy?type=email`,
            method: "GET",
          });

          if (!getPolicy.success) {
            throw Error("Failed to retrieve policy information");
          }

          const htmltemplate = ReactDomServer.renderToString(
            <OrderReceiptTemplate
              order={{ ...order, status: "Paid" }}
              isAdmin={false}
            />
          );

          const adminhtmltemplate = ReactDomServer.renderToString(
            <OrderReceiptTemplate
              order={{ ...order, status: "Paid" }}
              isAdmin={true}
            />
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
