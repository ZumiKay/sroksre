import { useGlobalContext, Varianttype } from "@/src/context/GlobalContext";
import React, { ChangeEvent, FormEvent, useState } from "react";
import PrimaryButton from "../Button";
import {
  Colorinitalize,
  Colortype,
  Variantcontainertype,
} from "./VariantModal";
import { errorToast } from "../Loading";
import Modal from "../Modals";
import { SketchPicker } from "react-color";
import { Input } from "@nextui-org/react";
import { StockSelect } from "./Stock";

interface ManageStockContainerProps {
  newadd: string;
  stock: string;
  setstock: React.Dispatch<React.SetStateAction<string>>;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  setnew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
  setaddstock: React.Dispatch<React.SetStateAction<number>>;
  edit: number;
  addstock: number;
  selectedstock: { [key: string]: string[] };
  setselectedstock: React.Dispatch<
    React.SetStateAction<{ [key: string]: string[] } | undefined>
  >;
}

function GenerateCombinations(arrays: (string[] | undefined)[]): string[][] {
  if (arrays.length === 0) return [[]];

  const [first, ...rest] = arrays;
  const restCombinations = GenerateCombinations(rest);

  if (first) {
    return first.flatMap((value) =>
      restCombinations.map((combination) => [value, ...combination])
    );
  } else {
    return restCombinations.map((combination) => ["", ...combination]);
  }
}

export function MapSelectedValuesToVariant(
  selectedValues: { [key: string]: string[] },
  variantKeys: string[]
): string[][] {
  const arrays: (string[] | undefined)[] = variantKeys.map(
    (key) => selectedValues[key] || [""]
  );

  const combinations = GenerateCombinations(arrays);

  return combinations;
}

const groupSelectedValue = (data: string[][], variants: Varianttype[]) => {
  const res: { [key: string]: string[] } = {};

  data.forEach((item) => {
    item.forEach((value, idx) => {
      const variant = variants[idx];
      const isVal = variant.option_value.some((opt) =>
        typeof opt === "string" ? opt === value : opt.val === value
      );

      if (isVal) {
        if (!res[variant.option_title]) {
          res[variant.option_title] = [];
        }

        if (!res[variant.option_title].includes(value)) {
          res[variant.option_title].push(value);
        }
      }
    });
  });

  return res;
};
export function ManageStockContainer({
  newadd,
  setedit,
  edit,
  stock,
  setstock,
  setnew,
  setselectedstock,
  selectedstock,
}: ManageStockContainerProps) {
  const { product, setproduct } = useGlobalContext();

  const handleSelectVariant = (
    value: Set<string>,
    label: string,
    varIdx: number
  ) => {
    setselectedstock((prevSelectedStock) => {
      const updatedStock = { ...prevSelectedStock };

      updatedStock[label] = Array.from(value);
      return updatedStock;
    });
  };

  const handleEdit = (idx: number, qty: string) => {
    //extract reponsible stock value for selected value
    if (product.varaintstock && product.variants) {
      const createdstock = groupSelectedValue(
        product.varaintstock[idx].variant_val,
        product.variants
      );

      setselectedstock(createdstock as any);
      setedit(idx);
      setstock(qty);
      setnew("stockinfo");
    }
  };

  const handleStockChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setstock(value);
    }
  };

  return (
    <>
      <div className="stock_container w-full h-full relative">
        {newadd === "stockinfo" ? (
          <div className="createstock_container flex flex-col w-full h-full items-center justify-start mt-2">
            <h2 className="text-lg font-medium">Please Choose Variants</h2>
            <div className="variantlist relative border-b-0 border-2 border-gray-300 rounded-lg flex flex-col items-center justify-start gap-y-5 w-[90%] h-full max-h-[60vh] p-5 overflow-y-auto">
              {product.variants?.map((item, idx) => {
                return (
                  <StockSelect
                    key={item.option_title}
                    id={item.id}
                    data={{ type: item.option_type, value: item.option_value }}
                    label={item.option_title}
                    onSelect={(e) =>
                      handleSelectVariant(e, item.option_title, idx)
                    }
                    value={selectedstock[item.option_title] ?? []}
                  />
                );
              })}
            </div>
            <div className="w-[50%] absolute bottom-3 flex flex-row gap-x-3">
              <Input
                label={"Stock"}
                type="number"
                fullWidth
                size="sm"
                value={stock}
                onChange={handleStockChange}
              />
            </div>
          </div>
        ) : (
          <div className="selectvariaint_container flex flex-col items-center justify-start gap-y-10 w-full h-full">
            <div className="liststock_container grid grid-cols-3 gap-5 w-[90%] h-fit p-1 max-h-[46vh] overflow-y-auto">
              {(product.varaintstock?.length === 0 ||
                !product.varaintstock) && (
                <h3 className="text-lg text-gray-500 w-full outline outline-1 outline-gray-500 p-2 rounded-lg">
                  No Stock
                </h3>
              )}
              {product.varaintstock &&
                product.varaintstock.map((i, idx) => (
                  <div
                    key={idx}
                    style={
                      i.qty <= 1
                        ? {
                            borderLeft: "5px solid red",
                          }
                        : {}
                    }
                    className="stockcard w-full h-[50px] flex flex-row items-center justify-evenly p-2 outline outline-2 outline-gray-300 rounded-lg transition duration-200 hover:bg-gray-300"
                  >
                    <h3 className="name text-lg font-semibold w-full">
                      Stock {idx + 1}
                    </h3>
                    <div className="action w-full flex flex-row items-center justify-evenly">
                      <h3
                        onClick={() => handleEdit(idx, i.qty.toString())}
                        className="w-fit h-fit text-lg font-normal text-blue-500 transition duration-200 cursor-pointer hover:text-black"
                      >
                        Edit
                      </h3>
                      <h3
                        onClick={() => {
                          //Delete Stock
                          const updatestock = product.varaintstock;
                          updatestock && updatestock.splice(idx, 1);
                          setproduct((prev) => ({
                            ...prev,
                            varaintstock: updatestock,
                          }));
                        }}
                        className="w-fit h-fit text-lg font-normal text-red-500 transition duration-200 cursor-pointer hover:text-black"
                      >
                        Delete
                      </h3>
                    </div>
                  </div>
                ))}
            </div>

            <PrimaryButton
              text={"Add Stock"}
              type="button"
              width="90%"
              radius="10px"
              height="40px"
              textsize="12px"
              onClick={() => {
                //create stock
                const variant = product.variants;

                if (!variant) {
                  errorToast("Please Create Variant");
                  return;
                }
                setnew("stockinfo");
              }}
            />

            {/*  */}
          </div>
        )}
      </div>
    </>
  );
}

interface ColorSelectModal {
  handleAddColor: (e: FormEvent<HTMLFormElement>) => void;
  edit: number;
  open: boolean;
  setopen: (val: boolean) => void;
  setedit: React.Dispatch<React.SetStateAction<number>>;

  color: Colortype;
  name: string;
  setcolor: (value: Colortype | string) => void;
}

export const ColorSelectModal = ({
  handleAddColor,
  edit,
  setedit,
  color,
  setcolor,
  name,
  open,
  setopen,
}: ColorSelectModal) => {
  const [colorpicker, setcolorpicker] = useState(false);
  return (
    <>
      <div
        onClick={() => {
          setedit(-1);
          setcolor(Colorinitalize);
          setopen(true);
        }}
        className={`cursor-pointer transition duration-200 w-fit h-fit text-sm ${
          open ? "text-gray-500" : "text-blue-500"
        } font-normal hover:text-white active:text-white`}
      >
        Add Color
      </div>
      {open && (
        <Modal closestate="none" customwidth="30vw" customheight="30vh">
          <form
            onSubmit={(e) => {
              handleAddColor(e);
              setopen(false);
            }}
            className="relative w-full h-full bg-white flex flex-col items-center justify-center gap-y-3 p-3"
          >
            <Input
              type="text"
              fullWidth
              size="sm"
              label="Name"
              onChange={(e) => setcolor(e.target.value as string)}
              value={name}
            />
            <label
              htmlFor="color"
              className="font-semibold text-sm w-full text-left"
            >
              {" "}
              Color{" "}
              <strong className="text-red-400 text-lg font-normal">
                *
              </strong>{" "}
            </label>
            <div
              onClick={() => {
                setcolorpicker(true);
              }}
              className={`w-[100%] h-[50px] border-[5px] border-gray-300 rounded-lg`}
              style={
                edit === -1
                  ? {
                      background: `rgba(${color?.rgb.r},${color?.rgb.g},${color?.rgb.b},${color?.rgb.a})`,
                    }
                  : {
                      backgroundColor: color.hex,
                    }
              }
            ></div>

            <div className="action-btn flex flex-row w-full gap-x-3">
              <PrimaryButton
                text={edit === -1 ? "Confirm" : "Update"}
                type="submit"
                disable={color.hex === ""}
                width="100%"
                textsize="13px"
                radius="10px"
                height="35px"
              />
              <PrimaryButton
                text="Close"
                color="black"
                type="button"
                onClick={() => {
                  setedit(-1);
                  setopen(false);
                }}
                width="100%"
                textsize="12px"
                radius="10px"
                height="35px"
              />
            </div>
            {colorpicker && (
              <div className="absolute w-fit h-fit top-0 z-50">
                {" "}
                <SketchPicker
                  width="29vw"
                  color={color.rgb as any}
                  onChange={(value, _) => {
                    setcolor({
                      hex: value.hex,
                      rgb: value.rgb as any,
                    });
                  }}
                />{" "}
                <PrimaryButton
                  text="Close"
                  color="lightcoral"
                  type="button"
                  onClick={() => {
                    setcolorpicker(false);
                  }}
                  width="100%"
                  textsize="10px"
                  height="30px"
                />
              </div>
            )}
          </form>
        </Modal>
      )}
    </>
  );
};
