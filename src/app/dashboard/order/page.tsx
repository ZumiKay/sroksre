import { PaginationSSR } from "./OrderComponent";
import { MultipleSelect } from "../../component/Button";
import { AllOrdersReturn, getFilterOrder, GetOrder } from "./action";
import { notFound } from "next/navigation";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import React from "react";
import { getUser } from "../../action";
import { AllorderStatus } from "@/src/context/OrderContext";
import { DownloadButton, FilterButton } from "./Button";
export default async function OrderManagement(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const getuser = await getUser();

  if (!getuser || (getuser.role !== "USER" && getuser.role !== "ADMIN")) {
    return notFound();
  }

  const {
    p = "1",
    show = "1",
    status,
    q,
    fromdate,
    todate,
    startprice,
    endprice,
  } = searchParams ?? {};

  const selectedStatus = status ? (status as string).split(",") : undefined;

  const req = await GetOrder(
    undefined,
    undefined,
    parseInt(p as string),
    parseInt(show as string),
    getuser.role === "USER" ? getuser.id : undefined
  );

  const filterorder = await getFilterOrder({
    status: selectedStatus ?? [""],
    page: parseInt(p as string),
    limit: parseInt(show as string),
    search: q ? removeSpaceAndToLowerCase(q.toString()) : undefined,
    startprice: parseFloat((startprice as string) ?? "0"),
    endprice: parseFloat((endprice as string) ?? "0"),
    fromdate: fromdate ? fromdate : undefined,
    todate: todate ? todate : undefined,
    userid: getuser.role === "USER" ? getuser.id : undefined,
  });

  const isFilter = q || fromdate || todate || startprice || endprice;

  const total = Math.ceil(
    (isFilter ? filterorder.total ?? 0 : (req as AllOrdersReturn)?.total) /
      parseInt(show as string)
  );

  const orders =
    isFilter || selectedStatus
      ? filterorder.data
      : ((req as AllOrdersReturn).order as unknown as AllorderStatus[]);

  return (
    <main className="order__container w-full min-h-screen flex flex-col items-start gap-y-5 pl-2 pr-2 relative">
      <div
        className="filter_container w-full flex flex-row items-center gap-x-5
      max-large_phone:justify-center
      max-large_phone:flex-col max-large_phone:gap-y-5"
      >
        <div className="w-[300px] max-small_phone:w-[95%]">
          <MultipleSelect />
        </div>

        <div className="w-full h-full flex flex-row items-center gap-x-3 max-large_phone:justify-center">
          <FilterButton isFilter={!isFilter} />
          <DownloadButton />
        </div>
      </div>
      <div className="w-full h-full overflow-x-auto">
        <div className="orderlist min-w-[950px] w-full h-fit">
          <table width={"100%"} className="ordertable text-lg font-medium">
            <thead>
              <tr className="text-left bg-[#495464] text-white h-[50px] rounded-2xl">
                <th className="rounded-l-lg pl-2">Order ID#</th>
                <th align="left">Details</th>
                <th> Products</th>
                <th> Amount</th>
                <th>Status</th>
                <th></th>
                <th className="rounded-r-lg"></th>
              </tr>
              <tr className="h-[30px]"></tr>
            </thead>
            <tbody>
              {!orders || (orders && orders.length === 0) ? (
                <tr>
                  <td className="w-fit font-bold text-xl pl-3">
                    No Purchased Order Yet :)
                  </td>
                </tr>
              ) : (
                orders?.map((i, idx) => (
                  <DataRow
                    key={`row${idx}`}
                    idx={idx + 1}
                    data={i as AllorderStatus}
                    param={searchParams}
                    isAdmin={getuser.role === "ADMIN"}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {orders && orders.length !== 0 && (
        <div className="w-full h-fit relative mt-10 bottom-0">
          <PaginationSSR
            total={total}
            pages={parseInt(p as string)}
            limit={show}
          />
        </div>
      )}
    </main>
  );
}
