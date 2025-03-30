import { useGlobalContext } from "@/src/context/GlobalContext";
import { SelectType } from "@/src/context/GlobalType.type";
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
import { Key } from "react";
import { filtervaluetype } from "../../product/action";
import { formatDate } from "../EmailTemplate";

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
export const ActionContainer = ({
  customItems,
  onAction,
}: {
  customItems?: Array<SelectType>;
  onAction: (key: Key) => void;
}) => {
  return (
    <Dropdown className="w-[150px] h-full">
      <DropdownTrigger>
        <Button
          variant="solid"
          size="lg"
          className="w-[100px] p-2 text-sm text-black bg-green-400 h-full font-bold"
        >
          Actions
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Dynamic Actions"
        items={[...DefaultActionContainer, ...(customItems ?? [])]}
        onAction={onAction}
      >
        {(item) => (
          <DropdownItem
            key={item.value}
            color={item.value === "delete" ? "danger" : "default"}
          >
            {item.label}
          </DropdownItem>
        )}
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

const Showperpageitems = ["1", "5", "10", "20", "50"];
export const TableBottomContent = ({
  show = "5",
  page,
  setpage,
  itemscount,
  onShowPage,
}: tableBottomContentProps) => {
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
          onChange={(val) => {
            onShowPage(val.target.value);
          }}
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
  const { filtervalue, setfiltervalue } = useGlobalContext();

  if (!filtervalue) return null;

  const handleModifyFilter = (key: keyof filtervaluetype) => {
    setfiltervalue((prev) => ({ ...prev, [key]: undefined }));
  };

  const displayKeys = ["status", "search", "expiredate", "promotiononly"];

  return (
    <div className="filteredvalue w-fit h-full flex flex-row gap-x-3 items-center">
      {Object.entries(filtervalue)
        .filter(
          ([key, value]) => displayKeys.includes(key) && value !== undefined
        )
        .map(([key, val]) => {
          if (key === "promotiononly" && !val) {
            return null;
          }

          return (
            <Chip
              key={key}
              onClose={() => handleModifyFilter(key as keyof filtervaluetype)}
              className={key !== "promotiononly" ? "w-fit h-full" : ""}
              variant={key !== "promotiononly" ? "bordered" : "solid"}
              color={key === "promotiononly" ? "success" : "primary"}
            >
              {key === "promotiononly"
                ? "Promotion Only"
                : key === "expiredate"
                ? formatDate(new Date(val))
                : val}
            </Chip>
          );
        })}
    </div>
  );
};
export const TopTableContent = () => {
  const { tableselectitems } = useGlobalContext();
  return (
    <div className="toptablecontent w-full h-[40px] flex flex-row gap-x-3 items-center">
      <p className="w-fit">{`Selected Item: ${
        tableselectitems ? tableselectitems.length : 0
      }`}</p>
      <Divider orientation="vertical" />
    </div>
  );
};
