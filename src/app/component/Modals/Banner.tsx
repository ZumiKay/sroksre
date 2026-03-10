"use client";
import {
  BannerInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, useCallback, useState, useMemo, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlag,
  faLayerGroup,
  faExpand,
  faBox,
  faLink,
  faFolderTree,
  faFolder,
  faFolderOpen,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import {
  getChildCategoryForBanner,
  getParentCategoryForBanner,
  getProductForBanner,
  getPromotionForBanner,
} from "../../severactions/actions";
import { ApiRequest, useEffectOnce } from "@/src/context/CustomHook";
import { errorToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import PrimaryButton, { Selection } from "../Button";
import { SelectAndSearchProduct } from "../Banner";
import { ImageUpload } from "./Image";
import { DeleteTempImage } from "../../dashboard/inventory/varaint_action";
import { Input } from "@heroui/react";
import { ImageWithLoader } from "../ImageWithLoader";
import { SelectType } from "@/src/types/productAction.type";

export const BannerType = [
  { label: "Normal", value: "normal" },
  { label: "Product", value: "product" },
  { label: "Category", value: "category" },
];
export const BannerSize = [
  { label: "Small", value: "small" },
  { label: "Normal", value: "normal" },
];

export const BannerModal = memo(function BannerModal({
  setreloaddata,
}: {
  setreloaddata?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    openmodal,
    setopenmodal,
    banner,
    setbanner,
    allData,
    setalldata,
    globalindex,
    setglobalindex,
  } = useGlobalContext();

  const [loading, setloading] = useState(false);

  const Linktype = useMemo(
    () => [
      {
        label: "Parent Category",
        value: "parent",
      },
      {
        label: "Sub Category",
        value: "sub",
      },
      {
        label: "Product",
        value: "product",
      },
    ],
    [],
  );

  const handleCancel = useCallback(async () => {
    //delete temp image

    setloading(true);
    const delreq = await DeleteTempImage();
    setloading(false);
    if (!delreq.success) {
      errorToast("Error occured");
      return;
    }

    setopenmodal({ ...openmodal, createBanner: false });
    setglobalindex({ ...globalindex, bannereditindex: -1 });
  }, [openmodal, globalindex, setopenmodal, setglobalindex]);

  const getSelectItems = useCallback(
    async (limit: number, value: string, type: string) => {
      const getreq = (
        type === "prod" ? getProductForBanner : getPromotionForBanner
      ).bind(null, limit, value);
      const request = await getreq();

      if (request.success) {
        return request;
      }
      return null;
    },
    [],
  );

  const getCategory = useCallback(
    async (type: "parent" | "child", value: string, pid: number) => {
      const getreq =
        type === "parent"
          ? getParentCategoryForBanner.bind(null, value)
          : getChildCategoryForBanner.bind(null, value, pid);
      const request = await getreq();
      if (request.success) {
        return request;
      }
      return null;
    },
    [],
  );

  useEffectOnce(() => {
    const fetchdata = async () => {
      setloading(true);
      const request = await ApiRequest(
        `/api/banner?ty=edit&p=${globalindex.bannereditindex}`,
        undefined,
        "GET",
      );
      setloading(false);

      if (request.success) {
        setbanner(request.data);
      } else {
        errorToast("Error Connection");
      }
    };
    globalindex.bannereditindex !== -1 && fetchdata();
  });

  const handleCreate = useCallback(async () => {
    const allbanner = [...(allData?.banner ?? [])];
    const URL = "/api/banner";

    if (banner.name === "") {
      errorToast("Name is required");
      return;
    }

    if (
      (banner.type === "product" && !banner.selectedproduct) ||
      (banner.type === "category" &&
        ((banner.linktype === "parent" && !banner.parentcate) ||
          (banner.linktype === "sub" && !banner.childcate)))
    ) {
      const errormess =
        banner.type === "product"
          ? "Please Select Product"
          : banner.type === "category" && banner.linktype === "parent"
            ? "Please Select Parent Category"
            : "Please Select Child Category";
      errorToast(errormess);
      return;
    }
    setloading(true);
    if (banner.image.name !== "") {
      if (globalindex.bannereditindex === -1) {
        const create = await ApiRequest(URL, undefined, "POST", "JSON", banner);
        setloading(false);
        if (!create.success) {
          errorToast("Failed To Create");
          return;
        }
        setbanner(BannerInitialize);
        successToast("Banner Created");
        setreloaddata && setreloaddata(true);
      } else {
        const update = await ApiRequest(URL, undefined, "PUT", "JSON", banner);
        setloading(false);
        if (!update.success) {
          errorToast("Failed To Update");
          return;
        }
        const idx = allbanner.findIndex(
          (i) => i.id === globalindex.bannereditindex,
        );
        allbanner[idx] = banner;
        setalldata({ banner: allbanner });
        setglobalindex((prev) => ({ ...prev, bannereditindex: -1 }));

        successToast("Banner Updated");
        setreloaddata && setreloaddata(true);
      }
      setbanner(BannerInitialize);
    } else {
      setloading(false);
      errorToast("Image is required");
    }
  }, [
    banner,
    globalindex.bannereditindex,
    allData?.banner,
    setbanner,
    setalldata,
    setglobalindex,
    setreloaddata,
  ]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      const { name, value } = event.target;

      if (name === "type" || name === "linktype") {
        setbanner((prev) => ({
          ...prev,
          linktype:
            value === "product"
              ? value
              : value === "category"
                ? "parent"
                : undefined,
          [name]: value,
        }));
      } else {
        setbanner((prev) => ({ ...prev, [name]: value }));
      }
    },
    [setbanner],
  );

  const handleSelectProduct = useCallback(
    (type: string, value?: Array<SelectType> | SelectType) => {
      if (type === "parentcate")
        setbanner((prev) => ({
          ...prev,
          parentcate: value as any,
          childcate: undefined,
        }));
      else
        setbanner((prev) => ({
          ...prev,
          [type]: value,
        }));
    },
    [setbanner],
  );

  return (
    <SecondaryModal
      open={openmodal.createBanner}
      size="full"
      placement="center"
      footer={() => {
        return (
          <div className="actions_con w-full h-fit flex flex-row gap-4 p-4 bg-white border-t-2 border-gray-200">
            <PrimaryButton
              onClick={() => handleCreate()}
              text={
                globalindex.bannereditindex !== -1
                  ? "Update Banner"
                  : "Create Banner"
              }
              width="100%"
              type="button"
              status={loading ? "loading" : "authenticated"}
              radius="12px"
            />
            <PrimaryButton
              text="Cancel"
              onClick={() => handleCancel()}
              disable={loading}
              color="lightcoral"
              type="button"
              width="100%"
              radius="12px"
            />
          </div>
        );
      }}
    >
      <div className="bannermodal_content bg-gray-50 p-6 relative max-small_phone:rounded-none rounded-2xl w-full h-full max-small_phone:min-h-screen overflow-x-hidden flex flex-col gap-y-6 items-center will-change-auto">
        {banner.image.url && (
          <div
            style={banner.size === "normal" ? { width: "100%" } : {}}
            className="image_container flex flex-col w-fit items-center justify-center h-fit"
          >
            <div className="mb-3 text-center">
              <h3 className="text-lg font-bold text-blue-600">
                Banner Preview
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                This is how your banner will appear
              </p>
            </div>
            <div
              style={banner.size === "normal" ? { width: "100%" } : {}}
              className="flex flex-col w-full max-w-[80%] max-large_phone:max-w-full max-h-[80vh] min-h-62.5 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg bg-white"
            >
              <ImageWithLoader
                src={banner.image.url}
                alt={"Banner"}
                width={600}
                height={300}
                className="w-full min-h-62.5 object-cover"
                containerClassName="w-full h-full"
                loading="lazy"
                quality={75}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
              />
            </div>
          </div>
        )}

        <div className="bannerform flex flex-col gap-y-6 justify-start items-center w-full h-full">
          <div className="w-full h-fit flex flex-col gap-y-6 bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faFlag} className="text-blue-500" />
                Banner Details
              </h4>
              <p className="text-sm text-gray-500">
                Configure your banner settings
              </p>
            </div>

            <Input
              size="lg"
              name="name"
              label="Banner Name"
              labelPlacement="outside"
              placeholder="Enter banner name"
              type="text"
              value={banner.name}
              className="w-full font-bold"
              onChange={handleChange}
              classNames={{
                label: "text-gray-700 font-semibold",
                input: "bg-gray-50",
              }}
            />

            <div className="grid grid-cols-2 gap-4 max-small_phone:grid-cols-1">
              <div className="h-fit flex flex-col gap-y-3">
                <label className="font-semibold text-base text-gray-700 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className="text-purple-500"
                  />
                  Banner Type
                </label>
                <Selection
                  data={BannerType}
                  value={banner.type}
                  name="type"
                  onChange={handleChange}
                />
              </div>
              <div className="h-fit flex flex-col gap-y-3">
                <label className="font-semibold text-base text-gray-700 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExpand} className="text-green-500" />
                  Banner Size
                </label>
                <Selection
                  data={BannerSize}
                  value={banner.size}
                  name="size"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className="w-full h-fit flex flex-row items-start gap-5 flex-wrap">
            {banner.linktype === "product" && (
              <div className="w-full h-fit flex flex-col gap-y-4 bg-blue-50 rounded-2xl p-6 shadow-md border-2 border-blue-200">
                <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBox} className="text-blue-500" />
                  Select Products
                </label>
                <SelectAndSearchProduct
                  getdata={(take, value) => getSelectItems(take, value, "prod")}
                  onSelect={(value) =>
                    handleSelectProduct("selectedproduct", value)
                  }
                  value={banner.selectedproduct}
                />
              </div>
            )}
            {banner.type !== "normal" && (
              <div className="w-full h-fit flex flex-col gap-y-4 bg-orange-50 rounded-2xl p-6 shadow-md border-2 border-orange-200">
                <label className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLink} className="text-orange-500" />
                  Link Type
                </label>
                <Selection
                  data={Linktype.filter((i) => {
                    if (banner.type === "product") {
                      return i.value === "product";
                    } else {
                      return i.value !== "product";
                    }
                  })}
                  name="linktype"
                  value={banner.linktype}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          {banner.linktype === "parent" && (
            <div className="w-full h-fit flex flex-col gap-y-4 bg-green-50 rounded-2xl p-6 shadow-md border-2 border-green-200">
              <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faFolderTree}
                  className="text-green-500"
                />
                Parent Category
              </label>
              <SelectAndSearchProduct
                getdata={(_, value) => getCategory("parent", value, 0)}
                onSelect={(value) => handleSelectProduct("parentcate", value)}
                value={banner.parentcate ? [banner.parentcate] : undefined}
                placeholder="Select Parent Category"
                singleselect
              />
            </div>
          )}
          {banner.linktype === "sub" && (
            <div className="w-full h-fit flex flex-col gap-5 bg-indigo-50 rounded-2xl p-6 shadow-md border-2 border-indigo-200">
              <div className="w-full h-fit flex flex-col gap-y-4">
                <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="text-indigo-500"
                  />
                  Parent Category
                </label>
                <SelectAndSearchProduct
                  getdata={(take, value) => getCategory("parent", value, 0)}
                  onSelect={(value) => handleSelectProduct("parentcate", value)}
                  value={banner.parentcate ? [banner.parentcate] : undefined}
                  placeholder="Select Parent Category"
                  singleselect
                />
              </div>
              {banner.parentcate && (
                <div className="w-full h-fit flex flex-col gap-y-4 animate-fade-in">
                  <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faFolderOpen}
                      className="text-purple-500"
                    />
                    Child Category
                  </label>
                  <SelectAndSearchProduct
                    getdata={(_, value) =>
                      getCategory(
                        "child",
                        value,
                        parseInt(banner.parentcate?.value.toString() ?? "0"),
                      )
                    }
                    onSelect={(value) =>
                      handleSelectProduct("childcate", value)
                    }
                    value={banner.childcate ? [banner.childcate] : undefined}
                    placeholder="Select Sub Category"
                    singleselect
                  />
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setopenmodal({ ...openmodal, imageupload: true })}
            className="w-full h-16 rounded-2xl font-bold text-lg shadow-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-3 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faImage} className="text-2xl" />
            <span>
              {banner.image?.url.length > 0
                ? "Change Banner Image"
                : "Upload Banner Image"}
            </span>
          </button>
        </div>
      </div>

      {openmodal.imageupload && (
        <ImageUpload
          limit={1}
          mutitlple={false}
          type="createbanner"
          bannertype={banner.size === "large" ? undefined : banner.size}
          setreloaddata={setreloaddata}
        />
      )}
    </SecondaryModal>
  );
});
