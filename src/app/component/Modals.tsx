"use client";

import { CSSProperties, ReactNode, useEffect, useRef } from "react";
import {
  GlobalIndexState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Modal as Modals,
} from "@nextui-org/react";

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
  const { openmodal, setopenmodal, setglobalindex, globalindex, setalldata } =
    useGlobalContext();

  return (
    <div
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
      style={{ zIndex: customZIndex, overflow: "hidden" }}
      className={`modal__container z-50 fixed flex flex-col items-center justify-center left-0 top-0 w-full h-screen ${
        bgblur ? "backdrop-blur-md" : ""
      } `}
    >
      <div
        ref={ref}
        style={{ width: customwidth, height: customheight }}
        className="w-1/2 h-1/2 max-small_phone:h-screen flex flex-col justify-center items-center"
      >
        {children}
      </div>
    </div>
  );
}

interface SecondaryModalInterface {
  header?: () => ReactNode;
  children: ReactNode;
  footer?: (onClose: () => void) => ReactNode;
  open: boolean;
  onPageChange?: (val: boolean) => void;
  closebtn?: boolean;
  style?: CSSProperties;
  placement?:
    | "center"
    | "auto"
    | "top"
    | "top-center"
    | "bottom"
    | "bottom-center";
  size:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "full";
}
export function SecondaryModal({
  header,
  children,
  footer,
  open,
  size,
  onPageChange,
  closebtn,
  style,
  placement,
}: SecondaryModalInterface) {
  return (
    <Modals
      hideCloseButton={closebtn ? !closebtn : true}
      size={size}
      isOpen={open}
      placement={placement}
      closeButton
      style={style}
      className="z-[200]"
      scrollBehavior="normal"
      onOpenChange={(open) => {
        onPageChange && onPageChange(open);
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {header && (
              <ModalHeader className="flex flex-col gap-1">
                {header()}
              </ModalHeader>
            )}
            <ModalBody className="overflow-y-auto">{children}</ModalBody>
            {footer && <ModalFooter>{footer(onClose)}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </Modals>
  );
}
