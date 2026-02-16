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
import { Allstatus } from "@/src/types/order.type";
import { Mutiselectstatuscolor } from "../dashboard/order/Theme";
import { useRouter, useSearchParams } from "next/navigation";
import { VariantValueObjType } from "@/src/types/product.type";

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
        className={`select border border-black rounded-md ${
          props.label ? "w-1/2" : "w-full"
        } h-full p-2 bg-white`}
        onChange={props.onChange}
        required={props.required}
        value={props.value}
        name={props.name}
      >
        {props.default && (
          <option
            value={
              typeof props.defaultValue === "string"
                ? (props.defaultValue?.toLowerCase() ?? "")
                : props.defaultValue
            }
          >
            {props.default}
          </option>
        )}
        {props.type
          ? (props.type === "category" && props.category
              ? props.category
              : (props.subcategory ?? [])
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

interface Selectcontainerprops {
  data: Array<string | VariantValueObjType>;
  type: "TEXT" | "COLOR";
  onSelect: (value: string) => void;
  isSelected?: string;
}
const isSelectedStyle: CSSProperties = {
  outline: "2px solid black",
  outlineOffset: "2px",
  color: "black",
};

export const SelectContainer = (props: Selectcontainerprops) => {
  return (
    <div className="w-fit max-w-[80%]  min-h-12.5 h-fit p-2 flex flex-row flex-wrap items-center gap-x-3 rounded-lg outline-1 outline-solid outline-gray-400 outline-offset-2">
      {props.data.map((i, idx) => (
        <div key={idx} className="w-fit h-fit">
          {typeof i === "string" ? (
            <div
              key={idx}
              onClick={() => {
                props.onSelect(i);
              }}
              style={props.isSelected === i ? isSelectedStyle : {}}
              className={`select_item cursor-pointer w-fit h-fit p-2 max-w-50 wrap-break-word rounded-lg transition-all duration-30 hover:bg-black hover:text-white`}
            >
              {props.type === "TEXT" && (i as string)}
            </div>
          ) : (
            <div
              style={{
                ...(props.isSelected === i.val ? isSelectedStyle : {}),
              }}
              onClick={() => {
                props.onSelect(i.val);
              }}
              className="w-fit h-fit flex flex-row gap-x-3 p-2 items-center rounded-lg cursor-pointer justify-center hover:outline-2 hover:outline-solid  hover:outline-gray-500 hover:outline-offset-2 active:outline-1 active:outline-solid  active:outline-gray-300 active:outline-offset-2  "
            >
              <div
                className="rounded-full"
                style={{
                  backgroundColor: i.val,
                  width: "30px",
                  height: "30px",
                }}
              ></div>

              {i.name && (
                <div className="w-fit h-fit text-lg font-bold"> {i.name}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

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

const names = Object.entries(Allstatus).map(([_, val]) => val);

export function MultipleSelect() {
  const [selectedData, setselectedData] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("status")) {
      params.delete("status");
      router.push(`?${params}`);
    }
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
                    color={value.toLowerCase() as any}
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
