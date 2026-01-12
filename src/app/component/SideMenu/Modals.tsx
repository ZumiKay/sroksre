import React from "react";
import Modal from "../Modals";
import PrimaryButton from "../Button";
import {
  useGlobalContext,
  BannerInitialize,
  Productinitailizestate,
  PromotionInitialize,
} from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../Loading";
import { useRouter, useSearchParams } from "next/navigation";

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

  const handleConfirm = async (confirm: boolean) => {
    if (confirm) {
      const URL = "/api/image";
      if (
        openmodal.confirmmodal.closecon === "createProduct" &&
        globalindex.producteditindex === -1 &&
        product.covers.length > 0
      ) {
        const images = product.covers.map((i) => i.name);
        const deleteimage = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          {
            names: images,
          }
        );
        if (!deleteimage.success) {
          errorToast("Error Occured Reload Required");
          return;
        }
        setproduct(Productinitailizestate);
      } else if (
        openmodal.confirmmodal.closecon === "createBanner" &&
        globalindex.bannereditindex === -1 &&
        banner.image.name.length > 0
      ) {
        const image = banner.image.name;
        const deleteImage = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          {
            name: image,
          }
        );
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
        [openmodal.confirmmodal.closecon]: false,
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
  };

  const handleConfirmDelete = async (confirm: boolean) => {
    const { type, index } = openmodal.confirmmodal;
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
        const deleteRequest = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          type !== "userinfo" ? { id: index } : {}
        );

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
        openmodal.confirmmodal.onAsyncDelete &&
          (await openmodal.confirmmodal.onAsyncDelete());
        openmodal.confirmmodal.onDelete && openmodal.confirmmodal.onDelete();
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
    <Modal closestate={"confirmmodal"} customZIndex={200}>
      <div className="confirm_container flex flex-col justify-center items-center gap-y-5 bg-white w-[250px] h-[280px] rounded-md">
        <h3 className="question w-full text-center text-lg font-bold text-black">
          {openmodal.confirmmodal.Warn ?? "Are you sure ?"}
        </h3>
        <div className="btn_container w-4/5 h-fit flex flex-col justify-center items-center gap-y-3">
          <PrimaryButton
            type="button"
            text="Yes"
            radius="10px"
            status={isLoading.DELETE ? "loading" : "authenticated"}
            onClick={() =>
              openmodal.confirmmodal.type
                ? handleConfirmDelete(true)
                : handleConfirm(true)
            }
            color="#35C191"
          />
          <PrimaryButton
            type="button"
            text="No"
            onClick={() =>
              openmodal.confirmmodal.type
                ? handleConfirmDelete(false)
                : handleConfirm(false)
            }
            radius="10px"
            disable={isLoading.DELETE}
            color="#F08080"
          />
        </div>
      </div>
    </Modal>
  );
};

export const Alertmodal = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const handleClose = async () => {
    openmodal.alert.action && (await openmodal.alert.action());
    setopenmodal((prev) => ({
      ...prev,
      alert: { ...prev.alert, open: false },
    }));
  };
  return (
    <Modal closestate="discount">
      <div className="alertmodal_container flex flex-col items-center gap-y-10 w-fit h-fit min-w-[300px] p-5 bg-white rounded-lg">
        <h1 className="text-xl font-bold text-center w-full break-all">
          {openmodal.alert.text}
        </h1>

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
    </Modal>
  );
};

interface PrimaryConfirmModalProps {
  actions: {
    yes: (...arg: any) => Promise<void>;
    no: (...arg: any) => void;
  };
  loading: boolean;
}

export const PrimaryConfirmModal = ({
  actions,
  loading,
}: PrimaryConfirmModalProps) => {
  const handleConfirm = async () => {
    await actions.yes();
  };

  const handleReject = () => actions.no();

  return (
    <Modal closestate={"confirmmodal"} customZIndex={200}>
      <div className="confirm_container flex flex-col justify-center items-center gap-y-5 bg-white w-[250px] h-[280px] rounded-md">
        <h3 className="question text-lg font-bold text-black">
          Are You Sure ?
        </h3>
        <div className="btn_container w-4/5 h-fit flex flex-col justify-center items-center gap-y-3">
          <PrimaryButton
            type="button"
            text="Yes"
            radius="10px"
            status={loading ? "loading" : "authenticated"}
            onClick={handleConfirm}
            color="#35C191"
          />
          <PrimaryButton
            type="button"
            text="No"
            onClick={handleReject}
            radius="10px"
            disable={loading}
            color="#F08080"
          />
        </div>
      </div>
    </Modal>
  );
};
