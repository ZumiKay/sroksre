"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, SelectItem } from "@nextui-org/react";

interface SelectionServerSideProps {
  currentValue: number;
  options: number[];
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
  currentPage: number;
}

/**
 * Client component for items-per-page selection
 * Separated from PaginationServer to keep parent as server component
 */
export function SelectionServerSide({
  currentValue,
  options,
  baseUrl,
  searchParams,
  currentPage,
}: SelectionServerSideProps) {
  const router = useRouter();
  const [value, setValue] = useState(currentValue.toString());

  const handleChange = (newValue: string) => {
    setValue(newValue);

    const params = new URLSearchParams();

    // Preserve existing params except p and show
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== "p" && key !== "show") {
        params.set(key, val);
      }
    });

    // Reset to page 1 when changing items per page
    params.set("p", "1");
    params.set("show", newValue);

    router.push(`${baseUrl}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-[280px]">
      <Select
        label="Show Per Page"
        placeholder="Select items per page"
        className="w-full"
        size="md"
        selectedKeys={[value]}
        onChange={(e) => handleChange(e.target.value)}
      >
        {options.map((num) => (
          <SelectItem key={num.toString()} value={num.toString()}>
            {num === 1 ? "1 item" : `${num} items`}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
