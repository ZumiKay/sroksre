"use client";

import { useGlobalContext } from "@/src/context/GlobalContext";
import { PrimaryPhoto } from "@/src/app/component/PhotoComponent";
import PrimaryButton from "@/src/app/component/Button";
import { useScreenSize } from "@/src/context/CustomHook";
import { LoadingOverlay } from "./LoadingOverlay";

interface ImageSectionProps {
  loading: boolean;
}

export const ImageSection = ({ loading }: ImageSectionProps) => {
  const { product, openmodal, setopenmodal } = useGlobalContext();
  const { isMobile, isTablet } = useScreenSize();

  return (
    <div
      className="image__container flex flex-col items-center 
      lg:sticky relative top-0 gap-y-3 
      w-full sm:w-112.5 md:w-120 lg:w-105 xl:w-120
      mx-auto lg:mx-0 h-fit
      bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200"
    >
      {loading && <LoadingOverlay message="Loading images..." />}
      <PrimaryPhoto
        data={product.covers}
        showcount={true}
        style={{ height: "fit-content" }}
        hover={true}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <PrimaryButton
        type="button"
        text={product.covers.length > 0 ? "Edit Photo" : "Upload Photo"}
        width="100%"
        height="45px"
        radius="10px"
        color="#0097FA"
        disable={loading}
        onClick={() => setopenmodal({ ...openmodal, imageupload: true })}
      />
    </div>
  );
};
