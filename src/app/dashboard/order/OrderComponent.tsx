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
import { deleteOrder, updateOrderStatus } from "./action";
import { errorToast, successToast } from "../../component/Loading";
import dayjs, { Dayjs } from "dayjs";
import { OrderUserType } from "../../checkout/action";
import { isObjectEmpty } from "@/src/lib/utilities";
import PaginationCustom from "../../component/Pagination_Component";
import { Input } from "@heroui/react";
import { useScreenSize } from "@/src/context/CustomHook";
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

export const OrderFilterMenu = memo(
  ({
    type,
    close,
    handleNext,
    loading,
    open,
  }: {
    type: "filter" | "export";
    close: "exportoption" | "filteroption";
    handleNext?: (
      data: Filterdatatype,
      settotalcount?: React.Dispatch<React.SetStateAction<number>>
    ) => void;
    loading?: boolean;
    open: boolean;
  }) => {
    const [pickdate, setpickdate] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [filterdata, setfilterdata] = useState<Filterdatatype>({});
    const [isFilter, setisFilter] = useState(false);
    const { setopenmodal } = useGlobalContext();
    const { isMobile } = useScreenSize();

    useEffect(() => {
      if (FilterDataKeys.some((i) => searchParams.has(i))) {
        searchParams.forEach((val, key) => {
          setfilterdata((prev) => ({ ...prev, [key]: val }));
        });
      }
    }, [searchParams]);

    const handleFilter = useCallback(() => {
      const params = new URLSearchParams(searchParams);
      Object.entries(filterdata).forEach(([key, val]) => {
        if (key === "page") {
          params.set(key, "1");
        } else {
          if (val) {
            params.set(key, `${val}`);
          }
        }
      });
      router.push(`?${params}`);
      setisFilter(true);

      setopenmodal((prev) => ({ ...prev, [close]: false }));
    }, [close, filterdata, router, searchParams, setopenmodal]);

    const handleClear = useCallback(() => {
      const params = new URLSearchParams(searchParams);
      Object.entries(filterdata).forEach(([key, val]) => {
        if (key !== "page" && key !== "show") {
          if (val) {
            params.delete(key);
          }
        }
      });
      router.push(`?${params}`);
      setfilterdata({});
    }, [filterdata, router, searchParams]);

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement> | Dayjs | null, name?: string) => {
        if (dayjs.isDayjs(event) && name) {
          setfilterdata((prev) => ({ ...prev, [name]: event }));
        } else if (event && "target" in event) {
          setfilterdata((prev) => ({
            ...prev,
            [event.target.name]: event.target.value,
          }));
        }
      },
      []
    );

    const next = useCallback(() => {
      if (!filterdata.filename) {
        errorToast("Filename required");
        return;
      }
      if (handleNext) handleNext(filterdata);
    }, [filterdata, handleNext]);

    return (
      <SecondaryModal
        size="4xl"
        open={open}
        closebtn
        onPageChange={(val) =>
          !pickdate && setopenmodal((prev) => ({ ...prev, [close]: val }))
        }
        header={() => (
          <p className="font-bold text-2xl" hidden={type !== "filter"}>
            Filter by
          </p>
        )}
        placement={isMobile ? "top" : "center"}
        footer={() => {
          return (
            <div className="Filter_btn inline-flex items-center gap-x-5 w-full h-[50px]">
              {type === "filter" ? (
                <PrimaryButton
                  width="100%"
                  type="button"
                  text="Filter"
                  radius="10px"
                  disable={isFilter}
                  onClick={() => handleFilter()}
                />
              ) : (
                <PrimaryButton
                  width="100%"
                  type="button"
                  text={`Export`}
                  status={loading ? "loading" : "authenticated"}
                  radius="10px"
                  disable={isObjectEmpty(filterdata)}
                  onClick={() => {
                    next();
                  }}
                />
              )}
              <PrimaryButton
                type="button"
                width="100%"
                text="Clear"
                disable={isObjectEmpty(filterdata)}
                onClick={() => handleClear()}
                color="lightcoral"
                radius="10px"
              />
            </div>
          );
        }}
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
                  : "Search (Customer Email , Name , Order Id)"
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
              Price Range{" "}
            </label>
            <AmountRange setdata={setfilterdata} data={filterdata} />
            <label className="text-lg w-full text-left font-bold">
              Date Range
            </label>

            <div className="w-full h-fit flex flex-row items-center gap-x-5">
              <DateTimePicker
                label={"From"}
                onOpen={() => setpickdate(true)}
                onClose={() => setpickdate(false)}
                value={filterdata.fromdate ? dayjs(filterdata.fromdate) : null}
                sx={{ width: "100%", height: "50px" }}
                name="fromdate"
                onChange={(e) => handleChange(e, "fromdate")}
              />
              <DateTimePicker
                label={"To"}
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
    const router = useRouter();
    const [status, setstatus] = useState("");
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
      const makereq = updateOrderStatus.bind(
        null,
        status as never,
        oid,
        emailTemplate
      );
      const update = await makereq();
      setloading(false);
      if (!update.success) {
        errorToast(update.message);
        return;
      }
      successToast(update.message);
      router.refresh();
    }, [oid, order, router, status]);
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
