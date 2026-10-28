"use client";
import { BannerInitialize, useGlobalContext } from "@/src/context/GlobalContext";
import { useCallback, useState, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faBox,
  faCheck,
  faCircleCheck,
  faCircleInfo,
  faCloudArrowUp,
  faCompress,
  faExpand,
  faFlag,
  faFolder,
  faFolderOpen,
  faFolderTree,
  faImage,
  faLink,
  faPen,
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
import { SelectAndSearchProduct } from "../Banner";
import { ImageUpload } from "./Image";
import { DeleteTempImage } from "../../dashboard/inventory/varaint_action";
import { Input } from "@heroui/react";
import { ImageWithLoader } from "../ImageWithLoader";
import { ACCENTS, Field, ModalTitle, Option, OptionGroup, SectionCard } from "./FormSection";
import { BannerState, SelectType } from "@/src/types/productAction.type";

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

  const getSelectItems = useCallback(async (limit: number, value: string, type: string) => {
    const getreq = (type === "prod" ? getProductForBanner : getPromotionForBanner).bind(
      null,
      limit,
      value,
    );
    const request = await getreq();

    if (request.success) {
      return request;
    }
    return null;
  }, []);

  const getCategory = useCallback(async (type: "parent" | "child", value: string, pid: number) => {
    const getreq =
      type === "parent"
        ? getParentCategoryForBanner.bind(null, value)
        : getChildCategoryForBanner.bind(null, value, pid);
    const request = await getreq();
    if (request.success) {
      return request;
    }
    return null;
  }, []);

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
        const idx = allbanner.findIndex((i) => i.id === globalindex.bannereditindex);
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

  // Changing the type resets the link target to that type's default.
  const setField = useCallback(
    (name: "name" | "type" | "size" | "linktype", value: string) => {
      setbanner((prev) => {
        if (name === "type") {
          return {
            ...prev,
            type: value as BannerState["type"],
            linktype: value === "product" ? "product" : value === "category" ? "parent" : undefined,
          };
        }
        return { ...prev, [name]: value };
      });
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

  const openImageUpload = () => setopenmodal((prev) => ({ ...prev, imageupload: true }));

  const isEdit = globalindex.bannereditindex !== -1;
  const hasImage = banner.image?.url?.length > 0;

  return (
    <SecondaryModal
      open={openmodal.createBanner}
      size="full"
      placement="center"
      footer={() => (
        <div className="w-full flex flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleCancel()}
            disabled={loading}
            className="h-10 px-5 rounded-lg text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-small_phone:flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleCreate()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-slate-500 text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed max-small_phone:flex-1"
          >
            {loading ? (
              <span
                aria-hidden="true"
                className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
            ) : (
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            )}
            {isEdit ? "Save Changes" : "Create Banner"}
          </button>
        </div>
      )}
    >
      <div className="bannermodal_content w-full max-w-2xl mx-auto flex flex-col gap-y-5 py-4">
        <ModalTitle
          icon={faFlag}
          accent="blue"
          title={isEdit ? "Edit Banner" : "New Banner"}
          subtitle="Banners show on the home page. Pick a size, add an image, and optionally link it to products or a category."
        />

        <SectionCard icon={faPen} accent="blue" title="Basics">
          <Input
            size="lg"
            name="name"
            label="Name"
            labelPlacement="outside"
            placeholder="e.g. Summer Sale"
            description="Only visible to admins."
            type="text"
            variant="bordered"
            value={banner.name}
            onChange={(e) => setField("name", e.target.value)}
            classNames={{
              label: "text-sm font-medium text-gray-700",
              inputWrapper: "group-data-[focus=true]:border-blue-500 border-gray-300",
            }}
          />

          <OptionGroup
            label="Size"
            options={SIZE_OPTIONS}
            value={banner.size}
            onChange={(value) => setField("size", value)}
          />
        </SectionCard>

        <SectionCard
          icon={faImage}
          accent="purple"
          title="Image"
          hint="Cropped to fit the size above. If you change the size, upload the image again."
        >
          {hasImage ? (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div
                className={`w-full bg-gray-100 ${
                  banner.size === "small" ? "aspect-4/3 max-w-sm mx-auto" : "aspect-video"
                }`}
              >
                <ImageWithLoader
                  src={banner.image.url}
                  alt={banner.name || "Banner preview"}
                  width={800}
                  height={450}
                  className="w-full h-full object-contain"
                  containerClassName="w-full h-full"
                  quality={75}
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-white">
                <p className="text-sm text-gray-600 truncate flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-green-500" />
                  {banner.image.name || "Banner image"}
                </p>
                <button
                  type="button"
                  onClick={openImageUpload}
                  className="shrink-0 h-9 px-4 rounded-lg text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  Replace
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openImageUpload}
              className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 text-purple-600 hover:border-purple-500 hover:bg-purple-100 transition-colors ${
                banner.size === "small" ? "aspect-4/3 max-w-sm mx-auto" : "aspect-video"
              }`}
            >
              <span className="w-12 h-12 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-sm">
                <FontAwesomeIcon icon={faCloudArrowUp} className="text-xl" />
              </span>
              <span className="text-sm font-semibold">Upload image</span>
              <span className="text-xs text-purple-500">
                {banner.size === "small" ? "Best at 1:1 or 4:3" : "Best at 16:9 or 4:3"}
              </span>
            </button>
          )}
        </SectionCard>

        <SectionCard
          icon={faLink}
          accent="orange"
          title="Link"
          hint="What happens when a customer clicks the banner."
        >
          <OptionGroup
            label="When clicked"
            options={TYPE_OPTIONS}
            value={banner.type}
            onChange={(value) => setField("type", value)}
          />

          {banner.type === "product" && (
            <Field label="Products" hint="Customers see these products when they open the banner.">
              <SelectAndSearchProduct
                getdata={(take, value) => getSelectItems(take, value, "prod")}
                onSelect={(value) => handleSelectProduct("selectedproduct", value)}
                value={banner.selectedproduct}
              />
            </Field>
          )}

          {banner.type === "category" && (
            <>
              <OptionGroup
                label="Category level"
                options={CATEGORY_LINK_OPTIONS}
                value={banner.linktype}
                onChange={(value) => setField("linktype", value)}
              />
              <Field label="Parent category">
                <SelectAndSearchProduct
                  getdata={(_, value) => getCategory("parent", value, 0)}
                  onSelect={(value) => handleSelectProduct("parentcate", value)}
                  value={banner.parentcate ? [banner.parentcate] : undefined}
                  placeholder="Search parent categories"
                  singleselect
                />
              </Field>
              {banner.linktype === "sub" &&
                (banner.parentcate ? (
                  <Field label="Sub category">
                    <SelectAndSearchProduct
                      // Remount when the parent changes so old results clear
                      key={banner.parentcate.value}
                      getdata={(_, value) =>
                        getCategory(
                          "child",
                          value,
                          parseInt(banner.parentcate?.value.toString() ?? "0"),
                        )
                      }
                      onSelect={(value) => handleSelectProduct("childcate", value)}
                      value={banner.childcate ? [banner.childcate] : undefined}
                      placeholder="Search sub categories"
                      singleselect
                    />
                  </Field>
                ) : (
                  <p
                    className={`text-sm rounded-lg border px-4 py-3 flex items-center gap-2 ${ACCENTS.amber.soft}`}
                  >
                    <FontAwesomeIcon icon={faCircleInfo} />
                    Choose a parent category to see its sub categories.
                  </p>
                ))}
            </>
          )}
        </SectionCard>
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

const SIZE_OPTIONS: Option[] = [
  {
    value: "normal",
    label: "Normal",
    description: "Full width, 16:9",
    icon: faExpand,
    accent: "slate",
  },
  {
    value: "small",
    label: "Small",
    description: "Compact, 1:1 or 4:3",
    icon: faCompress,
    accent: "teal",
  },
];

const TYPE_OPTIONS: Option[] = [
  {
    value: "normal",
    label: "Nothing",
    description: "Image only",
    icon: faBan,
    accent: "slate",
  },
  {
    value: "product",
    label: "Products",
    description: "Show picked products",
    icon: faBox,
    accent: "green",
  },
  {
    value: "category",
    label: "Category",
    description: "Open a category",
    icon: faFolderTree,
    accent: "orange",
  },
];

const CATEGORY_LINK_OPTIONS: Option[] = [
  {
    value: "parent",
    label: "Parent category",
    icon: faFolder,
    accent: "amber",
  },
  {
    value: "sub",
    label: "Sub category",
    icon: faFolderOpen,
    accent: "indigo",
  },
];
