import {
  BannerInitialize,
  SelectType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, useEffect, useState } from "react";
import {
  getChildCategoryForBanner,
  getParentCategoryForBanner,
  getProductForBanner,
  getPromotionForBanner,
} from "../../severactions/actions";
import { ApiRequest, useEffectOnce } from "@/src/context/CustomHook";
import { errorToast, successToast } from "../Loading";
import Modal from "../Modals";
import { motion } from "framer-motion";
import PrimaryButton, { Selection } from "../Button";
import { SelectAndSearchProduct } from "../Banner";
import { ImageUpload } from "./Image";
import { DeleteTempImage } from "../../dashboard/inventory/varaint_action";
import { useRouter } from "next/navigation";

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
    setloading(true);
    const allbanner = [...(allData.banner ?? [])];
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
    value: Array<SelectType> | SelectType,
    type: string
  ) => {
    setbanner((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  return (
    <Modal
      customwidth="100vw"
      customheight="100vh"
      closestate="createBanner"
      customZIndex={200}
    >
      <div className="bannermodal_content bg-white p-3 relative rounded-lg w-full min-h-screen max-h-[80vh] overflow-y-auto overflow-x-hidden h-full flex flex-col gap-y-5 items-center">
        {banner.image && banner.image.url.length !== 0 && (
          <div
            style={banner.size === "normal" ? { width: "100%" } : {}}
            className="image_container flex flex-col w-fit items-center justify-center h-fit border border-black"
          >
            <div
              style={banner.size === "normal" ? { width: "100%" } : {}}
              className="flex flex-col w-fit max-h-[80vh] min-h-[250px]"
            >
              <img
                src={banner.image?.url}
                alt={"Banner"}
                style={
                  banner.size === "small"
                    ? { width: "400px", height: "450px" }
                    : { width: "95vw", height: "auto" }
                }
                className="w-auto min-h-[250px] max-h-[80vh] mt-9  aspect-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>
        )}
        <div className="bannerform flex flex-col gap-y-5 justify-start items-center w-[95vw] h-full">
          <div className="w-full h-fit flex flex-row gap-x-5">
            <div className="w-1/2 h-fit flex flex-col gap-y-5">
              <label className="font-bold text-lg">Banner Type</label>
              <Selection
                data={BannerType}
                value={banner.type}
                name="type"
                onChange={handleChange}
              />
            </div>
            <div className="w-1/2 h-fit flex flex-col gap-y-5">
              <label className="font-bold text-lg">Banner Size</label>
              <Selection
                data={BannerSize}
                value={banner.size}
                name="size"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="w-full h-fit flex flex-row items-center gap-x-5">
            <div className="w-full h-fit flex flex-col gap-y-5">
              <label className="w-full h-fit text-lg font-bold">
                Banner Name
              </label>
              <input
                name="name"
                placeholder="Name"
                type="text"
                value={banner.name}
                className="w-full h-[40px] text-sm pl-1 font-medium rounded-lg border border-gray-500"
                onChange={handleChange}
              />
            </div>
            {banner.type !== "normal" && (
              <div className="w-full h-fit flex flex-col gap-y-5">
                <label className="font-bold text-lg">Link Type</label>
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
            <div className="w-full h-fit flex flex-col gap-y-5">
              <label className="w-full h-fit text-lg font-bold">
                Parent Category
              </label>
              <SelectAndSearchProduct
                getdata={(take, value) => getCategory("parent", value, 0)}
                onSelect={(value) => handleSelectProduct(value, "parentcate")}
                value={banner.parentcate ? [banner.parentcate] : undefined}
                placeholder="Select Parent Category"
                singleselect
              />
            </div>
          )}
          {banner.linktype === "sub" && (
            <div className="w-full h-fit flex flex-row items-start gap-x-5">
              <div className="w-full h-fit flex flex-col gap-y-5">
                <label className="w-full h-fit text-lg font-bold">
                  Parent Category
                </label>
                <SelectAndSearchProduct
                  getdata={(take, value) => getCategory("parent", value, 0)}
                  onSelect={(value) => handleSelectProduct(value, "parentcate")}
                  value={
                    banner.parentcate ? (banner.parentcate as any) : undefined
                  }
                  placeholder="Select Parent Category"
                  singleselect
                />
              </div>
              {banner.parentcate && (
                <div className="w-full h-fit flex flex-col gap-y-5">
                  <label className="w-full h-fit text-lg font-bold">
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
                      handleSelectProduct(value, "childcate")
                    }
                    value={
                      banner.childcate ? (banner.childcate as any) : undefined
                    }
                    placeholder="Select Sub Category"
                    singleselect
                  />
                </div>
              )}
            </div>
          )}

          {banner.linktype === "product" && (
            <div className="w-full h-full flex flex-col gap-y-5">
              <label className="w-full h-fit text-lg font-bold">
                Select Products
              </label>
              <SelectAndSearchProduct
                getdata={(take, value) => getSelectItems(take, value, "prod")}
                onSelect={(value) =>
                  handleSelectProduct(value, "selectedproduct")
                }
                value={banner.selectedproduct}
              />
            </div>
          )}
          <PrimaryButton
            text={banner.image?.url.length > 0 ? "EditImage" : "UploadImage"}
            width="100%"
            type="button"
            color="lightblue"
            textcolor="black"
            hoverColor="black"
            hoverTextColor="white"
            onClick={() => setopenmodal({ ...openmodal, imageupload: true })}
            Icon={<i className="fa-regular fa-image text-lg text-white"></i>}
            radius="10px"
          />
        </div>

        <div className="actions_con w-full flex flex-row gap-x-10 relative bottom-0 ">
          <PrimaryButton
            onClick={() => handleCreate()}
            text={globalindex.bannereditindex !== -1 ? "Edit" : "Create"}
            width="100%"
            type="button"
            status={loading ? "loading" : "authenticated"}
            radius="10px"
          />
          <PrimaryButton
            text="Cancel"
            onClick={() => handleCancel()}
            disable={loading}
            color="lightcoral"
            type="button"
            width="100%"
            radius="10px"
          />
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
    </Modal>
  );
};
