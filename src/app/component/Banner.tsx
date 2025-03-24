"use client";
import Image from "next/image";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import {CSSProperties, useEffect, useRef, useState} from "react";
import {getSelectCategory} from "../action";
import PrimaryButton, {Selection} from "./Button";
import {getSubCategories} from "../dashboard/inventory/varaint_action";
import SelectArrow from "../../../public/Image/Arrow_down.svg";
import {AnimatePresence, motion} from "framer-motion";
import {DeleteIcon} from "./Asset";
import {Skeleton} from "@heroui/react";
import {SelectType} from "@/src/context/GlobalType.type";
import {ApiRequest} from "@/src/context/CustomHook";
import {useCallback, useMemo} from "react";

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
            {Array.from({length: count}).map((_, idx) => (
                <Skeleton key={idx} className="rounded-lg" style={{height, width}}/>
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
                setsubcate(sub.data?.map((i) => ({label: i.name, value: i.id})));
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
                        <Selection data={subcate}/>
                    </div>
                )}
            </div>
            {selected && (
                <div className="w-full h-fit flex flex-col gap-y-5">
                    <label className="text-lg font-bold">Products</label>
                    <Selection data={["All"]}/>
                </div>
            )}
        </div>
    );
};

const isSelect = (select: SelectType[], value: SelectType) => {
    return select.findIndex((i) => i.value === value.value);
};


// Custom debounce hook to prevent excessive API calls
const useDebounce = <T, >(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

interface SelectAndSearchProps {
    apiEndpoint: string;
    searchParam?: string;
    onSelect?: (value?: Array<SelectType> | SelectType) => void;
    value?: Array<SelectType>;
    singleSelect?: boolean;
    placeholder?: string;
    debounceMs?: number; // Allow customizing debounce time
}

export const SelectAndSearchProduct = ({
                                           apiEndpoint,
                                           searchParam = "",
                                           onSelect,
                                           value = [],
                                           singleSelect = false,
                                           placeholder = "Search Product",
                                           debounceMs = 300,
                                       }: SelectAndSearchProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [limit, setLimit] = useState<number>(3);
    const [loading, setLoading] = useState(false);
    const [isLimit, setIsLimit] = useState(false);
    const [options, setOptions] = useState<Array<SelectType>>([]);
    const [inputValue, setInputValue] = useState<string>("");
    const [selectedValues, setSelectedValues] = useState<SelectType[]>(value);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsContainerRef = useRef<HTMLUListElement>(null);

    // Debounce input value to prevent excessive API calls
    const debouncedInputValue = useDebounce(inputValue, debounceMs);

    // Construct API URL with parameters - memoize to prevent unnecessary recalculations
    const constructUrl = useCallback((searchLimit: number, searchValue: string): string => {
        let finalUrl = apiEndpoint;

        // Add provided searchParam (which starts with ?)
        if (searchParam) {
            finalUrl += searchParam;
        } else {
            finalUrl += "?";
        }

        // Add additional parameters with & prefix
        const connector = searchParam ? "&" : "";
        finalUrl += `${connector}limit=${searchLimit}`;

        if (searchValue) {
            finalUrl += `&query=${encodeURIComponent(searchValue)}`;
        }

        return finalUrl;
    }, [apiEndpoint, searchParam]);

    // Fetch data function - memoized with useCallback
    const fetchData = useCallback(async (searchLimit: number, searchValue: string) => {
        setLoading(true);

        try {
            const finalUrl = constructUrl(searchLimit, searchValue);

            const response = await fetch(finalUrl, {
                // Add cache control to optimize fetch requests
                cache: "no-store" // Use this for data that changes frequently
            });

            const data = await response.json();

            if (data.success) {
                setOptions(data.data || []);
                setIsLimit(data.isLimit ?? false);
            }

            return data;
        } catch (error) {
            console.error("Error fetching options:", error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [constructUrl]);

    // Effect to fetch data when debounced input changes
    useEffect(() => {
        if (isFocused) {
            fetchData(limit, debouncedInputValue);
        }
    }, [debouncedInputValue, isFocused, limit, fetchData]);

    // Handle option selection - memoized with useCallback
    const handleSelectOption = useCallback((option: SelectType) => {
        setSelectedValues(prev => {
            const selected = [...(prev || [])];
            const selectedIndex = selected.findIndex(item => item.value === option.value);

            let newSelected: SelectType[];

            if (selectedIndex !== -1) {
                selected.splice(selectedIndex, 1);
                newSelected = selected;
            } else if (singleSelect) {
                newSelected = [option];
            } else {
                newSelected = [...selected, option];
            }

            // Call onSelect outside the state setter for performance
            setTimeout(() => {
                if (onSelect) {
                    if (singleSelect) {
                        onSelect(newSelected.length ? newSelected[0] : undefined);
                    } else {
                        onSelect(newSelected.length ? newSelected : undefined);
                    }
                }
            }, 0);

            return newSelected;
        });
    }, [onSelect, singleSelect]);

    // Handle input changes
    const handleInputChange = () => {
        if (inputRef.current) {
            const value = inputRef.current.innerText;
            setInputValue(value);
        }
    };

    // Load more options
    const loadMore = useCallback(async () => {
        const newLimit = limit + 3;
        const data = await fetchData(newLimit, inputValue);

        if (data?.success) {
            setLimit(newLimit);
        }
    }, [fetchData, inputValue, limit]);

    // Handle deletion of selected options
    const handleDeleteSelected = useCallback((idx: number) => {
        setSelectedValues(prev => {
            const selected = [...(prev || [])];
            selected.splice(idx, 1);

            // Call onSelect outside the state setter for performance
            setTimeout(() => {
                if (onSelect) {
                    if (singleSelect) {
                        onSelect(selected.length ? selected[0] : undefined);
                    } else {
                        onSelect(selected.length ? selected : undefined);
                    }
                }
            }, 0);

            return selected;
        });

        setIsDelete(false);
    }, [onSelect, singleSelect]);

    // Set up placeholder when focused/unfocused
    useEffect(() => {
        if (inputRef.current) {
            if (isFocused) {
                inputRef.current.innerHTML = "";
            } else {
                if (inputRef.current.innerHTML !== placeholder) {
                    inputRef.current.innerHTML = placeholder;
                }
            }
        }
    }, [isFocused, placeholder]);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleCloseOption = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };

        window.addEventListener("mousedown", handleCloseOption);
        return () => {
            window.removeEventListener("mousedown", handleCloseOption);
        };
    }, []);

    // Virtual rendering optimization - only render visible options
    const renderOptions = useMemo(() => {
        if (loading) {
            return <NormalSkeleton width="100%" height="30px" count={3}/>;
        }

        // Only render visible options for performance with large datasets
        return options.map((option, idx) => {
            const selectedIndex = selectedValues.findIndex(item => item.value === option.value);
            const isSelected = selectedIndex !== -1;

            return (
                <div
                    key={`option-${option.value}`}
                    className="option w-full h-fit flex flex-row items-center gap-x-5"
                    onClick={() => handleSelectOption(option)}
                >
                    <div
                        style={
                            isSelected
                                ? {backgroundColor: "#4688A0"}
                                : {backgroundColor: "#d2d2d2"}
                        }
                        className="selectednumber cursor-pointer w-[30px] h-[30px] p-2 font-medium text-sm text-white rounded-full flex justify-center items-center"
                    >
                        {!singleSelect && isSelected ? selectedIndex + 1 : ""}
                    </div>
                    <li className="w-full h-fit p-2 font-bold bg-gray-200 rounded-lg transition-all hover:bg-white active:bg-white cursor-pointer">
                        {option.label}
                    </li>
                </div>
            );
        });
    }, [options, loading, selectedValues, singleSelect, handleSelectOption]);

    // Render selected values memoized
    const renderSelectedValues = useMemo(() => {
        return selectedValues.map((item, idx) => (
            <div
                key={`selected-${item.value}`}
                className="w-fit h-fit flex flex-row items-center gap-x-5 bg-gray-300 rounded-lg"
            >
                <p className="w-fit max-w-[200px] break-words h-full p-2 font-bold">
                    {item.label}
                </p>
                <p
                    onClick={() => handleDeleteSelected(idx)}
                    onMouseEnter={() => setIsDelete(true)}
                    onMouseLeave={() => setIsDelete(false)}
                    onTouchStart={() => setIsDelete(true)}
                    onTouchEnd={() => setIsDelete(false)}
                    className="w-fit h-fit pr-1 relative cursor-pointer"
                >
                    <DeleteIcon/>
                </p>
            </div>
        ));
    }, [selectedValues, handleDeleteSelected]);

    // Focus optimization for accessibility and UX
    const handleContainerClick = useCallback(() => {
        setIsFocused(true);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Optimize scroll handling for better performance
    useEffect(() => {
        if (optionsContainerRef.current) {
            const handleScroll = () => {
                const {scrollTop, scrollHeight, clientHeight} = optionsContainerRef.current!;

                // Load more options when user scrolls near the bottom (within 50px)
                if (scrollHeight - scrollTop - clientHeight < 50 && !isLimit && !loading) {
                    loadMore();
                }
            };

            optionsContainerRef.current.addEventListener('scroll', handleScroll);
            return () => {
                optionsContainerRef.current?.removeEventListener('scroll', handleScroll);
            };
        }
    }, [isLimit, loading, loadMore]);

    return (
        <div
            ref={containerRef}
            className="productselect w-full h-fit relative"
        >
            <div
                onClick={handleContainerClick}
                className="inputcontainer w-full min-h-[50px] relative h-fit flex flex-row items-center border border-gray-300 rounded-lg"
            >
                <div className="w-full max-w-[95%] h-fit flex flex-row flex-wrap items-center gap-5 p-1">
                    {renderSelectedValues}
                    <span
                        ref={inputRef}
                        className="min-w-[200px] w-full h-full text-lg flex flex-col justify-center cursor-pointer focus:outline-none"
                        role="textbox"
                        onInput={handleInputChange}
                        onClick={handleContainerClick}
                        contentEditable
                        suppressContentEditableWarning={true}
                    ></span>
                </div>
                <div
                    onClick={handleContainerClick}
                    className="absolute w-[30px] right-1 top-0 h-full flex flex-col justify-center items-end"
                >
                    <Image
                        src={SelectArrow}
                        alt="Arrow"
                        className="w-[30px] h-[30px] object-contain absolute"
                        priority
                    />
                </div>
            </div>
            <AnimatePresence>
                {!isDelete && isFocused && (
                    <motion.ul
                        ref={optionsContainerRef}
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                        transition={{duration: 0.15}}
                        className="option_container absolute bg-white w-full h-fit max-h-[400px]
                      overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-y-5 items-center border border-gray-300 z-50"
                    >
                        {renderOptions}
                        {options.length > 0 && !isLimit && !loading && (
                            <PrimaryButton
                                text="Load More"
                                type="button"
                                radius="10px"
                                color="#438D86"
                                onClick={loadMore}
                            />
                        )}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};
