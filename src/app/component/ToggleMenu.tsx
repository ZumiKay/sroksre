"use client";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import "../globals.css";
import { INVENTORYENUM } from "../dashboard/products/page";
import { ProductInfo, useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "./Button";
import { toast } from "react-toastify";

interface toggleprops {
  name: string;
  type?: string;
  data?: ProductInfo[];
  index?: number;
}

export default function ToggleMenu(props: toggleprops) {
  const {
    openmodal,
    product,
    setproduct,
    setopenmodal,
    globalindex,
    setglobalindex,
  } = useGlobalContext();
  const handleEdit = (index: number) => {
    setglobalindex({ ...globalindex, productdetailindex: index });
    setopenmodal({ ...openmodal, productdetail: true });
  };
  const handleDelete = (index: number) => {
    const updatedetail = [...product.details];
    updatedetail.splice(index, 1);
    setproduct({ ...product, details: updatedetail });
    setopenmodal({ ...openmodal, productdetail: false });
  };
  return (
    <div className="toggle__container w-full flex flex-col gap-y-1">
      <h3 className="togglebtn mb-5 underline font-semibold">
        {props.name}{" "}
        <i className="ml-2 fa-solid fa-plus bg-black text-white rounded-xl font-black p-1 transition hover:-translate-y-1 active:-translate-y-1"></i>{" "}
      </h3>
      <div className="detailheader w-full break-words flex flex-col items-start gap-y-3">
        {props.data?.map((obj: ProductInfo, index: number) =>
          obj.info_type === INVENTORYENUM.normal ? (
            <h3
              key={obj.id ?? index}
              className="text-base font-semibold flex flex-row items-center gap-x-5"
            >
              {" "}
              {obj.info_title} : {obj.info_value && obj.info_value[0]}
              <h5
                onClick={() => handleEdit(index)}
                className="text-blue-400 underline transition hover:text-black"
              >
                Edit
              </h5>
              <h5
                onClick={() => handleDelete(index)}
                className="text-red-400 underline transition hover:text-black"
              >
                Delete
              </h5>
            </h3>
          ) : obj.info_type === INVENTORYENUM.color ? (
            <div
              key={index}
              className="color__container flex flex-row w-fit gap-x-5 "
            >
              <h3 className="text-base font-semibold"> {obj.info_title} </h3>
              <div className="color_list flex flex-row items-center gap-x-2 w-full">
                {obj?.info_value?.map((i: any) => (
                  <div
                    className={`w-[20px] h-[20px] rounded-xl`}
                    style={{ backgroundColor: i }}
                  ></div>
                ))}
              </div>
              <h5
                onClick={() => {
                  handleEdit(index);
                  console.log("edit", props.data);
                }}
                className="text-blue-400 underline font-bold transition hover:text-black"
              >
                Edit
              </h5>
              <h5
                onClick={() => handleDelete(index)}
                className="text-red-400 underline font-bold transition hover:text-black"
              >
                Delete
              </h5>
            </div>
          ) : (
            <> </>
          ),
        )}
      </div>
    </div>
  );
}
interface toggledownmenuprops {
  style?: CSSProperties;
  children: ReactNode;
  open: boolean;
}
export function ToggleDownMenu(props: toggledownmenuprops) {
  return (
    <div
      style={{ ...props.style, display: props.open ? "none" : "" }}
      className="toggleDownMenu__container w-full h-fit border-l-2 border-l-black flex flex-col items-start gap-y-5 pl-2"
    >
      {props.children}
    </div>
  );
}

interface AddSubCategoryMenuProps {
  index: number;
}

export function AddSubCategoryMenu({ index }: AddSubCategoryMenuProps) {
  const { category, setcategory, setopenmodal, allData, setalldata } =
    useGlobalContext();
  const [name, setname] = useState("");
  const [editIdx, setedit] = useState(-1);
  const [showform, setshow] = useState(false);

  useEffect(() => {
    index >= 0 && setcategory(allData.category[index]);
  }, [index]);
  const handleAdd = () => {
    const updatecate = [...category.subcategories];
    const isExist = updatecate.some((i) => i.name === name);
    if (isExist) {
      toast.error("Sub Cateogory Exist", {
        autoClose: 2000,
        pauseOnHover: true,
      });
      return;
    }
    if ((name.length > 0 && editIdx < 0) || updatecate.length === 0) {
      updatecate.push({ name: name });
    } else {
      updatecate[editIdx].name = name;
    }
    setname("");
    setedit(-1);
    setcategory((prev) => ({ ...prev, subcategories: updatecate }));
  };
  const handleCancel = () => {
    const deletesub = { ...category };
    deletesub.subcategories = [];
    setname("");
    setedit(-1);
    setcategory(deletesub);
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
  };
  const handleDelete = (idx: number) => {
    const subcate = [...category.subcategories];
    subcate.splice(idx, 1);
    setcategory((prev) => ({ ...prev, subcategories: subcate }));
  };
  return (
    <div
      onClick={() => setshow(true)}
      className="AddSubCategory_menu w-full h-fit p-1 flex flex-col justify-center gap-y-5 transition hover:border-[3px] hover:border-gray-300 rounded-md"
    >
      <h2 className="text-lg font-bold">Sub Categories</h2>
      <div className="subcategory_list grid grid-cols-5 gap-y-3 p-4 place-content-start h-full  max-h-[120px] overflow-y-auto">
        {category.subcategories?.map((cat, index) => (
          <div
            key={index}
            className="subcategory relative text-lg font-bold p-1 rounded-md bg-gray-300 w-fit h-fit max-w-[100px] break-words cursor-pointer transition hover:bg-black hover:text-white"
          >
            <h3
              onClick={() => {
                setedit(index);
                setname(category.subcategories[index].name);
              }}
              className="subcategory__name text-lg font-bold"
            >
              {cat.name}
            </h3>
            <i
              onClick={() => {
                handleDelete(index);
              }}
              className="fa-solid fa-minus font-black p-[1px] h-fit absolute -right-2 -top-3  text-sm rounded-lg bg-red-500 text-white transition hover:bg-black "
            ></i>
          </div>
        ))}
      </div>
      {showform && (
        <div className="subcategoryform w-full h-full flex flex-col gap-y-3">
          <input
            type="text"
            className="subcate_name w-full h-[50px] border border-gray-300 pl-3 text-lg font-bold"
            placeholder="name"
            value={name}
            onChange={(e) => {
              setname(e.target.value);
            }}
          />
          <PrimaryButton
            type="button"
            text={editIdx < 0 ? "Add" : "Edit"}
            onClick={() => handleAdd()}
            width="100%"
            height="30px"
            color="#44C3A0"
            radius="10px"
            disable={name.length === 0}
          />
          <PrimaryButton
            type="button"
            text={index !== -1 ? "Delete All" : "Delete"}
            onClick={() => handleCancel()}
            width="100%"
            height="30px"
            color="lightcoral"
            radius="10px"
          />
        </div>
      )}
    </div>
  );
}
