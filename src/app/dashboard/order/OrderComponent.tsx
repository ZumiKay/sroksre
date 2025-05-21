"use client";
import ReactDOMServer from "react-dom/server";
import { ChangeEvent, memo, useCallback, useEffect, useState } from "react";
import PrimaryButton, { Selection } from "../../component/Button";
import { SecondaryModal } from "../../component/Modals";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Allstatus,
  Filterdatatype,
  OrderDetialModalType,
} from "@/src/context/OrderContext";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderReceiptTemplate } from "../../component/EmailTemplate";
import { deleteOrder } from "./action";
import { errorToast, successToast } from "../../component/Loading";
import dayjs, { Dayjs } from "dayjs";
import { OrderUserType } from "../../checkout/action";
import { isObjectEmpty } from "@/src/lib/utilities";
import PaginationCustom from "../../component/Pagination_Component";
import { Input } from "@heroui/react";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import React from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SecondaryConfirmModal } from "../../component/Modals/Alert_Modal";

const FilterDataKeys = [
  "q",
  "orderdate",
  "startprice",
  "endprice",
  "fromdate",
  "todate",
];

type OrderFilterMenuProps = {
  type: "filter" | "export";
  close: "exportoption" | "filteroption";
  handleNext?: (
    data: Filterdatatype,
    setTotalCount?: React.Dispatch<React.SetStateAction<number>>
  ) => void;
  loading?: boolean;
  open: boolean;
};

export const OrderFilterMenu = memo(
  ({
    type,
    close,
    handleNext,
    loading = false,
    open,
  }: OrderFilterMenuProps) => {
    // State management
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [filterData, setFilterData] = useState<Filterdatatype>({});
    const [isFilterApplied, setIsFilterApplied] = useState(false);

    // Hooks
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setopenmodal } = useGlobalContext();
    const { isMobile } = useScreenSize();

    // Load filter data from URL params on component mount
    useEffect(() => {
      if (FilterDataKeys.some((key) => searchParams.has(key))) {
        const newFilterData = {} as Filterdatatype;

        searchParams.forEach((value, key) => {
          newFilterData[key] = value;
        });

        setFilterData(newFilterData);
      }
    }, [searchParams]);

    // Filter handler
    const handleFilter = useCallback(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(filterData).forEach(([key, value]) => {
        if (key === "page") {
          params.set(key, "1"); // Reset to first page when applying filters
        } else if (value) {
          params.set(key, `${value}`);
        }
      });

      router.push(`?${params.toString()}`);
      setIsFilterApplied(true);
      setopenmodal((prev) => ({ ...prev, [close]: false }));
    }, [close, filterData, router, searchParams, setopenmodal]);

    // Clear filters
    const handleClear = useCallback(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.keys(filterData).forEach((key) => {
        if (key !== "page" && key !== "show") {
          params.delete(key);
        }
      });

      router.push(`?${params.toString()}`);
      setFilterData({});
    }, [filterData, router, searchParams]);

    // Input change handler
    const handleChange = useCallback(
      (
        event: React.ChangeEvent<HTMLInputElement> | Dayjs | null,
        name?: string
      ) => {
        if (dayjs.isDayjs(event) && name) {
          setFilterData((prev) => ({ ...prev, [name]: event }));
        } else if (event && "target" in event) {
          const { name, value } = event.target;
          setFilterData((prev) => ({ ...prev, [name]: value }));
        }
      },
      []
    );

    // Export handler
    const handleExport = useCallback(() => {
      if (!filterData.filename) {
        errorToast("Filename required");
        return;
      }

      handleNext?.(filterData);
    }, [filterData, handleNext]);

    // Determine if filters can be cleared
    const canClearFilters = !isObjectEmpty(filterData);

    // Determine export button state
    const exportDisabled = isObjectEmpty(filterData);

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SecondaryModal
          size="4xl"
          open={open}
          closebtn
          onPageChange={(val) => {
            if (!datePickerOpen) {
              setopenmodal((prev) => ({ ...prev, [close]: val }));
            }
          }}
          header={() => (
            <h2 className="font-bold text-2xl" hidden={type !== "filter"}>
              Filter by
            </h2>
          )}
          placement={isMobile ? "top" : "center"}
          footer={() => (
            <div className="inline-flex items-center gap-x-5 w-full">
              {type === "filter" ? (
                <PrimaryButton
                  width="100%"
                  type="button"
                  text="Apply Filters"
                  radius="10px"
                  disable={isFilterApplied}
                  onClick={handleFilter}
                />
              ) : (
                <PrimaryButton
                  width="100%"
                  type="button"
                  text="Export"
                  status={loading ? "loading" : "authenticated"}
                  radius="10px"
                  disable={exportDisabled}
                  onClick={handleExport}
                />
              )}
              <PrimaryButton
                type="button"
                width="100%"
                text="Clear All"
                disable={!canClearFilters}
                onClick={handleClear}
                color="lightcoral"
                radius="10px"
              />
            </div>
          )}
        >
          <div className="w-full max-h-[50vh] bg-white rounded-lg p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Search Input */}
              <div className="filter-field">
                <Input
                  type="text"
                  value={filterData.q || ""}
                  onChange={handleChange}
                  labelPlacement="outside"
                  label={
                    type === "export"
                      ? "Customer (ID or Name)"
                      : "Search (Customer Email, Name, Order ID)"
                  }
                  placeholder="Enter search terms..."
                  name="q"
                  size="lg"
                  className="w-full"
                />
              </div>

              {/* Filename Input (Export Only) */}
              {type === "export" && (
                <div className="filter-field">
                  <Input
                    type="text"
                    id="filename"
                    size="lg"
                    name="filename"
                    label="File Name"
                    labelPlacement="outside"
                    placeholder="Sheet1"
                    value={filterData.filename || ""}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              )}

              {/* Price Range */}
              <div className="filter-field">
                <label className="text-lg font-bold block mb-2">
                  Price Range
                </label>
                <AmountRange setdata={setFilterData} data={filterData} />
              </div>

              {/* Date Range */}
              <div className="filter-field">
                <label className="text-lg font-bold block mb-2">
                  Date Range
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <DateTimePicker
                    label="From"
                    onOpen={() => setDatePickerOpen(true)}
                    onClose={() => setDatePickerOpen(false)}
                    value={
                      filterData.fromdate ? dayjs(filterData.fromdate) : null
                    }
                    sx={{ width: "100%", height: "50px" }}
                    name="fromdate"
                    onChange={(e) => handleChange(e, "fromdate")}
                  />
                  <DateTimePicker
                    label="To"
                    onOpen={() => setDatePickerOpen(true)}
                    onClose={() => setDatePickerOpen(false)}
                    value={filterData.todate ? dayjs(filterData.todate) : null}
                    sx={{ width: "100%", height: "50px" }}
                    name="todate"
                    onChange={(e) => handleChange(e, "todate")}
                  />
                </div>
              </div>
            </div>
          </div>
        </SecondaryModal>
      </LocalizationProvider>
    );
  }
);

OrderFilterMenu.displayName = "OrderFilterMenu";

export const AmountRange = memo(
  ({
    data,
    setdata,
  }: {
    data: Filterdatatype;
    setdata?: React.Dispatch<React.SetStateAction<Filterdatatype>>;
  }) => {
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Check if the value is a valid non-negative number
        if (/^\d*$/.test(value) && setdata) {
          setdata((prev) => ({ ...prev, [name]: value }));
        } else {
          // Clear the input if the value is invalid (negative or non-numeric)
          e.target.value = "";
        }
      },
      [setdata]
    );
    return (
      <div className="Pricerange_Container inline-flex gap-x-5 w-full justify-start">
        <Input
          type="number"
          id="price"
          name="startprice"
          placeholder="0.00"
          label="From"
          labelPlacement="outside"
          endContent={"$"}
          size="lg"
          value={data.startprice?.toString()}
          onChange={handleChange}
          min={0}
          className="w-full"
        />

        <Input
          type="number"
          id="price"
          name="endprice"
          value={data.endprice?.toString() ?? ""}
          placeholder="0.00"
          endContent={"$"}
          label="To"
          labelPlacement="outside"
          onChange={handleChange}
          size="lg"
          min={0}
          className="w-full"
        />
      </div>
    );
  }
);
AmountRange.displayName = "AmountRange";

export const PaginationSSR = memo(
  ({
    total,
    pages,
    limit,
  }: {
    total: number;
    pages?: number;
    limit?: string;
  }) => {
    const [page, setpage] = useState(pages ?? 1);
    const [show, setshow] = useState(limit ?? "1");
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSelectPage = useCallback(
      (value: number | string) => {
        const searchparam = new URLSearchParams(searchParams);

        searchparam.set("p", "1");
        searchparam.set("show", `${value}`);
        setpage(1);

        router.push(`?${searchparam}`, { scroll: false });
      },
      [router, searchParams]
    );

    return (
      <div className="w-full h-fit mt-[10%]">
        <PaginationCustom
          page={page}
          show={show}
          setpage={setpage}
          setshow={setshow}
          count={total}
          onSelectShowPerPage={handleSelectPage}
        />
      </div>
    );
  }
);
PaginationSSR.displayName = "PaginationSSR";

export const ActionModal = ({
  types,
  close,
  oid,
  order,
  setclose,
}: {
  types: "none" | "action" | "status";
  close: string;
  oid: string;
  order: OrderUserType;
  setclose: () => void;
}) => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const [actiontype, setactiontype] = useState<string>(types);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDelete = useCallback(async (oid: string) => {
    const delreq = deleteOrder.bind(null, oid);
    const req = await delreq();

    if (!req.success) {
      errorToast("Can't Delete");
      return;
    }
    successToast("Order Deleted");
  }, []);
  const handleClick = useCallback(
    (type: string) => {
      if (type === "delete") {
        setopenmodal({
          confirmmodal: { open: true, onAsyncDelete: () => handleDelete(oid) },
        });
      }

      setactiontype(type);
    },
    [handleDelete, oid, setopenmodal]
  );

  const handleClose = useCallback(() => {
    const url = new URLSearchParams(searchParams);
    url.delete("id");
    url.delete("ty");
    setclose();
    router.push(`?${url}`, { scroll: false });
  }, [router, searchParams, setclose]);

  return (
    <SecondaryModal
      size="lg"
      open={openmodal[close] as boolean}
      onPageChange={() => {
        handleClose();
      }}
      closebtn
    >
      <div className="w-full h-full flex flex-col gap-y-5 ">
        {actiontype === "none" && (
          <>
            <h3 className="w-full text-center text-xl font-bold">Action</h3>
            <div className="w-full h-fit flex flex-col gap-y-32 items-center">
              <div className="action_btn h-full flex flex-col w-full items-center gap-y-5">
                <PrimaryButton
                  type="button"
                  text="Update Status"
                  onClick={() => handleClick("status")}
                  radius="10px"
                  width="90%"
                />
                <PrimaryButton
                  type="button"
                  text="Delete"
                  width="90%"
                  onClick={() => handleClick("delete")}
                  radius="10px"
                  color="lightcoral"
                />
              </div>
            </div>{" "}
          </>
        )}
        {actiontype === "status" && (
          <UpdateStatus setactiontype={setactiontype} oid={oid} order={order} />
        )}
        {actiontype === "delete" && <SecondaryConfirmModal />}
      </div>
    </SecondaryModal>
  );
};

const UpdateStatus = memo(
  ({
    setactiontype,
    oid,
    order,
  }: {
    setactiontype: (val: OrderDetialModalType) => void;
    oid: string;
    order: OrderUserType;
  }) => {
    const [status, setstatus] = useState<Allstatus | string>("");
    const [loading, setloading] = useState(false);
    const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
      setstatus(e.target.value as typeof order.status);
    };

    useEffect(() => {
      setstatus(order?.status);
    }, [order?.status]);

    const handleCancel = useCallback(() => {
      setactiontype("none");
    }, [setactiontype]);

    const handleUpdate = useCallback(async () => {
      setloading(true);
      const emailTemplate = ReactDOMServer.renderToStaticMarkup(
        <OrderReceiptTemplate
          order={{ ...order, status: status as never }}
          isAdmin={false}
        />
      );
      const update = await ApiRequest({
        url: "/api/order/list",
        method: "PUT",
        data: {
          template: emailTemplate,
          id: oid,
          status,
          ty: "status",
        },
      });
      setloading(false);
      if (!update.success) {
        errorToast(update?.message ?? "Updated");
        return;
      }
      successToast(update?.message ?? "Error Occured");
    }, [oid, order, status]);
    return (
      <div className="w-full h-full flex flex-col gap-y-10">
        <p className="w-full text-center font-bold text-xl">Update Status</p>

        <div className="selection flex flex-col gap-y-2">
          <label className="w-full text-lg font-bold text-left">Status</label>
          <Selection
            default="Status"
            value={status}
            data={Object.values(Allstatus).map((val) => val) ?? []}
            onChange={handleSelect}
          />
        </div>
        <div className="btn_container w-full h-fit inline-flex gap-x-5">
          <PrimaryButton
            type="button"
            disable={status?.length === 0 || status === order?.status}
            text="Update"
            status={loading ? "loading" : "authenticated"}
            onClick={() => handleUpdate()}
            color="#0097FA"
            radius="10px"
          />
          <PrimaryButton
            type="button"
            text="Cancel"
            radius="10px"
            onClick={() => handleCancel()}
            color="lightcoral"
          />
        </div>
      </div>
    );
  }
);
UpdateStatus.displayName = "UpdateStatus";
