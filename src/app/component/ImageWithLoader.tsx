"use client";
import Image, { ImageProps, StaticImageData } from "next/image";
import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@heroui/react";
import DefaultImage from "../../../public/Image/default.png";

interface ImageWithLoaderProps
  extends Omit<ImageProps, "onLoadingComplete" | "onError"> {
  skeletonClassName?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
  fallbackSrc?: string | StaticImageData;
  showErrorState?: boolean;
}

export const ImageWithLoader = ({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  containerClassName = "",
  showSkeleton = true,
  fallbackSrc,
  showErrorState = true,
  ...props
}: ImageWithLoaderProps) => {
  // Check if src is valid (not empty string, null, or undefined)
  const isValidSrc = (source: any): boolean => {
    if (!source) return false;
    if (typeof source === "string" && source.trim() === "") return false;
    return true;
  };

  const initialSrc = useMemo(() => {
    return isValidSrc(src) ? src : fallbackSrc || null;
  }, [src, fallbackSrc]);

  const [imageLoading, setImageLoading] = useState(!!initialSrc);
  const [hasError, setHasError] = useState(!initialSrc);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    const newSrc = isValidSrc(src) ? src : fallbackSrc || null;
    if (currentSrc !== newSrc) {
      setCurrentSrc(newSrc);
      setImageLoading(!!newSrc);
      setHasError(!newSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    setImageLoading(false);

    // Try fallback if available and not already using it
    if (fallbackSrc && currentSrc !== fallbackSrc && isValidSrc(fallbackSrc)) {
      setCurrentSrc(fallbackSrc);
      setImageLoading(true);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className={`relative ${containerClassName}`}>
      {imageLoading && showSkeleton && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-200">
          <Skeleton className={`w-full h-full ${skeletonClassName}`} />
        </div>
      )}

      {hasError && showErrorState ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-16 h-16 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium">Image not found</p>
          <p className="text-xs mt-1">Unable to load image</p>
        </div>
      ) : isValidSrc(currentSrc) ? (
        <Image
          src={currentSrc ?? DefaultImage}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setImageLoading(false)}
          onError={handleError}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
