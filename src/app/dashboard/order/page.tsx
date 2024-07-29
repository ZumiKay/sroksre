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
import { AllOrderStatusColor } from "@/src/lib/utilities";
import { Suspense } from "react";
import { LoadingText } from "../../component/Loading";
import { OrderUserType } from "../../checkout/action";
import { getCheckoutdata } from "../../checkout/page";
import { Role } from "@prisma/client";

export const AllorderType = {
  orderdetail: "orderdetail",
  orderproduct: "orderproduct",
  orderaction: "orderaction",
  orderupdatestatus: "orderupdatestatus",
};

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
    page = "1",
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
    parseInt(page as string),
    parseInt(show as string),
    getuser.role === "USER" ? getuser.id : undefined
  );

  const filterorder = await getFilterOrder({
    status: selectedStatus ?? [""],
    page: parseInt(page as string),
    limit: parseInt(show as string),
    search: q as string,
    startprice: parseFloat((startprice as string) ?? "0"),
    endprice: parseFloat((endprice as string) ?? "0"),
    fromdate: fromdate ? fromdate : undefined,
    todate: todate ? todate : undefined,
    userid: getuser.role === "USER" ? getuser.id : undefined,
  });

  const isFilter =
    selectedStatus || q || fromdate || todate || startprice || endprice;

  const total = Math.ceil(
    (isFilter ? filterorder.total ?? 0 : req?.total) / parseInt(show as string)
  );

  const orders = isFilter
    ? filterorder.data
    : (req?.order as unknown as AllorderStatus[]);

  return (
    <Suspense fallback={<LoadingText />}>
      <main className="order__container w-full flex flex-col items-start gap-y-5 pl-2 pr-2 relative">
        <div className="filter_container w-[40%] inline-flex gap-x-5 items-center h-fit mt-5">
          <div className="w-full h-fit inline-flex items-center">
            <label className="font-bold">Filter by:</label>
            <MultipleSelect />
          </div>
          <FilterButton
            isFilter={!isFilter}
            data={{ todate, fromdate, q, startprice, endprice }}
          />
          <DownloadButton />
        </div>
        <div className="orderlist w-full h-fit">
          <table width={"100%"} className="ordertable text-lg font-medium">
            <tbody>
              <tr className="text-left bg-[#495464] text-white h-[50px] rounded-2xl">
                <th className="rounded-l-lg pl-2">Order ID#</th>
                <th align="left">Details</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
                <th className="rounded-r-lg"> </th>
              </tr>
              <tr className="h-[30px]">
                <td></td>
              </tr>

              {!orders || orders.length === 0 ? (
                <tr>
                  <td>
                    <h3 className="w-full font-bold text-xl">No order</h3>
                  </td>
                </tr>
              ) : (
                orders?.map((i, idx) => (
                  <DataRow
                    key={`row${idx}`}
                    idx={idx + 1}
                    data={i as AllorderStatus}
                    param={searchParams}
                    isAdmin={getuser.role === Role.ADMIN}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="w-full h-fit relative mt-10">
          <PaginationSSR
            total={total}
            pages={parseInt(page as string)}
            limit={parseInt(show as string)}
          />
        </div>
      </main>
    </Suspense>
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
    const {
      ty,
      id,
      page,
      show,
      status,
      q,
      startprice,
      fromdate,
      todate,
      endprice,

      ...otherParams
    } = param;

    if (Object.keys(otherParams).length > 0) {
      return redirect("/dashboard/order");
    }

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
            {" "}
            <td>
              {" "}
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
            <td className="rounded-r-lg">
              {" "}
              <ButtonSsr
                idx={idx}
                type={AllorderType.orderupdatestatus}
                name="Update"
                color="#BC871E"
                height="40px"
                width="50%"
                data={{ action: orderData as OrderUserType }}
                id={data.id}
                isAdmin={isAdmin}
              />
            </td>{" "}
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
