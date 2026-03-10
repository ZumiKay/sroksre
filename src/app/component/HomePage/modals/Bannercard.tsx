"use client";

import { CSSProperties, memo, useCallback } from "react";
import React from "react";
import Image from "next/image";
import PrimaryButton from "../../Button";

export const Bannercard = memo(function Bannercard({
  isAdd,
  image,
  id,
  idx,
  isAdded,
  onClick,
  onDelete,
  typesize,
  name,
  preview,
  style,
}: {
  id: number;
  idx: number;
  style?: CSSProperties;
  image: string;
  isAdd: boolean;
  isAdded?: boolean;
  onClick?: (id: number) => void;
  onDelete?: (id: number) => void;
  typesize?: "normal" | "small";
  name?: string;
  preview?: boolean;
}) {
  const handleClick = useCallback(() => {
    if (!preview && onClick) onClick(id);
  }, [preview, onClick, id]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) onDelete(id);
    },
    [onDelete, id],
  );

  const isClickable = !preview && onClick;

  return (
    <div
      key={id}
      style={style ?? {}}
      onClick={handleClick}
      className={`relative w-fit h-fit flex flex-col transition-all duration-300 rounded-2xl overflow-hidden group shadow-lg ${
        isClickable
          ? "cursor-pointer hover:-translate-y-3 hover:shadow-2xl hover:scale-105"
          : "shadow-md"
      } ${
        isAdded
          ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-gray-800"
          : "bg-white hover:ring-2 hover:ring-blue-300"
      }`}
    >
      <div className="relative overflow-hidden">
        <Image
          src={image}
          alt="cover"
          width={500}
          height={500}
          style={
            style
              ? style
              : typesize === "normal"
                ? { width: "400px", height: "250px" }
                : {}
          }
          className={`bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 transition-transform duration-500 ${
            isClickable ? "group-hover:scale-110" : ""
          } ${
            typesize === "small"
              ? "w-75 h-100 max-smallest_phone:w-68.75 max-smallest_phone:h-87.5 object-contain"
              : "h-62.5 object-cover object-center"
          }`}
        />
        {isClickable && (
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        {isClickable && !isAdded && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-xl flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Click to Add
            </div>
          </div>
        )}
      </div>

      {isAdded && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="w-9 h-9 text-white bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center font-bold text-sm shadow-2xl ring-4 ring-white animate-pulse">
            {idx}
          </span>
          <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Selected
          </div>
        </div>
      )}

      {name && (
        <div className="p-4 bg-white">
          <p className="text-sm font-semibold w-fit max-w-70 h-fit wrap-break-word text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
            {name}
          </p>
        </div>
      )}

      {!isAdd && (
        <PrimaryButton
          radius="0 0 12px 12px"
          type="button"
          text="Delete"
          width="100%"
          height="40px"
          onClick={handleDelete}
          textsize="14px"
          color="#EF4444"
          hoverColor="#DC2626"
        />
      )}
    </div>
  );
});
