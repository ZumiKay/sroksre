import {
  BannerInitialize,
  SelectType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, useState } from "react";
import {
  getChildCategoryForBanner,
  getParentCategoryForBanner,
  getProductForBanner,
  getPromotionForBanner,
} from "../../severactions/actions";
import {
  ApiRequest,
  useEffectOnce,
  useScreenSize,
} from "@/src/context/CustomHook";
import { errorToast, successToast } from "../Loading";
import Modal, { SecondaryModal } from "../Modals";

import PrimaryButton, { Selection } from "../Button";
import { SelectAndSearchProduct } from "../Banner";
import { ImageUpload } from "./Image";
import { DeleteTempImage } from "../../dashboard/inventory/varaint_action";
import { Input } from "@nextui-org/react";

export const BannerType = [
  { label: "Normal", value: "normal" },
  { label: "Product", value: "product" },
  { label: "Category", value: "category" },
];
export const BannerSize = [
  { label: "Small", value: "small" },
  { label: "Normal", value: "normal" },
];

export const BannerModal = ({
  setreloaddata,
}: {
  setreloaddata?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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
  const { isMobile } = useScreenSize();

  const Linktype = [
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
  ];

  const handleCancel = async () => {
    //delete temp image

    const delreq = await DeleteTempImage();
    if (!delreq.success) {
      errorToast("Error occured");
      return;
    }

    setopenmodal({ ...openmodal, createBanner: false });
    setglobalindex({ ...globalindex, bannereditindex: -1 });
  };

  const getSelectItems = async (limit: number, value: string, type: string) => {
    const getreq = (
      type === "prod" ? getProductForBanner : getPromotionForBanner
    ).bind(null, limit, value);
    const request = await getreq();

    if (request.success) {
      return request;
    }
    return null;
  };

  const getCategory = async (
    type: "parent" | "child",
    value: string,
    pid: number
  ) => {
    const getreq =
      type === "parent"
        ? getParentCategoryForBanner.bind(null, value)
        : getChildCategoryForBanner.bind(null, value, pid);
    const request = await getreq();
    if (request.success) {
      return request;
    }
    return null;
  };

  useEffectOnce(() => {
    const fetchdata = async () => {
      setloading(true);
      const request = await ApiRequest(
        `/api/banner?ty=edit&p=${globalindex.bannereditindex}`,
        undefined,
        "GET"
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

  const handleCreate = async () => {
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
          (i) => i.id === globalindex.bannereditindex
        );
        allbanner[idx] = banner;
        setalldata({ banner: allbanner });
        setglobalindex((prev) => ({ ...prev, bannereditindex: -1 }));

        successToast("Banner Updated");
        setreloaddata && setreloaddata(true);
      }
      setbanner(BannerInitialize);
    } else {
      errorToast("Image is required");
    }
  };

  const handleChange = (event: ChangeEvent<any>) => {
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
  };

  const handleSelectProduct = (
    type: string,
    value?: Array<SelectType> | SelectType
  ) => {
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
  };

  return (
    <SecondaryModal
      open={openmodal.createBanner}
      size="full"
      placement="center"
      footer={() => {
        return (
          <div className="actions_con w-full h-fit flex flex-row gap-4 p-4 bg-gradient-to-r from-gray-50 to-white border-t-2 border-gray-200">
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
      <div className="bannermodal_content bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-6 relative max-small_phone:rounded-none rounded-2xl w-full h-full max-small_phone:min-h-screen overflow-x-hidden flex flex-col gap-y-6 items-center">
        <div
          style={banner.size === "normal" ? { width: "100%" } : {}}
          className="image_container flex flex-col w-fit items-center justify-center h-fit group"
        >
          <div className="mb-3 text-center">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Banner Preview
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This is how your banner will appear
            </p>
          </div>
          <div
            style={banner.size === "normal" ? { width: "100%" } : {}}
            className="flex flex-col w-full max-w-[80%] max-large_phone:max-w-full max-h-[80vh] min-h-[250px] rounded-2xl overflow-hidden border-4 border-gray-200 shadow-2xl hover:shadow-blue-200 transition-all duration-300 bg-white"
          >
            <img
              src={banner.image.url}
              alt={"Banner"}
              style={
                banner.size === "small"
                  ? {
                      width: isMobile ? "200px" : "400px",
                      height: isMobile ? "150px" : "500px",
                    }
                  : { width: "100%", height: isMobile ? "200px" : "auto" }
              }
              className="w-full min-h-[250px] object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>

        <div className="bannerform flex flex-col gap-y-6 justify-start items-center w-full h-full">
          <div className="w-full h-fit flex flex-col gap-y-6 bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <i className="fa-solid fa-flag text-blue-500"></i>
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
                  <i className="fa-solid fa-layer-group text-purple-500"></i>
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
                  <i className="fa-solid fa-expand text-green-500"></i>
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
              <div className="w-full h-fit flex flex-col gap-y-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-md border-2 border-blue-200">
                <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-box text-blue-500"></i>
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
              <div className="w-full h-fit flex flex-col gap-y-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 shadow-md border-2 border-orange-200">
                <label className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-link text-orange-500"></i>
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
            <div className="w-full h-fit flex flex-col gap-y-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 shadow-md border-2 border-green-200">
              <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                <i className="fa-solid fa-folder-tree text-green-500"></i>
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
          )}
          {banner.linktype === "sub" && (
            <div className="w-full h-fit flex flex-col gap-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-md border-2 border-indigo-200">
              <div className="w-full h-fit flex flex-col gap-y-4">
                <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-folder text-indigo-500"></i>
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
                <div className="w-full h-fit flex flex-col gap-y-4 animate-fadeIn">
                  <label className="w-full h-fit text-lg font-bold text-gray-800 flex items-center gap-2">
                    <i className="fa-solid fa-folder-open text-purple-500"></i>
                    Child Category
                  </label>
                  <SelectAndSearchProduct
                    getdata={(take, value) =>
                      getCategory(
                        "child",
                        value,
                        parseInt(banner.parentcate?.value.toString() ?? "0")
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
            className="w-full h-16 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-3 group"
          >
            <i className="fa-regular fa-image text-2xl group-hover:scale-110 transition-transform duration-300"></i>
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
};
