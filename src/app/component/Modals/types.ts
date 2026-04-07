import { VariantValueObjType } from "@/src/types/product.type";
import { RGBColor } from "react-color";

export interface VariantDataType {
  id?: number;
  type: "COLOR" | "TEXT";
  name: string;
  value: Array<string | VariantValueObjType>;
}

export interface Colortype {
  hex: string;
  rgb: RGBColor;
}

export const Colorinitalize: Colortype = {
  hex: "#f5f5f5",
  rgb: {
    r: 245,
    g: 245,
    b: 245,
    a: 1,
  },
};

export type Variantcontainertype =
  | "variant"
  | "stock"
  | "type"
  | "info"
  | "stockinfo"
  | "section"
  | "section-edit"
  | "section-list"
  | "none";

export interface ModalOpenState {
  addcolor: boolean;
  addoption: boolean;
  addtemplate: boolean;
}
