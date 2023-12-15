import { CSSProperties, ReactNode } from "react";
import "../globals.css";
import { INVENTORYENUM } from "../dashboard/products/page";
import { useGlobalContext } from "@/src/context/GlobalContext";

interface toggleprops {
  name: string;
  type?: string;
  data?: any[];
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
    setglobalindex({ ...globalindex, productdetailindex: index + 1 });
    setopenmodal({ ...openmodal, productdetail: true });
  };
  const handleDelete = (index: number) => {
    const updatedetail = [...product.details];
    updatedetail.splice(index + 1, 1);
    setproduct({ ...product, details: updatedetail });
  };
  return (
    <div className="toggle__container w-full flex flex-col gap-y-1">
      <h3 className="togglebtn mb-5 underline font-semibold">
        {props.name}{" "}
        <i className="ml-2 fa-solid fa-plus bg-black text-white rounded-xl font-black p-1 transition hover:-translate-y-1 active:-translate-y-1"></i>{" "}
      </h3>
      <div className="detailheader w-full break-words flex flex-col items-start gap-y-3">
        {props?.data
          ?.filter((i) => i.info_type !== "")
          .map((obj: any, index: number) =>
            obj.info_type === INVENTORYENUM.normal ? (
              <h3
                key={index}
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
            ) : (
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
