"use client";
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
import { Selection } from "./Button";
import { getSubCategories } from "../dashboard/inventory/varaint_action";
import { getSelectCategory } from "../action";
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
      return selectedvalue?.some((i) => i.value === val.value) ?? false;
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
      const selected = [...(selectedvalue ?? [])];
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
          key={i.value}
          layout
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-fit h-fit flex flex-row items-center gap-1.5 bg-blue-600 rounded-lg pl-3 pr-1.5 py-1.5"
        >
          <p className="text-sm font-medium text-white truncate max-w-50">
            {i.label}
          </p>
          <button
            type="button"
            aria-label={`Remove ${i.label}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSelected(idx);
            }}
            onMouseEnter={() => setisDelete(true)}
            onMouseLeave={() => setisDelete(false)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-blue-700 transition-colors duration-150 shrink-0"
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
        className={`inputcontainer w-full min-h-13 relative h-fit flex flex-row items-center border-2 rounded-xl bg-white cursor-text transition-all duration-200 ${
          focus
            ? "border-blue-500 ring-4 ring-blue-100"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="w-full pr-10 h-fit flex flex-row flex-wrap items-center gap-1.5 p-2">
          <AnimatePresence>{selectedTags}</AnimatePresence>
          <span
            ref={inputRef}
            className={`min-w-50 flex-1 h-full px-1 py-1 text-sm flex flex-col justify-center cursor-text focus:outline-hidden ${
              focus ? "text-gray-800" : "text-gray-400"
            }`}
            role="textbox"
            onInput={handleInputChange}
            onClick={() => setfocus(true)}
            contentEditable
          ></span>
        </div>
        <div
          onClick={() => setfocus(true)}
          className="absolute w-10 right-1 top-0 h-full flex flex-col justify-center items-center"
        >
          <motion.svg
            animate={{ rotate: focus ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`w-5 h-5 transition-colors duration-200 ${
              focus ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </motion.svg>
        </div>
      </div>
      <AnimatePresence>
        {!isDelete && focus && (
          <motion.div
            role="listbox"
            aria-multiselectable={!singleselect}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="option_container absolute bg-white w-full h-fit max-h-80 overflow-y-auto overflow-x-hidden p-1.5 flex flex-col gap-y-0.5 border border-gray-200 rounded-xl shadow-lg z-50 mt-1.5"
          >
            {loading ? (
              <div className="p-1.5">
                <NormalSkeleton width="100%" height="36px" count={3} />
              </div>
            ) : options && options.length > 0 ? (
              options.map((i) => {
                const selected = isSelected(i);
                const selectedIndex = selectedvalue?.findIndex(
                  (v) => v.value === i.value,
                );
                return (
                  <div
                    key={i.value}
                    role="option"
                    aria-selected={selected}
                    className={`option w-full h-fit flex flex-row items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                      selected
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelectOption(i)}
                  >
                    <div
                      className={`selectednumber w-6 h-6 shrink-0 text-xs font-semibold rounded-full flex justify-center items-center transition-colors duration-150 ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "border-2 border-gray-300 bg-white"
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
                    <span
                      className={`w-full text-sm truncate ${
                        selected ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {i.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-16 flex items-center justify-center text-gray-400 text-sm">
                <p>No results found</p>
              </div>
            )}
            {options && !isLimit && options.length > 0 && (
              <div className="w-full pt-1.5 mt-1 border-t border-gray-100">
                <button
                  onClick={loadMore}
                  type="button"
                  className="w-full h-9 rounded-lg font-semibold text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                >
                  Load More
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
