import { useGlobalContext } from "@/src/context/GlobalContext";
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
import { CirclePicker, ChromePicker } from "react-color";
import { Button, Input } from "@nextui-org/react";
import { HasPartialOverlap } from "@/src/lib/utilities";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import Multiselect from "../MutiSelect";
import { NormalSkeleton } from "../Banner";
import RenderStockCards from "./Variantcomponent/StockCard";
import { Stocktype } from "@/src/types/product.type";
import {
  VariantStockIcon,
  BackArrowIcon,
  PlusIcon,
  WarningIcon,
} from "../svg/icons";
import { AddIcon } from "../Asset";

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

  // Start with an empty combination
  let result: string[][] = [[]];

  // Build combinations
  for (const array of arrays) {
    const newResult: string[][] = [];

    if (array && array.length > 0) {
      // For each existing combination, add each value from current array
      for (const combination of result) {
        for (const value of array) {
          newResult.push([...combination, value]);
        }
      }
    } else {
      // If array is undefined or empty
      for (const combination of result) {
        newResult.push([...combination]);
      }
    }

    result = newResult;
  }

  return result;
}

export function MapSelectedValuesToVariant(
  selectedValues: { [key: string]: string[] },
  variantKeys: string[],
): string[][] {
  const arrays: (string[] | undefined)[] = variantKeys.map(
    (key) => selectedValues[key],
  );

  const combinations = GenerateCombinations(arrays);

  return combinations;
}

const groupSelectedValue = (
  data: { Stockvalue: { variant_val: string[] }[] },
  variants: {
    option_title: string;
    option_value: (string | { val: string; name: string })[];
  }[],
) => {
  const res: { [key: string]: Set<string> } = {};

  data.Stockvalue.forEach((stock) => {
    stock.variant_val.forEach((value) => {
      // Find the variant that includes the value, ignoring order
      const matchedVariant = variants.find((variant) =>
        variant.option_value.some((opt) =>
          typeof opt === "string" ? opt === value : opt.val === value,
        ),
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
    Stock: stockArray,
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
      const updatedStock = { ...(prevSelectedStock || {}) };

      updatedStock[label] = Array.from(value).filter((i) => i !== "");

      return updatedStock;
    });
  };

  const handleEdit = (idx: number) => {
    //extract reponsible stock value for selected value

    if (product.Stock && product.Variant) {
      const createdstock = groupSelectedValue(
        product.Stock[idx] as unknown as Stocktype,
        product.Variant as any,
      );

      setselectedstock(createdstock);
      setlowstock(CountLowStock(product.Stock[idx]));
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
      setselectedstock(undefined);
      setstock("");
    } else {
      setselectedstock(undefined);
      setisAddNew(true);
    }
  };

  const handleDeleteSubStock = (idx: number) => {
    if (!product.Stock) return;

    const updatedStock = product.Stock.map((stock) => ({
      ...stock,
      Stockvalue: stock.Stockvalue.filter((_, index) => index !== idx),
    }));

    setproduct((prev) => ({
      ...prev,
      Stock: updatedStock,
    }));
  };

  const handleSubStockClick = (data: string[], qty: string, idx: number) => {
    const variants = [...(product.Variant ?? [])];

    //group select sub stock value
    const res: { [key: string]: string[] } = {};
    data.forEach((value, idx) => {
      if (idx < variants.length) {
        const variant = variants[idx];
        const isVal = variant.option_value.some((opt) =>
          typeof opt === "string" ? opt === value : opt.val === value,
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
    const stockArray = [...(product.Stock ?? [])];
    let updatestockvalue = stockArray[edit];

    const stockValues = MapSelectedValuesToVariant(
      selectedstock,
      product.Variant?.map((i) => i.option_title) ?? [],
    );

    const hasChangedVariantValues = stockValues.some(
      (val) =>
        !updatestockvalue.Stockvalue.some((i) =>
          ArraysAreEqualSets(val, i.variant_val),
        ),
    );

    if (hasChangedVariantValues) {
      const isOverlap = stockArray.some(
        (item, idx) =>
          idx !== edit &&
          HasPartialOverlap(
            item.Stockvalue.map((i) => i.variant_val),
            stockValues,
          ),
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

    setproduct((prev) => ({ ...prev, Stock: stockArray }));

    setlowstock(CountLowStock(stockArray[edit]));
    seteditsubidx(-1);
    setstock("");
    setselectedstock(undefined);
  };

  const handleBackEditSubStock = () => {
    if (editsubidx !== -1) {
      // Check if there's stock data to save before going back
      const hasSelectedOptions = Object.values(selectedstock || {}).some(
        (arr) => arr && arr.length > 0,
      );
      if (hasSelectedOptions && stock !== "") {
        handleUpdateSubStock(editsubidx);
      } else {
        setselectedstock(undefined);
        setstock("");
        seteditsubidx(-1);
      }
    } else if (isAddNew) {
      const hasSelectedOptions = Object.values(selectedstock || {}).some(
        (arr) => arr && arr.length > 0,
      );
      if (hasSelectedOptions && stock !== "") {
        handleUpdateStock(true);
      }
      setisAddNew(false);
      setnew("stock");
    }
  };

  const handleDeleteStock = async (idx: number) => {
    const updatestock = [...(product.Stock ?? [])];
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
      Stock: updatestock,
    }));
  };

  return (
    <>
      <div className="stock_container w-full h-full relative">
        {newadd === "stockinfo" ? (
          <div className="createstock_container flex flex-col w-full h-full items-center justify-start gap-y-5 p-4">
            {(editsubidx !== -1 || isAddNew) && (
              <Button
                className="self-start shadow-md hover:shadow-lg transition-all duration-200"
                color="danger"
                variant="flat"
                size="sm"
                startContent={<BackArrowIcon />}
                onClick={() => handleBackEditSubStock()}
              >
                Back
              </Button>
            )}
            <div className="w-full flex flex-col items-center gap-3">
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                {edit === -1 ? "Select Variant Options" : "Manage Stock"}
              </h3>
              {lowstock !== 0 && edit !== -1 && (
                <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-2 border-red-400 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg animate-pulse">
                    <WarningIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-red-900 text-lg font-bold">
                      Low Stock Alert
                    </span>
                    <span className="text-red-700 text-sm font-medium">
                      {lowstock} item{lowstock > 1 ? "s" : ""} need
                      {lowstock === 1 ? "s" : ""} attention
                    </span>
                  </div>
                </div>
              )}
            </div>

            {edit === -1 || isAddNew || editsubidx !== -1 ? (
              <div className="variantlist relative rounded-2xl flex flex-col items-center justify-start gap-y-6 w-full h-full max-h-[60vh] p-8 overflow-y-auto bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 border-2 border-gray-200/60 shadow-2xl backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                {product.Variant?.map((item, idx) => {
                  return (
                    <Multiselect
                      key={item.id}
                      id={idx}
                      type={item.option_type}
                      isOptional={item.optional}
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
              product.Stock && (
                <div className="editstock_container w-full h-fit flex flex-row flex-wrap items-start justify-center gap-5 pt-5">
                  <RenderStockCards
                    handleDeleteSubStock={handleDeleteSubStock}
                    handleSubStockClick={handleSubStockClick}
                    edit={edit}
                  />
                </div>
              )
            )}
            <div className="w-[60%] min-w-[300px] flex flex-col gap-x-4">
              {(edit === -1 || isAddNew || editsubidx !== -1) && (
                <Input
                  label="Quantity"
                  labelPlacement="outside"
                  type="number"
                  fullWidth
                  size="lg"
                  className="h-14"
                  value={stock}
                  onChange={handleStockChange}
                  classNames={{
                    input: "text-xl font-bold",
                    label: "font-semibold text-base",
                    inputWrapper:
                      "shadow-md hover:shadow-lg transition-shadow duration-200 border-2 border-gray-200 hover:border-blue-400",
                  }}
                />
              )}
              {edit !== -1 && (
                <Button
                  className="h-14 font-bold text-base shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                  fullWidth
                  startContent={<PlusIcon />}
                  isLoading={loading}
                  variant="shadow"
                  color={isAddNew ? "success" : "primary"}
                  onClick={() =>
                    editsubidx === -1
                      ? handleAddNewSubStock()
                      : handleUpdateSubStock(editsubidx)
                  }
                >
                  {editsubidx !== -1 ? "Update Stock" : "Add New Stock"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="selectvariaint_container flex flex-col items-center justify-start gap-y-8 w-full h-full p-4">
            {/**Stock list */}
            <div className="liststock_container flex flex-row flex-wrap gap-6 w-[95%] h-fit p-6 max-h-[46vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 shadow-2xl border-2 border-gray-200/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              {((product.Stock && product.Stock.length === 0) ||
                !product.Stock) &&
                !isloading && (
                  <div className="w-full rounded-2xl bg-gradient-to-br from-blue-100/50 via-purple-50/50 to-pink-100/50 border-3 border-dashed border-gray-400/50 p-12 flex flex-col items-center gap-5 backdrop-blur-sm shadow-inner hover:border-gray-500 transition-all duration-300 group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <VariantStockIcon className="w-14 h-14 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                      No Stock Available
                    </h3>
                    <p className="text-base text-gray-600 font-medium text-center max-w-md">
                      Create your first stock entry to get started and manage
                      your inventory
                    </p>
                  </div>
                )}
              {isloading ? (
                <NormalSkeleton
                  style={{ flexDirection: "row" }}
                  count={3}
                  width="220px"
                  height="50px"
                />
              ) : (
                product.Stock &&
                product.Stock.map((i, idx) => {
                  const lowStockCount = CountLowStock(i);
                  return (
                    <div
                      key={idx}
                      className={`stockcard relative w-[260px] h-[100px] flex flex-col items-start justify-center p-5 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl transform hover:scale-[1.05] hover:-translate-y-1 group ${
                        i.isLowStock
                          ? "bg-gradient-to-br from-red-100 via-orange-50 to-red-50 border-2 border-red-400 hover:border-red-500 ring-2 ring-red-200"
                          : "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {i.isLowStock && (
                        <div className="absolute top-2 right-2 animate-bounce">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                            <WarningIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md group-hover:scale-125 transition-transform duration-300"></div>
                          <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-gray-800 transition-colors">
                            Stock #{idx + 1}
                          </h3>
                        </div>
                        {lowStockCount > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white shadow-md">
                            <WarningIcon className="w-3 h-3" />
                            <span className="text-xs font-bold">
                              {lowStockCount}
                            </span>
                          </div>
                        )}
                      </div>
                      {lowStockCount > 0 && (
                        <p className="text-xs text-red-600 font-semibold mb-2">
                          {lowStockCount} item{lowStockCount > 1 ? "s" : ""} low
                        </p>
                      )}
                      <div className="action w-full flex flex-row items-center gap-3">
                        <button
                          onClick={() => handleEdit(idx)}
                          className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all duration-200 hover:from-blue-600 hover:to-blue-700 active:scale-95 shadow-md hover:shadow-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                          aria-label={`Edit stock #${idx + 1}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStock(idx)}
                          className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white transition-all duration-200 hover:from-red-600 hover:to-red-700 active:scale-95 shadow-md hover:shadow-xl focus:ring-2 focus:ring-red-400 focus:outline-none"
                          aria-label={`Delete stock #${idx + 1}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              className="w-[90%] h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-4 shadow-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 relative overflow-hidden group focus:ring-4 focus:ring-purple-300 focus:outline-none"
              onClick={() => {
                if (!product.Variant) {
                  errorToast("Please Create Variant");
                  return;
                }
                setadded(1);
                setnew("stockinfo");
              }}
              aria-label="Add new stock"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <PlusIcon className="w-7 h-7 relative z-10" />
              <span className="relative z-10">Add New Stock</span>
            </button>

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
  price?: number;
  qty?: number;
  setprice?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setqty?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

export const ColorSelectModal = React.memo(
  ({
    handleAddColor,
    edit,
    setedit,
    color,
    setcolor,
    name,
    open,
    setopen,
    price,
    qty,
    setprice,
    setqty,
  }: ColorSelectModal) => {
    const [colorpicker, setcolorpicker] = useState(false);
    const { isMobile } = useScreenSize();

    // Memoized handlers
    const handleOpenColorPicker = React.useCallback(() => {
      setedit(-1);
      setcolor(Colorinitalize);
      setopen(true);
    }, [setedit, setcolor, setopen]);

    const handleClose = React.useCallback(() => {
      setedit(-1);
      setopen(false);
    }, [setedit, setopen]);

    const handleConfirm = React.useCallback(() => {
      handleAddColor();
      setopen(false);
    }, [handleAddColor, setopen]);

    const handleNameChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setcolor(e.target.value as string);
      },
      [setcolor],
    );

    const handlePriceChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setprice?.(value ? parseFloat(value) : undefined);
      },
      [setprice],
    );

    const handleQtyChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setqty?.(value ? parseInt(value, 10) : undefined);
      },
      [setqty],
    );

    const openColorPickerModal = React.useCallback(() => {
      setcolorpicker(true);
    }, []);

    const closeColorPickerModal = React.useCallback(() => {
      setcolorpicker(false);
    }, []);

    const handleCirclePickerChange = React.useCallback(
      (value: any) => {
        setcolor({ hex: value.hex, rgb: value.rgb as any });
      },
      [setcolor],
    );

    const handleChromePickerChange = React.useCallback(
      (val: any) => {
        setcolor({ hex: val.hex, rgb: val.rgb });
      },
      [setcolor],
    );

    const handleHexCodeChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Regular expression to validate hex color code (#RRGGBB or #RGB)
        const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);

        if (!isValidHex) {
          errorToast("Invalid hexcode");
          return;
        }

        setcolor({
          rgb: { r: 0, g: 0, b: 0 },
          hex: value,
        });
      },
      [setcolor],
    );

    const buttonClassName = React.useMemo(
      () =>
        `px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${
          open
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-2xl hover:scale-110 active:scale-95 shadow-lg hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
        }`,
      [open],
    );

    const buttonText = React.useMemo(
      () => (edit === -1 ? "Confirm" : "Update"),
      [edit],
    );

    const priceValue = React.useMemo(() => price?.toString() ?? "", [price]);

    const qtyValue = React.useMemo(() => qty?.toString() ?? "", [qty]);

    const priceStartContent = React.useMemo(
      () => (
        <div className="pointer-events-none flex items-center">
          <span className="text-default-400 text-small">$</span>
        </div>
      ),
      [],
    );
    return (
      <>
        <button
          onClick={handleOpenColorPicker}
          className={buttonClassName}
          disabled={open}
        >
          <span className="flex items-center gap-3">
            <AddIcon />
            Add Color
          </span>
        </button>
        {open && (
          <SecondaryModal
            open={open}
            size={isMobile ? "full" : "3xl"}
            placement={isMobile ? "top" : "center"}
            onPageChange={handleClose}
            closebtn
            footer={() => {
              return (
                <PrimaryButton
                  text={buttonText}
                  type="button"
                  onClick={handleConfirm}
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
                onChange={handleNameChange}
                value={name}
                required
              />

              <div className="w-full flex flex-row gap-3">
                <Input
                  type="number"
                  fullWidth
                  size="lg"
                  label="Price (Optional)"
                  placeholder="0.00"
                  value={priceValue}
                  onChange={handlePriceChange}
                  startContent={priceStartContent}
                />
                <Input
                  type="number"
                  fullWidth
                  size="lg"
                  label="Quantity (Optional)"
                  placeholder="0"
                  value={qtyValue}
                  onChange={handleQtyChange}
                  min="0"
                />
              </div>

              <label
                htmlFor="color"
                className="font-semibold text-sm w-full text-left"
              >
                Color
                <strong className="text-red-400 text-lg font-normal">*</strong>
              </label>
              <div
                onClick={openColorPickerModal}
                className="w-full h-24 relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl border-4 border-gray-300 hover:border-blue-500 hover:scale-[1.02]"
              >
                <div
                  className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                    <svg
                      className="w-7 h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {colorpicker && (
                <SecondaryModal
                  onPageChange={setcolorpicker}
                  footer={() => {
                    return (
                      <PrimaryButton
                        text="Close"
                        color="lightcoral"
                        type="button"
                        radius="10px"
                        onClick={closeColorPickerModal}
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
                  <div className="w-full h-full flex flex-col items-center gap-y-8 justify-center p-6 bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-pink-50/60 rounded-2xl">
                    <div className="w-full h-fit flex flex-col gap-6 items-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-gray-200">
                      <CirclePicker
                        color={color.hex}
                        onChange={handleCirclePickerChange}
                      />
                      <ChromePicker
                        color={color.hex}
                        onChange={handleChromePickerChange}
                        disableAlpha
                      />
                    </div>

                    <Input
                      className="w-full h-[40px] max-small_phone:text-2xl text-lg"
                      type="text"
                      label="Hex Code"
                      value={color.hex}
                      size="lg"
                      onChange={handleHexCodeChange}
                    />
                  </div>
                </SecondaryModal>
              )}
            </form>
          </SecondaryModal>
        )}
      </>
    );
  },
);
