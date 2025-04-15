"use client";
import {
  BannerInitialize,
  Productinitailizestate,
  PromotionInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "@/src/app/component/Loading";
import PrimaryButton from "@/src/app/component/Button";
import React, { useCallback, useState } from "react";
import { SecondaryModal } from "../Modals";
import { Button } from "@heroui/react";

export const ConfirmModal = () => {
  const {
    openmodal,
    setopenmodal,
    isLoading,
    setisLoading,
    product,
    setproduct,
    banner,
    setbanner,
    setpromotion,
    setinventoryfilter,
    globalindex,
    setglobalindex,
  } = useGlobalContext();
  const router = useRouter();
  const searchParam = useSearchParams();
  const handleConfirm = useCallback(
    async (confirm: boolean) => {
      if (confirm) {
        const URL = "/api/image";
        if (
          openmodal.confirmmodal?.closecon === "createProduct" &&
          globalindex.producteditindex === -1 &&
          product.covers.length > 0
        ) {
          const images = product.covers.map((i) => i.name);
          const deleteimage = await ApiRequest({
            url: URL,
            setloading: setisLoading,
            method: "DELETE",
            data: { names: images },
          });
          if (!deleteimage.success) {
            errorToast("Error Occured Reload Required");
            return;
          }
          setproduct(Productinitailizestate);
        } else if (
          openmodal.confirmmodal?.closecon === "createBanner" &&
          globalindex.bannereditindex === -1 &&
          banner.image.name.length > 0
        ) {
          const image = banner.image.name;
          const deleteImage = await ApiRequest({
            url: URL,
            setloading: setisLoading,
            method: "DELETE",
            data: { name: image },
          });
          if (!deleteImage.success) {
            errorToast("Error Occured Reload Required");
            return;
          }
          setbanner(BannerInitialize);
        }
        setproduct(Productinitailizestate);
        setglobalindex({
          ...globalindex,
          producteditindex: -1,
          bannereditindex: -1,
        });

        setopenmodal({
          ...openmodal,
          [openmodal?.confirmmodal?.closecon as string]: false,
          confirmmodal: {
            open: false,
            confirm: true,
            closecon: "",
          },
        });
      } else {
        setopenmodal({
          ...openmodal,
          confirmmodal: {
            ...openmodal.confirmmodal,
            open: false,
            confirm: false,
            closecon: "",
          },
        });
      }
    },
    [
      banner.image.name,
      globalindex,
      openmodal,
      product.covers,
      setbanner,
      setglobalindex,
      setisLoading,
      setopenmodal,
      setproduct,
    ]
  );

  const handleConfirmDelete = async (confirm: boolean) => {
    const { type, index } = openmodal.confirmmodal ?? {};
    const param = new URLSearchParams(searchParam);

    const URL =
      type === "product"
        ? "/api/products/crud"
        : type === "banner"
        ? "/api/banner"
        : type === "promotion"
        ? "/api/promotion"
        : type === "user"
        ? "/api/users"
        : "/api/users/info";

    if (confirm) {
      if (type === "promotioncancel") {
        setpromotion(PromotionInitialize);
        setinventoryfilter("promotion");
        setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
        setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      } else {
        const deleteRequest = await ApiRequest({
          url: URL,
          setloading: setisLoading,
          method: "DELETE",
          data: type !== "userinfo" ? { id: index } : {},
        });

        if (!deleteRequest.success) {
          errorToast("Failed To Delete");
          return;
        }

        if (type === "user") {
          setglobalindex((prev) => ({ ...prev, useredit: -1 }));
          setopenmodal((prev) => ({ ...prev, createUser: false }));
        }

        if (type === "user") {
          param.set("p", "1");
          router.push(`?${param}`, { scroll: false });
        }
        if (openmodal.confirmmodal?.onAsyncDelete)
          await openmodal.confirmmodal.onAsyncDelete();
        if (openmodal.confirmmodal?.onDelete) openmodal.confirmmodal.onDelete();
      }
    }

    // Reset confirm modal state
    setopenmodal((prev) => ({
      ...prev,
      [type === "promotion" ? "createPromotion" : ""]: false,
      confirmmodal: {
        ...prev.confirmmodal,
        open: false,
        confirm: false,
        closecon: "",
        index: -1,
        type: undefined,
      },
    }));
  };

  return (
    <SecondaryModal open={openmodal.confirmmodal?.open ?? false} size="sm">
      <div className="confirm_container flex flex-col justify-center items-center gap-y-5 bg-white w-[250px] h-[280px] rounded-md">
        <h3 className="question w-full text-center text-lg font-bold text-black">
          {" "}
          {openmodal.confirmmodal?.Warn ?? "Are you sure ?"}
        </h3>
        <div className="btn_container w-4/5 h-fit flex flex-col justify-center items-center gap-y-3">
          <PrimaryButton
            type="button"
            text="Yes"
            radius="10px"
            status={isLoading.DELETE ? "loading" : "authenticated"}
            onClick={() =>
              openmodal.confirmmodal?.type
                ? handleConfirmDelete(true)
                : handleConfirm(true)
            }
            color="#35C191"
          />
          <PrimaryButton
            type="button"
            text="No"
            onClick={() =>
              openmodal.confirmmodal?.type
                ? handleConfirmDelete(false)
                : handleConfirm(false)
            }
            radius="10px"
            disable={isLoading.DELETE}
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
