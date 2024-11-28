import { toast } from "react-toastify";
import "../globals.css";
import { CSSProperties } from "react";
import Modal from "./Modals";
import { CircularProgress, Progress } from "@nextui-org/react";

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
      className="textloading w-full h-full p-2 absolute top-[45%] left-[47%] z-[100] animate-pulse"
    >
      <h1 className="loading text-xl font-bold">Loading...</h1>
    </div>
  );
};
export const BlurLoading = () => {
  return (
    <div className="blueloading w-full h-full p-2 absolute top-0 left-0 z-[100] backdrop-blur flex justify-center">
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
export const errorToast = (message: string) => {
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
    <Modal
      closestate="none"
      customheight="300px"
      customwidth="280px"
      customZIndex={299}
    >
      <div className="loading_contianer w-full h-full bg-white rounded-lg p-5 grid place-content-center relative">
        <div className="loadingio-spinner-double-ring-op62hjn5ktc relative left-[16%] top-[10%]">
          <div className="ldio-jhvhak8eufc">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
