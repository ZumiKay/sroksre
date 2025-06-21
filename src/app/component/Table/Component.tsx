import { useGlobalContext } from "@/src/context/GlobalContext";
import { FilterValueType, SelectType } from "@/src/context/GlobalType.type";
import {
  Button,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";
import { Key, useCallback } from "react";
import { formatDate } from "../EmailTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faCircle,
  faFolder,
  faSearch,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { Allstatus } from "@/src/context/OrderContext";

// Define constant outside of the component to prevent recreation on each render
const DefaultActionContainer: Array<SelectType> = [
  {
    label: "Edit",
    value: "edit",
  },
  {
    label: "Delete",
    value: "delete",
  },
];

// Use memoization for better performance
export const ActionContainer = ({
  customItems,
  onAction,
}: {
  customItems?: Array<SelectType>;
  onAction: (key: Key) => void;
}) => {
  // Memoize the items array to prevent recreation on each render
  const combinedItems = useCallback(() => {
    return [...DefaultActionContainer, ...(customItems ?? [])];
  }, [customItems]);

  // Memoize the item renderer function to prevent recreation on each render
  const renderItem = useCallback(
    (item: SelectType) => (
      <DropdownItem
        key={item.value}
        color={item.value === "delete" ? "danger" : "default"}
      >
        {item.label}
      </DropdownItem>
    ),
    []
  );

  return (
    <Dropdown className="w-[150px] h-full">
      <DropdownTrigger>
        <Button
          variant="solid"
          size="lg"
          className="w-[100px] p-2 text-sm text-white bg-green-400 h-full font-bold"
        >
          Actions
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Dynamic Actions"
        items={combinedItems()}
        onAction={onAction}
      >
        {renderItem}
      </DropdownMenu>
    </Dropdown>
  );
};

export type tableBottomContentProps = {
  itemscount: number;
  show: string;
  page: number;
  setpage: (page: number) => void;
  onShowPage: (val: string) => void;
};

// Memoize array outside component to prevent recreation on each render
const Showperpageitems = ["1", "5", "10", "20", "50"];

export const TableBottomContent = ({
  show = "5",
  page,
  setpage,
  itemscount,
  onShowPage,
}: tableBottomContentProps) => {
  // Memoize the change handler to prevent recreation on each render
  const handleShowChange = useCallback(
    (val: { target: { value: string } }) => {
      onShowPage(val.target.value);
    },
    [onShowPage]
  );

  return (
    <div className="bottomcontent_container w-full h-full flex flex-row items-center justify-between">
      <div className="showperrow w-[200px] h-full flex flex-row justify-start items-center">
        <Select
          label="Rows per page"
          labelPlacement="outside-left"
          variant="bordered"
          size="sm"
          aria-label="custom selection"
          selectedKeys={[show]}
          onChange={handleShowChange}
        >
          {Showperpageitems.map((item) => (
            <SelectItem key={item}>{item}</SelectItem>
          ))}
        </Select>
      </div>
      {itemscount > 0 && (
        <Pagination
          className="w-fit"
          total={itemscount}
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          onChange={setpage}
        />
      )}
    </div>
  );
};

const FilteredValueContainer = () => {
  const { filtervalue, setfiltervalue, setreloaddata } = useGlobalContext();
  const searchParams = useSearchParams();
  const Router = useRouter();

  // Memoize the display keys to prevent recreation on each render
  const displayKeys = [
    "status",
    "search",
    "expiredate",
    "promotiononly",
    "categories",
  ];

  const handleModifyFilter = useCallback(
    (key: keyof FilterValueType) => {
      const params = new URLSearchParams(searchParams);

      // Create a shallow copy only of the fields we might modify
      const toUpdateFilterValue = { ...filtervalue };

      // Remove parameter from URL if present
      if (params.has(key)) params.delete(key);

      // Handle categories specifically
      if (key === "categories" && window.localStorage.getItem(key)) {
        window.localStorage.removeItem(key);
        params.delete("parentcate");
        params.delete("childcate");
        toUpdateFilterValue.categories = undefined;
      }

      // Handle search/name specifically
      if (key === "name") {
        toUpdateFilterValue.search = "";
      }

      setfiltervalue(toUpdateFilterValue);
      Router.push(`?${params}`);
    },
    [Router, filtervalue, searchParams, setfiltervalue]
  );

  // Precompute the filtered entries to avoid doing this during render
  const filteredEntries = filtervalue
    ? Object.entries(filtervalue).filter(
        ([key, value]) =>
          displayKeys.includes(key) &&
          value !== undefined &&
          !(typeof value === "string" && value.length === 0) &&
          !(key === "search" && (!value || value === "")) &&
          !(key === "promotiononly" && !value)
      )
    : [];

  const handleClear = useCallback(() => {
    const params = new URLSearchParams();
    params.set("p", "1");
    setfiltervalue((prev) => ({
      ...prev,
      ...(filtervalue?.status ? [Allstatus.all] : undefined),
    }));
    Router.push(`?${params}`);
    setreloaddata(true);
  }, [Router, filtervalue?.status, setfiltervalue, setreloaddata]);

  if (filteredEntries.length === 0) return null;

  return (
    <div className="w-full h-full px-2 py-3 mb-3 overflow-x-auto">
      <div className="flex flex-row flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-600 mr-1">
          Active Filters:
        </span>
        {filteredEntries.map(([key, val]) => {
          if (key === "status") return;
          const isPromotion = key === "promotiononly";
          const isCategory = key === "categories";
          const isDate = key === "expiredate";

          // Determine chip color and variant based on filter type
          const chipColor = isPromotion
            ? "success"
            : isCategory
            ? "warning"
            : isDate
            ? "secondary"
            : "primary";

          // Format display value
          const displayValue =
            isCategory && val
              ? `${val?.parentcate?.label}${
                  val?.childcate ? ` / ${val.childcate?.label}` : ""
                }`
              : isPromotion
              ? "Promotion Only"
              : isDate
              ? formatDate(new Date(val))
              : val;

          return (
            <Chip
              key={key}
              onClose={() => handleModifyFilter(key as keyof FilterValueType)}
              className="px-3 py-1 text-sm font-medium shadow-sm transition-all hover:shadow"
              variant="bordered"
              color={chipColor}
              startContent={
                isCategory ? (
                  <FontAwesomeIcon icon={faFolder} />
                ) : isDate ? (
                  <FontAwesomeIcon icon={faCalendar} />
                ) : isPromotion ? (
                  <FontAwesomeIcon icon={faTag} />
                ) : key === "status" ? (
                  <FontAwesomeIcon icon={faCircle} />
                ) : key === "search" ? (
                  <FontAwesomeIcon icon={faSearch} />
                ) : null
              }
              radius="sm"
              classNames={{
                base: "border border-default",
                content: "font-medium",
                closeButton: "text-default-500 hover:text-default-700",
              }}
            >
              {displayValue}
            </Chip>
          );
        })}
        {filteredEntries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              handleClear();
            }}
            className="text-xs ml-2 text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};
// Optimized with React.memo to prevent unnecessary re-renders
export const TopTableContent = () => {
  const { tableselectitems } = useGlobalContext();

  // Pre-compute the selected items count to prevent calculation during render
  const selectedCount = tableselectitems ? tableselectitems.length : 0;

  return (
    <div className="toptablecontent w-full h-full flex flex-row gap-x-3 items-center ">
      <p className="w-[100px]">{`Selected: ${selectedCount}`}</p>
      <Divider orientation="vertical" />
      <FilteredValueContainer />
    </div>
  );
};
