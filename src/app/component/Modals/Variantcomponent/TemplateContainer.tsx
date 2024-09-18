"use client";

import { Badge, Button, Input } from "@nextui-org/react";
import Modal from "../../Modals";
import { SelectionCustom } from "../../Pagination_Component";
import { ChangeEvent, useState } from "react";
import { RGBColor, SketchPicker } from "react-color";
import PrimaryButton from "../../Button";
import { errorToast, successToast } from "../../Loading";
import { CreateVariantTemplate, VariantTemplateType } from "./Action";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  VariantColorValueType,
  Varianttype,
} from "@/src/context/GlobalContext";

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
  const groupedData = data?.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as { [key: string]: typeof data });
  return (
    <div className="w-full h-fit flex flex-row justify-start gap-5 flex-wrap">
      {!data ? (
        <h3 className="text-gray-400">No Template</h3>
      ) : group ? (
        groupedData &&
        Object.keys(groupedData).map((optionType, groupIdx) => (
          <div key={groupIdx} className="w-full">
            <h3 className="text-lg font-medium mb-2">{optionType}</h3>
            <div className="w-full h-fit flex flex-row justify-start gap-5 flex-wrap">
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
                      className={`w-fit h-[50px] rounded-lg flex flex-row justify-center items-center gap-x-3 cursor-pointer p-2 transition-colors active:bg-gray-300 hover:bg-gray-300`}
                      onClick={() => onItemsClick && onItemsClick(idx)}
                    >
                      {/* Display created Color */}
                      <div
                        className="color w-[30px] h-[30px] rounded-full"
                        style={{ backgroundColor: item.val }}
                      ></div>
                      {item.name && (
                        <p className="w-fit h-fit text-lg font-light">
                          {item.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() =>
                        onItemsClick && onItemsClick(item.id as number)
                      }
                      className="template bg-gray-300 rounded-lg p-2 cursor-pointer transition-colors hover:bg-white"
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
                  className={`w-fit h-[50px] rounded-lg flex flex-row justify-center items-center gap-x-3 cursor-pointer p-2 transition-colors active:bg-gray-300 hover:bg-gray-300`}
                  onClick={() => onItemsClick && onItemsClick(idx)}
                >
                  {/* Display created Color */}
                  <div
                    className="color w-[30px] h-[30px] rounded-full"
                    style={{ backgroundColor: i.val }}
                  ></div>
                  {i.name && (
                    <p className="w-fit h-fit text-lg font-light">{i.name}</p>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => onItemsClick && onItemsClick(idx)}
                  className="template bg-gray-300 rounded-lg p-2 cursor-pointer transition-colors hover:bg-white"
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
}: AddTemplateModalProps) => {
  const [option, setoption] = useState("");
  const [loading, setloading] = useState(false);
  const [step, setstep] = useState("");
  const [templatetype, settemplatetype] = useState<"COLOR" | "TEXT" | "">(
    data ? (data.variant?.option_type as any) : ""
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
          { id: data.id, variant: updatedvariant }
        );
        setloading(false);

        if (!updatereq.success) {
          errorToast("Error occured");
          return;
        }
        successToast(`${variant.option_title} updated`);
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
      successToast(`${variant.option_title} created`);
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
    <Modal closestate="none" customwidth="280px" customheight="600px">
      <div className="w-full h-full bg-white flex flex-col gap-y-5 p-2 relative rounded-md">
        <h3 className="text-xl font-bold">Template</h3>
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
          <div className="w-full h-fit flex flex-col gap-y-5">
            <div className="w-full h-fit p-3 max-h-[150px] overflow-y-auto overflow-x-hidden">
              {variant.option_value.length === 0 ? (
                <h3 className="w-full border border-black rounded-lg p-2">
                  No Variant
                </h3>
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
                        ] as VariantColorValueType;
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
                    <label className="text-lg font-bold">Color</label>

                    <div
                      onClick={() => {
                        setopencolor(true);
                      }}
                      className={`w-[100%] h-[50px] border-[5px] border-gray-300 rounded-lg`}
                      style={{
                        backgroundColor: color.hex,
                      }}
                    ></div>
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

            <div className="btn-1 w-full h-[30px] flex flex-row items-center gap-x-5">
              <Button
                onClick={() => handleAddOption()}
                fullWidth
                color="primary"
                variant="solid"
              >
                {edit !== -1 ? "Update" : "Add"}
              </Button>
              <Button
                fullWidth
                onClick={() => setopen(false)}
                color="danger"
                variant="solid"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        <div className="btn w-fit h-[40px] flex flex-row gap-x-5 absolute bottom-1 right-1">
          <Button
            style={{
              backgroundColor: "#0097FA",
              color: "white",
              fontWeight: "bold",
              width: "100px",
            }}
            isLoading={loading}
            variant="solid"
            onClick={() => handleAddTemplate()}
          >
            {step === "create" ? (data ? "Update" : "Create") : "Next"}
          </Button>
          <Button
            style={{
              backgroundColor: "lightcoral",
              color: "white",
              fontWeight: "bold",
              width: "100px",
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
