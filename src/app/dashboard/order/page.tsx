import {
  ButtonSsr,
  DownloadButton,
  FilterButton,
  OrderDetailType,
  PaginationSSR,
} from "./OrderComponent";
import { MultipleSelect } from "../../component/Button";
import { getFilterOrder, GetOrder } from "./action";
import {
  getUser,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { notFound, redirect } from "next/navigation";
import {
  AllOrderStatusColor,
  AllorderType,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";

import { OrderUserType } from "../../checkout/action";
import { getCheckoutdata } from "../../checkout/page";
import React from "react";

export interface AllorderStatus {
  id: string;
  status: string;
  price: totalpricetype;
  shippingtype?: string;
  createdAt: Date;
  updatedAt: Date;
}
export default async function OrderManagement({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const getuser = await getUser();

  if (!getuser || (getuser.role !== "USER" && getuser.role !== "ADMIN")) {
    return notFound();
  }

  let {
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

  const req: any = await GetOrder(
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
    (isFilter ? filterorder.total ?? 0 : req?.total) / parseInt(show as string)
  );

  const orders =
    isFilter || selectedStatus
      ? filterorder.data
      : (req?.order as unknown as AllorderStatus[]);

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
          <FilterButton
            isFilter={!isFilter}
            data={{ todate, fromdate, q, startprice, endprice }}
          />
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
                <th> Products </th>
                <th> Amount</th>
                <th>Status</th>
                <th></th>
                <th className="rounded-r-lg"> </th>
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

const checkparam = (ty: string) => {
  const isValid = Object.entries(AllorderType).find(
    ([_, val]) => val === ty
  )?.[1];

  return isValid;
};

const getOrderData = async (
  oid: string,
  isAdmin: boolean,
  param?: { [key: string]: string | string[] | undefined }
) => {
  if (param) {
    const { ty, id } = param;

    if (ty && id) {
      const verifyParams = checkparam(ty as string);
      if (!verifyParams) {
        redirect("/dashboard/order");
      }

      if (id === oid) {
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
        }
        if (!isAdmin) {
        } else {
          if (ty === AllorderType.orderaction) {
            return data as unknown as OrderUserType;
          }
        }
      }
    }
  }

  return null;
};

export const DataRow = async ({
  idx,
  data,
  param,
  isAdmin,
}: {
  idx: number;
  data: AllorderStatus;
  param?: { [key: string]: string | string[] | undefined };
  isAdmin: boolean;
}) => {
  const orderData = await getOrderData(data.id, isAdmin, param);

  return (
    <>
      <tr key={idx} className="bg-[#f2f2f3] h-[50px]">
        <td className="max-w-[150px] p-2 break-all rounded-l-lg">{data.id}</td>
        <td align="left">
          <ButtonSsr
            idx={idx}
            type={AllorderType.orderdetail}
            name="View"
            color="#495464"
            height="40px"
            width="50%"
            data={{ detail: orderData as OrderDetailType }}
            id={data.id}
            orderdata={data}
            isAdmin={isAdmin}
          />
        </td>
        <td align="left" className="">
          <ButtonSsr
            idx={idx}
            type={AllorderType.orderproduct}
            name={"View"}
            color="#0097FA"
            height="40px"
            width="100px"
            data={{ product: orderData as Array<Productordertype> }}
            id={data.id}
            isAdmin={isAdmin}
          />
        </td>
        <td className="max-w-[100px] p-1 break-all">
          ${data.price.total.toFixed(2)}
        </td>
        <td
          style={{
            color: AllOrderStatusColor[data.status.toLocaleLowerCase()],
          }}
          className={`max-w-[100px] p-1 break-all font-bold`}
        >
          {data.status}
        </td>
        {isAdmin ? (
          <>
            <td>
              <ButtonSsr
                idx={idx}
                type={AllorderType.orderaction}
                name="Action"
                color="#44C3A0"
                height="40px"
                width="50%"
                data={{ action: orderData as OrderUserType }}
                id={data.id}
                isAdmin={isAdmin}
              />
            </td>
          </>
        ) : (
          <></>
        )}
      </tr>
      <tr key={`row1${idx}`} className="h-[30px]">
        <td></td>
      </tr>
    </>
  );
};
