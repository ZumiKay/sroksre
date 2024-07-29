"use client";

import { ReactNode, useRef } from "react";
import {
  GlobalIndexState,
  useGlobalContext,
} from "@/src/context/GlobalContext";

export default function Modal({
  children,
  customZIndex,
  customwidth,
  customheight,
  closestate,
  bgblur,
  action,
}: {
  children: ReactNode;
  customZIndex?: number;
  customwidth?: string;
  customheight?: string;

  bgblur?: boolean;
  action?: () => void;
  closestate:
    | "createProduct"
    | "createBanner"
    | "createCategory"
    | "createPromotion"
    | "createUser"
    | "addsubcategory"
    | "updatestock"
    | "confirmmodal"
    | "filteroption"
    | "discount"
    | "editprofile"
    | "editsize"
    | "none"
    | string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { setopenmodal, setglobalindex, globalindex, setalldata } =
    useGlobalContext();

  return (
    <dialog
      onClick={(e) => {
        if (
          ref.current &&
          !ref.current.contains(e.target as Node) &&
          closestate !== "none"
        ) {
          const updateIndex = Object.fromEntries(
            Object.entries(globalindex).map(([key, _]) => [key, -1])
          ) as unknown as GlobalIndexState;
          action && action();
          setglobalindex(updateIndex);

          if (closestate === "createCategory") {
            setalldata((prev) => ({ ...prev, category: [] }));
          }
          setopenmodal((prev) => ({ ...prev, [closestate]: false }));
        }
      }}
      style={{ zIndex: customZIndex, overflowY: "auto" }}
      className={`modal__container z-50 fixed flex flex-col items-center justify-center left-0 top-0 w-full h-screen ${
        bgblur ? "backdrop-blur-md" : ""
      } `}
    >
      <div
        ref={ref}
        style={{ width: customwidth, height: customheight }}
        className="w-1/2 h-1/2 flex flex-col justify-center items-center"
      >
        {children}
      </div>
    </dialog>
  );
}
