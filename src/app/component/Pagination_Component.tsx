"use client";

import React from "react";
import {
  Pagination,
  PaginationItemRenderProps,
  PaginationItemType,
  cn,
} from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { SelectField } from "./SelectField";

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
      onClick={() => setPage(value as number)}
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
    setpage?.(p);
    router.push(`?${params}`);
    onPageChange?.();
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
        <div className="w-70">
          <SelectField
            label="Show Per Page"
            placeholder="Items per page"
            size="md"
            options={numberperpage.map((i) => ({
              label: i === 1 ? "1 item" : `${i} items`,
              value: i.toString(),
            }))}
            value={show}
            onChange={(val) => {
              setshow(val);
              onSelectShowPerPage?.(parseInt(val));
            }}
          />
        </div>
      )}
    </div>
  );
}
