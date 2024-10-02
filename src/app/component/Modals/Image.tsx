import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
  useScreenSize,
} from "@/src/context/CustomHook";
import {
  productcoverstype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, useRef, useState } from "react";
import {
  ContainerLoading,
  errorToast,
  infoToast,
  successToast,
} from "../Loading";
import Image from "next/image";
import CloseIcon from "../../../../public/Image/Close.svg";
import PrimaryButton, { InputFileUpload } from "../Button";
import CropImage from "../Cropimage";
import { upload } from "@vercel/blob/client";
import { type PutBlobResult } from "@vercel/blob";
import { SecondaryModal } from "../Modals";

export type Imgurl = {
  url: string;
  type: string;
  name: string;
  isSave?: boolean;
  id?: number;
};
interface imageuploadprops {
  limit: number;
  mutitlple: boolean;
  type: "createproduct" | "createbanner" | "createpromotion";
  bannertype?: string;
  setreloaddata?: React.Dispatch<React.SetStateAction<boolean>>;
}

const filetourl = (file: File[]) => {
  let url = [""];
  file.map((obj) => url.push(URL.createObjectURL(obj)));
  return url.filter((i) => i !== "");
};

const uploadToVercel = async (
  file: File
): Promise<{
  success: boolean;
  data?: PutBlobResult;
}> => {
  try {
    const Blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/products/cover",
    });

    return { success: true, data: Blob };
  } catch (error) {
    console.log("Upload Image", error);
    return { success: false };
  }
};
export const ImageUpload = (props: imageuploadprops) => {
  const {
    product,
    setproduct,
    banner,
    setbanner,
    openmodal,
    setopenmodal,
    globalindex,
  } = useGlobalContext();
  const [Imgurl, seturl] = useState<Imgurl[]>([]);
  const [Imgurltemp, seturltemp] = useState<Imgurl[]>([]);
  const [Files, setfiles] = useState<File[]>([]);
  const [Tempfiles, settempfiles] = useState<File[]>([]);
  const [crop, setcrop] = useState(false);
  const [selectedImg, setselected] = useState(-1);
  const [isEdit, setisEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setloading] = useState(false);
  const { isMobile } = useScreenSize();

  //Initialize
  useEffectOnce(() => {
    //Initialize Img URL
    const updatedImages =
      product.covers.length > 0
        ? product.covers.map((i) => ({ ...i, isSave: true }))
        : banner.image?.url.length > 0
        ? [banner.image]
        : [];

    seturl([...updatedImages]);
    //Initailize File
    setfiles((prevFiles) => {
      const newLength = updatedImages.length;

      const newFiles = Array(newLength).fill(null);

      newFiles.splice(0, prevFiles.length, ...prevFiles);

      return newFiles;
    });
  });

  //Change Event
  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files;
    const updateUrl = [...Imgurl];

    if (selectedFile) {
      const filesArray = Array.from(selectedFile);
      const allowedFileType = [
        "image/jpeg",
        "image/webp",
        "image/png",
        "image/svg+xml",
        "image/gif",
      ];
      if (Imgurl.length + filesArray.length > props.limit) {
        errorToast(`Can Upload ${props.limit} Images Only`);
        return;
      }
      const filteredFile = filesArray.filter((file) =>
        allowedFileType.includes(file.type)
      );
      const filteredFileUrl = filetourl(filteredFile);
      filteredFileUrl.map((obj, index) =>
        updateUrl.push({
          url: obj,
          name: filteredFile[index].name,
          type: filteredFile[index].type,
        })
      );

      if (filteredFileUrl.length > 0) {
        if (Imgurltemp.length > 0 && Imgurltemp.every((i) => i.isSave)) {
          const asyncdeleteimage = async () => {
            const deleteImage = await ApiRequest(
              "/api/products/cover",
              undefined,
              "DELETE",
              "JSON",
              { covers: Imgurltemp, type: props.type }
            );
            if (!deleteImage.success) {
              errorToast("Error Occured");
              return;
            }
          };
          await Delayloading(asyncdeleteimage, setloading, 1000);
        }
        seturltemp([]);
      }

      seturl(updateUrl);
      setfiles((prev) => [...prev, ...filteredFile]);
      setisEdit(true);
    }
  };

  //Delete Image
  const handleDelete = (index: number) => {
    const updateUrl = [...Imgurl];
    const updatefile = [...Files];
    const temp = updateUrl[index];
    const tempfile = updatefile[index];

    updatefile.splice(index, 1);

    updateUrl.splice(index, 1);

    seturltemp((prev) => [...prev, temp]);
    settempfiles((prev) => [...prev, tempfile]);
    seturl(updateUrl);
    setisEdit(true);
    setfiles(updatefile);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //Update Product when saved
  const handleUpdateCover = async (
    data: productcoverstype[],
    type: "product" | "banner"
  ) => {
    const update =
      type === "product"
        ? await ApiRequest("/api/products/crud", undefined, "PUT", "JSON", {
            ...product,
            covers: data,
          })
        : await ApiRequest("/api/banner", undefined, "PUT", "JSON", {
            id: banner.id,
            edittype: "cover",
            image: data[0],
          });

    if (!update.success) {
      return null;
    }
    props.setreloaddata && props.setreloaddata(true);
    return true;
  };

  //Saved to storage
  const handleSave = async () => {
    try {
      setloading(true);

      if (Files.length === 0) {
        errorToast("Please Upload Image");
        return;
      }

      //Upload Multiple File
      const uploadImages: PutBlobResult[] = [];

      for (const image of Files) {
        const uploadImage = await uploadToVercel(image);

        if (!uploadImage.success) {
          errorToast("Failed To Upload Image");
          return;
        }
        uploadImage.data && uploadImages.push(uploadImage.data);
      }

      const savedUrl: productcoverstype[] = uploadImages.map((i) => ({
        type: i.contentType,
        name: i.pathname,
        url: i.url,
      }));

      if (props.type === "createproduct") {
        if (globalindex.producteditindex !== -1) {
          const update = await handleUpdateCover(savedUrl, "product");

          if (!update) {
            errorToast("Error Occured");
            return;
          }
        }
        setproduct({ ...product, covers: savedUrl });
      } else if (props.type === "createbanner") {
        if (globalindex.bannereditindex !== -1) {
          const update = await handleUpdateCover(savedUrl, "banner");
          if (!update) {
            errorToast("Error Occured");
            return;
          }
        }
        setbanner({ ...banner, image: savedUrl[0] });
      }

      seturltemp([]);
      seturl(savedUrl);
      setfiles((prevFiles) => {
        const newLength = savedUrl.length;

        const newFiles = Array(newLength).fill(null);

        newFiles.splice(0, prevFiles.length, ...prevFiles);

        return newFiles;
      });
      setisEdit(false);
      setopenmodal({
        ...openmodal,
        confirmmodal: { ...openmodal.confirmmodal, confirm: true },
      });
      successToast("Image Saved");
    } catch (error) {
      console.error("handleSave", error);
      errorToast("Failed To Save");
    } finally {
      setloading(false);
      props.setreloaddata && props.setreloaddata(true);
    }
  };
  const handleCancel = () => {
    seturl([]);
    seturltemp([]);
    setopenmodal({ ...openmodal, imageupload: false });
  };
  const handleReset = async () => {
    seturl((prev) => [...prev, ...Imgurltemp]);
    setfiles((prev) => [...prev, ...Tempfiles]);
    seturltemp([]);
    settempfiles([]);
  };

  const handleselectImg = (idx: number) => {
    if (Imgurl[idx].id) {
      infoToast("To edit this image please delete and upload again");
      return;
    }
    setselected(idx);

    setcrop(true);
  };
  return (
    <SecondaryModal
      onPageChange={() => handleCancel()}
      closebtn
      open={openmodal.imageupload}
      size="full"
    >
      <div
        className={`w-full h-full flex ${
          isMobile ? "items-start" : "items-center"
        } justify-center`}
      >
        {loading && <ContainerLoading />}
        <div
          className="uploadImage__container w-[80%] 
      max-smallest_screen1:w-[97%] max-smallest_screen1:flex-col max-smallest_screen1:gap-y-5
      max-h-[600px] flex flex-row justify-start items-center gap-x-5"
        >
          <div
            className="previewImage__container w-[50%] border-[1px] border-black grid grid-cols-2 gap-x-5 gap-y-5 p-3  
        max-smallest_screen1:w-[97%]
        min-h-[400px] max-h-[600px] overflow-y-auto"
          >
            {Imgurl.map((file, index) => (
              <div
                key={index}
                className="image_container relative transition duration-300 "
              >
                <Image
                  onClick={() => handleselectImg(index)}
                  src={file.url}
                  style={{
                    width: "400px",
                    height: "auto",
                    objectFit: "contain",
                  }}
                  className="transition-all duration-300 hover:p-3 active:p-3"
                  width={600}
                  height={600}
                  quality={80}
                  loading="lazy"
                  alt={`Preview of Image ${file.name}`}
                />

                <i
                  onClick={() => handleDelete(index)}
                  className="fa-solid fa-minus font-black p-[1px] h-fit absolute right-0 top-0  text-lg rounded-lg bg-red-500 text-white transition hover:bg-black "
                ></i>
              </div>
            ))}
          </div>
          <div className="action__container w-1/2 max-smallest_screen:w-full flex flex-col items-center gap-y-5 h-fit">
            <InputFileUpload
              ref={fileInputRef}
              onChange={handleFile}
              multiple={props.mutitlple}
            />
            <PrimaryButton
              onClick={() => handleSave()}
              type="button"
              text="Save"
              width="100%"
              height="50px"
              color="#44C3A0"
              radius="10px"
              disable={!isEdit}
            />
            <PrimaryButton
              onClick={() => handleReset()}
              type="button"
              text="Reset"
              width="100%"
              height="50px"
              radius="10px"
              disable={Imgurltemp.length === 0}
            />
          </div>
        </div>{" "}
        {crop && (
          <CropImage
            index={selectedImg}
            img={Imgurl[selectedImg].url}
            open={crop}
            setclose={setcrop}
            imgurl={Imgurl}
            ratio={16 / 10}
            Files={Files}
            setfile={setfiles}
            setimgurl={seturl}
            type={props.bannertype ? "createproduct" : props.type}
          />
        )}
      </div>
    </SecondaryModal>
  );
};
