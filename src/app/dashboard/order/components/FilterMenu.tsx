"use client";

import { ChangeEvent, useEffect, useState } from "react";
import PrimaryButton from "@/src/app/component/Button";
import { SecondaryModal } from "@/src/app/component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { errorToast } from "@/src/app/component/Loading";
import dayjs, { Dayjs } from "dayjs";
import { isObjectEmpty } from "@/src/lib/utilities";
import { Input } from "@heroui/react";
import { useScreenSize } from "@/src/context/CustomHook";
import useCheckSession from "@/src/hooks/useCheckSession";
import { AmountRange } from "./AmountRange";
import { Filterdatatype } from "./types";

interface FilterMenuProps {
  type: "filter" | "export";
  close: "exportoption" | "filteroption";
  handleNext?: (data: Filterdatatype) => void;
  loading?: boolean;
  open: boolean;
}

export const FilterMenu = ({
  type,
  close,
  handleNext,
  loading,
  open,
}: FilterMenuProps) => {
  const [pickdate, setpickdate] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterdata, setfilterdata] = useState<Filterdatatype>({});
  const [isFilter, setisFilter] = useState(false);
  const { setopenmodal } = useGlobalContext();
  const { isMobile } = useScreenSize();
  const { handleCheckSession } = useCheckSession();

  useEffect(() => {
    handleCheckSession();
  }, []);

  useEffect(() => {
    const hasFilterParam =
      searchParams.has("q") ||
      searchParams.has("orderdate") ||
      searchParams.has("startprice") ||
      searchParams.has("endprice") ||
      searchParams.has("fromdate") ||
      searchParams.has("todate");

    if (hasFilterParam) {
      searchParams.forEach((val, key) => {
        setfilterdata((prev) => ({ ...prev, [key]: val }));
      });
    }
  }, []);

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filterdata).forEach(([key, val]) => {
      if (key === "page") {
        params.set(key, "1");
      } else if (val) {
        params.set(key, `${val}`);
      }
    });
    router.push(`?${params}`);
    setisFilter(true);
    setopenmodal((prev) => ({ ...prev, [close]: false }));
  };

  const handleClear = () => {
    setfilterdata({});
    const params = new URLSearchParams(searchParams);
    Object.entries(filterdata).forEach(([key, val]) => {
      if (key !== "page" && key !== "show" && val) {
        params.delete(key);
      }
    });
    router.push(`?${params}`);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement> | Dayjs | null,
    name?: string,
  ) => {
    if (dayjs.isDayjs(event) && name) {
      setfilterdata((prev) => ({ ...prev, [name]: event }));
    } else if (event && "target" in event) {
      setfilterdata((prev) => ({
        ...prev,
        [event.target.name]: event.target.value,
      }));
    }
  };

  const handleExportNext = () => {
    if (!filterdata.filename) {
      errorToast("Filename required");
      return;
    }
    handleNext?.(filterdata);
  };

  return (
    <SecondaryModal
      size="4xl"
      open={open}
      closebtn
      onPageChange={(val) =>
        !pickdate && setopenmodal((prev) => ({ ...prev, [close]: val }))
      }
      header={() => (
        <h2 className="font-bold text-2xl" hidden={type !== "filter"}>
          Filter by
        </h2>
      )}
      placement={isMobile ? "top" : "center"}
      footer={() => (
        <div className="Filter_btn inline-flex items-center gap-x-5 w-full h-12.5">
          {type === "filter" ? (
            <PrimaryButton
              width="100%"
              type="button"
              text="Filter"
              radius="10px"
              disable={isFilter}
              onClick={handleFilter}
            />
          ) : (
            <PrimaryButton
              width="100%"
              type="button"
              text="Export"
              status={loading ? "loading" : "authenticated"}
              radius="10px"
              disable={isObjectEmpty(filterdata)}
              onClick={handleExportNext}
            />
          )}
          <PrimaryButton
            type="button"
            width="100%"
            text="Clear"
            disable={isObjectEmpty(filterdata)}
            onClick={handleClear}
            color="lightcoral"
            radius="10px"
          />
        </div>
      )}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="w-full h-full max-h-[50vh] bg-white rounded-lg grid gap-y-5 font-bold text-lg p-5">
          <Input
            type="text"
            value={filterdata.q}
            onChange={handleChange}
            labelPlacement="outside"
            label={
              type === "export"
                ? "Customer (ID or Name)"
                : "Search (Customer Email, Name, Order Id)"
            }
            placeholder="Search"
            name="q"
            size="lg"
            className="w-full"
          />

          {type === "export" && (
            <Input
              type="text"
              id="filename"
              size="lg"
              name="filename"
              label="File Name"
              labelPlacement="outside"
              placeholder="Sheet1"
              onChange={handleChange}
              className="w-full"
            />
          )}

          <label className="text-lg font-bold w-full text-left">
            Price Range
          </label>
          <AmountRange setdata={setfilterdata} data={filterdata} />

          <label className="text-lg w-full text-left font-bold">
            Date Range
          </label>
          <div className="w-full h-fit flex flex-row items-center gap-x-5">
            <DateTimePicker
              label="From"
              onOpen={() => setpickdate(true)}
              onClose={() => setpickdate(false)}
              value={filterdata.fromdate ? dayjs(filterdata.fromdate) : null}
              sx={{ width: "100%", height: "50px" }}
              name="fromdate"
              onChange={(e) => handleChange(e, "fromdate")}
            />
            <DateTimePicker
              label="To"
              onOpen={() => setpickdate(true)}
              onClose={() => setpickdate(false)}
              value={filterdata.todate ? dayjs(filterdata.todate) : null}
              sx={{ width: "100%", height: "50px" }}
              name="todate"
              onChange={(e) => handleChange(e, "todate")}
            />
          </div>
        </div>
      </LocalizationProvider>
    </SecondaryModal>
  );
};
