import React, {
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  useCallback,
} from "react";

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import { canvasPreview } from "./CanvasPreview";
import { useDebounceEffect } from "../../context/CustomHook";

import "react-image-crop/dist/ReactCrop.css";
import { Selection } from "./Button";
import { SecondaryModal } from "./Modals";
import { errorToast } from "./Loading";
import { Imgurl } from "./Modals/Image";

// Add custom styles for range sliders
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .slider::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }
    .slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
    }
    .slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }
    .slider::-moz-range-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
    }
  `;
  document.head.appendChild(style);
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function CropImage({
  img,
  setclose,
  ratio,
  imgurl,
  Files,
  setimgurl,
  setfile,
  index,
  type,
  open,
}: {
  open: boolean;
  img: string;
  setclose: any;
  ratio: number;
  index: number;
  imgurl: Imgurl[];
  setimgurl: Dispatch<SetStateAction<Imgurl[]>>;
  setfile: Dispatch<SetStateAction<File[]>>;

  Files: File[];
  type: "createproduct" | "createbanner" | "createpromotion";
}) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const blobUrlRef = useRef("");
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(ratio);
  const [imgSrc, setImgSrc] = useState(img);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Get recommended ratios based on type
  const getRecommendedRatios = useCallback(() => {
    switch (type) {
      case "createbanner":
        return [
          { label: "16:9 (Recommended)", value: 16 / 9, recommended: true },
          { label: "21:9 (Ultrawide)", value: 21 / 9, recommended: true },
          { label: "3:1 (Hero Banner)", value: 3 / 1, recommended: true },
          { label: "16:10", value: 16 / 10 },
          { label: "4:3", value: 4 / 3 },
          { label: "1:1", value: 1 },
        ];
      case "createproduct":
        return [
          { label: "1:1 (Recommended)", value: 1, recommended: true },
          { label: "4:5 (Recommended)", value: 4 / 5, recommended: true },
          { label: "3:4", value: 3 / 4 },
          { label: "16:9", value: 16 / 9 },
          { label: "16:10", value: 16 / 10 },
        ];
      case "createpromotion":
        return [
          { label: "16:9 (Recommended)", value: 16 / 9, recommended: true },
          { label: "4:5 (Recommended)", value: 4 / 5, recommended: true },
          { label: "1:1 (Recommended)", value: 1, recommended: true },
          { label: "16:10", value: 16 / 10 },
          { label: "3:4", value: 3 / 4 },
        ];
      default:
        return [
          { label: "16:10", value: 16 / 10 },
          { label: "16:9", value: 16 / 9 },
          { label: "4:5", value: 4 / 5 },
          { label: "3:4", value: 3 / 4 },
          { label: "1:1", value: 1 },
        ];
    }
  }, [type]);

  const apsectratio = getRecommendedRatios();

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    setImageLoading(false);
    setImageError(false);
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const onImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
    errorToast("Failed to load image. Please try again.");
  }, []);

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate,
        );
      }
    },
    100,
    [completedCrop, scale, rotate],
  );

  const handleToggleAspectClick = useCallback(() => {
    if (aspect) {
      setAspect(undefined);
    } else {
      setAspect(16 / 9);

      if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, 16 / 9);
        setCrop(newCrop);
        // Updates the preview
        setCompletedCrop(convertToPixelCrop(newCrop, width, height));
      }
    }
  }, [aspect]);

  const handleSaveCrop = useCallback(async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (!image || !completedCrop || !previewCanvas) {
      errorToast("No Crop Image");
      return;
    }

    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const offscreen = new OffscreenCanvas(
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
      );
      const ctx = offscreen.getContext("2d");
      if (!ctx) {
        throw new Error("No 2d context");
      }
      ctx.drawImage(
        previewCanvas,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
        0,
        0,
        offscreen.width,
        offscreen.height,
      );
      // You might want { type: "image/jpeg", quality: <0 to 1> } to
      // reduce image size
      const blob = await offscreen.convertToBlob({
        type: "image/jpeg",
      });
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = URL.createObjectURL(blob);

      const imgURL = [...imgurl];
      const files = [...Files];

      const updatefile = new File([blob], imgURL[index].name, {
        type: blob.type,
      });
      imgURL[index].url = blobUrlRef.current;
      files[index] = updatefile;

      setimgurl(imgURL);
      setfile(files);

      setclose(false);
    } catch (error) {
      console.log("Error cropping image:", error);
      errorToast("Failed to crop image");
    }
  }, [completedCrop, imgurl, Files, index, setimgurl, setfile, setclose]);
  const handleAspectRatio = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const ratio = parseFloat(e.target.value);
    setAspect(ratio);

    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, ratio);
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    }
  }, []);
  return (
    <SecondaryModal
      open={open}
      size="full"
      onPageChange={(val) => setclose(val)}
      footer={() => (
        <div className="flex flex-row gap-x-4 w-full h-fit px-4 pb-4">
          <button
            type="button"
            onClick={() => handleSaveCrop()}
            className="flex-1 h-14 rounded-xl font-bold text-base bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Apply Crop
          </button>
          <button
            type="button"
            onClick={() => setclose(false)}
            className="flex-1 h-14 rounded-xl font-bold text-base bg-linear-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel
          </button>
        </div>
      )}
    >
      <div className="cropimageContainer w-full h-full bg-linear-to-br from-gray-50 via-white to-blue-50/30 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-y-8 py-8 px-4">
        <div className="w-full max-w-5xl">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Crop & Edit Image
            </h2>
            <p className="text-gray-600">
              Adjust zoom, rotation, and aspect ratio to perfect your image
            </p>
          </div>
          <div className="Crop-Controls w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="w-full h-fit flex flex-col gap-y-3">
              <label
                htmlFor="scale-input"
                className="text-base font-bold text-gray-800 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
                Zoom: {scale.toFixed(1)}x
              </label>
              <input
                id="scale-input"
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={scale}
                disabled={!img}
                className="w-full h-3 bg-linear-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
                onChange={(e) => setScale(Number(e.target.value))}
              />
              <input
                type="number"
                step="0.1"
                value={scale}
                disabled={!img}
                className="text-base w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-hidden transition-all"
                onChange={(e) => setScale(Number(e.target.value))}
              />
            </div>
            <div className="w-full h-fit flex flex-col gap-y-3">
              <label
                htmlFor="rotate-input"
                className="text-base font-bold text-gray-800 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Rotate: {rotate}°
              </label>
              <input
                id="rotate-input"
                type="range"
                min="-180"
                max="180"
                value={rotate}
                className="w-full h-3 bg-linear-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer slider"
                disabled={!img}
                onChange={(e) => setRotate(Number(e.target.value))}
              />
              <input
                type="number"
                value={rotate}
                className="text-base w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden transition-all"
                disabled={!img}
                onChange={(e) =>
                  setRotate(
                    Math.min(180, Math.max(-180, Number(e.target.value))),
                  )
                }
              />
            </div>
            {aspect && (
              <div className="w-full h-fit flex flex-col gap-y-3">
                <label
                  htmlFor="aspect-select"
                  className="text-base font-bold text-gray-800 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                    />
                  </svg>
                  Aspect Ratio
                </label>
                <Selection
                  name="aspect"
                  value={aspect}
                  style={{ height: "48px" }}
                  data={apsectratio}
                  onChange={(e) => handleAspectRatio(e)}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggleAspectClick}
            className="w-full max-w-md h-14 rounded-xl font-bold text-base bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            {aspect ? "Enable Custom Aspect Ratio" : "Select Aspect Ratio"}
          </button>

          {/* Recommended ratios info box */}
          <div className="w-full bg-linear-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-800 mb-2">
                  {type === "createproduct" && "Product Image Guidelines"}
                  {type === "createbanner" && "Banner Image Guidelines"}
                  {type === "createpromotion" && "Promotion Image Guidelines"}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  {type === "createproduct" && (
                    <>
                      <p>
                        • <strong>1:1 (Square)</strong> - Ideal for product
                        listings and thumbnails
                      </p>
                      <p>
                        • <strong>4:5 (Portrait)</strong> - Great for mobile
                        product views
                      </p>
                      <p className="text-gray-600 italic mt-2">
                        Square images work best for consistent product catalogs
                      </p>
                    </>
                  )}
                  {type === "createbanner" && (
                    <>
                      <p>
                        • <strong>16:9 (Wide)</strong> - Standard for website
                        headers and sliders
                      </p>
                      <p>
                        • <strong>21:9 (Ultrawide)</strong> - Modern widescreen
                        displays
                      </p>
                      <p>
                        • <strong>3:1 (Hero Banner)</strong> - Large homepage
                        banners
                      </p>
                      <p className="text-gray-600 italic mt-2">
                        Wide formats ensure full coverage on all screen sizes
                      </p>
                    </>
                  )}
                  {type === "createpromotion" && (
                    <>
                      <p>
                        • <strong>16:9</strong> - Social media and web
                        promotions
                      </p>
                      <p>
                        • <strong>4:5</strong> - Instagram and mobile-first
                        platforms
                      </p>
                      <p>
                        • <strong>1:1</strong> - Universal format for all
                        platforms
                      </p>
                      <p className="text-gray-600 italic mt-2">
                        Choose based on your target platform
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 overflow-hidden">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Crop Area
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Drag the corners to adjust your crop area
              </p>
            </div>
            <div className="flex justify-center">
              {imageLoading && (
                <div className="flex flex-col items-center justify-center p-12 gap-4">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600 font-semibold">
                    Loading image...
                  </p>
                </div>
              )}
              {imageError && (
                <div className="flex flex-col items-center justify-center p-12 gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-red-600 font-semibold">
                    Failed to load image
                  </p>
                  <button
                    onClick={() => {
                      setImageLoading(true);
                      setImageError(false);
                      setImgSrc(img + "?t=" + Date.now());
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minHeight={100}
                className={`max-w-full ${
                  imageLoading || imageError ? "hidden" : ""
                }`}
              >
                <img
                  ref={imgRef}
                  alt="Cropping Image"
                  src={imgSrc}
                  crossOrigin="anonymous"
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxWidth: "100%",
                    height: "auto",
                  }}
                  onLoad={onImageLoad}
                  onError={onImageError}
                />
              </ReactCrop>
            </div>
          </div>

          {!!completedCrop && (
            <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Preview
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This is how your cropped image will look
                </p>
              </div>
              <div className="flex justify-center items-center bg-linear-to-br from-gray-100 to-gray-50 rounded-xl p-8 border-2 border-dashed border-gray-300">
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    objectFit: "contain",
                    width: completedCrop.width,
                    height: completedCrop.height,
                    maxWidth: "100%",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-semibold">
                    Dimensions: {Math.round(completedCrop.width)} x{" "}
                    {Math.round(completedCrop.height)}px
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SecondaryModal>
  );
}
