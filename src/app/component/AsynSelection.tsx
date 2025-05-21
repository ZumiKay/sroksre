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
  useRef,
  ReactNode,
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
  customRender?: (item: SelectType<string>) => ReactNode;
};

export const AsyncSelection = ({
  data,
  option,
  type,
  reFetch = false,
  forceRefetch,
  customRender,
}: AsyncSelectionProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SelectType[]>([
    {
      label: "None",
      value: "0",
    },
  ]);

  const [offset, setOffset] = useState(5);
  const [hasMore, setHasMore] = useState(false);
  const [selectedKey, setSelectedKey] = useState<Selection>(new Set([""]));
  const dataFetched = useRef(false);
  const prevForceRefetch = useRef(forceRefetch);

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
          setItems(newItems ?? []);

          if (selectedValues && newItems) {
            const matchingItems = newItems.filter((item) =>
              selectedValues.has(String(item.value))
            );

            setSelectedKey(
              matchingItems.length > 0
                ? new Set(matchingItems.map((item) => String(item.value)))
                : new Set([""])
            );
          }

          dataFetched.current = true;
          return;
        }

        setLoading(true);
        const getdata = (await data(limit)) as InfiniteScrollReturnType;
        const newItems = getdata?.items ?? [];

        // Using a function update to guarantee we're working with latest state
        setItems(newItems);

        if (selectedValues && newItems.length) {
          const matchingItems = newItems.filter((item) =>
            selectedValues.has(String(item.value))
          );

          setSelectedKey(
            matchingItems.length > 0
              ? new Set(matchingItems.map((item) => String(item.value)))
              : new Set([""])
          );
        }

        setHasMore(getdata?.hasMore ?? false);
        setLoading(false);
        dataFetched.current = true;
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isAsyncType) setLoading(false);
        dataFetched.current = true;
      }
    },
    [data, selectedValues, isAsyncType]
  );

  // Combined effect for all data fetching scenarios
  useEffect(() => {
    const shouldFetch =
      // First load
      !dataFetched.current ||
      // forceRefetch changed
      (forceRefetch !== undefined &&
        forceRefetch !== prevForceRefetch.current) ||
      // Component is open and reFetch is true
      (isOpen && reFetch);

    if (shouldFetch) {
      dataFetched.current = false;
      fetchData(offset);
      prevForceRefetch.current = forceRefetch;
    }
  }, [offset, isOpen, reFetch, forceRefetch]);

  const handleLoadMore = useCallback(() => {
    if (isAsyncType && hasMore) {
      setOffset((prev) => prev + 5);
    }
  }, [isAsyncType, hasMore]);

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
      } else if (option?.onChange) {
        option.onChange(val);
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
      onSelectionChange={setSelectedKey}
      isLoading={loading}
      ref={scrollerRef as never}
      items={items}
      renderValue={
        customRender
          ? (renderValues) =>
              renderValues.map((item) => customRender(item.data as SelectType))
          : undefined
      }
    >
      {items && items.length === 0 ? (
        <SelectItem key={"none"}>None</SelectItem>
      ) : (
        items?.map((item) => (
          <SelectItem
            key={item.value}
            textValue={customRender ? item.value.toString() : undefined}
          >
            {item.label}
          </SelectItem>
        ))
      )}
    </Select>
  );
};
