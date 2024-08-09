import {
  Productinitailizestate,
  useGlobalContext,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import { errorToast, successToast } from "../Loading";
import Modal from "../Modals";
import { ApiRequest } from "@/src/context/CustomHook";
import PrimaryButton from "../Button";
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

import { Chip as NextChip } from "@nextui-org/chip";
import { useRouter } from "next/navigation";

export const UpdateStockModal = ({
  action,
  closename,
}: {
  action?: () => void;
  closename: string;
}) => {
  const { product, setproduct, setopenmodal, isLoading, setisLoading } =
    useGlobalContext();
  const router = useRouter();

  const handleUpdate = async () => {
    const update = await ApiRequest(
      "/api/products/crud",
      setisLoading,
      "PUT",
      "JSON",
      { stock: product.stock, id: product.id, type: "editstock" }
    );
    if (!update.success) {
      errorToast("Failed To Update Stock");
      return;
    }

    setproduct(Productinitailizestate);

    successToast("Stock Updated");
    setopenmodal((prev) => ({ ...prev, [closename]: false }));
    router.refresh();
  };
  return (
    <Modal closestate={closename}>
      <div className="updatestock w-[100%] h-[100%] rounded-lg flex flex-col items-center justify-center gap-y-5 bg-white p-1">
        <label className="text-lg font-bold">Update Stock </label>
        <input
          type="number"
          placeholder="Stock"
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
          className="w-[80%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
        />
        <PrimaryButton
          color="#44C3A0"
          text="Update"
          type="button"
          onClick={() => handleUpdate()}
          radius="10px"
          status={isLoading.PUT ? "loading" : "authenticated"}
          width="80%"
          height="50px"
        />{" "}
        <PrimaryButton
          color="#F08080"
          text="Cancel"
          type="button"
          radius="10px"
          width="80%"
          height="50px"
          disable={isLoading.PUT}
          onClick={() => {
            setopenmodal((prev) => ({ ...prev, [closename]: false }));
          }}
        />
      </div>
    </Modal>
  );
};

interface StockSelectProps {
  id?: number;
  data: {
    type: "TEXT" | "COLOR";
    value: (string | VariantColorValueType)[];
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
                        ? (
                            data.value.find(
                              (i: any) => i.val === value
                            ) as VariantColorValueType
                          )?.name ?? ""
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
                    theme
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
