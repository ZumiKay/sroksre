import {
  ButtonSsr,
  DownloadButton,
  FilterButton,
  OrderDetailType,
  OrderBulkSelectProvider,
  RowCheckbox,
  SelectAllCheckbox,
  PaginationSSR,
} from "./OrderComponent";
import { MultipleSelect } from "../../component/Button";
import { getFilterOrder, GetOrder, purgeExpiredUnpaidOrders } from "./action";
import { Productordertype, totalpricetype } from "@/src/types/order.type";
import { getUser } from "@/src/lib/session";
import { getOrderPageAccess } from "@/src/lib/adminGuard";
import Prisma from "@/src/lib/prisma";
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
import { Suspense, cache } from "react";
import type { Metadata } from "next";
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
}

export interface AllorderStatus {
  id: string;
  status: string;
  price: totalpricetype;
  shippingtype?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Page
export default async function OrderManagement({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const getuser = await getUser({
    userId: true,
    user: {
      select: {
        role: true,
        buyer_id: true,
      },
    },
  });

  // Admins see every order, so the 2FA rule for admin pages applies here
  // too. Customers only ever see their own orders.
  const access = await getOrderPageAccess(getuser?.user, getuser?.sessionid);
  if (access.view === "setup_mfa") redirect("/dashboard/security");
  if (access.view === "denied") notFound();

  const isAdmin = access.view === "all";
  const userId = access.view === "own" ? access.buyerId : undefined;

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
  const isFiltered = isFilter || !!selectedStatus;

  //Mark expired order
  await purgeExpiredUnpaidOrders();

  let data: Awaited<ReturnType<typeof loadOrders>>;
  try {
    data = await loadOrders({
      page,
      limit,
      userId,
      isFiltered,
      filter: {
        status: selectedStatus,
        page,
        limit,
        search: q ? removeSpaceAndToLowerCase(q.toString()) : undefined,
        startprice: parseFloat((startprice as string) ?? "0"),
        endprice: parseFloat((endprice as string) ?? "0"),
        fromdate: fromdate || undefined,
        todate: todate || undefined,
        userid: userId,
      },
    });
  } catch (error) {
    console.log("Error fetching orders:", error);
    return <LoadError />;
  }

  const { orders, totalOrders, stats } = data;
  const totalPages = Math.ceil(totalOrders / limit);
  const hasOrders = !!orders && orders.length > 0;

  return (
    <main className="order__container w-full min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="w-full max-w-350 mx-auto flex flex-col gap-6">
        <OrderHeader isAdmin={isAdmin} />
        <StatsGrid stats={stats} />

        <section className="bg-white rounded-2xl shadow-xs border border-gray-100">
          <FilterSection
            isAdmin={isAdmin}
            isFilter={isFilter}
            filterData={{ todate, fromdate, q, startprice, endprice }}
          />
          <OrderBulkSelectProvider
            orderIds={(orders ?? []).map((o) => o.id)}
            isAdmin={isAdmin}
          >
            <OrdersTable
              orders={orders}
              isAdmin={isAdmin}
              isFiltered={isFiltered}
              searchParams={resolvedSearchParams}
            />
          </OrderBulkSelectProvider>
          {hasOrders && (
            <TableFooter
              page={page}
              limit={limit}
              show={show}
              totalOrders={totalOrders}
              totalPages={totalPages}
            />
          )}
        </section>
      </div>
    </main>
  );
}

/** Loads the current page of orders, the matching total and the stat cards. */
async function loadOrders({
  page,
  limit,
  userId,
  isFiltered,
  filter,
}: {
  page: number;
  limit: number;
  userId?: string;
  isFiltered: boolean;
  filter: Parameters<typeof getFilterOrder>[0];
}) {
  const [ordersResult, filterResult, stats] = await Promise.all([
    isFiltered ? null : GetOrder(undefined, undefined, page, limit, userId),
    isFiltered ? getFilterOrder(filter) : null,
    getOrderStats(userId),
  ]);

  const orders = isFiltered
    ? (filterResult as { data?: AllorderStatus[] } | null)?.data
    : (ordersResult?.data as unknown as AllorderStatus[] | undefined);

  const totalOrders = isFiltered
    ? (filterResult?.total ?? 0)
    : (ordersResult?.total ?? 0);

  return { orders, totalOrders, stats };
}

function LoadError() {
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

/**
 * Order counts per status across all of the viewer's orders (not just the
 * current page). `buyerId` limits it to one customer.
 */
async function getOrderStats(buyerId?: string): Promise<OrderStats> {
  const groups = await Prisma.orders.groupBy({
    by: ["status"],
    where: buyerId ? { buyer_id: buyerId } : {},
    _count: { _all: true },
  });

  const count = (status: Allstatus) =>
    groups
      .filter((g) => g.status?.toLowerCase() === status.toLowerCase())
      .reduce((sum, g) => sum + g._count._all, 0);

  return {
    total: groups.reduce((sum, g) => sum + g._count._all, 0),
    unpaid: count(Allstatus.unpaid),
    preparing: count(Allstatus.prepareing),
    shipped: count(Allstatus.shipped),
    arrived: count(Allstatus.arrived),
  };
}

// Page title
function OrderHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
        Dashboard / Orders
      </p>
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
        {isAdmin ? "Order Management" : "My Orders"}
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        {isAdmin
          ? "Track, filter, and manage all customer orders"
          : "Track your orders and finish paying for unpaid ones"}
      </p>
    </header>
  );
}

// Status count cards
function StatsGrid({ stats }: { stats: OrderStats }) {
  const statisticsCards = [
    {
      icon: faShoppingCart,
      gradient: "from-blue-500 to-purple-600",
      textColor: "text-blue-600",
      label: "Total Orders",
      value: stats.total,
    },
    {
      icon: faClock,
      gradient: "from-red-500 to-rose-600",
      textColor: "text-red-600",
      label: "Unpaid",
      value: stats.unpaid,
    },
    {
      icon: faSpinner,
      gradient: "from-indigo-500 to-blue-600",
      textColor: "text-indigo-600",
      label: "Preparing",
      value: stats.preparing,
    },
    {
      icon: faTruck,
      gradient: "from-amber-500 to-orange-500",
      textColor: "text-amber-600",
      label: "Shipped",
      value: stats.shipped,
    },
    {
      icon: faCheckCircle,
      gradient: "from-emerald-500 to-green-600",
      textColor: "text-emerald-600",
      label: "Arrived",
      value: stats.arrived,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statisticsCards.map((card) => (
        <div
          key={card.label}
          className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div
            className={`w-11 h-11 shrink-0 rounded-xl bg-linear-to-br ${card.gradient} flex items-center justify-center shadow-sm`}
          >
            <FontAwesomeIcon icon={card.icon} className="text-white text-base" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide truncate">
              {card.label}
            </p>
            <p className={`text-2xl font-extrabold leading-tight ${card.textColor}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Filter toolbar, top of the orders card
function FilterSection({
  isAdmin,
  isFilter,
  filterData,
}: {
  isAdmin: boolean;
  isFilter: boolean;
  filterData: Partial<SearchParams>;
}) {
  const activeFilterCount = Object.values(filterData).filter(Boolean).length;
  const hasDate = !!(filterData.fromdate || filterData.todate);
  const hasPrice = !!(filterData.startprice || filterData.endprice);

  return (
    <div className="border-b border-gray-100">
      <div className="filter_container w-full p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
        {/* Status multi-select */}
        <div className="w-full md:w-72 shrink-0">
          <MultipleSelect />
        </div>

        <div className="hidden md:block h-10 w-px bg-gray-200" />

        {/* Filter + Export */}
        <div className="flex flex-row flex-wrap items-center gap-2">
          <div className="relative">
            <FilterButton isFilter={!isFilter} data={filterData} />
            {isFilter && activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          {/* Export is admin-only on the server, so only admins see it */}
          {isAdmin && <DownloadButton />}
        </div>
      </div>

      {/* Active filter chips */}
      {isFilter && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
            Active filters
          </span>
          {filterData.q && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
              {`"${filterData.q}"`}
            </span>
          )}
          {hasDate && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
              <FontAwesomeIcon icon={faClock} className="text-[10px]" />
              {filterData.fromdate ?? "…"} → {filterData.todate ?? "…"}
            </span>
          )}
          {hasPrice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
              <FontAwesomeIcon icon={faDollarSign} className="text-[10px]" />
              {filterData.startprice ?? "0"} – {filterData.endprice ?? "∞"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const TH = "text-left px-3 font-semibold text-xs uppercase tracking-wider";

// Orders table
function OrdersTable({
  orders,
  isAdmin,
  isFiltered,
  searchParams,
}: {
  orders: AllorderStatus[] | undefined;
  isAdmin: boolean;
  isFiltered: boolean;
  searchParams?: SearchParams;
}) {
  const colSpan = isAdmin ? 9 : 7;

  const emptyHint = isFiltered
    ? "Try changing or clearing the filters"
    : isAdmin
      ? "Orders will appear here once customers make purchases"
      : "Orders you place will show up here";

  return (
    <div className="w-full overflow-x-auto">
      <div className="orderlist min-w-237.5 w-full">
        <table width="100%" className="ordertable">
          <thead>
            <tr className="bg-linear-to-r from-gray-900 to-gray-700 text-white h-12">
              {isAdmin && (
                <th className="pl-6 pr-1 w-10">
                  <SelectAllCheckbox />
                </th>
              )}
              <th className={`${TH} pl-6`}>Order</th>
              <th className={TH}>Details</th>
              <th className={TH}>Products</th>
              <th className={TH}>Amount</th>
              <th className={TH}>Shipping</th>
              <th className={TH}>Status</th>
              {isAdmin && <th className={TH}>Actions</th>}
              <th className="pr-6">
                <span className="sr-only">Checkout</span>
              </th>
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
                        {emptyHint}
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
  );
}

// Skeleton loader for order rows
function OrderRowSkeleton({ isAdmin }: { isAdmin: boolean }) {
  return (
    <tr className="animate-pulse">
      {isAdmin && (
        <td className="pl-6 pr-1 py-4">
          <div className="w-5 h-5 bg-gray-100 rounded"></div>
        </td>
      )}
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

// Bottom of the orders card: range summary + pagination
function TableFooter({
  page,
  limit,
  show,
  totalOrders,
  totalPages,
}: {
  page: number;
  limit: number;
  show: string;
  totalOrders: number;
  totalPages: number;
}) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalOrders);

  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-400 font-medium shrink-0">
        Showing{" "}
        <span className="font-semibold text-gray-600">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-gray-600">{totalOrders}</span>{" "}
        orders
      </p>
      {totalPages > 1 && (
        <div className="w-full lg:w-auto">
          <PaginationSSR total={totalPages} pages={page} limit={show} />
        </div>
      )}
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

    let data;
    try {
      data = await (ty !== AllorderType.orderaction
        ? GetOrder(oid, ty as string)
        : getCheckoutdata(oid));
    } catch (error) {
      console.log(`Error fetching order data for ${oid}:`, error);
      return null;
    }

    // redirect() throws, so it has to stay outside the try block.
    if (!data) redirect("/dashboard/order");

    const resultData = (data as any)?.data ?? data;

    if (ty === AllorderType.orderdetail) {
      return resultData as unknown as OrderDetailType;
    } else if (ty === AllorderType.orderproduct) {
      return resultData as unknown as Productordertype[];
    } else if (isAdmin && ty === AllorderType.orderaction) {
      return resultData as unknown as OrderUserType;
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
