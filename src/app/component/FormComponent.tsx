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
import { ChangeEvent, useState } from "react";
import { motion } from "framer-motion";
export const PasswordInput = ({
  name,
  label,
}: {
  name: string;
  label: string;
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

    setuserinfo((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <FormControl sx={{ m: 1, width: "100%" }} variant="outlined">
      <InputLabel htmlFor="outlined-adornment-password">{label}</InputLabel>
      <OutlinedInput
        id="outlined-adornment-password"
        type={showPassword ? "text" : "password"}
        name={name}
        onChange={handleChange}
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
      />
    </FormControl>
  );
};

export const SelectContainer = ({
  data,
  title,
}: {
  data: Array<string>;
  title: string;
}) => {
  const handleSelect = () => {
    //selected product
  };
  return (
    <div className="select_container w-full h-[40px] flex flex-row items-center justify-start gap-x-3">
      <h3 className="title text-lg font-medium w-fit h-fit">
        {" "}
        {`${title} :`}{" "}
      </h3>
      {data.map((str) => (
        <motion.div
          whileHover={{ outline: "3px solid lightgray" }}
          whileTap={{ outline: "3px solid lightgray" }}
          className="w-[40px] h-full rounded-3xl"
          style={{ backgroundColor: `${str}` }}
        >
          {" "}
        </motion.div>
      ))}
    </div>
  );
};
