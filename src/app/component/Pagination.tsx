"use client";
import { Pagination } from "@mui/material";
import { SetStateAction } from "react";
import { Selection } from "./Button";
import {
  filterinventorytype,
  useGlobalContext,
} from "@/src/context/GlobalContext";

interface PagiationProps {
  page: number;
  show: number;
  setshow: React.Dispatch<SetStateAction<number>>;
  setpage: React.Dispatch<SetStateAction<number>>;
  type: filterinventorytype;
  count?: number;
  onchange?: (value: number | string, type: string) => void;
}
export default function PaginationComponent(props: PagiationProps) {
  const { itemlength, allfiltervalue, setallfilterval, setpage } =
    useGlobalContext();
  return (
    <div className="pagination_container  w-full h-fit absolute -bottom-[5%] flex flex-row justify-center  ">
      <Pagination
        count={itemlength.totalpage || props.count}
        page={
          allfiltervalue.find((i) => i.page === props.type)?.filter.page ??
          props.page
        }
        color="primary"
        onChange={(_, value) => {
          props.setpage(value);
          props.onchange && props.onchange(value, "page");
          const isExist = allfiltervalue.findIndex(
            (i) => i.page === props.type
          );
          if (isExist !== -1) {
            let allfil = [...allfiltervalue];
            allfil[isExist].filter.page = value;
            setallfilterval(allfil);
          }
        }}
        sx={{
          width: "80%",
          display: "flex",
          justifyContent: "center",
          paddingLeft: "10%",
        }}
        showFirstButton
        showLastButton
      />
      <Selection
        style={{ width: "10%" }}
        data={["1", "2", "3", "10", "20"]}
        value={props.show}
        onChange={(e) => {
          const allfilter = [...allfiltervalue];
          props.onchange && props.onchange(e.target.value, "limit");
          allfilter.forEach((i) => (i.filter.page = 1));
          setallfilterval(allfilter);
          props.setshow(parseInt(e.target.value));
          setpage(1);
        }}
        default="Show Per Page"
      />
    </div>
  );
}
