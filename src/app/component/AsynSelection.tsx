"use client";
import {
  InfiniteScrollReturnType,
  SelectType,
} from "@/src/context/GlobalType.type";
import { Select, SelectItem, SelectProps } from "@heroui/react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import React, { useEffect, useState } from "react";

type AsyncSelectionProps = {
  type: "normal" | "async";
  data?: (
    offset?: number
  ) => Promise<InfiniteScrollReturnType> | Array<SelectType> | undefined;

  option?: Partial<SelectProps>;
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
  const dataFetched = React.useRef(false);

  const fetchData = async (limit: number) => {
    if (!data) return;

    if (type === "normal") {
      setitems(data() as SelectType[]);
    } else if (type === "async") {
      setloading(true);
      try {
        const getdata = (await data(limit)) as InfiniteScrollReturnType;
        setloading(false);
        setitems(getdata?.items);
        sethasMore(getdata?.hasMore ?? false);
      } catch (error) {
        setloading(false);
        console.error("Error fetching data:", error);
      }
    }
    dataFetched.current = true;
  };

  useEffect(() => {
    // Initial fetch or when offset changes
    fetchData(offset);
  }, [offset, data]);

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
      type === "async" && setoffset((prev) => prev + 5);
    },
  });

  return (
    <Select
      {...option}
      className="max-w-xs"
      isLoading={loading}
      items={items ?? []}
      scrollRef={scrollerRef}
      fullWidth
      aria-label="selection"
      selectionMode="single"
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
