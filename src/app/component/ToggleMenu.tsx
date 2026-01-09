"use client";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import "../globals.css";

import {
  ProductInfo,
  SelectType,
  VariantColorValueType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import PrimaryButton from "./Button";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";

import { GetProductName } from "../dashboard/inventory/varaint_action";
import { errorToast } from "./Loading";
import { Button, Input } from "@nextui-org/react";
import React from "react";
interface toggleprops {
  name: string;
  isAdmin: boolean;
  type?: string;
  data?: ProductInfo[];
  index?: number;
  paragraph?: {
    id?: number;
    title?: string;
    content: string;
  }[];
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
        <strong className="underline font-bold text-xl">{props.name}</strong>
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
            {props.paragraph
              ? props.paragraph.map((i) => (
                  <div
                    key={i.id}
                    className="w-full h-fit flex flex-col gap-y-3"
                  >
                    {i.title && (
                      <h3 className="w-full text-xl font-bold break-words">
                        {i.title}
                      </h3>
                    )}
                    <p className="w-full h-fit text-lg font-normal">
                      {i.content}
                    </p>
                  </div>
                ))
              : props.data?.map((obj, index) => (
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
                ))}
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
      style={{ ...props.style, display: !props.open ? "none" : "" }}
      className="toggleDownMenu__container w-full h-[75vh] flex flex-col items-start gap-y-5 pl-2 overflow-y-auto overflow-x-hidden"
    >
      {props.children}
    </div>
  );
}

export function AddSubCategoryMenu({ index }: { index: number }) {
  const { category, setcategory, setopenmodal, allData } = useGlobalContext();
  const [name, setname] = useState("");
  const [editIdx, setedit] = useState(-1);

  useEffect(() => {
    index !== -1 && allData?.category && setcategory(allData.category[index]);
  }, []);

  const handleAdd = () => {
    const updatecate = [...category.subcategories];
    const isExist = updatecate.some((i) => i.name === name);
    if (isExist) {
      errorToast("Cateogory Exist");
      return;
    }
    if ((name.length > 0 && editIdx < 0) || updatecate.length === 0) {
      updatecate.push({ name: name, type: "normal" });
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
    <div className="AddSubCategory_menu w-full h-fit p-6 flex flex-col justify-center gap-y-6 transition rounded-2xl bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 shadow-lg">
      <div className="flex items-center gap-3 pb-2 border-b-2 border-indigo-200">
        <i className="fa-solid fa-folder-tree text-2xl text-indigo-500"></i>
        <h2 className="text-xl font-bold text-gray-800">Subcategories</h2>
        {category.subcategories?.length > 0 && (
          <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-indigo-500 text-white">
            {category.subcategories.length}
          </span>
        )}
      </div>

      <div className="subcategory_list flex flex-row flex-wrap gap-3 p-4 place-content-start h-full max-h-[160px] overflow-y-auto bg-white rounded-xl border-2 border-gray-200 shadow-inner">
        {category.subcategories?.length === 0 ? (
          <div className="w-full h-20 flex items-center justify-center text-gray-400 text-sm">
            <div className="flex flex-col items-center gap-2">
              <i className="fa-solid fa-folder-open text-3xl"></i>
              <p>No subcategories yet</p>
            </div>
          </div>
        ) : (
          category.subcategories?.map((cat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`subcategory relative text-sm font-bold p-3 rounded-xl w-fit h-fit max-w-[140px] break-words cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg group ${
                editIdx === index
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white scale-105"
                  : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 hover:from-indigo-100 hover:to-purple-100"
              }`}
            >
              <h3
                onClick={() => {
                  setedit((prev) => (prev === index ? -1 : index));
                  setname(
                    index === editIdx ? "" : category.subcategories[index].name
                  );
                }}
                className="subcategory__name text-sm font-semibold flex items-center gap-2"
              >
                <i
                  className={`fa-solid fa-folder ${
                    editIdx === index ? "text-white" : "text-indigo-500"
                  }`}
                ></i>
                {cat.name}
              </h3>
              <button
                onClick={() => {
                  handleDelete(index);
                }}
                className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-white flex items-center justify-center transition-all duration-200 hover:from-red-600 hover:to-pink-700 hover:scale-110 shadow-md opacity-0 group-hover:opacity-100"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </motion.div>
          ))
        )}
      </div>

      <div className="subcategoryform w-full h-full flex flex-col gap-y-4 bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <i
            className={`fa-solid ${
              editIdx < 0 ? "fa-plus" : "fa-pen"
            } text-lg text-indigo-500`}
          ></i>
          <h3 className="text-base font-bold text-gray-800">
            {editIdx < 0 ? "Add New Subcategory" : "Edit Subcategory"}
          </h3>
        </div>
        <Input
          size="lg"
          type="text"
          variant="bordered"
          className="subcate_name w-full"
          label="Subcategory Name"
          placeholder="Enter subcategory name"
          value={name}
          onChange={(e) => {
            setname(e.target.value);
          }}
          classNames={{
            label: "text-gray-700 font-semibold",
            input: "bg-gray-50",
          }}
        />
        <div className="w-full h-fit flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => handleAdd()}
            disabled={name.length === 0}
            className={`w-full h-10 rounded-xl font-bold text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
              name.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : editIdx < 0
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105"
                : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:scale-105"
            }`}
          >
            <i
              className={`fa-solid ${editIdx < 0 ? "fa-plus" : "fa-check"}`}
            ></i>
            <span>{editIdx < 0 ? "Add" : "Update"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCancel()}
            className="w-full h-10 rounded-xl font-bold text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white hover:from-gray-600 hover:to-gray-800 hover:shadow-lg hover:scale-105"
          >
            <i className="fa-solid fa-xmark"></i>
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
interface Toggleselectprops {
  type: "color" | "size" | "text" | "pcate" | "ccate";
  title: string;
  data: Array<string> | VariantColorValueType[];
  clickfunction?: (idx: number, type: string) => void;
  selected?: string[];
  promo?: boolean;
  onClear?: (
    data: string[] | VariantColorValueType[],
    selectedvalue: string[],
    promo?: boolean,
    type?: string
  ) => void;
}
export function ToggleSelect({
  type,
  data,
  title,
  clickfunction,
  selected,
  onClear,
  promo,
}: Toggleselectprops) {
  const [open, setopen] = useState(false);
  return (
    <motion.div
      initial={{ height: "100%" }}
      whileHover={{ backgroundColor: "#f1f1f1" }}
      whileTap={{ backgroundColor: "#f1f1f1" }}
      animate={open ? { height: "100%" } : {}}
      className="toggleselect w-full h-fit rounded-lg border-2 border-black flex flex-col items-start gap-y-3 relative"
    >
      <div
        onClick={() => setopen(!open)}
        className="title h-fit text-lg font-semibold w-full text-left cursor-pointer p-2 flex flex-row items-center justify-between"
      >
        <div className="w-full h-full">
          {type === "color" ? (
            selected ? (
              "Clear Color"
            ) : (
              "Color"
            )
          ) : selected ? (
            data.some((i) => selected.includes(i as string)) ? (
              <div className="w-fit h-fit">
                {" "}
                <p className="font-bold text-red-400">Selected</p>
                <p>{title}</p>{" "}
              </div>
            ) : (
              title
            )
          ) : (
            title
          )}
        </div>
        {selected &&
          data.some((i) =>
            selected.includes(typeof i === "string" ? i : i.val)
          ) && (
            <Button
              onClick={() => onClear && onClear(data, selected, promo, type)}
              size="sm"
              variant="bordered"
              color="danger"
            >
              Clear
            </Button>
          )}
      </div>

      {open && (
        <div className="w-full max-h-[150px] overflow-y-auto ">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="selectitem_container grid grid-cols-3 gap-y-3 h-full  w-fit gap-x-3 p-2 transition-all"
          >
            {data.map((i, idx) => (
              <div
                key={idx}
                className="selectitem min-w-[50px] rounded-lg cursor-pointer w-fit h-fit break-words border border-black bg-white active:bg-gray-100 p-2"
                onClick={() => {
                  clickfunction && clickfunction(idx, type);
                }}
                style={
                  selected?.includes(typeof i === "string" ? i : i.val)
                    ? { backgroundColor: "gray" }
                    : {}
                }
              >
                {" "}
                {type === "color" && typeof i !== "string" ? (
                  <div className="w-fit h-fit flex flex-row gap-x-3 p-2 items-center justify-center rounded-full border border-black">
                    <div
                      className={`colorplattet w-[30px] h-[30px] rounded-full`}
                      style={
                        i
                          ? {
                              backgroundColor: i.val,
                              backgroundPosition: "center",
                            }
                          : {}
                      }
                    ></div>
                    {i.name && (
                      <div className="text-lg w-fit h-fit font-bold">
                        {" "}
                        {i.name}{" "}
                      </div>
                    )}
                  </div>
                ) : (
                  <h3 className="label w-fit h-fit text-lg text-center font-normal">
                    {i as string}
                  </h3>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

const animatedComponents = makeAnimated();

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

  const [selected, setselected] = useState<SelectType[] | undefined>(undefined);

  useEffect(() => {
    if (product.relatedproduct) {
      const selectedrelated = product.relatedproduct.map((i) => ({
        label: i.name,
        value: i.id.toString(),
      }));
      setselected(selectedrelated.length === 0 ? undefined : selectedrelated);
    }
  }, [product.relatedproduct]);

  const handleSelectChange = (val: SelectType[] | null) => {
    const selected = val ?? [];
    const productId = selected.map((i) => parseInt(i.value.toString()));

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
          selected?.map((i) => i.value as string)
        ) as any
      }
      onChange={(val) => handleSelectChange(val as SelectType[] | null)}
      isMulti
    />
  );
};
