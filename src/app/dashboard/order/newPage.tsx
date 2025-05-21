"use client";

import { ApiRequest, useCheckSession } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { GetOrder } from "./actions";
import { errorToast, successToast } from "../../component/Loading";
import { AsyncSelection } from "../../component/AsynSelection";
import {
  AllOrderStatusData,
  Allstatus,
  Filterdatatype,
  Orderstatus,
  Ordertype,
} from "@/src/context/OrderContext";
import { Button, Chip } from "@heroui/react";
import { DownloadButton, FilterButton } from "./Button";
import TableComponent from "../../component/Table/Table_Component";
import { SelectType } from "@/src/context/GlobalType.type";

// Enhanced styled chip component for better visual presentation
const CustomSelectRender = memo(
  ({ status }: { status: SelectType<string> }) => (
    <Chip
      style={{
        backgroundColor: status.color ?? "black",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}
      className="text-white font-bold px-3 py-1 rounded-full text-sm hover:opacity-90"
    >
      {status.label}
    </Chip>
  )
);

CustomSelectRender.displayName = "CustomSelectRender";

// Custom hook for parameter handling
const useOrderParams = (): Filterdatatype => {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const p = searchParams.get("p");
    const show = searchParams.get("show");
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const fromdate = searchParams.get("fromdate");
    const todate = searchParams.get("todate");
    const startprice = searchParams.get("startprice");
    const endprice = searchParams.get("endprice");

    const selectedStatus = status ? status.split(",") : undefined;

    if (
      selectedStatus &&
      !selectedStatus.every((i) =>
        Object.values(Allstatus).includes(i as Allstatus)
      )
    ) {
      return null;
    }

    return {
      page: parseInt(p || "1", 10),
      limit: parseInt(show || "5", 10),
      status: selectedStatus,
      search: q || undefined,
      startprice: startprice ? parseFloat(startprice) : 0,
      endprice: endprice ? parseFloat(endprice) : 0,
      fromdate: fromdate || undefined,
      todate: todate || undefined,
    };
  }, [searchParams]);
};

const OrderPage = () => {
  const { allData, setalldata, reloaddata, setreloaddata, setopenmodal } =
    useGlobalContext();
  const { user } = useCheckSession();
  const searchParam = useSearchParams();
  const router = useRouter();
  const Params = useOrderParams();

  const [fitlerstatus, setfitlerstatus] = useState<Orderstatus[]>(["All"]);
  const [page, setpage] = useState(1);
  const [show, setshow] = useState(5);
  const [loading, setloading] = useState(false);
  const [selected, setselected] = useState<Array<string>>();

  // Check for invalid params early
  useEffect(() => {
    if (!Params) {
      notFound();
    }
  }, [Params]);

  // Check for user authentication early
  useEffect(() => {
    if (!user) {
      notFound();
    }
  }, [user]);

  // Data fetching effect
  useEffect(() => {
    let isMounted = true;

    const getOrder = async () => {
      if (!reloaddata || !Params) return;

      setloading(true);
      try {
        const order = await GetOrder({ param: Params as never });

        if (!isMounted) return;

        setloading(false);

        if (!order?.success) {
          errorToast("Error fetching orders");
          return;
        }

        setalldata((prev) => ({
          ...prev,
          orders: (order?.data || []) as Ordertype[],
        }));

        setreloaddata(false);
      } catch (error) {
        if (isMounted) {
          setloading(false);
          errorToast("Error fetching orders");
          console.error(error);
        }
      }
    };

    getOrder();

    return () => {
      isMounted = false;
    };
  }, [Params, reloaddata, setalldata, setreloaddata]);

  const handleShowPerPage = useCallback(
    (value: number | string) => {
      const numValue = Number(value);

      if (isNaN(numValue) || numValue <= 0) {
        console.warn("Invalid value for items per page:", value);
        return;
      }

      const param = new URLSearchParams(searchParam.toString());
      param.set("p", "1");
      param.set("limit", numValue.toString());

      setpage(1);
      setshow(numValue);

      router.replace(`?${param.toString()}`, { scroll: false });
      setreloaddata(true);
    },
    [searchParam, router, setreloaddata]
  );

  const handlePage = useCallback(
    (value: string | number) => {
      const pageNum = Number(value);

      if (isNaN(pageNum) || pageNum <= 0 || !Number.isInteger(pageNum)) {
        console.warn("Invalid page number:", value);
        return;
      }

      const param = new URLSearchParams(searchParam.toString());
      param.set("p", pageNum.toString());

      setpage(pageNum);

      router.replace(`?${param.toString()}`, { scroll: false });
      setreloaddata(true);
    },
    [searchParam, router, setreloaddata]
  );

  const PageTitle = useMemo(() => {
    return user?.role === "USER"
      ? `${user.username}'s Order`
      : "Order Management";
  }, [user?.role, user?.username]);

  const handleFilterStatus = useCallback((val: Orderstatus[]) => {
    setfitlerstatus(val);
  }, []);

  const handleSelectDelete = useCallback(async () => {
    if (!selected?.length) return;

    try {
      setloading(true);
      const delReq = await ApiRequest({
        url: "/api/order/list",
        method: "DELETE",
        data: {
          id: selected,
          ty: "multi",
        },
      });

      if (!delReq.success) {
        errorToast("Unable to delete selected orders");
        setloading(false);
        return;
      }

      successToast(
        `Successfully deleted ${selected.length} order${
          selected.length > 1 ? "s" : ""
        }`
      );
      setloading(false);
      setreloaddata(true);
      setselected([]);
    } catch (error) {
      setloading(false);
      errorToast("Error deleting orders");
      console.error(error);
    }
  }, [selected, setreloaddata]);

  // Memoize table pagination props
  const paginationProps = useMemo(
    () => ({
      itemscount: 10,
      show: show.toString(),
      page,
      setpage: handlePage,
      onShowPage: handleShowPerPage,
    }),
    [show, page, handlePage, handleShowPerPage]
  );

  // Memoize order data
  const orderData = useMemo(() => allData?.orders || [], [allData?.orders]);

  return (
    <main className="w-full h-full flex flex-col items-start px-4 py-6 md:px-6 lg:px-8 gap-y-6 bg-gray-50 rounded-lg shadow-sm">
      {/* Page Header */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 transition-colors">
          {PageTitle}
        </h1>

        {/* Show selected count badge */}
        {selected && selected?.length > 0 && (
          <div className="flex items-center">
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {selected.length} item{selected.length !== 1 ? "s" : ""} selected
            </span>
          </div>
        )}
      </div>

      {/* Filters and Actions Row */}
      <div className="orderBtnGroup w-full flex flex-wrap items-center gap-3 py-2">
        <div className="flex-1 min-w-[200px]">
          <AsyncSelection
            data={() => AllOrderStatusData}
            type="normal"
            customRender={CustomSelectRender as never}
            option={{
              multiple: true,
              name: "orderstatus",
              selectedValue: fitlerstatus,
              onChange: (e) =>
                handleFilterStatus(
                  e.target.value.split(",") as unknown as Orderstatus[]
                ),
              className:
                "w-full h-[40px] bg-white border border-gray-200 rounded-md shadow-sm",
              color: "default",
              variant: "bordered",
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton isFilter={!!Params} />

          <DownloadButton />

          {selected && selected.length > 0 && (
            <Button
              onPress={() =>
                setopenmodal({
                  confirmmodal: {
                    open: true,
                    onAsyncDelete: handleSelectDelete,
                  },
                })
              }
              className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transform transition hover:scale-105 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete {selected?.length}
            </Button>
          )}
        </div>
      </div>

      {/* Table Container with Improved Styling */}
      <div className="orderList w-full h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <TableComponent
          ty="ordermanagement"
          isLoading={loading}
          data={orderData as never}
          pagination={paginationProps}
          onPagination={(ty, val) =>
            ty === "limit" ? handleShowPerPage(val) : handlePage(val)
          }
          onSelection={(val) => setselected(val as Array<string>)}
          selectedvalue={selected}
        />
      </div>
    </main>
  );
};

export default memo(OrderPage);
