"use client";

import { Chip, Select, SelectedItems, SelectItem } from "@heroui/react";
import React, { ReactNode, useEffect, useMemo } from "react";

interface Multiselectprops {
  id?: number;
  data: { label: string; value: string }[];
  type: "COLOR" | "TEXT";
  value: string[];
  label: string;
  onSelect: (e: Set<string>) => void;
  isOptional?: boolean;
}

export default function Multiselect({
  id,
  data,
  value,
  label,
  onSelect,
  type,
  isOptional,
}: Multiselectprops) {
  const [values, setValues] = React.useState(new Set([""]));

  useEffect(() => {
    if (value) {
      setValues(new Set(value));
    }
  }, []);

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = new Set(e.target.value.split(","));
    setValues(val);
    onSelect(val);
  };

  const renderValue = (items: SelectedItems<object>): ReactNode => {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((data, idx) => (
          <Chip
            key={idx}
            startContent={
              <div
                className="w-3.75 h-3.75 rounded-full"
                style={{ backgroundColor: `${String(data.key) ?? "white"}` }}
              ></div>
            }
          >
            {data.textValue}
          </Chip>
        ))}
      </div>
    );
  };

  const items = useMemo(() => data, [data]);

  const textSelectItems = useMemo(
    () =>
      type === "TEXT"
        ? items.map((item) => (
            <SelectItem key={item.value} textValue={item.value}>
              {item.label}
            </SelectItem>
          ))
        : [],
    [items, type],
  );

  const colorSelectItems = useMemo(
    () =>
      type === "COLOR"
        ? items.map((item) => (
            <SelectItem key={item.value} textValue={item.label}>
              <Chip
                startContent={
                  <div
                    className="w-3.75 h-3.75 rounded-full"
                    style={{ backgroundColor: item.value }}
                  ></div>
                }
              >
                {item.label}
              </Chip>
            </SelectItem>
          ))
        : [],
    [items, type],
  );

  return (
    <div key={id} className="w-full h-full">
      <Select
        key={label}
        label={
          <div className="flex items-center gap-2">
            <span>{label}</span>
            {isOptional && (
              <Chip
                size="sm"
                variant="flat"
                color="default"
                className="bg-blue-50 text-blue-600 border border-blue-200 text-xs font-medium px-2 py-0"
              >
                Optional
              </Chip>
            )}
          </div>
        }
        labelPlacement="inside"
        isMultiline={true}
        selectionMode="multiple"
        selectedKeys={values}
        size="lg"
        className="w-full h-fit min-h-12.5"
        onChange={handleSelectionChange}
        renderValue={type === "COLOR" ? renderValue : undefined}
      >
        {type === "TEXT" ? textSelectItems : colorSelectItems}
      </Select>
    </div>
  );
}
