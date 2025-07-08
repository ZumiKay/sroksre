"use client";
import {
  Productinitailizestate,
  PromotionInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "@/src/app/component/Loading";
import PrimaryButton from "@/src/app/component/Button";
import React, { useCallback, useMemo, useState } from "react";
import { SecondaryModal } from "../Modals";
import { Button } from "@heroui/react";

export const ConfirmModal = () => {
  const {
    openmodal,
    setopenmodal,
    product,
    setproduct,
    banner,
    setpromotion,
    setinventoryfilter,
    globalindex,
    setglobalindex,
    setalldata,
  } = useGlobalContext();

  const router = useRouter();
  const searchParam = useSearchParams();
  const [loading, setloading] = useState(false);

  // Memoize common modal closing logic
  const resetConfirmModal = useCallback(() => {
    return {
      open: false,
      confirm: false,
      closecon: "",
      index: -1,
      type: undefined,
    };
  }, []);

  // Extract URL based on type to avoid repeated logic
  const getApiUrl = useMemo(() => {
    const { type } = openmodal.confirmmodal || {};

    if (type === "product") return "/api/products/crud";
    if (type === "banner") return "/api/banner";
    if (type === "promotion") return "/api/promotion";
    if (type === "user") return "/api/users";
    return "/api/users/info";
  }, [openmodal.confirmmodal]);

  // Handle creation cancellation
  const handleConfirm = useCallback(
    async (confirm: boolean) => {
      if (!confirm) {
        setopenmodal((prev) => ({
          ...prev,
          confirmmodal: resetConfirmModal(),
        }));
        return;
      }

      const closeconKey = openmodal.confirmmodal?.closecon as string;
      const isNewProduct =
        closeconKey === "createProduct" && globalindex.producteditindex === -1;
      const isNewBanner =
        closeconKey === "createBanner" && globalindex.bannereditindex === -1;
      const URL = "/api/image";

      // Handle image deletion if needed
      if (isNewProduct && product.covers.length > 0) {
        const images = product.covers.map((i) => i.id);
        setloading(true);
        const deleteimage = await ApiRequest({
          url: URL,
          method: "DELETE",
          data: { ids: images, type: "normal" },
        });
        setloading(false);

        if (!deleteimage.success) {
          errorToast("Error Occured Reload Required");
          return;
        }
      } else if (isNewBanner && banner.Image.name.length > 0) {
        const deleteImage = await ApiRequest({
          url: URL,
          method: "DELETE",
          data: { name: banner.Image.name },
        });

        if (!deleteImage.success) {
          errorToast("Error Occured Reload Required");
          return;
        }
      }

      // Reset states
      setproduct(Productinitailizestate);
      setglobalindex((prev) => ({
        ...prev,
        producteditindex: -1,
        bannereditindex: -1,
      }));

      // Close modal
      setopenmodal((prev) => ({
        ...prev,
        [closeconKey]: false,
        confirmmodal: resetConfirmModal(),
      }));
    },
    [
      openmodal.confirmmodal,
      globalindex.producteditindex,
      globalindex.bannereditindex,
      product.covers,
      banner.Image,
      setproduct,
      setglobalindex,
      setopenmodal,
      resetConfirmModal,
    ]
  );

  // Handle deletion
  const handleConfirmDelete = useCallback(
    async (confirm: boolean) => {
      if (!confirm) {
        setopenmodal((prev) => ({
          ...prev,
          confirmmodal: resetConfirmModal(),
        }));
        return;
      }

      const { type, index, onAsyncDelete, onDelete } =
        openmodal.confirmmodal || {};

      if (type === "promotioncancel") {
        setpromotion(PromotionInitialize);
        setinventoryfilter("promotion");
        setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
        setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      } else {
        if (onAsyncDelete) {
          await onAsyncDelete();
        }

        if (
          (type === "banner" ||
            type === "product" ||
            type === "promotion" ||
            type === "user" ||
            type === "userinfo") &&
          !onAsyncDelete
        ) {
          setloading(true);
          const deleteRequest = await ApiRequest({
            url: getApiUrl,
            method: "DELETE",
            data: type !== "userinfo" ? { id: [index] } : {},
          });
          setloading(false);

          if (!deleteRequest.success) {
            errorToast("Failed To Delete");
            return;
          }

          if (type === "user") {
            setglobalindex((prev) => ({ ...prev, useredit: -1 }));
            setopenmodal((prev) => ({ ...prev, createUser: false }));
            const param = new URLSearchParams(searchParam);
            param.set("p", "1");
            router.push(`?${param}`, { scroll: false });
          }
        }
        if (onDelete) {
          onDelete();
        }
      }

      // Reset confirm modal state
      setalldata(
        (prev) =>
          prev && {
            [type as never]: (
              prev[type as never] as Array<{ id: number }>
            ).filter((i) => i?.id !== index),
          }
      );

      setopenmodal((prev) => ({
        ...prev,
        [type === "promotion" ? "createPromotion" : ""]: false,
        confirmmodal: resetConfirmModal(),
      }));
    },
    [
      openmodal.confirmmodal,
      setalldata,
      setopenmodal,
      resetConfirmModal,
      setpromotion,
      setinventoryfilter,
      setglobalindex,
      getApiUrl,
      searchParam,
      router,
    ]
  );

  // Memoize the open state to prevent unnecessary re-renders
  const isModalOpen = useMemo(
    () => openmodal.confirmmodal?.open ?? false,
    [openmodal.confirmmodal?.open]
  );

  // Determine the handler based on modal type
  const handleAction = useCallback(
    (isConfirmed: boolean) => {
      return openmodal.confirmmodal?.type
        ? handleConfirmDelete(isConfirmed)
        : handleConfirm(isConfirmed);
    },
    [openmodal.confirmmodal?.type, handleConfirmDelete, handleConfirm]
  );

  return (
    <SecondaryModal open={isModalOpen} size="md">
      <div className="confirm_container flex flex-col justify-center items-center gap-y-5 bg-white rounded-md h-[200px]">
        <h3 className="question w-full text-center text-lg font-bold text-black">
          {openmodal.confirmmodal?.Warn ?? "Are you sure ?"}
        </h3>
        <div className="btn_container w-full h-fit flex flex-col justify-center items-center gap-y-3">
          <PrimaryButton
            type="button"
            text="Yes"
            radius="10px"
            status={loading ? "loading" : "authenticated"}
            onClick={() => handleAction(true)}
            color="#35C191"
          />
          <PrimaryButton
            type="button"
            text="No"
            onClick={() => handleAction(false)}
            radius="10px"
            disable={loading}
            color="#F08080"
          />
        </div>
      </div>
    </SecondaryModal>
  );
};

export const Alertmodal = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const handleClose = async () => {
    if (openmodal.alert?.action) await openmodal.alert.action();
    setopenmodal(
      (prev) => ({ alert: { ...(prev.alert ?? {}), open: false } } as never)
    );
  };
  return (
    <SecondaryModal open={openmodal.alert?.open ?? false} size="sm">
      <div className="alertmodal_container flex flex-col items-center  gap-y-10 w-fit h-fit min-w-[300px] p-5 bg-white rounded-lg">
        <h3 className="text-xl font-bold text-center w-full break-all">
          {openmodal.alert?.text ?? "Alert"}
        </h3>

        <div className="flex flex-row w-full h-[50px] justify-between">
          <PrimaryButton
            type="button"
            text="Close"
            color="lightcoral"
            radius="10px"
            width="100%"
            height="50px"
            onClick={() => handleClose()}
          />
        </div>
      </div>
    </SecondaryModal>
  );
};

export const SecondaryConfirmModal = () => {
  const { setopenmodal, openmodal } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const handleClose = () => {
    setopenmodal({});
  };
  const handleConfirm = async () => {
    if (openmodal.confirmmodal?.onAsyncDelete) {
      setloading(true);
      await openmodal.confirmmodal.onAsyncDelete();
      setloading(false);
    }
    setopenmodal({
      ...openmodal,
      confirmmodal: {
        ...openmodal.confirmmodal,
        open: false,
        confirm: false,
        closecon: "",
      },
    });
  };
  return (
    <SecondaryModal open={openmodal.confirmmodal?.open ?? false} size="sm">
      <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-y-5">
        <h3 className="text-lg font-bold text-black">Are you sure ?</h3>
        <div className="btn w-full h-[40px] flex flex-row items-center gap-x-3">
          <Button
            onPress={() => handleConfirm()}
            isLoading={loading}
            className="w-full h-full text-white font-bold"
            color="success"
          >
            Yes
          </Button>
          <Button
            style={{ backgroundColor: "lightcoral" }}
            onPress={() => handleClose()}
            className="w-full h-full text-white font-bold"
          >
            No
          </Button>
        </div>
      </div>
    </SecondaryModal>
  );
};
