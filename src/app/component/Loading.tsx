import { toast } from "react-toastify";
import "../globals.css";
export default function LoadingIcon() {
  return (
    <div className="loadingio-spinner-double-ring-op62hjn5ktc">
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
export const successToast = (message: string) => {
  toast.success(message, {
    autoClose: 1000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    position: "top-right",
    theme: "colored",
  });
};
export const errorToast = (message: string) => {
  toast.error(message, {
    autoClose: 2000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    position: "top-right",
    theme: "dark",
  });
};

export const infoToast = (message: string) => {
  toast.info(message, {
    autoClose: 3000,
    closeOnClick: true,
    pauseOnHover: true,
    position: "top-center",
    theme: "dark",
  });
};
