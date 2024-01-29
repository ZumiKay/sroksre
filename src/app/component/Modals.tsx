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
import CloseIcon from "../Asset/Image/Close.svg";

import PrimaryButton, { InputFileUpload, Selection } from "./Button";
import "../globals.css";
import ToggleMenu, { AddSubCategoryMenu } from "./ToggleMenu";
import {
  AllDataInitialize,
  BannerInitialize,
  CateogoryInitailizestate,
  CateogoryState,
  DefaultSize,
  FiltervalueInitialize,
  GlobalIndexState,
  ProductState,
  Productinitailizestate,
  PromotionInitialize,
  SaveCheck,
  SpecificAccess,
  SubcategoriesState,
  UserState,
  Userinitialize,
  infovaluetype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { INVENTORYENUM } from "../dashboard/products/page";
import { PrimaryPhoto } from "./PhotoComponent";
import { toast } from "react-toastify";
import { ApiRequest, useRequest } from "@/src/context/CustomHook";
import LoadingIcon, {
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
import { listofprovinces } from "@/src/lib/utilities";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { RGBColor, SketchPicker } from "react-color";
import tinycolor from "tinycolor2";
import { Products } from "@prisma/client";
import { setegid } from "process";

export default function Modal({
  children,
  customZIndex,
  customwidth,
  customheight,
  closestate,
  bgblur,
}: {
  children: ReactNode;
  customZIndex?: number;
  customwidth?: string;
  customheight?: string;
  bgblur?: boolean;
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
    | "none";
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
          setopenmodal((prev) => ({ ...prev, [closestate]: false }));
          const updateIndex = Object.fromEntries(
            Object.entries(globalindex).map(([key, _]) => [key, -1])
          ) as unknown as GlobalIndexState;
          setglobalindex(updateIndex);

          if (closestate === "createCategory") {
            setalldata((prev) => ({ ...prev, category: [] }));
          }
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
        className="w-1/2 h-1/2 flex justify-center items-center"
      >
        {children}
      </div>
    </dialog>
  );
}

export function CreateProducts() {
  const {
    openmodal,
    setopenmodal,
    product,
    setproduct,
    allData,
    setalldata,
    globalindex,
    setglobalindex,
    isLoading,
    setisLoading,
  } = useGlobalContext();

  const [edit, setedit] = useState({
    productdetail: false,
  });
  const [stocktype, setstocktype] = useState<"stock" | "variant">("stock");
  const [subcate, setsubcate] = useState<Array<SubcategoriesState>>([]);
  const getsubcategories = (value: number) => {
    const sub = allData.category.find((i) => i.id === value)?.subcategories;
    return sub;
  };

  const fetchcate = async (product: ProductState) => {
    const categories = await ApiRequest("/api/categories", setisLoading, "GET");
    if (categories.success) {
      setalldata((prev) => ({ ...prev, category: categories.data }));
      const { parent_id } = product.category;
      const parentid =
        typeof parent_id === "string" ? parseInt(parent_id) : parent_id;
      const subcates: CateogoryState = categories.data.find(
        (i: CateogoryState) => i.id === parentid
      );

      setsubcate(subcates?.subcategories ?? []);
    } else {
      errorToast("Error Connection");
    }
  };
  const fetchproductdata = async (id: number) => {
    const request = await ApiRequest(
      `/api/products/ty=info_pid=${id}`,
      setisLoading,
      "GET"
    );
    if (request.success) {
      const data: ProductState = request.data;
      await fetchcate(data);

      const isExist = data.details.findIndex(
        (i) => i.info_type === ("COLOR" || "TEXT")
      );
      if (isExist !== -1) {
        setstocktype("variant");
      }
      setproduct(request.data);
    } else {
      errorToast("Connection Problem");
    }
  };
  useEffect(() => {
    setalldata(AllDataInitialize);
    setopenmodal((prev) => ({ ...prev, loaded: false }));

    globalindex.producteditindex !== -1
      ? fetchproductdata(globalindex.producteditindex)
      : fetchcate(product);
  }, []);

  useEffect(() => {
    const handleReload = (e: Event) => {
      e.preventDefault();
      if (product.covers.length > 0 && globalindex.producteditindex === -1) {
        const images = product.covers.map((i) => i.name);
        localStorage.setItem("diP", JSON.stringify(images));
      }
    };
    window.addEventListener("beforeunload", handleReload);

    return () => {
      window.removeEventListener("beforeunload", handleReload);
    };
  }, [product.covers]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const createdproduct = { ...product };
    const allproduct = [...allData.product];
    const URL = "/api/products/crud";

    if (createdproduct.covers.length !== 0) {
      if (globalindex.producteditindex === -1) {
        //createproduct
        const created = await ApiRequest(
          URL,
          setisLoading,
          "POST",
          "JSON",
          createdproduct
        );
        if (!created.success) {
          errorToast(created.error as string);
          return;
        }

        allproduct.push({ ...createdproduct, id: created.data.id });

        setproduct(Productinitailizestate);
        successToast(`${product.name} Created`);
      } else {
        //updateProduct

        const updated = await ApiRequest(
          URL,
          setisLoading,
          "PUT",
          "JSON",
          createdproduct
        );
        if (!updated.success) {
          errorToast(updated.error as string);
          return;
        }
        const idx = allproduct.findIndex(
          (i) => i.id === globalindex.producteditindex
        );

        allproduct[idx] = createdproduct;
        successToast(`${product.name} Updated`);
      }

      setopenmodal(SaveCheck(true, "createProduct", openmodal));
      setopenmodal((prev) => ({ ...prev, loaded: true }));
      setalldata({ ...allData, product: allproduct });
    } else {
      errorToast("Image Is Required");
    }
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
    setproduct({
      ...product,
      [name]: value,
    });
    setopenmodal(SaveCheck(false, "createProduct", openmodal));
  };
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "parent_id") {
      const subcates = getsubcategories(parseInt(e.target.value));
      setsubcate(subcates ?? []);
    }
    setproduct({
      ...product,
      category: { ...product.category, [name]: value },
    });
    setopenmodal(SaveCheck(false, "createProduct", openmodal));
  };
  const handleCancel = () => {
    if (!openmodal.confirmmodal.confirm || product.covers.length > 0) {
      setopenmodal(SaveCheck(true, "createProduct", openmodal, true));
      return;
    }
    setproduct(Productinitailizestate);
    setopenmodal({ ...openmodal, createProduct: false });
    setglobalindex({ ...globalindex, producteditindex: -1 });
  };
  return (
    <dialog
      open={openmodal.createProduct}
      className="createProduct__container z-[100] flex items-center justify-center fixed top-0 left-0 bg-white min-h-screen h-fit w-screen"
    >
      <form
        onSubmit={handleSubmit}
        className="createform flex flex-col w-full max-h-[95vh] overflow-y-auto items-center justify-center gap-y-5"
      >
        <div className="product__form w-[100%] flex flex-row gap-x-16 h-screen overflow-y-auto items-start justify-center">
          <div className="image__contianer flex flex-col sticky top-0 gap-y-1 w-[400px] h-fit">
            <PrimaryPhoto
              data={product.covers}
              showcount={true}
              style={{ height: "50vh" }}
            />
            <PrimaryButton
              type="button"
              text={product.covers.length > 0 ? "Edit Photo" : "Upload Photo"}
              width="100%"
              onClick={() => {
                setopenmodal({ ...openmodal, imageupload: true });
              }}
              Icon={<i className="fa-regular fa-image text-lg text-white"></i>}
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
              className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />
            <input
              type="text"
              placeholder="Short Description"
              name="description"
              onChange={handleChange}
              value={product.description}
              required
              className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
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
              className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
            />

            <div className="category_sec flex flex-col gap-y-5  w-full h-fit">
              <Selection
                label="Parent Category"
                default="Select"
                name="parent_id"
                onChange={handleSelect}
                value={product.category.parent_id.toString()}
                type="category"
                required={true}
              />
              {product.category.parent_id > 0 && (
                <Selection
                  label="Sub Category"
                  required={true}
                  name="child_id"
                  default="Type"
                  type="subcategory"
                  subcategory={subcate}
                  onChange={handleSelect}
                  value={product.category.child_id.toString()}
                />
              )}
            </div>
            <Selection
              label="Stock Type"
              value={stocktype}
              data={[
                {
                  label: "Normal",
                  value: "stock",
                },
                {
                  label: "Variants ( Product have multiple versions)",
                  value: "variant",
                },
              ]}
              onChange={(e) => setstocktype(e.target.value as any)}
              required
            />
            {stocktype === "stock" ? (
              <input
                type="number"
                placeholder="Stock"
                name="stock"
                min={0}
                max={1000}
                onChange={handleChange}
                value={product.stock === 0 ? "" : product.stock}
                required
                className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
              />
            ) : (
              <PrimaryButton
                radius="10px"
                textcolor="black"
                hoverTextColor="lightblue"
                Icon={<i className="fa-regular fa-square-plus text-2xl"></i>}
                type="button"
                text={
                  !product.details.some(
                    (i) =>
                      i.info_type === INVENTORYENUM.color ||
                      i.info_type === INVENTORYENUM.text
                  )
                    ? "Add Product Variant"
                    : "Edit Product Varaint"
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
            )}
            <div className="size_con flex flex-col justify-start gap-y-5 h-fit w-full outline outline-[2px] rounded-lg outline-blue-950 p-3">
              {IsAdded(INVENTORYENUM.size).added && (
                <Selection
                  label="Preview"
                  data={product.details
                    .find((i) => i.info_type === INVENTORYENUM.size)
                    ?.info_value?.map((i: any) => ({
                      label: i.val,
                      value: i.qty,
                    }))}
                />
              )}
              {IsAdded(INVENTORYENUM.size).added ? (
                <Sizecontainer index={IsAdded(INVENTORYENUM.size).index} />
              ) : (
                <PrimaryButton
                  radius="10px"
                  textcolor="black"
                  Icon={<i className="fa-regular fa-square-plus text-2xl"></i>}
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
                data={product.details.filter(
                  (i) => i.info_type === INVENTORYENUM.normal
                )}
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
              <DetailsModal />
            )}
          </div>
        </div>
        <div className="w-[90%] h-fit flex flex-row gap-x-5 justify-start">
          <PrimaryButton
            color="#44C3A0"
            text={globalindex.producteditindex === -1 ? "Create" : "Update"}
            type="submit"
            radius="10px"
            width="90%"
            status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
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
      {openmodal.addproductvariant && <Variantcontainer />}
    </dialog>
  );
}
interface variantdatatype {
  type: "COLOR" | "TEXT";
  name: string;
  value: Array<{
    qty: number;
    val: string;
  }>;
}
interface colortype {
  hex: string;
  rgb: RGBColor;
}

const Variantcontainer = () => {
  const { setopenmodal, product, setproduct } = useGlobalContext();
  const [varaintdata, setdata] = useState<Array<variantdatatype> | []>([]);
  const [temp, setemp] = useState<variantdatatype | undefined>(undefined);
  const [newadd, setnew] = useState("none");
  const [qty, setqty] = useState(0);
  const [option, setoption] = useState("");
  const [added, setadded] = useState(-1);
  const [edit, setedit] = useState(-1);
  const [name, setname] = useState("");
  const [isSaved, setisSaved] = useState(true);
  const [loaded, setloaded] = useState(false);
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
    const isExist = product.details.findIndex(
      (i) =>
        i.info_type === INVENTORYENUM.color ||
        i.info_type === INVENTORYENUM.text
    );
    if (isExist !== -1) {
      const updatedetail: Array<variantdatatype> = product.details
        .filter(
          (i) =>
            i.info_type === INVENTORYENUM.color ||
            i.info_type === INVENTORYENUM.text
        )
        .map((i) => ({
          type: i.info_type,
          name: i.info_title,
          value: i.info_value,
        })) as Array<variantdatatype>;

      setdata(updatedetail);
      setloaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      setisSaved(true);
      setloaded(false);
    } else {
      setisSaved(false);
    }
  }, [varaintdata]);

  const handleCreate = () => {
    let update = [...varaintdata];
    const isExist = update.findIndex((i) => i.name === name);

    if (isExist !== -1 && added === -1) {
      errorToast("Variant name exist");
      return;
    }

    if (added === -1) {
      update.push({ ...temp, name: name } as variantdatatype);
    } else {
      update[added] = { ...temp, name: name } as variantdatatype;
    }
    setdata(update);

    setadded(-1);
    setname("");
    setqty(0);
    setnew("none");
  };

  const handleAddColor = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (qty === 0 || color?.hex === "") {
      errorToast("Please fill all required");
      return;
    }
    let update = { ...temp };
    if (edit === -1) {
      update.value?.push({
        qty: qty,
        val: color?.hex,
      });
    } else if (update.value && edit !== -1) {
      update.value[edit] = {
        qty: qty,
        val: color?.hex,
      };
    }
    setemp(update as variantdatatype);
    setqty(0);
    setcolor(colorinitalize);

    setedit(-1);
    setopen((prev) => ({ ...prev, addcolor: false }));
    successToast(edit === -1 ? "Color Added" : "Color Updated");
  };

  const handleColorSelect = (idx: number, type: "color" | "text") => {
    const data = temp?.value[idx];
    if (type === "color") {
      const rgb = tinycolor(data?.val).toRgb();
      setedit(idx);
      setcolor({ hex: data?.val as string, rgb: rgb });
      setqty(data?.qty ?? 0);
      setopen((prev) => ({ ...prev, addcolor: true }));
    } else {
      setedit(idx);
      setqty(data?.qty ?? 0);
      setoption(data?.val as string);

      setopen((prev) => ({ ...prev, addoption: true }));
    }
  };
  const handleVariantEdit = (idx: number) => {
    const data = varaintdata[idx];

    setname(data.name);
    setemp(data);
    setadded(idx);
    setnew("info");
  };
  const handleVaraintDelete = (idx: number) => {
    let update = [...varaintdata];
    update.splice(idx, 1);
    setdata(update);
    setnew("none");
  };
  return (
    <Modal closestate="discount" customZIndex={150}>
      <div className="relative productvariant_creation w-full min-h-full max-h-[50vh] overflow-x-hidden overflow-y-auto bg-white flex flex-col items-center justify-start pt-5 gap-y-5">
        <div className="w-full flex flex-col items-center gap-y-5">
          {varaintdata.map((obj, idx) => (
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
                {obj.name === "" ? "No Name" : obj.name}
              </h3>
              <motion.div className="varaints flex flex-row w-full gap-x-3">
                {obj.type === "TEXT" &&
                  obj.value.map((item) => (
                    <div className="min-w-[40px] h-fit max-w-full break-words font-normal text-lg">
                      {item.val}
                    </div>
                  ))}
                {obj.type === "COLOR" &&
                  obj.value.map((item) => (
                    <div
                      style={{ backgroundColor: item.val }}
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
        {newadd === "info" && (
          <div className="addcontainer w-[95%] h-fit flex flex-col gap-y-5 border border-black rounded-lg p-2">
            <input
              name="name"
              placeholder="Variant Name"
              value={name}
              onChange={(e) => setname(e.target.value)}
              className="text-sm font-medium pl-1 h-[30px] w-full border-2 border-gray-300 rounded-md"
            />
            {temp && temp.type === "COLOR" ? (
              <div className="color_container w-full h-fit flex flex-col gap-y-5">
                <h3
                  onClick={() => {
                    setedit(-1);
                    setqty(0);
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
                    closestate="discount"
                    customwidth="30vw"
                    customheight="30vh"
                  >
                    <form
                      onSubmit={handleAddColor}
                      className="relative w-full h-full bg-white flex flex-col items-center justify-center gap-y-3 p-3"
                    >
                      <label
                        htmlFor="qty"
                        className="font-semibold text-sm w-full text-left"
                      >
                        {" "}
                        Stock{" "}
                        <strong className="text-red-400 text-lg font-normal">
                          *
                        </strong>{" "}
                      </label>
                      <input
                        name="qty"
                        placeholder="Stock (Required)"
                        type="number"
                        value={qty}
                        pattern="[0-9]+"
                        min={0}
                        max={1000}
                        onChange={(e) => setqty(parseInt(e.target.value))}
                        className="text-sm font-medium pl-1 h-[50px] w-full border-2 border-gray-300 rounded-md"
                        required
                      />

                      <label
                        htmlFor="qty"
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
                          setopen((prev) => ({ ...prev, colorpicker: true }));
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
                        disable={!qty || color.hex === ""}
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

                            setqty(0);
                            setopen((prev) => ({ ...prev, addcolor: false }));
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
                            setopen((prev) => ({ ...prev, addcolor: false }));
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
                  {temp?.value?.some((i) => i.val !== "") ? (
                    temp?.value?.map((color, idx) => (
                      <div
                        className={`color w-[50px] h-[50px] rounded-3xl transition duration-500 hover:border-2 hover:border-gray-300 active:border-2  active:border-gray-300`}
                        onClick={() => handleColorSelect(idx, "color")}
                        style={
                          color.val !== ""
                            ? {
                                backgroundColor: color.val,
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
                  <Modal closestate="discount" customZIndex={150}>
                    <form className="addoption w-1/3 h-1/3 bg-white p-3 flex flex-col gap-y-5 items-center justify-start">
                      <input
                        name="qty"
                        placeholder="Stock (Required)"
                        type="number"
                        value={qty}
                        pattern="[0-9]+"
                        min={0}
                        max={1000}
                        onChange={(e) => setqty(parseInt(e.target.value))}
                        className="text-sm font-medium pl-1 h-[50px] w-full border-2 border-gray-300 rounded-md"
                        required
                      />
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
                          color="lightcoral"
                          type="submit"
                          onClick={() => {
                            let update = { ...temp };
                            if (edit === -1) {
                              update.value?.push({
                                qty: qty,
                                val: option,
                              });
                            } else if (update.value) {
                              update.value[edit] = {
                                qty: qty,
                                val: option,
                              };
                              setedit(-1);
                            }
                            setemp(update as variantdatatype);
                            setopen((prev) => ({ ...prev, addoption: false }));
                          }}
                          disable={!qty || option === ""}
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
                            setopen((prev) => ({ ...prev, addoption: false }));
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
                      setqty(0);
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
                        {i.val}
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
                  setnew("none");
                }}
                radius="10px"
                width="100%"
                height="100%"
              />
            </div>
          </div>
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
              onClick={() => setnew("none")}
              radius="10px"
              width="90%"
              height="35px"
            />
          </>
        )}
        {newadd === "none" && (
          <PrimaryButton
            text="Add New"
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
            height="30px"
          />
        )}
        <div className="relative pt-10 pb-10 bottom-5 w-[90%] h-[40px] flex flex-row justify-start gap-x-5">
          <PrimaryButton
            text="Save"
            type="button"
            onClick={() => {
              let updateproduct = [...product.details];

              let filtered = updateproduct.filter((i) => {
                if (i.info_type === "COLOR" || i.info_type === "TEXT") {
                  return varaintdata.some((item) => item.name === i.info_title);
                }
                return true;
              }); // Delete Variants

              varaintdata.forEach((item) => {
                const idx = filtered.findIndex(
                  (i) => i.info_title === item.name
                );

                if (idx === -1) {
                  filtered.push({
                    info_title: item.name as string,
                    info_type: item.type as string,
                    info_value: item.value as any,
                  });
                } else {
                  filtered[idx] = {
                    info_title: item.name as string,
                    info_type: item.type as string,
                    info_value: item.value as any,
                  };
                }
              });

              setproduct((prev) => ({ ...prev, details: filtered }));
              setisSaved(true);
              successToast("Saved");
            }}
            radius="10px"
            width="90%"
            textsize="12px"
            height="40px"
            color="#438D86"
            disable={isSaved}
          />

          <PrimaryButton
            text="Close"
            type="button"
            onClick={() => {
              setopenmodal((prev) => ({ ...prev, addproductvariant: false }));
            }}
            radius="10px"
            width="90%"
            textsize="12px"
            height="40px"
            color="lightcoral"
          />
        </div>
      </div>
    </Modal>
  );
};

interface SizecontainerProps {
  index: number;
}

const Sizecontainer = (props: SizecontainerProps) => {
  const [customvalue, setvalue] = useState("");
  const [qty, setqty] = useState(0);
  const [Edit, setedit] = useState({
    isEdit: false,
    index: -1,
  });
  const { product, setproduct } = useGlobalContext();
  const handleAdd = () => {
    const detail = [...product.details];
    const prevarr = detail[props.index].info_value;

    if (customvalue === "" || !qty) {
      errorToast("Please fill all Required");
      return;
    }
    //add and edit size
    if (Edit.index > -1) {
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
    detail[props.index].info_value = prevarr as any;

    setproduct({ ...product, details: detail });

    setedit({
      isEdit: false,
      index: -1,
    });
    setqty(0);
    setvalue("");
  };
  const handleDelete = (index: number) => {
    const updatearr = [...product.details[props.index].info_value];
    const detail = [...product.details];

    updatearr.splice(index, 1);
    detail[props.index].info_value = updatearr as any;
    setproduct({ ...product, details: detail });
  };

  return (
    <div className="size__contianer w-full h-fit flex flex-col gap-y-5">
      <div className="size_list grid grid-cols-4 w-fit gap-x-5 gap-y-5 h-full">
        {product.details[props.index]?.info_value?.map((i, idx) => {
          const val = i as infovaluetype;
          return (
            <div
              key={idx}
              className="size flex flex-row z-[100] justify-center outline outline-2 outline-black outline-offset-2 w-[100px]  p-2 h-fit rounded-lg text-center font-bold"
              style={
                Edit.index === idx
                  ? { backgroundColor: "black", color: "white" }
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

                  setqty(Edit.index === idx ? 0 : val.qty);

                  setvalue(Edit.index === idx ? "" : val.val);
                }}
                className={`relative w-full h-full break-words right-2`}
              >
                {val.val}
              </h3>
            </div>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="Size (Required)"
        name="size"
        value={customvalue}
        onChange={(e) => setvalue(e.target.value)}
        className="w-[100%] h-[35px] text-sm pl-1 font-bold bg-[#D9D9D9] rounded-md "
      />
      <input
        type="number"
        placeholder="Stock"
        name="qty"
        value={qty}
        onChange={(e) => setqty(parseInt(e.target.value))}
        className="w-[100%] h-[35px] text-sm pl-1 font-bold bg-[#D9D9D9] rounded-md "
      />

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

      <PrimaryButton
        color="#F08080"
        text="Delete"
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
    </div>
  );
};

export const DetailsModal = () => {
  const { setopenmodal, globalindex } = useGlobalContext();

  return (
    <div className="details_modal bg-[#CFDBEE] w-full h-full flex flex-col gap-y-5 p-14">
      <NormalDetail index={globalindex.productdetailindex} />

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
      <div className="category relative rounded-md p-2 w-full min-h-[600px] max-h-[700px] flex flex-col bg-white gap-y-5 justify-start items-center">
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
      </div>
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
                <h3
                  onClick={() => handleClick(idx)}
                  className="parentcateogry text-xl transition duration-300 hover:text-white font-bold w-full h-full break-all flex items-center justify-center cursor-pointer text-center rounded-lg "
                >
                  {obj.name}
                </h3>
                <h3
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
                </h3>
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

const NormalDetail = ({ index }: { index: number }) => {
  const { product, setproduct, setglobalindex, setopenmodal } =
    useGlobalContext();
  const [normaldetail, setnormal] = useState({
    info_title: "",
    info_value: "",
  });
  useEffect(() => {
    const editindex = index === -1;
    if (!editindex) {
      setnormal({
        info_title: product.details[index].info_title,
        info_value: product.details[index].info_value[0] as string,
      });
    }
  }, []);
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
  } = useGlobalContext();

  const [Imgurl, seturl] = useState<Imgurl[]>([]);
  const [Imgurltemp, seturltemp] = useState<Imgurl[]>([]);
  const [Files, setfiles] = useState<File[]>([]);

  useEffect(() => {
    seturl(
      product.covers.length > 0
        ? product.covers.map((i) => ({ ...i, isSave: true }))
        : banner.image?.url.length > 0
        ? [banner.image]
        : []
    );
  }, [product.covers, banner.image]);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files;
    const updateUrl = [...Imgurl];
    if (Imgurltemp.length > 0) {
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
          id: updateUrl.length,
        })
      );

      seturl(updateUrl);
      setfiles((prev) => [...prev, ...filteredFile]);
      setopenmodal({
        ...openmodal,
        confirmmodal: { ...openmodal.confirmmodal, confirm: false },
      });

      filteredFileUrl.length > 0 && seturltemp([]);
    }
  };
  const handleDelete = (index: number) => {
    const updateUrl = [...Imgurl];
    const updatefile = [...Files];
    const temp = updateUrl[index];

    updatefile.splice(index, 1);

    updateUrl.splice(index, 1);
    seturltemp([...Imgurltemp, temp]);
    seturl(updateUrl);
    setfiles(updatefile);
    setopenmodal({
      ...openmodal,
      confirmmodal: { ...openmodal.confirmmodal, confirm: false },
    });
  };

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
        setproduct({ ...product, covers: savedUrl });
      } else if (props.type === "createbanner") {
        setbanner({ ...banner, image: savedUrl[0] });
      }
      seturltemp([]);

      seturl(savedUrl);
      setfiles([]);

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
    if (!openmodal.confirmmodal.confirm) {
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
          {Imgurl.filter((i) => i.url !== "").map((file, index) => (
            <div key={index} className="image_container relative">
              <Image
                src={file.url}
                style={
                  props.type === "createbanner"
                    ? { width: "400px", height: "auto", objectFit: "contain" }
                    : { width: "400px", height: "550px", objectFit: "cover" }
                }
                width={1000}
                height={1000}
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
          <InputFileUpload onChange={handleFile} multiple={props.mutitlple} />
          <PrimaryButton
            onClick={() => handleSave()}
            type="button"
            text="Save"
            width="100%"
            height="50px"
            color="#44C3A0"
            radius="10px"
            status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
            disable={openmodal.confirmmodal.confirm}
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
      </div>
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
  const handleCancel = () => {
    if (!openmodal.confirmmodal.confirm || banner.image.name.length > 0) {
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
      setbanner(BannerInitialize);
      setopenmodal(SaveCheck(true, "createBanner", openmodal));
      setalldata({ ...allData, banner: allbanner });
    } else {
      toast.error("Image Is Missing", { autoClose: 2000, pauseOnHover: true });
    }
  };
  useEffect(() => {
    const handleReload = (e: Event) => {
      e.preventDefault();
      if (banner.image.name.length > 0) {
        localStorage.setItem("diB", banner.image.name);
      }
    };
    if (globalindex.bannereditindex === -1) {
      window.addEventListener("beforeunload", handleReload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleReload);
    };
  }, [banner]);
  return (
    <Modal customwidth="100%" customheight="100%" closestate="createBanner">
      <div className="bannermodal_content bg-white border border-black p-1 w-auto min-w-1/2 max-w-full h-fit  flex flex-col gap-y-5 justify-start items-center">
        <div className="image_container flex flex-col justify-center w-[95vw] items-center h-full">
          <div className="flex flex-col justify-center w-fit  min-w-[80vw] max-h-[80vh] min-h-[250px]">
            {banner.image.url.length === 0 ? (
              <h3 className="w-full bg-red-300 text-white text-lg p-2 font-bold">
                No Image
              </h3>
            ) : (
              <img
                src={banner.image?.url}
                alt={"Banner"}
                className="w-auto min-h-[250px] max-h-[80vh]  mt-9 object-cover"
                loading="lazy"
              />
            )}
            <h3 className="w-full p-2 bg-[#495464] font-black text-white mb-5">
              {banner.name.length > 0 ? banner.name : "Banner Name"}
            </h3>
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
              disable={banner.image?.url.length === 0}
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
      </div>
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

export const UpdateStockModal = () => {
  const {
    product,
    setproduct,
    allData,
    setalldata,
    globalindex,
    setglobalindex,
    setopenmodal,
    isLoading,
    setisLoading,
  } = useGlobalContext();
  return (
    <Modal closestate="updatestock">
      <div className="updatestock w-[100%] h-[100%] rounded-lg flex flex-col items-center justify-center gap-y-5 bg-white p-1">
        <label className="text-lg font-bold">Update Stock </label>
        <input
          type="number"
          placeholder="Stock"
          name="stock"
          min={0}
          max={1000}
          onChange={(e) => {
            let updatestock = {
              ...allData.product[globalindex.producteditindex],
            };
            updatestock.stock = parseInt(e.target.value);
            setproduct(updatestock);
          }}
          value={
            product.stock === 0
              ? allData.product[globalindex.producteditindex]?.stock
              : product.stock
          }
          required
          className="w-[80%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
        />
        <PrimaryButton
          color="#44C3A0"
          text="Update"
          type="button"
          onClick={async () => {
            const update = await ApiRequest(
              "/api/products/crud",
              setisLoading,
              "PUT",
              "JSON",
              product
            );
            if (!update.success) {
              errorToast("Failed To Update Stock");
              return;
            }
            let updatestock = [...allData.product];
            updatestock[globalindex.producteditindex].stock = product.stock;
            setalldata((prev) => ({ ...prev, product: updatestock }));
            setproduct(Productinitailizestate);
            setglobalindex((prev) => ({ ...prev, producteditindex: -1 }));
            setopenmodal((prev) => ({ ...prev, updatestock: false }));
            successToast("Stock Updated");
          }}
          radius="10px"
          status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
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
          disable={SpecificAccess(isLoading)}
          onClick={() => {
            setopenmodal((prev) => ({ ...prev, updatestock: false }));
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
    setalldata,
    allData,
    globalindex,
    setglobalindex,
    allfiltervalue,
    setallfilterval,
  } = useGlobalContext();

  const [isEdit, setisEdit] = useState(false);

  const fetchdata = async (id: number) => {
    const request = await ApiRequest(
      `/api/promotion?ty=edit&p=${globalindex.promotioneditindex}`,
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
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const promo = { ...promotion };
    const isProduct = promo.Products.filter((i) => i.id !== 0).length;
    if (
      globalindex.promotioneditindex === -1 &&
      (isProduct === 0 || !promo.expiredAt)
    ) {
      errorToast(
        !promo.expiredAt ? "Please Fill Expire Date" : "Please Select Product"
      );
      return;
    }

    const allPromo = [...allData.promotion];
    const allProduct = [...allData.product];
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
    if (globalindex.promotioneditindex === -1) {
      allPromo.push(promo);
      allProduct.forEach((i) => {
        promo.Products.forEach((j) => {
          if (j.id === i.id) {
            i.discount = {
              percent: j.discount?.percent ?? "",
              newPrice: j.discount?.newPrice ?? "",
            };
          }
        });
      });

      setpromotion(PromotionInitialize);
    } else {
      const idx = allPromo.findIndex(
        (i) => i.id === globalindex.promotioneditindex
      );
      allPromo[idx].banner_id = promo.banner_id;
      if (!promo.banner_id) {
        allPromo[idx].banner = undefined;
      }
      allProduct.forEach((i) => {
        promo.Products.forEach((j) => {
          if (j.id === i.id) {
            i.discount = {
              percent: j.discount?.percent ?? "",
              newPrice: j.discount?.newPrice ?? "",
            };
          }
        });
      });
      setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
      setopenmodal((prev) => ({ ...prev, createPromotion: false }));

      setpromotion(PromotionInitialize);

      setinventoryfilter("promotion");
    }

    setalldata((prev) => ({
      ...prev,
      promotion: allPromo,
      product: allProduct,
    }));
    setisEdit(false);

    successToast(
      `Promotion ${
        globalindex.promotioneditindex === -1 ? "Created" : "Updated"
      }`
    );
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setpromotion((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setopenmodal(SaveCheck(false, "createPromotion", openmodal));
    setisEdit(true);
  };
  const handleCancel = () => {
    const allfilter = [...allfiltervalue];
    if (openmodal.confirmmodal.confirm) {
      setpromotion(PromotionInitialize);
      globalindex.promotioneditindex === -1 && setinventoryfilter("promotion");
      setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
      setopenmodal((prev) => ({ ...prev, createPromotion: false }));
    } else {
      setopenmodal((prev) => ({
        ...prev,
        confirmmodal: {
          open: true,
          confirm: false,
          type: "promotioncancel",
          closecon: "createPromotion",
        },
      }));
    }
    allfilter.forEach((i) => {
      if (i.page === "product") {
        i.filter = { ...i.filter, promotionid: undefined };
      }
    });
    setallfilterval(allfilter);
    setinventoryfilter("promotion");
  };
  const handleSelectProduct = (type: "product" | "banner") => {
    const isSelect = promotion.Products.every((i) => i.id !== 0);
    const allfilter = [...allfiltervalue];
    const Isfilterexist = allfilter.findIndex((i) => i.page === type);
    if (Isfilterexist === -1) {
      allfilter.push({
        page: type,
        filter:
          globalindex.promotioneditindex === -1
            ? FiltervalueInitialize
            : globalindex.promotioneditindex !== -1 && type === "product"
            ? {
                ...FiltervalueInitialize,
                promotionid: promotion.id,
              }
            : FiltervalueInitialize,
      });
    } else {
      if (globalindex.promotioneditindex !== -1) {
        allfilter[Isfilterexist].filter.promotionid = promotion.id;
      }
    }

    setopenmodal(SaveCheck(false, "createPromotion", openmodal));
    setinventoryfilter(type);

    setallfilterval(allfilter);

    setpromotion((prev) => ({
      ...prev,
      products: !isSelect ? [] : prev.Products,
      [type === "product" ? "selectproduct" : "selectbanner"]: true,
    }));
    infoToast(
      "Start selection by click on " + type + " click again to remove discount"
    );

    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
  };

  return (
    <Modal closestate={"none"}>
      <div className="createPromotion__container relative  rounded-lg w-full h-full bg-white p-3 flex flex-col justify-center items-center">
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
            value={dayjs(promotion.expiredAt)}
            onChange={(e) => {
              setpromotion((prev) => ({ ...prev, expiredAt: dayjs(e) }));
              setisEdit(true);
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
      </div>
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
    setpromotion,
    globalindex,

    setopenmodal,
  } = useGlobalContext();
  const discounteditindex = globalindex.promotionproductedit;
  const [discount, setdiscount] = useState<number>(0);
  useEffect(() => {
    if (globalindex.promotionproductedit !== -1) {
      const idx = promotion.Products.findIndex(
        (i) => i.id === globalindex.promotionproductedit
      );
      const promo = promotion.Products[idx].discount;
      const percent = parseInt(promo?.percent ?? "");
      setdiscount(percent);
    }
  }, []);
  const handleDiscount = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let promoproduct = [...promotion.Products];
    const promoproductid = promoproduct.map((i) => i.id);
    const product = allData.product
      .map((i) => (promoproductid.includes(i.id ?? 0) ? i : null))
      .filter((i) => i?.id);

    if (discounteditindex === -1) {
      promoproduct.forEach((i, idx) => {
        const price = product[idx]?.price ?? 0;
        i.discount = {
          percent: discount?.toString() as string,
          newPrice: (price - (price * discount) / 100).toFixed(2),
          oldPrice: price,
        };
      });
      setpromotion((prev) => ({ ...prev, products: promoproduct }));
    } else {
      const idx = promotion.Products.findIndex(
        (i) => i.id === globalindex.promotionproductedit
      );

      let oldprice = promoproduct[idx].discount?.oldPrice ?? 0;
      promoproduct[idx].discount = {
        percent: discount?.toString() as string,
        newPrice: (oldprice - (oldprice * discount) / 100).toFixed(2),
        oldPrice: oldprice as number,
      };

      setpromotion((prev) => ({ ...prev, products: promoproduct }));

      successToast("Discount Set");
      setopenmodal((prev) => ({ ...prev, discount: false }));
    }
  };
  return (
    <Modal customwidth="30%" customheight="fit-content" closestate="discount">
      <form
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
          onChange={(e) => setdiscount(parseInt(e.target.value))}
          required
        />
        <PrimaryButton
          type="submit"
          text="Confirm"
          width="100%"
          radius="10px"
        />
      </form>
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
      errorToast(register.error ?? "Failed To Register User");
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
  const handleDelete = (id: number) => {
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
                onClick={() =>
                  handleDelete(allData.user.findIndex((i) => i.id === data.id))
                }
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
  province: string;
  houseId: number;
  district: string;
  songkhat: string;
  postalcode: string;
  isSaved: boolean;
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
    setloading((prev) => ({ ...prev, post: true }));
    const formeddata = new FormData();

    let userdata = { ...data };

    const { shipping } = userdata;

    if (shipping && index >= 0 && index < shipping.length) {
      let selectedShipping = shipping[index];

      Object.entries(selectedShipping).forEach(([key, value]) => {
        if (typeof value === "string") {
          formeddata.set(key, value);
        }
      });

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

    let url = `/api/auth/users/info?ty=${type}`;
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
    setloading((prev) => ({ ...prev, post: false }));
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
                    >
                      Address {idx + 1}
                    </h3>

                    {open && open[`sub${idx + 1}`] && (
                      <div className="addressform relative w-full h-fit flex flex-col items-center gap-y-5 p-5">
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
                          name="houseId"
                          type="text"
                          onChange={(e) => Handleaddresschange(e, idx)}
                          value={i.houseId}
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
                            status={loading.post ? "loading" : "authenticated"}
                            disable={
                              i.isSaved
                                ? !loading.edit
                                : Object.entries(i).some(([_, value]) =>
                                    typeof value === "string"
                                      ? value.length === 0
                                      : typeof value === "number"
                                      ? value === 0
                                      : false
                                  )
                            }
                            onClick={() => handleAdd(idx)}
                          />
                          <PrimaryButton
                            type="button"
                            text={"Delete"}
                            disable={SpecificAccess(loading)}
                            onClick={() => handleRemove(idx)}
                            color="lightcoral"
                            width="100%"
                            height="50px"
                            radius="10px"
                          />
                        </div>
                      </div>
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
                province: "",
                district: "",
                songkhat: "",
                houseId: 0,
                postalcode: "",
                isSaved: false,
              });
              setopen((prev: any) => ({
                ...prev,
                [`sub${address?.length}`]: address?.length === 1,
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
              width="100%"
              status={loading.post ? "loading" : "authenticated"}
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
