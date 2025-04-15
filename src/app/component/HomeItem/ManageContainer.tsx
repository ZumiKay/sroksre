import {
  BannerSize,
  BannerSizeType,
  BannerTypeSelect,
  ContainerType,
  FullCategoryType,
  HomeContainerItemType,
} from "@/src/context/GlobalType.type";
import { BannerType } from "../../severactions/actions";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { AsyncSelection } from "../AsynSelection";
import { FetchCategory } from "../../dashboard/inventory/createproduct/[editId]/action";
import { Button, CircularProgress, Input } from "@heroui/react";
import { ApiRequest } from "@/src/context/CustomHook";
import { ItemCard } from "./Component";

type FilterType = {
  search?: string;
  bannertype?: BannerType;
  bannersize?: BannerSizeType;
  categories?: FullCategoryType;
};
interface ManageContainerProps {
  type: ContainerType;
  manage?: {
    selectedKey?: Array<number | string>;
    setSelectKey?: (val: number | string) => void;
  };
}

const FetchItem = async (
  ty: ContainerType,
  offset: number = 5,
  filter: FilterType | null
) => {
  const url = `/api/${
    ty === "scrollable"
      ? `product?ty=homecontainer&limit=${offset}${
          filter?.search ? `search=${filter.search}` : ""
        }${
          filter?.categories?.parent
            ? `&pc=${filter.categories.parent.id}${
                filter.categories.child
                  ? `&cc=${filter.categories.child.id}`
                  : ""
              }`
            : ""
        }`
      : `home/banner?${filter?.search ? `&q=${filter.search}` : ""}${
          filter?.bannertype ? `&ty=${filter.bannertype}` : ""
        }`
  }`;

  const makeReq = await ApiRequest({ method: "GET", url });

  if (!makeReq.success) {
    return null;
  }

  return makeReq;
};

const ManageContainer = ({ type, manage }: ManageContainerProps) => {
  const [filterValue, setFilterValue] = useState<FilterType | null>(null);
  const [items, setItems] = useState<HomeContainerItemType[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, sethasMore] = useState(false);

  // Fetch data when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await FetchItem(type, itemsPerPage, filterValue);
        if (data) {
          setItems(data.data as HomeContainerItemType[]);
          sethasMore(data.isLimit ?? false);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterValue, itemsPerPage, type]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilterValue(
      (prev) =>
        ({
          ...prev,
          ...(name === "parent" || name === "child"
            ? { categories: { [name]: value } }
            : { [name]: value }),
        } as never)
    );
  }, []);

  const renderFilterSelection = useCallback(
    (containerType: ContainerType) => {
      if (containerType === "scrollable") {
        return (
          <>
            <AsyncSelection
              type="async"
              data={(offset) =>
                FetchCategory({ ty: "parent", offset: offset ?? 5 }) as never
              }
              option={{
                label: "Parent Categories",
                size: "sm",
                selectedValue: filterValue?.categories?.parent.id
                  ? [filterValue.categories.parent.id.toString()]
                  : undefined,
                name: "parent",
                onChange: handleChange as never,
              }}
            />
            <AsyncSelection
              type={filterValue?.categories?.parent.id ? "async" : "normal"}
              forceRefetch={filterValue?.categories?.parent.id}
              data={(offset) =>
                FetchCategory({
                  ty: "child",
                  offset: offset ?? 5,
                  pid: filterValue?.categories?.parent.id,
                }) as never
              }
              option={{
                label: "Child Categories", // Fixed label that was incorrectly "Parent Categories"
                size: "sm",
                selectedValue: filterValue?.categories?.child?.id
                  ? [filterValue.categories.child.id.toString()] // Fixed to use child.id instead of parent.id
                  : undefined,
                name: "child",
                onChange: handleChange as never,
              }}
            />
          </>
        );
      }

      // Default case
      return (
        <>
          <AsyncSelection
            type="normal"
            data={() => BannerTypeSelect}
            option={{
              name: "bannertype",
              selectedValue: filterValue?.bannertype
                ? [filterValue.bannertype] // Fixed to use bannertype instead of bannersize
                : undefined,
              onChange: handleChange as never,
            }}
          />
          <AsyncSelection
            type="normal"
            data={() => BannerSize}
            option={{
              name: "bannersize",
              selectedValue: filterValue?.bannersize
                ? [filterValue.bannersize]
                : undefined,
              onChange: handleChange as never,
            }}
          />
        </>
      );
    },
    [filterValue, handleChange]
  );

  const handleSelect = useCallback(
    (val: string | number) => {
      manage?.setSelectKey?.(val);
    },
    [manage]
  );

  const handleLoadMore = useCallback(() => {
    setItemsPerPage((prev) => prev + 5);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-start gap-y-4">
      <div className="w-full bg-gray-50 p-4 rounded-lg">
        <Input
          name="search"
          size="sm"
          value={filterValue?.search ?? ""}
          placeholder="Search"
          onChange={handleChange}
          className="mb-3"
        />
        <div className="w-full flex flex-row flex-wrap gap-3">
          {renderFilterSelection(type)}
        </div>
      </div>

      <div className="w-full min-h-[200px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <CircularProgress />
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={handleSelect}
                isSelected={manage?.selectedKey?.includes(item.id) ?? false}
              />
            ))}
          </div>
        )}
      </div>

      {items.length >= itemsPerPage && (
        <Button
          onPress={handleLoadMore}
          size="sm"
          className="self-center font-medium bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded transition-colors"
        >
          Load More
        </Button>
      )}
    </div>
  );
};

export default ManageContainer;
