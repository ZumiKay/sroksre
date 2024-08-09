"use client";
import { Pagination } from "@mui/material";
import { SetStateAction } from "react";
import { Selection } from "./Button";

interface PagiationProps {
  page: number;
  show: number;
  setshow: React.Dispatch<SetStateAction<number>>;
  setpage: React.Dispatch<SetStateAction<number>>;
  type: string;
  count?: number;
  onchange?: (value: number | string, type: string) => void;
}
export default function PaginationComponent(props: PagiationProps) {
  return (
    <div className="pagination_container  w-full h-fit flex flex-row justify-center items-center">
      <Pagination
        count={props.count}
        page={props.page}
        color="primary"
        onChange={(_, value) => {
          props.setpage(value);
          props.onchange && props.onchange(value, "page");
        }}
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
        showFirstButton
        showLastButton
      />
      {/* <Selection
        style={{ width: "10%" }}
        data={["1", "2", "3", "10", "20"]}
        value={props.show}
        onChange={(e) => {
          props.onchange && props.onchange(e.target.value, "limit");
          props.setshow(parseInt(e.target.value));
        }}
      /> */}
    </div>
  );
}
