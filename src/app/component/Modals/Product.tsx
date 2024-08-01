import { ApiRequest } from "@/src/context/CustomHook";
import {
  CateogoryState,
  DefaultSize,
  infovaluetype,
  Productinitailizestate,
  ProductState,
  ProductStockType,
  SpecificAccess,
  SubcategoriesState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ContainerLoading, errorToast, successToast } from "../Loading";
import { motion } from "framer-motion";
import { PrimaryPhoto } from "../PhotoComponent";
import PrimaryButton, { Selection } from "../Button";

import Modal from "../Modals";
import ToggleMenu, { SearchAndMultiSelect } from "../ToggleMenu";
import { Variantcontainer } from "./VariantModal";
import { ImageUpload } from "./Image";
import { Input } from "@nextui-org/react";
import { VariantIcon } from "../Asset";

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
    const categories = await ApiRequest(
      "/api/categories?ty=create",
      setisLoading,
      "GET"
    );
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
      (i) => i.info_type === "COLOR" || i.info_type === "TEXT"
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

  useEffect(() => {
    setedit((prev) => ({ ...prev, productinfo: true }));
  }, [product.details]);

  //Method

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const createdproduct = { ...product };
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

    setreloaddata(true);

    setedit((prev) => ({ ...prev, productinfo: false }));
    setopenmodal((prev) => ({ ...prev, loaded: true }));
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
  };

  const handleCancel = async () => {
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
      className="createProduct__container z-[200] flex items-center justify-center fixed top-0 left-0 bg-white min-h-screen h-fit w-screen"
    >
      {(loading || isLoading.PUT || isLoading.POST) && <ContainerLoading />}
      <form
        onSubmit={handleSubmit}
        className="createform flex flex-col w-full max-h-[90vh] overflow-y-auto items-center justify-center gap-y-5"
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
              className="w-[100%] h-[40px]  font-bold rounded-md "
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
                    (i) => i.info_type === "SIZE"
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
                className="w-full h-[40px] text-lg pl-1 font-bold rounded-md "
              />
            ) : stocktype === ProductStockType.size ? (
              <div className="size_con flex flex-col justify-start gap-y-5 h-fit w-full  rounded-lg p-3">
                {IsAdded("SIZE").added ? (
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
                        info_type: "SIZE",
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
            height="40px"
          />{" "}
          <PrimaryButton
            color="#F08080"
            text="Cancel"
            type="button"
            radius="10px"
            width="90%"
            height="40px"
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
    </motion.dialog>
  );
}

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
        <div className="w-full h-fit flex flex-row gap-x-5">
          <div
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
          </div>
          <p className="text-red-400 font-bold text-sm">Low Stock: 0</p>
        </div>
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
