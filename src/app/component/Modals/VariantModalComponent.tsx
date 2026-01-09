import { Stocktype, useGlobalContext } from "@/src/context/GlobalContext";
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
import {
  SliderPicker,
  CirclePicker,
  Checkboard,
  ChromePicker,
} from "react-color";
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
        product.Variant as any
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
      setisAddNew(false);
      handleUpdateStock(isAddNew);
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
    const stockArray = [...(product.Stock ?? [])];
    let updatestockvalue = stockArray[edit];

    const stockValues = MapSelectedValuesToVariant(
      selectedstock,
      product.Variant?.map((i) => i.option_title) ?? []
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
        (arr) => arr && arr.length > 0
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
        (arr) => arr && arr.length > 0
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
                className="self-start"
                color="danger"
                variant="flat"
                size="sm"
                startContent={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                }
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
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-red-100 via-orange-50 to-red-50 border-l-4 border-red-500 shadow-lg animate-pulse backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-red-800 text-base font-bold">
                    Low Stock Alert: {lowstock} item{lowstock > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {edit === -1 || isAddNew || editsubidx !== -1 ? (
              <div className="variantlist relative rounded-2xl flex flex-col items-center justify-start gap-y-6 w-full h-full max-h-[60vh] p-8 overflow-y-auto bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 border-2 border-gray-200/60 shadow-2xl backdrop-blur-sm">
                {product.Variant?.map((item, idx) => {
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
            <div className="w-[60%] min-w-[300px] flex flex-row gap-x-4">
              {edit !== -1 && (
                <Button
                  className="h-14 font-bold text-base shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                  fullWidth
                  startContent={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  }
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
            </div>
          </div>
        ) : (
          <div className="selectvariaint_container flex flex-col items-center justify-start gap-y-8 w-full h-full p-4">
            <div className="liststock_container flex flex-row flex-wrap gap-6 w-[95%] h-fit p-6 max-h-[46vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 shadow-2xl border-2 border-gray-200/50 backdrop-blur-sm">
              {((product.Stock && product.Stock.length === 0) ||
                !product.Stock) && (
                <div className="w-full rounded-2xl bg-gradient-to-br from-blue-100/50 via-purple-50/50 to-pink-100/50 border-3 border-dashed border-gray-400/50 p-12 flex flex-col items-center gap-4 backdrop-blur-sm shadow-inner hover:border-gray-500 transition-all duration-300">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-extrabold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    No Stock Available
                  </h3>
                  <p className="text-base text-gray-600 font-medium">
                    Create your first stock entry to get started
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
                product.Stock.map((i, idx) => (
                  <div
                    key={idx}
                    className={`stockcard relative w-[260px] h-[90px] flex flex-col items-start justify-center p-5 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl transform hover:scale-[1.08] hover:-translate-y-1 ${
                      i.isLowStock
                        ? "bg-gradient-to-br from-red-100 via-orange-50 to-red-50 border-2 border-red-400 hover:border-red-500"
                        : "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {i.isLowStock && (
                      <div className="absolute top-2 right-2 animate-bounce">
                        <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-sm"></div>
                      <h3 className="text-lg font-extrabold text-gray-900">
                        Stock #{idx + 1}
                      </h3>
                    </div>
                    <div className="action w-full flex flex-row items-center gap-3">
                      <button
                        onClick={() => handleEdit(idx)}
                        className="flex-1 px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all duration-200 hover:from-blue-600 hover:to-blue-700 active:scale-95 shadow-md hover:shadow-lg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStock(idx)}
                        className="flex-1 px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white transition-all duration-200 hover:from-red-600 hover:to-red-700 active:scale-95 shadow-md hover:shadow-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="w-[90%] h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-4 shadow-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 relative overflow-hidden group"
              onClick={() => {
                if (!product.Variant) {
                  errorToast("Please Create Variant");
                  return;
                }
                setadded(1);
                setnew("stockinfo");
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <svg
                className="w-7 h-7 relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
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
      <button
        onClick={() => {
          setedit(-1);
          setcolor(Colorinitalize);
          setopen(true);
        }}
        className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${
          open
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-2xl hover:scale-110 active:scale-95 shadow-lg hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
        }`}
        disabled={open}
      >
        <span className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          Add Color
        </span>
      </button>
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
              Color
              <strong className="text-red-400 text-lg font-normal">*</strong>
            </label>
            <div
              onClick={() => {
                setcolorpicker(true);
              }}
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
                <div className="w-full h-full flex flex-col items-center gap-y-8 justify-center p-6 bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-pink-50/60 rounded-2xl">
                  <div className="w-full h-fit flex flex-col gap-6 items-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-gray-200">
                    <CirclePicker
                      color={color.hex}
                      onChange={(value) => {
                        setcolor({
                          hex: value.hex,
                          rgb: value.rgb as any,
                        });
                      }}
                    />
                    <ChromePicker
                      color={color.hex}
                      onChange={(val) =>
                        setcolor({ hex: val.hex, rgb: val.rgb })
                      }
                      disableAlpha
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
