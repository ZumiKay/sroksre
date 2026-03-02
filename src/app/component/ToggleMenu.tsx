"use client";
import {
  CSSProperties,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import "../globals.css";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import { GetProductName } from "../dashboard/inventory/varaint_action";
import { errorToast } from "./Loading";
import { Button, Input } from "@heroui/react";
import React from "react";
import { ProductInfo, VariantValueObjType } from "@/src/types/product.type";
import { SelectType } from "@/src/types/productAction.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckCircle,
  faCircleInfo,
  faFolder,
  faFolderOpen,
  faFolderTree,
  faList,
  faMinus,
  faMinusCircle,
  faPalette,
  faPen,
  faPlus,
  faPlusCircle,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export interface ToggleMenuProps {
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

function ToggleMenu(props: ToggleMenuProps) {
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
        ease: "easeInOut",
        duration: 0.3,
      }}
      className="toggle__container w-full h-fit flex flex-col gap-y-1"
    >
      <div className="togglebtn sticky top-0 mb-6 bg-white/95 backdrop-blur-xs z-10 pb-3 border-b-2 border-gray-200">
        <h3 className="font-normal text-lg flex flex-row items-center justify-start gap-x-4">
          <strong className="font-bold text-2xl text-gray-800">
            {props.name}
          </strong>
          <motion.button
            type="button"
            onClick={() => setopen(!open)}
            className={`ml-2 rounded-xl text-base p-3 no-underline shadow-md hover:shadow-lg`}
            aria-label={open ? "Collapse section" : "Expand section"}
            whileHover={{
              scale: 1.1,
              rotate: [0, -10, 10, -10, 0],
              transition: {
                rotate: {
                  repeat: Infinity,
                  duration: 0.5,
                },
                scale: { duration: 0.2 },
              },
            }}
            whileTap={{
              scale: 0.9,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 10,
              },
            }}
            animate={open ? {} : {}}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            {" "}
            {open ? (
              <FontAwesomeIcon icon={faMinusCircle} size="lg" />
            ) : (
              <FontAwesomeIcon icon={faPlusCircle} size="lg" />
            )}{" "}
          </motion.button>{" "}
        </h3>
      </div>
      <AnimatePresence>
        {(open || props.isAdmin) && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "fit-content", y: 0, opacity: 1 }}
            exit={{ height: 0, y: -10, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="detailheader w-full h-fit wrap-break-word flex flex-col items-start gap-y-4"
          >
            {props.paragraph
              ? props.paragraph.map((i) => (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-fit flex flex-col gap-y-3 p-5 rounded-xl bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-300"
                  >
                    {i.title && (
                      <h3 className="w-full text-xl font-bold wrap-break-word text-gray-800 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faCircleInfo}
                          className="text-indigo-500 text-base"
                        />
                        {i.title}
                      </h3>
                    )}
                    <p className="w-full h-fit text-base font-normal leading-relaxed text-gray-700">
                      {i.content}
                    </p>
                  </motion.div>
                ))
              : props.data?.map((obj, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="text-base font-normal flex flex-row items-center gap-x-4 p-4 rounded-lg bg-white border-2 border-gray-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-300 w-full group"
                  >
                    <div className="flex flex-row items-center gap-x-2 flex-1">
                      <span className="font-semibold text-gray-700">
                        {obj.info_title}:
                      </span>
                      <span className="text-gray-900">
                        {obj.info_value[0] as string}
                      </span>
                    </div>
                    {props.isAdmin && (
                      <div className="flex flex-row items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleEdit(index)}
                          className="px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-1.5"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="px-3 py-1.5 rounded-lg bg-linear-to-r from-red-500 to-pink-600 text-white text-sm font-semibold transition-all duration-300 hover:from-red-600 hover:to-pink-700 hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-1.5"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          Delete
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Named export with memoization
export const ToggleMenuComponent = React.memo(ToggleMenu);

// Default export for backward compatibility
export default ToggleMenuComponent;

export interface ToggleDownMenuProps {
  style?: CSSProperties;
  children: ReactNode;
  open: boolean;
}

export const ToggleDownMenu = React.memo(function ToggleDownMenu(
  props: ToggleDownMenuProps,
) {
  return (
    <div
      style={{ ...props.style, display: !props.open ? "none" : "" }}
      className="toggleDownMenu__container w-full h-[75vh] flex flex-col items-start gap-y-5 pl-2 overflow-y-auto overflow-x-hidden bg-linear-to-b from-gray-50 to-white rounded-xl p-4 border-2 border-gray-200 shadow-inner"
    >
      {props.children}
    </div>
  );
});

export interface AddSubCategoryMenuProps {
  index: number;
}

export const AddSubCategoryMenu = React.memo(function AddSubCategoryMenu({
  index,
}: AddSubCategoryMenuProps) {
  const { category, setcategory, setopenmodal, allData } = useGlobalContext();
  const [name, setname] = useState("");
  const [editIdx, setedit] = useState(-1);

  useEffect(() => {
    index !== -1 && allData?.category && setcategory(allData.category[index]);
  }, []);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
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

  const handleCancel = useCallback(() => {
    const deletesub = { ...category };
    deletesub.subcategories = [];
    setname("");
    setedit(-1);
    setcategory(deletesub);
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
  }, [category, setcategory, setopenmodal]);
  const handleDelete = useCallback((idx: number) => {
    const subcate = [...category.subcategories];
    subcate.splice(idx, 1);
    setcategory((prev) => ({ ...prev, subcategories: subcate }));
  }, []);
  return (
    <div className="AddSubCategory_menu w-full h-fit p-6 flex flex-col justify-center gap-y-6 transition rounded-2xl bg-linear-to-br from-white to-indigo-50 border-2 border-indigo-200 shadow-lg">
      <div className="flex items-center gap-3 pb-2 border-b-2 border-indigo-200">
        <FontAwesomeIcon
          icon={faFolderTree}
          className="text-2xl text-indigo-500"
        />
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
              <FontAwesomeIcon icon={faFolderOpen} className="text-3xl" />
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
              className={`subcategory relative text-sm font-bold p-3 rounded-xl w-fit h-fit max-w-[140px] wrap-break-word cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg group ${
                editIdx === index
                  ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white scale-105"
                  : "bg-linear-to-r from-gray-50 to-gray-100 text-gray-800 hover:from-indigo-100 hover:to-purple-100"
              }`}
            >
              <h3
                onClick={() => {
                  setedit((prev) => (prev === index ? -1 : index));
                  setname(
                    index === editIdx ? "" : category.subcategories[index].name,
                  );
                }}
                className="subcategory__name text-sm font-semibold flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={faFolder}
                  className={
                    editIdx === index ? "text-white" : "text-indigo-500"
                  }
                />
                {cat.name}
              </h3>
              <button
                onClick={() => {
                  handleDelete(index);
                }}
                className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-linear-to-r from-red-500 to-pink-600 text-white flex items-center justify-center transition-all duration-200 hover:from-red-600 hover:to-pink-700 hover:scale-110 shadow-md opacity-0 group-hover:opacity-100"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="subcategoryform w-full h-full flex flex-col gap-y-4 bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md"
      >
        <div className="flex items-center gap-2 mb-2">
          <FontAwesomeIcon
            icon={editIdx < 0 ? faPlus : faPen}
            className="text-lg text-indigo-500"
          />
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
          required
        />
        <div className="w-full h-fit flex flex-row items-center gap-3">
          <button
            type="submit"
            disabled={name.length === 0}
            className={`w-full h-10 rounded-xl font-bold text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
              name.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : editIdx < 0
                  ? "bg-linear-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105"
                  : "bg-linear-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:scale-105"
            }`}
          >
            <FontAwesomeIcon icon={editIdx < 0 ? faPlus : faCheck} />
            <span>{editIdx < 0 ? "Add" : "Update"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCancel()}
            className="w-full h-10 rounded-xl font-bold text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 bg-linear-to-r from-gray-500 to-gray-700 text-white hover:from-gray-600 hover:to-gray-800 hover:shadow-lg hover:scale-105"
          >
            <FontAwesomeIcon icon={faXmark} />
            <span>Clear All</span>
          </button>
        </div>
      </form>
    </div>
  );
});

export interface ToggleSelectProps {
  type: "color" | "size" | "text" | "pcate" | "ccate";
  title: string;
  data: Array<string> | VariantValueObjType[];
  clickfunction?: (idx: number, type: string) => void;
  selected?: string[];
  promo?: boolean;
  onClear?: (
    data: string[] | VariantValueObjType[],
    selectedvalue: string[],
    promo?: boolean,
    type?: string,
  ) => void;
}

export const ToggleSelect = React.memo(function ToggleSelect({
  type,
  data,
  title,
  clickfunction,
  selected,
  onClear,
  promo,
}: ToggleSelectProps) {
  const [open, setopen] = useState(false);
  return (
    <motion.div
      initial={{ height: "100%" }}
      whileHover={{ scale: 1.01, borderColor: "#6366f1" }}
      whileTap={{ scale: 0.99 }}
      animate={open ? { height: "100%" } : {}}
      transition={{ duration: 0.2 }}
      className="toggleselect w-full h-fit rounded-xl border-2 border-gray-300 flex flex-col items-start gap-y-3 relative shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden"
    >
      <div
        onClick={() => setopen(!open)}
        className="title h-fit text-lg font-semibold w-full text-left cursor-pointer p-4 flex flex-row items-center justify-between bg-linear-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border-b-2 border-gray-200"
      >
        <div className="w-full h-full flex items-center gap-2">
          {type === "color" ? (
            selected ? (
              <>
                <FontAwesomeIcon icon={faPalette} className="text-indigo-500" />
                <span>Clear Color</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPalette} className="text-indigo-500" />
                <span>Color</span>
              </>
            )
          ) : selected ? (
            data.some((i) => selected.includes(i as string)) ? (
              <div className="w-fit h-fit flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-500"
                />
                <div>
                  <p className="font-bold text-green-600 text-sm">Selected</p>
                  <p className="text-gray-700">{title}</p>
                </div>
              </div>
            ) : (
              <>
                <FontAwesomeIcon icon={faList} className="text-indigo-500" />
                <span>{title}</span>
              </>
            )
          ) : (
            <>
              <FontAwesomeIcon icon={faList} className="text-indigo-500" />
              <span>{title}</span>
            </>
          )}
        </div>
        {selected &&
          data.some((i) =>
            selected.includes(typeof i === "string" ? i : i.val),
          ) && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClear && onClear(data, selected, promo, type);
              }}
              size="sm"
              variant="bordered"
              color="danger"
              className="hover:scale-105 transition-transform duration-200"
            >
              <FontAwesomeIcon icon={faXmark} />
              Clear
            </Button>
          )}
      </div>

      {open && (
        <div className="w-full max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-200 bg-gray-50 p-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="selectitem_container grid grid-cols-3 gap-y-3 h-full w-fit gap-x-3 p-2 transition-all"
          >
            {data.map((i, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`selectitem min-w-[50px] rounded-xl cursor-pointer w-fit h-fit wrap-break-word border-2 p-2 transition-all duration-300 shadow-xs hover:shadow-md ${
                  selected?.includes(typeof i === "string" ? i : i.val)
                    ? "bg-linear-to-r from-indigo-500 to-purple-600 border-indigo-600 text-white scale-105"
                    : "bg-white border-gray-300 hover:border-indigo-400"
                }`}
                onClick={() => {
                  clickfunction && clickfunction(idx, type);
                }}
              >
                {" "}
                {type === "color" && typeof i !== "string" ? (
                  <div className="w-fit h-fit flex flex-row gap-x-2 p-2 items-center justify-center rounded-lg">
                    <div
                      className={`colorplattet w-[32px] h-[32px] rounded-full border-2 border-white shadow-md`}
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
                      <div className="text-base w-fit h-fit font-semibold">
                        {" "}
                        {i.name}{" "}
                      </div>
                    )}
                  </div>
                ) : (
                  <h3 className="label w-fit h-fit text-base text-center font-semibold">
                    {i as string}
                  </h3>
                )}
                {selected?.includes(typeof i === "string" ? i : i.val) && (
                  <FontAwesomeIcon icon={faCheck} className="text-xs ml-1" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
});

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

export const SearchAndMultiSelect = React.memo(function SearchAndMultiSelect() {
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
          selected?.map((i) => i.value as string),
        ) as any
      }
      onChange={(val) => handleSelectChange(val as SelectType[] | null)}
      isMulti
    />
  );
});
