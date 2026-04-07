"use client";

import { ChangeEvent, useEffect, useState } from "react";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faDollarSign,
  faCalendarAlt,
  faFilter,
  faFileExport,
  faFile,
  faListOl,
} from "@fortawesome/free-solid-svg-icons";

const PER_PAGE_OPTIONS = [10, 20, 30, 50, 100];

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
      searchParams.has("todate") ||
      searchParams.has("show");

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
    setopenmodal((prev) => ({ ...prev, [close]: false }));
  };

  const handleClear = () => {
    setfilterdata({});
    const params = new URLSearchParams(searchParams);
    ["q", "orderdate", "fromdate", "todate", "startprice", "endprice", "show"].forEach(
      (key) => params.delete(key),
    );
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

  const isEmpty = isObjectEmpty(
    Object.fromEntries(
      Object.entries(filterdata).filter(([k]) => k !== "filename" && k !== "show"),
    ),
  );
  const selectedShow = filterdata.show ? String(filterdata.show) : String(searchParams.get("show") ?? "10");

  const isFilter = type === "filter";

  return (
    <SecondaryModal
      size="4xl"
      open={open}
      closebtn
      onPageChange={(val) =>
        !pickdate && setopenmodal((prev) => ({ ...prev, [close]: val }))
      }
      header={() => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
              isFilter
                ? "bg-linear-to-br from-blue-500 to-indigo-600"
                : "bg-linear-to-br from-emerald-500 to-teal-600"
            }`}
          >
            <FontAwesomeIcon
              icon={isFilter ? faFilter : faFileExport}
              className="text-white text-sm"
            />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900 leading-tight">
              {isFilter ? "Filter Orders" : "Export Orders"}
            </h2>
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              {isFilter
                ? "Narrow down results by search, price, or date"
                : "Configure what data to include in the export"}
            </p>
          </div>
        </div>
      )}
      placement={isMobile ? "top" : "center"}
      footer={() => (
        <div className="inline-flex items-center gap-x-3 w-full">
          {isFilter ? (
            <button
              type="button"
              disabled={isEmpty && !filterdata.show}
              onClick={handleFilter}
              className="flex-1 h-10 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply Filter
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !filterdata.filename}
              onClick={handleExportNext}
              className="flex-1 h-10 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Fetching…
                </>
              ) : (
                "Preview Export"
              )}
            </button>
          )}
          <button
            type="button"
            disabled={isEmpty && !filterdata.filename}
            onClick={handleClear}
            className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      )}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="w-full flex flex-col gap-5 p-1">
          {/* Search */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500">
              <FontAwesomeIcon icon={faSearch} className="text-xs" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {isFilter ? "Search" : "Customer"}
              </span>
            </div>
            <Input
              type="text"
              value={filterdata.q ?? ""}
              onChange={handleChange}
              labelPlacement="outside"
              label={
                isFilter
                  ? "Customer email, name, or order ID"
                  : "Customer ID or name"
              }
              placeholder={isFilter ? "Search orders…" : "Enter customer…"}
              name="q"
              size="lg"
              className="w-full"
            />
          </div>

          {/* Filename (export only) */}
          {!isFilter && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-500">
                <FontAwesomeIcon icon={faFile} className="text-xs" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  File Name{" "}
                  <span className="text-red-400 normal-case tracking-normal font-normal">
                    (required)
                  </span>
                </span>
              </div>
              <Input
                type="text"
                id="filename"
                size="lg"
                name="filename"
                label="Output file name"
                labelPlacement="outside"
                placeholder="e.g. orders-march-2025"
                value={filterdata.filename ?? ""}
                onChange={handleChange}
                className="w-full"
                endContent={
                  <span className="text-xs text-gray-400 self-center shrink-0">
                    .xlsx
                  </span>
                }
              />
            </div>
          )}

          {/* Price Range */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500">
              <FontAwesomeIcon icon={faDollarSign} className="text-xs" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Price Range
              </span>
            </div>
            <AmountRange setdata={setfilterdata} data={filterdata} />
          </div>

          {/* Date Range */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Date Range
              </span>
            </div>
            <div className="w-full flex flex-row items-center gap-x-4">
              <DateTimePicker
                label="From"
                onOpen={() => setpickdate(true)}
                onClose={() => setpickdate(false)}
                value={filterdata.fromdate ? dayjs(filterdata.fromdate) : null}
                sx={{ width: "100%" }}
                name="fromdate"
                onChange={(e) => handleChange(e, "fromdate")}
              />
              <DateTimePicker
                label="To"
                onOpen={() => setpickdate(true)}
                onClose={() => setpickdate(false)}
                value={filterdata.todate ? dayjs(filterdata.todate) : null}
                sx={{ width: "100%" }}
                name="todate"
                onChange={(e) => handleChange(e, "todate")}
              />
            </div>
          </div>

          {/* Results per page (filter only) */}
          {isFilter && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-500">
                <FontAwesomeIcon icon={faListOl} className="text-xs" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Results per page
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PER_PAGE_OPTIONS.map((n) => {
                  const active = selectedShow === String(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        setfilterdata((prev) => ({ ...prev, show: String(n) }))
                      }
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </LocalizationProvider>
    </SecondaryModal>
  );
};
