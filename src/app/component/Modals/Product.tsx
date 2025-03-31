import {
  ApiRequest,
  Delayloading,
  useScreenSize,
} from "@/src/context/CustomHook";

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
import { NormalSkeleton } from "../Banner";
import {
  InventoryInfoType,
  ProductStockType,
  SelectionType,
  StockType,
} from "../../dashboard/inventory/inventory.type";
import {
  Productinitailizestate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  CateogoryState,
  ProductState,
  SubcategoriesState,
} from "@/src/context/GlobalType.type";

const stockTypeData: Array<SelectionType> = [
  {
    label: "Normal",
    value: StockType.Stock,
  },
  {
    label: "Variants ( Product have multiple versions)",
    value: StockType.Variant,
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
  const [stocktype, setstocktype] = useState<"stock" | "variant" | "size">(
    "stock"
  );

  const [subcate, setsubcate] = useState<Array<SubcategoriesState>>([]);

  const [cate, setcate] = useState<Array<CateogoryState> | undefined>(
    undefined
  );

  const fetchcate = async (products?: ProductState) => {
    const asyncfunc = async () => {
      const categories = await ApiRequest({
        url: "/api/categories?ty=create",
        method: "GET",
      });
      if (categories.success) {
        setcate(categories.data);
        const { parent } = products
          ? { ...products.category }
          : { ...product.category };

        const subcates: CateogoryState = categories.data.find(
          (i: CateogoryState) => i.id === parent.id
        );

        setsubcate(subcates?.subcategories ?? []);
      }
    };
    await Delayloading(asyncfunc, setloading, 1000);
  };

  const fetchproductdata = async (id: number) => {
    setloading(true);
    const request = await ApiRequest({
      url: `/api/products?ty=info&pid=${id}`,
      method: "GET",
      revalidate: "product",
    });
    if (!request.success) {
      errorToast("Problem Occured");
      return;
    }

    const data: ProductState = request.data;

    const isExist = data.details.findIndex(
      (i) =>
        i.info_type === InventoryInfoType.Color ||
        i.info_type === InventoryInfoType.Text
    );
    if (isExist !== -1) {
      setstocktype("variant");
    }

    setproduct(request.data);

    await fetchcate(request.data); //fetch categories

    request.data.stocktype && setstocktype(request.data.stocktype);
  };

  //Fecth Product Info

  useEffect(() => {
    fetchcate();
  }, []);
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

    if (product.covers.length === 0) {
      errorToast("Cover Image is Required");
      return;
    }

    if (globalindex.producteditindex === -1) {
      const created = await ApiRequest({
        url: URL,
        setloading: setisLoading,
        method: "POST",
        data: {
          createdproduct,
        },
      });
      if (!created.success) {
        errorToast(created.error as string);
        return;
      }

      setproduct(Productinitailizestate);
      successToast(`${product.name} Created`);
    } else {
      //updateProduct

      const updated = await ApiRequest({
        url: URL,
        setloading: setisLoading,
        method: "PUT",
        data: {
          ...createdproduct,
          relatedproductid: createdproduct.relatedproductid
            ? [
                createdproduct.id,
                ...(createdproduct.relatedproductid as number[]),
              ]
            : undefined,
        },
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
        (i) => i.id?.toString() === value
      )?.subcategories;
      setsubcate(subcates ?? []);
    }

    setproduct({
      ...product,
      category: { ...(product.category ?? {}), [name]: parseInt(value) },
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
        open={openmodal.createProduct ?? false}
        size={isMobile ? "5xl" : "full"}
        placement="top"
        footer={() => {
          return (
            <div className="w-full h-fit flex flex-row gap-x-5 justify-start">
              <PrimaryButton
                color="#44C3A0"
                text={globalindex.producteditindex === -1 ? "Create" : "Update"}
                type={"button"}
                onClick={() => handleSubmit()}
                radius="10px"
                width="90%"
                height="40px"
              />{" "}
              <PrimaryButton
                color="#F08080"
                text="Cancel"
                type="button"
                radius="10px"
                width="90%"
                height="40px"
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
          className={`createform  w-full max-small_phone:max-h-[50vh]
          overflow-y-auto overflow-x-hidden relative`}
        >
          <div
            className="product__form w-[100%] 
        flex flex-row gap-x-16 h-fit overflow-y-auto overflow-x-hidden items-start justify-center 
        max-smallest_screen:flex-col max-smallest_screen:items-center max-smallest_screen:justify-start
        max-smallest_screen:gap-y-10
        "
          >
            <div className="image__contianer flex flex-col items-center sticky max-smallest_screen:relative top-0 gap-y-1 w-[400px] max-small_phone:w-[97vw] h-fit">
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
                onClick={() => {
                  setopenmodal({ ...openmodal, imageupload: true });
                }}
              />
            </div>

            <div
              className="productinfo flex flex-col justify-center items-end w-1/2 
          h-fit gap-y-5
          max-smallest_screen:w-[90%]  
          "
            >
              <Input
                type="text"
                label="Product Name"
                labelPlacement="outside"
                placeholder="Name"
                name="name"
                onChange={handleChange}
                value={product.name}
                required
                size="lg"
                className="w-[100%] h-[40px]  font-bold rounded-md"
              />
              <Input
                type="text"
                label="Short Description"
                placeholder="Description"
                labelPlacement="outside"
                name="description"
                onChange={handleChange}
                value={product.description}
                required
                size="lg"
                className="w-[100%] h-[40px] text-lg pl-1 font-bold rounded-md "
              />

              <Input
                type="number"
                label="Price"
                labelPlacement="outside"
                placeholder="0.00"
                step={".01"}
                value={product.price === 0 ? "" : product.price.toString()}
                name="price"
                onChange={handleChange}
                min={0}
                max={10000}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">$</span>
                  </div>
                }
                required
                size="lg"
                className="w-[100%] h-[40px] text-lg pl-1 font-bold rounded-md "
              />
              <div className="w-full h-fit flex flex-col gap-y-5 z-50">
                <label className="font-bold text-lg">
                  Add related product (Optional)
                </label>
                <SearchAndMultiSelect />
              </div>

              <div className="category_sec flex flex-col gap-y-5  w-full h-fit font-bold">
                {loading ? (
                  <NormalSkeleton count={2} width="100%" height="40px" />
                ) : (
                  <>
                    <SelectionCustom
                      textplacement="outside"
                      label="Category"
                      placeholder="Select"
                      value={
                        product.category.parent && product.category.parent.id
                          ? `${product.category.parent.id}`
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
                    {product.category.parent ? (
                      <SelectionCustom
                        label="Sub Category"
                        textplacement="outside"
                        value={
                          product.category.child
                            ? `${product.category.child.id}`
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
                  const updateproducts = { ...product };

                  if (
                    value === ProductStockType.Size ||
                    value === ProductStockType.Stock ||
                    value === ProductStockType.Variant
                  ) {
                    updateproducts.stock = 0;
                  }

                  if (updateproducts.stocktype === ProductStockType.Variant) {
                    updateproducts.variants = undefined;
                    updateproducts.varaintstock = undefined;
                  }
                  updateproducts.stocktype = value;
                  setproduct(updateproducts);
                  setstocktype(value as any);
                }}
                required
              />
              {stocktype === ProductStockType.Stock ? (
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
                  className={`w-full h-[40px] text-lg pl-1 font-bold rounded-md`}
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
                className={`toggleMenu_section w-full h-fit p-1 transition cursor-pointer rounded-md  hover:border border-gray-400`}
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
    console.log(product.details[globalindex.productdetailindex]);
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
      (obj, idx) => idx !== index && obj.info_title === normaldetail.info_title
    );
    if (isExist) {
      errorToast("Name Already Exist");
      return;
    }
    if (index === -1) {
      updatedetail.push({
        info_title: normaldetail.info_title,
        info_type: InventoryInfoType.Text,
        info_value: [normaldetail.info_value],
      });
    } else {
      updatedetail[index].info_title = normaldetail.info_title;
      updatedetail[index].info_value[0] = normaldetail.info_value;
      updatedetail[index].info_type = InventoryInfoType.Text;
    }
    setproduct({ ...product, details: updatedetail });
    setglobalindex((prev) => ({ ...prev, productdetailindex: -1 }));
    setnormal(normaldetailinitialize);
    setopenmodal((prev) => ({ ...prev, productdetail: false }));
    //save detail
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setnormal({ ...normaldetail, [e.target.name]: e.target.value });
  };

  return (
    <div className="normalDetail w-[80%] h-full flex flex-col justify-center gap-y-5">
      <Input
        type="text"
        name="info_title"
        label="Title"
        value={normaldetail.info_title}
        onChange={handleChange}
        className="detailname w-full rounded-md text-center text-lg"
        size="lg"
      />

      <Textarea
        value={normaldetail.info_value}
        size="lg"
        className="w-full min-h-[100px] h-fit text-lg text-left overflow-y-auto rounded-lg p-2"
        label="Description"
        onChange={handleChange}
        name="info_value"
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
    <div className="details_modal bg-[#CFDBEE] w-full h-full flex flex-col gap-y-5 items-center pr-1 pl-1 pt-5 pb-5">
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
