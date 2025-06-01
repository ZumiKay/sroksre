"use client";
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "./Button";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import { errorToast } from "./Loading";
import { Badge, Button, Input, Tooltip } from "@heroui/react";
import React from "react";
import {
  ProductInfo,
  SelectType,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
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
      className="toggle__container w-full h-fit flex flex-col gap-y-3"
    >
      {/* Header section with toggle button */}
      <h3
        className="togglebtn sticky top-0 z-10 flex flex-row items-center 
    justify-start gap-x-5 py-2 bg-white/95 backdrop-blur-sm
    font-normal text-lg mb-4"
      >
        <strong className="font-bold text-xl underline">{props.name}</strong>
        <button
          onClick={() => setopen(!open)}
          className="ml-2 flex items-center justify-center
        w-8 h-8 rounded-full
        transition-all duration-200
        hover:bg-gray-100 active:scale-95"
          aria-label={open ? "Collapse section" : "Expand section"}
        >
          <FontAwesomeIcon
            icon={open ? faMinus : faPlus}
            className={`fa-solid ${
              open ? "text-red-500" : "text-black"
            } text-xl no-underline`}
          />
        </button>
      </h3>

      {/* Content section with animation */}
      <AnimatePresence>
        {(open || props.isAdmin) && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "fit-content", y: 0, opacity: 1 }}
            exit={{ height: 0, y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="detailheader w-full h-fit break-words 
          flex flex-col items-start gap-y-4 
          pl-2 pb-4"
          >
            {props.paragraph
              ? // Paragraph content
                props.paragraph.map((item) => (
                  <div
                    key={item.title}
                    className="w-full h-fit flex flex-col gap-y-3 
                bg-gray-50 p-4 rounded-md shadow-sm"
                  >
                    {item.title && (
                      <h3 className="w-full text-xl font-bold break-words border-b border-gray-200 pb-2">
                        {item.title}
                      </h3>
                    )}
                    <p className="w-full h-fit text-lg font-normal leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))
              : // Data list content
                props.data?.map((obj, index) => (
                  <div
                    key={index}
                    className="w-full text-base font-normal 
                flex flex-row items-center gap-x-5 
                p-3 hover:bg-gray-50 rounded-md 
                transition-colors duration-200"
                  >
                    <span className="font-medium">{obj.info_title}:</span>
                    <span>{obj.info_value[0] as string}</span>

                    {props.isAdmin && (
                      <div className="ml-auto flex items-center gap-x-4">
                        <button
                          onClick={() => handleEdit(index)}
                          className="text-blue-500 hover:text-blue-700 
                      transition-colors duration-200 
                      flex items-center gap-x-1"
                        >
                          <i className="fa-solid fa-pen-to-square text-sm"></i>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="text-red-500 hover:text-red-700 
                      transition-colors duration-200 
                      flex items-center gap-x-1"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                          <span>Delete</span>
                        </button>
                      </div>
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

  // Memoize subcategories to avoid unnecessary re-renders
  const subcategories = useMemo(
    () => category?.subcategories || [],
    [category?.subcategories]
  );

  // Initialize category data when component mounts
  useEffect(() => {
    if (index !== -1 && allData?.category) {
      setcategory(allData.category[index]);
    }
  }, [index, allData?.category, setcategory]);

  const handleAdd = useCallback(() => {
    // Trim the name to handle whitespace
    const trimmedName = name.trim();

    if (!trimmedName) {
      errorToast("Category name cannot be empty");
      return;
    }

    const updatecate = [...subcategories];
    const isExist = updatecate.some(
      (i) => i.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isExist) {
      errorToast("Category already exists");
      return;
    }

    if ((trimmedName.length > 0 && editIdx < 0) || updatecate.length === 0) {
      updatecate.push({ name: trimmedName, type: "normal" });
    } else if (editIdx >= 0) {
      updatecate[editIdx].name = trimmedName;
    }

    setname("");
    setedit(-1);
    setcategory((prev) => ({ ...prev, subcategories: updatecate }));
  }, [subcategories, editIdx, name, setcategory]);

  const handleCancel = useCallback(() => {
    setcategory((prev) => ({ ...prev, subcategories: undefined }));
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
    setname("");
    setedit(-1);
  }, [setcategory, setopenmodal]);

  const handleDelete = useCallback(
    (idx: number) => {
      const updatedSubcategories = [...subcategories];
      updatedSubcategories.splice(idx, 1);

      setcategory((prev) => ({
        ...prev,
        subcategories: updatedSubcategories,
      }));

      // Reset edit state if we're currently editing the deleted item
      if (editIdx === idx) {
        setedit(-1);
        setname("");
      }
    },
    [subcategories, setcategory, editIdx]
  );

  const handleSelectEdit = useCallback(
    (idx: number) => {
      const isCurrentlyEditing = editIdx === idx;

      setedit(isCurrentlyEditing ? -1 : idx);
      setname(isCurrentlyEditing ? "" : subcategories[idx]?.name || "");
    },
    [subcategories, editIdx]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && name.trim().length > 0) {
        handleAdd();
      }
    },
    [handleAdd, name]
  );

  return (
    <div className="w-full bg-white rounded-lg border-2 border-gray-200 shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Sub Categories{" "}
          {subcategories.length > 0 && (
            <Badge color="primary" size="sm">
              {subcategories.length}
            </Badge>
          )}
        </h2>

        {subcategories.length > 0 && (
          <Tooltip content="Clear All Subcategories" placement="left">
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
              aria-label="Delete all subcategories"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Subcategory list with animations */}
      <div className="flex flex-wrap gap-2 mb-4 min-h-[60px] max-h-[140px] overflow-y-auto p-2 bg-gray-50 rounded-lg">
        <AnimatePresence>
          {subcategories.length === 0 ? (
            <p className="text-gray-400 italic text-sm w-full text-center py-2">
              No subcategories added yet
            </p>
          ) : (
            subcategories.map((cat, idx) => (
              <motion.div
                key={`${cat.name}-${idx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                className={`
                  relative px-3 py-1.5 rounded-lg border
                  ${
                    editIdx === idx
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-white text-gray-800 border-gray-200 hover:border-blue-300"
                  }
                  transition-all duration-200 cursor-pointer shadow-sm
                `}
              >
                <span
                  onClick={() => handleSelectEdit(idx)}
                  className="font-medium text-sm block max-w-[150px] truncate"
                >
                  {cat.name}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idx);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 shadow-sm"
                  aria-label={`Delete ${cat.name}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit form */}
      <div className="space-y-3">
        <p className="font-medium text-sm text-gray-700">
          {editIdx >= 0 ? "Edit Subcategory" : "Add New Subcategory"}
        </p>

        <div className="flex gap-2">
          <Input
            size="sm"
            type="text"
            className="flex-1"
            placeholder="Enter subcategory name"
            value={name}
            onChange={(e) => setname(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            variant="bordered"
            color={editIdx >= 0 ? "primary" : "default"}
            labelPlacement="outside"
            startContent={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            }
          />

          <PrimaryButton
            type="button"
            text={editIdx < 0 ? "Add" : "Update"}
            onClick={handleAdd}
            width="120px"
            height="40px"
            textsize="14px"
            color={editIdx < 0 ? "#3B82F6" : "#10B981"}
            radius="8px"
            disable={name.trim().length === 0}
            style={{ flexShrink: 0 }}
          />
        </div>

        {editIdx >= 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-end"
          >
            <button
              onClick={() => {
                setedit(-1);
                setname("");
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel editing
            </button>
          </motion.div>
        )}
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
              onPress={() => onClear && onClear(data, selected, promo, type)}
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
                  if (clickfunction) clickfunction(idx, type);
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
      components={animatedComponents as never}
      placeholder={"Product name"}
      value={selected?.filter((i) => i.value !== product.id?.toString())}
      loadOptions={(value) => {
        //TODO : Implement the logic to fetch product options based on the input value
      }}
      onChange={(val) => handleSelectChange(val as SelectType[] | null)}
      isMulti
    />
  );
};
