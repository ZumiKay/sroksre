"use client";
import { toast } from "react-toastify";
import "../globals.css";
import { CSSProperties, useEffect, useState } from "react";
import { CircularProgress } from "@heroui/react";
import { SecondaryModal } from "./Modals";
import { motion } from "framer-motion";

export default function LoadingIcon() {
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
        if (onClose) onClose();
      }
    });
  }
};

type LoadingProps = {
  message?: string;
  showAfterDelay?: boolean;
  delayMs?: number;
};

export const ContainerLoading = ({
  message = "Loading your content...",
  showAfterDelay = true,
  delayMs = 300,
}: LoadingProps) => {
  const [visible, setVisible] = useState(!showAfterDelay);

  // Only show loading indicator after a brief delay to avoid flashing for quick operations
  useEffect(() => {
    if (showAfterDelay) {
      const timer = setTimeout(() => setVisible(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [showAfterDelay, delayMs]);

  if (!visible) return null;

  return (
    <SecondaryModal open={true} size="sm">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="loading-container w-full h-full bg-white rounded-lg p-8 flex flex-col items-center justify-center gap-6"
        role="alert"
        aria-busy="true"
        aria-live="polite"
      >
        {/* Loading spinner with improved animation */}
        <div className="loading-spinner relative">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-16 h-16 border-4 border-incart border-r-transparent border-b-incart border-l-transparent rounded-full"
          />

          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-10 h-10 border-4 border-t-transparent border-incart border-b-transparent border-l-incart rounded-full absolute top-3 left-3"
          />
        </div>

        {/* Loading message */}
        <motion.p
          className="text-gray-700 text-lg font-medium text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>

        {/* Progress dots animation */}
        <motion.div
          className="flex space-x-2 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((dot) => (
            <motion.div
              key={dot}
              className="w-2 h-2 bg-incart rounded-full"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: dot * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </SecondaryModal>
  );
};
