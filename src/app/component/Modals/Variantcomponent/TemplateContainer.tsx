"use client";
import { Button, Input } from "@heroui/react";
import { SecondaryModal } from "../../Modals";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { RGBColor, SketchPicker } from "react-color";
import { errorToast, successToast } from "../../Loading";
import { CreateVariantTemplate, VariantTemplateType } from "./Action";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  VariantColorValueType,
  Varianttype,
} from "@/src/context/GlobalType.type";
import { AsyncSelection } from "../../AsynSelection";
import { AddIcon, EditIcon } from "../../Asset";

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
  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return {};

    return data.reduce((acc, item) => {
      acc[item.type] = acc[item.type] || [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, { id?: number; val: string; name?: string }[]>);
  }, [data]);
  return (
    <div className="w-full h-fit py-2">
      {/* Empty State */}
      {!data && (
        <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-gray-200 rounded-lg bg-gray-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-gray-500 font-medium">No Templates Available</h3>
          <p className="text-gray-400 text-sm mt-1">
            Add templates to see them here
          </p>
        </div>
      )}

      {/* Grouped Data Display */}
      {data && group && groupedData && (
        <div className="space-y-6">
          {Object.keys(groupedData).map((optionType, groupIdx) => (
            <div key={groupIdx} className="option-group">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {optionType}
                </h3>
                <div className="ml-3 h-px bg-gray-200 flex-grow"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {groupedData[optionType].map((item, idx) => (
                  <div key={idx} className="relative group">
                    {!edit && (
                      <button
                        onClick={() =>
                          onItemsDelete && onItemsDelete(item.id as number)
                        }
                        className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center 
                              shadow-md transform transition-transform opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Delete item"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}

                    {color ? (
                      <div
                        onClick={() => onItemsClick && onItemsClick(idx)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 shadow-sm 
                             hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                      >
                        <div
                          className="w-8 h-8 rounded-full shadow-inner flex-shrink-0"
                          style={{
                            backgroundColor: item.val,
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                          }}
                        ></div>
                        {item.name && (
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {item.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() =>
                          onItemsClick && onItemsClick(item.id as number)
                        }
                        className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 
                              rounded-lg p-3 shadow-sm hover:shadow-md hover:border-blue-200 
                              transition-all cursor-pointer text-center"
                      >
                        <span className="text-gray-700 font-medium">
                          {item.val}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ungrouped Data Display */}
      {data && !group && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {data.map((item, idx) => (
            <div key={idx} className="relative group">
              {!edit && (
                <button
                  onClick={() => onItemsDelete && onItemsDelete(idx)}
                  className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center 
                        shadow-md transform transition-transform opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Delete item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}

              {color ? (
                <div
                  onClick={() => onItemsClick && onItemsClick(idx)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 shadow-sm 
                       hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-inner flex-shrink-0"
                    style={{
                      backgroundColor: item.val,
                      boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                    }}
                  ></div>
                  {item.name && (
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {item.name}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => onItemsClick && onItemsClick(idx)}
                  className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 
                        rounded-lg p-3 shadow-sm hover:shadow-md hover:border-blue-200 
                        transition-all cursor-pointer text-center"
                >
                  <span className="text-gray-700 font-medium">{item.val}</span>
                </div>
              )}
            </div>
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
  openstate: boolean;
  close?: () => void;
  refresh?: () => void;
  data?: VariantTemplateType;
}

const VariantInitialize: Varianttype = {
  id: 0,
  option_title: "",
  option_type: "",
  option_value: [],
};
export const AddTemplateModal = ({
  close,
  refresh,
  data,
  openstate,
}: AddTemplateModalProps) => {
  const [option, setoption] = useState("");
  const [loading, setloading] = useState(false);
  const [step, setstep] = useState("");
  const [templatetype, settemplatetype] = useState<"COLOR" | "TEXT" | "">(
    data ? (data.variant?.option_type as never) : ""
  );
  const [open, setopen] = useState(false);
  const [opencolor, setopencolor] = useState(false);
  const [color, setcolor] = useState<colortype>(colorinitalize);
  const [colorname, setcolorname] = useState("");
  const [edit, setedit] = useState(-1);
  const [variant, setvariant] = useState<
    Pick<Varianttype, "id" | "option_title" | "option_value" | "option_type">
  >(data ? (data.variant as Varianttype) : VariantInitialize);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setvariant((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeType = (val: string) => {
    setvariant((prev) => ({ ...prev, option_value: [] }));
    settemplatetype(val as never);
  };

  const handleAddOption = useCallback(() => {
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
  }, [variant.option_value, templatetype, option, color.hex, colorname, edit]);

  const handleDeleteOption = (idx: number) => {
    const deletedvariant = [...variant.option_value];
    deletedvariant.splice(idx, 1);
    setvariant((prev) => ({ ...prev, option_value: deletedvariant }));
  };

  const handleAddTemplate = useCallback(async () => {
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
        const updatereq = await ApiRequest({
          url: "/api/products/variant/template",
          method: "PUT",
          data: { id: data.id, variant: updatedvariant },
        });
        setloading(false);

        if (!updatereq.success) {
          errorToast("Error occured");
          return;
        }
        successToast(`${variant.option_title} updated`);
        if (refresh) refresh();
        if (close) close();
        return;
      }
      const res = CreateVariantTemplate.bind(null, {
        name: variant.option_title,
        variant: { ...variant, option_type: templatetype as never },
      });

      const create = await res();
      setloading(false);
      if (!create.success) {
        errorToast("Error Occured");
        return;
      }
      successToast(`${variant.option_title} created`);
      setvariant(VariantInitialize);
      settemplatetype("");
      setstep("");
      setopen(false);
      setedit(-1);
      if (refresh) refresh();
    }
  }, [step, templatetype, variant, data, refresh, close]);

  const handleClose = () => {
    if (step !== "") {
      setopen(false);
      setstep("");
      return;
    }
    if (close) close();
  };

  const handleItemClick = useCallback(
    (id: number) => {
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
          const colorval = variant.option_value[id] as VariantColorValueType;
          setcolor({ hex: colorval.val });
        }
      }
    },
    [color.hex, option, templatetype, variant.option_value]
  );
  return (
    <SecondaryModal
      placement="top"
      closebtn
      open={openstate}
      onPageChange={() => close && close()}
      size="md"
    >
      <div className="w-full bg-white rounded-lg flex flex-col gap-y-6 p-6 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-2xl font-bold text-gray-800">Template</h3>
          <Button
            isIconOnly
            variant="light"
            aria-label="Close"
            className="text-gray-500"
            onPress={() => handleClose()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>

        {/* Template Setup Step */}
        {step === "" && (
          <div className="space-y-5">
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                Start by naming your template and selecting a type.
              </p>
            </div>

            <Input
              name="option_title"
              label="Template Name"
              placeholder="Enter template name"
              value={variant.option_title}
              onChange={handleChange}
              variant="bordered"
              classNames={{
                input: "text-md",
                label: "text-md font-medium text-gray-700",
              }}
            />

            <AsyncSelection
              type="normal"
              data={() => Templatetypedata}
              option={{
                placeholder: "Select Type",
                label: "Template Type",
                selectedValue: [templatetype],
                onChange: (val) => handleChangeType(val.target.value as never),
                size: "md",
              }}
            />
          </div>
        )}

        {/* Template Options Step */}
        {step !== "" && (
          <div className="space-y-5">
            {/* Template Values Display */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">
                  Template Options
                </h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {templatetype}
                </span>
              </div>

              <div className="max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {variant.option_value.length === 0 ? (
                  <div className="w-full p-4 border border-dashed border-gray-300 rounded-lg bg-white text-center">
                    <p className="text-gray-500">No options added yet</p>
                  </div>
                ) : (
                  <TemplateContainer
                    data={
                      variant.option_value.map((i, idx) => ({
                        id: idx,
                        type: templatetype,
                        val:
                          templatetype === "TEXT"
                            ? i
                            : (i as VariantColorValueType).val,
                        name: (i as VariantColorValueType)?.name,
                      })) as never
                    }
                    color={templatetype === "COLOR"}
                    onItemsDelete={handleDeleteOption}
                    onItemsClick={handleItemClick}
                  />
                )}
              </div>
            </div>

            {/* Add Option Button */}
            {!open && (
              <Button
                disabled={templatetype === ""}
                onPress={() => setopen(true)}
                color="primary"
                variant="flat"
                fullWidth
                className="font-medium"
                startContent={<AddIcon />}
              >
                Add Options
              </Button>
            )}
          </div>
        )}

        {/* Add/Edit Option Form */}
        {open && (
          <div className="w-full border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4 relative">
            <h4 className="font-semibold text-gray-700 mb-1">
              {edit !== -1 ? "Update Option" : "Add New Option"}
            </h4>

            {templatetype === "TEXT" ? (
              <Input
                name="option"
                label="Option Text"
                placeholder="Enter option text"
                size="sm"
                value={option}
                onChange={(e) => setoption(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-md",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
            ) : (
              templatetype === "COLOR" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <div
                      onClick={() => setopencolor(true)}
                      className="w-full h-[50px] border-2 border-gray-200 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:border-gray-300"
                      style={{
                        backgroundColor: color.hex,
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                      }}
                    >
                      {!color.hex && (
                        <span className="text-gray-400">
                          Click to select a color
                        </span>
                      )}
                    </div>
                  </div>

                  <Input
                    type="text"
                    label="Color Name"
                    placeholder="e.g. Ruby Red, Ocean Blue"
                    onChange={(e) => setcolorname(e.target.value)}
                    value={colorname}
                    variant="bordered"
                    classNames={{
                      input: "text-md",
                      label: "text-sm font-medium text-gray-700",
                    }}
                  />

                  {opencolor && (
                    <div className="absolute right-4 top-16 z-50 shadow-xl rounded-lg overflow-hidden">
                      <div className="bg-white p-2">
                        <SketchPicker
                          width="250px"
                          color={color.hex}
                          onChange={(value) => {
                            setcolor({
                              hex: value.hex,
                              rgb: value.rgb as never,
                            });
                          }}
                        />
                        <Button
                          color="danger"
                          variant="flat"
                          className="mt-2"
                          fullWidth
                          size="sm"
                          onPress={() => setopencolor(false)}
                        >
                          Close Color Picker
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onPress={() => handleAddOption()}
                color="primary"
                variant="solid"
                className="flex-1"
                startContent={edit !== -1 ? <EditIcon /> : <AddIcon />}
              >
                {edit !== -1 ? "Update" : "Add"}
              </Button>
              <Button
                onPress={() => setopen(false)}
                color="default"
                variant="flat"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button
            color="primary"
            variant="solid"
            className="px-6"
            isLoading={loading}
            onPress={() => handleAddTemplate()}
          >
            {step === "create"
              ? data
                ? "Update Template"
                : "Create Template"
              : "Next Step"}
          </Button>
          <Button
            color="danger"
            variant="flat"
            className="px-6"
            isDisabled={loading}
            onPress={() => handleClose()}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Custom CSS for scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </SecondaryModal>
  );
};
