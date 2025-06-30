"use client";

import { ApiRequest, useCheckSession } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { errorToast, successToast } from "../../component/Loading";
import { AsyncSelection } from "../../component/AsynSelection";
import {
  AllOrderStatusData,
  Allstatus,
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
import ActionModal from "./OrderComponent";
import ProductPreviewModal from "../../component/Modals/ProductPreview";
import { AdditionalDetailModal } from "./AdditionalDetail_Component";
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
    const search = searchParams.get("search");
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
      search: search || undefined,
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
    filtervalue,
    setfiltervalue,
    setitemlength,
    globalindex,
  } = useGlobalContext();
  const { user } = useCheckSession();
  const searchParam = useSearchParams();
  const router = useRouter();
  const Params = useOrderParams();
  const [page, setpage] = useState(1);
  const [show, setshow] = useState(5);
  const [loading, setloading] = useState(false);
  const [selected, setselected] = useState<Array<string>>([]);
  const [orderCount, setorderCount] = useState(0);

  // Data fetching effect

  useEffect(() => {
    //Verify Status Param
    let toUpdateStatus: Array<Allstatus> | undefined = undefined;
    if (Params?.status) {
      const param = new URLSearchParams(searchParam);
      if (Params.status.some((i) => i.length === 0 || i === "")) {
        param.delete("status");
      }

      toUpdateStatus = (
        Params.status.length > 1
          ? Params.status.filter((i) => i !== Allstatus.all)
          : Params.status
      ) as Allstatus[];

      param.set("status", toUpdateStatus.join(","));
      router.push(`?${param}`);
    } else {
      toUpdateStatus = [Allstatus.all];
    }
    //Initialize filter value
    setfiltervalue({
      status: toUpdateStatus,
      search: Params?.search || "",
      startprice: Params?.startprice ?? 0,
      endprice: Params?.endprice ?? 0,
      orderdate: {
        start: Params?.fromdate ? parseDate(Params?.fromdate) : undefined,
        end: Params?.todate ? parseDate(Params?.todate) : undefined,
      } as never,
    });
  }, [Params, router, searchParam, setfiltervalue]);

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
              Params.endprice ? `&endprice=${Params.endprice}` : ""
            }${Params.fromdate ? `&fromdate=${Params.fromdate}` : ""}${
              Params.todate ? `&todate=${Params.todate}` : ""
            }${Params.search ? `&q=${Params.search}` : ""}&p=${
              Params.page
            }&lt=${Params.limit}`;
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
  }, [
    Params,
    page,
    reloaddata,
    setalldata,
    setitemlength,
    setreloaddata,
    show,
    user?.id,
  ]);

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
    (val: Allstatus[]) => {
      const param = new URLSearchParams(searchParam);
      param.set("p", "1");

      // Define reset function outside of conditionals to avoid recreation
      const resetStatus = () => {
        param.delete("status");
        setfiltervalue((prev) => ({
          ...prev,
          status: [Allstatus.all],
        }));
      };

      // Early exit for empty status values
      if (val.some((i) => !i)) {
        resetStatus();
        router.push(`?${param.toString()}`, { scroll: false });
        setreloaddata(true);
        return;
      }

      // Compute these values once to avoid repeated calculations
      const isAll = val.includes(Allstatus.all); // Using includes is slightly faster than some
      const specificStatuses = val.filter(
        (status) => status !== Allstatus.all && status
      );

      // First condition - handle specific statuses
      if (val[0] === Allstatus.all || (specificStatuses.length > 0 && !isAll)) {
        param.set("status", specificStatuses.join(","));
        setfiltervalue((prev) => ({
          ...prev,
          status: specificStatuses as Allstatus[],
        }));
      }

      // Second condition - reset to "All"
      if (
        val[0] !== Allstatus.all &&
        ((isAll && specificStatuses.length > 0) ||
          (!isAll && specificStatuses.length === 0))
      ) {
        resetStatus();
      }

      router.push(`?${param.toString()}`, { scroll: false });
      setreloaddata(true);
    },
    [router, searchParam, setfiltervalue, setreloaddata]
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
      setreloaddata(true);
      setselected([]);
    } catch (error) {
      setloading(false);
      errorToast("Error deleting orders");
      console.error(error);
    }
  }, [selected, setreloaddata]);

  const renderActionModal = useMemo(() => {
    const status = allData?.orders?.find(
      (i) => i.id === globalindex?.orderId
    )?.status;
    if (!openmodal.orderactionmodal || !status) return null;
    return (
      openmodal.orderactionmodal &&
      globalindex.orderId &&
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
      {openmodal.showproduct && <ProductPreviewModal />}
      {(openmodal.orderdetail || openmodal?.other) && (
        <AdditionalDetailModal
          type={openmodal.orderdetail ? "shipping" : "user"}
        />
      )}

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
                filtervalue?.status && filtervalue?.status.length > 0
                  ? CustomSelectRender({ status: item })
                  : undefined
              }
              option={{
                name: "orderstatus",
                selectedValue: filtervalue?.status
                  ? (filtervalue.status as Allstatus[])
                  : undefined,
                onChange: (e) => {
                  const val = e.target.value.split(",");

                  handleFilterStatus(val as Allstatus[]);
                },
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
