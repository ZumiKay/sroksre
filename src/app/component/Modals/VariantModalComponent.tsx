import { Stocktype, useGlobalContext } from "@/src/context/GlobalContext";
import React, { ChangeEvent, FormEvent, useState } from "react";
import PrimaryButton, { ColorSelect } from "../Button";
import { Variantcontainertype } from "./VariantModal";
import { errorToast } from "../Loading";
import Modal from "../Modals";
import { RGBColor, SketchPicker } from "react-color";

interface ManageStockContainerProps {
  newadd: string;
  stock: string;
  setstock: React.Dispatch<React.SetStateAction<string>>;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  setnew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
  setaddstock: React.Dispatch<React.SetStateAction<number>>;
  edit: number;
  addstock: number;
}

function generateCombinations(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];

  const [first, ...rest] = arrays;
  const restCombinations = generateCombinations(rest);

  return first.flatMap((value) =>
    restCombinations.map((combination) => [value, ...combination])
  );
}
export function ManageStockContainer({
  newadd,
  setedit,
  edit,
  stock,
  setstock,
  addstock,
  setnew,
  setaddstock,
}: ManageStockContainerProps) {
  const { product, setproduct } = useGlobalContext();
  const [selectedvalues, setselectedvalues] = useState<{
    [key: string]: string[];
  }>({
    initial: [],
  });

  const handleStock = (e: ChangeEvent<HTMLInputElement>) => {
    let { value, name } = e.target;
    value = value.length === 0 ? "" : value;
    let updateProduct = { ...product };
    let stock = updateProduct.varaintstock;
    const idx = edit === -1 ? addstock : edit;
    if (name === "stock") {
      if (stock) {
        stock[idx].qty = parseInt(value);
      }
      setstock(value);
    }
    setproduct((prev) => ({ ...prev, varaintstock: stock }));
  };
  const handleCreateVariantStock = () => {
    if (!selectedvalues) {
      errorToast("Please Select Variant");
      return;
    }
    const Stock = [...(product.varaintstock ?? [])];

    const stock_values = generateCombinations(Object.values(selectedvalues));
    Stock.push({
      variant_val: stock_values,
      qty: parseInt(stock),
    });
    setaddstock(stock_values.length - 1);
    setstock("");
    setproduct((prev) => ({ ...prev, varaintstock: Stock }));
  };

  const handleBack = () => {
    edit !== -1 && setedit(-1);
    setnew("stock");
  };

  return (
    <div className="stock_container w-full h-fit">
      {newadd === "stockinfo" ? (
        <div className="createstock_container flex flex-col w-full h-full items-center justify-start mt-2">
          <h2 className="text-lg font-medium">Please Choose Variants</h2>
          <div className="variantlist relative outline outline-2 outline-gray-300 rounded-lg flex flex-col items-center justify-start gap-y-10 w-[90%] h-full max-h-[60vh] p-5 overflow-y-auto">
            {product.variants &&
              product.variants.map((i, idx) => (
                <ColorSelect
                  key={i.option_title}
                  index={idx}
                  type={i.option_type}
                  label={i.option_title}
                  width="80%"
                  height="35px"
                  data={i.option_value}
                  edit={edit}
                  added={addstock}
                  selectedvalue={selectedvalues}
                  setselectedvalue={setselectedvalues}
                />
              ))}
          </div>
          <div className="w-[90%] absolute bottom-3 flex flex-row gap-x-3">
            <input
              className="stock w-[100%] text-sm bottom-3 font-medium p-2 h-[40px] rounded-lg outline outline-1 outline-black"
              name="stock"
              placeholder="Stock"
              type="number"
              value={stock}
              onChange={handleStock}
            />
          </div>
        </div>
      ) : (
        <div className="selectvariaint_container flex flex-col items-center justify-start gap-y-10 w-full h-full">
          <div className="liststock_container grid grid-cols-3 gap-5 w-[90%] h-fit p-1 max-h-[46vh] overflow-y-auto">
            {(product.varaintstock?.length === 0 || !product.varaintstock) && (
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
                      onClick={() => {
                        //Edit Stock
                        setedit(idx);
                        setstock(i.qty.toString());
                        setnew("stockinfo");
                      }}
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
              setnew("stockinfo");
            }}
          />

          {/*  */}
        </div>
      )}
    </div>
  );
}

interface ColorSelectModal {
  handleAddColor: (e: FormEvent<HTMLFormElement>) => void;
  edit: number;
  openmodal: boolean;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  handleDeleteVaraint: (idx: number) => void;
}
interface colortype {
  hex: string;
  rgb: RGBColor;
}
const colorinitalize: colortype = {
  hex: "#f5f5f5",
  rgb: {
    r: 245,
    g: 245,
    b: 245,
    a: 1,
  },
};
export const ColorSelectModal = ({
  handleAddColor,
  edit,
  setedit,
  handleDeleteVaraint,
  openmodal,
}: ColorSelectModal) => {
  const [open, setopen] = useState(openmodal);
  const [color, setcolor] = useState<colortype>(colorinitalize);
  return (
    <>
      <div
        onClick={() => {
          setedit(-1);
          setcolor(colorinitalize);
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
                setopen(true);
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
            <PrimaryButton
              text={edit === -1 ? "Confirm" : "Update"}
              type="submit"
              disable={color.hex === ""}
              width="100%"
              textsize="13px"
              radius="10px"
              height="35px"
            />
            <div className="action-btn flex flex-row w-full gap-x-3">
              {edit !== -1 && (
                <PrimaryButton
                  text="Delete"
                  color="lightcoral"
                  type="button"
                  onClick={() => {
                    handleDeleteVaraint(edit);
                    setopen(false);
                  }}
                  width="100%"
                  textsize="12px"
                  radius="10px"
                  height="35px"
                />
              )}
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
            {open && (
              <div className="absolute w-fit h-fit top-0">
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
                    setopen(false);
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
