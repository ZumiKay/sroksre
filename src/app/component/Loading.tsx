import { toast } from "react-toastify";
import "../globals.css";
export default function LoadingIcon() {
  return (
    <div className="loadingio-spinner-ellipsis-65iic2fxbb5">
      <div className="ldio-kyh2taiys5r">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
export const successToast = (message: string) => {
  toast.success(message, {
    autoClose: 2000,
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
