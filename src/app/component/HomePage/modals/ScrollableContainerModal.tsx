"use client";

import { ChangeEvent, memo, useCallback, useMemo } from "react";
import React from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Containertype } from "../../../severactions/containeraction";
import { AddIcon } from "../../Asset";
import PrimaryButton, { Selection } from "../../Button";
import { TextInput } from "../../FormComponent";
import { DateRangePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Bannercard } from "./Bannercard";

const ScrollableTemplate = [
  { label: "Custom", value: "custom" },
  { label: "Popular Products", value: "popular" },
  { label: "Latest Products", value: "new" },
];

export const ScrollableContainerModal = memo(function ScrollableContainerModal({
  data,
  setdata,
}: {
  data: Containertype;
  setdata: React.Dispatch<React.SetStateAction<Containertype>>;
}) {
  const { setopenmodal } = useGlobalContext();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setdata((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [setdata],
  );

  const handleDelete = useCallback(
    (id: number) => {
      setdata((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.item?.id !== id),
      }));
    },
    [setdata],
  );

  const handleTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setdata((prev) => ({
        ...prev,
        amountofitem: undefined,
        daterange: undefined,
        item: [],
        scrollabletype: e.target.value as any,
      }));
    },
    [setdata],
  );

  const handleDateChange = useCallback(
    (date: any) => {
      setdata((prev) => ({
        ...prev,
        daterange: {
          start: date.start.toString(),
          end: date.end.toString(),
        },
      }));
    },
    [setdata],
  );

  const handleAddProduct = useCallback(() => {
    setopenmodal((prev) => ({ ...prev, Addproduct: true }));
  }, [setopenmodal]);

  const templateDescription = useMemo(() => {
    switch (data.scrollabletype) {
      case "popular":
        return "Display products based on purchase frequency within a date range";
      case "new":
        return "Automatically show the latest products added to your store";
      case "custom":
        return "Manually select specific products to display";
      default:
        return "";
    }
  }, [data.scrollabletype]);

  return (
    <div className="w-full h-full flex flex-col gap-y-6">
      {/* Configuration Section */}
      <div className="config-section p-5 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/30">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <h3 className="text-lg font-bold text-white">
            Container Configuration
          </h3>
        </div>

        <div className="w-full h-fit flex flex-row items-start max-small_phone:flex-col gap-5">
          <div className="w-full h-fit flex flex-col gap-y-3">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Template Type
            </label>
            <Selection
              onChange={handleTypeChange}
              style={{ color: "black" }}
              value={data.scrollabletype}
              data={ScrollableTemplate}
            />
            {templateDescription && (
              <p className="text-xs text-gray-300 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                <span className="text-purple-400 font-semibold">ℹ️</span>{" "}
                {templateDescription}
              </p>
            )}
          </div>
          {data.scrollabletype !== "custom" && (
            <div className="w-full h-fit flex flex-col gap-y-3">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                Item Count
              </label>
              <TextInput
                value={data.amountofitem}
                type="number"
                name="amountofitem"
                placeholder="e.g., 10"
                style={{ height: "48px", color: "black" }}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        {data.scrollabletype === "popular" && (
          <div className="w-full h-fit flex flex-col gap-y-3 mt-5 p-4 bg-linear-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/30">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Popularity Date Range
            </label>
            <DateRangePicker
              radius="sm"
              aria-label="Date Range Picker"
              value={
                data.daterange
                  ? ({
                      start: parseDate(data.daterange.start ?? ""),
                      end: parseDate(data.daterange.end),
                    } as any)
                  : undefined
              }
              onChange={handleDateChange}
              className="max-w-xs"
            />
            <p className="text-xs text-gray-400 mt-1">
              Products will be ranked by sales within this date range
            </p>
          </div>
        )}
      </div>

      {/* Add Product Button for Custom Type */}
      {data.scrollabletype !== "new" && data.scrollabletype !== "popular" && (
        <div className="add-product-section p-5 bg-linear-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-xl border border-green-400/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Product Selection
              </h4>
              <p className="text-sm text-gray-300">
                {data.items.length === 0
                  ? "Add products to your scrollable container"
                  : `${data.items.length} product${
                      data.items.length !== 1 ? "s" : ""
                    } added`}
              </p>
            </div>
            <PrimaryButton
              onClick={handleAddProduct}
              width="220px"
              height="48px"
              type="button"
              text="Add Product"
              Icon={<AddIcon />}
              color="#10B981"
              hoverColor="#059669"
              radius="12px"
            />
          </div>
        </div>
      )}

      {/* Selected Products Display */}
      {data.items && data.items.length !== 0 ? (
        <div className="selected-products-container">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <div className="w-1 h-5 bg-linear-to-b from-green-400 to-emerald-600 rounded-full"></div>
              Selected Products
            </h4>
            <div className="px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg">
              {data.items.length}
            </div>
          </div>
          <div className="selectedproduct w-full overflow-y-auto overflow-x-auto max-h-[60vh] flex flex-row justify-start items-start gap-x-6 gap-y-6 p-4 bg-linear-to-b from-gray-800/50 to-transparent rounded-xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {data.items.map(
              (item, idx) =>
                item.item && (
                  <Bannercard
                    key={item.item.id}
                    id={item.item.id ?? 0}
                    image={item.item.image?.url ?? ""}
                    onClick={handleDelete}
                    isAdd={false}
                    idx={idx + 1}
                    onDelete={handleDelete}
                    typesize="small"
                    style={{ width: "200px", height: "200px" }}
                    name={item.item.name}
                    preview
                  />
                ),
            )}
          </div>
        </div>
      ) : data.scrollabletype === "custom" ? (
        <div className="empty-state w-full py-16 flex flex-col items-center justify-center gap-4 bg-linear-to-br from-gray-800/50 to-gray-900/50 rounded-xl border-2 border-dashed border-gray-600 hover:border-green-500/50 transition-all duration-300">
          <div className="w-20 h-20 bg-linear-to-br from-green-500/20 to-emerald-600/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No products selected
            </h3>
            <p className="text-sm text-gray-400 max-w-md">
              Click the &quot;Add Product&quot; button above to start adding
              products to your container
            </p>
          </div>
        </div>
      ) : (
        <div className="auto-populate-info w-full p-6 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-400/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white mb-2">
                Automatic Product Selection
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                Products will be automatically populated based on your selected
                template type.
                {data.scrollabletype === "new" &&
                  " The latest products will be displayed in chronological order."}
                {data.scrollabletype === "popular" &&
                  " Products will be ranked by sales within the specified date range."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
