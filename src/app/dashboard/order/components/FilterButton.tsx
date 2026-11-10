"use client";

import PrimaryButton from "@/src/app/component/Button";
import { useGlobalStore } from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterMenu } from "./FilterMenu";
import { Filterdatatype } from "./types";

interface FilterButtonProps {
  data?: Filterdatatype;
  isFilter: boolean;
}

export const FilterButton = ({ isFilter }: FilterButtonProps) => {
  const openmodal = useGlobalStore((s) => s.openmodal);
  const setopenmodal = useGlobalStore((s) => s.setopenmodal);
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
    <div className="w-full sm:w-auto h-fit flex flex-wrap items-center gap-2 sm:gap-3">
      <PrimaryButton
        onClick={handleOpen}
        type="button"
        text={isFilter ? "Filter" : "Filtered"}
        color={isFilter ? "black" : "gray"}
        radius="10px"
        height="40px"
        width="auto"
        style={{ minWidth: "110px", padding: "0.5rem 1rem" }}
      />

      {!isFilter && (
        <PrimaryButton
          type="button"
          text="Clear Filter"
          color="red"
          radius="10px"
          height="40px"
          width="auto"
          style={{ minWidth: "110px", padding: "0.5rem 1rem" }}
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
    </div>
  );
};
