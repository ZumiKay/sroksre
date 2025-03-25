"use client";

import { Input, InputProps } from "@heroui/react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  ChangeEvent,
  CSSProperties,
  HTMLInputTypeAttribute,
  useState,
} from "react";

export const PasswordInput = (props: InputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Input
      {...props}
      aria-label="passwordInput"
      type={isVisible ? "text" : "password"}
      endContent={
        <button
          aria-label="toggle password visibility"
          className="focus:outline-none"
          type="button"
          onClick={toggleVisibility}
        >
          {isVisible ? <Visibility /> : <VisibilityOff />}
        </button>
      }
    />
  );
};

interface textinputProps {
  name?: string;
  style?: CSSProperties;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  value?: string | number;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  hidden?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
}

export const TextInput = (props: textinputProps) => {
  return (
    <input
      {...props}
      className="textinput w-full h-[50px] border border-gray-300 p-3 rounded-lg font-bold text-lg text-black"
    />
  );
};
