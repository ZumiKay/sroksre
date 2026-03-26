import {
  ButtonSsr,
  DownloadButton,
  FilterButton,
  OrderDetailType,
  OrderBulkSelectProvider,
  RowCheckbox,
  PaginationSSR,
} from "./OrderComponent";
import { MultipleSelect } from "../../component/Button";
import { getFilterOrder, GetOrder, purgeExpiredUnpaidOrders } from "./action";
import { Productordertype, totalpricetype } from "@/src/types/order.type";
import { getUser } from "@/src/lib/session";
import { notFound, redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faShoppingBag,
  faShoppingCart,
  faClock,
  faSpinner,
  faCheckCircle,
  faDollarSign,
  faFilter,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import {
  AllOrderStatusColor,
  AllorderType,
  removeSpaceAndToLowerCase,
  encrypt,
} from "@/src/lib/utilities";
import { OrderUserType } from "../../checkout/action";
import React, { Suspense, cache } from "react";
import type { Metadata } from "next";
import { Role } from "@/prisma/generated/prisma/enums";
import { getCheckoutdata } from "../../checkout/fetchaction";
import { Allstatus } from "@/src/types/order.type";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order Management | SrokSre Dashboard",
  description: "Manage and track all orders in your system",
};

// Enable revalidation for this page
export const revalidate = 60; // Revalidate every 60 seconds

// Type definitions
interface SearchParams {
  p?: string;
  show?: string;
  status?: string;
  q?: string;
  fromdate?: string;
  todate?: string;
  startprice?: string;
  endprice?: string;
}

interface OrderStats {
  total: number;
  unpaid: number;
  preparing: number;
  shipped: number;
  arrived: number;
  totalRevenue: number;
}

export interface AllorderStatus {
  id: string;
  status: string;
  price: totalpricetype;
  shippingtype?: string;
  createdAt: Date;
  updatedAt: Date;
}

//Composite component
export default async function OrderManagement({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Get user with error handling
  const getuser = await getUser({
    userId: true,
    user: {
      select: {
        role: true,
        buyer_id: true,
      },
    },
  });

  if (
    !getuser ||
    (getuser.user.role !== Role.USER && getuser.user.role !== Role.ADMIN)
  ) {
    return notFound();
  }

  // Parse and validate search parameters
  const resolvedSearchParams = await searchParams;
  const {
    p = "1",
    show = "10",
    status,
    q,
    fromdate,
    todate,
    startprice,
    endprice,
  } = resolvedSearchParams ?? {};

  const page = Math.max(1, parseInt(p as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(show as string) || 10));
  const selectedStatus = status ? (status as string).split(",") : undefined;
  const isFilter = Boolean(q || fromdate || todate || startprice || endprice);

  //Mark expired order
  await purgeExpiredUnpaidOrders();

  const userId =
    getuser.user.role === Role.USER ? getuser.user.buyer_id : undefined;

  try {
    const [ordersResult, filterResult] = await Promise.all([
      GetOrder(undefined, undefined, page, limit, userId),
      isFilter || selectedStatus
        ? getFilterOrder({
            status: selectedStatus,
            page,
            limit,
            search: q ? removeSpaceAndToLowerCase(q.toString()) : undefined,
            startprice: parseFloat((startprice as string) ?? "0"),
            endprice: parseFloat((endprice as string) ?? "0"),
            fromdate: fromdate || undefined,
            todate: todate || undefined,
            userid: userId,
          })
        : Promise.resolve({ data: [], total: 0 }),
    ]);

    const orders = (
      isFilter || selectedStatus
        ? (filterResult as { data?: AllorderStatus[] }).data
        : (ordersResult?.data as AllorderStatus[])
    ) ?? undefined;

    const totalOrders =
      isFilter || selectedStatus
        ? (filterResult.total ?? 0)
        : (ordersResult?.total ?? 0);

    const totalPages = Math.ceil(totalOrders / limit);

    // Calculate statistics efficiently
    const stats = calculateOrderStats(orders || [], totalOrders);

    return (
      <main className="order__container w-full min-h-screen bg-gray-50 p-5 md:p-8">
        <OrderHeader stats={stats} />
        <FilterSection
          isFilter={isFilter}
          filterData={{ todate, fromdate, q, startprice, endprice }}
        />
        <OrderBulkSelectProvider
          orderIds={(orders ?? []).map((o) => o.id)}
          isAdmin={getuser.user.role === Role.ADMIN}
        >
          <OrdersTable
            orders={orders}
            isAdmin={getuser.user.role === Role.ADMIN}
            searchParams={resolvedSearchParams}
          />
        </OrderBulkSelectProvider>
        {orders && orders.length > 0 && totalPages > 1 && (
          <PaginationSection page={page} show={show} totalPages={totalPages} />
        )}
      </main>
    );
  } catch (error) {
    console.log("Error fetching orders:", error);
    return (
      <main className="order__container w-full min-h-screen bg-gray-50 p-5 md:p-8">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-400 text-2xl"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Error Loading Orders
            </h2>
            <p className="text-sm text-gray-500">Please try again later</p>
          </div>
        </div>
      </main>
    );
  }
}

// Helper function to calculate stats
function calculateOrderStats(
  orders: AllorderStatus[],
  totalOrders: number,
): OrderStats {
  return {
    total: totalOrders,
    unpaid: orders.filter((o) => o.status?.toLowerCase() === "unpaid").length,
    preparing: orders.filter((o) => o.status?.toLowerCase() === "preparing")
      .length,
    shipped: orders.filter((o) => o.status?.toLowerCase() === "shipped").length,
    arrived: orders.filter((o) => o.status?.toLowerCase() === "arrived").length,
    totalRevenue: orders.reduce(
      (sum, o) => sum + ((o.price as totalpricetype)?.total ?? 0),
      0,
    ),
  };
}

// Separate component for header section
function OrderHeader({ stats }: { stats: OrderStats }) {
  const statisticsCards = [
    {
      icon: faShoppingCart,
      gradient: "from-blue-500 to-purple-600",
      textColor: "text-blue-600",
      label: "Total Orders",
      value: stats.total.toString(),
    },
    {
      icon: faClock,
      gradient: "from-red-500 to-rose-600",
      textColor: "text-red-600",
      label: "Unpaid",
      value: stats.unpaid.toString(),
    },
    {
      icon: faSpinner,
      gradient: "from-indigo-500 to-blue-600",
      textColor: "text-indigo-600",
      label: "Preparing",
      value: stats.preparing.toString(),
    },
    {
      icon: faTruck,
      gradient: "from-amber-500 to-orange-500",
      textColor: "text-amber-600",
      label: "Shipped",
      value: stats.shipped.toString(),
    },
    {
      icon: faCheckCircle,
      gradient: "from-emerald-500 to-green-600",
      textColor: "text-emerald-600",
      label: "Arrived",
      value: stats.arrived.toString(),
    },
  ];

  return (
    <div className="w-full mb-8">
      {/* Page title bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-7">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Dashboard / Orders
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            Order Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track, filter, and manage all customer orders
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-2">
        {statisticsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-linear-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-sm`}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className="text-white text-base"
              />
            </div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
              {card.label}
            </p>
            <p className={`text-2xl font-extrabold ${card.textColor}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Separate component for filter section
function FilterSection({
  isFilter,
  filterData,
}: {
  isFilter: boolean;
  filterData: Partial<SearchParams>;
}) {
  const activeFilterCount = Object.values(filterData).filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 mb-6">
      <div className="filter_container w-full flex flex-col md:flex-row items-start md:items-center gap-3">
        {/* Status multi-select */}
        <div className="w-full md:w-72 shrink-0">
          <MultipleSelect />
        </div>

        {/* Divider */}
        <div className="hidden md:block h-10 w-px bg-gray-200" />

        {/* Filter + Export buttons */}
        <div className="flex flex-row flex-wrap items-center gap-2">
          <div className="relative">
            <FilterButton isFilter={!isFilter} data={filterData} />
            {isFilter && activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          <DownloadButton />
        </div>

        {/* Active filter summary chips */}
        {isFilter && (
          <div className="flex flex-wrap gap-1.5 md:ml-auto">
            {filterData.q && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
                {`"${filterData.q}"`}
              </span>
            )}
            {(filterData.fromdate || filterData.todate) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                {filterData.fromdate ?? "…"} → {filterData.todate ?? "…"}
              </span>
            )}
            {(filterData.startprice || filterData.endprice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                <FontAwesomeIcon icon={faDollarSign} className="text-[10px]" />
                {filterData.startprice ?? "0"} – {filterData.endprice ?? "∞"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for orders table
function OrdersTable({
  orders,
  isAdmin,
  searchParams,
}: {
  orders: AllorderStatus[] | undefined;
  isAdmin: boolean;
  searchParams?: SearchParams;
}) {
  const colSpan = isAdmin ? 9 : 7;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <div className="orderlist min-w-237.5 w-full">
          <table width="100%" className="ordertable">
            <thead>
              <tr className="bg-linear-to-r from-gray-900 to-gray-700 text-white h-12">
                {isAdmin && <th className="pl-6 pr-1 w-10" />}
                <th className="text-left pl-6 pr-3 font-semibold text-xs uppercase tracking-wider">
                  Order ID
                </th>
                <th className="text-left px-3 font-semibold text-xs uppercase tracking-wider">
                  Details
                </th>
                <th className="text-left px-3 font-semibold text-xs uppercase tracking-wider">
                  Products
                </th>
                <th className="text-left px-3 font-semibold text-xs uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-3 font-semibold text-xs uppercase tracking-wider">
                  Shipping
                </th>
                <th className="text-left px-3 font-semibold text-xs uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="text-left px-3 font-semibold text-xs uppercase tracking-wider">
                    Actions
                  </th>
                )}
                <th className="pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="py-24">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faShoppingBag}
                          className="text-gray-300 text-2xl"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-gray-500">
                          No orders found
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Orders will appear here once customers make purchases
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <Suspense
                    key={order.id}
                    fallback={<OrderRowSkeleton isAdmin={isAdmin} />}
                  >
                    <DataRow
                      idx={idx + 1}
                      data={order}
                      param={searchParams as never}
                      isAdmin={isAdmin}
                    />
                  </Suspense>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for order rows
function OrderRowSkeleton({ isAdmin }: { isAdmin: boolean }) {
  return (
    <tr className="animate-pulse">
      <td className="pl-6 pr-3 py-4">
        <div className="h-4 bg-gray-100 rounded-md w-20 mb-1.5"></div>
        <div className="h-3 bg-gray-100 rounded-md w-14"></div>
      </td>
      <td className="px-3 py-4">
        <div className="h-8 bg-gray-100 rounded-lg w-28"></div>
      </td>
      <td className="px-3 py-4">
        <div className="h-8 bg-gray-100 rounded-lg w-28"></div>
      </td>
      <td className="px-3 py-4">
        <div className="h-4 bg-gray-100 rounded-md w-16"></div>
      </td>
      <td className="px-3 py-4">
        <div className="h-5 bg-gray-100 rounded-full w-20"></div>
      </td>
      <td className="px-3 py-4">
        <div className="h-6 bg-gray-100 rounded-full w-20"></div>
      </td>
      {isAdmin && (
        <td className="px-3 py-4">
          <div className="h-8 bg-gray-100 rounded-lg w-20"></div>
        </td>
      )}
      <td className="pr-6"></td>
    </tr>
  );
}

// Pagination section component
function PaginationSection({
  page,
  show,
  totalPages,
}: {
  page: number;
  show: string;
  totalPages: number;
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-1">
      <p className="text-xs text-gray-400 font-medium">
        Page <span className="font-semibold text-gray-600">{page}</span> of{" "}
        <span className="font-semibold text-gray-600">{totalPages}</span>
      </p>
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 px-4 py-2">
        <PaginationSSR total={totalPages} pages={page} limit={show} />
      </div>
    </div>
  );
}

// Cache helper function
const checkparam = cache((ty: string): string | undefined => {
  return Object.entries(AllorderType).find(([_, val]) => val === ty)?.[1];
});

// Cached order data fetching
const getOrderData = cache(
  async (
    oid: string, //orderId
    isAdmin: boolean,
    param?: { [key: string]: string | string[] | undefined },
  ): Promise<OrderDetailType | Productordertype[] | OrderUserType | null> => {
    if (!param) return null;

    const { ty, id } = param;

    if (!ty || !id || id !== oid) return null;

    const verifyParams = checkparam(ty as string);
    if (!verifyParams) {
      redirect("/dashboard/order");
    }

    try {
      const data = await (ty !== AllorderType.orderaction
        ? GetOrder(oid, ty as string)
        : getCheckoutdata(oid));

      if (!data) {
        redirect("/dashboard/order");
      }

      const resultData = (data as any)?.data ?? data;

      if (ty === AllorderType.orderdetail) {
        return resultData as unknown as OrderDetailType;
      } else if (ty === AllorderType.orderproduct) {
        return resultData as unknown as Productordertype[];
      } else if (isAdmin && ty === AllorderType.orderaction) {
        return resultData as unknown as OrderUserType;
      }
    } catch (error) {
      console.log(`Error fetching order data for ${oid}:`, error);
      return null;
    }

    return null;
  },
);

export async function DataRow({
  idx,
  data,
  param,
  isAdmin,
}: {
  idx: number;
  data: AllorderStatus;
  param?: { [key: string]: string | string[] | undefined };
  isAdmin: boolean;
}) {
  // Fetch order data only if needed
  const orderData = param ? await getOrderData(data.id, isAdmin, param) : null;

  // Build a checkout resume link for the order owner's unpaid orders
  const checkoutUrl = (() => {
    if (isAdmin || data.status !== Allstatus.unpaid) return null;
    try {
      const encrypted = encrypt(data.id, process.env.KEY as string);
      return `/checkout?step=1&orderid=${encrypted}`;
    } catch {
      return null;
    }
  })();

  //Date Fomatter
  const orderDate = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  //Mapped status to its color
  const statusColor =
    AllOrderStatusColor[data.status.toLowerCase()] || "#6B7280";

  const shippingLabel = data.shippingtype
    ? data.shippingtype.replace(/_/g, " ")
    : null;

  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      {/* Bulk select checkbox — admin only */}
      {isAdmin && (
        <td className="pl-6 pr-1 py-4">
          <RowCheckbox id={data.id} />
        </td>
      )}
      {/* Order ID + date */}
      <td className="pl-6 pr-3 py-4">
        <div className="flex flex-col">
          <span
            className="font-mono text-sm font-bold text-gray-800 truncate"
            title={data.id}
          >
            #{data.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5">{orderDate}</span>
        </div>
      </td>

      {/* Details button */}
      <td className="px-3 py-4">
        <ButtonSsr
          idx={idx}
          type={AllorderType.orderdetail}
          name="Details"
          color="#3B82F6"
          height="36px"
          width="110px"
          data={{ detail: orderData as OrderDetailType }}
          id={data.id}
          orderdata={data}
          isAdmin={isAdmin}
        />
      </td>

      {/* Products button */}
      <td className="px-3 py-4">
        <ButtonSsr
          idx={idx}
          type={AllorderType.orderproduct}
          name="Products"
          color="#6366F1"
          height="36px"
          width="110px"
          data={{
            product: orderData as Array<Productordertype>,
          }}
          id={data.id}
          isAdmin={isAdmin}
        />
      </td>

      {/* Amount */}
      <td className="px-3 py-4">
        <span className="text-sm font-bold text-gray-900">
          ${(data.price?.total ?? 0).toFixed(2)}
        </span>
      </td>

      {/* Shipping type */}
      <td className="px-3 py-4">
        {shippingLabel ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium capitalize">
            <FontAwesomeIcon icon={faTruck} className="text-[10px] shrink-0" />
            {shippingLabel}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Status badge */}
      <td className="px-3 py-4">
        <span
          style={{
            backgroundColor: statusColor + "18",
            color: statusColor,
            borderColor: statusColor + "40",
          }}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border"
        >
          {data.status}
        </span>
      </td>

      {/* Admin actions */}
      {isAdmin && (
        <td className="px-3 py-4">
          <ButtonSsr
            idx={idx}
            type={AllorderType.orderaction}
            name="Manage"
            color="#10B981"
            height="36px"
            width="90px"
            data={{ action: orderData as OrderUserType }}
            id={data.id}
            isAdmin={isAdmin}
          />
        </td>
      )}

      {/* Resume checkout */}
      <td className="pr-6 py-4">
        {checkoutUrl && (
          <Link
            href={checkoutUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            Resume
          </Link>
        )}
      </td>
    </tr>
  );
}
