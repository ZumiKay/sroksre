"use client";

import React, { CSSProperties } from "react";
import {
  Pagination,
  PaginationItemRenderProps,
  PaginationItemType,
  cn,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";
import { SelectType } from "@/src/context/GlobalContext";
import { IsNumber } from "@/src/lib/utilities";

interface PaginationCustomProps {
  page?: number;
  setpage?: React.Dispatch<React.SetStateAction<number>>;
  show: string;
  setshow: React.Dispatch<React.SetStateAction<string>>;
  count: number;
  onSelectShowPerPage?: (value: number | string) => void;
  onPageChange?: () => void;
}

const numberperpage = [1, 5, 10, 20, 30, 40, 50];
const renderItem = ({
  ref,
  key,
  value,
  isActive,
  setPage,
  className,
}: PaginationItemRenderProps) => {
  if (value === PaginationItemType.DOTS) {
    return (
      <button key={key} className={className}>
        ...
      </button>
    );
  }

  // cursor is the default item
  return (
    <button
      key={key}
      ref={ref}
      className={cn(className, isActive && "text-white bg-slate-600 font-bold")}
      onClick={() => setPage(value as any)}
    >
      {value}
    </button>
  );
};
export default function PaginationCustom({
  page,
  setpage,
  count,
  show,
  setshow,
  onSelectShowPerPage,
  onPageChange,
}: PaginationCustomProps) {
  const router = useRouter();
  const searchParam = useSearchParams();

  const handlePage = (p: number) => {
    const params = new URLSearchParams(searchParam);
    params.set("p", `${p}`);
    setpage && setpage(p);
    router.push(`?${params}`);
    onPageChange && onPageChange();
  };

  return (
    <div className="w-full h-fit flex flex-col gap-5 items-center text-white">
      <Pagination
        total={count}
        page={page}
        disableCursorAnimation
        initialPage={1}
        renderItem={renderItem}
        onChange={(p) => handlePage(p)}
        variant="light"
      />
      {count && (
        <div className="w-[280px]">
          <SelectionCustom
            data={numberperpage.map((i) => ({
              label: `${i === 1 ? "1 item" : `${i} item`}`,
              value: i.toString(),
            }))}
            label="Show Per Page"
            placeholder=""
            value={show}
            setvalue={setshow}
            onChange={(val) => onSelectShowPerPage && onSelectShowPerPage(val)}
          />
        </div>
      )}
    </div>
  );
}

interface SelectionCustomProps {
  data: Array<SelectType>;
  label: string;
  placeholder: string;
  setvalue?: React.Dispatch<React.SetStateAction<string>>;
  value?: number | string;
  onChange?: (value: number | string) => void;
  style?: CSSProperties;
  textplacement?: "outside" | "outside-left" | "inside";
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

export const SelectionCustom = ({
  data,
  label,
  placeholder,
  style,
  value,
  setvalue,
  onChange,
  textplacement,
  isLoading,
  size,
}: SelectionCustomProps) => {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      className="w-full"
      value={value}
      size={size ?? "md"}
      labelPlacement={textplacement}
      selectedKeys={value ? [value] : undefined}
      style={style}
      isLoading={!!isLoading}
      onChange={(e) => {
        const { value } = e.target;
        setvalue && setvalue(value);
        onChange && onChange(IsNumber(value) ? parseInt(value) : value);
      }}
    >
      {data.map((animal) => (
        <SelectItem key={animal.value.toString()}>{animal.label}</SelectItem>
      ))}
    </Select>
  );
};
