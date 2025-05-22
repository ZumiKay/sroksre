import {
  BannerInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { errorToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import PrimaryButton from "../Button";
import { SelectAndSearchProduct } from "../Banner";
import { ImageUpload } from "./Image";
import { Divider, Form, Input } from "@heroui/react";
import { BannerState, SelectType } from "@/src/context/GlobalType.type";
import { AsyncSelection } from "@/src/app/component/AsynSelection";
import Image from "next/image";
import Default from "../../../../public/Image/default.png";

const BannerType = [
  { label: "Normal", value: "normal" },
  { label: "Product", value: "product" },
  { label: "Category", value: "category" },
];
const BannerSize = [
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
  ];

  const handleCancel = async () => {
    //delete temp image

    setopenmodal({ ...openmodal, createBanner: false });
    setglobalindex({ ...globalindex, bannereditindex: -1 });
  };

  useEffect(() => {
    const fetchdata = async () => {
      setloading(true);
      const request = await ApiRequest({
        url: `/api/banner?ty=edit&p=${globalindex.bannereditindex}`,
        method: "GET",
      });
      setloading(false);

      if (request.success) {
        setbanner(request.data as BannerState);
      } else {
        errorToast("Error Connection");
      }
    };
    if (globalindex.bannereditindex !== -1) fetchdata();
  }, []);

  const handleCreate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validation
      if (banner.name === "") {
        errorToast("Name is required");
        return;
      }

      if (banner.Image.name === "") {
        errorToast("Image is required");
        return;
      }

      // Type-specific validation
      if (banner.type === "product" && !banner.selectedproduct) {
        errorToast("Please Select Product");
        return;
      }

      if (banner.type === "category") {
        if (banner.linktype === "parent" && !banner.parentcate) {
          errorToast("Please Select Parent Category");
          return;
        }
        if (banner.linktype === "sub" && !banner.childcate) {
          errorToast("Please Select Child Category");
          return;
        }
      }

      // API request setup
      const URL = "/api/banner";
      const isCreating = globalindex.bannereditindex === -1;
      const method = isCreating ? "POST" : "PUT";

      try {
        setloading(true);

        const response = await ApiRequest({
          url: URL,
          method,
          data: banner,
        });

        if (!response.success) {
          errorToast(`Failed To ${isCreating ? "Create" : "Update"}`);
          return;
        }

        // Update state based on operation type
        if (!isCreating) {
          const updatedBanners = [...(allData?.banner ?? [])];
          const idx = updatedBanners.findIndex(
            (i) => i.id === globalindex.bannereditindex
          );
          if (idx !== -1) {
            updatedBanners[idx] = banner;
            setalldata({ banner: updatedBanners });
          }
          setglobalindex((prev) => ({ ...prev, bannereditindex: -1 }));
        }

        setbanner(BannerInitialize);
        successToast(`Banner ${isCreating ? "Created" : "Updated"}`);
        setreloaddata?.(true);
      } catch (error) {
        const err = error as Record<string, unknown>;
        errorToast(`Error: ${err?.message || "Unknown error occurred"}`);
      } finally {
        setloading(false);
      }
    },
    [
      banner,
      globalindex.bannereditindex,
      allData?.banner,
      setalldata,
      setbanner,
      setglobalindex,
      setreloaddata,
    ]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
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
        parentcate: value as never,
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
      open={openmodal.createBanner ?? false}
      size="full"
      placement="top"
    >
      <div className="bannermodal_content bg-white p-3 relative max-small_phone:rounded-none rounded-lg w-full h-full max-small_phone:min-h-screen overflow-x-hidden  flex flex-col gap-y-5 items-center">
        <div
          style={banner.size === "normal" ? { width: "100%" } : {}}
          className="image_container flex flex-col w-fit items-center justify-center h-fit"
        >
          <div
            style={banner.size === "normal" ? { width: "100%" } : {}}
            className="flex flex-col w-full max-w-[80%] max-large_phone:max-w-full max-h-[80vh] min-h-[250px] border-2 border-dashed border-gray-300 rounded-lg"
          >
            <Image
              src={banner.Image.url.length > 0 ? banner.Image.url : Default}
              alt={"Banner"}
              style={
                banner.size === "small"
                  ? {
                      width: isMobile ? "200px" : "400px",
                      height: isMobile ? "150px" : "500px",
                    }
                  : { width: "100%", height: isMobile ? "200px" : "auto" }
              }
              className="w-full min-h-[250px] mt-2 object-cover"
              loading="lazy"
              width={10000}
              height={1000}
            />
          </div>
        </div>

        <Form
          onSubmit={handleCreate}
          className="bannerform flex flex-col gap-y-5 justify-start items-center w-full h-full"
        >
          <div className="w-full h-fit flex flex-col gap-y-5">
            <div
              className={
                "w-full h-fit flex flex-row items-center gap-5 max-smaller_screen:flex-wrap"
              }
            >
              <Input
                size="md"
                name="name"
                label="Name"
                labelPlacement="outside"
                placeholder="Name"
                type="text"
                value={banner.name}
                className="w-full font-bold"
                onChange={handleChange}
                isRequired
              />
              <AsyncSelection
                type={"normal"}
                data={() => BannerType}
                option={{
                  fullWidth: true,
                  label: "Type",
                  labelPlacement: "outside",
                  selectedValue: [banner.type],
                  name: "type",
                  onChange: (val) => handleChange(val as never),
                  isRequired: true,
                }}
              />
              <AsyncSelection
                type="normal"
                data={() => BannerSize}
                option={{
                  fullWidth: true,
                  name: "size",
                  label: "Size",
                  labelPlacement: "outside",
                  selectedValue: [banner.size],
                  onChange: (val) => handleChange(val as never),
                  isRequired: true,
                }}
              />
            </div>
          </div>
          {banner.type && banner.type !== "normal" && (
            <div className="Section_divider w-full h-fit">
              <h3>Banner Options</h3>
              <Divider />
            </div>
          )}
          <div className="w-full h-fit flex flex-col items-start gap-5">
            {banner.type === "category" && (
              <AsyncSelection
                type="normal"
                data={() => Linktype}
                option={{
                  name: "linktype",
                  label: "Link Type",
                  labelPlacement: "outside",
                  placeholder: "Select",
                  selectedValue: banner.linktype
                    ? [banner.linktype]
                    : undefined,
                  onChange: (val) => handleChange(val as never),
                }}
              />
            )}
            {banner.linktype === "product" && (
              <div className="w-full h-fit flex flex-col gap-y-5">
                <label className="w-full h-fit text-sm font-bold">
                  Select Products
                </label>
                <SelectAndSearchProduct
                  apiEndpoint={"/api/products/select"}
                  onSelect={(value) =>
                    handleSelectProduct("selectedproduct", value)
                  }
                  value={banner.selectedproduct}
                />
              </div>
            )}
          </div>

          {banner.type === "category" && (
            <div className="w-full h-fit flex flex-row items-start flex-wrap gap-5">
              <div className="w-full h-fit flex flex-col gap-y-5">
                <label className="w-full h-fit text-lg font-bold">
                  Parent Category
                </label>
                <SelectAndSearchProduct
                  apiEndpoint={"/api/categories/select"}
                  searchParam={"?ty=parent"}
                  onSelect={(value) => handleSelectProduct("parentcate", value)}
                  value={banner.parentcate ? [banner.parentcate] : undefined}
                  placeholder="Select Parent Category"
                  singleSelect
                />
              </div>
              {banner.linktype === "sub" && banner.parentcate && (
                <div className="w-full h-fit flex flex-col gap-y-5">
                  <label className="w-full h-fit text-lg font-bold">
                    Child Category
                  </label>
                  <SelectAndSearchProduct
                    apiEndpoint={"/api/categories/select"}
                    searchParam={`?ty=child&pid=${banner.parentcate.value}`}
                    onSelect={(value) =>
                      handleSelectProduct("childcate", value)
                    }
                    value={banner.childcate ? [banner.childcate] : undefined}
                    placeholder="Select Sub Category"
                    singleSelect
                  />
                </div>
              )}
            </div>
          )}
          <PrimaryButton
            text={banner.Image?.url.length > 0 ? "EditImage" : "UploadImage"}
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

          <div className="actions_con w-full h-fit flex flex-row gap-x-5">
            <PrimaryButton
              text={globalindex.bannereditindex !== -1 ? "Edit" : "Create"}
              width="100%"
              type="submit"
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
        </Form>
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
