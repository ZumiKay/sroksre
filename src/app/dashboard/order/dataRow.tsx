import React from "react";
import { AllOrderStatusColor, AllorderType } from "@/src/lib/utilities";
import {
  AllorderStatus,
  OrderDetailType,
  Productordertype,
} from "@/src/context/OrderContext";
import { OrderUserType } from "@/src/app/checkout/action";
import { redirect } from "next/navigation";
import { GetOrder } from "@/src/app/dashboard/order/action";
import getCheckoutdata from "@/src/app/checkout/getCheckOutData";
import { ButtonSsr } from "./Button";

const checkparam = (ty: string) => {
  const isValid = Object.values(AllorderType).find((val) => val === ty)?.[1];

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

const DataRow = async ({
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
export default DataRow;
