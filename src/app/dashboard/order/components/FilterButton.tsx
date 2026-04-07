"use client";

import PrimaryButton from "@/src/app/component/Button";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterMenu } from "./FilterMenu";
import { Filterdatatype } from "./types";

interface FilterButtonProps {
  data: Filterdatatype;
  isFilter: boolean;
}

export const FilterButton = ({ data, isFilter }: FilterButtonProps) => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOpen = () => {
    setopenmodal((prev) => ({ ...prev, filteroption: true }));
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams);
    Array.from(params.keys()).forEach((key) => {
      if (key !== "page" && key !== "show" && key !== "status") {
        params.delete(key);
      }
    });
    router.push(`?${params}`);
  };

  return (
    <>
      <PrimaryButton
        onClick={handleOpen}
        type="button"
        text={isFilter ? "Filter" : "Filtered"}
        color={!isFilter ? "black" : undefined}
        radius="10px"
        height="40px"
        width="150px"
      />

      {!isFilter && (
        <PrimaryButton
          type="button"
          text="Clear Filter"
          color="red"
          radius="10px"
          height="40px"
          width="150px"
          onClick={handleClear}
        />
      )}

      {openmodal.filteroption && (
        <FilterMenu
          open={openmodal.filteroption}
          close="filteroption"
          type="filter"
        />
      )}
    </>
  );
};
