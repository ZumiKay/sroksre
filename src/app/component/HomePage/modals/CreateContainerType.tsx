"use client";

import { memo, useCallback } from "react";
import React from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Containertype } from "../../../severactions/containeraction";
import { AddIcon } from "../../Asset";
import PrimaryButton from "../../Button";
import { Bannercard } from "./Bannercard";

export const CreateContainerType = memo(function CreateContainerType({
  data,
  setdata,
}: {
  data: Containertype;
  setdata: React.Dispatch<React.SetStateAction<Containertype>>;
}) {
  const { setopenmodal } = useGlobalContext();

  const handleDelete = useCallback(
    (id: number) => {
      setdata((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.item?.id !== id),
      }));
    },
    [setdata],
  );

  const handleAddBanner = useCallback(() => {
    setopenmodal((prev) => ({ ...prev, Addbanner: true }));
  }, [setopenmodal]);

  return (
    <div className="slideshow w-full h-fit flex flex-col gap-y-6">
      {/* Header Section with Add Button */}
      <div className="header-section w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-xl border border-blue-400/30 backdrop-blur-xs">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Banner Selection
          </h3>
          <p className="text-sm text-gray-300">
            {data.items.length === 0
              ? "Add banners to your container"
              : `${data.items.length} banner${
                  data.items.length !== 1 ? "s" : ""
                } selected`}
          </p>
        </div>
        <PrimaryButton
          onClick={handleAddBanner}
          width="220px"
          height="48px"
          type="button"
          text="Add Banner"
          Icon={<AddIcon />}
          color="#3B82F6"
          hoverColor="#2563EB"
          radius="12px"
        />
      </div>

      {/* Selected Banners Grid */}
      {data.items.length > 0 ? (
        <div className="selected-slides-container">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <div className="w-1 h-5 bg-linear-to-b from-blue-400 to-purple-600 rounded-full"></div>
              Selected Banners
            </h4>
            <div className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-full shadow-lg">
              {data.items.length}
            </div>
          </div>
          <div className="selected-slides w-full h-fit max-h-[58vh] overflow-y-auto grid grid-cols-2 max-large_phone:grid-cols-1 gap-6 place-items-center p-4 bg-linear-to-b from-gray-800/50 to-transparent rounded-xl">
            {data.items.map(
              (item, idx) =>
                item.item && (
                  <Bannercard
                    key={item.item.id}
                    id={item.item?.id ?? 0}
                    image={item.item?.image.url ?? ""}
                    isAdd={false}
                    idx={idx + 1}
                    onDelete={handleDelete}
                    style={{ width: "200px", height: "200px" }}
                    typesize={item.item.type}
                    preview
                  />
                ),
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state w-full py-16 flex flex-col items-center justify-center gap-4 bg-linear-to-br from-gray-800/50 to-gray-900/50 rounded-xl border-2 border-dashed border-gray-600 hover:border-blue-500/50 transition-all duration-300">
          <div className="w-20 h-20 bg-linear-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No banners selected
            </h3>
            <p className="text-sm text-gray-400 max-w-md">
              Click the &quot;Add Banner&quot; button above to start adding
              banners to your container
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
