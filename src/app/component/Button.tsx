"use client";

import { CSSProperties, MouseEventHandler, ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import "../globals.css";
import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

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
