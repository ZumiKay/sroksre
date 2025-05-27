import React, {
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  useCallback,
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
import { errorToast } from "./Loading";
import { ImageDatatype, SelectType } from "@/src/context/GlobalType.type";
import Image from "next/image";
import { NumberInput } from "@heroui/react";
import { AsyncSelection } from "./AsynSelection";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}
const apsectratio: Array<SelectType<number>> = [
  {
    label: `16:10`,
    value: 16 / 10,
  },
  {
    label: `16:9`,
    value: 16 / 9,
  },
  {
    label: `4:5`,
    value: 4 / 5,
  },
  {
    label: `3:4`,
    value: 3 / 4,
  },
  {
    label: "1:1",
    value: 1,
  },
];

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
}: {
  open: boolean;
  img: string;
  setclose: (val: boolean) => void;
  ratio: number;
  index: number;
  imgurl: ImageDatatype[];
  setimgurl: Dispatch<SetStateAction<ImageDatatype[]>>;
  setfile: Dispatch<SetStateAction<File[]>>;
  Files: File[];
}) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const blobUrlRef = useRef("");
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(ratio);

  // Gesture tracking state
  const gestureRef = useRef({
    // For pinch/zoom
    startDistance: 0,
    startScale: 1,
    // For rotation
    startAngle: 0,
    startRotation: 0,
    // For tracking active gestures
    isGesturing: false,
  });

  // Calculate distance between two points (for pinch)
  const getDistance = (p1: Touch, p2: Touch) => {
    return Math.sqrt(
      Math.pow(p2.clientX - p1.clientX, 2) +
        Math.pow(p2.clientY - p1.clientY, 2)
    );
  };

  // Calculate angle between two points (for rotate)
  const getAngle = (p1: Touch, p2: Touch) => {
    return (
      (Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180) /
      Math.PI
    );
  };

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        gestureRef.current.startDistance = getDistance(touch1, touch2);
        gestureRef.current.startScale = scale;

        gestureRef.current.startAngle = getAngle(touch1, touch2);
        gestureRef.current.startRotation = rotate;

        gestureRef.current.isGesturing = true;
      }
    },
    [scale, rotate]
  );

  // Handle touch move (for pinch/zoom and rotation)
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && gestureRef.current.isGesturing) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Handle pinch/zoom
      const currentDistance = getDistance(touch1, touch2);
      const scaleChange = currentDistance / gestureRef.current.startDistance;
      const newScale = Math.min(
        Math.max(gestureRef.current.startScale * scaleChange, 0.5),
        5
      );
      setScale(newScale);

      // Handle rotation
      const currentAngle = getAngle(touch1, touch2);
      const angleDiff = currentAngle - gestureRef.current.startAngle;
      const newRotation = gestureRef.current.startRotation + angleDiff;
      setRotate(Math.min(Math.max(newRotation, -180), 180));
    }
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    gestureRef.current.isGesturing = false;
  }, []);

  // Mouse wheel for zoom
  const handleMouseWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();

        // Determine zoom direction and amount
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        const newScale = Math.min(Math.max(scale + delta, 0.5), 5);
        setScale(newScale);
      } else if (e.shiftKey) {
        e.preventDefault();

        // Shift + wheel for rotation
        const delta = e.deltaY < 0 ? 5 : -5;
        const newRotation = rotate + delta;
        setRotate(Math.min(Math.max(newRotation, -180), 180));
      }
    },
    [scale, rotate]
  );

  // Set up event listeners
  useEffect(() => {
    const container = imgContainerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("wheel", handleMouseWheel, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("wheel", handleMouseWheel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseWheel]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

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
          rotate
        );
      }
    },
    100,
    [completedCrop, scale, rotate]
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
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
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
      offscreen.height
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
  }, [Files, completedCrop, imgurl, index, setclose, setfile, setimgurl]);

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

  // Reset transformations
  const resetTransforms = useCallback(() => {
    setScale(1);
    setRotate(0);
  }, []);

  return (
    <SecondaryModal
      open={open}
      size="full"
      onPageChange={(val) => setclose(val)}
      footer={() => (
        <div className="flex flex-row gap-x-5 w-full h-fit">
          <PrimaryButton
            text="Done"
            type="button"
            width="90%"
            radius="10px"
            style={{ marginBottom: "10px" }}
            onClick={() => handleSaveCrop()}
          />
          <PrimaryButton
            color="lightcoral"
            text="Close"
            type="button"
            width="90%"
            radius="10px"
            style={{ marginBottom: "10px" }}
            onClick={() => setclose(false)}
          />
        </div>
      )}
    >
      <div className="cropimageContainer w-full h-full bg-white overflow-y-auto overflow-x-hidden flex flex-col items-center gap-y-5">
        <div className="Crop-Controls w-[90%] flex flex-row gap-x-5 flex-wrap justify-center items-center">
          <div className="w-full h-fit flex flex-col gap-y-3">
            <label htmlFor="scale-input" className="text-lg font-medium">
              Zoom
            </label>
            <NumberInput
              id="scale-input"
              type="number"
              step={0.1}
              value={scale}
              disabled={!img}
              className="text-lg font-bold"
              onValueChange={(e) => setScale(Number(e))}
              aria-label="Scale input"
            />
          </div>
          <div className="w-full h-fit flex flex-col gap-y-3">
            <label htmlFor="rotate-input" className="text-lg font-medium">
              Rotate{" "}
            </label>
            <NumberInput
              id="rotate-input"
              type="number"
              value={rotate}
              className="text-lg font-bold"
              aria-label="Rotate input"
              disabled={!img}
              onValueChange={(e) =>
                setRotate(Math.min(180, Math.max(-180, Number(e))))
              }
            />
          </div>
          {aspect && (
            <div className="w-full h-fit flex flex-col gap-y-3">
              <label htmlFor="rotate-input" className="text-lg font-medium">
                Aspect Ratio{" "}
              </label>
              <AsyncSelection
                type="normal"
                data={() =>
                  apsectratio.map((item) => ({
                    ...item,
                    value: `${item.value}`,
                  }))
                }
                option={{
                  name: "aspect",
                  onChange: handleAspectRatio,
                  selectedValue: [`${aspect}`],
                  "aria-label": "Aspect Ratio Selection",
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-row gap-x-3 w-[90%]">
          <PrimaryButton
            text={aspect ? "Custom Aspect Ratio" : "Select Aspect Ratio"}
            type="button"
            width="50%"
            radius="10px"
            height="50px"
            onClick={handleToggleAspectClick}
          />

          <PrimaryButton
            text="Reset Transforms"
            type="button"
            width="50%"
            radius="10px"
            height="50px"
            onClick={resetTransforms}
          />
        </div>

        {/* Gesture instructions */}
        <div className="w-[90%] bg-blue-50 p-3 rounded-lg text-sm">
          <p className="font-medium">Gesture Controls:</p>
          <ul className="list-disc ml-5">
            <li>Touch: Pinch with two fingers to zoom in/out</li>
            <li>Touch: Rotate with two fingers to adjust rotation</li>
            <li>Mouse: Ctrl + Mouse wheel to zoom in/out</li>
            <li>Mouse: Shift + Mouse wheel to rotate</li>
          </ul>
        </div>

        <div
          ref={imgContainerRef}
          className="touch-none select-none"
          style={{ touchAction: "none" }}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minHeight={100}
          >
            <Image
              ref={imgRef}
              alt="Cropping Image"
              src={img}
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
              onLoad={onImageLoad}
              width={1000}
              height={1000}
              draggable={false}
            />
          </ReactCrop>
        </div>

        <h3 className="text-xl font-medium">Preview Image </h3>
        {!!completedCrop && (
          <>
            <div>
              <canvas
                ref={previewCanvasRef}
                style={{
                  border: "1px solid black",
                  objectFit: "contain",
                  width: completedCrop.width,
                  height: completedCrop.height,
                }}
              />
            </div>
          </>
        )}
      </div>
    </SecondaryModal>
  );
}
