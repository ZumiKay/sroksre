"use client";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import {
  ChangeEvent,
  CSSProperties,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useId,
} from "react";
import { Selection } from "./Button";
import { getSubCategories } from "../dashboard/inventory/varaint_action";
import { getSelectCategory } from "../action";
import { AnimatePresence, motion } from "framer-motion";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const conref = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const listboxId = useId();

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

  // Load options whenever the picker opens
  useEffect(() => {
    if (focus) fetchData(inputValue, limit);
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
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const emitChange = useCallback(
    (selected: SelectType[]) => {
      if (!onSelect) return;
      if (singleselect) onSelect(selected[0]);
      else onSelect(selected.length === 0 ? undefined : selected);
    },
    [singleselect, onSelect],
  );

  const handleSelectOption = useCallback(
    (value: SelectType) => {
      const check =
        selectedvalue?.findIndex((i) => i.value === value.value) ?? -1;
      let selected = [...(selectedvalue ?? [])];

      if (check !== -1) {
        selected.splice(check, 1);
      } else if (singleselect) {
        selected = [value];
      } else {
        selected.push(value);
      }

      emitChange(selected);
      setselectedvalue(selected);
      // A single pick is final, so close the list
      if (singleselect && check === -1) setfocus(false);
    },
    [selectedvalue, singleselect, emitChange],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      setfocus(true);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchData(value, 3);
        setlimt(3);
      }, 300);
    },
    [fetchData],
  );

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
      emitChange(selected);
      setisDelete(false);
    },
    [selectedvalue, emitChange],
  );

  const handleClearAll = useCallback(() => {
    setselectedvalue([]);
    emitChange([]);
    setisDelete(false);
  }, [emitChange]);

  const hasSelection = (selectedvalue?.length ?? 0) > 0;
  const inputPlaceholder = hasSelection
    ? singleselect
      ? "Search to change"
      : "Search to add more"
    : (placeholder ?? "Search products");

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
          className="w-fit h-fit flex flex-row items-center gap-1 bg-slate-100 border border-slate-200 rounded-md pl-2.5 pr-1 py-0.5"
        >
          <p className="text-sm font-medium text-slate-800 truncate max-w-50">
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
            className="w-5 h-5 flex items-center justify-center rounded-sm text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors duration-150 shrink-0"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </motion.div>
      )),
    [selectedvalue, handleDeleteSelected],
  );

  return (
    <div
      ref={conref}
      onTouchCancel={() => setfocus(false)}
      className="productselect w-full h-fit relative"
    >
      <div
        onClick={() => {
          setfocus(true);
          inputRef.current?.focus();
        }}
        className={`inputcontainer w-full min-h-11 relative h-fit flex flex-row items-center border rounded-lg bg-white cursor-text transition-colors duration-150 ${
          focus
            ? "border-slate-900 ring-2 ring-slate-200"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="absolute left-3 top-3 w-4 h-4 text-slate-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <div className="w-full pl-9 pr-16 h-fit flex flex-row flex-wrap items-center gap-1.5 py-1.5">
          <AnimatePresence>{selectedTags}</AnimatePresence>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={focus}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={inputValue}
            placeholder={inputPlaceholder}
            onChange={handleInputChange}
            onFocus={() => setfocus(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setfocus(false);
                inputRef.current?.blur();
              }
            }}
            className="min-w-30 flex-1 h-7 px-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
        </div>
        <div className="absolute right-1.5 top-0 h-full flex flex-row items-center gap-0.5">
          {hasSelection && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              onMouseEnter={() => setisDelete(true)}
              onMouseLeave={() => setisDelete(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <motion.svg
            animate={{ rotate: focus ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`w-5 h-5 mr-1 transition-colors duration-200 ${
              focus ? "text-slate-900" : "text-slate-400"
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
            id={listboxId}
            role="listbox"
            aria-multiselectable={!singleselect}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="option_container absolute bg-white w-full h-fit max-h-80 overflow-y-auto overflow-x-hidden p-1 flex flex-col gap-y-0.5 border border-slate-200 rounded-lg shadow-lg z-50 mt-1"
          >
            {loading ? (
              <div className="p-1">
                <NormalSkeleton width="100%" height="32px" count={3} />
              </div>
            ) : options && options.length > 0 ? (
              options.map((i) => {
                const selected = isSelected(i);
                const selectedIndex =
                  selectedvalue?.findIndex((v) => v.value === i.value) ?? -1;
                return (
                  <div
                    key={i.value}
                    role="option"
                    aria-selected={selected}
                    className={`option w-full h-fit flex flex-row items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer transition-colors duration-150 ${
                      selected ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                    onClick={() => handleSelectOption(i)}
                  >
                    {singleselect ? (
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                          selected
                            ? "border-slate-900"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected && (
                          <span className="w-2 h-2 rounded-full bg-slate-900" />
                        )}
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`selectednumber w-5 h-5 shrink-0 text-[11px] font-semibold rounded-md flex justify-center items-center transition-colors ${
                          selected
                            ? "bg-slate-900 text-white"
                            : "border border-slate-300 bg-white"
                        }`}
                      >
                        {selected && selectedIndex !== -1
                          ? selectedIndex + 1
                          : ""}
                      </span>
                    )}
                    <span
                      className={`w-full text-sm truncate ${
                        selected
                          ? "font-semibold text-slate-900"
                          : "text-slate-700"
                      }`}
                    >
                      {i.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full py-6 flex items-center justify-center text-slate-500 text-sm">
                <p>
                  {inputValue.trim()
                    ? `No results for “${inputValue.trim()}”`
                    : "No results found"}
                </p>
              </div>
            )}
            {options && !isLimit && options.length > 0 && !loading && (
              <div className="w-full pt-1 mt-0.5 border-t border-slate-100">
                <button
                  onClick={loadMore}
                  type="button"
                  className="w-full h-8 rounded-md font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-150"
                >
                  Show more
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);
