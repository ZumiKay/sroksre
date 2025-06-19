"use client";

import { ApiRequest, useCheckSession } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { errorToast, successToast } from "../../component/Loading";
import { AsyncSelection } from "../../component/AsynSelection";
import {
  AllOrderStatusData,
  Allstatus,
  Orderstatus,
  Ordertype,
} from "@/src/context/OrderContext";
import { Button, Chip } from "@heroui/react";
import { SelectType } from "@/src/context/GlobalType.type";
import dynamic from "next/dynamic";
import { IsNumber } from "@/src/lib/utilities";
import { DeleteIcon } from "../../component/Asset";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import FilterMenu from "../../component/FilterMenu/FilterMenu";
import { parseDate } from "@internationalized/date";
import { formatDate } from "../../component/EmailTemplate";
import { revalidateTag } from "next/cache";
import ActionModal from "./OrderComponent";
const TableComponent = dynamic(
  () => import("../../component/Table/Table_Component"),
  { ssr: false }
);

// Enhanced styled chip component for better visual presentation
const CustomSelectRender = ({ status }: { status: SelectType<string> }) => {
  return (
    <Chip
      key={status?.value ?? "key"}
      style={{
        backgroundColor: status?.color ?? "black",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}
      className="text-white font-bold px-3 py-1 rounded-full text-sm hover:opacity-90"
    >
      {status?.label}
    </Chip>
  );
};

// Custom hook for parameter handling
const useOrderParams = () => {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const p = searchParams.get("p");
    const show = searchParams.get("lt");
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
  const {
    allData,
    setalldata,
    reloaddata,
    setreloaddata,
    openmodal,
    setopenmodal,
    setfiltervalue,
    setitemlength,
    globalindex,
  } = useGlobalContext();
  const { user } = useCheckSession();
  const searchParam = useSearchParams();
  const router = useRouter();
  const Params = useOrderParams();
  const [fitlerstatus, setfitlerstatus] = useState<Orderstatus[]>(["All"]);
  const [page, setpage] = useState(1);
  const [show, setshow] = useState(5);
  const [loading, setloading] = useState(false);
  const [selected, setselected] = useState<Array<string>>([]);
  const [orderCount, setorderCount] = useState(0);

  // Data fetching effect

  useEffect(() => {
    if (Params?.status && !Params) {
      redirect("/notfound");
    }

    //Initialize filter value
    setfiltervalue({
      status: Params?.status ? Params.status.join(",") : undefined,
      search: Params?.search || "",
      price: {
        start: Params?.startprice ?? 0,
        end: Params?.endprice ?? 0,
      },
      orderdate: {
        start: parseDate(Params?.fromdate ?? formatDate(new Date(), true)),
        end: parseDate(Params?.todate ?? formatDate(new Date(), true)),
      },
    });
  }, [Params]);

  //Fetch Order Data
  useEffect(() => {
    const GetOrder = async () => {
      if (!Params) return;

      try {
        setloading(true);
        const url = !Params
          ? `/api/order/list?ty=all&p=${page}&lt=${show}`
          : `/api/order/list?ty=filter${
              Params.status ? `&status=${Params.status.join(",")}` : ""
            }${Params.startprice ? `&startprice=${Params.startprice}` : ""}${
              Params.fromdate ? `&fromdate=${Params.fromdate}` : ""
            }${Params.todate ? `&todate=${Params.todate}` : ""}${
              Params.search ? `&q=${Params.search}` : ""
            }&p=${Params.page}&lt=${Params.limit}`;
        const response = await ApiRequest({
          url,
          method: "GET",
          revalidate: `orderlist#${user?.id}`,
        });
        setloading(false);

        if (!response.success) {
          errorToast("Failed to fetch orders");

          return;
        }

        setalldata((prev) => ({
          ...prev,
          orders: response.data as Array<Ordertype>,
        }));
        setorderCount(response.total || 0);
        if (response.totalFiltered) {
          setitemlength({ totalitems: response.totalFiltered } as never);
        }
        setloading(false);
      } catch (error) {
        setloading(false);
        errorToast("Error fetching orders");
        console.error(error);
      } finally {
        setreloaddata(false);
      }
    };

    if (reloaddata) GetOrder();
  }, [Params, page, reloaddata, show, user?.id]);

  const handleShowPerPage = useCallback(
    (value: number | string) => {
      const numValue = Number(value);
      if (IsNumber(value.toString()) || numValue <= 0) {
        console.warn("Invalid value for items per page:", value);
        return;
      }

      const param = new URLSearchParams(searchParam);
      param.set("p", "1");
      param.set("limit", value.toString());

      setpage(1);
      setshow(numValue);

      router.push(`?${param.toString()}`, { scroll: false });
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
      ? `${user?.username || "User"}'s Order`
      : "Order Management";
  }, [user?.role, user?.username]);

  const handleFilterStatus = useCallback(
    (val: Orderstatus[]) => {
      const param = new URLSearchParams(searchParam);
      param.set("p", "1");
      param.set("status", val.join(","));

      if (val.length === 0 || (val.length === 1 && val[0] === "All")) {
        param.delete("status");
        setfitlerstatus(["All"]);
      } else {
        setfitlerstatus(val);
      }
      router.push(`?${param.toString()}`, { scroll: false });
      setreloaddata(true);
      setfitlerstatus(val);
    },
    [router, searchParam, setreloaddata]
  );

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
        retryCount: 3,
        timeout: 5000,
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
      revalidateTag("orderlist#" + user?.id);
      setreloaddata(true);
      setselected([]);
    } catch (error) {
      setloading(false);
      errorToast("Error deleting orders");
      console.error(error);
    }
  }, [selected, setreloaddata, user?.id]);

  const renderActionModal = useMemo(() => {
    const status = allData?.orders?.find(
      (i) => i.id === globalindex?.orderId
    )?.status;
    if (!openmodal.orderactionmodal || !status) return null;
    return (
      openmodal.orderactionmodal &&
      globalindex &&
      allData?.orders?.find((i) => i.id === globalindex.orderId)?.status && (
        <ActionModal status={status} />
      )
    );
  }, [allData?.orders, globalindex, openmodal.orderactionmodal]);

  return (
    <>
      {openmodal.filteroption && (
        <FilterMenu type="listorder" reloaddata={() => setreloaddata(true)} />
      )}
      {renderActionModal}

      <div className="w-full h-full flex flex-col items-start px-4 py-6 md:px-6 lg:px-8 gap-y-6 bg-gray-50 rounded-lg shadow-sm">
        {/* Page Header */}
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 transition-colors">
            {PageTitle}
          </h1>

          {/* Show selected count badge */}
          {selected && selected?.length > 0 && (
            <div className="flex items-center">
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                {selected.length} item{selected.length !== 1 ? "s" : ""}{" "}
                selected
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
              customRender={(item) =>
                fitlerstatus.length > 0
                  ? CustomSelectRender({ status: item })
                  : undefined
              }
              option={{
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
                "aria-label": "Order Status Filter",
                selectionMode: "multiple",
                placeholder: "Filter by Status",
              }}
            />
          </div>

          {selected && selected.length > 0 && (
            <Button
              onPress={() =>
                setopenmodal((prev) => ({
                  ...prev,
                  confirmmodal: {
                    open: true,
                    onAsyncDelete: handleSelectDelete,
                  },
                }))
              }
              className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transform transition hover:scale-105 active:scale-95"
              startContent={<DeleteIcon />}
            >
              Delete {selected?.length}
            </Button>
          )}
          <Button
            startContent={<FontAwesomeIcon icon={faFilter} />}
            onPress={() => setopenmodal({ filteroption: true })}
            className="max-w-sm font-bold bg-black text-white"
          >
            Filter
          </Button>
        </div>

        {/* Table Container with Improved Styling */}
        <section className="orderList w-full h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <TableComponent
            ty="ordermanagement"
            isLoading={loading}
            data={(allData?.orders ?? []) as never}
            pagination={{
              itemscount: orderCount,
              show: show.toString(),
              page,
              setpage: handlePage,
              onShowPage: handleShowPerPage,
            }}
            onPagination={(ty, val) =>
              ty === "limit" ? handleShowPerPage(val) : handlePage(val)
            }
            onSelection={(val) => setselected(val as Array<string>)}
            selectedvalue={selected}
          />
        </section>
      </div>
    </>
  );
};

export default OrderPage;
