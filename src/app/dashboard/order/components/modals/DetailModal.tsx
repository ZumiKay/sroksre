"use client";

import { useState } from "react";
import { SecondaryModal } from "@/src/app/component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { formatDate } from "@/src/app/component/EmailTemplate";
import { AllorderStatus } from "../../page";
import { OrderDetailType } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faTruck,
  faArrowLeft,
  faClock,
  faDollarSign,
  faClipboardList,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface DetailModalProps {
  close: string;
  data: OrderDetailType;
  orderdata: AllorderStatus;
  setclose: () => void;
  isAdmin: boolean;
}

type DetailView = "user" | "shipping" | "none";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 shrink-0 mr-4">{label}</span>
    <span className="text-sm font-semibold text-gray-800 text-right break-all">
      {value || "—"}
    </span>
  </div>
);

export const DetailModal = ({
  close,
  data,
  setclose,
  orderdata,
  isAdmin,
}: DetailModalProps) => {
  const [view, setview] = useState<DetailView>("none");
  const { openmodal } = useGlobalContext();

  const titles: Record<DetailView, string> = {
    none: "Order Details",
    user: "Buyer Info",
    shipping: "Shipping Address",
  };

  const DetailContent = () => {
    if (view === "user" && data?.user) {
      return (
        <div className="bg-blue-50 rounded-2xl p-4 space-y-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-blue-500 text-xs" />
            </div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
              Buyer
            </span>
          </div>
          <InfoRow label="First Name" value={data.user.firstname} />
          <InfoRow label="Last Name" value={data.user.lastname ?? undefined} />
          <InfoRow label="Email" value={data.user.email} />
          <InfoRow label="Phone" value={(data.user as any).phonenumber ?? undefined} />
        </div>
      );
    }

    if (view === "shipping") {
      return (
        <div className="bg-indigo-50 rounded-2xl p-4 space-y-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faTruck} className="text-indigo-500 text-xs" />
            </div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
              Delivery
            </span>
          </div>
          <InfoRow label="First Name" value={data.shipping?.firstname} />
          <InfoRow label="Last Name" value={data.shipping?.lastname} />
          <InfoRow label="House ID" value={data.shipping?.houseId} />
          <InfoRow label="District / Khan" value={data.shipping?.district} />
          <InfoRow label="Sangkat" value={data.shipping?.songkhat} />
          <InfoRow label="City / Province" value={data.shipping?.province} />
          <InfoRow label="Postal Code" value={data.shipping?.postalcode} />
        </div>
      );
    }

    return null;
  };

  return (
    <SecondaryModal
      size="3xl"
      open={openmodal[close] as boolean}
      onPageChange={setclose}
      closebtn
    >
      <div className="w-full flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          {view !== "none" ? (
            <button
              onClick={() => setview("none")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faClipboardList} className="text-slate-500 text-sm" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900">{titles[view]}</h3>
            <p className="text-[11px] text-gray-400 font-mono truncate">
              #{orderdata.id.slice(0, 12).toUpperCase()}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {view !== "none" ? (
            <DetailContent />
          ) : (
            <>
              {/* Navigation cards */}
              {(isAdmin || (data?.shipping && orderdata.shippingtype !== "Pickup")) && (
                <div className="flex flex-col gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setview("user")}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center shrink-0 transition-colors">
                        <FontAwesomeIcon icon={faUser} className="text-blue-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Buyer Information</p>
                        <p className="text-xs text-gray-400">Name, email & contact</p>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 text-xs group-hover:text-blue-400 transition-colors" />
                    </button>
                  )}
                  {data?.shipping && orderdata.shippingtype !== "Pickup" && (
                    <button
                      onClick={() => setview("shipping")}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center shrink-0 transition-colors">
                        <FontAwesomeIcon icon={faTruck} className="text-indigo-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Shipping Address</p>
                        <p className="text-xs text-gray-400">Delivery location details</p>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 text-xs group-hover:text-indigo-400 transition-colors" />
                    </button>
                  )}
                </div>
              )}

              {/* Order info */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faClock} className="text-gray-400 text-xs" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Order Info
                  </span>
                </div>
                <InfoRow label="Ordered On" value={formatDate(orderdata.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(orderdata.updatedAt)} />
                <InfoRow
                  label="Shipping Type"
                  value={orderdata.shippingtype ?? "—"}
                />
              </div>

              {/* Price breakdown */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faDollarSign} className="text-gray-400 text-xs" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Price Breakdown
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-800">
                    ${orderdata.price?.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Shipping</span>
                  <span className="text-sm font-semibold text-amber-600">
                    ${orderdata.price?.shipping?.toFixed(2) ?? "0.00"}
                  </span>
                </div>
                {(orderdata.price as any)?.vat > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-500">VAT</span>
                    <span className="text-sm font-semibold text-orange-600">
                      ${(orderdata.price as any).vat.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-3 mt-1">
                  <span className="text-sm font-bold text-gray-800">Total</span>
                  <span className="text-base font-extrabold text-blue-600">
                    ${orderdata.price?.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </SecondaryModal>
  );
};
