"use client";
import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CloseIcon from "../../../public/Image/Close.svg";

import PrimaryButton, {
  ColorSelect,
  InputFileUpload,
  Selection,
} from "./Button";
import "../globals.css";
import ToggleMenu, {
  AddSubCategoryMenu,
  SearchAndMultiSelect,
} from "./ToggleMenu";
import {
  BannerInitialize,
  CateogoryInitailizestate,
  CateogoryState,
  DefaultSize,
  GlobalIndexState,
  ProductState,
  ProductStockType,
  Productinitailizestate,
  PromotionInitialize,
  SaveCheck,
  SpecificAccess,
  SubcategoriesState,
  UserState,
  Userinitialize,
  infovaluetype,
  productcoverstype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { INVENTORYENUM } from "../dashboard/products/page";
import { PrimaryPhoto } from "./PhotoComponent";
import { toast } from "react-toastify";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  ContainerLoading,
  LoadingText,
  errorToast,
  infoToast,
  successToast,
} from "./Loading";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { PasswordInput } from "./FormComponent";
import {
  Addaddress,
  Deleteaddress,
  Editprofileaction,
  VerifyEmail,
} from "../dashboard/action";
import {
  findDuplicateStockIndices,
  listofprovinces,
} from "@/src/lib/utilities";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { RGBColor, SketchPicker } from "react-color";
import tinycolor from "tinycolor2";

import { Deletevairiant } from "../dashboard/products/varaint_action";
import Cropimage from "./Cropimage";
import Variantimg from "../../../public/Image/Variant.png";
import Variantstockimg from "../../../public/Image/Stock.png";
import { CloseVector } from "./Asset";

export default function Modal({
  children,
  customZIndex,
  customwidth,
  customheight,
  closestate,
  bgblur,
  action,
}: {
  children: ReactNode;
  customZIndex?: number;
  customwidth?: string;
  customheight?: string;
  bgblur?: boolean;
  action?: () => void;
  closestate:
    | "createProduct"
    | "createBanner"
    | "createCategory"
    | "createPromotion"
    | "createUser"
    | "addsubcategory"
    | "updatestock"
    | "confirmmodal"
    | "filteroption"
    | "discount"
    | "editprofile"
    | "editsize"
    | "none"
    | string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { setopenmodal, setglobalindex, globalindex, setalldata } =
    useGlobalContext();

  return (
    <dialog
      onClick={(e) => {
        if (
          ref.current &&
          !ref.current.contains(e.target as Node) &&
          closestate !== "none"
        ) {
          const updateIndex = Object.fromEntries(
            Object.entries(globalindex).map(([key, _]) => [key, -1])
          ) as unknown as GlobalIndexState;
          action && action();
          setglobalindex(updateIndex);

          if (closestate === "createCategory") {
            setalldata((prev) => ({ ...prev, category: [] }));
          }
          setopenmodal((prev) => ({ ...prev, [closestate]: false }));
        }
      }}
      style={{ zIndex: customZIndex, overflowY: "auto" }}
      className={`modal__container z-[130] fixed flex flex-col items-center justify-center left-0 top-0 w-full h-screen ${
        bgblur ? "backdrop-blur-md" : ""
      } `}
    >
      <div
        ref={ref}
        style={{ width: customwidth, height: customheight }}
        className="w-1/2 h-1/2 flex flex-col justify-center items-center"
      >
        {children}
      </div>
    </dialog>
  );
}

const stockTypeData = [
  {
    label: "Normal",
    value: "stock",
  },
  {
    label: "Variants ( Product have multiple versions)",
    value: "variant",
  },
  { label: "Size", value: "size" },
];

export function CreateProducts() {
  const {
    openmodal,
    setopenmodal,
    product,
    setproduct,
    allData,
    globalindex,
    setglobalindex,
    isLoading,
    setisLoading,
    setreloaddata,
  } = useGlobalContext();

  const [edit, setedit] = useState({
    productdetail: false,
    productinfo: false,
  });
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
    const categories = await ApiRequest("/api/categories", setisLoading, "GET");
    if (categories.success) {
      setcate(categories.data);
      const { parent_id } = products
        ? { ...products.category }
        : { ...product.category };

      const subcates: CateogoryState = categories.data.find(
        (i: CateogoryState) => i.id === parent_id
      );

      setsubcate(subcates?.subcategories ?? []);
    } else {
      errorToast("Error Connection");
    }
  };
  const fetchproductdata = async (id: number) => {
    setloading(true);
    const request = await ApiRequest(
      `/api/products/ty=info_pid=${id}`,
      undefined,
      "GET",
      undefined,
      undefined,
      "product"
    );
    if (!request.success) {
      errorToast("Connection Problem");
      return;
    }

    const data: ProductState = request.data;

    const isExist = data.details.findIndex(
      (i) => i.info_type === ("COLOR" || "TEXT")
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
    setopenmodal((prev) => ({ ...prev, loaded: false }));
    fetchcate();
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

  useMemo(() => {
    setedit((prev) => ({ ...prev, productinfo: true }));
  }, [product.details]);

  //Method

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const createdproduct = { ...product };
    const allproduct = [...allData.product];
    const URL = "/api/products/crud";

    const checkstock = () => {
      let checked = true;
      if (stocktype === ProductStockType.stock) {
        if (
          stocktype &&
          createdproduct.stock &&
          parseInt(createdproduct.stock.toString()) === 0
        ) {
          checked = false;
        }
      } else if (stocktype === ProductStockType.variant) {
        if (!createdproduct.varaintstock) {
          checked = false;
        }
      } else if (stocktype === ProductStockType.size) {
        const size = createdproduct.details.find((i) => i.info_type === "SIZE");
        if (size) {
          const isZero = size.info_value.some((i: any) => i.qty <= 0);

          if (isZero) {
            checked = false;
          }
        }
      }
      return checked;
    };
    const checked = checkstock();

    if (!checked) {
      errorToast("Please Add Stock!");
      return;
    }

    if (product.covers.length === 0) {
      errorToast("Cover Image is Required");
      return;
    }

    if (globalindex.producteditindex === -1) {
      //createproduct
      const created = await ApiRequest(URL, setisLoading, "POST", "JSON", {
        createdproduct,
      });
      if (!created.success) {
        errorToast(created.error as string);
        return;
      }
      allproduct.push({ ...createdproduct, id: created.data.id });

      setproduct(Productinitailizestate);
      successToast(`${product.name} Created`);
    } else {
      //updateProduct

      const updated = await ApiRequest(URL, setisLoading, "PUT", "JSON", {
        id: createdproduct.id,
        name: createdproduct.name,
        description: createdproduct.description,
        price: createdproduct.price,
        category: createdproduct.category,
        stocktype: createdproduct.stocktype,
        details: createdproduct.details,
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

    setopenmodal(SaveCheck(true, "createProduct", openmodal));
    setedit((prev) => ({ ...prev, productinfo: false }));
    setopenmodal((prev) => ({ ...prev, loaded: true }));
    setreloaddata(true);
  };
  const IsAdded = (type: string) => {
    const isExist = product.details.findIndex((i) => i.info_type === type);
    if (isExist !== -1) {
      return {
        added: true,
        index: isExist,
      };
    } else {
      return { added: false, index: -1 };
    }
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
    setedit((prev) => ({ ...prev, productinfo: true }));
    setopenmodal(SaveCheck(false, "createProduct", openmodal));
  };
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "parent_id") {
      const subcates = cate?.find(
        (i) => i.id?.toString() === value
      )?.subcategories;
      setsubcate(subcates ?? []);
    }

    setproduct({
      ...product,
      category: { ...product.category, [name]: parseInt(value) },
    });
    setedit((prev) => ({ ...prev, productinfo: true }));
    setopenmodal(SaveCheck(false, "createProduct", openmodal));
  };

  const deleteImage = async (name: any) => {
    const removed = await ApiRequest(
      "/api/image",
      undefined,
      "DELETE",
      "JSON",
      { names: name }
    );

    if (!removed.success) {
      return false;
    }
    return true;
  };

  const handleCancel = async () => {
    //Remove Unsaved Image
    if (globalindex.producteditindex === -1) {
      const names = product.covers.map((i) => i.name);
      if (names.length !== 0) {
        const removedimage = await deleteImage(names);
        if (!removedimage) {
          errorToast("Error Occured");
          return;
        }
      }
    }
    if (!edit.productinfo || product.covers.length > 0) {
      setopenmodal(SaveCheck(false, "createProduct", openmodal, true));
      return;
    }
    setproduct(Productinitailizestate);
    setopenmodal({ ...openmodal, createProduct: false });
    setglobalindex({ ...globalindex, producteditindex: -1 });
  };
  return (
    <motion.dialog
      initial={{ y: 1000 }}
      animate={{ y: 0 }}
      exit={{ y: 1000 }}
      open={openmodal.createProduct}
      className="createProduct__container z-[100] flex items-center justify-center fixed top-0 left-0 bg-white min-h-screen h-fit w-screen"
    >
      {(loading || isLoading.PUT || isLoading.POST) && <ContainerLoading />}
      <form
        onSubmit={handleSubmit}
        className="createform flex flex-col w-full max-h-[95vh] overflow-y-auto items-center justify-center gap-y-5"
      >
        <div className="product__form w-[100%] flex flex-row gap-x-16 h-screen overflow-y-auto items-start justify-center">
          <div className="image__contianer flex flex-col sticky top-0 gap-y-1 w-[400px] h-fit">
            <PrimaryPhoto
              data={product.covers}
              showcount={true}
              style={{ height: "100%" }}
              hover={true}
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

          <div className="productinfo flex flex-col justify-center items-end w-1/2 h-fit gap-y-5">
            <input
              type="text"
              placeholder="ProductName"
              name="name"
              onChange={handleChange}
              value={product.name}
              required
              className="w-[100%] h-[40px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />
            <input
              type="text"
              placeholder="Short Description"
              name="description"
              onChange={handleChange}
              value={product.description}
              required
              className="w-[100%] h-[45px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />

            <input
              type="number"
              placeholder="Price"
              step={".01"}
              value={product.price === 0 ? "" : product.price}
              name="price"
              onChange={handleChange}
              min={0}
              max={10000}
              required
              className="w-[100%] h-[45px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />

            <div className="category_sec flex flex-col gap-y-5  w-full h-fit">
              <Selection
                label="Category"
                default="Select"
                defaultValue={0}
                name="parent_id"
                onChange={handleSelect}
                category={cate}
                value={product.category.parent_id}
                type="category"
                required={true}
              />
              {product.category.parent_id !== 0 && (
                <Selection
                  label="Sub Category"
                  required={true}
                  name="child_id"
                  default="Type"
                  type="subcategory"
                  subcategory={subcate}
                  onChange={handleSelect}
                  value={product.category.child_id}
                />
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
                    (i) => i.info_type === INVENTORYENUM.size
                  );
                  idx !== undefined && updateproducts.details?.splice(idx, 1);
                } else {
                  updateproducts.variants = undefined;
                  updateproducts.varaintstock = undefined;
                }
                updateproducts.stocktype = value;
                setproduct(updateproducts);
                setedit((prev) => ({ ...prev, productinfo: true }));
                setstocktype(value as any);
              }}
              required
            />
            {stocktype === ProductStockType.stock ? (
              <input
                type="number"
                placeholder="Stock"
                name="stock"
                min={0}
                max={1000}
                onChange={handleChange}
                value={product.stock === 0 ? "" : product.stock}
                required
                className="w-[100%] h-[40px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
              />
            ) : stocktype === ProductStockType.size ? (
              <div className="size_con flex flex-col justify-start gap-y-5 h-fit w-full  rounded-lg p-3">
                {IsAdded(INVENTORYENUM.size).added ? (
                  <Sizecontainer index={IsAdded("SIZE").index} />
                ) : (
                  <PrimaryButton
                    radius="10px"
                    textcolor="black"
                    Icon={
                      <i className="fa-regular fa-square-plus text-2xl"></i>
                    }
                    type="button"
                    text="Add product size"
                    width="100%"
                    onClick={() => {
                      let updatearr = [...product.details];
                      updatearr.push({
                        info_title: "Size",
                        info_value: DefaultSize,
                        info_type: INVENTORYENUM.size,
                      });
                      setproduct((prev) => ({ ...prev, details: updatearr }));
                    }}
                    height="50px"
                    color="white"
                    hoverTextColor="lightblue"
                  />
                )}
              </div>
            ) : (
              <>
                <PrimaryButton
                  radius="10px"
                  textcolor="black"
                  hoverTextColor="lightblue"
                  type="button"
                  text={
                    (
                      globalindex.producteditindex === -1
                        ? product.variants?.length !== 0
                        : product.variantcount !== 0
                    )
                      ? "Edit variants"
                      : "Create variants"
                  }
                  width="100%"
                  onClick={() => {
                    setopenmodal((prev) => ({
                      ...prev,
                      addproductvariant: true,
                    }));
                  }}
                  height="50px"
                  color="white"
                />
              </>
            )}

            <div
              onClick={() => {
                setedit({ ...edit, productdetail: !edit.productdetail });
              }}
              className={`toggleMenu_section w-full h-fit p-1 transition cursor-pointer rounded-md  hover:border border-gray-400`}
              style={{
                border: edit.productdetail ? "1px solid black" : "",
              }}
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
            <div className="w-full h-fit flex flex-col gap-y-5">
              <label className="font-bold text-lg">
                {" "}
                Add related product (Optional){" "}
              </label>
              <SearchAndMultiSelect />
            </div>
          </div>
        </div>
        <div className="w-[90%] h-fit flex flex-row gap-x-5 justify-start">
          <PrimaryButton
            color="#44C3A0"
            text={globalindex.producteditindex === -1 ? "Create" : "Update"}
            type={
              globalindex.producteditindex !== -1
                ? !edit.productinfo
                  ? "button"
                  : "submit"
                : "submit"
            }
            radius="10px"
            width="90%"
            status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
            disable={globalindex.producteditindex !== -1 && !edit.productinfo}
            height="50px"
          />{" "}
          <PrimaryButton
            color="#F08080"
            text="Cancel"
            type="button"
            radius="10px"
            width="90%"
            height="50px"
            disable={SpecificAccess(isLoading)}
            onClick={() => {
              handleCancel();
            }}
          />
        </div>
      </form>
      {openmodal.imageupload && (
        <ImageUpload limit={4} mutitlple={true} type="createproduct" />
      )}
      {openmodal.addproductvariant && <Variantcontainer closename="none" />}
    </motion.dialog>
  );
}
interface variantdatatype {
  id?: number;
  type: "COLOR" | "TEXT";
  name: string;
  value: Array<string>;
}

interface colortype {
  hex: string;
  rgb: RGBColor;
}

export const Variantcontainer = ({
  type,
  editindex,
  action,
  closename,
}: {
  closename: string;
  type?: "stock";
  editindex?: number;
  action?: () => void;
}) => {
  const { setopenmodal, product, setproduct, globalindex, setreloaddata } =
    useGlobalContext();
  const [temp, setemp] = useState<variantdatatype | undefined>(undefined);

  const [newadd, setnew] = useState<
    "variant" | "stock" | "type" | "info" | "stockinfo" | "none"
  >(type ?? "none");
  const [option, setoption] = useState("");
  const [added, setadded] = useState(-1);
  const [edit, setedit] = useState(-1);
  const [addstock, setaddstock] = useState(-1);
  const [name, setname] = useState("");
  const [stock, setstock] = useState("");
  const [loading, setloading] = useState(true);

  //Fetch variant stock
  const fetchstock = async (index: number) => {
    const URL = `/api/products/ty=${type}_pid=${index}`;
    const response = await ApiRequest(URL, undefined, "GET");
    setloading(false);
    if (!response.success) {
      errorToast("Error Connection");
      return;
    }
    setproduct((prev) => ({ ...prev, ...response.data }));
  };
  const handleUpdateVariant = async (idx: number) => {
    setloading(true);

    const updateReq = await ApiRequest(
      "/api/products/crud",
      undefined,
      "PUT",
      "JSON",
      {
        id: idx,
        ...product,
      }
    );
    setloading(false);
    if (!updateReq.success) {
      return null;
    }
    return true;
  };

  const colorinitalize: colortype = {
    hex: "#f5f5f5",
    rgb: {
      r: 245,
      g: 245,
      b: 245,
      a: 1,
    },
  };
  const [color, setcolor] = useState<colortype>(colorinitalize);
  const [open, setopen] = useState({
    addcolor: false,
    colorpicker: false,
    addoption: false,
  });

  useEffect(() => {
    setloading(false);
    editindex &&
      type &&
      type === ProductStockType.stock &&
      fetchstock(editindex);
  }, []);

  const handleCreate = () => {
    let update = product.variants;

    const isExist =
      added === -1 && update && update.find((i) => i.option_title === name);

    if (isExist) {
      errorToast("Variant name exist");
      return;
    }
    if (!update) {
      update = [
        {
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value as string[],
        },
      ];
    } else {
      if (added !== -1) {
        if (product.varaintstock) {
          const stock = [...product.varaintstock];
          const toupdate = update[added];
          stock.forEach((i) => {
            const isExist = i.variant_val.findIndex((j) =>
              toupdate.option_value.includes(j)
            );

            const idx = toupdate.option_value.findIndex((k) =>
              i.variant_val.includes(k)
            );

            if (
              isExist !== -1 &&
              idx !== -1 &&
              temp?.value[idx] !== undefined
            ) {
              i.variant_val[isExist] = temp.value[idx] as string;
            }
          });

          setproduct((prev) => ({ ...prev, varaintstock: stock }));
        }

        update[added] = {
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value as string[],
        };
      } else {
        update.push({
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value as string[],
        });
      }
    }

    setproduct((prev) => ({ ...prev, variants: update }));

    setadded(-1);
    setname("");
    setnew("variant");
  };

  const handleAddColor = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (color?.hex === "") {
      errorToast("Please Select Color");
      return;
    }
    let update = { ...temp };
    if (edit === -1) {
      update.value?.push(color.hex);
    } else if (update.value && edit !== -1) {
      if (product.varaintstock) {
        let prevvalue = update.value[edit];
        let stock = [...product.varaintstock];
        stock.forEach((i) => {
          const isValue = i.variant_val.findIndex((j) => j === prevvalue);
          if (isValue !== -1) {
            i.variant_val[isValue] = color.hex;
          }
        });
        setproduct((prev) => ({ ...prev, varaintstock: stock }));
      }
      update.value[edit] = color.hex;
    }
    setemp(update as variantdatatype);
    setcolor(colorinitalize);

    setedit(-1);
    setopen((prev) => ({ ...prev, addcolor: false }));
    successToast(edit === -1 ? "Color Added" : "Color Updated");
  };

  const handleColorSelect = (idx: number, type: "color" | "text") => {
    const data = temp?.value[idx];
    if (type === "color") {
      const rgb = tinycolor(data).toRgb();
      setedit(idx);
      setcolor({ hex: data as string, rgb: rgb });

      setopen((prev) => ({ ...prev, addcolor: true }));
    } else {
      setedit(idx);

      setoption(data as string);

      setopen((prev) => ({ ...prev, addoption: true }));
    }
  };

  const handleUpdateVariantOption = () => {
    let update = { ...temp };

    if (edit === -1) {
      update.value?.push(option);
    } else if (update.value) {
      if (product.varaintstock) {
        let preval = update.value[edit];
        let stock = [...product.varaintstock];

        stock &&
          stock.forEach((i) => {
            const isValue = i.variant_val.findIndex((i) => i === preval);
            if (isValue !== -1) {
              i.variant_val[isValue] = option;
            }
          });
        setproduct((prev) => ({ ...prev, varaintstock: stock }));
      }

      update.value[edit] = option;
      setedit(-1);
    }

    // setemp(update as variantdatatype);
    setopen((prev) => ({ ...prev, addoption: false }));
  };
  const handleVariantEdit = (idx: number) => {
    if (product.variants) {
      const data = { ...product.variants[idx] };
      if (data) {
        setname(data.option_title);
        setemp({
          name: data.option_title,
          value: [...data.option_value],
          type: data.option_type as "COLOR" | "TEXT",
        });
        setadded(idx);
        setnew("info");
      }
    }
  };
  const handleVaraintDelete = async (idx: number) => {
    let update = product.variants;
    let stock = product.varaintstock;
    if (update) {
      if (globalindex.producteditindex !== -1) {
        const makereq = Deletevairiant.bind(null, update[idx].id as number);
        const req = await makereq();
        if (!req.success) {
          errorToast(req.message ?? "Error Occured");
          return;
        }
      }

      if (stock) {
        stock.forEach((stockitem) => {
          stockitem.variant_val = stockitem.variant_val.filter(
            (value) => !update[idx].option_value.includes(value)
          );
        });

        stock = stock.filter((stockitem) => stockitem.variant_val.length > 0);
      }

      update.splice(idx, 1);
    }

    setproduct((prev) => ({ ...prev, variants: update, varaintstock: stock }));
    setnew("variant");
  };

  const handleStock = (e: ChangeEvent<HTMLInputElement>) => {
    let { value, name } = e.target;
    value = value.length === 0 ? "" : value;
    let updateProduct = { ...product };
    let stock = updateProduct.varaintstock;
    const idx = edit === -1 ? addstock : edit;
    if (name === "stock") {
      if (stock) {
        stock[idx].qty = parseInt(value);
      }
      setstock(value);
    }
    setproduct((prev) => ({ ...prev, varaintstock: stock }));
  };

  const handleCreateVariantStock = () => {
    if (!product.variants) {
      errorToast("Please Create Varaint");
      return;
    }

    let updateProduct = { ...product };
    let updatestock = updateProduct.varaintstock ?? [];

    updatestock.push({
      qty: 0,
      price: 0,
      variant_id: [],
      variant_val: Array<string>(product.variants?.length ?? 0),
    });

    setaddstock(updatestock.length - 1);
    setstock("");

    setproduct((prev) => ({ ...prev, varaintstock: updatestock }));

    setnew("stockinfo");
  };

  return (
    <Modal closestate={"none"} customZIndex={150} customheight="70vh">
      <div className="relative productvariant_creation w-full min-h-full max-h-[70vh] overflow-x-hidden overflow-y-auto bg-white flex flex-col items-center justify-start pt-5 gap-y-5">
        {loading && <ContainerLoading />}
        <h1 className="title text-xl font-semibold text-left w-full pl-2 ">
          {newadd === "variant" || newadd === "type" || newadd === "info"
            ? "Variant"
            : newadd === "stock" || newadd === "stockinfo"
            ? "Stock"
            : ""}
        </h1>

        {newadd === "variant" ? (
          <>
            <div className="w-full flex flex-col items-center gap-y-5">
              {(product.variants?.length === 0 || !product.variants) && (
                <h3 className="text-lg text-gray-500 w-[90%] rounded-lg outline outline-1 outline-gray-500 p-2">
                  No Variant
                </h3>
              )}
              {product.variants &&
                product.variants.map((obj, idx) => (
                  <motion.div
                    initial={{ x: "-120%" }}
                    animate={{ x: 0 }}
                    transition={{
                      duration: 0.2,
                    }}
                    key={idx}
                    className="relative varaint_container w-[90%] h-fit border border-black rounded-lg p-2"
                  >
                    <h3 className="variant_name font-medium text-lg w-fit h-fit">
                      {obj.option_title === "" ? "No Name" : obj.option_title}
                    </h3>
                    <motion.div className="varaints flex flex-row w-full gap-x-3">
                      {obj.option_type === "TEXT" &&
                        obj.option_value.map((item) => (
                          <div className="min-w-[40px] h-fit max-w-full break-words font-normal text-lg">
                            {item}
                          </div>
                        ))}
                      {obj.option_type === "COLOR" &&
                        obj.option_value.map((item) => (
                          <div
                            style={{ backgroundColor: item }}
                            className="w-[30px] h-[30px] rounded-3xl"
                          ></div>
                        ))}
                    </motion.div>
                    <div className="action flex flex-row items-start w-[20%] h-fit gap-x-5 absolute right-0 top-[40%]">
                      <div
                        onClick={() => handleVariantEdit(idx)}
                        className="edit text-sm cursor-pointer text-blue-500 hover:text-white active:text-white transition duration-500"
                      >
                        Edit
                      </div>
                      <div
                        onClick={() => handleVaraintDelete(idx)}
                        className="edit text-sm cursor-pointer text-red-500 hover:text-white active:text-white transition duration-500"
                      >
                        Delete
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </>
        ) : (
          // stock__container
          //
          //
          (newadd === "stock" || newadd === "stockinfo") && (
            <div className="stock_container w-full h-fit">
              {newadd === "stockinfo" ? (
                <div className="createstock_container flex flex-col w-full h-full items-center justify-start mt-2">
                  <h2 className="text-lg font-medium">
                    Please Choose Variants
                  </h2>
                  <div className="variantlist relative outline outline-2 outline-gray-300 rounded-lg flex flex-col items-center justify-start gap-y-10 w-[90%] h-full max-h-[60vh] p-5 overflow-y-auto">
                    {product.variants &&
                      product.variants.map((i, idx) => (
                        <ColorSelect
                          key={i.option_title}
                          index={idx}
                          type={i.option_type}
                          label={i.option_title}
                          width="80%"
                          height="35px"
                          data={i.option_value}
                          edit={edit}
                          added={addstock}
                          value={
                            product.varaintstock && edit !== -1
                              ? product.varaintstock[edit].variant_val[idx]
                              : undefined
                          }
                        />
                      ))}
                  </div>
                  <div className="w-[90%] absolute bottom-3 flex flex-row gap-x-3">
                    <input
                      className="stock w-[100%] text-sm bottom-3 font-medium p-2 h-[40px] rounded-lg outline outline-1 outline-black"
                      name="stock"
                      placeholder="Stock"
                      type="number"
                      value={stock}
                      onChange={handleStock}
                    />
                  </div>
                </div>
              ) : (
                <div className="selectvariaint_container flex flex-col items-center justify-start gap-y-10 w-full h-full">
                  <div className="liststock_container grid grid-cols-3 gap-x-3 w-[90%] h-fit p-1 max-h-[46vh] overflow-y-auto">
                    {(product.varaintstock?.length === 0 ||
                      !product.varaintstock) && (
                      <h3 className="text-lg text-gray-500 w-full outline outline-1 outline-gray-500 p-2 rounded-lg">
                        No Stock
                      </h3>
                    )}
                    {product.varaintstock &&
                      product.varaintstock.map((i, idx) => (
                        <div
                          key={idx}
                          style={
                            i.qty <= 1
                              ? {
                                  borderLeft: "5px solid red",
                                }
                              : {}
                          }
                          className="stockcard w-full h-[50px] flex flex-row items-center justify-evenly p-2 outline outline-2 outline-gray-300 rounded-lg transition duration-200 hover:bg-gray-300"
                        >
                          <h3 className="name text-lg font-semibold w-full">
                            Stock {idx + 1}
                          </h3>
                          <div className="action w-full flex flex-row items-center justify-evenly">
                            <h3
                              onClick={() => {
                                //Edit Stock
                                setedit(idx);
                                setstock(i.qty.toString());
                                setnew("stockinfo");
                              }}
                              className="w-fit h-fit text-lg font-normal text-blue-500 transition duration-200 cursor-pointer hover:text-black"
                            >
                              Edit
                            </h3>
                            <h3
                              onClick={() => {
                                //Delete Stock
                                const updatestock = product.varaintstock;
                                updatestock && updatestock.splice(idx, 1);
                                setproduct((prev) => ({
                                  ...prev,
                                  varaintstock: updatestock,
                                }));
                              }}
                              className="w-fit h-fit text-lg font-normal text-red-500 transition duration-200 cursor-pointer hover:text-black"
                            >
                              Delete
                            </h3>
                          </div>
                        </div>
                      ))}
                  </div>

                  <PrimaryButton
                    text={"Add Stock"}
                    type="button"
                    width="90%"
                    radius="10px"
                    height="40px"
                    textsize="12px"
                    onClick={() => {
                      //create stock
                      handleCreateVariantStock();
                    }}
                  />

                  {/*  */}
                </div>
              )}
            </div>
          )
        )}

        {newadd === "type" && (
          <>
            <Selection
              default="Chose Type"
              style={{ width: "90%" }}
              onChange={(e) => {
                setemp({
                  name: "",
                  value: [],
                  type: e.target.value as any,
                });
                setnew("info");
              }}
              data={[
                {
                  label: "Color",
                  value: "COLOR",
                },
                { label: "Text", value: "TEXT" },
              ]}
            />
            <PrimaryButton
              text="Back"
              type="button"
              onClick={() => setnew("variant")}
              radius="10px"
              width="90%"
              height="35px"
            />
          </>
        )}
        {newadd === "info" && (
          <div className="addcontainer w-[95%] h-full flex flex-col gap-y-5 rounded-lg p-2">
            <input
              name="name"
              placeholder="Variant Name"
              value={name}
              onChange={(e) => setname(e.target.value)}
              className="text-sm font-medium pl-1 h-[40px] w-full border-2 border-gray-300 rounded-md"
            />
            {temp && temp.type === "COLOR" ? (
              <div className="color_container w-full h-fit flex flex-col gap-y-5">
                <h3
                  onClick={() => {
                    setedit(-1);

                    setcolor(colorinitalize);
                    setopen((prev) => ({ ...prev, addcolor: true }));
                  }}
                  className={`cursor-pointer transition duration-200 w-fit h-fit text-sm ${
                    open.addcolor ? "text-gray-500" : "text-blue-500"
                  } font-normal hover:text-white active:text-white`}
                >
                  {" "}
                  Add Color
                </h3>

                {/* Modal */}
                {open.addcolor && (
                  <Modal
                    closestate="none"
                    customwidth="30vw"
                    customheight="30vh"
                  >
                    <form
                      onSubmit={handleAddColor}
                      className="relative w-full h-full bg-white flex flex-col items-center justify-center gap-y-3 p-3"
                    >
                      <label
                        htmlFor="color"
                        className="font-semibold text-sm w-full text-left"
                      >
                        {" "}
                        Color{" "}
                        <strong className="text-red-400 text-lg font-normal">
                          *
                        </strong>{" "}
                      </label>
                      <div
                        onClick={() => {
                          setopen((prev) => ({
                            ...prev,
                            colorpicker: true,
                          }));
                        }}
                        className={`w-[100%] h-[50px] border-[5px] border-gray-300 rounded-lg`}
                        style={
                          edit === -1
                            ? {
                                background: `rgba(${color?.rgb.r},${color?.rgb.g},${color?.rgb.b},${color?.rgb.a})`,
                              }
                            : {
                                backgroundColor: color.hex,
                              }
                        }
                      ></div>
                      <PrimaryButton
                        text={edit === -1 ? "Confirm" : "Update"}
                        type="submit"
                        disable={color.hex === ""}
                        width="100%"
                        textsize="13px"
                        radius="10px"
                        height="35px"
                      />
                      <div className="action-btn flex flex-row w-full gap-x-3">
                        <PrimaryButton
                          text="Delete"
                          color="lightcoral"
                          type="button"
                          onClick={() => {
                            if (edit !== -1) {
                              let update = { ...temp };
                              update?.value?.splice(edit, 1);
                              setemp(update as variantdatatype);
                              setedit(-1);
                            }

                            setopen((prev) => ({
                              ...prev,
                              addcolor: false,
                            }));
                          }}
                          width="100%"
                          textsize="12px"
                          radius="10px"
                          height="35px"
                        />
                        <PrimaryButton
                          text="Close"
                          color="black"
                          type="button"
                          onClick={() => {
                            setedit(-1);
                            setopen((prev) => ({
                              ...prev,
                              addcolor: false,
                            }));
                          }}
                          width="100%"
                          textsize="12px"
                          radius="10px"
                          height="35px"
                        />
                      </div>
                      {open.colorpicker && (
                        <div className="absolute w-fit h-fit top-0">
                          {" "}
                          <SketchPicker
                            width="29vw"
                            color={color.rgb as any}
                            onChange={(value, _) => {
                              setcolor({
                                hex: value.hex,
                                rgb: value.rgb as any,
                              });
                            }}
                          />{" "}
                          <PrimaryButton
                            text="Close"
                            color="lightcoral"
                            type="button"
                            onClick={() => {
                              setopen((prev) => ({
                                ...prev,
                                colorpicker: false,
                              }));
                            }}
                            width="100%"
                            textsize="10px"
                            height="30px"
                          />
                        </div>
                      )}
                    </form>
                  </Modal>
                )}

                {/* end */}

                <div className="listcolor flex flex-row flex-wrap gap-x-3 gap-y-3 w-full">
                  {temp?.value?.some((i) => i !== "") ? (
                    temp?.value?.map((color, idx) => (
                      <div
                        className={`color w-[50px] h-[50px] rounded-3xl transition duration-500 hover:border-2 hover:border-gray-300 active:border-2  active:border-gray-300`}
                        onClick={() => handleColorSelect(idx, "color")}
                        style={
                          color !== ""
                            ? {
                                backgroundColor: color,
                              }
                            : {}
                        }
                      ></div>
                    ))
                  ) : (
                    <h3 className="warn_mess text-lg text-black font-normal">
                      No Color Added Yet
                    </h3>
                  )}
                </div>
              </div>
            ) : (
              <>
                {open.addoption && (
                  <Modal closestate="none" customZIndex={150}>
                    <form className="addoption w-1/3 h-1/3 bg-white p-3 flex flex-col gap-y-5 items-center justify-start">
                      <input
                        name="option"
                        placeholder="Option (Required)"
                        type="text"
                        value={option}
                        onChange={(e) => setoption(e.target.value)}
                        className="text-sm font-medium pl-1 h-[50px] w-full border-2 border-gray-300 rounded-md"
                      />
                      <div className="action-btn flex flex-row w-full gap-x-3">
                        <PrimaryButton
                          text={edit === -1 ? "Create" : "Update"}
                          color="#35C191"
                          type="button"
                          disable={option === ""}
                          onClick={() => {
                            handleUpdateVariantOption();
                          }}
                          width="100%"
                          textsize="12px"
                          radius="10px"
                          height="35px"
                        />
                        <PrimaryButton
                          text="Back"
                          color="black"
                          type="button"
                          onClick={() => {
                            setopen((prev) => ({
                              ...prev,
                              addoption: false,
                            }));
                          }}
                          width="100%"
                          textsize="12px"
                          radius="10px"
                          height="35px"
                        />
                      </div>
                    </form>
                  </Modal>
                )}
                <div className="text-container flex flex-col items-center justify-start gap-y-3">
                  <h3
                    onClick={() => {
                      setedit(-1);
                      setoption("");
                      setopen((prev) => ({ ...prev, addoption: true }));
                    }}
                    className="text-sm w-ft h-fit cursor-pointer font-medium text-blue-500 transition duration-300 hover:text-gray-300 active:text-gray-300"
                  >
                    Add Option
                  </h3>
                  <div className="opitonlist flex flex-row gap-x-3 w-full items-start justify-start h-fit">
                    {temp?.value.length === 0 && (
                      <h3 className="warn_mess text-lg text-black font-normal">
                        No Option Yet
                      </h3>
                    )}
                    {temp?.value.map((i, idx) => (
                      <h3
                        onClick={() => handleColorSelect(idx, "text")}
                        className="option text-[15px] cursor-pointer p-2 rounded-lg text-black outline outline-2 outline-black font-normal transition duration-200 w-fit h-fit"
                      >
                        {i}
                      </h3>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="flex flex-row gap-x-5 w-full h-[35px]">
              <PrimaryButton
                text={`${added === -1 ? "Create" : "Update"}`}
                type="button"
                disable={name === "" || temp?.value.length === 0}
                textsize="12px"
                onClick={() => handleCreate()}
                radius="10px"
                width="100%"
                height="100%"
              />
              <PrimaryButton
                text="Back"
                color="lightcoral"
                type="button"
                textsize="12px"
                onClick={() => {
                  setedit(-1);
                  setemp(undefined);
                  setnew("variant");
                }}
                radius="10px"
                width="100%"
                height="100%"
              />
            </div>
          </div>
        )}
        {newadd === "variant" && (
          <PrimaryButton
            text="Add new"
            type="button"
            onClick={() => {
              setname("");
              setadded(-1);
              setedit(-1);
              setnew("type");
            }}
            radius="10px"
            width="90%"
            textsize="12px"
            height="40px"
          />
        )}
        {newadd === "none" && (
          <div className="w-[90%]  flex flex-row justify-start items-center gap-x-3">
            <div
              onClick={() => setnew("variant")}
              className="card w-[50%] h-[200px] bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
            >
              <Image
                src={Variantimg}
                alt="Icon"
                className="w-[70px] h-[70px[ object-contain pb-10"
              />
              <h3 className="text-2xl font-bold w-fit h-fit text-black flex flex-row gap-x-3 items-center">
                {`${
                  !product.variants || product.variants.length === 0
                    ? "Create"
                    : ""
                } Variant`}
                <div
                  style={
                    !product.variants || product.variants.length === 0
                      ? { display: "none" }
                      : {}
                  }
                  className="font-bold min-w-[30px] w-fit h-fit p-1 bg-black text-white rounded-lg grid place-content-center"
                >
                  {" "}
                  <p className="w-fit h-fit text-[15px]">
                    {product.variants?.length}
                  </p>
                </div>
              </h3>
            </div>
            <div
              onClick={() => setnew("stock")}
              className="card w-[50%] h-[200px] bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
            >
              <Image
                src={Variantstockimg}
                alt="Icon"
                className="w-[70px] h-[70px[ object-contain pb-10"
              />
              <h3 className="text-2xl font-bold w-fit h-fit text-black">
                {`${
                  !product.varaintstock || product.varaintstock.length === 0
                    ? "Create"
                    : ""
                } Stock`}
                <div
                  style={
                    !product.varaintstock || product.varaintstock.length === 0
                      ? { display: "none" }
                      : {}
                  }
                  className="font-bold min-w-[30px] w-fit h-fit p-1 bg-black text-white rounded-lg grid place-content-center"
                >
                  {" "}
                  <p className="w-fit h-fit text-[15px]">
                    {product.varaintstock?.length}
                  </p>
                </div>
              </h3>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-row justify-start w-full h-fit">
        {newadd === "stockinfo" && (
          <PrimaryButton
            text="Delete"
            type="button"
            onClick={() => {
              let updatestock = product.varaintstock;

              console.log(updatestock);
              updatestock && updatestock.splice(addstock, 1);
              setaddstock(-1);
              setproduct((prev) => ({
                ...prev,
                varaintstock: updatestock,
              }));
              setnew("stock");
            }}
            width="100%"
            height="50px"
            color="#674C54"
          />
        )}

        <PrimaryButton
          text={
            newadd === "stock" ||
            newadd === "variant" ||
            newadd === "stockinfo" ||
            newadd === "info"
              ? "Back"
              : "Close"
          }
          type="button"
          onClick={async () => {
            if (
              newadd === "stock" ||
              newadd === "variant" ||
              newadd === "stockinfo" ||
              newadd === "info"
            ) {
              if (newadd === "stockinfo") {
                if (parseInt(stock) === 0 || !stock) {
                  errorToast("Please enter stock");
                  return;
                }

                if (product.varaintstock) {
                  const checkstock = product.varaintstock[
                    addstock === -1 ? edit : addstock
                  ].variant_val.every((i) => i === "");

                  if (stock === "" || checkstock) {
                    errorToast("Please fill all required");
                    return;
                  } else {
                    const checkduplicate = findDuplicateStockIndices(
                      product.varaintstock
                    );
                    if (checkduplicate.length !== 0) {
                      errorToast(`Stock exist`);
                      return;
                    }

                    setedit(-1);
                    setadded(-1);
                    setstock("");
                    setnew("stock");
                  }
                }
              } else {
                if (type) {
                  //update product variant stock
                  setloading(true);
                  const update = await ApiRequest(
                    "/api/products/crud",
                    undefined,
                    "PUT",
                    "JSON",
                    {
                      varaintstock: product.varaintstock,
                      id: editindex,
                      type: "editvariantstock",
                    }
                  );
                  setloading(false);
                  if (!update) {
                    errorToast("Failed to update stock");
                    return;
                  }
                  setnew("stock");
                  setreloaddata(true);

                  setopenmodal((prev) => ({
                    ...prev,
                    [closename]: false,
                  }));
                  return;
                }

                setnew("none");
              }
            } else {
              const idx = globalindex.producteditindex;
              if (idx !== -1) {
                const update = await handleUpdateVariant(idx);
                if (!update) {
                  errorToast("Failed to update variant please try again");
                  return;
                }
              }

              setopenmodal((prev) => ({ ...prev, addproductvariant: false }));
            }
          }}
          width="100%"
          height="50px"
          color="lightcoral"
        />
      </div>
    </Modal>
  );
};

interface SizecontainerProps {
  index: number;
  closename?: string;
  type?: "edit";
  action?: () => void;
}

export const Sizecontainer = (props: SizecontainerProps) => {
  const [customvalue, setvalue] = useState("");
  const [addnew, setaddnew] = useState(false);
  const [qty, setqty] = useState(0);
  const [Edit, setedit] = useState({
    isEdit: false,
    index: -1,
  });
  const { product, setproduct, setreloaddata } = useGlobalContext();
  const [loading, setloading] = useState(true);

  const fetchsize = async () => {
    setloading(true);
    const URL = `/api/products/ty=size_pid=${props.index}`;
    const response = await ApiRequest(URL, undefined, "GET");
    setloading(false);
    if (!response.success) {
      errorToast("Error Connection");
      return;
    }

    setproduct((prev) => ({ ...prev, details: response.data }));
  };

  useEffect(() => {
    props.type && fetchsize();
  }, []);
  const handleAdd = async () => {
    const detail = [...product.details];
    const idx = props.type
      ? detail.findIndex((i) => i.info_type === "SIZE")
      : props.index;
    const prevarr = detail[idx].info_value;

    if (customvalue === "" || !qty) {
      errorToast("Please fill all Required");
      return;
    }

    //add and edit size

    if (Edit.index !== -1) {
      prevarr[Edit.index] = {
        qty: qty,
        val: customvalue,
      };
    } else {
      prevarr.push({
        qty: qty,
        val: customvalue,
      } as any);
    }
    detail[idx].info_value = prevarr as any;

    if (props.index) {
      const updatereq = await handleUpdate();
      if (!updatereq) {
        errorToast("Failed Update Stock");
        return;
      }
    }

    setproduct({ ...product, details: detail });

    setedit({
      isEdit: false,
      index: -1,
    });

    setqty(0);
    setvalue("");
    setaddnew(false);
  };
  const handleDelete = (index: number) => {
    const detail = [...product.details];
    const idx = props.type
      ? detail.findIndex((i) => i.info_type === "SIZE")
      : props.index;
    const updatearr = [...product.details[idx].info_value];

    updatearr.splice(index, 1);
    detail[idx].info_value = updatearr as any;
    setproduct({ ...product, details: detail });
  };
  const handleUpdate = async () => {
    setloading(true);
    const URL = "/api/products/crud";
    const request = await ApiRequest(URL, undefined, "PUT", "JSON", {
      type: "editsize",
      details: product.details,
      id: props.index,
    });
    setloading(false);

    if (!request.success) {
      return null;
    }
    return true;
  };

  const SizeElements = (bg: boolean) => {
    return (
      <div
        style={
          bg
            ? {
                backgroundColor: "white",
                padding: "20px",
                outline: "0",
                borderRadius: "10px",
                width: "100%",
                maxHeight: "500px",
              }
            : {}
        }
        className="size__contianer w-full max-h-[500px] h-fit flex flex-col gap-y-5 outline-2 outline p-3 outline-gray-300 rounded-lg"
      >
        <div
          className="size_list grid grid-cols-4 w-fit gap-x-5 gap-y-5 h-full"
          style={{
            outline: "2px solid lightgray",
            width: "100%",
            padding: "10px",
          }}
        >
          {product.details &&
            product.details
              .find((i) => i.info_type === "SIZE")
              ?.info_value.map((i, idx) => {
                const val = i as infovaluetype;
                return (
                  <div
                    key={idx}
                    className="size flex flex-row z-[100] justify-center bg-[#495464] rounded-lg w-[100px]  p-3 h-fit text-center font-bold"
                    style={
                      Edit.index === idx
                        ? { backgroundColor: "black", color: "white" }
                        : val.qty <= 1
                        ? { backgroundColor: "lightcoral", color: "white" }
                        : {}
                    }
                  >
                    <span
                      onClick={() => handleDelete(idx)}
                      className="relative -top-5 left-[100%] transition hover:-translate-y-1"
                    >
                      <i className="fa-solid fa-minus font-bold text-white  text-[10px] bg-[#F08080] rounded-2xl p-1"></i>
                    </span>

                    <h3
                      onClick={() => {
                        setedit((prev) => ({
                          isEdit: !prev.isEdit,
                          index: prev.index === idx ? -1 : idx,
                        }));

                        setaddnew(!(Edit.index === idx));

                        setqty(Edit.index === idx ? 0 : val.qty);

                        setvalue(Edit.index === idx ? "" : val.val);
                      }}
                      className={`relative w-full h-full break-words right-2 text-white`}
                    >
                      {val.val}
                    </h3>
                  </div>
                );
              })}
        </div>
        <p
          onClick={() => {
            setaddnew(!addnew);
            setedit({ isEdit: false, index: -1 });
            setvalue("");
            setqty(0);
          }}
          className={`text-sm font-bold ${
            addnew ? "text-red-500" : "text-blue-500"
          } w-fit h-fit border-b-2 border-b-black transition-all duration-300 hover:text-white active:text-white hover:pb-5 cursor-pointer`}
        >
          {`${addnew ? "Close" : "Add New"}`}
        </p>
        {addnew && (
          <>
            <div className="w-full h-fit">
              <label htmlFor="qty" className="text-lg font-semibold">
                Size <strong className="text-red-500">*</strong>
              </label>
              <input
                type="text"
                placeholder="Size (Required)"
                name="size"
                value={customvalue}
                onChange={(e) => setvalue(e.target.value)}
                className="w-[100%] h-[35px] text-sm pl-1 font-bold bg-[#D9D9D9] rounded-md "
              />
            </div>
            <div className="w-full h-fit">
              <label htmlFor="qty" className="text-lg font-semibold">
                Stock <strong className="text-red-500">*</strong>
              </label>
              <input
                type="number"
                placeholder="Stock"
                name="qty"
                value={qty}
                onChange={(e) => setqty(parseInt(e.target.value))}
                className="w-[100%] h-[35px] text-sm pl-1 font-bold bg-[#D9D9D9] rounded-md "
              />
            </div>
            <div className="w-full h-fit flex flex-row gap-x-5">
              <PrimaryButton
                color="#44C3A0"
                text={Edit.index === -1 ? "Add" : "Update"}
                type="button"
                radius="10px"
                onClick={() => handleAdd()}
                width="100%"
                textsize="12px"
                disable={customvalue === "" || !qty}
                height="30px"
              />
              {!props.type && (
                <PrimaryButton
                  color="#F08080"
                  text={"Delete"}
                  onClick={() => {
                    let updatearr = [...product.details];
                    updatearr.splice(props.index, 1);
                    setproduct({ ...product, details: updatearr });
                  }}
                  type="button"
                  radius="10px"
                  width="100%"
                  textsize="12px"
                  height="30px"
                />
              )}
            </div>{" "}
          </>
        )}
      </div>
    );
  };

  return props.type && props.closename ? (
    <Modal
      closestate={props.closename}
      customheight="fit-content"
      action={() => {
        setreloaddata(true);
      }}
    >
      {loading && <ContainerLoading />}
      {SizeElements(true)}
    </Modal>
  ) : (
    SizeElements(false)
  );
};

export const DetailsModal = () => {
  const { setopenmodal } = useGlobalContext();

  return (
    <div className="details_modal bg-[#CFDBEE] w-full h-full flex flex-col gap-y-5 p-14">
      <NormalDetail />
      <PrimaryButton
        width="100%"
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
//

//Create Category
export const Category = () => {
  const {
    openmodal,
    setopenmodal,
    category,
    setcategory,
    allData,
    setalldata,
    isLoading,
    setisLoading,
  } = useGlobalContext();
  const [show, setshow] = useState<"Create" | "Edit">("Create");

  const handleAdd = async () => {
    const cate = { ...category };
    const allcate = [...allData.category];
    const isExist = allcate.some((obj) => obj.name === cate.name);
    if (isExist) {
      errorToast("Category Existed");
      return;
    }

    //Save To DB
    const saved = await ApiRequest(
      "/api/categories",
      setisLoading,
      "POST",
      "JSON",
      cate
    );
    if (!saved.success) {
      errorToast("Failed To Create");
      return;
    }
    allcate.push({ ...cate, id: saved.data.id });
    setalldata((prev) => ({ ...prev, category: allcate }));
    setcategory(CateogoryInitailizestate);
    successToast("Category Created");
  };
  const handleCancel = () => {
    if (!openmodal.confirmmodal.confirm) {
      setopenmodal(SaveCheck(false, "createCategory", openmodal, true));
    } else {
      setalldata((prev) => ({ ...prev, category: [] }));
      setcategory(CateogoryInitailizestate);
      setopenmodal((prev) => ({ ...prev, createCategory: false }));
    }
  };
  const handleNavbar = (show: "Create" | "Edit") => {
    setshow(show);
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
    setcategory(CateogoryInitailizestate);
  };

  //category navbar

  const CategoryNavBar = () => {
    return (
      <div className="category__navbar w-[80%] h-[50px] flex flex-row items-center">
        <h3
          onClick={() => handleNavbar("Create")}
          className="category_header w-[50%] text-center text-lg font-semibold transition hover:-translate-y-1 cursor-pointer"
          style={show === "Create" ? { borderBottom: "3px solid #495464" } : {}}
        >
          Create
        </h3>
        <h3
          onClick={() => handleNavbar("Edit")}
          className="category_header w-[50%] text-center text-lg font-semibold transition hover:-translate-y-1 cursor-pointer"
          style={show === "Edit" ? { borderBottom: "3px solid #495464" } : {}}
        >
          Edit
        </h3>
      </div>
    );
  };
  return (
    <Modal closestate="createCategory" customheight="600px">
      <motion.div
        initial={{ y: 1000 }}
        animate={{ y: 0 }}
        exit={{ y: -1000 }}
        className="category relative rounded-md p-2 w-full min-h-[600px] max-h-[700px] flex flex-col bg-white gap-y-5 justify-start items-center"
      >
        <CategoryNavBar />
        {show === "Create" ? (
          <>
            <input
              placeholder="Category Name"
              onChange={(e) => {
                setcategory((prev) => ({ ...prev, name: e.target.value }));
                setopenmodal(SaveCheck(false, "createCategory", openmodal));
              }}
              type="text"
              name="name"
              value={category.name}
              className="name w-[80%] h-[50px] text-lg font-bold border border-gray-400 pl-1 rounded-md bg-white"
            />
            {openmodal.addsubcategory ? (
              <div className="w-[80%] max-h-[500px]">
                <AddSubCategoryMenu index={-1} />
              </div>
            ) : (
              <PrimaryButton
                width="80%"
                height="50px"
                radius="10px"
                onClick={() =>
                  category.name.length > 0 &&
                  setopenmodal((prev) => ({ ...prev, addsubcategory: true }))
                }
                text={
                  category.subcategories.length > 0
                    ? "Open Subcategory"
                    : "Add Subcategory"
                }
                type="button"
                disable={category.name.length === 0}
              />
            )}
            <div className="flex flex-row justify-start gap-x-5 h-[50px] w-[90%] absolute bottom-5">
              <PrimaryButton
                width="100%"
                height="100%"
                radius="10px"
                onClick={() => category.name.length > 0 && handleAdd()}
                text="Create"
                status={
                  !SpecificAccess(isLoading) ? "authenticated" : "loading"
                }
                color="#35C191"
                type="button"
                disable={category.name.length === 0}
              />
              <PrimaryButton
                width="100%"
                height="100%"
                radius="10px"
                text="Cancel"
                onClick={() => handleCancel()}
                color="lightcoral"
                type="button"
              />{" "}
            </div>
          </>
        ) : (
          <EditCategory />
        )}
      </motion.div>
    </Modal>
  );
};

const EditCategory = () => {
  const {
    allData,
    category,
    setcategory,
    setalldata,
    openmodal,
    setopenmodal,
    globalindex,
    setglobalindex,
    isLoading,
    setisLoading,
  } = useGlobalContext();
  const [editindex, seteditindex] = useState(-1);
  const [tempcate, settempcate] = useState<CateogoryState[]>([]);

  const [edit, setedit] = useState(false);

  //API Request
  const URL = "/api/categories";
  const fetchAllCate = async () => {
    const request = await ApiRequest(URL, setisLoading, "GET");
    if (request.success) {
      setalldata((prev) => ({ ...prev, category: request.data }));
    }
  };

  useEffect(() => {
    fetchAllCate();
  }, []);

  /////

  const handleClick = (index: number) => {
    setedit(!edit);
    seteditindex(index);
    setcategory(allData.category[index]);
  };
  const handleDelete = async () => {
    const deleterequest = await ApiRequest(
      URL,
      setisLoading,
      "DELETE",
      "JSON",
      {
        id: globalindex.categoryeditindex,
      }
    );

    if (deleterequest.success && !isLoading.DELETE) {
      settempcate([]);
      setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
      successToast("Category Deleted");
    } else {
      handleReset();
      errorToast(deleterequest.error as string);
    }
  };

  const handleConfirm = async () => {
    if (category.name.length === 0) {
      toast.error("Name Is Requred", { autoClose: 2000, pauseOnHover: true });
      return;
    }

    const updateRequest = await ApiRequest(
      URL,
      setisLoading,
      "PUT",
      "JSON",
      category
    );
    if (updateRequest.success && !isLoading.PUT) {
      let allcate = [...allData.category];

      allcate[editindex].name = category.name;
      allcate[editindex].subcategories = category.subcategories;
      setalldata((prev) => ({ ...prev, category: allcate }));
      setedit(false);
      seteditindex(-1);
      successToast("Category Updated");
    } else {
      errorToast("Failed To Update");
    }
  };
  const handleReset = () => {
    let deletedcate = [...tempcate];
    let allcate = [...allData.category];
    const resetcate = deletedcate.filter((obj) =>
      globalindex.categoryeditindex.includes(obj.id as number)
    );
    resetcate.forEach((obj) => allcate.push(obj));
    setalldata((prev) => ({ ...prev, category: allcate }));
    settempcate([]);
    setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
  };
  return (
    <>
      <div className="EditCategory w-[90%] h-full overflow-y-auto  flex flex-col gap-y-5 p-1">
        {!edit ? (
          <>
            {isLoading.GET ? (
              <LoadingText />
            ) : (
              allData.category.length === 0 && (
                <h1 className="text-lg text-red-400 font-bold text-center">
                  No Category
                </h1>
              )
            )}
            {allData.category.map((obj, idx) => (
              <motion.div
                key={idx}
                initial={{ x: "-120%" }}
                animate={{ x: 0 }}
                transition={{
                  duration: 0.2,
                }}
                className="parentcategory w-full bg-white outline outline-2 outline-black outline-offset-1 h-fit min-h-[50px] rounded-lg flex flex-row items-center gap-x-5"
              >
                <p
                  onClick={() => handleClick(idx)}
                  className="parentcateogry text-xl transition duration-300 hover:text-white font-bold w-full h-full break-all flex items-center justify-center cursor-pointer text-center rounded-lg "
                >
                  {obj.name}
                </p>
                <p
                  onClick={() => {
                    let categorydeleteindex = [
                      ...globalindex.categoryeditindex,
                    ];
                    let allcate = [...allData.category];
                    let copytemp = [...tempcate];
                    copytemp.push(allcate[idx]);
                    allcate.splice(idx, 1);

                    setalldata((prev) => ({ ...prev, category: allcate }));
                    settempcate(copytemp);

                    categorydeleteindex.push(obj.id as number);
                    setglobalindex((prev) => ({
                      ...prev,
                      categoryeditindex: categorydeleteindex,
                    }));
                  }}
                  className="actions text-red-500 font-bold text-lg cursor-pointer w-1/2 h-full transition duration-300 rounded-lg  flex items-center justify-center hover:text-white active:text-white"
                >
                  {" "}
                  Delete
                </p>
              </motion.div>
            ))}{" "}
          </>
        ) : (
          <div className="editcontainer flex flex-col gap-y-3 w-full h-full bg-white p-2">
            <input
              type="text"
              onChange={(e) =>
                setcategory((prev) => ({ ...prev, name: e.target.value }))
              }
              value={category.name}
              className="subcate_name w-full h-[50px] border border-gray-300 pl-3 text-lg font-bold"
              placeholder="Parent Cateogory Name"
            />
            <AddSubCategoryMenu index={editindex} />
            <div className="w-full h-fit flex flex-row gap-x-5 justify-start">
              <PrimaryButton
                type="button"
                text="Confirm"
                onClick={() => handleConfirm()}
                width="100%"
                height="50px"
                radius="10px"
                status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
              />
              <PrimaryButton
                type="button"
                text="Back"
                onClick={() => {
                  setedit(false);
                  setcategory(CateogoryInitailizestate);
                }}
                width="100%"
                color="lightpink"
                height="50px"
                radius="10px"
              />
            </div>
          </div>
        )}
      </div>
      {globalindex.categoryeditindex.length > 0 && (
        <div className="flex flex-row gap-x-5 w-full h-fit">
          <PrimaryButton
            type="button"
            text="Confirm"
            onClick={() => handleDelete()}
            status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
            width="100%"
            height="50px"
            radius="10px"
          />
          <PrimaryButton
            type="button"
            text="Reset"
            onClick={() => {
              handleReset();
            }}
            width="100%"
            disable={globalindex.categoryeditindex.length === 0}
            color="lightcoral"
            height="50px"
            radius="10px"
          />
        </div>
      )}
    </>
  );
};

//
//

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
        info_type: INVENTORYENUM.normal,
        info_value: [normaldetail.info_value],
      });
    } else {
      updatedetail[index].info_title = normaldetail.info_title;
      updatedetail[index].info_value[0] = normaldetail.info_value;
      updatedetail[index].info_type = INVENTORYENUM.normal;
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
    <div className="normalDetail w-full h-full flex flex-col justify-center gap-y-5">
      <input
        type="text"
        name="info_title"
        value={normaldetail.info_title}
        placeholder="Name"
        onChange={handleChange}
        className="detailname w-full rounded-md h-[50px] text-center text-lg"
      />
      <textarea
        value={normaldetail.info_value}
        className="w-full min-h-[50px] max-h-[100px] text-center overflow-y-auto"
        placeholder="Description"
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

//Image Upload

interface imageuploadprops {
  limit: number;
  mutitlple: boolean;
  type: "createproduct" | "createbanner" | "createpromotion";
}
export type Imgurl = {
  url: string;
  type: string;
  name: string;
  isSave?: boolean;
  id?: number;
};
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
  const [crop, setcrop] = useState(false);
  const [selectedImg, setselected] = useState(-1);
  const [isEdit, setisEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files;
    const updateUrl = [...Imgurl];
    if (Imgurltemp.length > 0 && globalindex.producteditindex !== -1) {
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

      seturl(updateUrl);
      setfiles((prev) => [...prev, ...filteredFile]);
      setisEdit(true);
      filteredFileUrl.length > 0 && seturltemp([]);
    }
  };

  //Delete Image
  const handleDelete = (index: number) => {
    const updateUrl = [...Imgurl];
    const updatefile = [...Files];
    const temp = updateUrl[index];

    updatefile.splice(index, 1);

    updateUrl.splice(index, 1);

    seturltemp((prev) => [...prev, { ...temp }]);
    seturl(updateUrl);
    setisEdit(true);
    setfiles(updatefile);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //Update Product when saved
  const handleUpdateCover = async (data: productcoverstype[]) => {
    const updateProduct = await ApiRequest(
      "/api/products/crud",
      undefined,
      "PUT",
      "JSON",
      { ...product, covers: data }
    );

    if (!updateProduct.success) {
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
          const update = await handleUpdateCover(savedUrl);

          if (!update) {
            errorToast("Error Occured");
            return;
          }
        }
        setproduct({ ...product, covers: savedUrl });
      } else if (props.type === "createbanner") {
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
    if (isEdit) {
      setopenmodal({
        ...openmodal,
        confirmmodal: {
          open: true,
          confirm: false,
          closecon: "imageupload",
        },
      });
      return;
    }
    seturl([]);
    seturltemp([]);
    setopenmodal({ ...openmodal, imageupload: false });
  };
  const handleReset = async () => {
    seturl((prev) => [...prev, ...Imgurltemp]);
    setfiles([]);
    seturltemp([]);
  };

  const handleselectImg = (idx: number) => {
    const imgurl = [...Imgurl];
    const img = imgurl[idx];

    if (img.isSave) {
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
        <Cropimage
          index={selectedImg}
          img={Imgurl[selectedImg].url}
          setclose={setcrop}
          imgurl={Imgurl}
          ratio={16 / 10}
          Files={Files}
          setfile={setfiles}
          setimgurl={seturl}
          type={props.type}
        />
      )}
    </dialog>
  );
};
//
//
//
//Banner Modal

export const BannerModal = ({ type }: { type: "banner" | "promotion" }) => {
  const {
    openmodal,
    setopenmodal,
    banner,
    setbanner,
    allData,
    setalldata,
    globalindex,
    setglobalindex,
    setisLoading,
    isLoading,
  } = useGlobalContext();
  const [isEdit, setisEdit] = useState(false);
  const handleCancel = () => {
    if (isEdit) {
      setopenmodal(SaveCheck(false, "createBanner", openmodal, true));
      return;
    }
    setbanner(BannerInitialize);
    setopenmodal({ ...openmodal, createBanner: false });
    setglobalindex({ ...globalindex, bannereditindex: -1 });
  };
  const fetchdata = async () => {
    const request = await ApiRequest(
      `/api/banner?ty=edit&p=${globalindex.bannereditindex}`,
      setisLoading,
      "GET"
    );
    if (request.success) {
      setbanner(request.data);
    } else {
      errorToast("Error Connection");
    }
  };
  useEffect(() => {
    globalindex.bannereditindex !== -1
      ? fetchdata()
      : setisLoading((prev) => ({ ...prev, GET: false }));
  }, []);

  useEffect(() => {
    const isEdit = banner.image.url.length !== 0 && banner.name.length !== 0;
    setisEdit(isEdit);
  }, [banner]);
  const handleCreate = async () => {
    const allbanner = [...allData.banner];
    const URL = "/api/banner";
    if (banner.image) {
      if (globalindex.bannereditindex === -1) {
        const createddata = { ...banner, type: type };
        const create = await ApiRequest(
          URL,
          setisLoading,
          "POST",
          "JSON",
          createddata
        );
        if (!create.success) {
          errorToast("Failed To Create");
          return;
        }
        allbanner.push({ ...createddata, id: create.data.id });
        setbanner(BannerInitialize);
        toast.success("Banner Created", {
          autoClose: 1000,
          pauseOnHover: true,
        });
      } else {
        const update = await ApiRequest(
          URL,
          setisLoading,
          "PUT",
          "JSON",
          banner
        );
        if (!update.success) {
          errorToast("Failed To Update");
          return;
        }
        const idx = allbanner.findIndex(
          (i) => i.id === globalindex.bannereditindex
        );
        allbanner[idx] = banner;
        setalldata({ ...allData, banner: allbanner });
        setglobalindex((prev) => ({ ...prev, bannereditindex: -1 }));

        successToast("Banner Updated");
      }
      setisEdit(false);
      setbanner(BannerInitialize);
      setopenmodal(SaveCheck(true, "createBanner", openmodal));
      setalldata({ ...allData, banner: allbanner });
    } else {
      toast.error("Image Is Missing", { autoClose: 2000, pauseOnHover: true });
    }
  };
  return (
    <Modal customwidth="100%" customheight="100%" closestate="createBanner">
      <motion.div
        initial={{ y: 1000 }}
        animate={{ y: 0 }}
        exit={{ opacity: 0 }}
        className="bannermodal_content bg-white border border-black p-1 w-auto min-w-1/2 max-w-full h-fit  flex flex-col gap-y-5 justify-start items-center"
      >
        <div className="image_container flex flex-col justify-center w-[95vw] items-center h-full">
          <div className="flex flex-col justify-center w-fit  min-w-[80vw] max-h-[80vh] min-h-[250px]">
            {banner.image.url.length === 0 ? (
              <h3 className="w-full bg-red-300 text-white text-lg p-2 font-bold">
                No Image
              </h3>
            ) : (
              <>
                <img
                  src={banner.image?.url}
                  alt={"Banner"}
                  className="w-auto min-h-[250px] max-h-[80vh]  mt-9 object-cover"
                  loading="lazy"
                />
                <h3 className="w-full p-2 bg-[#495464] font-black text-white mb-5">
                  {banner.name.length > 0 ? banner.name : "Banner Name"}
                </h3>
              </>
            )}
          </div>
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
          />
        </div>
        <div className="bannerform flex flex-col gap-y-5 justify-center items-center w-[95vw] h-full">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={banner.name}
            onChange={(e) => {
              setbanner({ ...banner, name: e.target.value });
              setopenmodal(SaveCheck(false, "createBanner", openmodal));
            }}
            className="w-full h-[50px] border border-gray-300 pl-2 font-bold"
          />
          <FormControl className="relative -left-[44%]">
            <FormControlLabel
              control={
                <Checkbox
                  checked={banner.show ?? false}
                  onChange={(e) =>
                    setbanner((prev) => ({ ...prev, show: e.target.checked }))
                  }
                  sx={{ color: "#495464" }}
                />
              }
              label={<h1 className="font-semibold ">Show at home page</h1>}
              labelPlacement="end"
            />
          </FormControl>

          <div className="actions_con w-full flex flex-col gap-y-1">
            <PrimaryButton
              onClick={() => handleCreate()}
              text={globalindex.bannereditindex !== -1 ? "Edit" : "Create"}
              width="100%"
              type="button"
              status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
              disable={!isEdit}
            />
            <PrimaryButton
              text="Cancel"
              onClick={() => handleCancel()}
              disable={SpecificAccess(isLoading)}
              color="lightcoral"
              type="button"
              width="100%"
            />
          </div>
        </div>
      </motion.div>
      {openmodal.imageupload && (
        <ImageUpload limit={1} mutitlple={false} type="createbanner" />
      )}
    </Modal>
  );
};

//
//
//
//UpdateStockModal

export const UpdateStockModal = ({
  action,
  closename,
}: {
  action?: () => void;
  closename: string;
}) => {
  const {
    product,
    setproduct,

    setreloaddata,
    setopenmodal,
    isLoading,
    setisLoading,
  } = useGlobalContext();

  const handleUpdate = async () => {
    const update = await ApiRequest(
      "/api/products/crud",
      setisLoading,
      "PUT",
      "JSON",
      { stock: product.stock, id: product.id, type: "editstock" }
    );
    if (!update.success) {
      errorToast("Failed To Update Stock");
      return;
    }

    setproduct(Productinitailizestate);
    setreloaddata(true);
    successToast("Stock Updated");
    setopenmodal((prev) => ({ ...prev, [closename]: false }));
  };
  return (
    <Modal closestate={closename}>
      <div className="updatestock w-[100%] h-[100%] rounded-lg flex flex-col items-center justify-center gap-y-5 bg-white p-1">
        <label className="text-lg font-bold">Update Stock </label>
        <input
          type="number"
          placeholder="Stock"
          name="stock"
          min={0}
          max={1000}
          onChange={(e) => {
            const { value } = e.target;
            const val = parseInt(value);
            setproduct((prev) => ({ ...prev, stock: val }));
          }}
          value={product.stock}
          required
          className="w-[80%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
        />
        <PrimaryButton
          color="#44C3A0"
          text="Update"
          type="button"
          onClick={() => handleUpdate()}
          radius="10px"
          status={isLoading.PUT ? "loading" : "authenticated"}
          width="80%"
          height="50px"
        />{" "}
        <PrimaryButton
          color="#F08080"
          text="Cancel"
          type="button"
          radius="10px"
          width="80%"
          height="50px"
          disable={isLoading.PUT}
          onClick={() => {
            setopenmodal((prev) => ({ ...prev, [closename]: false }));
          }}
        />
      </div>
    </Modal>
  );
};
//
//
//
//
//
//Promotion Modal
//
//

export const CreatePromotionModal = () => {
  const {
    openmodal,
    setopenmodal,
    promotion,
    setpromotion,
    setinventoryfilter,
    setisLoading,
    isLoading,
    globalindex,
    setglobalindex,
    allfiltervalue,
    setallfilterval,
    setreloaddata,
  } = useGlobalContext();

  const [isEdit, setisEdit] = useState(false);

  const fetchdata = async (id: number) => {
    const request = await ApiRequest(
      `/api/promotion?ty=edit&p=${id}`,
      setisLoading,
      "GET"
    );
    if (request.success) {
      setpromotion(request.data);
    } else {
      errorToast("Error Connection");
    }
  };
  useEffect(() => {
    setisEdit(false);
    if (globalindex.promotioneditindex !== -1) {
      fetchdata(globalindex.promotioneditindex);
    } else {
      setpromotion((prev) => ({ ...prev, id: -1 }));
    }
  }, []);

  useEffect(() => {
    const isEdit =
      promotion.name.length !== 0 &&
      promotion.description.length !== 0 &&
      promotion.banner_id &&
      promotion.Products.length > 0;
    isEdit ? setisEdit(true) : setisEdit(false);
  }, [promotion]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const promo = { ...promotion };
    const isProduct = promo.Products.filter((i) => i.id !== 0).length;
    if (isProduct === 0 || !promo.expireAt) {
      errorToast(
        !promo.expireAt ? "Please Fill Expire Date" : "Please Select Product"
      );
      return;
    }

    const method = globalindex.promotioneditindex !== -1 ? "PUT" : "POST";
    const createpromo = await ApiRequest(
      "/api/promotion",
      setisLoading,
      method,
      "JSON",
      { ...promo, type: "edit" }
    );
    if (!createpromo.success) {
      errorToast(createpromo.error ?? "Error Occured");
      return;
    }
    setreloaddata(true);

    setpromotion(PromotionInitialize);

    setinventoryfilter("promotion");

    setisEdit(false);

    successToast(
      `Promotion ${
        globalindex.promotioneditindex === -1 ? "Created" : "Updated"
      }`
    );
    setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setpromotion((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleCancel = async () => {
    const allfilter = [...allfiltervalue];
    const deletepromoproduct = await ApiRequest(
      "/api/promotion",
      undefined,
      "PUT",
      "JSON",
      { type: "cancelproduct" }
    );

    if (!deletepromoproduct.success) {
      errorToast("Error Occured");
      return;
    }

    if (isEdit) {
      setopenmodal((prev) => ({
        ...prev,
        confirmmodal: {
          open: true,
          confirm: false,
          type: "promotioncancel",
          closecon: "createPromotion",
        },
      }));
      return;
    }
    allfilter.forEach((i) => {
      if (i.page === "product") {
        i.filter = { ...i.filter, promotionid: undefined };
      }
    });
    setallfilterval(allfilter);
    setpromotion(PromotionInitialize);
    setinventoryfilter("promotion");
    setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
  };
  const handleSelectProduct = (type: "product" | "banner") => {
    const isSelect = promotion.Products.every((i) => i.id !== 0);
    let allfil = [...allfiltervalue];

    setpromotion((prev) => ({
      ...prev,
      products: !isSelect ? [] : prev.Products,
      [type === "product" ? "selectproduct" : "selectbanner"]: true,
    }));
    infoToast(
      "Start selection by click on card and click on it again to remove discount"
    );

    allfil = allfil.map((i) => {
      if (i.page === "product") {
        return {
          ...i,
          promotionid: promotion.id,
        };
      }
      return i;
    });

    setinventoryfilter(type);
    setallfilterval(allfil);
    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
  };
  return (
    <Modal closestate={"none"}>
      <motion.div
        initial={{ y: 1000 }}
        animate={{ y: 0 }}
        exit={{ y: 1000 }}
        className="createPromotion__container relative  rounded-lg w-full h-full bg-white p-3 flex flex-col justify-center items-center"
      >
        <form
          onSubmit={handleSubmit}
          className="promotionform w-full h-full flex flex-col justify-center items-center gap-y-5"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={promotion.name}
            className="w-full h-[50px] pl-2 border border-gray-200 text-lg font-bold"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="description"
            value={promotion.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full h-[50px] pl-2 border border-gray-200 text-lg font-bold"
          />
          <label className="w-full text-lg font-bold text-left">
            Expire Date*
          </label>
          <DateTimePicker
            value={dayjs(promotion.expireAt)}
            onChange={(e) => {
              setpromotion((prev) => ({ ...prev, expiredAt: dayjs(e) }));
              setisEdit(false);
            }}
            sx={{ width: "100%", height: "50px" }}
          />
          <PrimaryButton
            text={promotion.banner_id ? "Edit Banner" : "Select Banner"}
            onClick={() => {
              handleSelectProduct("banner");
            }}
            type="button"
            color="#3D788E"
            radius="10px"
            width="100%"
            height="50px"
          />
          <PrimaryButton
            text={
              promotion.Products?.filter((i) => i.id !== 0).length > 0
                ? "Edit Products"
                : "Select Product"
            }
            onClick={() => handleSelectProduct("product")}
            type="button"
            radius="10px"
            width="100%"
            height="50px"
          />
          <PrimaryButton
            color="#44C3A0"
            text={globalindex.promotioneditindex === -1 ? "Create" : "Update"}
            type="submit"
            disable={!isEdit}
            status={
              isLoading.POST || isLoading.PUT ? "loading" : "authenticated"
            }
            radius="10px"
            width="100%"
            height="50px"
          />{" "}
          <PrimaryButton
            color="#F08080"
            text="Cancel"
            type="button"
            disable={isLoading.POST || isLoading.PUT}
            radius="10px"
            width="100%"
            height="50px"
            onClick={() => handleCancel()}
          />
        </form>
      </motion.div>
      {openmodal.imageupload && (
        <ImageUpload mutitlple={false} limit={1} type="createpromotion" />
      )}
    </Modal>
  );
};

export const DiscountModals = () => {
  const {
    promotion,
    allData,
    setalldata,
    setpromotion,
    globalindex,
    setopenmodal,
  } = useGlobalContext();
  const [discount, setdiscount] = useState<number>(0);
  useEffect(() => {
    if (globalindex.promotionproductedit !== -1) {
      const idx = promotion.Products.findIndex(
        (i) => i.id === globalindex.promotionproductedit
      );
      const promo = promotion.Products[idx].discount;
      const percent = promo?.percent;
      setdiscount(percent ?? 0);
    }
  }, []);

  const handleDiscount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let promoproduct = [...promotion.Products];
    let allproduct = [...allData.product];
    const producteditidx = globalindex.promotionproductedit;

    const calculateDiscount = (price: number) => ({
      percent: discount,
      newPrice: (price - (price * discount) / 100).toFixed(2),
      oldPrice: price,
    });
    if (producteditidx === -1) {
      promoproduct = promoproduct.map((i) => ({
        ...i,
        discount: calculateDiscount(i.discount?.oldPrice as number),
      })); // set discount for all selected product
    } else {
      promoproduct = promoproduct.map((i) => {
        if (i.id === producteditidx) {
          return {
            ...i,
            discount: calculateDiscount(i.discount?.oldPrice as number),
          };
        }
        return i;
      });
    }

    //update product discount
    allproduct = allproduct.map((product) => {
      const matchingPromoProduct = promoproduct.find(
        (promoProduct) => promoProduct.id === product.id
      );

      if (matchingPromoProduct) {
        const { percent, newPrice } = matchingPromoProduct.discount || {};
        return {
          ...product,
          discount: {
            ...product.discount,
            percent: percent as number,
            newPrice: newPrice as string,
          },
        };
      }

      return product;
    });

    setalldata((prev) => ({ ...prev, product: allproduct }));

    setpromotion((prev) => ({ ...prev, Products: promoproduct }));

    setopenmodal((prev) => ({ ...prev, discount: false }));

    successToast("Discount Set");
  };

  return (
    <Modal customwidth="30%" customheight="fit-content" closestate="discount">
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onSubmit={handleDiscount}
        className="discount_content rounded-lg w-full h-full p-3 bg-white flex flex-col gap-y-5 justify-center items-center"
      >
        {globalindex.promotionproductedit === -1 && (
          <h3 className="text-lg font-bold">
            Set Discount For All Selected Product
          </h3>
        )}
        <input
          type="number"
          placeholder="Discount Percentage EX: 20"
          name="discount"
          value={discount}
          min={1}
          max={100}
          className="w-full h-[50px] rounded-lg pl-3 text-lg font-bold round-lg border border-gray-300"
          onChange={(e) => setdiscount(parseFloat(e.target.value))}
          required
        />
        <PrimaryButton
          type="submit"
          text="Confirm"
          width="100%"
          radius="10px"
        />
      </motion.form>
    </Modal>
  );
};

//User Mangement
//
//
//
//
export const Createusermodal = () => {
  const {
    allData,
    setalldata,
    globalindex,
    openmodal,
    setopenmodal,
    setisLoading,
    isLoading,
  } = useGlobalContext();
  const [data, setdata] = useState<UserState>(Userinitialize);
  const [showpass, setshowpass] = useState({
    passowrd: false,
    confirmpassword: false,
  });

  useEffect(() => {
    if (globalindex.useredit !== -1) {
      setdata(allData.user[globalindex.useredit]);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const editindex = globalindex.useredit;
    const { password, confirmpassword } = data;
    const URL = "/api/auth/register";
    const method = editindex === -1 ? "POST" : "PUT";

    if (editindex === -1 && password !== confirmpassword) {
      errorToast("Confirm Password Not Match");
      return;
    }
    if (editindex !== -1) {
      delete data.password;
      delete data.confirmpassword;
    }

    //register User
    const register = await ApiRequest(URL, setisLoading, method, "JSON", data);
    if (!register.success) {
      errorToast(register.error ?? "Failed to register");
      return;
    }
    let alluser = [...allData.user];
    editindex === -1
      ? alluser.push(data)
      : (alluser[alluser.findIndex((i) => i.id === data.id)] = data);
    setalldata((prev) => ({ ...prev, user: alluser }));

    successToast(`User ${editindex === -1 ? "Created" : "Updated"}`);
    editindex === -1 && setdata(Userinitialize);
  };
  const handleCancel = () => {
    if (openmodal.confirmmodal.confirm) {
      setopenmodal((prev) => ({ ...prev, createUser: false }));
    } else {
      setopenmodal(SaveCheck(false, "createUser", openmodal, true));
    }
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setdata((prev) => ({ ...prev, [name]: value }));
    setopenmodal(SaveCheck(false, "createUser", openmodal));
  };
  const handleDelete = (id: string) => {
    setopenmodal((prev) => ({
      ...prev,
      confirmmodal: {
        open: true,
        confirm: false,
        closecon: "createUser",
        index: id,
        type: "user",
      },
    }));
  };
  return (
    <Modal closestate="createUser">
      <div className="relative w-full h-[600px] bg-white p-5 flex flex-col items-end gap-y-5 rounded-lg">
        <h3 className="text-lg font-semibold absolute top-5 left-5">
          {" "}
          #{data.id}{" "}
        </h3>

        <Image
          src={CloseIcon}
          alt="closeicon"
          hidden={SpecificAccess(isLoading)}
          onClick={() => handleCancel()}
          width={1000}
          height={1000}
          className="w-[30px] h-[30px] object-contain"
        />
        <form
          onSubmit={handleSubmit}
          className="form_container w-full h-full flex flex-col items-center gap-y-5"
        >
          <input
            type="text"
            className="w-full h-[50px] rounded-lg border border-gray-300 pl-2 text-lg font-bold"
            placeholder="Firstname (Username if it prefered)"
            name="firstname"
            value={data.firstname}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            className="w-full h-[50px] rounded-lg border border-gray-300 pl-2 text-lg font-bold"
            name="lastname"
            value={data.lastname}
            onChange={handleChange}
            placeholder="Lastname (optional)"
          />
          <input
            type="email"
            className="w-full h-[50px] rounded-lg border border-gray-300 pl-2 text-lg font-bold"
            placeholder="Email Address"
            value={data.email}
            onChange={handleChange}
            name="email"
            required
          />
          <input
            type="text"
            className="w-full h-[50px] rounded-lg border border-gray-300 pl-2 text-lg font-bold"
            placeholder="Phone Number"
            value={data.phonenumber}
            onChange={handleChange}
            name="phonenumber"
          />
          {globalindex.useredit === -1 && (
            <>
              <FormControl
                sx={{
                  m: 1,
                  width: "100%",
                  height: "50px",
                  borderRadius: "10px",
                }}
                variant="outlined"
              >
                <InputLabel
                  className="font-bold"
                  htmlFor="outlined-adornment-password"
                >
                  Password
                </InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  name="password"
                  type={showpass.passowrd ? "text" : "password"}
                  onChange={handleChange}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() =>
                          setshowpass((prev) => ({
                            ...prev,
                            passowrd: !prev.passowrd,
                          }))
                        }
                        edge="end"
                      >
                        {showpass.passowrd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                  required
                />
              </FormControl>
              <FormControl
                sx={{
                  m: 1,
                  width: "100%",
                  height: "50px",
                  borderRadius: "10px",
                }}
                variant="outlined"
              >
                <InputLabel htmlFor="outlined-adornment-password">
                  Confirm Passoword
                </InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  type={showpass.confirmpassword ? "text" : "password"}
                  name="confirmpassword"
                  onChange={handleChange}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() =>
                          setshowpass((prev) => ({
                            ...prev,
                            confirmpassword: !prev.confirmpassword,
                          }))
                        }
                        edge="end"
                      >
                        {showpass.confirmpassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Confirm Password"
                  required
                />
              </FormControl>{" "}
            </>
          )}

          <PrimaryButton
            color="#0097FA"
            text={globalindex.useredit === -1 ? "Create" : "Update"}
            disable={isLoading.GET}
            status={
              isLoading.POST || isLoading.PUT ? "loading" : "authenticated"
            }
            type="submit"
            width="100%"
            height="50px"
            radius="10px"
          />
          {globalindex.useredit !== -1 && (
            <>
              <PrimaryButton
                color="lightcoral"
                text="Delete"
                type="button"
                onClick={() => handleDelete(data.id as string)}
                width="100%"
                height="50px"
                radius="10px"
              />{" "}
            </>
          )}
        </form>
      </div>
    </Modal>
  );
};
export interface editprofiledata {
  name: {
    firstname: string;
    lastname?: string;
  };
  email: {
    newemail: string;
    verify: boolean;
    code?: string;
  };
  password: {
    oldpassword: string;
    newpassword: string;
  };
  shipping?: Array<shippingtype>;
  isLoading?: boolean;
}
export interface shippingtype {
  id?: number;
  street?: string;
  province: string;
  houseId: number;
  district: string;
  songkhat: string;
  postalcode: string;
  isSaved: boolean;
  save?: string;
  [key: string]: string | number | boolean | undefined;
}
export const EditProfile = ({
  type,
}: {
  type: "name" | "email" | "password" | "shipping" | "none";
}) => {
  const [open, setopen] = useState<any>({});
  const [loading, setloading] = useState({
    post: false,
    get: true,
    edit: false,
  });
  const { setopenmodal, userinfo, setuserinfo } = useGlobalContext();
  const [data, setdata] = useState<editprofiledata>({
    name: {
      firstname: userinfo.firstname as string,
      lastname: userinfo.lastname as string,
    },
    email: { newemail: "", verify: false },
    password: { oldpassword: "", newpassword: "" },
    shipping: [],
  });

  const handleAdd = async (index: number) => {
    const formeddata = new FormData();

    let userdata = { ...data };

    const { shipping } = userdata;

    if (shipping && index >= 0 && index < shipping.length) {
      let selectedShipping = shipping[index];
      const isNotEmpty = Object.entries(selectedShipping).every(
        ([key, val]) => {
          if (typeof val === "string") {
            return val.trim() !== "";
          }
          if (typeof val === "number") {
            return val !== 0;
          }
          return Boolean(val);
        }
      );
      if (!isNotEmpty) {
        errorToast("All field is required");
        return;
      }

      Object.entries(selectedShipping).forEach(([key, value]) => {
        if (typeof value === "string") {
          formeddata.set(key, value);
        }
      });
      setloading((prev) => ({ ...prev, post: true }));

      const address = Addaddress.bind(
        null,
        formeddata,
        selectedShipping.isSaved,
        selectedShipping.id
      );

      const add = await address();

      if (add.success) {
        if (!selectedShipping.isSaved) {
          selectedShipping.id = add.data.id;
        }

        setdata(userdata);
        successToast(add.message as string);
      } else {
        errorToast(add.message as string);
      }
      setloading((prev) => ({ ...prev, post: false }));
    }
  };

  const Handleaddresschange = (
    e: ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const { name, value } = e.target;
    const result = { ...data };
    if (result.shipping) {
      let update = result.shipping[idx];
      update[name] = value as string;
    }
    setdata(result);
    setloading((prev) => ({ ...prev, edit: true }));
  };
  const handleRemove = async (index: number) => {
    const update = { ...data };
    let del = update.shipping;

    if (del && del[index].id) {
      const deletedaddress = Deleteaddress.bind(false, del[index].id as number);
      const deleted = await deletedaddress();
      if (!deleted.success) {
        errorToast("Error Occured");
        return;
      }
    }
    successToast("Address Deleted");

    del?.splice(index, 1);
    setdata(update);
  };
  const fetchdata = async (ty: typeof type) => {
    let userdata = { ...data };

    let url = `/api/users/info?ty=${type}`;
    if (ty === "shipping") {
      let updateopen = { ...open };

      const request = await ApiRequest(
        url,
        undefined,
        "GET",
        undefined,
        undefined,
        "userinfo"
      );
      setloading((prev) => ({ ...prev, get: false }));
      if (request.success) {
        userdata.shipping = request.data;
        userdata.shipping?.forEach((i, idx) => {
          i.isSaved = true;

          updateopen[`sub${idx + 1}`] = false;
        });
        setopen(updateopen);
      }
    }

    setdata(userdata);
  };

  useEffect(() => {
    fetchdata(type);
  }, [type]);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.endsWith("name") || name.endsWith("email")) {
      const end = name.endsWith("name") ? "name" : "email";

      setdata((prev) => ({ ...prev, [end]: { ...prev[end], [name]: value } }));
      return;
    }
    setdata((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateuser = async () => {
    setloading((prev) => ({ ...prev, post: true }));
    const formeddata = new FormData();
    data.password = {
      newpassword: userinfo.newpassword as string,
      oldpassword: userinfo.oldpassword as string,
    };
    Object.entries(data).forEach(([key, val]) =>
      key === "name" || key === "password"
        ? formeddata.set(key, JSON.stringify(val))
        : formeddata.set(key, val)
    );
    const updaterequest = Editprofileaction.bind(null, formeddata, type);
    const update = await updaterequest();
    setloading((prev) => ({ ...prev, post: false }));
    if (!update.success) {
      errorToast(update.message as string);
      return;
    }

    if (type === "name") {
      setuserinfo((prev) => ({
        ...prev,
        firstname: data.name.firstname,
        lastname: data.name.lastname,
      }));
    }
    if (type === "password") {
      setuserinfo((prev) => ({ ...prev, newpassword: "", oldpassword: "" }));
      setopenmodal((prev) => ({
        ...prev,
        editprofile: false,
        alert: {
          text: "All signed in device will be logged out",
          open: true,
          action: () => signOut(),
        },
      }));
      return;
    }

    successToast(update.message as string);
  };

  const handleVerify = async () => {
    setloading((prev) => ({ ...prev, post: true }));
    const verifyrequest = VerifyEmail.bind(
      null,
      data.email.newemail,
      data.email.verify,
      data.email.code
    );

    if (!data.email.verify) {
      const verified = await verifyrequest();
      setloading((prev) => ({ ...prev, post: false }));
      if (!verified.success) {
        errorToast(verified.message as string);
        return;
      }
      successToast(verified.message as string);
      setdata((prev) => ({ ...prev, email: { ...prev.email, verify: true } }));
    } else if (data.email.verify) {
      const verified = await verifyrequest();
      setloading((prev) => ({ ...prev, post: false }));
      if (!verified.success) {
        errorToast(verified.message as string);
        return;
      }
      const formeddata = new FormData();
      formeddata.set("email", data.email.newemail);
      const updaterequest = Editprofileaction.bind(null, formeddata, type);
      const update = await updaterequest();
      if (!update.success) {
        errorToast(update.message as string);
        return;
      }

      successToast(update.message as string);
      setopenmodal((prev) => ({
        ...prev,
        editprofile: false,
        alert: {
          open: true,
          text: "Logging Out",
          action: () => signOut(),
        },
      }));
    }
  };

  return (
    <Modal closestate="editprofile" customheight="fit-content">
      <div className="editprofile_container relative flex flex-col items-center gap-y-5 w-full h-auto  max-h-[80vh] bg-white rounded-lg p-3">
        {type === "name" && (
          <>
            <input
              type="text"
              name="firstname"
              value={data.name.firstname}
              placeholder="Firstname"
              onChange={handleChange}
              className="w-full h-[50px] p-2 border border-gray-300 rounded-lg font-bold"
            />
            <input
              type="text"
              name="lastname"
              value={data.name.lastname}
              placeholder="Lastname"
              onChange={handleChange}
              className="w-full h-[50px] p-2 border border-gray-300 rounded-lg font-bold"
            />
          </>
        )}
        {type === "email" && (
          <>
            {" "}
            <input
              type="email"
              name="newemail"
              value={data.email.newemail}
              placeholder="New Email"
              onChange={handleChange}
              className="w-full h-[50px] p-2 border border-gray-300 rounded-lg font-bold"
            />
            <input
              hidden={!data.email.verify}
              type="number"
              name="code"
              placeholder="Verify Code"
              onChange={handleChange}
              className="w-full h-[50px] p-2 border border-gray-300 rounded-lg font-bold"
            />
            <PrimaryButton
              type="button"
              text={data.email.verify ? "Update" : "Verify"}
              onClick={() => handleVerify()}
              status={loading.post ? "loading" : "authenticated"}
              width="100%"
              height="50px"
              radius="10px"
            />
          </>
        )}
        {type === "password" && (
          <>
            <PasswordInput name="oldpassword" label="Old Password" />{" "}
            <PasswordInput name="newpassword" label="New Password" />{" "}
          </>
        )}
        {type === "shipping" && (
          <div className="relative w-full min-h-[20vh] max-h-[80vh]">
            {loading.get ? (
              <LoadingText />
            ) : (
              <>
                {data.shipping?.map((i, idx) => (
                  <div
                    key={idx}
                    className={`address_container p-3 mb-5 transition w-full min-h-[50px] rounded-lg h-fit hover:border hover:border-gray-400 ${
                      open ? (open[`sub${idx + 1}`] ? "bg-gray-700" : "") : ""
                    }`}
                  >
                    <h3
                      className={`title w-full h-full text-lg font-bold cursor-pointer ${
                        open ? (open[`sub${idx + 1}`] ? "text-white" : "") : ""
                      }`}
                      onClick={() => {
                        const update = Object.entries(open).map(
                          ([key, _]: any) => {
                            if (key === `sub${idx + 1}`) {
                              return [key, true];
                            } else {
                              return [key, false];
                            }
                          }
                        );

                        setopen(Object.fromEntries(update));
                      }}
                    >
                      Address {idx + 1}
                    </h3>

                    {open && open[`sub${idx + 1}`] && (
                      <>
                        <div className="addressform relative w-full h-fit flex flex-col items-center gap-y-5 p-5">
                          <span
                            onClick={() => {
                              const update = Object.entries(open).map(
                                ([key, value]: any) => {
                                  if (key === `sub${idx + 1}`) {
                                    return [key, !value];
                                  } else {
                                    return [key, false];
                                  }
                                }
                              );

                              setopen(Object.fromEntries(update));
                            }}
                            className="absolute -top-7 right-0 transition hover:translate-x-1 "
                          >
                            <CloseVector width="30px" height="30px" />
                          </span>
                          <Selection
                            style={{ width: "100%", height: "50px" }}
                            default="Province / Cities"
                            name="province"
                            value={i.province}
                            onChange={(e) => {
                              let result = { ...data };
                              if (result.shipping) {
                                let shipping = result.shipping[idx];
                                shipping[e.target.name] = e.target.value;
                              }
                              setdata(result);
                            }}
                            data={listofprovinces}
                          />
                          <input
                            name="street"
                            type="text"
                            onChange={(e) => Handleaddresschange(e, idx)}
                            value={i.street}
                            placeholder="Street Address"
                            className="w-full h-[50px] border border-gray-300 p-3 rounded-lg font-bold text-lg"
                          />
                          <input
                            name="houseId"
                            type="text"
                            onChange={(e) => Handleaddresschange(e, idx)}
                            value={i.houseId === 0 ? "" : i.houseId}
                            placeholder="House(73) or Apartment ID (13, Floor 2)"
                            className="w-full h-[50px] border border-gray-300 p-3 rounded-lg font-bold text-lg"
                          />
                          <input
                            name="district"
                            type="text"
                            value={i.district}
                            onChange={(e) => Handleaddresschange(e, idx)}
                            placeholder="District / Khan"
                            className="w-full h-[50px] border border-gray-300 p-3 rounded-lg font-bold text-lg"
                          />
                          <input
                            name="songkhat"
                            type="text"
                            value={i.songkhat}
                            onChange={(e) => Handleaddresschange(e, idx)}
                            placeholder="Songkhat / Commune"
                            className="w-full h-[50px] border border-gray-300 p-3 rounded-lg font-bold text-lg"
                          />
                          <input
                            name="postalcode"
                            type="text"
                            value={i.postalcode}
                            onChange={(e) => Handleaddresschange(e, idx)}
                            placeholder="Postalcode (12061)"
                            className="w-full h-[50px] border border-gray-300 p-3 rounded-lg font-bold text-lg"
                          />

                          <div className="flex flex-row gap-x-5 w-full h-fit">
                            <PrimaryButton
                              type="submit"
                              text={i.isSaved ? "Update" : "Add"}
                              color="#0097FA"
                              width="100%"
                              height="50px"
                              radius="10px"
                              status={
                                loading.post ? "loading" : "authenticated"
                              }
                              disable={
                                !data.shipping ||
                                Object.entries(data.shipping[idx]).every(
                                  ([_, val]) => !val
                                )
                              }
                              onClick={() => handleAdd(idx)}
                            />
                            <PrimaryButton
                              type="button"
                              text={"Delete"}
                              onClick={() => handleRemove(idx)}
                              color="lightcoral"
                              width="100%"
                              height="50px"
                              radius="10px"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}{" "}
              </>
            )}
          </div>
        )}
        {type === "shipping" && (
          <i
            onClick={() => {
              let update = { ...data };
              let address = update.shipping;
              if (address && address?.length >= 5) {
                errorToast("Can Add Only 5 Address");
                return;
              }
              address?.push({
                street: "",
                province: "",
                district: "",
                songkhat: "",
                houseId: 0,
                postalcode: "",
                isSaved: false,
              });
              setopen((prev: any) => ({
                ...prev,
                [`sub${address?.length}`]: true,
              }));
              setdata(update);
            }}
            className={`fa-solid fa-circle-plus font-bold text-4xl text-[#495464] transition active:translate-y-2 `}
          ></i>
        )}
        {type !== "shipping" && type !== "email" && (
          <>
            <PrimaryButton
              type="button"
              text="Update"
              onClick={() => handleUpdateuser()}
              status={loading.post ? "loading" : "authenticated"}
              width="100%"
              height="50px"
              radius="10px"
            />
            <PrimaryButton
              type="button"
              text="Cancel"
              disable={SpecificAccess(loading)}
              onClick={() => {
                setopenmodal((prev) => ({ ...prev, editprofile: false }));
              }}
              color="lightcoral"
              width="100%"
              height="50px"
              radius="10px"
            />
          </>
        )}
      </div>
    </Modal>
  );
};
