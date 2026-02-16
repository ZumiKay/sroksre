import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
  useScreenSize,
} from "@/src/context/CustomHook";
import {
  CateogoryState,
  Productinitailizestate,
  ProductStockType,
  SubcategoriesState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { ContainerLoading, errorToast, successToast } from "../Loading";
import { PrimaryPhoto } from "../PhotoComponent";
import PrimaryButton, { Selection } from "../Button";
import ToggleMenu, { SearchAndMultiSelect } from "../ToggleMenu";
import { Variantcontainer } from "./VariantModal";
import { ImageUpload } from "./Image";
import { Input, Textarea } from "@heroui/react";
import { VariantIcon } from "../Asset";
import { SelectionCustom } from "../Pagination_Component";
import { SecondaryModal } from "../Modals";
import { ProductState, StockTypeEnum } from "@/src/types/product.type";

const stockTypeData = [
  {
    label: "Normal",
    value: "stock",
  },
  {
    label: "Variants ( Product have multiple versions)",
    value: "variant",
  },
];

export function CreateProducts({
  setreloaddata,
}: {
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    openmodal,
    setopenmodal,
    product,
    setproduct,
    globalindex,
    setglobalindex,
    isLoading,
    setisLoading,
  } = useGlobalContext();

  const { isMobile, isTablet } = useScreenSize();

  const detailref = useRef<HTMLDivElement>(null);
  const [loading, setloading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [stocktype, setstocktype] = useState<"stock" | "variant" | "size">(
    "stock",
  );

  const [subcate, setsubcate] = useState<Array<SubcategoriesState>>([]);

  const [cate, setcate] = useState<Array<CateogoryState> | undefined>(
    undefined,
  );

  const fetchcate = async (products?: ProductState) => {
    setCategoriesLoading(true);
    const asyncfunc = async () => {
      const categories = await ApiRequest(
        "/api/categories?ty=create",
        undefined,
        "GET",
      );
      if (categories.success) {
        setcate(categories.data);
        const { parent_id } = products
          ? { ...products.category }
          : { ...product.category };

        const subcates: CateogoryState = categories.data.find(
          (i: CateogoryState) => i.id === parent_id,
        );

        setsubcate(subcates?.subcategories ?? []);
      }
      setCategoriesLoading(false);
    };
    await Delayloading(asyncfunc, setloading, 1000);
  };

  const fetchproductdata = async (id: number) => {
    setloading(true);
    const request = await ApiRequest(
      `/api/products?ty=info&pid=${id}`,
      undefined,
      "GET",
      undefined,
      undefined,
      "product",
    );
    if (!request.success) {
      errorToast("Connection Problem");
      return;
    }

    const data: ProductState = request.data;

    const isExist = data.details.findIndex(
      (i) => i.info_type === "COLOR" || i.info_type === "TEXT",
    );
    if (isExist !== -1) {
      setstocktype("variant");
    }

    setproduct(request.data);

    await fetchcate(request.data); //fetch categories

    request.data.stocktype && setstocktype(request.data.stocktype);
  };

  //Fecth Product Info

  useEffectOnce(() => {
    fetchcate();
  });
  useEffect(() => {
    globalindex.producteditindex !== -1 &&
      fetchproductdata(globalindex.producteditindex);
    setloading(false);
  }, []);

  useEffect(() => {
    detailref.current &&
      detailref.current.scrollIntoView({
        behavior: "smooth",
      });
  }, [openmodal.productdetail]);

  //Method

  const handleSubmit = async () => {
    const createdproduct = { ...product };
    const URL = "/api/products/crud";

    if (product.covers.length === 0 || !product.category.parent_id) {
      errorToast(
        `${
          !product.category.parent_id ? "Category" : "Cover Image"
        } is Required`,
      );
      return;
    }

    if (globalindex.producteditindex === -1) {
      const created = await ApiRequest(URL, setisLoading, "POST", "JSON", {
        createdproduct,
      });
      if (!created.success) {
        errorToast(created.error as string);
        return;
      }

      setproduct(Productinitailizestate);
      successToast(`${product.name} Created`);
    } else {
      //updateProduct

      const updated = await ApiRequest(URL, setisLoading, "PUT", "JSON", {
        ...createdproduct,
        relatedproductid: createdproduct.relatedproductid
          ? [
              createdproduct.id,
              ...(createdproduct.relatedproductid as number[]),
            ]
          : undefined,
      });
      if (!updated.success) {
        errorToast(updated.error as string);
        return;
      }

      successToast(`${product.name} Updated`);
    }

    setopenmodal((prev) => ({ ...prev, createProduct: false }));
    setreloaddata(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;

    // Validation for positive numbers
    if (name === "price" && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    setproduct({
      ...product,
      [name]: value,
    });
  };
  const handleSelect = (value: string, name: "parent_id" | "child_id") => {
    if (name === "parent_id") {
      const subcates = cate?.find(
        (i) => i.id?.toString() === value,
      )?.subcategories;
      setsubcate(subcates ?? []);
    }

    setproduct({
      ...product,
      category: { ...product.category, [name]: parseInt(value) },
    });
  };

  const handleCancel = async () => {
    setproduct(Productinitailizestate);
    setopenmodal({ ...openmodal, createProduct: false });
    setglobalindex({ ...globalindex, producteditindex: -1 });
  };

  return (
    <>
      <SecondaryModal
        open={openmodal.createProduct}
        size={isMobile ? "5xl" : "full"}
        placement="top"
        footer={() => {
          return (
            <div className="w-full h-fit flex flex-row gap-3 sm:gap-4 md:gap-5 justify-between px-2 sm:px-4 md:px-6 py-2">
              <PrimaryButton
                color="#44C3A0"
                text={
                  loading
                    ? "Loading..."
                    : isLoading.POST || isLoading.PUT
                      ? "Saving..."
                      : globalindex.producteditindex === -1
                        ? "Create"
                        : "Update"
                }
                type={"button"}
                onClick={() => handleSubmit()}
                radius="10px"
                width="100%"
                height="45px"
                disable={loading || isLoading.POST || isLoading.PUT}
              />
              <PrimaryButton
                color="#F08080"
                text="Cancel"
                type="button"
                radius="10px"
                width="100%"
                height="45px"
                disable={loading || isLoading.POST || isLoading.PUT}
                onClick={() => {
                  handleCancel();
                }}
              />
            </div>
          );
        }}
      >
        {(loading || isLoading.PUT || isLoading.POST) && <ContainerLoading />}
        <form
          className={`createform w-full max-small_phone:max-h-[50vh]
          overflow-y-auto overflow-x-hidden relative bg-gradient-to-br from-gray-50 to-gray-100 
          p-4 sm:p-6 md:p-8 rounded-lg`}
        >
          <div
            className="product__form w-full 
        flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12 xl:gap-16 
        h-fit overflow-y-auto overflow-x-hidden items-start justify-center 
        lg:items-start
        "
          >
            <div
              className="image__container flex flex-col items-center 
              lg:sticky relative top-0 gap-y-3 
              w-full sm:w-[450px] md:w-[480px] lg:w-[420px] xl:w-[480px]
              mx-auto lg:mx-0 h-fit
              bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200"
            >
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium text-sm">
                      Loading images...
                    </p>
                  </div>
                </div>
              )}
              <PrimaryPhoto
                data={product.covers}
                showcount={true}
                style={{ height: "fit-content" }}
                hover={true}
                isMobile={isMobile}
                isTablet={isTablet}
              />
              <PrimaryButton
                type="button"
                text={product.covers.length > 0 ? "Edit Photo" : "Upload Photo"}
                width="100%"
                height="45px"
                radius="10px"
                color="#0097FA"
                disable={loading}
                onClick={() => {
                  setopenmodal({ ...openmodal, imageupload: true });
                }}
              />
            </div>

            <div
              className="productinfo flex flex-col justify-start items-stretch 
              w-full lg:w-1/2 lg:flex-1
              h-fit gap-y-5 sm:gap-y-6
              bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200
              "
            >
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="animate-spin h-10 w-10 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="text-gray-600 font-medium">
                      Loading product data...
                    </p>
                  </div>
                </div>
              )}
              <Input
                type="text"
                label="Product Name"
                labelPlacement="outside"
                placeholder="Enter product name"
                name="name"
                onChange={handleChange}
                value={product.name}
                required
                size="lg"
                variant="bordered"
                isDisabled={loading}
                classNames={{
                  label: "text-sm font-semibold text-gray-700",
                  input: "text-base",
                  inputWrapper:
                    "border-2 hover:border-blue-400 focus-within:border-blue-500 transition-colors",
                }}
              />
              <Input
                type="text"
                label="Short Description"
                placeholder="Enter a brief description"
                labelPlacement="outside"
                name="description"
                onChange={handleChange}
                value={product.description}
                required
                size="lg"
                variant="bordered"
                isDisabled={loading}
                classNames={{
                  label: "text-sm font-semibold text-gray-700",
                  input: "text-base",
                  inputWrapper:
                    "border-2 hover:border-blue-400 focus-within:border-blue-500 transition-colors",
                }}
              />

              <Input
                type="number"
                label="Price"
                labelPlacement="outside"
                placeholder="0.00"
                step=".01"
                value={product.price === 0 ? "" : product.price.toString()}
                name="price"
                onChange={handleChange}
                min={0}
                max={10000}
                isDisabled={loading}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-lg font-semibold">
                      $
                    </span>
                  </div>
                }
                required
                size="lg"
                variant="bordered"
                classNames={{
                  label: "text-sm font-semibold text-gray-700",
                  input: "text-base font-semibold",
                  inputWrapper:
                    "border-2 hover:border-green-400 focus-within:border-green-500 transition-colors",
                }}
              />
              <div
                className="w-full h-fit flex flex-col gap-y-3 z-50 
                bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200"
              >
                <label className="font-semibold text-sm text-gray-700">
                  Add related product (Optional)
                </label>
                <SearchAndMultiSelect />
              </div>

              <div className="category_sec flex flex-col gap-y-4 w-full h-fit">
                {categoriesLoading ? (
                  <div className="w-full flex flex-col gap-4">
                    {/* Category loading skeleton */}
                    <div className="animate-pulse">
                      <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
                      <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    {/* Subcategory loading skeleton */}
                    <div className="animate-pulse">
                      <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
                      <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg relative overflow-hidden">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="animate-pulse">
                        Fetching categories...
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <SelectionCustom
                      textplacement="outside"
                      label="Category"
                      placeholder="Select"
                      value={
                        product.category.parent_id !== 0 &&
                        product.category.parent_id
                          ? `${product.category.parent_id}`
                          : undefined
                      }
                      data={
                        cate?.map((i) => ({
                          label: i.name,
                          value: `${i.id}`,
                        })) ?? []
                      }
                      onChange={(val) =>
                        handleSelect(val.toString(), "parent_id")
                      }
                    />
                    {product.category.parent_id !== 0 &&
                    product.category.parent_id ? (
                      <SelectionCustom
                        label="Sub Category"
                        textplacement="outside"
                        value={
                          product.category.child_id &&
                          product.category.child_id !== 0
                            ? `${product.category.child_id}`
                            : undefined
                        }
                        data={
                          subcate.map((sub) => ({
                            label: sub.name,
                            value: `${sub.id}`,
                          })) ?? []
                        }
                        placeholder="Select"
                        onChange={(val) =>
                          handleSelect(val.toString(), "child_id")
                        }
                      />
                    ) : (
                      ""
                    )}{" "}
                  </>
                )}
              </div>
              <Selection
                label="Stock Type"
                value={product.stocktype}
                data={stockTypeData}
                onChange={(e) => {
                  const { value } = e.target;
                  let updateproducts = { ...product };

                  if (
                    value === ProductStockType.size ||
                    value === ProductStockType.stock ||
                    value === ProductStockType.variant
                  ) {
                    updateproducts.stock = 0;
                  }

                  if (
                    value === ProductStockType.stock ||
                    value === ProductStockType.variant
                  ) {
                    const idx = updateproducts.details?.findIndex(
                      (i) => i.info_type === "SIZE",
                    );
                    idx !== undefined && updateproducts.details?.splice(idx, 1);
                  } else {
                    updateproducts.Variant = undefined;
                    updateproducts.Stock = undefined;
                  }
                  updateproducts.stocktype = value as StockTypeEnum;
                  setproduct(updateproducts);
                  setstocktype(value as any);
                }}
                required
              />
              {stocktype === ProductStockType.stock ? (
                <Input
                  type="number"
                  label="Stock"
                  labelPlacement="outside"
                  placeholder="0"
                  name="stock"
                  min={0}
                  max={1000}
                  onChange={handleChange}
                  value={product.stock === 0 ? "" : product.stock?.toString()}
                  required
                  size="lg"
                  variant="bordered"
                  classNames={{
                    label: "text-sm font-semibold text-gray-700",
                    input: "text-base font-semibold",
                    inputWrapper:
                      "border-2 hover:border-purple-400 focus-within:border-purple-500 transition-colors",
                  }}
                />
              ) : (
                <>
                  <PrimaryButton
                    radius="10px"
                    hoverTextColor="lightblue"
                    type="button"
                    text={"Variants"}
                    Icon={<VariantIcon />}
                    width="100%"
                    onClick={() => {
                      setopenmodal((prev) => ({
                        ...prev,
                        addproductvariant: true,
                      }));
                    }}
                    height="50px"
                    color="black"
                  />
                </>
              )}

              <div
                className="toggleMenu_section w-full h-fit p-4 transition cursor-pointer 
                  rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 
                  border-2 border-gray-300 hover:border-blue-400 hover:shadow-md"
              >
                <ToggleMenu
                  name="Product Details"
                  data={product.details}
                  isAdmin={true}
                />
              </div>
              {!openmodal.productdetail ? (
                <PrimaryButton
                  color="#0097FA"
                  text="Add more detail"
                  onClick={() => {
                    setglobalindex((prev) => ({
                      ...prev,
                      productdetailindex: -1,
                    }));
                    setopenmodal({ ...openmodal, productdetail: true });
                  }}
                  type="button"
                  radius="10px"
                  width="100%"
                  height="35px"
                />
              ) : (
                <div ref={detailref} className="w-full h-full">
                  <DetailsModal />
                </div>
              )}
            </div>
          </div>
        </form>
        {openmodal.imageupload && (
          <ImageUpload
            limit={4}
            mutitlple={true}
            type="createproduct"
            setreloaddata={setreloaddata}
          />
        )}
        {openmodal.addproductvariant && <Variantcontainer />}
      </SecondaryModal>
    </>
  );
}

const NormalDetail = () => {
  const { product, globalindex, setproduct, setglobalindex, setopenmodal } =
    useGlobalContext();
  const [index, setindex] = useState(-1);
  const normaldetailinitialize = {
    info_title: "",
    info_value: "",
  };
  const [normaldetail, setnormal] = useState(normaldetailinitialize);
  useEffect(() => {
    const editindex = globalindex.productdetailindex === -1;
    if (!editindex) {
      setnormal({
        info_title: product.details[globalindex.productdetailindex].info_title,
        info_value: product.details[globalindex.productdetailindex]
          .info_value[0] as string,
      });
    }
    setindex(globalindex.productdetailindex);
  }, [globalindex.productdetailindex]);
  const handleAdd = () => {
    const updatedetail = [...product.details];
    const isExist = updatedetail.some(
      (obj, idx) => idx !== index && obj.info_title === normaldetail.info_title,
    );
    if (isExist) {
      errorToast("Name Already Exist");
      return;
    }
    if (index === -1) {
      updatedetail.push({
        info_title: normaldetail.info_title,
        info_type: "NORMAL",
        info_value: [normaldetail.info_value],
      });
    } else {
      updatedetail[index].info_title = normaldetail.info_title;
      updatedetail[index].info_value[0] = normaldetail.info_value;
      updatedetail[index].info_type = "NORMAL";
    }
    setproduct({ ...product, details: updatedetail });
    setglobalindex((prev) => ({ ...prev, productdetailindex: -1 }));
    setnormal(normaldetailinitialize);
    setopenmodal((prev) => ({ ...prev, productdetail: false }));
    //save detail
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setnormal({ ...normaldetail, [e.target.name]: e.target.value });
  };

  return (
    <div
      className="normalDetail w-full sm:w-[90%] md:w-[85%] lg:w-[80%] 
      h-full flex flex-col justify-center gap-y-4 sm:gap-y-5 
      bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200"
    >
      <Input
        type="text"
        name="info_title"
        label="Title"
        value={normaldetail.info_title}
        onChange={handleChange}
        size="lg"
        variant="bordered"
        placeholder="Enter detail title"
        classNames={{
          label: "text-sm font-semibold text-gray-700",
          input: "text-base",
          inputWrapper:
            "border-2 hover:border-blue-400 focus-within:border-blue-500 transition-colors",
        }}
      />

      <Textarea
        value={normaldetail.info_value}
        size="lg"
        label="Description"
        onChange={handleChange}
        name="info_value"
        variant="bordered"
        placeholder="Enter detail description"
        minRows={4}
        classNames={{
          label: "text-sm font-semibold text-gray-700",
          input: "text-base",
          inputWrapper:
            "border-2 hover:border-blue-400 focus-within:border-blue-500 transition-colors min-h-[120px]",
        }}
      />

      <PrimaryButton
        onClick={() => handleAdd()}
        type="button"
        text="Add Detail"
        color="#35C191"
        radius="10px"
        width="100%"
        height="50px"
        disable={
          normaldetail.info_value.length === 0 ||
          normaldetail.info_title.length === 0
        }
      />
    </div>
  );
};

export const DetailsModal = () => {
  const { setopenmodal } = useGlobalContext();

  return (
    <div
      className="details_modal bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 
      w-full h-full flex flex-col gap-y-5 items-center 
      px-3 sm:px-4 md:px-6 py-5 sm:py-6 md:py-8 rounded-xl shadow-inner border border-blue-200"
    >
      <NormalDetail />
      <PrimaryButton
        width="80%"
        height="50px"
        radius="10px"
        text="Back"
        onClick={() => {
          setopenmodal((prev) => ({ ...prev, productdetail: false }));
        }}
        color="#CE9EAD"
        type="button"
      />
    </div>
  );
};
