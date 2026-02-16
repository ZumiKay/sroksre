"use client";

import { Chip, Select, SelectedItems, SelectItem } from "@heroui/react";
import React, { ReactNode, useEffect } from "react";

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
                className="w-[15px] h-[15px] rounded-full"
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
        className="w-full h-fit min-h-[50px]"
        onChange={handleSelectionChange}
        renderValue={type === "COLOR" ? renderValue : undefined}
      >
        {type === "TEXT"
          ? data.map((data) => (
              <SelectItem key={data.value}>{data.label}</SelectItem>
            ))
          : data.map((data) => (
              <SelectItem key={data.value} textValue={data.label}>
                <Chip
                  startContent={
                    <div
                      className="w-[15px] h-[15px] rounded-full"
                      style={{ backgroundColor: data.value }}
                    ></div>
                  }
                >
                  {data.label}
                </Chip>
              </SelectItem>
            ))}
      </Select>
    </div>
  );
}
