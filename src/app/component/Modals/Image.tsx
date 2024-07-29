import { ApiRequest, useEffectOnce } from "@/src/context/CustomHook";
import {
  BannerState,
  productcoverstype,
  SpecificAccess,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, useRef, useState } from "react";
import { errorToast, infoToast, successToast } from "../Loading";
import Image from "next/image";
import CloseIcon from "../../../../public/Image/Close.svg";
import PrimaryButton, { InputFileUpload } from "../Button";
import CropImage from "../Cropimage";

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
}

const filetourl = (file: File[]) => {
  let url = [""];
  file.map((obj) => url.push(URL.createObjectURL(obj)));
  return url.filter((i) => i !== "");
};
export const ImageUpload = (props: imageuploadprops) => {
  const {
    product,
    setproduct,
    banner,
    setbanner,
    openmodal,
    setopenmodal,
    isLoading,
    setisLoading,
    globalindex,
    setreloaddata,
  } = useGlobalContext();

  const [Imgurl, seturl] = useState<Imgurl[]>([]);
  const [Imgurltemp, seturltemp] = useState<Imgurl[]>([]);
  const [Files, setfiles] = useState<File[]>([]);
  const [Tempfiles, settempfiles] = useState<File[]>([]);
  const [crop, setcrop] = useState(false);
  const [selectedImg, setselected] = useState(-1);
  const [isEdit, setisEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const allowedFileType =
        props.type === "createbanner"
          ? ["image/jpeg", "image/png"]
          : ["image/jpeg", "image/png", "image/svg+xml"];
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
          const deleteImage = await ApiRequest(
            "/api/products/cover",
            setisLoading,
            "DELETE",
            "JSON",
            { covers: Imgurltemp, type: props.type }
          );
          if (!deleteImage.success) {
            errorToast("Error Occured");
            return;
          }
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
    data: productcoverstype[] | Pick<BannerState, "image">,
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
            image: data,
          });

    if (!update.success) {
      return null;
    }
    setreloaddata(true);
    return true;
  };

  //Saved to storage
  const handleSave = async () => {
    const URL = "/api/products/cover";
    try {
      const filedata = new FormData();

      if (Files.length === 0) {
        errorToast("Please Upload Image");
        return;
      }

      Files.forEach((i, idx) => {
        filedata.append(`${idx}`, i);
      });

      const uploadImg = await ApiRequest(
        URL,
        setisLoading,
        "POST",
        "FILE",
        filedata
      );
      if (!uploadImg.success) {
        errorToast("Failed To Save");
        return;
      }
      //Delete Images

      if (Imgurltemp.length > 0) {
        const deleteImage = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          { covers: Imgurltemp, type: props.type }
        );
        if (!deleteImage.success) {
          errorToast("Error Occured");
          return;
        }
      }

      const updateUrl = [...Imgurl];
      const isSaved = updateUrl.some((i) => i.isSave);
      const savedFile = [...updateUrl, ...uploadImg.data];
      const savedUrl = !isSaved
        ? uploadImg.data
        : savedFile.filter((i: Imgurl) => i.isSave);

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
          const update = await handleUpdateCover(savedUrl[0], "banner");
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
      setreloaddata(true);

      setopenmodal({
        ...openmodal,
        confirmmodal: { ...openmodal.confirmmodal, confirm: true },
      });
      successToast("Image Saved");
    } catch (error) {
      console.error("handleSave", error);
      errorToast("Failed To Save");
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
    if (Imgurl[idx].isSave) {
      infoToast("To edit this image please delete and upload again");
      return;
    }
    setselected(idx);

    setcrop(true);
  };
  return (
    <dialog
      open={openmodal.imageupload}
      className="Uploadimagemodal fixed w-screen h-screen flex flex-col items-center justify-center top-0 left-0 z-[120] bg-white"
    >
      <Image
        src={CloseIcon}
        alt="close"
        onClick={() => handleCancel()}
        hidden={SpecificAccess(isLoading)}
        className="w-[50px] h-[50px] absolute top-5 right-10 object-contain transition hover:-translate-y-2 active:-translate-y-2"
      />
      <div className="uploadImage__container w-[80%] max-h-[600px] flex flex-row justify-start items-center gap-x-5">
        <div className="previewImage__container w-[50%] border-[1px] border-black grid grid-cols-2 gap-x-5 gap-y-5 p-3  min-h-[400px] max-h-[600px] overflow-y-auto">
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
        <div className="action__container w-1/2 flex flex-col items-center gap-y-5 h-fit">
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
            status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
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
          setclose={setcrop}
          imgurl={Imgurl}
          ratio={16 / 10}
          Files={Files}
          setfile={setfiles}
          setimgurl={seturl}
          type={props.bannertype ? "createproduct" : props.type}
        />
      )}
    </dialog>
  );
};
