import React, {
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  useEffect,
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
import PrimaryButton from "./Button";
import { SecondaryModal } from "./Modals";
import { errorToast, successToast } from "./Loading";
import { ImageDatatype } from "@/src/context/GlobalType.type";
import Image from "next/image";
import { AsyncSelection } from "./AsynSelection";
import { IsNumber } from "@/src/lib/utilities";

// Extract constants and helper functions outside the component
const ASPECT_RATIOS = [
  { label: "16:10", value: 16 / 10 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:5", value: 4 / 5 },
  { label: "3:4", value: 3 / 4 },
  { label: "1:1", value: 1 },
];

const DEFAULT_SCALE = 1;
const DEFAULT_ROTATION = 0;
const DEFAULT_CROP_WIDTH = 90;

/**
 * Centers and applies aspect ratio to a crop
 */
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: DEFAULT_CROP_WIDTH,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

interface CropImageProps {
  open: boolean;
  img: string;
  setclose: (val: boolean) => void;
  ratio: number;
  index: number;
  imgurl: ImageDatatype[];
  setimgurl: Dispatch<SetStateAction<ImageDatatype[]>>;
  setfile: Dispatch<SetStateAction<File[]>>;
  Files: File[];
  type: "createproduct" | "createbanner" | "createpromotion";
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
  open,
}: CropImageProps) {
  // Refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const blobUrlRef = useRef<string>("");
  // State
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [rotate, setRotate] = useState(DEFAULT_ROTATION);
  const [aspect, setAspect] = useState<number | undefined>(ratio);
  const [imageUrl, setImageUrl] = useState<string>(img);
  const [urlInput, setUrlInput] = useState<string>("");
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
  const [isUrlInputVisible, setIsUrlInputVisible] = useState<boolean>(false);

  /**
   * Reset crop when the source image changes
   */
  useEffect(() => {
    setImageUrl(img);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(DEFAULT_SCALE);
    setRotate(DEFAULT_ROTATION);
  }, [img]);

  /**
   * Handle image load event
   */
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  /**
   * Update canvas preview when crop, scale, or rotation changes
   */
  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        await canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate
        );
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  /**
   * Toggle between fixed and free aspect ratio
   */
  const handleToggleAspectClick = () => {
    if (aspect) {
      setAspect(undefined);
    } else {
      const defaultAspect = 16 / 9;
      setAspect(defaultAspect);

      if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, defaultAspect);
        setCrop(newCrop);
        setCompletedCrop(convertToPixelCrop(newCrop, width, height));
      }
    }
  };

  /**
   * Load image from URL
   */
  const handleLoadFromUrl = async () => {
    if (!urlInput || !urlInput.trim()) {
      errorToast("Please enter a valid URL");
      return;
    }

    try {
      setIsLoadingUrl(true);

      // Validate URL format
      new URL(urlInput); // Will throw if invalid URL

      // Fetch the image to check if it exists and is accessible
      const response = await fetch(urlInput, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        throw new Error("URL does not point to a valid image");
      }

      // Set the image URL
      setImageUrl(urlInput);

      // Reset crop settings
      setCrop(undefined);
      setCompletedCrop(undefined);
      setScale(DEFAULT_SCALE);
      setRotate(DEFAULT_ROTATION);

      // Hide URL input
      setIsUrlInputVisible(false);

      successToast("Image loaded successfully");
    } catch (error) {
      console.error("Error loading image from URL:", error);
      errorToast(
        error instanceof Error ? error.message : "Failed to load image from URL"
      );
    } finally {
      setIsLoadingUrl(false);
    }
  };

  /**
   * Save the cropped image
   */
  const handleSaveCrop = async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (!image || !completedCrop || !previewCanvas) {
      errorToast("No crop image selected");
      return;
    }

    try {
      // Calculate scale factors
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Create offscreen canvas with proper dimensions
      const offscreen = new OffscreenCanvas(
        completedCrop.width * scaleX,
        completedCrop.height * scaleY
      );

      const ctx = offscreen.getContext("2d");
      if (!ctx) {
        throw new Error("No 2d context available");
      }

      // Draw image to offscreen canvas
      ctx.drawImage(
        previewCanvas,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
        0,
        0,
        offscreen.width,
        offscreen.height
      );

      // Convert to blob with jpeg format
      const blob = await offscreen.convertToBlob({
        type: "image/jpeg",
        quality: 0.9, // Slightly reduce quality for better performance
      });

      // Clean up previous blob URL if it exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      // Create new blob URL
      blobUrlRef.current = URL.createObjectURL(blob);

      // Generate a filename if the image is from a URL
      const isExternalUrl = imageUrl !== img;
      const filename = isExternalUrl
        ? `image_${Date.now()}.jpg`
        : imgurl[index].name;

      // Update state
      const updatedImgUrls = [...imgurl];
      const updatedFiles = [...Files];

      const updatedFile = new File([blob], filename, {
        type: blob.type,
      });

      updatedImgUrls[index].url = blobUrlRef.current;
      updatedImgUrls[index].name = filename;
      updatedFiles[index] = updatedFile;

      setimgurl(updatedImgUrls);
      setfile(updatedFiles);

      // Close modal
      setclose(false);
    } catch (error) {
      console.error("Error saving crop:", error);
      errorToast("Failed to save crop");
    }
  };

  /**
   * Handle aspect ratio change
   */
  const handleAspectRatio = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val || !IsNumber(val)) return;
    const newRatio = parseFloat(e.target.value);
    setAspect(newRatio);

    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, newRatio);
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    }
  };

  return (
    <SecondaryModal
      open={open}
      size="full"
      onPageChange={setclose}
      footer={() => (
        <div className="flex gap-4 w-full">
          <PrimaryButton
            text="Apply Crop"
            type="button"
            width="100%"
            radius="10px"
            onClick={handleSaveCrop}
          />
          <PrimaryButton
            color="lightcoral"
            text="Cancel"
            type="button"
            width="100%"
            radius="10px"
            onClick={() => setclose(false)}
          />
        </div>
      )}
    >
      <div className="w-full h-full bg-white overflow-y-auto flex flex-col items-center gap-6 p-4">
        {/* URL Input Section */}
        <div className="w-full max-w-3xl flex flex-col gap-4">
          <div className="flex justify-center">
            <PrimaryButton
              text={isUrlInputVisible ? "Hide URL Input" : "Load From URL"}
              type="button"
              width="100%"
              radius="10px"
              onClick={() => setIsUrlInputVisible(!isUrlInputVisible)}
            />
          </div>

          {isUrlInputVisible && (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 w-full">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <PrimaryButton
                  text="Load"
                  type="button"
                  width="auto"
                  radius="10px"
                  disable={isLoadingUrl || !urlInput.trim()}
                  onClick={handleLoadFromUrl}
                />
              </div>
              <p className="text-sm text-gray-500">
                Enter the URL of an image to load it for cropping
              </p>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="scale-input" className="text-lg font-medium">
              Zoom
            </label>
            <input
              id="scale-input"
              type="number"
              step="0.1"
              min="0.1"
              max="3"
              value={scale}
              disabled={!imageUrl}
              className="text-lg h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="rotate-input" className="text-lg font-medium">
              Rotate
            </label>
            <input
              id="rotate-input"
              type="number"
              value={rotate}
              min="-180"
              max="180"
              className="text-lg h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!imageUrl}
              onChange={(e) =>
                setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
              }
            />
          </div>

          {aspect && (
            <div className="flex flex-col gap-2 w-full h-full">
              <label htmlFor="rotate-input" className="text-lg font-medium">
                Aspect Ratio
              </label>
              <AsyncSelection
                type="normal"
                data={() => ASPECT_RATIOS}
                option={{
                  id: "aspect-select",
                  selectedKeys: [aspect.toString()],
                  onChange: handleAspectRatio,
                  "aria-label": "Aspect Ratio",
                  className: "w-full h-fit",
                }}
              />
            </div>
          )}
        </div>

        <PrimaryButton
          text={aspect ? "Use Custom Aspect" : "Use Fixed Aspect Ratio"}
          type="button"
          width="100%"
          radius="10px"
          height="50px"
          onClick={handleToggleAspectClick}
        />

        {/* Image Crop Area */}
        <div className="w-full max-w-4xl flex justify-center">
          {isLoadingUrl ? (
            <div className="flex items-center justify-center w-full h-60 bg-gray-100 rounded-lg">
              <p>Loading image...</p>
            </div>
          ) : imageUrl ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minHeight={100}
              className="max-w-full max-h-[60vh] border border-gray-300 rounded-lg overflow-hidden"
            >
              <Image
                ref={imgRef}
                alt="Crop this image"
                src={imageUrl}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  transition: "transform 0.2s ease-in-out",
                }}
                onLoad={onImageLoad}
                className="max-w-full max-h-[60vh] object-contain"
                onError={() => {
                  errorToast("Failed to load image");
                  setImageUrl(img); // Fallback to original image
                }}
                width={1000}
                height={1000}
              />
            </ReactCrop>
          ) : (
            <div className="flex items-center justify-center w-full h-60 bg-gray-100 rounded-lg">
              <p>No image selected</p>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {!!completedCrop && (
          <div className="w-full flex flex-col items-center gap-2">
            <h3 className="text-xl font-medium">Preview</h3>
            <canvas
              ref={previewCanvasRef}
              className="border border-gray-300 rounded-lg shadow-sm object-contain"
              style={{
                width: completedCrop.width,
                height: completedCrop.height,
                maxWidth: "100%",
                maxHeight: "300px",
              }}
            />
          </div>
        )}
      </div>
    </SecondaryModal>
  );
}
