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
  // Initialize selectedKey with option.selectedValue if available
  const [selectedKey, setSelectedKey] = useState<Selection>(() => {
    return option?.selectedValue && option.selectedValue.length > 0
      ? new Set(option.selectedValue.map(String))
      : new Set([""]);
  });
  const initialFetchDone = useRef(false);
  const prevForceRefetch = useRef(forceRefetch);

  // Memoize the selectedValues Set for better performance
  const selectedValues = useMemo(
    () =>
      option?.selectedValue ? new Set(option.selectedValue.map(String)) : null,
    [option?.selectedValue]
  );

  // Update selectedKey when selectedValues change
  useEffect(() => {
    if (selectedValues && selectedValues.size > 0) {
      // Convert Set to Array and back to Set to avoid TypeScript issues
      setSelectedKey(new Set(Array.from(selectedValues)));
    }
  }, [selectedValues]);

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

          return;
        }

        setLoading(true);
        const getdata = (await data(limit)) as InfiniteScrollReturnType;
        const newItems = getdata?.data ?? getdata ?? [];

        // Using a function update to guarantee we're working with latest state
        setItems((prevItems) => {
          // Keep existing items if we're loading more, otherwise use new items
          const combinedItems =
            limit > 5 ? [...prevItems, ...newItems] : newItems;

          // If we have selected values, ensure they're in the items list
          if (selectedValues && selectedValues.size > 0) {
            const selectedItemExists = combinedItems.some((item) =>
              selectedValues.has(String(item.value))
            );

            // If selected item not in list, try to find it in the new data
            if (!selectedItemExists) {
              // If the selected item was found in the new data, it would be handled below
              // Otherwise we keep our combined items as is
            }
          }

          return combinedItems;
        });

        if (selectedValues && selectedValues.size > 0) {
          const matchingItems = newItems.filter((item) =>
            selectedValues.has(String(item.value))
          );

          if (matchingItems.length > 0) {
            setSelectedKey(
              new Set(matchingItems.map((item) => String(item.value)))
            );
          } else if (limit === 5) {
            // Only set to empty on initial load, not during pagination
            setSelectedKey(new Set([""]));
          }
        }

        setHasMore(getdata?.hasMore ?? false);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isAsyncType) setLoading(false);
      }
    },
    [data, selectedValues, isAsyncType]
  );

  // Effect to handle forceRefetch changes
  useEffect(() => {
    if (
      forceRefetch !== undefined &&
      forceRefetch !== prevForceRefetch.current &&
      isOpen
    ) {
      fetchData(offset);
      prevForceRefetch.current = forceRefetch;
    }
  }, [forceRefetch, isOpen, offset, fetchData]);

  // Effect specifically for when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // If this is the first time opening or reFetch is true, fetch data
      if (!initialFetchDone.current || reFetch) {
        setOffset(5); // Reset offset when opening
        fetchData(5); // Fetch with initial limit
        initialFetchDone.current = true;
      }
    }
  }, [isOpen, reFetch, fetchData]);

  // Fetch initial data on mount if we have selectedValue, regardless of isOpen state
  useEffect(() => {
    if (
      selectedValues &&
      selectedValues.size > 0 &&
      !initialFetchDone.current
    ) {
      fetchData(5);
      initialFetchDone.current = true;
    }
  }, [selectedValues, fetchData]);

  const handleLoadMore = useCallback(() => {
    if (isAsyncType && hasMore) {
      setOffset((prev) => prev + 5);
    }
  }, [isAsyncType, hasMore]);

  // Effect to handle loading more data when offset changes
  useEffect(() => {
    // Only fetch more data if initialFetchDone is true (after first open)
    // and we're not just resetting to the initial offset
    if (initialFetchDone.current && offset > 5 && isOpen) {
      fetchData(offset);
    }
  }, [offset, isOpen, fetchData]);

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
              renderValues.map((item) =>
                customRender(item.data as SelectType<string>)
              )
          : undefined
      }
    >
      {(item) => (
        <SelectItem
          key={item.value}
          textValue={String(item.value)}
          className="w-full h-fit p-2"
        >
          {customRender ? customRender(item) : item.label}
        </SelectItem>
      )}
    </Select>
  );
};
