import {
  useGlobalContext,
  VariantColorValueType,
  Varianttype,
} from "@/src/context/GlobalContext";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import PrimaryButton from "../Button";
import {
  ArraysAreEqualSets,
  Colorinitalize,
  Colortype,
  Variantcontainertype,
} from "./VariantModal";
import { errorToast } from "../Loading";
import Modal from "../Modals";
import { SketchPicker } from "react-color";
import { Badge, Button, Input } from "@nextui-org/react";
import { StockCard, StockSelect } from "./Stock";
import { HasPartialOverlap } from "@/src/lib/utilities";
import { useScreenSize } from "@/src/context/CustomHook";

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
  handleUpdateStock: (isAddnew?: boolean) => void;
  editsubidx: number;
  seteditsubidx: React.Dispatch<React.SetStateAction<number>>;
  setadded: React.Dispatch<React.SetStateAction<number>>;
  isAddNew: boolean;
  setisAddNew: React.Dispatch<React.SetStateAction<boolean>>;
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
  handleUpdateStock,
  editsubidx,
  seteditsubidx,
  setadded,
  isAddNew,
  setisAddNew,
}: ManageStockContainerProps) {
  const { product, setproduct } = useGlobalContext();
  const [lowstock, setlowstock] = useState(0);

  const countLowStock = () => {
    let totallowstock = 0;

    product.varaintstock?.forEach((stock) => {
      stock.Stockvalue.forEach((i) => {
        if (i.qty <= 5) {
          totallowstock += 1;
        }
      });
    });

    setlowstock(totallowstock);
  };

  useEffect(() => {
    countLowStock();
  }, [product]);

  const handleSelectVariant = (value: Set<string>, label: string) => {
    setselectedstock((prevSelectedStock) => {
      const updatedStock = { ...prevSelectedStock };

      updatedStock[label] = Array.from(value);

      return updatedStock;
    });
  };

  const handleEdit = (idx: number) => {
    //extract reponsible stock value for selected value
    if (product.varaintstock && product.variants) {
      const createdstock = groupSelectedValue(
        product.varaintstock[idx].Stockvalue.map((i) => i.variant_val),
        product.variants
      );
      setselectedstock(createdstock as any);
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

  const handleUpdateSubStock = (idx: number) => {
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

    setproduct((prev) => ({ ...prev, varaintstock: stockArray }));
    seteditsubidx(-1);
    setstock("");
    setselectedstock(undefined);
  };

  const RenderStockCards = () => {
    if (!product || !product.variants) return null;

    const { variants, varaintstock } = product;
    const stockValues = varaintstock && varaintstock[edit].Stockvalue;

    return stockValues?.map((i, idx) => (
      <Badge
        content="-"
        color="danger"
        onClick={() => handleDeleteSubStock(idx)}
      >
        <div
          onClick={() => {
            handleSubStockClick(i.variant_val, i.qty.toString(), idx);
          }}
          style={i.qty <= 5 ? { border: "3px solid lightcoral" } : {}}
          className="w-fit h-fit flex flex-col gap-y-3 rounded-lg p-2 border-2 border-gray-300 cursor-pointer transition-colors hover:border-gray-500 active:border-black"
        >
          {i.variant_val.map((item, idx) => {
            const variant = variants[idx];
            const isColor = variant?.option_type === "COLOR";
            const colorValues =
              variant?.option_value as VariantColorValueType[];

            const selectedValue = isColor
              ? colorValues?.find((color) => color.val === item)
              : undefined;

            return (
              <StockCard
                key={`${i.variant_val}-${idx}`}
                label={isColor ? selectedValue?.name ?? "" : item}
                color={selectedValue ? selectedValue.val : undefined}
              />
            );
          })}
        </div>
      </Badge>
    ));
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

            {lowstock !== 0 && (
              <div className="text-red-500 text-sm font-medium">
                Low Stock: {lowstock}
              </div>
            )}

            {edit === -1 || isAddNew || editsubidx !== -1 ? (
              <div className="variantlist relative border-b-0 border-2 border-gray-300 rounded-lg flex flex-col items-center justify-start gap-y-5 w-[90%] h-full max-h-[60vh] p-5 overflow-y-auto">
                {product.variants?.map((item, idx) => {
                  return (
                    <StockSelect
                      key={idx}
                      id={item.id}
                      data={{
                        type: item.option_type,
                        value: item.option_value,
                      }}
                      label={item.option_title}
                      onSelect={(e) =>
                        handleSelectVariant(e, item.option_title)
                      }
                      value={selectedstock[item.option_title] ?? []}
                    />
                  );
                })}
              </div>
            ) : (
              product.varaintstock && (
                <div className="editstock_container w-full h-fit flex flex-row flex-wrap items-start justify-center gap-5 pt-5">
                  <RenderStockCards />
                </div>
              )
            )}
            <div className="w-[50%] h-[40px] absolute bottom-3 flex flex-row gap-x-3">
              {edit !== -1 && (
                <Button
                  className="h-full"
                  fullWidth
                  startContent={<div className="font-light text-3xl"> + </div>}
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
                      i.isLowStock
                        ? { borderRight: "5px solid lightcoral" }
                        : {}
                    }
                    className="stockcard w-full h-[50px] flex flex-row items-center justify-evenly p-2 outline outline-2 outline-gray-300 rounded-lg transition duration-200 hover:bg-gray-300"
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
  const { isTablet, isMobile } = useScreenSize();
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
        <Modal
          closestate="none"
          customwidth={isTablet ? "50vw" : isMobile ? "90vw" : "30vw"}
          customheight="30vh"
        >
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
                  width={isTablet || isMobile ? "90vw" : "29vw"}
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
