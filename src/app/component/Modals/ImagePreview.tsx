import { ImageDatatype, InventoryPage } from "@/src/context/GlobalType.type";
import { SecondaryModal } from "../Modals";
import { useCallback, useEffect, useState } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import Image from "next/image";
import { Button } from "@heroui/react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ContainerLoading } from "../Loading";

type ImagePreviewProps = {
  open: boolean;
  data: {
    id: number;
    ty: InventoryPage;
    image?: ImageDatatype;
  };
};

const ImagePreview = ({ open, data }: ImagePreviewProps) => {
  const [imagedata, setImagedata] = useState<ImageDatatype[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setloading] = useState(false);
  const { setopenmodal } = useGlobalContext();

  useEffect(() => {
    const fetchImageData = async (id: number) => {
      setloading(true);
      const response = await ApiRequest({
        url: `/api/products/cover?pid=${id}`,
        method: "GET",
        revalidate: "productcoverimage",
      });
      setloading(false);
      if (response.success) {
        setImagedata(response.data);
      }
    };
    setImagedata(null); // Reset state on data change
    if (data.ty === "product" && data.id) {
      fetchImageData(data.id);
    } else if (data.image) {
      setImagedata([data.image]);
    }
  }, [data]);

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (!imagedata) return;
      const newIdx =
        direction === "prev"
          ? Math.max(currentIdx - 1, 0)
          : Math.min(currentIdx + 1, imagedata.length - 1);
      setCurrentIdx(newIdx);
    },
    [currentIdx, imagedata]
  );

  if (!imagedata) return null; // Early return if no data

  return (
    <SecondaryModal size="md" open={open} onPageChange={() => setopenmodal({})}>
      {loading && <ContainerLoading />}
      <div className="image_container flex w-full min-h-[400px] flex-col items-center gap-y-3 bg-white">
        <div className="preview h-[400px] w-full">
          <Image
            width={500}
            height={500}
            quality={100}
            alt={imagedata[currentIdx].name ?? "image"}
            src={imagedata[currentIdx].url}
            loading="eager"
            className="h-full w-full object-contain"
          />
        </div>
        {imagedata.length > 1 && (
          <div className="imageList flex h-[40px] w-full items-center justify-between gap-x-5 overflow-y-hidden overflow-x-auto p-2">
            <Button
              onPress={() => handleNavigate("prev")}
              className="w-[50px] font-bold bg_default text-white"
              disabled={currentIdx === 0}
            >
              Prev
            </Button>
            <div className="flex gap-x-2">
              {imagedata.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  style={currentIdx === idx ? { backgroundColor: "black" } : {}}
                  className={`navDot h-5 w-5 cursor-pointer rounded-full bg-gray-300 transition-colors hover:bg-black ${
                    currentIdx === idx ? "bg-black" : ""
                  }`}
                />
              ))}
            </div>
            <Button
              onPress={() => handleNavigate("next")}
              color="warning"
              className="w-[50px] font-bold text-white bg_default"
              disabled={currentIdx === imagedata.length - 1}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </SecondaryModal>
  );
};

export default ImagePreview;
