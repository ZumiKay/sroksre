"use client";

import React from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { AllorderType } from "@/src/lib/utilities";
import { AllorderStatus } from "../page";
import { ModalDataType } from "./types";
import { Productordertype } from "@/src/types/order.type";
import { OrderUserType } from "@/src/app/checkout/action";
import {
  ActionModal,
  DetailOrderModal,
  OrderProductDetailsModal,
} from "../OrderComponent";

export interface ButtonSsrProps {
  id: string;
  idx: number;
  width: string;
  height: string;
  name: string;
  color?: string;
  orderdata?: AllorderStatus;
  type: string;
  data?: ModalDataType;
  isAdmin: boolean;
}

export const ButtonSsr = React.memo(
  ({
    width,
    height,
    name,
    color,
    type,
    idx,
    id,
    data,
    orderdata,
    isAdmin,
  }: ButtonSsrProps) => {
    const { openmodal, setopenmodal } = useGlobalContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    const clickedtype = React.useMemo(() => `${type}${idx}`, [type, idx]);

    const handleClick = React.useCallback(() => {
      const param = new URLSearchParams(searchParams);
      param.set("id", id);
      param.set("ty", type);
      setopenmodal((prev) => ({ ...prev, [clickedtype]: true }));
      router.push(`?${param.toString()}`);
    }, [searchParams, id, type, clickedtype, setopenmodal, router]);

    const handleClose = React.useCallback(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      url.searchParams.delete("ty");
      setopenmodal((prev) => ({ ...prev, [clickedtype]: false }));
      router.replace(url.pathname + url.search);
    }, [clickedtype, setopenmodal, router]);

    const isModalOpen = openmodal[clickedtype];

    const renderModal = React.useMemo(() => {
      if (!isModalOpen) return null;

      if (type.startsWith(AllorderType.orderdetail)) {
        return (
          <DetailOrderModal
            key={idx}
            close={clickedtype}
            data={data?.detail as never}
            orderdata={orderdata as AllorderStatus}
            setclose={handleClose}
            isAdmin={isAdmin}
          />
        );
      }

      if (type.startsWith(AllorderType.orderproduct)) {
        return (
          <OrderProductDetailsModal
            key={idx}
            close={clickedtype}
            setclose={handleClose}
            data={data?.product as Productordertype[]}
          />
        );
      }

      if (type.startsWith(AllorderType.orderaction)) {
        return (
          <ActionModal
            key={idx}
            close={clickedtype}
            types="none"
            oid={id}
            setclose={handleClose}
            order={data?.action as unknown as OrderUserType}
          />
        );
      }

      return null;
    }, [
      isModalOpen,
      type,
      idx,
      clickedtype,
      data,
      orderdata,
      isAdmin,
      id,
      handleClose,
    ]);

    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className="relative min-w-25 px-4 py-2 rounded-xl font-medium text-white text-center
                   bg-linear-to-r from-blue-600 to-purple-600
                   hover:from-blue-700 hover:to-purple-700
                   active:scale-95
                   shadow-md hover:shadow-lg
                   transition-all duration-200 ease-in-out
                   focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed
                   whitespace-normal wrap-break-words leading-tight"
          style={{
            width: width === "auto" ? undefined : width,
            minHeight: height === "auto" ? undefined : height,
            ...(color && { background: color }),
          }}
        >
          <span className="relative z-10 block">{name}</span>
          <div className="absolute inset-0 rounded-xl bg-linear-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-200" />
        </button>
        {renderModal}
      </>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.name === next.name &&
    prev.type === next.type &&
    prev.idx === next.idx &&
    prev.isAdmin === next.isAdmin &&
    prev.color === next.color,
);

ButtonSsr.displayName = "ButtonSsr";
