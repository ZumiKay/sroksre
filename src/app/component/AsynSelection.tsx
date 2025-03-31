"use client";
import {
  InfiniteScrollReturnType,
  SelectType,
} from "@/src/context/GlobalType.type";
import { Select, Selection, SelectItem, SelectProps } from "@heroui/react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";

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
  ) => Promise<InfiniteScrollReturnType> | Array<SelectType> | undefined;

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
  const [isOpen, setIsOpen] = React.useState(false);
  const [items, setitems] = React.useState<SelectType[]>([
    {
      label: "None",
      value: "0",
    },
  ]);

  const [offset, setoffset] = React.useState(5);
  const [hasMore, sethasMore] = React.useState(false);
  const [selectedKey, setselectedKey] = React.useState<Selection>(
    new Set([""])
  );
  const dataFetched = React.useRef(false);

  const fetchData = useCallback(
    async (limit: number) => {
      if (!data) return;

      const isAsyncType = type === "async";
      const selectedValues = option?.selectedValue
        ? new Set(option.selectedValue)
        : null;

      try {
        if (!isAsyncType) {
          const items = data() as SelectType[];
          setitems(items);
          if (selectedValues && items) {
            const matchingItems = items.filter((item) =>
              selectedValues.has(String(item.value))
            );

            setselectedKey(
              matchingItems.length > 0
                ? new Set(matchingItems.map((item) => item.value))
                : new Set([""])
            );
          }

          dataFetched.current = true;
          return;
        }

        setloading(true);
        const getdata = (await data(limit)) as InfiniteScrollReturnType;
        const items = getdata?.items || [];

        // Batch state updates
        setitems(items);

        if (selectedValues && items.length) {
          const matchingItems = items.filter((item) =>
            selectedValues.has(String(item.value))
          );
          setselectedKey(
            matchingItems.length > 0
              ? new Set(matchingItems.map((item) => item.value))
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
    [
      data,
      option?.selectedValue,
      type,
      setitems,
      setselectedKey,
      sethasMore,
      setloading,
    ]
  );

  useEffect(() => {
    // Initial fetch or when offset changes
    fetchData(offset);
  }, [offset]);

  // Handle open/close with refetch logic
  useEffect(() => {
    if (isOpen && (!dataFetched.current || reFetch)) {
      fetchData(offset);
    }
  }, [isOpen, reFetch]);

  // Force refetch when forceRefetch changes (likely a counter or timestamp)
  useEffect(() => {
    if (forceRefetch !== undefined) {
      dataFetched.current = false;
      fetchData(offset);
    }
  }, [forceRefetch]);

  const [, scrollerRef] = useInfiniteScroll({
    hasMore: hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: () => {
      if (type === "async") setoffset((prev) => prev + 5);
    },
  });

  return (
    <Select
      {...option}
      onChange={(val) => {
        if (option?.onValueChange) {
          option?.onValueChange(
            val,
            items.find((i) => i.value.toString() === val.target.value)
          );
        } else if (option?.onChange) option.onChange(val);
      }}
      onSelectionChange={setselectedKey}
      selectedKeys={selectedKey}
      className="max-w-xs"
      isLoading={loading}
      items={items ?? []}
      scrollRef={scrollerRef}
      fullWidth
      aria-label="selection"
      onOpenChange={setIsOpen}
    >
      {(item) => (
        <SelectItem key={item.value} className="capitalize">
          {item.label}
        </SelectItem>
      )}
    </Select>
  );
};
