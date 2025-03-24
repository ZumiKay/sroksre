import { SelectType } from "@/src/context/GlobalType.type";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";
import { Key, useEffect, useState } from "react";

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
