"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  AllorderStatus,
  OrderDetailType,
  OrderDetialModalType,
  Productordertype,
} from "@/src/context/OrderContext";
import { memo, useCallback, useMemo, useState } from "react";
import { SecondaryModal } from "../../component/Modals";
import { formatDate } from "../../component/EmailTemplate";
import PrimaryButton from "../../component/Button";
import { Checkoutproductcard } from "../../component/OrderCard";

const DetailTable = memo(
  ({ data, type }: { data: OrderDetailType; type: OrderDetialModalType }) => {
    const userTableContent = useMemo(() => {
      if (type !== "user" || !data?.user) return null;

      return (
        <tbody className="bg-white">
          <tr className="h-[50px]">
            <th className="pl-2 rounded-tl-lg">Firstname: </th>
            <td align="right" className="pr-5 rounded-tr-lg break-all">
              {data.user.firstname || ""}
            </td>
          </tr>
          <tr className="h-[50px]">
            <th className="pl-2">Lastname: </th>
            <td align="right" className="pr-5 break-all">
              {data.user?.lastname ?? ""}
            </td>
          </tr>
          <tr className="h-[50px]">
            <th className="pl-2">Email: </th>
            <td align="right" className="pr-5 break-all">
              {data.user.email || ""}
            </td>
          </tr>
          <tr className="h-[50px]">
            <th className="pl-2 rounded-bl-lg">Phone Number: </th>
            <td align="right" className="pr-5 rounded-br-lg break-all">
              {data.user.phonenumber || ""}
            </td>
          </tr>
        </tbody>
      );
    }, [data.user, type]);

    // Create memoized shipping table rows
    const shippingTableContent = useMemo(() => {
      if (type !== "shipping" || !data?.shipping) return null;

      const shipping = data.shipping;
      const rows = [
        { label: "Firstname:", value: shipping.firstname },
        { label: "Lastname:", value: shipping.lastname },
        { label: "HouseId:", value: shipping.houseId },
        { label: "District / Khan:", value: shipping.district },
        { label: "Songkat:", value: shipping.songkhat },
        { label: "City / Province:", value: shipping.province },
        { label: "PostalCode:", value: shipping.postalcode },
      ];

      return (
        <tbody className="bg-white">
          {rows.map((row, index) => (
            <tr key={index} className="h-[50px]">
              <th className="pl-2">{row.label}</th>
              <td align="right" className="pr-5 break-all">
                {row.value || ""}
              </td>
            </tr>
          ))}
        </tbody>
      );
    }, [data.shipping, type]);

    // Only render the relevant table content
    return (
      <table align="left" className="text-left" width={"100%"}>
        {userTableContent}
        {shippingTableContent}
      </table>
    );
  }
);
DetailTable.displayName = "DetailTable";

export const DetailModal = memo(
  ({
    close,
    data,
    setclose,
    orderdata,
    isAdmin,
  }: {
    close: string;
    data: OrderDetailType;
    orderdata: AllorderStatus;
    setclose?: () => void;
    isAdmin: boolean;
  }) => {
    const { openmodal } = useGlobalContext();
    const [type, settype] = useState<OrderDetialModalType>("none");

    const handleClick = useCallback(
      (ty: typeof type) => {
        if (ty === "close" && setclose) {
          setclose();
          return;
        }

        settype(ty);
      },
      [setclose]
    );

    const handleClose = useCallback(() => {
      if (setclose) setclose();
    }, [setclose]);

    return (
      <SecondaryModal
        size="3xl"
        open={openmodal[close] as boolean}
        onPageChange={() => handleClose()}
        closebtn
        style={{ backgroundColor: "#f2f2f2" }}
      >
        <div className="w-full h-full relative bg-[#f2f2f2] flex flex-col items-center rounded-lg max-small_phone:p-2 pl-5 pr-5">
          <h3 className="w-full h-fit text-center text-xl font-bold mt-5 mb-5">
            Order Detail
          </h3>

          {type === "none" && (
            <div className="w-full h-full flex flex-col gap-y-20">
              <div className="action flex flex-col gap-y-5 w-full h-fit">
                {isAdmin && (
                  <PrimaryButton
                    text="Buyers"
                    width="100%"
                    onClick={() => handleClick("user")}
                    radius="10px"
                    type="button"
                    textsize="15px"
                  />
                )}

                {data?.shipping && orderdata.shippingtype !== "Pickup" && (
                  <PrimaryButton
                    text="Shipping"
                    width="100%"
                    onClick={() => handleClick("shipping")}
                    radius="10px"
                    type="button"
                    textsize="15px"
                  />
                )}
              </div>

              <div className="dates w-full p-2 max-small_phone:p-0">
                <table
                  width={"100%"}
                  className="p-2 rounded-lg bg-white"
                  style={{
                    boxShadow: "0px 3px 3px 0px inset rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <tbody className="text-left">
                    <tr className="h-[50px]">
                      <th className="pl-5">Order On: </th>
                      <td align="right" className="pr-5">
                        {formatDate(orderdata.createdAt)}
                      </td>
                    </tr>
                    <tr className="h-[50px]">
                      <th className="pl-5">Updated At: </th>
                      <td align="right" className="pr-5">
                        {formatDate(orderdata.updatedAt)}
                      </td>
                    </tr>
                    <tr className="h-[50px]">
                      <th className="pl-5">Shipping Type: </th>
                      <td align="right" className="pr-5">
                        {orderdata.shippingtype}
                      </td>
                    </tr>
                    <tr className="h-[100px]">
                      <th className="rounded-bl-lg pl-5">Price: </th>
                      <td align="right" className="pr-5 rounded-br-lg">
                        <div className="flex flex-col w-full h-full">
                          <p className="text-lime-700">{`Subtotal: $${orderdata.price?.subtotal.toFixed(
                            2
                          )}`}</p>
                          <p className="text-amber-600">{`Shipping: $${
                            orderdata.price?.shipping?.toFixed(2) ?? "0.0"
                          }`}</p>
                          <p>{`Total: $${orderdata.price?.total.toFixed(
                            2
                          )}`}</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {type !== "none" && (
            <>
              <div className="w-full p-2">
                <DetailTable type={type} data={data} />
              </div>
              <PrimaryButton
                onClick={() => settype("none")}
                type="button"
                text="Back"
                radius="10px"
              />
            </>
          )}
        </div>
      </SecondaryModal>
    );
  }
);
DetailModal.displayName = "DetailModal";

export const OrderProductDetailsModal = memo(
  ({
    setclose,
    close,
    data,
  }: {
    setclose: () => void;
    close: string;
    data: Productordertype[];
  }) => {
    const { openmodal } = useGlobalContext();

    return (
      <SecondaryModal
        size="5xl"
        open={openmodal[close] as boolean}
        onPageChange={() => {
          setclose();
        }}
        closebtn
      >
        <div className="w-full h-full relative  p-2 rounded-lg flex flex-col items-center gap-y-10">
          <h3 className="w-full text-center font-bold text-xl">{`Products (${
            data ? data.length : 0
          })`}</h3>

          <div className="productlist w-full max-h-[60vh] overflow-y-auto flex flex-col items-center gap-y-5">
            {data &&
              data.map((prob) => (
                <Checkoutproductcard
                  key={prob.id}
                  qty={prob.quantity}
                  cover={prob.product?.covers[0].url as string}
                  name={prob.product?.name as string}
                  details={prob.selectedvariant as never}
                  price={prob.price}
                  total={
                    prob.quantity *
                    (((prob.price.discount?.newprice ??
                      prob.product?.price) as number) ?? 0)
                  }
                />
              ))}
          </div>
        </div>
      </SecondaryModal>
    );
  }
);
OrderProductDetailsModal.displayName = "OrderProductDetailModal";
