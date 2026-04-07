"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

interface SelectionServerSideProps {
  currentValue: number;
  options: number[];
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
  currentPage: number;
}

const SELECT_CLASS =
  "w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm bg-white text-gray-700 appearance-none cursor-pointer";

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

  const items = useMemo(
    () =>
      options.map((num) => ({
        key: num.toString(),
        label: num === 1 ? "1 item" : `${num} items`,
      })),
    [options],
  );

  return (
    <div className="w-[280px]">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Show Per Page
      </label>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={SELECT_CLASS}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.5em 1.5em",
          paddingRight: "2.5rem",
        }}
      >
        {items.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
