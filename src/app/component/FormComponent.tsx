"use client";

import { useGlobalContext } from "@/src/context/GlobalContext";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import {
  ChangeEvent,
  CSSProperties,
  HTMLInputTypeAttribute,
  useState,
} from "react";

export const PasswordInput = ({
  name,
  label,
  type,
  onChange,
  require,
  width,
  variant,
}: {
  name: string;
  label: string;
  type: "userinfo" | "auth";
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  require?: boolean;
  width?: string;
  variant?: "outlined" | "standard" | "filled";
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { setuserinfo } = useGlobalContext();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    type === "userinfo" && setuserinfo((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <FormControl
      sx={{ m: 1, width: width ?? "100%", height: "50px" }}
      variant={variant ?? "outlined"}
    >
      <InputLabel htmlFor="outlined-adornment-password">{label}</InputLabel>
      <OutlinedInput
        id="outlined-adornment-password"
        type={showPassword ? "text" : "password"}
        name={name}
        sx={{ backgroundColor: "white" }}
        onChange={type === "auth" ? onChange : handleChange}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="password"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        label={label}
        required={require}
      />
    </FormControl>
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
