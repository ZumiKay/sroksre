"use client";
import Image from "next/image";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { SelectType } from "@/src/context/GlobalContext";
import { getSelectCategory } from "../action";
import PrimaryButton, { Selection } from "./Button";
import { getSubCategories } from "../dashboard/inventory/varaint_action";
import SelectArrow from "../../../public/Image/Arrow_down.svg";
import { AnimatePresence, motion } from "framer-motion";
import { DeleteIcon } from "./Asset";
import { Skeleton } from "@nextui-org/react";

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
        parseInt(selected.value.toString())
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

const isSelect = (select: SelectType[], value: SelectType) => {
  return select.findIndex((i) => i.value === value.value);
};

interface selectprops {
  getdata: (
    take: number,
    value: string
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
  const [limit, setlimt] = useState<number>(3);
  const [loading, setloading] = useState(false);
  const [isLimit, setIsLimit] = useState(false);
  const [options, setoptions] = useState<Array<SelectType> | undefined>();
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedvalue, setselectedvalue] = useState<SelectType[] | undefined>(
    value
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conref = useRef<HTMLDivElement>();

  useEffect(() => {
    const fetchData = async () => {
      setloading(true);
      const res = await getdata(limit, inputValue);
      setloading(false);
      if (res && res.success) {
        setoptions(res.data);
        setIsLimit(res.isLimit ?? false);
      }
    };

    if (inputRef.current) {
      const placeHolder = placeholder ?? "Search Product";
      if (focus) {
        inputRef.current.innerHTML = "";
        fetchData();
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

  const handleSelectOption = (value: SelectType) => {
    const check = isSelect(selectedvalue ?? [], value);
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
  };

  const handleInputChange = async () => {
    if (inputRef.current) {
      const value = inputRef.current.innerText;
      setloading(true);
      setInputValue(value);
      const data = await getdata(3, value);
      setloading(false);
      if (data && data.success) {
        setoptions(data.data);
      }
    }
  };

  const loadMore = async () => {
    const data = await getdata(limit + 3, inputValue);
    if (data && data.success) {
      setoptions(data.data);
      setlimt(limit + 3);
      data.isLimit && setIsLimit(data.isLimit);
    }
  };

  const handleDeleteSelected = (idx: number) => {
    let selected = [...(selectedvalue ?? [])];
    selected.splice(idx, 1);
    setselectedvalue(selected);
    onSelect &&
      onSelect &&
      (singleselect
        ? onSelect(selected.length === 0 ? undefined : selected[0])
        : onSelect(selected.length === 0 ? undefined : selected));
  };

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
        className="inputcontainer w-full min-h-[50px] relative h-fit flex flex-row items-center border border-black rounded-lg"
      >
        <div className="w-full max-w-[95%] h-fit flex flex-row flex-wrap items-center gap-5 p-1">
          {selectedvalue &&
            selectedvalue.map((i, idx) => (
              <div
                key={idx}
                className="w-fit h-fit flex flex-row items-center gap-x-5 bg-gray-300 rounded-lg"
              >
                <p
                  key={idx}
                  className="w-fit max-w-[200px] break-words  h-full p-2  font-bold "
                >
                  {i.label}
                </p>
                <p
                  onClick={() => handleDeleteSelected(idx)}
                  className="w-fit h-fit pr-1 relative"
                >
                  <DeleteIcon />
                </p>
              </div>
            ))}
          <span
            ref={inputRef}
            className="min-w-[200px] w-full h-full text-lg flex flex-col justify-center cursor-pointer focus:outline-none"
            role="textbox"
            onInput={handleInputChange}
            onClick={() => setfocus(true)}
            contentEditable
          ></span>
        </div>
        <div
          onClick={() => setfocus(true)}
          className="absolute w-[30px] right-1 top-0 h-full flex flex-col justify-center items-end"
        >
          <Image
            src={SelectArrow}
            alt="Arrow"
            className="w-[30px] h-[30px] object-contain absolute"
          />
        </div>
      </div>
      <AnimatePresence>
        {focus && (
          <motion.ul
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={focus && { opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`option_container absolute  bg-white w-full h-fit max-h-[400px] 
            overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-y-5 items-center border border-gray-300
            z-50
            `}
          >
            {loading ? (
              <NormalSkeleton width="100%" height="30px" count={3} />
            ) : (
              options?.map((i, idx) => (
                <>
                  <div
                    key={idx}
                    className="option w-full h-fit flex flex-row items-center gap-x-5"
                    onClick={() => handleSelectOption(i)}
                  >
                    <div
                      style={
                        isSelect(selectedvalue ?? [], i) !== -1
                          ? { backgroundColor: "#4688A0" }
                          : { backgroundColor: "#d2d2d2" }
                      }
                      className={`selectednumber cursor-pointer w-[30px] h-[30px] p-2 font-medium text-sm text-white rounded-full flex justify-center items-center`}
                    >
                      {!singleselect
                        ? `${
                            isSelect(selectedvalue ?? [], i) !== -1
                              ? (isSelect(selectedvalue ?? [], i) as any) + 1
                              : ""
                          }`
                        : ""}
                    </div>
                    <li className="w-full h-fit p-2 font-bold bg-gray-200 rounded-lg transition-all hover:bg-white active:bg-white cursor-pointer">
                      {i.label}
                    </li>
                  </div>
                </>
              ))
            )}
            {options && !isLimit && (
              <PrimaryButton
                text="Load More"
                type="button"
                radius="10px"
                color="#438D86"
                onClick={() => loadMore()}
              />
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
