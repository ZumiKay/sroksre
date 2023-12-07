"use client";

import { MouseEventHandler, useState } from "react";
import "../globals.css";
import LoadingIcon from "./Loading";
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
}
export default function PrimaryButton(props: buttonpros) {
  const [hover, sethover] = useState(false);

  return (
    <button
      type={props.type}
      className="primary__button rounded-sm border-0 font-bold p-1"
      onClick={props.onClick}
      onMouseEnter={() => sethover(true)}
      onMouseLeave={() => sethover(false)}
      style={{
        width: props.width ?? "150px",
        height: props.height ?? "40px",
        backgroundColor: hover ? "white" : props.color ? props.color : "",
        borderRadius: props.radius ?? "0px",
        border: props.border ?? "0px",
        color: hover ? "black" : props.textcolor ? props.textcolor : "white",
      }}
    >
      {props.status === "loading" ? <LoadingIcon /> : props.text}
    </button>
  );
}
interface selectprops {
  label?: string;
}
export function Selection(props: selectprops) {
  return (
    <div className="select__container w-[70%] h-fit flex flex-row items-center justify-between">
      <label className="select_label text-md font-semibold">
        {" "}
        {props.label}{" "}
      </label>
      <select className="select border border-1 border-black rounded-md w-1/2 h-full p-2">
        <option> S </option>
        <option> M </option>
        <option> L </option>
      </select>
    </div>
  );
}
