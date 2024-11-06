import {
  Stocktype,
  SubStockType,
  useGlobalContext,
  Varianttype,
} from "@/src/context/GlobalContext";
import React, { ChangeEvent, useState } from "react";
import PrimaryButton from "../Button";
import {
  ArraysAreEqualSets,
  Colorinitalize,
  Colortype,
  Variantcontainertype,
} from "./VariantModal";
import { errorToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import { SliderPicker, CirclePicker } from "react-color";
import { Button, Input } from "@nextui-org/react";
import { HasPartialOverlap } from "@/src/lib/utilities";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import Multiselect from "../MutiSelect";
import { NormalSkeleton } from "../Banner";
import RenderStockCards from "./Variantcomponent/StockCard";

interface ManageStockContainerProps {
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
  const res = await ApiRequest("/api/products/crud", undefined, "PUT", "JSON", {
    id: editindex,
    varaintstock: stockArray,
    type: "editvariantstock",
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
  handleUpdateStock,
  editsubidx,
  seteditsubidx,
  setadded,
  isAddNew,
  setisAddNew,
  editindex,
  setreloaddata,
  isloading,
}: ManageStockContainerProps) {
  const { product, setproduct } = useGlobalContext();
  const [lowstock, setlowstock] = useState(0);
  const [loading, setloading] = useState(false);

  const handleSelectVariant = (value: Set<string>, label: string) => {
    setselectedstock((prevSelectedStock) => {
      const updatedStock = { ...prevSelectedStock };

      updatedStock[label] = Array.from(value).filter((i) => i !== "");

      return updatedStock;
    });
  };

  const handleEdit = (idx: number) => {
    //extract reponsible stock value for selected value

    if (product.varaintstock && product.variants) {
      const createdstock = groupSelectedValue(
        product.varaintstock[idx] as unknown as Stocktype,
        product.variants as any
      );

      setselectedstock(createdstock);
      setlowstock(CountLowStock(product.varaintstock[idx]));
      setedit(idx);
      setnew("stockinfo");
    }
  };

  const handleStockChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setstock(value);
    }
  };

  const handleAddNewSubStock = () => {
    if (isAddNew) {
      handleUpdateStock(isAddNew);
      setisAddNew(false);
    } else {
      setselectedstock(undefined);
      setisAddNew(true);
    }
  };

  const handleDeleteSubStock = (idx: number) => {
    if (!product.varaintstock) return;

    const updatedStock = product.varaintstock.map((stock) => ({
      ...stock,
      stockvalue: stock.Stockvalue.splice(idx, 1),
    }));

    setproduct((prev) => ({ ...prev, varaintstock: updatedStock }));
  };

  const handleSubStockClick = (data: string[], qty: string, idx: number) => {
    const variants = [...(product.variants ?? [])];

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
  };

  const handleUpdateSubStock = async (idx: number) => {
    const stockArray = [...(product.varaintstock ?? [])];
    let updatestockvalue = stockArray[edit];

    const stockValues = MapSelectedValuesToVariant(
      selectedstock,
      product.variants?.map((i) => i.option_title) ?? []
    );

    const hasChangedVariantValues = stockValues.some(
      (val) =>
        !updatestockvalue.Stockvalue.some((i) =>
          ArraysAreEqualSets(val, i.variant_val)
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
  };

  const handleBackEditSubStock = () => {
    if (editsubidx !== -1) {
      setselectedstock(undefined);
      setstock("");
      seteditsubidx(-1);
    } else if (isAddNew) {
      setisAddNew(false);
    }
  };

  const handleDeleteStock = async (idx: number) => {
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
  };

  return (
    <>
      <div className="stock_container w-full h-full relative">
        {newadd === "stockinfo" ? (
          <div className="createstock_container flex flex-col w-full h-full items-center justify-start gap-y-3">
            {(editsubidx !== -1 || isAddNew) && (
              <Button
                className="self-start ml-2"
                color="danger"
                variant="bordered"
                startContent={<div> {"<"}</div>}
                onClick={() => handleBackEditSubStock()}
              >
                Back
              </Button>
            )}
            <h3 className="text-lg font-medium">
              {edit === -1 ? "Please Choose Variant" : "Edit Stock"}{" "}
            </h3>

            {lowstock !== 0 && edit !== -1 && (
              <div className="text-red-500 text-sm font-medium">
                Low Stock: {lowstock}
              </div>
            )}

            {edit === -1 || isAddNew || editsubidx !== -1 ? (
              <div className="variantlist relative  rounded-lg flex flex-col items-center justify-start gap-y-5 w-full h-full max-h-[60vh] p-5 overflow-y-auto">
                {product.variants?.map((item, idx) => {
                  return (
                    <Multiselect
                      key={item.id}
                      id={idx}
                      type={item.option_type}
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
                  );
                })}
              </div>
            ) : (
              product.varaintstock && (
                <div className="editstock_container w-full h-fit flex flex-row flex-wrap items-start justify-center gap-5 pt-5">
                  <RenderStockCards
                    handleDeleteSubStock={handleDeleteSubStock}
                    handleSubStockClick={handleSubStockClick}
                    edit={edit}
                  />
                </div>
              )
            )}
            <div className="w-[50%] min-w-[275px] h-[40px] flex flex-row gap-x-3">
              {edit !== -1 && (
                <Button
                  className="h-full"
                  fullWidth
                  startContent={<div className="font-light text-3xl"> + </div>}
                  isLoading={loading}
                  variant="bordered"
                  color={isAddNew ? "success" : "primary"}
                  onClick={() =>
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
                  size="sm"
                  className="h-full"
                  value={stock}
                  onChange={handleStockChange}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="selectvariaint_container flex flex-col items-center justify-start gap-y-10 w-full h-full">
            <div className="liststock_container flex flex-row flex-wrap gap-5 w-[90%] h-fit p-1 max-h-[46vh] overflow-y-auto">
              {((product.varaintstock && product.varaintstock.length === 0) ||
                !product.varaintstock) && (
                <h3 className="text-lg text-gray-500 w-full outline outline-1 outline-gray-500 p-2 rounded-lg">
                  No Stock
                </h3>
              )}
              {isloading ? (
                <NormalSkeleton
                  style={{ flexDirection: "row" }}
                  count={3}
                  width="220px"
                  height="50px"
                />
              ) : (
                product.varaintstock &&
                product.varaintstock.map((i, idx) => (
                  <div
                    key={idx}
                    style={
                      i.isLowStock
                        ? { borderRight: "5px solid lightcoral" }
                        : {}
                    }
                    className="stockcard w-[220px] h-[50px] flex flex-row items-center justify-evenly p-2 outline outline-2 outline-gray-300 rounded-lg transition duration-200 hover:bg-gray-300"
                  >
                    <h3 className="name text-lg font-semibold w-full">
                      Stock {idx + 1}
                    </h3>
                    <div className="action w-full flex flex-row items-center justify-evenly">
                      <h3
                        onClick={() => handleEdit(idx)}
                        className="w-fit h-fit text-lg font-normal text-blue-500 transition duration-200 cursor-pointer hover:text-black"
                      >
                        Edit
                      </h3>
                      <h3
                        onClick={() => {
                          //Delete Stock
                          handleDeleteStock(idx);
                        }}
                        className="w-fit h-fit text-lg font-normal text-red-500 transition duration-200 cursor-pointer hover:text-black"
                      >
                        Delete
                      </h3>
                    </div>
                  </div>
                ))
              )}
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

                if (!product.variants) {
                  errorToast("Please Create Variant");
                  return;
                }
                setadded(1);
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
  handleAddColor: () => void;
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
  const { isMobile } = useScreenSize();
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
        <SecondaryModal
          open={open}
          size={isMobile ? "full" : "3xl"}
          placement={isMobile ? "top" : "center"}
          onPageChange={() => {
            setedit(-1);
            setopen(false);
          }}
          closebtn
          footer={() => {
            return (
              <PrimaryButton
                text={edit === -1 ? "Confirm" : "Update"}
                type="button"
                onClick={() => {
                  handleAddColor();
                  setopen(false);
                }}
                disable={color.hex === ""}
                width="100%"
                textsize="13px"
                radius="10px"
                height="35px"
              />
            );
          }}
        >
          <form className="w-full h-fit bg-white flex flex-col items-center justify-center gap-y-3 p-3">
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
                    <div className="w-full">
                      <SliderPicker
                        color={color.hex}
                        onChange={(value, _) => {
                          setcolor({
                            hex: value.hex,
                            rgb: value.rgb as any,
                          });
                        }}
                      />
                    </div>
                    <CirclePicker
                      color={color.hex}
                      onChange={(value, _) => {
                        setcolor({
                          hex: value.hex,
                          rgb: value.rgb as any,
                        });
                      }}
                    />
                  </div>

                  <Input
                    className="w-full h-[40px] max-small_phone:text-2xl text-lg"
                    type="text"
                    label="Hex Code"
                    value={color.hex}
                    size="lg"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Regular expression to validate hex color code (#RRGGBB or #RGB)
                      const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);

                      setcolor({
                        rgb: { r: 0, g: 0, b: 0 },
                        hex: value, // Default to gray if invalid
                      });
                    }}
                  />
                </div>
              </SecondaryModal>
            )}
          </form>
        </SecondaryModal>
      )}
    </>
  );
};
