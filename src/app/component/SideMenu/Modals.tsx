import { useCallback, useState } from "react";
import Modal from "../Modals";
import PrimaryButton from "../Button";
import {
  useGlobalStore,
  BannerInitialize,
  Productinitailizestate,
  PromotionInitialize,
} from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../Loading";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DeleteConfirmAction,
  DeleteConfirmFields,
  DeleteConfirmValues,
} from "../DeleteConfirmFields";

// Deletes that need a password or code first (checked again on the server).
const CONFIRM_ACTION: Partial<Record<string, DeleteConfirmAction>> = {
  userinfo: "delete_account",
  user: "delete_users",
  users: "delete_users",
};

export const ConfirmModal = () => {
  const openmodal = useGlobalStore((s) => s.openmodal);
  const setopenmodal = useGlobalStore((s) => s.setopenmodal);
  const isLoading = useGlobalStore((s) => s.isLoading);
  const setisLoading = useGlobalStore((s) => s.setisLoading);
  const product = useGlobalStore((s) => s.product);
  const setproduct = useGlobalStore((s) => s.setproduct);
  const banner = useGlobalStore((s) => s.banner);
  const setbanner = useGlobalStore((s) => s.setbanner);
  const setpromotion = useGlobalStore((s) => s.setpromotion);
  const setinventoryfilter = useGlobalStore((s) => s.setinventoryfilter);
  const globalindex = useGlobalStore((s) => s.globalindex);
  const setglobalindex = useGlobalStore((s) => s.setglobalindex);
  const router = useRouter();
  const searchParam = useSearchParams();
  const isDeleteLoading = isLoading.DELETE;
  const [isProcessing, setIsProcessing] = useState(false);
  const loading = isDeleteLoading || isProcessing;
  const confirmAction = openmodal.confirmmodal.type
    ? CONFIRM_ACTION[openmodal.confirmmodal.type]
    : undefined;
  const [identity, setIdentity] = useState<DeleteConfirmValues>({
    ready: false,
  });

  const handleConfirm = useCallback(
    async (confirm: boolean) => {
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
            },
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
            },
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

        //Custom Delete Function Without Type
        if (openmodal.confirmmodal?.onAsyncDelete) {
          setIsProcessing(true);
          try {
            await openmodal.confirmmodal.onAsyncDelete();
          } finally {
            setIsProcessing(false);
          }
        }
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
       
    },
    [openmodal, globalindex, product, banner],
  );

  const handleConfirmDelete = useCallback(
    async (confirm: boolean) => {
      const { type, index } = openmodal.confirmmodal;
      const param = new URLSearchParams(searchParam);

      const URL =
        type === "product"
          ? "/api/products/crud"
          : type === "banner"
            ? "/api/banner"
            : type === "promotion"
              ? "/api/promotion"
              : type === "user" || type === "users"
                ? "/api/users"
                : "/api/users/info";

      if (confirm) {
        if (type === "promotioncancel") {
          setpromotion(PromotionInitialize);
          setinventoryfilter("promotion");
          setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
          setopenmodal((prev) => ({ ...prev, createPromotion: false }));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ready, ...proof } = identity;
          const body =
            type === "userinfo"
              ? proof
              : type === "users"
                ? { userIds: openmodal.confirmmodal.ids ?? [], ...proof }
                : type === "user"
                  ? { id: index, ...proof }
                  : { id: index };

          const deleteRequest = await ApiRequest(
            URL,
            setisLoading,
            "DELETE",
            "JSON",
            body,
          );

          if (!deleteRequest.success) {
            // Keep the dialog open so a mistyped password or code can be fixed.
            errorToast(deleteRequest.message || "Failed To Delete");
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
          ids: undefined,
          type: undefined,
        },
      }));
       
    },
    [openmodal, searchParam, identity],
  );

  const onConfirm = useCallback(
    () =>
      openmodal.confirmmodal.type
        ? handleConfirmDelete(true)
        : handleConfirm(true),
    [openmodal.confirmmodal.type, handleConfirmDelete, handleConfirm],
  );

  const onReject = useCallback(
    () =>
      openmodal.confirmmodal.type
        ? handleConfirmDelete(false)
        : handleConfirm(false),
    [openmodal.confirmmodal.type, handleConfirmDelete, handleConfirm],
  );

  return (
    <Modal closestate={loading ? "none" : "confirmmodal"} customZIndex={200}>
      <div className="relative flex flex-col items-center gap-y-6 bg-white w-[320px] rounded-2xl p-8 shadow-xl overflow-hidden">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-xs">
            <svg
              className="w-10 h-10 text-indigo-500 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-500 animate-pulse">
              Processing…
            </p>
          </div>
        )}

        {/* Icon — warning or animated ring when loading */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full shrink-0 border-2 transition-colors ${
            loading
              ? "border-indigo-300 bg-indigo-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          {loading ? (
            <svg
              className="w-7 h-7 text-indigo-400 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-gray-800">
            {openmodal.confirmmodal.Warn ?? "Are you sure?"}
          </h3>
          <p
            className={`text-sm transition-colors ${
              loading ? "text-indigo-400 animate-pulse" : "text-gray-500"
            }`}
          >
            {loading ? "Please wait…" : "This action cannot be undone."}
          </p>
        </div>

        {confirmAction && (
          <DeleteConfirmFields
            action={confirmAction}
            disabled={loading}
            onChange={setIdentity}
          />
        )}

        {/* Buttons */}
        <div className="w-full flex flex-row gap-x-3">
          <PrimaryButton
            type="button"
            text="Cancel"
            radius="10px"
            width="100%"
            height="44px"
            disable={loading}
            onClick={onReject}
            color="#E5E7EB"
          />
          <PrimaryButton
            type="button"
            text="Confirm"
            radius="10px"
            width="100%"
            height="44px"
            status={loading ? "loading" : "authenticated"}
            disable={!!confirmAction && !identity.ready}
            onClick={onConfirm}
            color="#EF4444"
          />
        </div>
      </div>
    </Modal>
  );
};

export const Alertmodal = () => {
  const openmodal = useGlobalStore((s) => s.openmodal);
  const setopenmodal = useGlobalStore((s) => s.setopenmodal);
  const handleClose = async () => {
    openmodal.alert.action && (await openmodal.alert.action());
    setopenmodal((prev) => ({
      ...prev,
      alert: { ...prev.alert, open: false },
    }));
  };
  return (
    <Modal closestate="discount">
      <div className="alertmodal_container flex flex-col items-center gap-y-10 w-fit h-fit min-w-75 p-5 bg-white rounded-lg">
        <h1 className="text-xl font-bold text-center w-full break-all">
          {openmodal.alert.text}
        </h1>

        <div className="flex flex-row w-full h-12.5 justify-between">
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
  const handleConfirm = useCallback(async () => {
    await actions.yes();
  }, [actions]);

  const handleReject = useCallback(() => actions.no(), [actions]);

  return (
    <Modal closestate={loading ? "none" : "confirmmodal"} customZIndex={200}>
      <div className="relative flex flex-col items-center gap-y-6 bg-white w-[320px] rounded-2xl p-8 shadow-xl overflow-hidden">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-xs">
            <svg
              className="w-10 h-10 text-indigo-500 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-500 animate-pulse">
              Processing…
            </p>
          </div>
        )}

        {/* Icon */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full shrink-0 border-2 transition-colors ${
            loading
              ? "border-indigo-300 bg-indigo-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          {loading ? (
            <svg
              className="w-7 h-7 text-indigo-400 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-gray-800">Are you sure?</h3>
          <p
            className={`text-sm transition-colors ${
              loading ? "text-indigo-400 animate-pulse" : "text-gray-500"
            }`}
          >
            {loading ? "Please wait…" : "This action cannot be undone."}
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-row gap-x-3">
          <PrimaryButton
            type="button"
            text="Cancel"
            radius="10px"
            width="100%"
            height="44px"
            disable={loading}
            onClick={handleReject}
            color="#E5E7EB"
          />
          <PrimaryButton
            type="button"
            text="Confirm"
            radius="10px"
            width="100%"
            height="44px"
            status={loading ? "loading" : "authenticated"}
            onClick={handleConfirm}
            color="#EF4444"
          />
        </div>
      </div>
    </Modal>
  );
};
