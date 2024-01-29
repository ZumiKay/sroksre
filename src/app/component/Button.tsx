"use client";

import { CSSProperties, MouseEventHandler, ReactNode, useState } from "react";
import "../globals.css";
import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import { useGlobalContext } from "@/src/context/GlobalContext";

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
}
export default function PrimaryButton(props: buttonpros) {
  const [hover, sethover] = useState(false);

  return (
    <button
      type={props.type}
      className="primary__button relative rounded-sm border-0 font-bold p-1"
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
      }}
    >
      {props.status === "loading" ? (
        <h3 className="loading-text font-bold w-full h-fit"> Loading...</h3>
      ) : (
        <h3 className="flex flex-row items-center justify-center">
          {" "}
          {props.Icon && <span className="mr-2"> {props.Icon} </span>}{" "}
          {props.text}{" "}
        </h3>
      )}
    </button>
  );
}
interface selectprops {
  label?: string;
  style?: CSSProperties;
  option?: HTMLOptionElement;
  default?: string;
  defaultValue?: string;
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
  type?: "category" | "subcategory";
  parent_id?: number;
}

export function Selection(props: selectprops) {
  const { allData } = useGlobalContext();

  return (
    <div
      style={props.style}
      className="select__container w-full h-fit flex flex-row items-center justify-start"
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
        className={`select border border-1 border-black rounded-md ${
          props.label ? "w-1/2" : "w-full"
        } h-full p-2`}
        onChange={props.onChange}
        required={props.required}
        value={props.value}
        name={props.name}
      >
        {props.default && (
          <option value={props.defaultValue?.toLowerCase() ?? ""}>
            {props.default}
          </option>
        )}
        {props.type
          ? (props.type === "category"
              ? allData.category
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
export function InputFileUpload(props: Inputfileuploadprops) {
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
        multiple={props.multiple}
        accept=".jpg, .png"
        onChange={props.onChange}
        type="file"
      />
    </Button>
  );
}
