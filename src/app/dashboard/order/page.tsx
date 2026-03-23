import {
  ButtonSsr,
  DownloadButton,
  FilterButton,
  OrderDetailType,
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
  pending: number;
  processing: number;
  completed: number;
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

  // Purge expired unpaid orders before loading the page
  await purgeExpiredUnpaidOrders();

  // Parallel data fetching for better performance
  const userId = getuser.user.role === Role.USER ? getuser.user.buyer_id : undefined;

  try {
    const [ordersResult, filterResult] = await Promise.all([
      GetOrder(undefined, undefined, page, limit, getuser.user.buyer_id),
      isFilter || selectedStatus
        ? getFilterOrder({
            status: selectedStatus ?? [""],
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

    const orders = ordersResult?.data as AllorderStatus[] | undefined;

    const totalOrders =
      isFilter || selectedStatus
        ? (filterResult.total ?? 0)
        : (ordersResult?.total ?? 0);

    const totalPages = Math.ceil(totalOrders / limit);

    // Calculate statistics efficiently
    const stats = calculateOrderStats(orders || [], totalOrders);

    return (
      <main className="order__container w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6 md:p-8">
        <OrderHeader stats={stats} />
        <FilterSection
          isFilter={isFilter}
          filterData={{ todate, fromdate, q, startprice, endprice }}
        />
        <OrdersTable
          orders={orders}
          isAdmin={getuser.role === Role.ADMIN}
          searchParams={resolvedSearchParams}
        />
        {orders && orders.length > 0 && totalPages > 1 && (
          <PaginationSection page={page} show={show} totalPages={totalPages} />
        )}
      </main>
    );
  } catch (error) {
    console.log("Error fetching orders:", error);
    return (
      <main className="order__container w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6 md:p-8">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-500 text-3xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Orders
          </h2>
          <p className="text-gray-600">Please try again later</p>
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
    pending: orders.filter((o) => o.status?.toLowerCase() === "pending").length,
    processing: orders.filter((o) => o.status?.toLowerCase() === "processing")
      .length,
    completed: orders.filter((o) => o.status?.toLowerCase() === "completed")
      .length,
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
      label: "Total Orders",
      value: stats.total,
    },
    {
      icon: faClock,
      gradient: "from-yellow-500 to-orange-600",
      label: "Pending",
      value: stats.pending,
    },
    {
      icon: faSpinner,
      gradient: "from-indigo-500 to-blue-600",
      label: "Processing",
      value: stats.processing,
    },
    {
      icon: faCheckCircle,
      gradient: "from-green-500 to-emerald-600",
      label: "Completed",
      value: stats.completed,
    },
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Order Management
          </h1>
          <p className="text-gray-600">
            Track and manage all orders in your system
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statisticsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-12 h-12 rounded-lg bg-linear-to-br ${card.gradient} flex items-center justify-center`}
              >
                <FontAwesomeIcon
                  icon={card.icon}
                  className="text-white text-xl"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
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
  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6">
      <div className="filter_container w-full flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-full md:w-75">
          <MultipleSelect />
        </div>

        <div className="w-full md:w-auto flex flex-row items-center gap-3">
          <FilterButton isFilter={!isFilter} data={filterData} />
          <DownloadButton />
        </div>
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
  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <div className="orderlist min-w-237.5 w-full">
          <table width="100%" className="ordertable">
            <thead>
              <tr className="bg-linear-to-r from-gray-800 to-gray-700 text-white h-14">
                <th className="text-left pl-6 font-semibold text-sm">
                  Order ID
                </th>
                <th className="text-left font-semibold text-sm">Details</th>
                <th className="text-left font-semibold text-sm">Products</th>
                <th className="text-left font-semibold text-sm">Amount</th>
                <th className="text-left font-semibold text-sm">Status</th>
                {isAdmin && (
                  <th className="text-left font-semibold text-sm">Actions</th>
                )}
                <th className="pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                        <FontAwesomeIcon
                          icon={faShoppingBag}
                          className="text-gray-400 text-3xl"
                        />
                      </div>
                      <p className="text-xl font-semibold text-gray-600 mb-2">
                        No Orders Yet
                      </p>
                      <p className="text-sm text-gray-400">
                        Orders will appear here once customers make purchases
                      </p>
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
      <td className="pl-6 py-4">
        <div className="h-4 bg-gray-200 rounded-sm w-24"></div>
      </td>
      <td className="py-4">
        <div className="h-8 bg-gray-200 rounded-sm w-28"></div>
      </td>
      <td className="py-4">
        <div className="h-8 bg-gray-200 rounded-sm w-32"></div>
      </td>
      <td className="py-4">
        <div className="h-4 bg-gray-200 rounded-sm w-20"></div>
      </td>
      <td className="py-4">
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </td>
      {isAdmin && (
        <td className="py-4">
          <div className="h-8 bg-gray-200 rounded-sm w-24"></div>
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
    <div className="w-full flex justify-center mt-8">
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
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

      if (ty === AllorderType.orderdetail) {
        return data as unknown as OrderDetailType;
      } else if (ty === AllorderType.orderproduct) {
        return data as unknown as Productordertype[];
      } else if (isAdmin && ty === AllorderType.orderaction) {
        return data as unknown as OrderUserType;
      }
    } catch (error) {
      console.log(`Error fetching order data for ${oid}:`, error);
      return null;
    }

    return null;
  },
);

// Optimized DataRow component
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

  // Memoize date formatting
  const orderDate = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const statusColor =
    AllOrderStatusColor[data.status.toLowerCase()] || "#6B7280";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="pl-6 py-4">
        <div className="flex flex-col">
          <span
            className="font-mono text-sm font-semibold text-gray-800 truncate"
            title={data.id}
          >
            #{data.id.slice(0, 8)}
          </span>
          <span className="text-xs text-gray-500 mt-1">{orderDate}</span>
        </div>
      </td>
      <td className="py-4">
        <ButtonSsr
          idx={idx}
          type={AllorderType.orderdetail}
          name="View Details"
          color="#3B82F6"
          height="40px"
          width="120px"
          data={{ detail: orderData as OrderDetailType }}
          id={data.id}
          orderdata={data}
          isAdmin={isAdmin}
        />
      </td>
      <td className="py-4">
        <ButtonSsr
          idx={idx}
          type={AllorderType.orderproduct}
          name="View Products"
          color="#6366F1"
          height="40px"
          width="130px"
          data={{ product: orderData as Array<Productordertype> }}
          id={data.id}
          isAdmin={isAdmin}
        />
      </td>
      <td className="py-4">
        <span className="font-semibold text-gray-800">
          ${(data.price?.total ?? 0).toFixed(2)}
        </span>
      </td>
      <td className="py-4">
        <span
          style={{
            backgroundColor: statusColor + "20",
            color: statusColor,
          }}
          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
        >
          {data.status}
        </span>
      </td>
      {isAdmin && (
        <td className="py-4">
          <ButtonSsr
            idx={idx}
            type={AllorderType.orderaction}
            name="Manage"
            color="#10B981"
            height="40px"
            width="100px"
            data={{ action: orderData as OrderUserType }}
            id={data.id}
            isAdmin={isAdmin}
          />
        </td>
      )}
      <td className="pr-6 py-4">
        {checkoutUrl && (
          <Link
            href={checkoutUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Resume Checkout
          </Link>
        )}
      </td>
    </tr>
  );
}
