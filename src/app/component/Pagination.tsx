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
}
export default function PaginationComponent(props: PagiationProps) {
  const { itemlength, allfiltervalue, setallfilterval, setpage } =
    useGlobalContext();
  return (
    <div className="pagination_container  w-full h-fit absolute -bottom-[5%] flex flex-row justify-center  ">
      <Pagination
        count={itemlength.totalpage}
        page={
          allfiltervalue.find((i) => i.page === props.type)?.filter.page ??
          props.page
        }
        color="primary"
        onChange={(_, value) => {
          props.setpage(value);

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
