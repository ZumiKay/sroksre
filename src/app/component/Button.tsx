/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CSSProperties, MouseEventHandler, ReactNode, useState } from "react";
import "../globals.css";
import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import {
  CateogoryState,
  SelectTypeVariant,
  VariantColorValueType,
  VariantOptionEnum,
} from "@/src/context/GlobalType.type";
import { Productorderdetailtype } from "@/src/context/OrderContext";

interface buttonpros {
  type: "submit" | "reset" | "button" | undefined;
  text: string;
  width?: string;
  color?: string;
  textcolor?: string;
  height?: string;
  radius?: string;
  border?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  status?: "authenticated" | "loading" | "unauthenticated";
  hoverTextColor?: string;
  hoverColor?: string;
  Icon?: ReactNode;
  textalign?: "left" | "center" | "right";
  textsize?: string;
  postion?: "static" | "relative" | "absolute" | "sticky" | "fixed";
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  zI?: string;
  disable?: boolean | null;
  style?: CSSProperties;
  className?: string;
}
export default function PrimaryButton(props: buttonpros) {
  const [hover, sethover] = useState(false);

  return (
    <button
      type={props.type ?? "button"}
      className={
        props.className ??
        "primary__button relative rounded-sm border-0 font-bold p-1"
      }
      onClick={
        props.disable || props.status === "loading" ? () => {} : props.onClick
      }
      onMouseEnter={() => sethover(true)}
      onMouseLeave={() => sethover(false)}
      style={{
        textAlign: props.textalign ?? "center",
        width: props.width ?? "150px",
        height: props.height ?? "40px",
        fontSize: props.textsize ?? "15px",
        opacity: props.disable ? (props.disable ? 0.3 : 1) : 1,
        backgroundColor: hover
          ? props.hoverColor ?? "white"
          : props.color
          ? props.color
          : "",
        borderRadius: props.radius ?? "0px",
        border: props.border ?? "0px",
        color: hover
          ? props.hoverTextColor ?? "black"
          : props.textcolor
          ? props.textcolor
          : "white",
        position: props.postion,
        top: props.top,
        left: props.left,
        right: props.right,
        bottom: props.bottom,
        zIndex: props.zI,
        cursor: props.disable
          ? props.disable
            ? "not-allowed"
            : "pointer"
          : "pointer",
        ...props.style,
      }}
    >
      {props.status === "loading" ? (
        <h3 className="loading-text font-bold w-full h-fit"> Loading...</h3>
      ) : (
        <div className="w-full h-full flex flex-row items-center justify-center gap-5 ">
          {" "}
          {props.Icon && props.Icon}
          <p>{props.text}</p>{" "}
        </div>
      )}
    </button>
  );
}
interface selectprops {
  label?: string;
  style?: CSSProperties;
  option?: HTMLOptionElement;
  default?: string;
  defaultValue?: string | number;
  data?: string[] | number[] | any[];
  subcategory?:
    | []
    | {
        id?: number | undefined;
        name: string;
      }[];
  state?: any;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
  name?: string;
  value?: number | string;
  type?: "category" | "subcategory" | "color";
  parent_id?: number;
  category?: Array<CateogoryState>;
  disable?: boolean;
}

export function Selection(props: selectprops) {
  return (
    <div
      style={props.style}
      className={`select__container w-full h-fit flex flex-row items-center justify-start ${
        props.disable ? "opacity-40" : ""
      }`}
    >
      {props.label && (
        <label className="select_label text-md font-semibold mr-2">
          {" "}
          {props.label}{" "}
          {props.required && (
            <strong className="font-normal text-lg text-red-500">*</strong>
          )}
        </label>
      )}

      <select
        disabled={props.disable ? props.disable : false}
        className={`select border-1 border-black rounded-md ${
          props.label ? "w-1/2" : "w-full"
        } h-full p-2 bg-white`}
        onChange={props.onChange}
        required={props.required}
        value={props.value}
        name={props.name}
        title={props.name}
      >
        {props.default && (
          <option
            value={
              typeof props.defaultValue === "string"
                ? props.defaultValue?.toLowerCase() ?? ""
                : props.defaultValue
            }
          >
            {props.default}
          </option>
        )}
        {props.type
          ? (props.type === "category" && props.category
              ? props.category
              : props.subcategory ?? []
            ).map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name}{" "}
              </option>
            ))
          : props.data?.map((data, index) => (
              <option key={index} value={data.value ? data.value : data}>
                {data.label ? data.label : data}
              </option>
            ))}
      </select>
    </div>
  );
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface Inputfileuploadprops {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  multiple: boolean;
}

export const UploadInput = React.forwardRef(
  (props: Inputfileuploadprops, ref) => {
    return (
      <Button
        component="label"
        variant="contained"
        fullWidth
        sx={{ height: "50px", boxShadow: "0", borderRadius: "10px" }}
        startIcon={<i className="fa-solid fa-cloud-arrow-up"></i>}
      >
        Upload Image
        <VisuallyHiddenInput
          ref={ref as never}
          multiple={props.multiple}
          accept=".jpg, .png , .webp"
          onChange={props.onChange}
          type="file"
        />
      </Button>
    );
  }
);
UploadInput.displayName = "UploadInput";
interface Selectcontainerprops {
  data: SelectTypeVariant;
  type: "TEXT" | "COLOR";
  onSelect: (id: number, idx: number) => void;
  isSelected?: Productorderdetailtype[];
}

const isSelectedStyle: CSSProperties = {
  outline: "3px solid #3b82f6",
  outlineOffset: "2px",
  backgroundColor: "#eff6ff",
  transform: "scale(1.02)",
  transition: "all 0.2s ease-in-out",
};

const colorItemBaseClass =
  "w-fit h-fit flex flex-row gap-x-3 p-3 items-center rounded-xl cursor-pointer justify-center transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105 hover:bg-gray-50 active:scale-95 border border-gray-200";

const textItemBaseClass =
  "select_item cursor-pointer w-fit h-fit px-4 py-2 max-w-[200px] break-words rounded-xl transition-all duration-200 ease-in-out hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-900 hover:text-white hover:shadow-lg hover:scale-105 active:scale-95 border border-gray-200 bg-white text-gray-700 font-medium";

const colorCircleStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  border: "2px solid rgba(255, 255, 255, 0.8)",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

export const SelectContainer = React.memo((props: Selectcontainerprops) => {
  // Create a map of selected items for O(1) lookups
  const variant = React.useMemo(() => props.data, [props.data]);
  const selectedMap = React.useMemo(() => {
    if (!props.isSelected || props.isSelected.length === 0) return new Map();

    return new Map(
      props.isSelected.map((item) => [
        `${item.variantId}-${item.variantIdx}`,
        true,
      ])
    );
  }, [props.isSelected]);

  const handleItemClick = React.useCallback(
    (value: number, idx: number) => () => props.onSelect(value, idx),
    [props]
  );

  const renderData = React.useMemo(() => {
    const elements: React.JSX.Element[] = [];

    props.data.label.forEach((item, itemIndex) => {
      const isTextType = variant.type === VariantOptionEnum.text;

      const key = `${variant.value}-${itemIndex}`;
      const isSelected = selectedMap.has(key);
      const uniqueKey = `${itemIndex}-${key}`;

      if (isTextType) {
        // Text variant
        elements.push(
          <div key={uniqueKey} className="w-fit h-fit">
            <div
              onClick={handleItemClick(variant.value, itemIndex)}
              style={isSelected ? isSelectedStyle : undefined}
              className={textItemBaseClass}
            >
              {item as string}
            </div>
          </div>
        );
      } else {
        // Color variant
        const colorItem = item as VariantColorValueType;
        elements.push(
          <div key={uniqueKey} className="w-fit h-fit">
            <div
              style={isSelected ? isSelectedStyle : undefined}
              onClick={handleItemClick(variant.value, itemIndex)}
              className={colorItemBaseClass}
            >
              <div
                className="rounded-full"
                style={{
                  backgroundColor: colorItem.val,
                  ...colorCircleStyle,
                }}
              />
              {colorItem.name && (
                <div className="w-fit h-fit text-sm font-semibold text-gray-700">
                  {colorItem.name}
                </div>
              )}
            </div>
          </div>
        );
      }
    });

    return elements;
  }, [
    props.data.label,
    variant.type,
    variant.value,
    selectedMap,
    handleItemClick,
  ]);

  return (
    <div className="w-fit max-w-[80%] min-h-[60px] h-fit p-4 flex flex-row flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
      {renderData}
    </div>
  );
});

SelectContainer.displayName = "SelectContainer";
