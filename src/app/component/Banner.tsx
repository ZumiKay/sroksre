"use client";
import Image from "next/image";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import {
  CSSProperties,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { getSelectCategory } from "../action";
import { Selection } from "./Button";
import { getSubCategories } from "../dashboard/inventory/varaint_action";
import SelectArrow from "../../../public/Image/Arrow_down.svg";
import { AnimatePresence, motion } from "framer-motion";
import { DeleteIcon } from "./Asset";
import { Skeleton } from "@heroui/react";
import { SelectType } from "@/src/types/productAction.type";

//
const animatedComponents = makeAnimated();

const getOptions = async (value: string) => {
  const getreq = getSelectCategory.bind(null, value);
  const data = await getreq();
  if (data.success) {
    return data.data;
  }
  return null;
};

export const NormalSkeleton = ({
  width,
  height,
  count,
  style,
}: {
  width: string;
  height: string;
  count: number;
  style?: CSSProperties;
}) => {
  return (
    <div style={style} className="w-full h-fit flex flex-col gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} className="rounded-lg" style={{ height, width }} />
      ))}
    </div>
  );
};

export const SearchAndSelectCategory = () => {
  const [selected, setselected] = useState<SelectType | undefined>(undefined);
  const [subcate, setsubcate] = useState<SelectType[] | undefined>(undefined);
  const handleSelectChange = async (val: SelectType | null) => {
    const selected = val ?? undefined;

    if (selected?.value) {
      const getreq = getSubCategories.bind(
        null,
        parseInt(selected.value.toString()),
      );
      const sub = await getreq();
      if (sub.success) {
        setsubcate(sub.data?.map((i) => ({ label: i.name, value: i.id })));
      }
    }

    setselected(selected);
  };

  return (
    <div className="w-full h-fit flex flex-col gap-y-5">
      <div className="w-full h-fit flex flex-row gap-x-5">
        <div className="w-full h-fit flex flex-col gap-y-5">
          <label className="text-lg font-bold">Parent Category</label>
          <ReactSelect
            closeMenuOnSelect={false}
            components={animatedComponents}
            placeholder={"Product name"}
            loadOptions={(value) => getOptions(value) as any}
            onChange={(val) => handleSelectChange(val as SelectType | null)}
          />
        </div>
        {subcate && (
          <div className="w-full h-fit flex flex-col gap-y-5">
            <label className="text-lg font-bold">Sub Category</label>
            <Selection data={subcate} />
          </div>
        )}
      </div>
      {selected && (
        <div className="w-full h-fit flex flex-col gap-y-5">
          <label className="text-lg font-bold">Products</label>
          <Selection data={["All"]} />
        </div>
      )}
    </div>
  );
};

interface selectprops {
  getdata: (
    take: number,
    value: string,
  ) => Promise<{
    success: boolean;
    isLimit?: boolean;
    data?: Array<SelectType>;
  } | null>;

  onSelect?: (value?: Array<SelectType> | SelectType) => void;
  value?: Array<SelectType>;
  singleselect?: boolean;
  placeholder?: string;
}

export const SelectAndSearchProduct = ({
  getdata,
  onSelect,
  value,
  singleselect,
  placeholder,
}: selectprops) => {
  const [focus, setfocus] = useState(false);
  const [isDelete, setisDelete] = useState(false);
  const [limit, setlimt] = useState<number>(3);
  const [loading, setloading] = useState(false);
  const [isLimit, setIsLimit] = useState(false);
  const [options, setoptions] = useState<Array<SelectType> | undefined>();
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedvalue, setselectedvalue] = useState<SelectType[] | undefined>(
    value,
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conref = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isSelected = useCallback(
    (val: SelectType) => {
      return selectedvalue?.findIndex((i) => i.value === val.value) !== -1;
    },
    [selectedvalue],
  );

  const fetchData = useCallback(
    async (searchValue: string, itemLimit: number) => {
      setloading(true);
      try {
        const res = await getdata(itemLimit, searchValue);
        if (res && res.success) {
          setoptions(res.data);
          setIsLimit(res.isLimit ?? false);
        }
      } catch (error) {
        console.log("Fetch error:", error);
      } finally {
        setloading(false);
      }
    },
    [getdata],
  );

  useEffect(() => {
    if (inputRef.current) {
      const placeHolder = placeholder ?? "Search Product";
      if (focus) {
        inputRef.current.innerHTML = "";
        fetchData(inputValue, limit);
      } else {
        if (inputRef.current.innerHTML !== placeHolder) {
          inputRef.current.innerHTML = placeHolder;
        }
      }
    }
  }, [focus]);

  useEffect(() => {
    const handleCloseOption = (e: MouseEvent) => {
      if (conref.current && !conref.current.contains(e.target as Node)) {
        setfocus(false);
      }
    };

    window.addEventListener("mousedown", handleCloseOption);

    return () => {
      window.removeEventListener("mousedown", handleCloseOption);
    };
  }, []);

  const handleSelectOption = useCallback(
    (value: SelectType) => {
      const check =
        selectedvalue?.findIndex((i) => i.value === value.value) ?? -1;
      let selected = [...(selectedvalue ?? [])];

      if (check !== -1) {
        selected.splice(check, 1);
      } else {
        if (singleselect) {
          selected = [value];
        } else {
          selected.push(value);
        }
      }

      onSelect &&
        (singleselect
          ? onSelect(selected[0])
          : onSelect(selected.length === 0 ? undefined : selected));
      setselectedvalue(selected);
    },
    [selectedvalue, singleselect, onSelect],
  );

  const handleInputChange = useCallback(() => {
    if (inputRef.current) {
      const value = inputRef.current.innerText;
      setInputValue(value);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced search
      debounceTimerRef.current = setTimeout(() => {
        fetchData(value, 3);
      }, 300); // 300ms debounce
    }
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    const newLimit = limit + 3;
    await fetchData(inputValue, newLimit);
    setlimt(newLimit);
  }, [limit, inputValue, fetchData]);

  const handleDeleteSelected = useCallback(
    (idx: number) => {
      let selected = [...(selectedvalue ?? [])];
      selected.splice(idx, 1);
      setselectedvalue(selected);
      onSelect &&
        (singleselect
          ? onSelect(selected.length === 0 ? undefined : selected[0])
          : onSelect(selected.length === 0 ? undefined : selected));
      setisDelete(false);
    },
    [selectedvalue, singleselect, onSelect],
  );

  // Memoize selected tags rendering
  const selectedTags = useMemo(
    () =>
      selectedvalue?.map((i, idx) => (
        <motion.div
          key={idx}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-fit h-fit flex flex-row items-center gap-2 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <p className="text-sm font-semibold text-white truncate max-w-50">
            {i.label}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSelected(idx);
            }}
            onMouseEnter={() => setisDelete(true)}
            onMouseLeave={() => setisDelete(false)}
            className="text-white hover:text-red-200 transition-colors duration-200 shrink-0"
          >
            <DeleteIcon />
          </button>
        </motion.div>
      )),
    [selectedvalue, handleDeleteSelected],
  );

  return (
    <div
      ref={conref as any}
      onTouchCancel={() => setfocus(false)}
      className="productselect w-full h-fit relative"
    >
      <div
        onClick={() => {
          setfocus(true);
        }}
        className={`inputcontainer w-full min-h-13.5 relative h-fit flex flex-row items-center border-2 rounded-xl transition-all duration-200 ${
          focus
            ? "border-blue-500 shadow-lg shadow-blue-200"
            : "border-gray-300 hover:border-gray-400"
        } bg-white`}
      >
        <div className="w-full max-w-[95%] h-fit flex flex-row flex-wrap items-center gap-2 p-2">
          <AnimatePresence>{selectedTags}</AnimatePresence>
          <span
            ref={inputRef}
            className="min-w-50 w-full h-full text-base flex flex-col justify-center cursor-text focus:outline-hidden text-gray-700 placeholder:text-gray-400"
            role="textbox"
            onInput={handleInputChange}
            onClick={() => setfocus(true)}
            contentEditable
          ></span>
        </div>
        <div
          onClick={() => setfocus(true)}
          className="absolute w-10 right-2 top-0 h-full flex flex-col justify-center items-center"
        >
          <motion.div
            animate={{ rotate: focus ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={SelectArrow}
              alt="Arrow"
              className="w-6 h-6 object-contain opacity-60"
            />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {!isDelete && focus && (
          <motion.ul
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="option_container absolute bg-white w-full h-fit max-h-100 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-y-2 items-center border-2 border-gray-200 rounded-xl shadow-2xl z-50 mt-2"
          >
            {loading ? (
              <NormalSkeleton width="100%" height="40px" count={3} />
            ) : options && options.length > 0 ? (
              options.map((i, idx) => {
                const selected = isSelected(i);
                const selectedIndex = selectedvalue?.findIndex(
                  (v) => v.value === i.value,
                );
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="option w-full h-fit flex flex-row items-center gap-3 group cursor-pointer"
                    onClick={() => handleSelectOption(i)}
                  >
                    <div
                      className={`selectednumber w-9 h-9 font-semibold text-sm rounded-full flex justify-center items-center transition-all duration-200 ${
                        selected
                          ? "bg-linear-to-br from-blue-500 to-purple-600 text-white shadow-md scale-110"
                          : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                      }`}
                    >
                      {!singleselect && selected
                        ? selectedIndex !== undefined && selectedIndex !== -1
                          ? selectedIndex + 1
                          : "✓"
                        : selected
                          ? "✓"
                          : ""}
                    </div>
                    <li
                      className={`w-full h-fit p-3 font-medium rounded-lg transition-all duration-200 ${
                        selected
                          ? "bg-linear-to-r from-blue-50 to-purple-50 text-blue-700 font-semibold"
                          : "bg-gray-50 text-gray-700 group-hover:bg-gray-100 group-hover:shadow-md"
                      }`}
                    >
                      {i.label}
                    </li>
                  </motion.div>
                );
              })
            ) : (
              <div className="w-full h-20 flex items-center justify-center text-gray-400 text-sm">
                <p>No results found</p>
              </div>
            )}
            {options && !isLimit && options.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full mt-2"
              >
                <button
                  onClick={loadMore}
                  type="button"
                  className="w-full h-10 rounded-lg font-semibold text-sm bg-linear-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Load More
                </button>
              </motion.div>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
