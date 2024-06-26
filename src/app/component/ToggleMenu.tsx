"use client";
import {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "../globals.css";
import { INVENTORYENUM } from "../dashboard/products/page";
import {
  ProductInfo,
  Relatedproducttype,
  Varianttype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import PrimaryButton from "./Button";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";

import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import {
  GetProductName,
  GetRelatedProduct,
} from "../dashboard/products/varaint_action";
interface toggleprops {
  name: string;
  isAdmin: boolean;
  type?: string;
  data?: ProductInfo[];
  index?: number;
}

export default function ToggleMenu(props: toggleprops) {
  const { openmodal, product, setproduct, setopenmodal, setglobalindex } =
    useGlobalContext();
  const [open, setopen] = useState(false);
  const handleEdit = (index: number) => {
    setglobalindex((prev) => ({ ...prev, productdetailindex: index }));
    setopenmodal({ ...openmodal, productdetail: true });
  };
  const handleDelete = (index: number) => {
    const updatedetail = [...product.details];
    updatedetail.splice(index, 1);
    setproduct({ ...product, details: updatedetail });
    setopenmodal({ ...openmodal, productdetail: false });
  };

  return (
    <motion.div
      initial={{ height: "0%" }}
      animate={open ? { height: "max-content" } : { height: "0%" }}
      transition={{
        ease: "linear",
        duration: 0.2,
      }}
      className="toggle__container w-full h-fit flex flex-col gap-y-1"
    >
      <h3 className="togglebtn sticky top-0 mb-5 font-normal text-lg flex flex-row items-center justify-start gap-x-5">
        <strong className="underline font-bold">{props.name}</strong>
        <i
          onClick={() => setopen(!open)}
          className={`ml-2 fa-solid ${
            open ? "fa-minus text-red-500" : "fa-plus text-black"
          } rounded-2xl text-xl p-2 no-underline transition hover:-translate-y-[.5] active:-translate-y-1`}
        ></i>{" "}
      </h3>
      <AnimatePresence>
        {(open || props.isAdmin) && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "fit-content", y: 0, opacity: 1 }}
            exit={{ height: 0, y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="detailheader w-full h-fit  break-words flex flex-col items-start gap-y-3"
          >
            {props.data?.map(
              (obj, index) =>
                obj.info_type !== INVENTORYENUM.size && (
                  <div
                    key={index}
                    className="text-base font-normal flex flex-row items-center gap-x-5"
                  >
                    {" "}
                    {obj.info_title} : {obj.info_value[0] as string}
                    {props.isAdmin && (
                      <>
                        <div
                          onClick={() => handleEdit(index)}
                          className="text-blue-400 underline transition hover:text-black"
                        >
                          Edit
                        </div>
                        <div
                          onClick={() => handleDelete(index)}
                          className="text-red-400 underline transition hover:text-black"
                        >
                          Delete
                        </div>
                      </>
                    )}
                  </div>
                )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
interface toggledownmenuprops {
  style?: CSSProperties;
  children: ReactNode;
  open: boolean;
}
export function ToggleDownMenu(props: toggledownmenuprops) {
  return (
    <div
      style={{ ...props.style, display: props.open ? "none" : "" }}
      className="toggleDownMenu__container w-full h-fit border-l-2 border-l-black flex flex-col items-start gap-y-5 pl-2"
    >
      {props.children}
    </div>
  );
}

export function AddSubCategoryMenu({ index }: { index: number }) {
  const { category, setcategory, setopenmodal, allData } = useGlobalContext();
  const [name, setname] = useState("");
  const [editIdx, setedit] = useState(-1);
  const [showform, setshow] = useState(false);

  useEffect(() => {
    index !== -1 && setcategory(allData.category[index]);
  }, []);

  const handleAdd = () => {
    const updatecate = [...category.subcategories];
    const isExist = updatecate.some((i) => i.name === name);
    if (isExist) {
      toast.error("Sub Cateogory Exist", {
        autoClose: 2000,
        pauseOnHover: true,
      });
      return;
    }
    if ((name.length > 0 && editIdx < 0) || updatecate.length === 0) {
      updatecate.push({ name: name });
    } else {
      updatecate[editIdx].name = name;
    }
    setname("");
    setedit(-1);
    setcategory((prev) => ({ ...prev, subcategories: updatecate }));
  };
  const handleCancel = () => {
    const deletesub = { ...category };
    deletesub.subcategories = [];

    setname("");
    setedit(-1);
    setcategory(deletesub);
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
  };
  const handleDelete = (idx: number) => {
    const subcate = [...category.subcategories];
    subcate.splice(idx, 1);
    setcategory((prev) => ({ ...prev, subcategories: subcate }));
  };
  return (
    <div
      onClick={() => setshow(true)}
      className="AddSubCategory_menu w-full h-fit p-1 flex flex-col justify-center gap-y-5 transition rounded-md outline outline-2 outline-gray-300"
    >
      <h2 className="text-lg font-bold">Sub Categories</h2>
      <div className="subcategory_list grid grid-cols-5 gap-y-3 p-4 place-content-start h-full  max-h-[120px] overflow-y-auto">
        {category.subcategories?.map((cat, index) => (
          <div
            key={index}
            style={
              editIdx === index
                ? { backgroundColor: "black", color: "white" }
                : {}
            }
            className="subcategory relative text-lg font-bold p-1 rounded-md outline outline-1 outline-offset-2 outline-black w-fit h-fit max-w-[100px] break-words cursor-pointer transition hover:bg-black hover:text-white"
          >
            <h3
              onClick={() => {
                setedit((prev) => (prev === index ? -1 : index));
                setname(
                  index === editIdx ? "" : category.subcategories[index].name
                );
              }}
              className="subcategory__name text-lg font-medium"
            >
              {cat.name}
            </h3>
            <i
              onClick={() => {
                handleDelete(index);
              }}
              className="fa-solid fa-minus font-black p-[1px] h-fit absolute -right-2 -top-3  text-sm rounded-lg bg-red-500 text-white transition hover:bg-black "
            ></i>
          </div>
        ))}
      </div>

      <div className="subcategoryform w-full h-full flex flex-col gap-y-3">
        <input
          type="text"
          className="subcate_name w-full h-[50px] border border-gray-300 pl-3 text-sm font-bold rounded-lg"
          placeholder="Name"
          value={name}
          onChange={(e) => {
            setname(e.target.value);
          }}
        />
        <PrimaryButton
          type="button"
          text={editIdx < 0 ? "Add" : "Edit"}
          onClick={() => handleAdd()}
          width="100%"
          height="30px"
          textsize="12px"
          color="#44C3A0"
          radius="10px"
          disable={name.length === 0}
        />
        <PrimaryButton
          type="button"
          text={"Delete"}
          onClick={() => handleCancel()}
          width="100%"
          height="30px"
          textsize="12px"
          color="lightcoral"
          radius="10px"
        />
      </div>
    </div>
  );
}
interface Toggleselectprops {
  type: "color" | "size" | "text";
  title: string;
  data: Array<String>;
  variantdata?: Array<Varianttype>;
}
export function ToggleSelect({
  type,
  data,
  title,
  variantdata,
}: Toggleselectprops) {
  const [open, setopen] = useState(false);
  const { listproductfilter, setlistprodfil } = useGlobalContext();

  const handleClick = (idx: number, parent_idx?: number) => {
    const selectedData = removeSpaceAndToLowerCase(
      parent_idx && variantdata
        ? variantdata[parent_idx].option_value[idx]
        : data[idx]
    );
    const update = { ...listproductfilter };

    const updateArray = (array: string[], value: string) => {
      const isExist = array.findIndex((i) => i === value);
      if (isExist !== -1) {
        array.splice(isExist, 1);
      } else {
        array.push(value);
      }
    };

    if (type === "color") {
      updateArray(update.color, selectedData as string);
    } else if (type === "size") {
      updateArray(update.size, selectedData as string);
    } else {
      updateArray(update.text, selectedData as string);
    }

    setlistprodfil(update);
  };
  return (
    <motion.div
      initial={{ height: "50px" }}
      whileHover={{ backgroundColor: "#f1f1f1" }}
      whileTap={{ backgroundColor: "#f1f1f1" }}
      animate={open ? { height: "200px" } : {}}
      className="toggleselect w-full h-fit rounded-lg border-2 border-black flex flex-col items-start gap-y-3"
    >
      <h3
        onClick={() => setopen(!open)}
        className="title text-lg font-semibold w-full text-left sticky top-0 cursor-pointer p-2"
      >
        {type === "color"
          ? listproductfilter.color.length > 0
            ? "Selected Color"
            : "Color"
          : listproductfilter.size.length > 0
          ? `Selected ${title}`
          : title}
      </h3>
      {open && (
        <div className="w-full max-h-[150px] overflow-y-auto ">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="selectitem_container grid grid-cols-3 gap-y-3 h-full  w-fit gap-x-3 p-2 transition-all"
          >
            {variantdata
              ? variantdata.map((item, idx) => (
                  <div key={idx} className="w-full h-fit flex flex-col gap-y-3">
                    <h3 className="name text-lg font-semibold w-full text-left pl-2">
                      {item.option_title}
                    </h3>
                    <div className="filterval w-full h-fit grid grid-cols-3">
                      {item.option_value.map((i, index) => (
                        <h4
                          onClick={() => handleClick(index, idx)}
                          key={index}
                          className="text-lg p-1 font-normal bg-gray-300 text-black rounded-lg cursor-pointer transition duration-200 hover:bg-gray-100 active:bg-gray-100 break-all"
                        >
                          {" "}
                          {i}{" "}
                        </h4>
                      ))}
                    </div>
                  </div>
                ))
              : data.map((i, idx) => (
                  <div
                    key={idx}
                    className="selectitem min-w-[50px] rounded-md cursor-pointer w-fit max-w-[150px] h-fit break-words bg-white hover:bg-gray-100 active:bg-gray-100 p-2"
                    onClick={() => handleClick(idx)}
                    style={
                      listproductfilter[type].find(
                        (j) => j === removeSpaceAndToLowerCase(i)
                      )
                        ? { backgroundColor: "gray" }
                        : {}
                    }
                  >
                    {" "}
                    {type === "color" ? (
                      <>
                        <div
                          className={`colorplattet w-[40px] h-[40px]`}
                          style={
                            i
                              ? {
                                  backgroundColor: i as string,
                                  backgroundPosition: "center",
                                }
                              : {}
                          }
                        ></div>
                      </>
                    ) : (
                      <h3 className="label text-lg text-center font-normal">
                        {i}
                      </h3>
                    )}{" "}
                  </div>
                ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

const animatedComponents = makeAnimated();

interface Selecttype {
  label: string;
  value: string;
}
const getOptions = async (value: string, selectedvalue?: string[]) => {
  const product = GetProductName.bind(null, value);
  const searchreq = await product();

  const filterd = selectedvalue
    ? searchreq.data.filter((i) => !selectedvalue.includes(i.id.toString()))
    : searchreq.data;

  const result = filterd.map((i) => ({
    label: i.name,
    value: i.id,
  }));

  return result;
};
export const SearchAndMultiSelect = () => {
  const { product, setproduct } = useGlobalContext();

  const [selected, setselected] = useState<Selecttype[] | undefined>(undefined);

  useEffect(() => {
    if (product.relatedproduct) {
      const selectedrelated = product.relatedproduct.map((i) => ({
        label: i.name,
        value: i.id.toString(),
      }));
      setselected(selectedrelated.length === 0 ? undefined : selectedrelated);
    }
  }, [product.relatedproduct]);

  const handleSelectChange = (val: Selecttype[] | null) => {
    const selected = val ?? [];
    const productId = selected.map((i) => parseInt(i.value));

    setselected(selected);
    setproduct((prev) => ({ ...prev, relatedproductid: productId }));
  };

  return (
    <ReactSelect
      closeMenuOnSelect={false}
      components={animatedComponents}
      placeholder={"Product name"}
      value={selected?.filter((i) => i.value !== product.id?.toString())}
      loadOptions={(value) =>
        getOptions(
          value,
          selected?.map((i) => i.value)
        ) as any
      }
      onChange={(val) => handleSelectChange(val as Selecttype[] | null)}
      isMulti
    />
  );
};
