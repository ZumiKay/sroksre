import React, {
  ChangeEvent,
  FormEvent,
  memo,
  useCallback,
  useState,
} from "react";
import PrimaryButton from "../Button";
import { errorToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import { CirclePicker, ChromePicker, ColorResult } from "react-color";
import { Button, Form, Input } from "@heroui/react";
import { compareArrays, HasPartialOverlap } from "@/src/lib/utilities";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import Multiselect from "../MutiSelect";
import { NormalSkeleton } from "../Banner";
import RenderStockCards from "./Variantcomponent/StockCard";
import {
  colorPalette,
  Colortype,
  ProductState,
  Stocktype,
  Variantcontainertype,
} from "@/src/context/GlobalType.type";
import { ColorDataType, variantdatatype } from "./VariantModal";

interface ManageStockContainerProps {
  product: ProductState;
  setproduct: React.Dispatch<React.SetStateAction<ProductState>>;
  editindex?: number;
  newadd: string;
  stock: string;
  setstock: React.Dispatch<React.SetStateAction<string>>;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  setnew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
  setaddstock: React.Dispatch<React.SetStateAction<number>>;
  isloading: boolean;
  edit: number;
  addstock: number;
  selectedstock: { [key: string]: string[] };
  setselectedstock: React.Dispatch<
    React.SetStateAction<{ [key: string]: string[] } | undefined>
  >;
  handleUpdateStock: (isAddnew?: boolean) => void;
  editsubidx: number;
  seteditsubidx: React.Dispatch<React.SetStateAction<number>>;
  setadded: React.Dispatch<React.SetStateAction<number>>;
  isAddNew: boolean;
  setisAddNew: React.Dispatch<React.SetStateAction<boolean>>;
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
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

const groupSelectedValue = (
  data: { Stockvalue: { variant_val: string[] }[] },
  variants: {
    option_title: string;
    option_value: (string | { val: string; name: string })[];
  }[]
) => {
  const res: { [key: string]: Set<string> } = {};

  data.Stockvalue.forEach((stock) => {
    stock.variant_val.forEach((value) => {
      // Find the variant that includes the value, ignoring order
      const matchedVariant = variants.find((variant) =>
        variant.option_value.some((opt) =>
          typeof opt === "string" ? opt === value : opt.val === value
        )
      );

      if (matchedVariant) {
        const optionTitle = matchedVariant.option_title;

        if (!res[optionTitle]) {
          res[optionTitle] = new Set();
        }

        res[optionTitle].add(value);
      }
    });
  });

  // Convert Sets to arrays for the final result
  const finalRes: { [key: string]: string[] } = {};
  for (const key in res) {
    finalRes[key] = Array.from(res[key]);
  }

  return finalRes;
};

const CountLowStock = (stock: Stocktype) => {
  return stock.Stockvalue.reduce((total, i) => {
    return i.qty <= 3 ? (total += 1) : total;
  }, 0);
};

const AsyncUpdateStock = async (editindex: number, stockArray: Stocktype[]) => {
  const res = await ApiRequest({
    url: "/api/products/crud",
    method: "PUT",
    data: {
      id: editindex,
      varaintstock: stockArray,
      type: "editvariantstock",
    },
  });

  return res;
};

export const ManageStockContainer = memo(
  ({
    newadd,
    setedit,
    edit,
    stock,
    setstock,
    setnew,
    setselectedstock,
    selectedstock,
    handleUpdateStock,
    editsubidx,
    seteditsubidx,
    setadded,
    isAddNew,
    setisAddNew,
    editindex,
    setreloaddata,
    isloading,
    product,
    setproduct,
  }: ManageStockContainerProps) => {
    const [lowstock, setlowstock] = useState(0);
    const [loading, setloading] = useState(false);

    const handleSelectVariant = useCallback(
      (value: Set<string>, label: string) => {
        setselectedstock((prevSelectedStock) => {
          const updatedStock = { ...prevSelectedStock };

          updatedStock[label] = Array.from(value).filter((i) => i !== "");

          return updatedStock;
        });
      },
      [setselectedstock]
    );

    const handleEdit = useCallback(
      (idx: number) => {
        //extract reponsible stock value for selected value

        if (product.varaintstock && product.variants) {
          const createdstock = groupSelectedValue(
            product.varaintstock[idx] as unknown as Stocktype,
            product.variants as never
          );

          console.log({ createdstock });

          setselectedstock(createdstock);
          setlowstock(CountLowStock(product.varaintstock[idx]));
          setedit(idx);
          setnew("stockinfo");
        }
      },
      [
        product?.varaintstock,
        product?.variants,
        setedit,
        setnew,
        setselectedstock,
      ]
    );

    const handleStockChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || /^[0-9\b]+$/.test(value)) {
          setstock(value);
        }
      },
      [setstock]
    );

    const handleAddNewSubStock = useCallback(() => {
      if (isAddNew) {
        handleUpdateStock(isAddNew);
        setisAddNew(false);
      } else {
        setselectedstock(undefined);
        setisAddNew(true);
      }
    }, [handleUpdateStock, isAddNew, setisAddNew, setselectedstock]);

    const handleDeleteSubStock = useCallback(
      (idx: number) => {
        if (!product.varaintstock) return;

        const updatedStock = product.varaintstock.map((stock) => ({
          ...stock,
          Stockvalue: stock.Stockvalue.filter((_, index) => index !== idx),
        }));

        setproduct((prev) => ({
          ...prev,
          varaintstock: updatedStock,
        }));
      },
      [product?.varaintstock, setproduct]
    );

    const handleSubStockClick = useCallback(
      (data: string[], qty: string, idx: number) => {
        const variants = [...(product?.variants ?? [])];

        //group select sub stock value
        const res: { [key: string]: string[] } = {};
        data.forEach((value, idx) => {
          if (idx < variants.length) {
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
          }
        });
        setselectedstock(res);
        setstock(qty);
        seteditsubidx(idx);
      },
      [product?.variants, seteditsubidx, setselectedstock, setstock]
    );

    const handleUpdateSubStock = useCallback(
      async (idx: number) => {
        const stockArray = [...(product?.varaintstock ?? [])];
        const updatestockvalue = stockArray[edit];

        const stockValues = MapSelectedValuesToVariant(
          selectedstock,
          product.variants?.map((i) => i.option_title) ?? []
        );

        const hasChangedVariantValues = stockValues.some(
          (val) =>
            !updatestockvalue.Stockvalue.some((i) =>
              compareArrays(val, i.variant_val, { strictOrder: true })
            )
        );

        if (hasChangedVariantValues) {
          const isOverlap = stockArray.some(
            (item, idx) =>
              idx !== edit &&
              HasPartialOverlap(
                item.Stockvalue.map((i) => i.variant_val),
                stockValues
              )
          );
          if (isOverlap) {
            errorToast("Stock Exist");
            return;
          }

          updatestockvalue.Stockvalue.splice(idx, 1);
          stockValues.forEach((i) => {
            updatestockvalue.Stockvalue.push({
              qty: parseInt(stock, 10),
              variant_val: i,
            });
          });
        } else {
          updatestockvalue.Stockvalue[idx].qty = parseInt(stock, 10);
        }

        if (editindex) {
          setloading(true);
          const req = await AsyncUpdateStock(editindex, stockArray);
          setloading(false);
          if (!req.success) {
            errorToast("Error Occured");
            return;
          }
          setreloaddata(true);
        }

        setproduct((prev) => ({ ...prev, varaintstock: stockArray }));
        setlowstock(CountLowStock(stockArray[edit]));
        seteditsubidx(-1);
        setstock("");
        setselectedstock(undefined);
      },
      [
        edit,
        editindex,
        product?.varaintstock,
        product?.variants,
        selectedstock,
        seteditsubidx,
        setproduct,
        setreloaddata,
        setselectedstock,
        setstock,
        stock,
      ]
    );

    const handleBackEditSubStock = useCallback(() => {
      if (editsubidx !== -1) {
        setselectedstock(undefined);
        setstock("");
        seteditsubidx(-1);
      } else if (isAddNew) {
        setisAddNew(false);
      }
    }, [
      editsubidx,
      isAddNew,
      seteditsubidx,
      setisAddNew,
      setselectedstock,
      setstock,
    ]);

    const handleDeleteStock = useCallback(
      async (idx: number) => {
        const updatestock = [...(product.varaintstock ?? [])];
        updatestock.splice(idx, 1);
        if (editindex) {
          setloading(true);
          const req = await AsyncUpdateStock(editindex, updatestock);
          setloading(false);
          if (!req.success) {
            errorToast("Error Occured");
            return;
          }
          setreloaddata(true);
        }

        setproduct((prev) => ({
          ...prev,
          varaintstock: updatestock,
        }));
      },
      [editindex, product?.varaintstock, setproduct, setreloaddata]
    );

    const handleCreateStock = useCallback(() => {
      if (!product?.variants) {
        errorToast("Please Create Variant");
        return;
      }
      setadded(1);
      setnew("stockinfo");
    }, [product?.variants, setadded, setnew]);

    return (
      <div className="stock_container w-full h-full relative p-4">
        {newadd === "stockinfo" ? (
          <div className="createstock_container flex flex-col w-full h-full items-center justify-start gap-y-4 max-w-3xl mx-auto">
            {/* Back button section */}
            {(editsubidx !== -1 || isAddNew) && (
              <Button
                className="self-start"
                color="danger"
                variant="bordered"
                startContent={<div className="font-medium">{"<"}</div>}
                onPress={() => handleBackEditSubStock()}
              >
                Back
              </Button>
            )}

            {/* Header section with consistent styling */}
            <div className="w-full text-center mb-2">
              <h3 className="text-xl font-semibold">
                {edit === -1 ? "Please Choose Variant" : "Edit Stock"}
              </h3>

              {lowstock !== 0 && edit !== -1 && (
                <div className="text-red-500 text-sm font-medium mt-1">
                  Low Stock: {lowstock}
                </div>
              )}
            </div>

            {/* Variant selection or stock editing section */}
            {edit === -1 || isAddNew || editsubidx !== -1 ? (
              <div className="variantlist bg-gray-50 rounded-lg flex flex-col items-center justify-start gap-y-5 w-full h-full max-h-[60vh] p-6 overflow-y-auto shadow-sm">
                {product.variants?.map((item, idx) => (
                  <Multiselect
                    key={"Select" + idx}
                    id={idx}
                    type={item.option_type as never}
                    value={selectedstock[item.option_title]}
                    data={item.option_value.map((i) => {
                      if (typeof i === "string") {
                        return { label: i, value: i };
                      } else {
                        return { label: i.name ?? "", value: i.val };
                      }
                    })}
                    label={item.option_title}
                    onSelect={(val) =>
                      handleSelectVariant(val, item.option_title)
                    }
                  />
                ))}
              </div>
            ) : (
              product.varaintstock && (
                <div className="editstock_container w-full h-fit flex flex-row flex-wrap items-start justify-center gap-5 py-4 bg-gray-50 rounded-lg shadow-sm">
                  <RenderStockCards
                    product={product}
                    handleDeleteSubStock={handleDeleteSubStock}
                    handleSubStockClick={handleSubStockClick}
                    edit={edit}
                  />
                </div>
              )
            )}

            {/* Action buttons and input section */}
            <div className="w-full max-w-md flex flex-row gap-x-3 mt-2">
              {edit !== -1 && (
                <Button
                  className="h-[44px]"
                  fullWidth
                  startContent={<div className="font-light text-xl">+</div>}
                  isLoading={loading}
                  variant="bordered"
                  color={isAddNew ? "success" : "primary"}
                  onPress={() =>
                    editsubidx === -1
                      ? handleAddNewSubStock()
                      : handleUpdateSubStock(editsubidx)
                  }
                >
                  {editsubidx !== -1 ? "Update" : "Add New"}
                </Button>
              )}
              {(edit === -1 || isAddNew || editsubidx !== -1) && (
                <Input
                  label={"Stock"}
                  type="number"
                  fullWidth
                  size="md"
                  className="h-[44px]"
                  value={stock}
                  onChange={handleStockChange}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="selectvariaint_container flex flex-col items-center justify-start gap-y-6 w-full h-full max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold my-2">Stock Management</h3>

            <div className="liststock_container flex flex-row flex-wrap gap-5 w-full h-fit p-3 max-h-[50vh] overflow-y-auto bg-gray-50 rounded-lg shadow-sm">
              {!isloading &&
                (!product?.varaintstock ||
                  product.varaintstock.length === 0) && (
                  <h3 className="text-lg text-gray-500 w-full bg-gray-100 p-4 rounded-lg text-center">
                    No Stock Items Available
                  </h3>
                )}

              {isloading ? (
                <NormalSkeleton
                  style={{ flexDirection: "row" }}
                  count={3}
                  width="100%"
                  height="60px"
                />
              ) : (
                product.varaintstock &&
                product.varaintstock.map((i, idx) => (
                  <div
                    key={idx}
                    style={
                      i.isLowStock
                        ? { borderLeft: "4px solid #f87171" }
                        : { borderLeft: "4px solid #10b981" }
                    }
                    className="stockcard w-full sm:w-[calc(50%-10px)] h-[60px] flex flex-row items-center justify-between p-3 bg-white shadow-sm rounded-lg transition duration-200 hover:bg-gray-100"
                  >
                    <h3 className="name text-base font-medium">
                      Stock {idx + 1}
                    </h3>
                    <div className="action flex flex-row items-center gap-x-4">
                      <button
                        onClick={() => handleEdit(idx)}
                        className="px-3 py-1 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStock(idx)}
                        className="px-3 py-1 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <PrimaryButton
              text={"Add New Stock"}
              type="button"
              width="100%"
              radius="8px"
              height="44px"
              textsize="14px"
              onClick={() => handleCreateStock()}
            />
          </div>
        )}
      </div>
    );
  }
);
ManageStockContainer.displayName = "ManageStockContainer";

interface ColorSelectModal {
  edit: number;
  open: boolean;
  setopen: (val: boolean) => void;
  temp: variantdatatype;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  colorstate: ColorDataType;
  color: Colortype;
  name: string;
  setcolor: (value: Colortype | string) => void;
  settemp: React.Dispatch<React.SetStateAction<variantdatatype | undefined>>;
  setcolorstate: React.Dispatch<React.SetStateAction<ColorDataType>>;
}

export const ColorSelectModal = ({
  edit,
  setedit,
  colorstate,
  color,
  setcolor,
  name,
  open,
  temp,
  setopen,
  settemp,
  setcolorstate,
}: ColorSelectModal) => {
  const [colorpicker, setcolorpicker] = useState(false);
  const { isMobile } = useScreenSize();

  const handleAddColor = React.useCallback(() => {
    const { color, name } = colorstate;

    const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(color.hex);

    if (!isValidHex) {
      errorToast("Wrong Hex Code");
      return;
    }

    if (color?.hex === "" || !name) {
      errorToast(color.hex === "" ? "Please Select Color" : "Name is Required");
      return;
    }
    const update = { ...temp };
    if (edit === -1) {
      update.value?.push({
        val: color.hex,
        name,
      });
    } else if (update.value && edit !== -1) {
      update.value[edit] = {
        val: color.hex,
        name,
      };
    }
    settemp(update as variantdatatype);
    setcolorstate((prev) => ({ ...prev, color: colorPalette, name: "" }));
    setedit(-1);
  }, [colorstate, temp, edit, settemp, setcolorstate, setedit]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleAddColor();
      setopen(false);
    },
    [handleAddColor, setopen]
  );

  const handleUpdateColor = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Regular expression to validate hex color code (#RRGGBB or #RGB)
      const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);

      if (!isValidHex) {
        errorToast("Invalid Hex Code");
        return;
      }

      setcolor({
        rgb: { r: 0, g: 0, b: 0 },
        hex: value, // Default to gray if invalid
      });
    },
    [setcolor]
  );

  const handleSetColorState = useCallback(
    (val: ColorResult) => {
      setcolor({ ...val });
    },
    [setcolor]
  );
  return (
    <>
      <div
        onClick={() => {
          setedit(-1);
          setcolor(colorPalette);
          setopen(true);
        }}
        className={`cursor-pointer transition duration-200 w-fit h-fit text-sm ${
          open ? "text-gray-500" : "text-blue-500"
        } font-normal hover:text-white active:text-white`}
      >
        Add Color
      </div>
      {open && (
        <SecondaryModal
          open={open}
          size={isMobile ? "full" : "3xl"}
          placement={isMobile ? "top" : "center"}
          onPageChange={() => {
            setedit(-1);
            setopen(false);
          }}
          closebtn
        >
          <Form
            onSubmit={handleSubmit}
            className="w-full h-fit bg-white flex flex-col items-center justify-center gap-y-3 p-3"
          >
            <Input
              type="text"
              fullWidth
              size="lg"
              label="Name"
              onChange={(e) => setcolor(e.target.value as string)}
              value={name}
              required
            />

            <label
              htmlFor="color"
              className="font-semibold text-sm w-full text-left"
            >
              Color
              <strong className="text-red-400 text-lg font-normal">*</strong>
            </label>
            <div
              onClick={() => {
                setcolorpicker(true);
              }}
              className={`w-[100%] h-[50px] border-[5px] border-gray-300 rounded-lg`}
              style={{ backgroundColor: color.hex }}
            ></div>

            {colorpicker && (
              <SecondaryModal
                onPageChange={(val) => setcolorpicker(val)}
                footer={() => {
                  return (
                    <PrimaryButton
                      text="Close"
                      color="lightcoral"
                      type="button"
                      radius="10px"
                      onClick={() => {
                        setcolorpicker(false);
                      }}
                      width="100%"
                      textsize="10px"
                      height="30px"
                    />
                  );
                }}
                open={colorpicker}
                size={"2xl"}
                placement={isMobile ? "top" : "center"}
              >
                <div className="w-full h-full flex flex-col items-center gap-y-5 justify-center">
                  <div className="w-full h-fit flex flex-col gap-3 items-center">
                    <CirclePicker
                      color={color.hex}
                      onChange={handleSetColorState}
                    />
                    <ChromePicker
                      color={color.hex}
                      onChange={handleSetColorState}
                      disableAlpha
                    />
                  </div>

                  <Input
                    className="w-full h-[40px] max-small_phone:text-2xl text-lg"
                    type="text"
                    label="Hex Code"
                    value={color.hex}
                    size="lg"
                    onChange={handleUpdateColor}
                  />
                </div>
              </SecondaryModal>
            )}
            <PrimaryButton
              text={edit === -1 ? "Confirm" : "Update"}
              type="submit"
              disable={color.hex === ""}
              width="100%"
              textsize="13px"
              radius="10px"
              height="35px"
            />
          </Form>
        </SecondaryModal>
      )}
    </>
  );
};
