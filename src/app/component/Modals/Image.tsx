import {
  ApiRequest,
  Delayloading,
  useScreenSize,
} from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { productcoverstype } from "@/src/types/product.type";
import { ChangeEvent, useRef, useState, useCallback, useEffect } from "react";
import {
  ContainerLoading,
  errorToast,
  infoToast,
  successToast,
} from "../Loading";
import { InputFileUpload } from "../Button";
import CropImage from "../Cropimage";
import { upload } from "@vercel/blob/client";
import { type PutBlobResult } from "@vercel/blob";
import { SecondaryModal } from "../Modals";
import Image from "next/image";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/webp",
  "image/png",
  "image/svg+xml",
  "image/gif",
];

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
  return file.map((obj) => URL.createObjectURL(obj));
};

// Generate unique filename with timestamp and random string
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.substring(originalName.lastIndexOf("."));
  const nameWithoutExt = originalName.substring(
    0,
    originalName.lastIndexOf("."),
  );
  return `${nameWithoutExt}_${timestamp}_${randomStr}${extension}`;
};

// Verify URL is accessible with retry logic
const verifyBlobUrl = async (url: string): Promise<boolean> => {
  const response = await ApiRequest(
    url,
    undefined,
    "HEAD",
    undefined,
    undefined,
    undefined,
    3,
  );
  if (response.success) {
    return true;
  }

  return false;
};

const uploadToVercel = async (
  file: File,
  uniqueFileName: string,
  onProgress?: (percentage: number) => void,
): Promise<{
  success: boolean;
  data?: PutBlobResult;
  error?: string;
}> => {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `${file.name} exceeds 10MB limit`,
      };
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `${file.name} has invalid file type`,
      };
    }

    const Blob = await upload(uniqueFileName, file, {
      access: "public",
      handleUploadUrl: "/api/products/cover",
      onUploadProgress: ({ percentage }) => {
        onProgress?.(percentage);
      },
    });

    return { success: true, data: Blob };
  } catch (error) {
    console.log("Upload Image Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
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
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const { isMobile } = useScreenSize();
  const [imageDimensions, setImageDimensions] = useState<{
    [key: number]: { width: number; height: number; ratio: number };
  }>({});

  //Initialize
  useEffect(() => {
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
  }, []);

  //Change Event
  const handleFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files;

    if (selectedFile) {
      const filesArray = Array.from(selectedFile);

      // Check file limit
      if (Imgurl.length + filesArray.length > props.limit) {
        errorToast(`Can Upload ${props.limit} Images Only`);
        return;
      }

      // Validate file size
      const oversizedFiles = filesArray.filter(
        (file) => file.size > MAX_FILE_SIZE,
      );
      if (oversizedFiles.length > 0) {
        errorToast(
          `${oversizedFiles.length} file(s) exceed 10MB limit: ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}`,
        );
        return;
      }

      // Filter by file type
      const filteredFile = filesArray.filter((file) =>
        ALLOWED_FILE_TYPES.includes(file.type),
      );

      // Alert if some files were filtered out
      if (filteredFile.length < filesArray.length) {
        infoToast(
          `${
            filesArray.length - filteredFile.length
          } file(s) skipped (invalid type)`,
        );
      }
      const filteredFileUrl = filetourl(filteredFile);
      const updateUrl = [
        ...Imgurl,
        ...filteredFileUrl.map((obj, index) => ({
          url: obj,
          name: generateUniqueFileName(filteredFile[index].name),
          type: filteredFile[index].type,
        })),
      ];

      if (filteredFileUrl.length > 0) {
        if (Imgurltemp.length > 0 && Imgurltemp.every((i) => i.isSave)) {
          const asyncdeleteimage = async () => {
            const deleteImage = await ApiRequest(
              "/api/products/cover",
              undefined,
              "DELETE",
              "JSON",
              { covers: Imgurltemp, type: props.type },
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
  }, []);

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
    [Imgurl, Files],
  );

  //Update Product when saved
  const handleUpdateCover = async (
    data: productcoverstype[],
    type: "product" | "banner",
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
      setUploadProgress({});

      if (Files.length === 0) {
        errorToast("Please Upload Image");
        return;
      }

      //Upload Multiple Files in Parallel with unique names
      const uploadPromises = Files.map((file, index) => {
        const uniqueFileName = generateUniqueFileName(file.name);
        return uploadToVercel(file, uniqueFileName, (percentage) => {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: percentage,
          }));
        });
      });

      const results = await Promise.allSettled(uploadPromises);

      // Process results
      const uploadImages: PutBlobResult[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (
          result.status === "fulfilled" &&
          result.value.success &&
          result.value.data
        ) {
          uploadImages.push(result.value.data);
        } else if (result.status === "fulfilled" && !result.value.success) {
          errors.push(
            result.value.error || `Failed to upload ${Files[index].name}`,
          );
        } else if (result.status === "rejected") {
          errors.push(`Upload rejected: ${Files[index].name}`);
        }
      });

      // Handle errors
      if (errors.length > 0) {
        console.log("Upload errors:", errors);
        if (uploadImages.length === 0) {
          errorToast("All uploads failed");
          return;
        } else {
          infoToast(
            `${errors.length} upload(s) failed, ${uploadImages.length} succeeded`,
          );
        }
      }

      const savedUrl: productcoverstype[] = uploadImages.map((i) => ({
        type: i.contentType,
        name: i.pathname,
        url: i.url,
      }));

      // Verify all URLs are accessible before proceeding
      infoToast("Verifying uploaded images...");
      const verificationResults = await Promise.all(
        savedUrl.map(async (urlObj) => {
          const isAccessible = await verifyBlobUrl(urlObj.url);
          return { url: urlObj.url, isAccessible };
        }),
      );

      const failedUrls = verificationResults.filter((r) => !r.isAccessible);
      if (failedUrls.length > 0) {
        console.log("Failed to verify URLs:", failedUrls);
        errorToast(
          `${failedUrls.length} image(s) uploaded but not yet accessible. Please try again.`,
        );
        return;
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
      console.log("handleSave", error);
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

  // Calculate image aspect ratio and return appropriate class
  const getImageContainerClass = (index: number) => {
    const dim = imageDimensions[index];
    if (!dim) return "aspect-square";

    const ratio = dim.ratio;

    // Portrait (taller than wide)
    if (ratio < 0.8) return "aspect-3/4";
    // Square-ish
    if (ratio >= 0.8 && ratio <= 1.2) return "aspect-square";
    // Landscape (wider than tall)
    if (ratio > 1.2 && ratio < 1.8) return "aspect-4/3";
    // Wide landscape
    if (ratio >= 1.8) return "aspect-video";

    return "aspect-square";
  };

  // Handle image load to get dimensions
  const handleImageLoad = useCallback((index: number, event: any) => {
    const img = event.target;
    setImageDimensions((prev) => ({
      ...prev,
      [index]: {
        width: img.naturalWidth,
        height: img.naturalHeight,
        ratio: img.naturalWidth / img.naturalHeight,
      },
    }));
  }, []);
  return (
    <SecondaryModal
      onPageChange={() => handleCancel()}
      closebtn
      open={openmodal.imageupload}
      size="full"
    >
      <div
        className={`w-full h-full flex ${
          isMobile ? "items-start pt-8" : "items-center"
        } justify-center bg-linear-to-br from-gray-50 to-white p-6`}
      >
        {loading && <ContainerLoading />}
        <div
          className="uploadImage__container w-[85%] 
      max-smallest_screen1:w-[97%] max-smallest_screen1:flex-col max-smallest_screen1:gap-y-6
      max-h-175 flex flex-row justify-start items-start gap-x-6 bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-200/50"
        >
          <div
            className="previewImage__container w-[55%] border-2 border-gray-300 rounded-2xl p-5 bg-linear-to-br from-gray-50/50 to-white
        max-smallest_screen1:w-[97%]
        min-h-112.5 max-h-162.5 overflow-y-auto shadow-inner"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
              {Imgurl.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center min-h-100 gap-4">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-gray-400"
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
                  </div>
                  <h3 className="text-xl font-bold text-gray-600">
                    No Images Uploaded
                  </h3>
                  <p className="text-sm text-gray-500">
                    Upload images to get started
                  </p>
                </div>
              ) : (
                Imgurl.map((file, index) => {
                  const dim = imageDimensions[index];
                  const isLandscape = dim && dim.ratio > 1.5;
                  const isPortrait = dim && dim.ratio < 0.7;

                  return (
                    <div
                      key={index}
                      className={`image_container relative group rounded-xl overflow-hidden bg-white border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                        isLandscape ? "sm:col-span-2" : ""
                      }`}
                      onClick={() => handleselectImg(index)}
                    >
                      <div
                        className={`relative w-full ${getImageContainerClass(
                          index,
                        )} bg-gray-100`}
                      >
                        (
                        <Image
                          src={file.url}
                          className="transition-all duration-300 group-hover:scale-105"
                          style={{
                            objectFit: "cover",
                          }}
                          fill
                          quality={80}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          alt={`Preview of Image ${file.name}`}
                          onLoad={(e) => handleImageLoad(index, e)}
                        />
                        )
                      </div>

                      {/* Overlay with image info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black  p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs font-semibold truncate">
                          {file.name}
                        </p>
                        {dim && (
                          <p className="text-white text-xs mt-1">
                            {dim.width} × {dim.height}px
                            {dim.ratio > 1.5 && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                                Wide
                              </span>
                            )}
                            {dim.ratio < 0.7 && (
                              <span className="ml-2 px-2 py-0.5 bg-purple-500 rounded-full text-xs">
                                Tall
                              </span>
                            )}
                            {dim.ratio >= 0.9 && dim.ratio <= 1.1 && (
                              <span className="ml-2 px-2 py-0.5 bg-green-500 rounded-full text-xs">
                                Square
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-50 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">
                          <svg
                            className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                          <span className="text-white font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] text-lg">
                            Edit
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(index);
                        }}
                        className="absolute right-2 top-2 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center transition-all duration-300 hover:bg-red-600 active:scale-90 shadow-lg opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Delete image"
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
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="action__container w-[42%] max-smallest_screen:w-full flex flex-col items-stretch gap-y-6 h-fit bg-linear-to-br from-blue-50/30 to-purple-50/30 p-6 rounded-2xl border-2 border-gray-200">
            {/* Upload Progress Indicator */}
            {loading && Object.keys(uploadProgress).length > 0 && (
              <div className="w-full bg-white rounded-lg p-4 border-2 border-blue-200 shadow-md">
                <h4 className="text-sm font-bold text-gray-700 mb-3">
                  Upload Progress
                </h4>
                <div className="space-y-2 max-h-37.5 overflow-y-auto">
                  {Object.entries(uploadProgress).map(
                    ([fileName, progress]) => (
                      <div key={fileName} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 truncate max-w-50">
                            {fileName}
                          </span>
                          <span className="text-blue-600 font-semibold">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-linear-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-extrabold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Upload Images
              </h3>
              <p className="text-sm text-gray-600">
                Upload up to {props.limit} images (max 10MB each)
              </p>
              <p className="text-xs text-gray-500">
                Supported: JPEG, PNG, WebP, SVG, GIF
              </p>
            </div>
            <InputFileUpload
              ref={fileInputRef}
              onChange={handleFile}
              multiple={props.mutitlple}
            />
            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => handleSave()}
                disabled={!isEdit}
                type="button"
                className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg ${
                  !isEdit
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-linear-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl hover:scale-105 active:scale-95"
                }`}
              >
                Save Images
              </button>
              <button
                onClick={() => handleReset()}
                disabled={Imgurltemp.length === 0}
                type="button"
                className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg ${
                  Imgurltemp.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-linear-to-r from-orange-500 to-red-500 text-white hover:shadow-xl hover:scale-105 active:scale-95"
                }`}
              >
                Reset Changes
              </button>
            </div>
            {Imgurl.length > 0 && (
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
                    {Imgurl.length} / {props.limit} images uploaded
                  </p>
                </div>
              </div>
            )}
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
            type={props.type}
            bannerSubtype={props.bannertype}
          />
        )}
      </div>
    </SecondaryModal>
  );
};
