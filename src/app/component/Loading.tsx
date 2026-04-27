import { toast, ToastOptions } from "react-toastify";
import "../globals.css";
import { CSSProperties } from "react";
import Modal from "./Modals";
import { CircularProgress } from "@heroui/react";

export default function LoadingIcon({ style }: { style?: CSSProperties }) {
  return (
    <div className="loadingio-spinner-double-ring-op62hjn5ktc w-fit h-fit pl-10">
      <div className="ldio-jhvhak8eufc">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
export const LoadingLogo = () => {
  return <div></div>;
};
export const LoadingText = ({ style }: { style?: CSSProperties }) => {
  return (
    <div
      style={style}
      className="textloading w-full h-full p-2 absolute top-[45%] left-[47%] z-100 animate-pulse"
    >
      <h1 className="loading text-xl font-bold">Loading...</h1>
    </div>
  );
};
export const BlurLoading = () => {
  return (
    <div className="blueloading w-full h-full p-2 absolute top-0 left-0 z-100 backdrop-blur-sm flex justify-center">
      <CircularProgress size="lg" />
    </div>
  );
};
export const successToast = (message: string) => {
  const toastId = "uniquesuccesstoastid";

  if (toast.isActive(toastId)) return;

  toast.success(message, {
    toastId,
    autoClose: 1000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    position: "top-right",
    theme: "colored",
  });
};
export const errorToast = (message: string, option?: ToastOptions) => {
  const toastId = "uniqueerrortoastid";

  if (toast.isActive(toastId)) return;
  toast.error(message, {
    toastId,
    autoClose: 2000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    position: "top-right",
    theme: "dark",
    ...option,
  });
};

export const infoToast = (message: string, onClose?: () => void) => {
  const toastId = "unique-info-toast"; // Unique ID for the toast
  // Check if the toast is already active
  if (!toast.isActive(toastId)) {
    toast.info(message, {
      toastId, // Assign a unique ID to prevent duplication
      autoClose: 3000,
      closeOnClick: true,
      pauseOnHover: true,
      position: "top-center",
      theme: "dark",
    });

    toast.onChange((action) => {
      if (action.status === "removed") {
        onClose && onClose();
      }
    });
  }
};

export const ContainerLoading = () => {
  return (
    <Modal closestate="none" customZIndex={299}>
      <div className="flex flex-col items-center justify-center gap-5 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl px-10 py-10 w-fit min-w-[180px] sm:min-w-[220px]">
        <CircularProgress
          size="lg"
          color="primary"
          aria-label="Loading..."
          classNames={{
            svg: "w-14 h-14 sm:w-16 sm:h-16",
          }}
        />
        <p className="text-sm sm:text-base font-semibold text-gray-400 tracking-widest uppercase animate-pulse select-none">
          Loading...
        </p>
      </div>
    </Modal>
  );
};
