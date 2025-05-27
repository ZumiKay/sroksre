import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ContainerLoading, errorToast, successToast } from "../Loading";
import Image from "next/image";
import PrimaryButton, { UploadInput } from "../Button";
import CropImage from "../Cropimage";
import { upload } from "@vercel/blob/client";
import { type PutBlobResult } from "@vercel/blob";
import { SecondaryModal } from "../Modals";
import { ImageDatatype } from "@/src/context/GlobalType.type";
import { v4 as uuidv4 } from "uuid";
import { handleLocalstorage } from "@/src/lib/utilities";

interface imageuploadprops {
  limit: number;
  mutitlple: boolean;
  type: "createproduct" | "createbanner" | "createpromotion";
  bannertype?: string;
  setreloaddata?: Dispatch<SetStateAction<boolean>>;
}

const filetourl = (file: File[]) => {
  const url = [""];
  file.map((obj) => url.push(URL.createObjectURL(obj)));
  return url.filter((i) => i !== "");
};

const urlToFile = async (
  url: string,
  filename: string,
  mimeType: string
): Promise<File> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    console.error("Error converting URL to File:", error);
    throw new Error("Failed to convert URL to File");
  }
};

// Helper function to convert multiple URLs to Files
const urlsToFiles = async (images: ImageDatatype[]): Promise<File[]> => {
  try {
    const filePromises = images.map((img) =>
      urlToFile(img.url, img.name || "image.jpg", img.type || "image/jpeg")
    );
    return await Promise.all(filePromises);
  } catch (error) {
    console.error("Error converting URLs to Files:", error);
    return [];
  }
};

const generateUniqueFileName = (file: File) => {
  const fileExtension = file.name.split(".").pop() || "";
  return `${Date.now()}-${uuidv4().substring(0, 8)}.${fileExtension}`;
};

const uploadToVercel = async (
  file: File
): Promise<{
  success: boolean;
  data?: PutBlobResult;
}> => {
  try {
    const uniqueFileName = generateUniqueFileName(file);
    const Blob = await upload(uniqueFileName, file, {
      access: "public",
      handleUploadUrl: "/api/products/cover",
    });

    return { success: true, data: Blob };
  } catch (error) {
    console.log("Upload Image", error);
    return { success: false };
  }
};

const deleteTempImage = async () => {
  const ids = localStorage.getItem("tempimageids")
    ? (JSON.parse(localStorage.getItem("tempimageids") as never) as number[])
    : [];

  if (ids.length === 0) {
    return true;
  }

  await ApiRequest({
    url: "/api/image/temp",
    method: "DELETE",
    data: {
      ids,
      type: "temp",
    },
  });

  return true;
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
  const [Imgurl, seturl] = useState<ImageDatatype[]>([]);
  const [Imgurltemp, seturltemp] = useState<ImageDatatype[]>([]);
  const [Files, setfiles] = useState<File[]>([]);
  const [Tempfiles, settempfiles] = useState<File[]>([]);
  const [crop, setcrop] = useState(false);
  const [selectedImg, setselected] = useState(-1);
  const [isEdit, setisEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setloading] = useState(false);
  const { isMobile } = useScreenSize();

  //Initialize
  useEffect(() => {
    //Initialize Img URL
    const initializeImages = async () => {
      await deleteTempImage();

      let initialImages: ImageDatatype[] = [];

      if (product.covers.length > 0) {
        initialImages = product.covers.map((img) => ({ ...img, isSave: true }));
      } else if (banner.Image?.url) {
        initialImages = [banner.Image];
      }

      seturl(initialImages);

      // Initialize files array with placeholders
      setfiles(Array(initialImages.length).fill(null));

      // Convert URLs to Files for existing images
      if (initialImages.length > 0) {
        urlsToFiles(initialImages).then((convertedFiles) => {
          setfiles((prevFiles) => {
            const newFiles = [...prevFiles];
            convertedFiles.forEach((file, index) => {
              if (file) newFiles[index] = file;
            });
            return newFiles;
          });
        });
      }
    };
    initializeImages();
  }, []);

  //Change Event
  const handleFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
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

        seturl(updateUrl);
        setfiles((prev) => [...prev, ...filteredFile]);
        setisEdit(true);
      }
    },
    [Imgurl, props.limit]
  );

  //Delete Image
  const handleDelete = useCallback(
    (index: number) => {
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
    },
    [Files, Imgurl]
  );

  //Update Product when saved
  const handleUpdateCover = useCallback(
    async (data: ImageDatatype[], type: "product" | "banner") => {
      const update =
        type === "product"
          ? await ApiRequest({
              url: "/api/products/crud",
              method: "PUT",
              data: {
                ...product,
                covers: data,
              },
            })
          : await ApiRequest({
              url: "/api/banner",
              method: "PUT",
              data: {
                id: banner.id,
                edittype: "cover",
                Image: data[0],
              },
            });

      if (!update.success) {
        return null;
      }
      if (props.setreloaddata) props.setreloaddata(true);
      return true;
    },
    [banner.id, product, props]
  );

  //Saved to storage
  const handleSave = useCallback(async () => {
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
        if (uploadImage.data) uploadImages.push(uploadImage.data);
      }

      let savedUrl: ImageDatatype[] = uploadImages.map((i) => ({
        type: i.contentType,
        name: i.pathname,
        url: i.url,
        isSave: true,
      }));

      if (savedUrl.length > 0) {
        ///save image to db
        const saveReq = await ApiRequest({
          url: "/api/image",
          method: "POST",
          data: savedUrl,
        });
        if (!saveReq.success) {
          throw new Error("Can't Save");
        }

        handleLocalstorage(savedUrl.map((i) => i.id) as number[]);

        const savedData = saveReq.data as ImageDatatype[];
        savedUrl = savedData;
      }

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
        setbanner({ ...banner, Image: savedUrl[0] });
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
        confirmmodal: {
          ...(openmodal.confirmmodal ?? {}),
          confirm: true,
        } as never,
      });
      successToast("Image Saved");
    } catch (error) {
      console.error("handleSave", error);
      errorToast("Failed To Save");
    } finally {
      setloading(false);
      if (props.setreloaddata) props.setreloaddata(true);
    }
  }, [
    Files,
    banner,
    globalindex.bannereditindex,
    globalindex.producteditindex,
    handleUpdateCover,
    openmodal,
    product,
    props,
    setbanner,
    setopenmodal,
    setproduct,
  ]);
  const handleCancel = useCallback(() => {
    seturl([]);
    seturltemp([]);
    setopenmodal({ ...openmodal, imageupload: false });
  }, [openmodal, setopenmodal]);
  const handleReset = useCallback(() => {
    seturl((prev) => (prev.length === 4 ? [] : [...prev, ...Imgurltemp]));
    setfiles((prev) => (prev.length === 4 ? [] : [...prev, ...Tempfiles]));
    seturltemp([]);
    settempfiles([]);
  }, [Imgurltemp, Tempfiles]);

  const handleselectImg = useCallback((idx: number) => {
    // if (Imgurl[idx].id) {
    //   infoToast("To edit this image please delete and upload again");
    //   return;
    // }
    setselected(idx);
    setcrop(true);
  }, []);
  return (
    <SecondaryModal
      onPageChange={() => handleCancel()}
      closebtn
      open={openmodal.imageupload ?? false}
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
            <UploadInput
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
          />
        )}
      </div>
    </SecondaryModal>
  );
};
