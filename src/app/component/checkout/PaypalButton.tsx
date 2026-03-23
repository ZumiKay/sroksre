"use client";

import { useState } from "react";
import ReactDOMServer from "react-dom/server";
import { useRouter } from "next/navigation";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { Allstatus, Ordertype } from "@/src/types/order.type";
import {
  CaptureOrder,
  Createpaypalorder,
  updateStatus,
} from "@/src/app/checkout/action";
import { ApiRequest } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SendNotification, useSocket } from "@/src/context/SocketContext";
import { errorToast, successToast } from "../Loading";
import { OrderReceiptTemplate } from "../EmailTemplate";
import useCheckSession from "@/src/hooks/useCheckSession";

// -----------------------------------------------------------------------------
// PaypalButtonWrapper – renders the PayPal button UI with loading states
// -----------------------------------------------------------------------------

function PaypalButtonWrapper({
  orderId,
  order,
  encripyid,
  onCreateOrder,
  onApproveOrder,
}: {
  orderId: string;
  encripyid: string;
  order: Ordertype;
  onCreateOrder: () => Promise<string>;
  onApproveOrder: (data: unknown, actions: unknown) => Promise<void>;
}) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);

  if (isPending) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-600">Loading PayPal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-700 font-medium">
              Processing Payment...
            </p>
          </div>
        </div>
      )}
      <PayPalButtons
        createOrder={async () => {
          setIsProcessing(true);
          try {
            return await onCreateOrder();
          } catch (error) {
            setIsProcessing(false);
            throw error;
          }
        }}
        onApprove={async (data, actions) => {
          setIsProcessing(true);
          try {
            await onApproveOrder(data, actions);
          } finally {
            setIsProcessing(false);
          }
        }}
        onError={(err) => {
          setIsProcessing(false);
          console.error("PayPal error:", err);
          errorToast("Payment error occurred. Please try again.");
        }}
        onCancel={() => {
          setIsProcessing(false);
          errorToast("Payment cancelled");
        }}
        style={{
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          height: 50,
        }}
        disabled={isProcessing}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Paypalbutton – public component
// -----------------------------------------------------------------------------

export function Paypalbutton({
  orderId,
  order,
  encripyid,
}: {
  orderId: string;
  encripyid: string;
  order: Ordertype;
}) {
  const router = useRouter();
  const socket = useSocket();
  const { setcarttotal } = useGlobalContext();
  const { handleCheckSession } = useCheckSession();

  const createOrder = async (): Promise<string> => {
    const isValid = await handleCheckSession();
    if (!isValid) throw new Error("Session validation failed");

    const request = await Createpaypalorder.bind(null, orderId)();
    if (!request.success) {
      const msg = request.message ?? "Server error";
      errorToast(msg);
      throw new Error(msg);
    }

    if (request.data.id) return request.data.id;

    const details = request.data?.details ?? [];
    console.error("[PayPal] createOrder details:", JSON.stringify(details, null, 2));
    const detail = details[0];
    const msg = detail
      ? `${detail.issue}: ${detail.description}${detail.field ? ` [field: ${detail.field}]` : ""} (${request.data.debug_id})`
      : JSON.stringify(request.data);
    errorToast(msg);
    throw new Error(msg);
  };

  const handleApprove = async (data: any, actions: any) => {
    try {
      const request = await CaptureOrder.bind(null, data.orderID)();
      if (!request.success) {
        errorToast(request.message ?? "Server error");
        return;
      }

      const orderData = request.data;
      const errorDetail = orderData?.details?.[0];

      if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
        return actions.restart();
      } else if (errorDetail) {
        throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
      } else if (!orderData.purchase_units) {
        throw new Error(JSON.stringify(orderData));
      }

      const policyRes = await ApiRequest(
        "/api/policy?type=email",
        undefined,
        "GET",
      );
      if (!policyRes.success) throw new Error("Error Occurred");

      const paidOrder = { ...order, status: Allstatus.paid };
      const htmltemplate = ReactDOMServer.renderToString(
        <OrderReceiptTemplate order={paidOrder} isAdmin={false} />,
      );
      const adminhtmltemplate = ReactDOMServer.renderToString(
        <OrderReceiptTemplate order={paidOrder} isAdmin={true} />,
      );

      const makeReq = await updateStatus.bind(
        null,
        orderId,
        htmltemplate,
        adminhtmltemplate,
      )();

      if (!makeReq.success) {
        errorToast(makeReq.message ?? "");
        return;
      }

      if (socket) {
        await SendNotification(
          {
            type: "New Order",
            content: `Order #${orderId} has requested`,
            checked: false,
            link: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order?&q=${orderId}`,
          },
          socket,
        );
      }

      successToast("Purchase Complete");
      router.replace(`/checkout?orderid=${encripyid}&step=4`);
      setcarttotal(0);
      router.refresh();
    } catch (error) {
      console.error("Payment error", error);
      errorToast("Payment failed, please try again!");
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_ID as string,
        components: "buttons",
        currency: "USD",
        intent: "capture",
      }}
    >
      <PaypalButtonWrapper
        orderId={orderId}
        order={order}
        encripyid={encripyid}
        onCreateOrder={createOrder}
        onApproveOrder={handleApprove}
      />
    </PayPalScriptProvider>
  );
}
