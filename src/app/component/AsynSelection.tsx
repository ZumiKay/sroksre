"use client";
import {
  InfiniteScrollReturnType,
  SelectType,
} from "@/src/context/GlobalType.type";
import { Select, Selection, SelectItem, SelectProps } from "@heroui/react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";

interface CustomOnChangeType extends SelectProps {
  onValueChange?: (
    e: ChangeEvent<HTMLSelectElement>,
    items?: SelectType
  ) => void;
  selectedValue?: Array<string>;
}
type AsyncSelectionProps = {
  type: "normal" | "async";
  data?: (
    offset?: number
  ) =>
    | Promise<InfiniteScrollReturnType>
    | Array<SelectType>
    | Readonly<Array<SelectType>>
    | undefined;

  option?: Partial<CustomOnChangeType>;
  reFetch?: boolean;
  forceRefetch?: number;
};

export const AsyncSelection = ({
  data,
  option,
  type,
  reFetch = false,
  forceRefetch,
}: AsyncSelectionProps) => {
  const [loading, setloading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setitems] = useState<SelectType[]>([
    {
      label: "None",
      value: "0",
    },
  ]);

  const [offset, setoffset] = useState(5);
  const [hasMore, sethasMore] = useState(false);
  const [selectedKey, setselectedKey] = useState<Selection>(new Set([""]));
  const dataFetched = React.useRef(false);

  // Memoize the selectedValues Set for better performance
  const selectedValues = useMemo(
    () => (option?.selectedValue ? new Set(option.selectedValue) : null),
    [option?.selectedValue]
  );

  // Memorize isAsyncType to avoid recalculating
  const isAsyncType = useMemo(() => type === "async", [type]);

  const fetchData = useCallback(
    async (limit: number) => {
      if (!data) return;

      try {
        if (!isAsyncType) {
          const newItems = data() as SelectType[];
          setitems(newItems);

          if (selectedValues && newItems) {
            const matchingItems = newItems.filter((item) =>
              selectedValues.has(String(item.value))
            );

            setselectedKey(
              matchingItems.length > 0
                ? new Set(matchingItems.map((item) => String(item.value)))
                : new Set([""])
            );
          }

          dataFetched.current = true;
          return;
        }

        setloading(true);
        const getdata = (await data(limit)) as InfiniteScrollReturnType;
        const newItems = getdata?.items || [];

        // Using a function update to guarantee we're working with latest state
        setitems(newItems);

        if (selectedValues && newItems.length) {
          const matchingItems = newItems.filter((item) =>
            selectedValues.has(String(item.value))
          );

          setselectedKey(
            matchingItems.length > 0
              ? new Set(matchingItems.map((item) => String(item.value)))
              : new Set([""])
          );
        }

        sethasMore(getdata?.hasMore ?? false);
        setloading(false);
        dataFetched.current = true;
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isAsyncType) setloading(false);
        dataFetched.current = true;
      }
    },
    [data, selectedValues, isAsyncType]
  );

  // Combine related effects
  useEffect(() => {
    // Initial fetch
    fetchData(offset);
  }, [offset, fetchData]);

  // Handle open/close with refetch logic
  useEffect(() => {
    if (isOpen && (!dataFetched.current || reFetch)) {
      fetchData(offset);
    }
  }, [isOpen, reFetch, offset, fetchData]);

  // Force refetch when forceRefetch changes
  useEffect(() => {
    if (forceRefetch !== undefined) {
      dataFetched.current = false;
      fetchData(offset);
    }
  }, [forceRefetch, fetchData, offset]);

  const handleLoadMore = useCallback(() => {
    if (isAsyncType) setoffset((prev) => prev + 5);
  }, [isAsyncType]);

  const [, scrollerRef] = useInfiniteScroll({
    hasMore: hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: handleLoadMore,
  });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (option?.onOpenChange) {
        option.onOpenChange(open);
      }
    },
    [option]
  );

  const handleChange = useCallback(
    (val: ChangeEvent<HTMLSelectElement>) => {
      if (option?.onValueChange) {
        const selectedItem = items.find(
          (i) => String(i.value) === String(val.target.value)
        );
        option.onValueChange(val, selectedItem);
      }
    },
    [items, option]
  );

  return (
    <Select
      {...option}
      onChange={handleChange}
      onOpenChange={handleOpenChange}
      selectedKeys={selectedKey}
      onSelectionChange={setselectedKey}
      items={items}
      isLoading={loading}
      ref={scrollerRef as never}
    >
      {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
    </Select>
  );
};
