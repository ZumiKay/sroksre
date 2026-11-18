"use client";

import { CSSProperties, MouseEventHandler, ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import "../globals.css";
import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import { CateogoryState } from "@/src/context/GlobalContext";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import { Box, Chip, OutlinedInput, ThemeProvider } from "@mui/material";
import type { ChipProps } from "@mui/material";
import { Allstatus } from "@/src/types/order.type";
import { Mutiselectstatuscolor } from "../dashboard/order/Theme";
import { useRouter, useSearchParams } from "next/navigation";

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
}
export default function PrimaryButton(props: buttonpros) {
  const [hover, sethover] = useState(false);
  const [active, setactive] = useState(false);

  return (
    <button
      type={props.type}
      className="primary__button relative font-semibold transition-all duration-300 ease-in-out 
        shadow-xs hover:shadow-md active:shadow-inner
        transform hover:-translate-y-0.5 active:translate-y-0"
      onClick={
        props.disable || props.status === "loading" ? () => {} : props.onClick
      }
      onMouseEnter={() => sethover(true)}
      onMouseLeave={() => sethover(false)}
      onMouseDown={() => setactive(true)}
      onMouseUp={() => setactive(false)}
      style={{
        textAlign: props.textalign ?? "center",
        width: props.width ?? "150px",
        height: props.height ?? "40px",
        fontSize: props.textsize ?? "15px",
        opacity: props.disable ? 0.5 : 1,
        backgroundColor: active
          ? props.color
            ? `${props.color}dd`
            : "#00000088"
          : hover
            ? (props.hoverColor ??
              (props.color ? `${props.color}ee` : "#000000cc"))
            : (props.color ?? "#000000"),
        borderRadius: props.radius ?? "8px",
        border: props.border ?? "none",
        color: hover
          ? (props.hoverTextColor ?? "white")
          : (props.textcolor ?? "white"),
        position: props.postion,
        top: props.top,
        left: props.left,
        right: props.right,
        bottom: props.bottom,
        zIndex: props.zI,
        cursor: props.disable ? "not-allowed" : "pointer",
        padding: "0.5rem 1rem",
        outline: "none",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...props.style,
      }}
    >
      {props.status === "loading" ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span className="font-medium">Loading...</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-row items-center justify-center gap-2">
          {props.Icon && (
            <span className="flex items-center">{props.Icon}</span>
          )}
          <span className="whitespace-nowrap">{props.text}</span>
        </div>
      )}
    </button>
  );
}
// An option is a plain value, or a value with its own label.
type SelectionOption =
  | string
  | number
  | { label: string | number; value: string | number };

interface selectprops {
  label?: string;
  style?: CSSProperties;
  option?: HTMLOptionElement;
  default?: string;
  defaultValue?: string | number;
  data?: Array<SelectionOption>;
  subcategory?:
    | []
    | {
        id?: number | undefined;
        name: string;
      }[];
  state?: unknown;
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
        className={`select border border-black rounded-md ${
          props.label ? "w-1/2" : "w-full"
        } h-full p-2 bg-white`}
        onChange={props.onChange}
        required={props.required}
        value={props.value ?? ""}
        name={props.name}
      >
        {props.default ? (
          <option
            value={
              typeof props.defaultValue === "string"
                ? (props.defaultValue?.toLowerCase() ?? "")
                : (props.defaultValue ?? "")
            }
          >
            {props.default}
          </option>
        ) : (
          <option value="">-- None --</option>
        )}
        {props.type
          ? (props.type === "category" && props.category
              ? props.category
              : (props.subcategory ?? [])
            ).map((obj) => (
              <option key={obj.id ?? obj.name} value={obj.id ?? ""}>
                {obj.name}{" "}
              </option>
            ))
          : props.data?.map((data, index) => (
              <option
                key={index}
                value={typeof data === "object" ? data.value : data}
              >
                {typeof data === "object" ? data.label : data}
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
export const InputFileUpload = React.forwardRef<
  HTMLInputElement,
  Inputfileuploadprops
>((props, ref) => {
  return (
    <Button
      component="label"
      variant="contained"
      fullWidth
      sx={{ height: "50px", boxShadow: "0", borderRadius: "10px" }}
      startIcon={<FontAwesomeIcon icon={faCloudArrowUp} />}
    >
      Upload Image
      <VisuallyHiddenInput
        ref={ref}
        multiple={props.multiple}
        accept=".jpg, .png , .webp"
        onChange={props.onChange}
        type="file"
      />
    </Button>
  );
});
InputFileUpload.displayName = "InputFileUpload";

const ITEM_HEIGHT = 50;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const names = Object.entries(Allstatus).map(([, val]) => val);

export function MultipleSelect() {
  const [selectedData, setselectedData] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // On first show, drop any status filter left in the URL
  const clearStatusParam = React.useEffectEvent(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("status")) {
      params.delete("status");
      router.push(`?${params}`);
    }
  });
  React.useEffect(() => {
    clearStatusParam();
  }, []);

  const handleChange = (event: SelectChangeEvent<typeof selectedData>) => {
    const {
      target: { value },
    } = event;

    const params = new URLSearchParams(searchParams);

    const val = typeof value === "string" ? value.split(",") : value;
    params.set("status", val.join(","));

    if (val.length === 0) {
      params.delete("status");
    }
    router.push(`?${params}`);
    setselectedData(val);
  };

  return (
    <div className="w-full">
      <ThemeProvider theme={Mutiselectstatuscolor}>
        <FormControl sx={{ m: 1, width: "100%" }}>
          <InputLabel id="demo-multiple-chip-label" filled>
            Filter By: Status
          </InputLabel>
          <Select
            labelId="demo-multiple-chip-label"
            id="demo-multiple-chip"
            multiple
            value={selectedData}
            onChange={handleChange}
            input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value}
                    color={value.toLowerCase() as ChipProps["color"]}
                  />
                ))}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {names.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </ThemeProvider>
    </div>
  );
}
