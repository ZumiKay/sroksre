import { SelectType } from "@/src/context/GlobalType.type";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Key } from "react";

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
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="solid"
          color="success"
          className="w-full h-full font-bold"
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
