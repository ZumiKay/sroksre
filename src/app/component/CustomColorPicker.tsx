"use client";
import { useState } from "react";
import type { ColorPickerProps, ColorSwatchProps } from "react-aria-components";
import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  Dialog,
  DialogTrigger,
  Input,
  Label,
  parseColor,
  Popover,
  SliderOutput,
  SliderTrack,
} from "react-aria-components";

interface MyColorPickerProps extends ColorPickerProps {
  label?: string;
  children?: React.ReactNode;
}

function MyColorSwatch(props: ColorSwatchProps) {
  return (
    <ColorSwatch
      {...props}
      style={({ color }) => ({
        background: `linear-gradient(${color}, ${color}),
            repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
      })}
    />
  );
}

export default function MyColorPicker() {
  const [value, setValue] = useState(parseColor("#7f007f"));

  return (
    <ColorPicker>
      <ColorArea value={value} onChange={setValue}>
        <ColorThumb />
      </ColorArea>

      <ColorField
        defaultValue="#7f007f"
        value={value}
        onChange={(val) => setValue(val ?? parseColor("#7f007"))}
      >
        <Label>Hex Code</Label>
        <Input width={"100%"} height={"40px"} style={{ fontSize: "17px" }} />
      </ColorField>
    </ColorPicker>
  );
}
