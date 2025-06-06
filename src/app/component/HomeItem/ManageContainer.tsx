"use client";
import {
  BannerSizeType,
  BannerTypeSelect,
  ContainerItemCardType,
  ContainerType,
  FullCategoryType,
} from "@/src/context/GlobalType.type";
import { BannerType } from "../../severactions/actions";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AsyncSelection } from "../AsynSelection";
import { FetchCategory } from "../../dashboard/inventory/createproduct/[editId]/action";
import { Button, CircularProgress, Input } from "@heroui/react";
import { ApiRequest } from "@/src/context/CustomHook";
import { ItemCard } from "./Component";
import { motion } from "framer-motion";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import { Search_Icon } from "../Asset";

type FilterType = {
  search?: string;
  bannertype?: BannerType;
  bannersize?: BannerSizeType;
  categories?: FullCategoryType;
};
interface ManageContainerProps {
  manage?: {
    selectedKey?: Array<number>;
    setSelectKey?: (val: number) => void;
  };
}

const FetchItem = async (
  ty: ContainerType,
  offset: number = 5,
  filter: FilterType | null
) => {
  const url = `/api/${
    ty === "scrollable"
      ? `products?ty=homecontainer&limit=${offset}${
          filter?.search ? `&q=${removeSpaceAndToLowerCase(filter.search)}` : ""
        }${
          filter?.categories?.parent
            ? `&pc=${filter.categories.parent.id}${
                filter.categories.child
                  ? `&cc=${filter.categories.child.id}`
                  : ""
              }`
            : ""
        }`
      : `home/banner?take=${offset}ty=${ty}${
          filter?.search ? `&q=${removeSpaceAndToLowerCase(filter.search)}` : ""
        }${filter?.bannertype ? `&bty=${filter.bannertype}` : ""}`
  }`;

  const makeReq = await ApiRequest({ method: "GET", url });

  if (!makeReq.success) {
    return null;
  }

  return makeReq;
};

const ManageContainer = ({ manage }: ManageContainerProps) => {
  // State management
  const { homeContainer } = useGlobalContext();
  const [filterValue, setFilterValue] = useState<FilterType | undefined>(
    undefined
  );

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [temptItems, settempItems] = useState<Array<ContainerItemCardType>>([]);

  // Debounced search implementation for better performance
  const [searchTerm, setSearchTerm] = useState("");

  // Effect for search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterValue(
        (prev) =>
          ({
            ...prev,
            search: searchTerm,
          } as never)
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      if (!homeContainer?.type) return;
      setIsLoading(true);
      try {
        const data = await FetchItem(
          homeContainer?.type,
          itemsPerPage,
          filterValue ?? null
        );

        if (data?.data) {
          settempItems(data.data as ContainerItemCardType[]);
          setHasMore(data.isLimit ?? false);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filterValue, itemsPerPage, homeContainer?.type]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "search") {
      setSearchTerm(value);
      return;
    }

    setFilterValue((prev) => {
      if (name === "parent" || name === "child") {
        return {
          ...prev,
          categories: {
            ...(name === "parent" ? {} : prev?.categories || {}),
            [name]: {
              id: value,
            },
          },
        } as never;
      }

      return {
        ...prev,
        [name]: value,
      } as never;
    });
  }, []);

  const renderFilterSelection = useMemo(() => {
    if (homeContainer?.type === "scrollable") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-fit grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <AsyncSelection
            type="async"
            data={(offset) =>
              FetchCategory({ ty: "parent", offset: offset ?? 5 }) as never
            }
            option={{
              label: "Parent Categories",
              size: "sm",
              selectedValue: filterValue?.categories?.parent?.id
                ? [filterValue.categories.parent.id.toString()]
                : undefined,
              name: "parent",
              onChange: handleChange as never,
              className: "w-full",
            }}
          />
          <AsyncSelection
            type="async"
            forceRefetch={filterValue?.categories?.parent?.id}
            data={(offset) =>
              (filterValue?.categories?.parent?.id
                ? FetchCategory({
                    ty: "child",
                    offset: offset ?? 5,
                    pid: filterValue.categories.parent.id,
                  })
                : undefined) as never
            }
            option={{
              label: "Child Categories",
              size: "sm",
              selectedValue: filterValue?.categories?.child?.id
                ? [filterValue.categories.child.id.toString()]
                : undefined,
              name: "child",
              onChange: handleChange as never,
              isDisabled: !filterValue?.categories?.parent?.id,
              className: "w-full",
            }}
          />
        </motion.div>
      );
    }

    // Default case for banner type
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-fit grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <AsyncSelection
          type="normal"
          data={() => BannerTypeSelect}
          option={{
            label: "Banner Type",
            name: "bannertype",
            selectedValue:
              homeContainer?.type === "category"
                ? ["Category"]
                : filterValue?.bannertype
                ? [filterValue.bannertype]
                : undefined,
            onChange: handleChange as never,
            className: "w-full",
          }}
        />
      </motion.div>
    );
  }, [
    homeContainer?.type,
    filterValue?.categories?.parent.id,
    filterValue?.categories?.child?.id,
    filterValue?.bannertype,
    handleChange,
  ]);

  // Handle item selection
  const handleSelect = useCallback(
    (val: number) => {
      manage?.setSelectKey?.(val);
    },
    [manage]
  );

  // Load more items
  const handleLoadMore = useCallback(() => {
    setItemsPerPage((prev) => prev + 5);
  }, []);

  // Memoize the item grid to prevent unnecessary re-renders
  const itemGrid = useMemo(() => {
    if (!temptItems || temptItems.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex items-center justify-center py-12"
        >
          <p className="text-lg text-gray-400 font-medium">No items found</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-fit flex flex-row justify-between flex-wrap gap-y-5"
      >
        {temptItems?.map(
          (item) =>
            item && (
              <ItemCard
                key={item.id}
                item={item as never}
                onSelect={handleSelect}
                isSelected={
                  item
                    ? manage?.selectedKey?.includes(item.id as number) ?? false
                    : false
                }
              />
            )
        )}
      </motion.div>
    );
  }, [temptItems, handleSelect, manage?.selectedKey]);

  return (
    <div className="w-full flex flex-col space-y-6 bg-white rounded-xl p-5 shadow-sm">
      <div className="w-full flex flex-col space-y-4">
        <Input
          name="search"
          size="sm"
          value={searchTerm}
          placeholder="Search items..."
          onChange={handleChange}
          startContent={<Search_Icon />}
          className="rounded-lg border-gray-300 focus:border-blue-500 transition-all duration-200"
        />

        <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-100">
          {renderFilterSelection}
        </div>
      </div>

      <div className="w-full min-h-[200px] h-[50vh] overflow-y-auto relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <CircularProgress color="primary" aria-label="Loading items" />
          </div>
        ) : (
          itemGrid
        )}
      </div>

      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex justify-center mt-4"
        >
          <Button
            onPress={handleLoadMore}
            size="sm"
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            Load More
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(ManageContainer);
