import {
  Productinitailizestate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { errorToast, successToast } from "../Loading";
import Modal from "../Modals";
import { ApiRequest } from "@/src/context/CustomHook";
import { motion } from "framer-motion";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Theme,
  useTheme,
} from "@mui/material";

import { Chip as NextChip } from "@heroui/react";
import { ProductState, VariantValueObjType } from "@/src/types/product.type";
import { useState } from "react";
import { methodtype } from "@/src/lib/middlewareaction";

/**Fetch Stock Function */
const FetchStockData = async (
  productId: number,
  isLoading?: (val: boolean) => void,
  setState?: (val: Partial<ProductState>) => void,
) => {
  try {
    isLoading?.(true);
    const data = await ApiRequest(
      `/api/products?ty=stock7pid=${productId}`,
      undefined,
      "GET",
    );
    isLoading?.(false);
    if (!data.success) {
      throw Error(data.error);
    }

    setState?.(data.data);

    return data.data as Pick<ProductState, "Variant" | "Stock">;
  } catch (error) {
    console.log("Error Fetching", error);
    return null;
  }
};

export const UpdateStockModal = ({
  closename,
  productId,
}: {
  closename: string;
  productId?: number;
}) => {
  const { product, setproduct, setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState<Partial<Record<methodtype, boolean>>>(
    {},
  );

  const handleUpdate = async () => {
    const update = await ApiRequest(
      "/api/products/crud",
      setloading as never,
      "PUT",
      "JSON",
      { stock: product.stock, id: product.id, type: "editstock" },
    );
    if (!update.success) {
      errorToast("Failed To Update Stock");
      return;
    }

    successToast("Updated");
    setproduct(Productinitailizestate);
    setopenmodal((prev) => ({ ...prev, [closename]: false }));
  };
  return (
    <Modal closestate={closename}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="updatestock w-full h-full rounded-2xl flex flex-col gap-y-6 bg-gradient-to-br from-white to-blue-50 p-6 shadow-xl border-2 border-blue-200"
      >
        <div className="w-full space-y-2 pb-4 border-b-2 border-blue-200">
          <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <i className="fa-solid fa-boxes-stacked text-white"></i>
            </div>
            Update Stock
          </h4>
          <p className="text-sm text-gray-500 ml-13">
            Adjust the inventory quantity for this product
          </p>
        </div>

        <div className="w-full bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-warehouse text-lg text-blue-500"></i>
            <h5 className="font-bold text-gray-800">Stock Quantity</h5>
          </div>
          <input
            type="number"
            placeholder="Enter stock quantity"
            name="stock"
            min={0}
            max={1000}
            onChange={(e) => {
              const { value } = e.target;
              const val = parseInt(value);
              setproduct((prev) => ({ ...prev, stock: val }));
            }}
            value={product.stock}
            required
            className="w-full h-14 text-lg px-4 font-bold rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <i className="fa-solid fa-info-circle"></i>
            Maximum allowed: 1000 units
          </p>
        </div>

        <div className="w-full flex flex-row gap-4">
          <button
            type="button"
            onClick={() => handleUpdate()}
            disabled={loading?.PUT || loading?.GET}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
              loading?.PUT || loading?.GET
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            {loading?.PUT ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i>
                <span>Update Stock</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setopenmodal((prev) => ({ ...prev, [closename]: false }));
            }}
            disabled={loading?.PUT || loading?.GET}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
              loading?.PUT || loading?.GET
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-pink-500 to-red-600 text-white hover:from-pink-600 hover:to-red-700 hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            <i className="fa-solid fa-times"></i>
            <span>Cancel</span>
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

interface StockSelectProps {
  id?: number;
  data: {
    type: "TEXT" | "COLOR";
    value: (string | VariantValueObjType)[];
  };
  label: string;
  onSelect: (val: Set<string>) => void;
  value: string[];
}

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

export function StockSelect({
  data,
  label,
  onSelect,
  id,
  value,
}: StockSelectProps) {
  const theme = useTheme();

  return (
    <div key={id} className="w-full h-fit">
      <FormControl sx={{ m: 1, width: "100%" }}>
        <InputLabel id="demo-multiple-chip-label">{label}</InputLabel>
        <Select
          labelId="demo-multiple-chip-label"
          id="demo-multiple-chip"
          value={value}
          multiple
          onChange={(e) => {
            const { value } = e.target;
            const setvalue = new Set(value as string[]);
            onSelect(setvalue);
          }}
          input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
          renderValue={(selected: string[]) =>
            selected.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    avatar={
                      data.type === "COLOR" ? (
                        <div
                          className="w-[15px] h-[15px] rounded-full"
                          style={{ backgroundColor: value }}
                        ></div>
                      ) : undefined
                    }
                    key={value}
                    label={
                      data.type === "COLOR"
                        ? ((
                            data.value.find(
                              (i: any) => i.val === value,
                            ) as VariantValueObjType
                          )?.name ?? "")
                        : value
                    }
                  />
                ))}
              </Box>
            )
          }
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
              },
            },
          }}
        >
          {data.value.map((item, idx) => {
            if (typeof item === "string") {
              return (
                <MenuItem
                  key={idx}
                  value={item}
                  style={getStyles(item, data.value as string[], theme)}
                >
                  {item}
                </MenuItem>
              );
            } else {
              return (
                <MenuItem
                  key={idx}
                  value={item.val}
                  style={getStyles(
                    item.val,
                    data.value.map((i: any) => i.val),
                    theme,
                  )}
                >
                  <div className="w-fit h-fit flex flex-row gap-x-5 items-center justify-center">
                    <div
                      className="w-[20px] h-[20px] rounded-full"
                      style={{ backgroundColor: item.val }}
                    ></div>
                    {item.name && (
                      <div className="text-lg w-fit h-fit">{item.name}</div>
                    )}
                  </div>
                </MenuItem>
              );
            }
          })}
        </Select>
      </FormControl>
    </div>
  );
}

interface Stockcardprops {
  label: string;
  color?: string;
  onClick?: () => void;
}

export function StockCard({ label, color, onClick }: Stockcardprops) {
  return (
    <NextChip
      key={label}
      onClick={() => onClick && onClick()}
      size="lg"
      startContent={
        color && (
          <div
            style={{ backgroundColor: color }}
            className="w-[20px] h-[20px] rounded-full"
          ></div>
        )
      }
    >
      {label}
    </NextChip>
  );
}
