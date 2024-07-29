import React, {
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  ChangeEvent,
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
import PrimaryButton, { Selection } from "./Button";
import Modal from "./Modals";
import { errorToast } from "./Loading";
import { Imgurl } from "./Modals/Image";

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
}: {
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

  const apsectratio = [
    {
      label: `16:10 ${type === "createbanner" ? "(Recommend)" : ""}`,
      value: 16 / 10,
    },
    {
      label: `16:9 ${type === "createbanner" ? "(Recommend)" : ""}`,
      value: 16 / 9,
    },
    {
      label: `4:5 ${type === "createproduct" ? "(Recommend)" : ""}`,
      value: 4 / 5,
    },
    {
      label: `3:4 ${type === "createproduct" ? "(Recommend)" : ""}`,
      value: 3 / 4,
    },
    {
      label: "1:1",
      value: 1,
    },
  ];

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

  function handleToggleAspectClick() {
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
  }

  const handleSaveCrop = async () => {
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
  };
  const handleAspectRatio = (e: ChangeEvent<HTMLSelectElement>) => {
    const ratio = parseFloat(e.target.value);
    setAspect(ratio);

    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, ratio);
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    }
  };
  return (
    <Modal closestate="none" customheight="100vh" customwidth="100vw">
      <div className="cropimageContainer w-full h-full bg-white overflow-y-auto overflow-x-hidden flex flex-col items-center gap-y-5">
        <div className="Crop-Controls w-[90%] flex flex-row gap-x-5 justify-center items-center">
          <div className="w-full h-fit flex flex-col gap-y-3">
            <label htmlFor="scale-input" className="text-lg font-medium">
              Zoom{" "}
            </label>
            <input
              id="scale-input"
              type="number"
              step="0.1"
              value={scale}
              disabled={!img}
              className="text-lg w-full h-[50px] outline-1 outline outline-gray-300 rounded-lg pl-2"
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </div>
          <div className="w-full h-fit flex flex-col gap-y-3">
            <label htmlFor="rotate-input" className="text-lg font-medium">
              Rotate{" "}
            </label>
            <input
              id="rotate-input"
              type="number"
              value={rotate}
              className="text-lg w-full h-[50px] outline-1 outline outline-gray-300 pl-2 rounded-lg"
              disabled={!img}
              onChange={(e) =>
                setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
              }
            />
          </div>
          {aspect && (
            <div className="w-full h-fit flex flex-col gap-y-3">
              <label htmlFor="rotate-input" className="text-lg font-medium">
                Aspect Ratio{" "}
              </label>
              <Selection
                name="aspect"
                value={aspect}
                style={{ height: "50px" }}
                data={apsectratio}
                onChange={(e) => handleAspectRatio(e)}
              />
            </div>
          )}
        </div>
        <PrimaryButton
          text={aspect ? "Custom Aspect Ratio" : "Select Aspect Ratio"}
          type="button"
          width="90%"
          radius="10px"
          height="50px"
          onClick={handleToggleAspectClick}
        />

        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
          // minWidth={400}
          minHeight={100}
          // circularCrop
        >
          <img
            ref={imgRef}
            alt="Croping Image"
            src={img}
            style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
            onLoad={onImageLoad}
          />
        </ReactCrop>

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
        <div className="flex flex-row gap-x-5 w-[90%] h-fit">
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
      </div>
    </Modal>
  );
}
