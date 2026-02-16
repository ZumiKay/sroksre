"use client";

import { Badge, Button, Input } from "@heroui/react";
import Modal from "../../Modals";
import { SelectionCustom } from "../../Pagination_Component";
import { ChangeEvent, useState } from "react";
import { RGBColor, SketchPicker } from "react-color";
import PrimaryButton from "../../Button";
import { errorToast } from "../../Loading";
import { CreateVariantTemplate, VariantTemplateType } from "./Action";
import { ApiRequest } from "@/src/context/CustomHook";
import { Varianttype, VariantValueObjType } from "@/src/types/product.type";

interface TemplateContainerProps {
  data?: {
    id?: number;
    val: string;
    name?: string;
    type: string;
  }[];
  edit?: boolean;
  color?: boolean;
  group?: boolean;
  onItemsClick?: (id: number) => void;
  onItemsDelete?: (id: number) => void;
}
export default function TemplateContainer({
  data,
  edit,
  onItemsClick,
  onItemsDelete,
  color,
  group,
}: TemplateContainerProps) {
  const groupedData = data?.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as { [key: string]: typeof data },
  );
  return (
    <div className="w-full h-fit flex flex-row justify-start gap-5 flex-wrap">
      {!data ? (
        <div className="w-full rounded-xl bg-linear-to-r from-gray-100 to-gray-50 border-2 border-dashed border-gray-300 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-500">
              No Templates
            </h3>
            <p className="text-sm text-gray-400">
              Create your first template to get started
            </p>
          </div>
        </div>
      ) : group ? (
        groupedData &&
        Object.keys(groupedData).map((optionType, groupIdx) => (
          <div key={groupIdx} className="w-full">
            <h3 className="text-xl font-bold mb-4 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {optionType}
            </h3>
            <div className="w-full h-fit flex flex-row justify-start gap-4 flex-wrap">
              {groupedData[optionType].map((item, idx) => (
                <Badge
                  key={idx}
                  onClick={() =>
                    onItemsDelete && onItemsDelete(item.id as number)
                  }
                  content={"-"}
                  isInvisible={edit}
                  color="danger"
                >
                  {color ? (
                    <div
                      className={`w-fit min-w-[140px] h-[56px] rounded-xl flex flex-row justify-start items-center gap-x-3 cursor-pointer px-4 py-2 transition-all duration-300 bg-linear-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg active:scale-95 hover:scale-105`}
                      onClick={() => onItemsClick && onItemsClick(idx)}
                    >
                      {/* Display created Color */}
                      <div
                        className="color w-[36px] h-[36px] rounded-full shadow-md border-3 border-white ring-2 ring-gray-200"
                        style={{ backgroundColor: item.val }}
                      ></div>
                      {item.name && (
                        <p className="w-fit h-fit text-base font-semibold text-gray-800">
                          {item.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() =>
                        onItemsClick && onItemsClick(item.id as number)
                      }
                      className="template bg-linear-to-br from-gray-100 to-gray-200 rounded-xl px-4 py-2.5 cursor-pointer transition-all duration-300 hover:from-blue-100 hover:to-purple-100 hover:shadow-lg active:scale-95 hover:scale-105 border-2 border-gray-300 hover:border-blue-400 font-semibold text-gray-800"
                    >
                      {item.val}
                    </div>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="w-full h-fit flex flex-row justify-start gap-5 flex-wrap">
          {data.map((i, idx) => (
            <Badge
              key={idx}
              onClick={() => onItemsDelete && onItemsDelete(idx)}
              content={"-"}
              isInvisible={edit}
              color="danger"
            >
              {color ? (
                <div
                  className={`w-fit min-w-[140px] h-[56px] rounded-xl flex flex-row justify-start items-center gap-x-3 cursor-pointer px-4 py-2 transition-all duration-300 bg-linear-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg active:scale-95 hover:scale-105`}
                  onClick={() => onItemsClick && onItemsClick(idx)}
                >
                  {/* Display created Color */}
                  <div
                    className="color w-[36px] h-[36px] rounded-full shadow-md border-3 border-white ring-2 ring-gray-200"
                    style={{ backgroundColor: i.val }}
                  ></div>
                  {i.name && (
                    <p className="w-fit h-fit text-base font-semibold text-gray-800">
                      {i.name}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => onItemsClick && onItemsClick(idx)}
                  className="template bg-linear-to-br from-gray-100 to-gray-200 rounded-xl px-4 py-2.5 cursor-pointer transition-all duration-300 hover:from-blue-100 hover:to-purple-100 hover:shadow-lg active:scale-95 hover:scale-105 border-2 border-gray-300 hover:border-blue-400 font-semibold text-gray-800"
                >
                  {i.val}
                </div>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const Templatetypedata = [
  {
    label: "Text",
    value: "TEXT",
  },
  {
    label: "Color",
    value: "COLOR",
  },
];
interface colortype {
  hex: string;
  rgb?: RGBColor;
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
interface AddTemplateModalProps {
  close: () => void;
  refresh?: () => void;
  data?: VariantTemplateType;
  setSuccessMessage?: React.Dispatch<React.SetStateAction<string>>;
}

const VariantInitialize = {
  id: 0,
  option_title: "",
  option_type: "" as any,
  option_value: [],
};
export const AddTemplateModal = ({
  close,
  refresh,
  data,
  setSuccessMessage,
}: AddTemplateModalProps) => {
  const [option, setoption] = useState("");
  const [loading, setloading] = useState(false);
  const [step, setstep] = useState("");
  const [templatetype, settemplatetype] = useState<"COLOR" | "TEXT" | "">(
    data ? (data.variant?.option_type as any) : "",
  );
  const [open, setopen] = useState(false);
  const [opencolor, setopencolor] = useState(false);
  const [color, setcolor] = useState<colortype>(colorinitalize);
  const [colorname, setcolorname] = useState("");
  const [edit, setedit] = useState(-1);
  const [variant, setvariant] = useState<
    Pick<Varianttype, "id" | "option_title" | "option_value" | "option_type">
  >(data ? (data.variant as any) : VariantInitialize);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setvariant((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeType = (val: string) => {
    setvariant((prev) => ({ ...prev, option_value: [] }));
    settemplatetype(val as any);
  };

  const handleAddOption = () => {
    const updatevariant = [...variant.option_value];
    const value =
      templatetype === "TEXT" ? option : { val: color.hex, name: colorname };

    if (templatetype === "TEXT" && option.length === 0) {
      return;
    }
    if (updatevariant.includes(option)) {
      errorToast("Option exist");
      return;
    }

    if (edit !== -1) {
      updatevariant[edit] = value;
      setedit(-1);
    } else {
      updatevariant.push(value);
    }
    setoption("");
    setcolorname("");
    setvariant((prev) => ({ ...prev, option_value: updatevariant }));
  };

  const handleDeleteOption = (idx: number) => {
    const deletedvariant = [...variant.option_value];
    deletedvariant.splice(idx, 1);
    setvariant((prev) => ({ ...prev, option_value: deletedvariant }));
  };

  const handleAddTemplate = async () => {
    if (step === "") {
      if (templatetype === "" || variant.option_title === "") {
        errorToast("Please fill all require info");
        return;
      }
      setstep("create");
    } else {
      setloading(true);

      if (data) {
        const updatedvariant = { ...variant, option_type: templatetype };
        const updatereq = await ApiRequest(
          "/api/products/variant/template",
          undefined,
          "PUT",
          "JSON",
          { id: data.id, variant: updatedvariant },
        );
        setloading(false);

        if (!updatereq.success) {
          errorToast("Error occured");
          return;
        }
        if (setSuccessMessage) {
          setSuccessMessage(`${variant.option_title} updated`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }
        refresh && refresh();
        close();
        return;
      }
      const res = CreateVariantTemplate.bind(null, {
        name: variant.option_title,
        variant: { ...variant, option_type: templatetype as any },
      });

      const create = await res();
      setloading(false);
      if (!create.success) {
        errorToast("Error Occured");
        return;
      }
      if (setSuccessMessage) {
        setSuccessMessage(`${variant.option_title} created`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
      setvariant(VariantInitialize);
      settemplatetype("");
      setstep("");
      setopen(false);
      setedit(-1);
      refresh && refresh();
    }
  };

  const handleClose = () => {
    if (step !== "") {
      setopen(false);
      setstep("");
      return;
    }
    close();
  };
  return (
    <Modal
      closestate="none"
      customwidth="20%"
      minwidth="280px"
      customheight="600px"
    >
      <div className="w-full h-full bg-linear-to-br from-blue-50/30 via-white to-purple-50/30 flex flex-col gap-y-6 p-6 relative rounded-2xl shadow-xl">
        <h3 className="text-2xl font-extrabold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Template
        </h3>
        {step === "" ? (
          <>
            <Input
              name="option_title"
              label={"Template Name"}
              value={variant.option_title}
              onChange={handleChange}
            />
            <SelectionCustom
              data={Templatetypedata}
              placeholder=""
              label="Type"
              value={templatetype}
              setvalue={settemplatetype as any}
              onChange={(val) => handleChangeType(val as string)}
            />
          </>
        ) : (
          <div className="w-full h-fit flex flex-col gap-y-6">
            <div className="w-full h-fit p-4 max-h-[150px] overflow-y-auto overflow-x-hidden rounded-xl bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 shadow-inner">
              {variant.option_value.length === 0 ? (
                <div className="w-full rounded-lg bg-linear-to-r from-gray-100 to-gray-50 border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
                  <p className="text-base font-semibold text-gray-500">
                    No Variants
                  </p>
                </div>
              ) : (
                <TemplateContainer
                  data={variant.option_value.map((i: any, idx) => ({
                    id: idx,
                    type: templatetype,
                    val: templatetype === "TEXT" ? i : i.val,
                    name: i?.name,
                  }))}
                  color={templatetype === "COLOR"}
                  onItemsDelete={handleDeleteOption}
                  onItemsClick={(id) => {
                    const val = templatetype === "COLOR" ? color.hex : option;
                    if (val === variant.option_value[id]) {
                      setedit(-1);
                      setoption("");
                    } else {
                      setopen(true);
                      setedit(id);

                      if (templatetype === "TEXT") {
                        setoption(variant.option_value[id] as string);
                      } else {
                        const colorval = variant.option_value[
                          id
                        ] as VariantValueObjType;
                        setcolor({ hex: colorval.val });
                      }
                    }
                  }}
                />
              )}
            </div>
            {!open && (
              <Button
                disabled={templatetype === ""}
                onClick={() => setopen(true)}
                color="primary"
                variant="bordered"
                fullWidth
              >
                Add Options
              </Button>
            )}
          </div>
        )}
        {open && (
          <div className="w-full h-fit flex flex-col gap-y-5 relative">
            {templatetype === "TEXT" ? (
              <>
                <Input
                  name="option"
                  label={"Option"}
                  size="sm"
                  value={option}
                  onChange={(e) => setoption(e.target.value)}
                />
              </>
            ) : (
              templatetype === "COLOR" && (
                <>
                  <div className="w-full h-fit flex flex-col gap-y-3">
                    <label className="text-base font-bold text-gray-800">
                      Color
                    </label>

                    <div
                      onClick={() => {
                        setopencolor(true);
                      }}
                      className={`w-full h-[60px] border-4 border-gray-300 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] active:scale-95 relative overflow-hidden group`}
                      style={{
                        backgroundColor: color.hex,
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <Input
                    type="text"
                    fullWidth
                    label="Name"
                    onChange={(e) => setcolorname(e.target.value)}
                    value={colorname}
                  />

                  {opencolor && (
                    <div className="absolute w-fit h-fit top-0 z-50">
                      {" "}
                      <SketchPicker
                        width="15vw"
                        color={color.hex}
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
                          setopencolor(false);
                        }}
                        width="100%"
                        textsize="10px"
                        height="30px"
                      />
                    </div>
                  )}
                </>
              )
            )}

            <div className="btn-1 w-full h-fit flex flex-row items-center gap-x-3">
              <Button
                onClick={() => handleAddOption()}
                fullWidth
                color="primary"
                variant="shadow"
                className="font-bold text-base h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {edit !== -1 ? "Update" : "Add"}
              </Button>
              <Button
                fullWidth
                onClick={() => setopen(false)}
                color="danger"
                variant="shadow"
                className="font-bold text-base h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        <div className="btn w-fit h-fit flex flex-row gap-x-3 absolute bottom-3 right-3">
          <Button
            className="font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #0097FA 0%, #667eea 100%)",
              color: "white",
              width: "110px",
              height: "44px",
            }}
            isLoading={loading}
            variant="solid"
            onClick={() => handleAddTemplate()}
          >
            {step === "create" ? (data ? "Update" : "Create") : "Next"}
          </Button>
          <Button
            className="font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
              color: "white",
              width: "110px",
              height: "44px",
            }}
            variant="solid"
            isDisabled={loading}
            onClick={() => handleClose()}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
