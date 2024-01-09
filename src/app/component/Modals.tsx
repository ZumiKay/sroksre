"use client";
import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import CloseIcon from "../Asset/Image/Close.svg";
import TinyColor from "tinycolor2";
import PrimaryButton, { InputFileUpload, Selection } from "./Button";
import "../globals.css";
import ToggleMenu, { AddSubCategoryMenu } from "./ToggleMenu";
import {
  BannerInitialize,
  CateogoryInitailizestate,
  CateogoryState,
  DefaultSize,
  Productinitailizestate,
  PromotionInitialize,
  SaveCheck,
  SpecificAccess,
  SubcategoriesState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { INVENTORYENUM } from "../dashboard/products/page";
import { PrimaryPhoto } from "./PhotoComponent";
import { toast } from "react-toastify";
import { ApiRequest, useRequest } from "@/src/context/CustomHook";
import { errorToast, infoToast, successToast } from "./Loading";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { parse } from "path";
import { Checkbox, FormControl, FormControlLabel, Radio } from "@mui/material";
import { global } from "styled-jsx/css";
import { createBanner } from "../severactions/actions";

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
    | "addsubcategory"
    | "updatestock"
    | "confirmmodal"
    | "filteroption"
    | "discount";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { setopenmodal } = useGlobalContext();

  return (
    <dialog
      onClick={(e) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
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
  const [subcate, setsubcate] = useState<Array<SubcategoriesState>>([]);
  const getsubcategories = (value: number) => {
    const sub = allData.category.find((i) => i.id === value)?.subcategories;
    return sub;
  };

  const [show, setshow] = useState({
    size: false,
    productdetail: false,
    uploadImg: false,
  });
  const fetchcate = async () => {
    const categories = await ApiRequest("/api/categories", setisLoading, "GET");
    if (categories.success) {
      setalldata((prev) => ({ ...prev, category: categories.data }));
      const { parent_id } = product.category;
      const parentid =
        typeof parent_id === "string" ? parseInt(parent_id) : parent_id;
      const subcates: CateogoryState = categories.data.find(
        (i: CateogoryState) => i.id === parentid,
      );

      setsubcate(subcates?.subcategories ?? []);
    } else {
      errorToast("Error Connection");
    }
  };
  useEffect(() => {
    fetchcate();
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
          createdproduct,
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
          createdproduct,
        );
        if (!updated.success) {
          errorToast(updated.error as string);
          return;
        }
        allproduct[globalindex.producteditindex] = createdproduct;
        successToast(`${product.name} Updated`);
      }
      setopenmodal(SaveCheck(true, "createProduct", openmodal));
      setalldata({ ...allData, product: allproduct });
    } else {
      errorToast("Image Is Required");
    }
  };
  const IsAdded = (type: string) => {
    const isExist = product.details.find((i) => i.info_type === type);
    if (isExist) {
      return {
        added: true,
        index: product.details.indexOf(isExist as never),
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
      className="createProduct__container z-[100] flex items-center justify-center fixed top-0 left-0 bg-white h-screen w-screen"
    >
      <form
        onSubmit={handleSubmit}
        className="createform flex flex-col w-4/5 h-4/5 items-center justify-center gap-y-5"
      >
        <div className="product__form w-[100%] flex flex-row gap-x-16 h-fit overflow-y-auto items-start justify-center">
          <div className="image__contianer flex flex-col sticky top-0 gap-y-1 w-[400px] h-full">
            <PrimaryPhoto data={product.covers} showcount={true} />
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

            {IsAdded(INVENTORYENUM.size).added && (
              <Selection
                default="Select"
                data={
                  product.details[IsAdded(INVENTORYENUM.size).index].info_value
                }
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
                    info_title: INVENTORYENUM.size,
                    info_value: DefaultSize,
                    info_type: INVENTORYENUM.size,
                  });
                  setproduct({ ...product, details: updatearr });
                }}
                height="50px"
                color="#D9D9D9"
              />
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
              <ToggleMenu name="Product Details" data={product.details} />
            </div>
            {!openmodal.productdetail ? (
              <PrimaryButton
                color="#0097FA"
                text="Add more detail"
                onClick={() => {
                  setopenmodal({ ...openmodal, productdetail: true });
                }}
                type="button"
                radius="10px"
                width="100%"
                height="50px"
              />
            ) : (
              <DetailsModal
                isEdit={edit.productdetail}
                isAdded={IsAdded}
                open={show}
                setopen={setshow}
              />
            )}
          </div>
        </div>
        <PrimaryButton
          color="#44C3A0"
          text={
            globalindex.producteditindex || globalindex.bannereditindex > -1
              ? "Create"
              : "Update"
          }
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
      </form>
      {openmodal.imageupload && (
        <ImageUpload limit={4} mutitlple={true} type="createproduct" />
      )}
    </dialog>
  );
}
interface SizecontainerProps {
  index: number;
}

const Sizecontainer = (props: SizecontainerProps) => {
  const [customvalue, setvalue] = useState("");
  const [Edit, setedit] = useState({
    isEdit: false,
    index: -1,
  });
  const { product, setproduct } = useGlobalContext();
  const handleAdd = () => {
    const detail = [...product.details];
    const prevarr = [...detail[props.index].info_value];
    if (customvalue === "") {
      errorToast("Name Required");
      return;
    }
    //add and edit size
    if (Edit.index > -1) {
      prevarr[Edit.index] = customvalue;
    } else {
      prevarr.push(customvalue);
    }
    detail[props.index].info_value = prevarr;

    setproduct({ ...product, details: detail });

    setedit({
      isEdit: false,
      index: -1,
    });
    setvalue("");
  };
  const handleDelete = (index: number) => {
    const updatearr = [...product.details[props.index].info_value];
    const detail = [...product.details];

    updatearr.splice(index, 1);
    detail[props.index].info_value = updatearr;
    setproduct({ ...product, details: detail });
  };

  const SizeElement = (props: { value: string; id: number }) => {
    return (
      <div
        key={props.id}
        className="size flex flex-row z-[100] justify-center bg-gray-300 w-[100px]  p-2 h-fit rounded-lg text-center font-bold"
        style={
          Edit.index === props.id
            ? { backgroundColor: "black", color: "white" }
            : {}
        }
      >
        <span
          onClick={() => handleDelete(props.id)}
          className="relative -top-5 left-[100%] transition hover:-translate-y-1"
        >
          <i className="fa-solid fa-minus font-bold text-white  text-[10px] bg-[#F08080] rounded-2xl p-1"></i>
        </span>

        <h3
          onClick={() => {
            setedit((prev) => ({
              isEdit: !prev.isEdit,
              index: prev.index === props.id ? -1 : props.id,
            }));
            setvalue((prev) => (prev === props.value ? "" : props.value));
          }}
          className={`relative w-full break-words right-2`}
        >
          {props.value}
        </h3>
      </div>
    );
  };
  return (
    <div className="size__contianer w-full h-fit flex flex-col gap-y-5">
      <div className="size_list grid grid-cols-4 w-fit gap-x-5 gap-y-5 h-full">
        {product.details[props.index].info_value.map((i, idx) => (
          <SizeElement value={i} id={idx} />
        ))}
      </div>

      <input
        type="text"
        placeholder="Custom Size"
        name="size"
        value={customvalue}
        onChange={(e) => setvalue(e.target.value)}
        className="w-[100%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
      />
      {customvalue !== "" && (
        <PrimaryButton
          color="#44C3A0"
          text="Add"
          type="button"
          radius="10px"
          onClick={() => handleAdd()}
          width="100%"
          height="50px"
        />
      )}

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
        height="50px"
      />
    </div>
  );
};

export const DetailsModal = (props: {
  open: any;
  isEdit: boolean;
  setopen: any;
  isAdded: (type: string) => {
    added: boolean;
    index: number;
  };
}) => {
  const {
    product,
    setproduct,
    openmodal,
    setopenmodal,
    globalindex,
    setglobalindex,
  } = useGlobalContext();

  const alltype = [INVENTORYENUM.normal, INVENTORYENUM.color];
  const [index, setindex] = useState(0);
  const [type, settype] = useState("");
  useEffect(() => {
    const idx = globalindex.productdetailindex;
    if (idx !== -1) {
      settype(product.details[idx].info_type);
    }
  }, [globalindex]);

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    let newDetail = [...product.details];
    let value = e.target.value;
    newDetail.push({
      info_type: value,
      info_value: [""],
      info_title: "",
    });
    setproduct({ ...product, details: newDetail });
    settype(e.target.value);
    setindex(newDetail.length - 1);
  };

  const ChoseType = () => {
    return (
      <div className="type_container w-full h-fit flex flex-col items-center gap-y-5">
        <h3 className="text-xl font-bold">Choose Type Of Details</h3>
        <Selection
          data={alltype}
          onChange={handleSelect}
          default="TYPE"
          style={{ width: "100%", height: "50px" }}
        />
      </div>
    );
  };

  return (
    <div className="details_modal bg-[#CFDBEE] w-full h-full flex flex-col gap-y-5 p-14">
      {type === INVENTORYENUM.normal ? (
        <NormalDetail
          open={props.open}
          setopen={props.setopen}
          index={
            globalindex.productdetailindex === -1
              ? index
              : globalindex.productdetailindex
          }
        />
      ) : type === INVENTORYENUM.color ? (
        <Color
          index={
            globalindex.productdetailindex === -1
              ? index
              : globalindex.productdetailindex
          }
        />
      ) : (
        <ChoseType />
      )}

      <PrimaryButton
        width="100%"
        height="50px"
        radius="10px"
        text="Back"
        onClick={() => {
          const updatedDetails = [...product.details];
          if (globalindex.productdetailindex !== -1) {
            setglobalindex({ ...globalindex, productdetailindex: -1 });
            setopenmodal({ ...openmodal, productdetail: false });
          } else {
            if (type !== "") {
              const currentInfoTitle = updatedDetails[index].info_title;

              if (currentInfoTitle === "") {
                updatedDetails.splice(index, 1);
                setproduct({ ...product, details: updatedDetails });
              }
              settype("");
            }
            if (type === "") {
              setopenmodal({ ...openmodal, productdetail: false });
            }
          }
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
      cate,
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
          className="category_header w-[50%] text-center text-lg font-bold transition hover:-translate-y-1 cursor-pointer"
          style={show === "Create" ? { borderBottom: "3px solid #495464" } : {}}
        >
          Create
        </h3>
        <h3
          onClick={() => handleNavbar("Edit")}
          className="category_header w-[50%] text-center text-lg font-bold transition hover:-translate-y-1 cursor-pointer"
          style={show === "Edit" ? { borderBottom: "3px solid #495464" } : {}}
        >
          Edit
        </h3>
      </div>
    );
  };
  return (
    <Modal closestate="createCategory" customheight="600px">
      <div className="category relative rounded-md p-2 w-full h-full max-h-[700px] flex flex-col bg-white gap-y-5 justify-center items-center">
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
            <PrimaryButton
              width="80%"
              height="50px"
              radius="10px"
              onClick={() => category.name.length > 0 && handleAdd()}
              text="Create"
              status={!SpecificAccess(isLoading) ? "authenticated" : "loading"}
              color="#35C191"
              type="button"
              disable={category.name.length === 0}
            />
            <PrimaryButton
              width="80%"
              height="50px"
              radius="10px"
              text="Cancel"
              onClick={() => handleCancel()}
              color="#CE9EAD"
              type="button"
            />{" "}
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

  //API Request
  const URL = "/api/categories";

  const { makeRequest } = useRequest(URL, "GET", null, "category");
  const fetchAllCate = async () => {
    await makeRequest();
  };

  useEffect(() => {
    fetchAllCate();
  }, []);

  /////

  const handleClick = (index: number) => {
    setopenmodal((prev) => ({ ...prev, addsubcategory: !prev.addsubcategory }));
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
      },
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
      category,
    );
    if (updateRequest.success && !isLoading.PUT) {
      let allcate = [...allData.category];

      allcate[editindex].name = category.name;
      allcate[editindex].subcategories = category.subcategories;
      setalldata((prev) => ({ ...prev, category: allcate }));
      setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
      seteditindex(-1);
      setcategory(CateogoryInitailizestate);
      successToast("Category Updated");
    } else {
      errorToast("Failed To Update");
    }
  };
  const handleReset = () => {
    let deletedcate = [...tempcate];
    let allcate = [...allData.category];
    const resetcate = deletedcate.filter((obj) =>
      globalindex.categoryeditindex.includes(obj.id as number),
    );
    resetcate.forEach((obj) => allcate.push(obj));
    setalldata((prev) => ({ ...prev, category: allcate }));
    settempcate([]);
    setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
  };
  return (
    <>
      <div className="EditCategory w-[90%] h-full overflow-y-auto  flex flex-col gap-y-5 p-1">
        {!openmodal.addsubcategory ? (
          <>
            {allData.category.length === 0 && (
              <h1 className="text-lg text-red-400 font-bold text-center">
                No Category
              </h1>
            )}
            {allData.category.map((obj, idx) => (
              <div
                key={idx}
                className="parentcategory active:bg-black  active:text-white w-full bg-gray-200 h-fit min-h-[50px] rounded-lg flex flex-row items-center gap-x-5"
              >
                <h3
                  onClick={() => handleClick(idx)}
                  className="parentcateogry text-xl font-bold w-full h-full break-all flex items-center justify-center cursor-pointer text-center rounded-lg transition hover:bg-black hover:text-white "
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
                  className="actions text-red-500 font-bold text-lg cursor-pointer w-1/2 h-full transition-colors rounded-lg  flex items-center justify-center hover:bg-red-500 hover:text-white active:text-white"
                >
                  {" "}
                  Delete
                </h3>
              </div>
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
                setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
                setcategory(CateogoryInitailizestate);
              }}
              width="100%"
              color="lightpink"
              height="50px"
              radius="10px"
            />
          </div>
        )}
      </div>
      {globalindex.categoryeditindex.length > 0 && (
        <div className="flex flex-col gap-y-3 w-full h-fit">
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

interface normaldetailprops {
  index: number;
  open: any;
  setopen: any;
}
const NormalDetail = (props: normaldetailprops) => {
  const { product, setproduct, globalindex, setglobalindex, setopenmodal } =
    useGlobalContext();
  const [normaldetail, setnormal] = useState({
    info_title: "",
    info_value: "",
  });
  useEffect(() => {
    const editindex = globalindex.productdetailindex === -1;
    if (!editindex) {
      setnormal({
        info_title: product.details[globalindex.productdetailindex].info_title,
        info_value:
          product.details[globalindex.productdetailindex].info_value[0],
      });
    }
  }, [globalindex]);
  const handleAdd = () => {
    const updatedetail = [...product.details];
    const isExist = updatedetail.some(
      (obj, idx) =>
        idx !== props.index && obj.info_title === normaldetail.info_title,
    );
    if (isExist) {
      errorToast("Name Already Exist");
      return;
    }
    updatedetail[props.index].info_title = normaldetail.info_title;
    updatedetail[props.index].info_value[0] = normaldetail.info_value;
    updatedetail[props.index].info_type = INVENTORYENUM.normal;
    setproduct({ ...product, details: updatedetail });
    setglobalindex((prev) => ({ ...prev, productdetailindex: -1 }));

    setopenmodal((prev) => ({ ...prev, productdetail: false }));

    //save detail
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
          normaldetail.info_value.length < 1 ||
          normaldetail.info_title.length < 1
        }
      />
    </div>
  );
};

const Color = (props: { index: number }) => {
  const { product, setproduct, globalindex } = useGlobalContext();
  const [index, setindex] = useState(0);
  const [colorvalue, setvalue] = useState({
    value: "",
    title: "Color",
  });
  const [colorvalueedit, setedit] = useState([
    {
      isEdit: false,
      value: "",
    },
  ]);
  useEffect(() => {
    setindex(
      globalindex.productdetailindex !== -1
        ? globalindex.productdetailindex
        : props.index,
    );
  }, [globalindex]);
  useEffect(() => {
    const color = product.details.find(
      (i) => i.info_type === INVENTORYENUM.color,
    );
    if (color) {
      const updatevalue = [...colorvalueedit];
      color.info_value
        .filter((i) => i.length !== 0)
        .map((obj) =>
          updatevalue.push({
            isEdit: false,
            value: obj,
          }),
        );
      setedit(updatevalue);
    }
  }, []);
  const isvalidColor = (hex: string) => {
    const color = TinyColor(hex);
    return color.isValid();
  };
  function isValidHexCode(hexCode: string) {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(hexCode);
  }
  const handleConfirm = () => {
    let value = colorvalue.value;
    let updatecolor = [...product.details];
    let updatevalue = [...colorvalueedit];
    const isExist = updatecolor.some(
      (obj, idx) => idx !== index && obj.info_title === colorvalue.title,
    );
    if (isExist) {
      alert("Name Already Existed");
      return;
    }

    if (value.length === 0) {
      updatecolor[index].info_title = colorvalue.title;
      setproduct({ ...product, details: updatecolor });

      return;
    }

    updatecolor[index].info_title = colorvalue.title;
    if (isvalidColor(value) && isValidHexCode(value)) {
      let editing = { isEdit: false, index: 0 };
      updatevalue.forEach((obj, i) => {
        if (obj.isEdit) {
          editing.isEdit = true;
          editing.index = i;
        }
      });
      if (editing.isEdit) {
        let indexvalue = updatevalue[editing.index];
        indexvalue.isEdit = false;
        indexvalue.value = value;
        updatecolor[index].info_value[editing.index] = value;
      } else {
        updatevalue.push({
          isEdit: false,
          value: value,
        });
        updatecolor[index].info_value.push(value);
      }
      setedit(updatevalue);
      setvalue({ ...colorvalue, value: "" });
      setproduct({ ...product, details: updatecolor });
    } else {
      alert("Invalid HexCode");
    }
  };

  const handleEdit = (index: number) => {
    const updatevalue = [...colorvalueedit];
    console.log(updatevalue);
    const updatedArray = updatevalue.map((obj, i) => ({
      ...obj,
      isEdit: obj.isEdit ? false : i === index,
    }));
    setedit(updatedArray);
    setvalue({
      ...colorvalue,
      value:
        colorvalue.value === updatevalue[index].value
          ? ""
          : updatevalue[index].value,
    });
  };
  const handleDelete = (index: number) => {
    //delete Color
    const updatecolor = [...product.details];
    const updatetemp = [...colorvalueedit];
    const deletecolor = updatecolor[index].info_value;
    deletecolor.splice(index, 1);
    updatetemp.splice(index, 1);
    setproduct({ ...product, details: updatecolor });
    setedit(updatetemp);
    setvalue({ ...colorvalue, value: "" });
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setvalue({ ...colorvalue, [e.target.name]: e.target.value });
  };

  return (
    <div className="color_form w-full h-full flex flex-col items-center justify-center gap-y-5">
      <input
        placeholder="Color Hexcode ex. #00000"
        type="text"
        name="value"
        value={colorvalue.value}
        onChange={handleChange}
        className="name w-full h-[50px] pl-2 text-lg font-bold rounded-md bg-white"
      />
      <input
        placeholder="Name"
        type="text"
        name="title"
        value={colorvalue.title}
        onChange={handleChange}
        className="name w-full h-[50px] pl-2 text-lg font-bold rounded-md bg-white"
      />

      <div className="colorlist w-full h-fit grid grid-cols-5 place-content-center gap-x-10 gap-y-5">
        {product.details[props.index].info_value
          .filter((i) => i.length > 0)
          .map((hex, index) => (
            <div className="w-full h-fit flex flex-row">
              <div
                key={index}
                onClick={() => handleEdit(index + 1)}
                className={`colorcircle ${
                  colorvalueedit[index + 1]?.isEdit ? "colorcircleactive" : ""
                } w-[50px] h-[50px] rounded-3xl`}
                style={{ backgroundColor: `${hex}` }}
              ></div>
              <i
                onClick={() => handleDelete(index + 1)}
                className="fa-solid fa-minus p-[1px] h-fit relative left-1 text-sm rounded-lg bg-red-500 text-white transition hover:-translate-y-2 active:-translate-y-2"
              ></i>
            </div>
          ))}
      </div>
      <PrimaryButton
        type="button"
        text="ADD"
        onClick={() => handleConfirm()}
        width="100%"
        height="50px"
        color="#4688A0"
        radius="10px"
        disable={colorvalue.value === "" && colorvalue.title === ""}
      />
    </div>
  );
};

//
//
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
          : [],
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
        { covers: Imgurltemp, type: props.type },
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
        allowedFileType.includes(file.type),
      );
      const filteredFileUrl = filetourl(filteredFile);
      filteredFileUrl.map((obj, index) =>
        updateUrl.push({
          url: obj,
          name: filteredFile[index].name,
          type: filteredFile[index].type,
          id: updateUrl.length,
        }),
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
        filedata,
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
          { covers: Imgurltemp, type: props.type },
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
          createddata,
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
          banner,
        );
        if (!update.success) {
          errorToast("Failed To Update");
          return;
        }
        allbanner[globalindex.bannereditindex] = banner;
        setalldata({ ...allData, banner: allbanner });
        setglobalindex((prev) => ({ ...prev, bannereditindex: -1 }));
        successToast("Banner Updated");
      }
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
                className="w-auto min-h-[250px] max-h-[80vh]  mt-9 object-fill"
                placeholder="No Image"
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
                  checked={banner.show}
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
      <div className="updatestock w-[30%] h-[30%] rounded-lg flex flex-col items-center justify-center gap-y-5 bg-white p-1">
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
              product,
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
  } = useGlobalContext();
  useEffect(() => {
    if (globalindex.promotioneditindex !== -1) {
      const editpromo = {
        ...allData.promotion[globalindex.promotioneditindex],
      };
      const isExist = promotion.id === editpromo.id;
      !isExist && setpromotion(editpromo);
    }
  }, []);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const promo = { ...promotion };
    const isProduct = promo.products.filter((i) => i.id !== 0).length;
    if (
      globalindex.promotioneditindex === -1 &&
      (isProduct === 0 || !promo.expiredAt)
    ) {
      errorToast(
        !promo.expiredAt ? "Please Fill Expire Date" : "Please Select Product",
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
      promo,
    );
    if (!createpromo.success) {
      errorToast(
        "Failed To " +
          (globalindex.promotioneditindex === -1 ? "Create" : "Update"),
      );
      return;
    }
    if (globalindex.promotioneditindex === -1) {
      allPromo.push(promo);
      allProduct.forEach((i) => {
        promo.products.forEach((j) => {
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
      allPromo[globalindex.promotioneditindex].banner_id = promo.banner_id;
      if (!promo.banner_id) {
        allPromo[globalindex.promotioneditindex].banner = undefined;
      }
      allProduct.forEach((i) => {
        promo.products.forEach((j) => {
          if (j.id === i.id) {
            i.discount = {
              percent: j.discount?.percent ?? "",
              newPrice: j.discount?.newPrice ?? "",
            };
          }
        });
      });
    }

    setalldata((prev) => ({
      ...prev,
      promotion: allPromo,
      product: allProduct,
    }));
    console.log(allProduct);

    successToast(
      `Promotion ${
        globalindex.promotioneditindex === -1 ? "Created" : "Updated"
      }`,
    );
    if (globalindex.promotioneditindex !== -1) {
      setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
      setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      setpromotion(PromotionInitialize);

      setinventoryfilter("promotion");
    }
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setpromotion((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setopenmodal(SaveCheck(false, "createPromotion", openmodal));
  };
  const handleCancel = () => {
    if (openmodal.confirmmodal.confirm) {
      setpromotion(PromotionInitialize);
      globalindex.promotioneditindex === -1 && setinventoryfilter("product");
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
    setinventoryfilter("promotion");
  };
  const handleSelectProduct = (type: "product" | "banner") => {
    const isSelect = promotion.products.every((i) => i.id !== 0);
    setpromotion((prev) => ({
      ...prev,
      products: !isSelect ? [] : prev.products,
      [type === "product" ? "selectproduct" : "selectbanner"]: true,
    }));
    infoToast(
      "Start selection by click on " + type + " click again to remove discount",
    );

    setopenmodal(SaveCheck(false, "createPromotion", openmodal));
    setinventoryfilter(type);

    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
  };

  return (
    <Modal closestate={"discount"}>
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
            value={promotion.expiredAt}
            onChange={(e) => {
              setpromotion((prev) => ({ ...prev, expiredAt: dayjs(e) }));
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
              promotion.products.filter((i) => i.id !== 0).length > 0
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
            disable={
              globalindex.promotioneditindex === -1 &&
              promotion.products.filter((i) => i.id !== 0).length === 0
            }
            status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
            radius="10px"
            width="100%"
            height="50px"
          />{" "}
          <PrimaryButton
            color="#F08080"
            text="Cancel"
            type="button"
            disable={SpecificAccess(isLoading)}
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
    setglobalindex,
    setalldata,
    setopenmodal,
  } = useGlobalContext();
  const discounteditindex = globalindex.promotionproductedit;
  const [discount, setdiscount] = useState<number>(0);
  useEffect(() => {
    if (globalindex.promotionproductedit !== -1) {
      const promo =
        promotion.products[globalindex.promotionproductedit].discount;
      const percent = parseInt(promo?.percent ?? "");
      setdiscount(percent);
    }
  }, []);
  const handleDiscount = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let promoproduct = [...promotion.products];
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
      const allpromo = [...allData.promotion];

      let oldprice = promoproduct[discounteditindex].discount?.oldPrice ?? 0;
      promoproduct[discounteditindex].discount = {
        percent: discount?.toString() as string,
        newPrice: (oldprice - (oldprice * discount) / 100).toFixed(2),
        oldPrice: oldprice as number,
      };
      if (globalindex.promotioneditindex !== -1) {
        const allpromoproduct =
          allpromo[globalindex.promotioneditindex].products ?? [];

        const isExist = allpromoproduct.find(
          (i) => i.id === promoproduct[discounteditindex].id,
        );
        if (isExist) {
          isExist.discount = promoproduct[discounteditindex].discount;
        } else {
          allpromoproduct.push(promoproduct[discounteditindex]);
        }
      }
      console.log(discount);

      setalldata((prev) => ({
        ...prev,
        promotion: allpromo,
      }));
      setpromotion((prev) => ({ ...prev, products: promoproduct }));
      setglobalindex((prev) => ({ ...prev, promotionproductedit: -1 }));
    }

    successToast("Discount Set");
    setopenmodal((prev) => ({ ...prev, discount: false }));
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
