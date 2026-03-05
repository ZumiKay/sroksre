"use client";

import { useState } from "react";
import PrimaryButton from "@/src/app/component/Button";
import { SecondaryModal } from "@/src/app/component/Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { formatDate } from "@/src/app/component/EmailTemplate";
import { AllorderStatus } from "../../page";
import { OrderDetailType } from "../types";

interface DetailModalProps {
  close: string;
  data: OrderDetailType;
  orderdata: AllorderStatus;
  setclose: () => void;
  isAdmin: boolean;
}

type DetailView = "user" | "shipping" | "none";

export const DetailModal = ({
  close,
  data,
  setclose,
  orderdata,
  isAdmin,
}: DetailModalProps) => {
  const [view, setview] = useState<DetailView>("none");
  const { openmodal } = useGlobalContext();

  const DetailTable = () => {
    if (view === "user" && data?.user) {
      return (
        <table align="left" className="text-left" width="100%">
          <tbody className="bg-white">
            <tr className="h-12.5">
              <th className="pl-2 rounded-tl-lg">Firstname:</th>
              <td align="right" className="pr-5 rounded-tr-lg break-all">
                {data.user.firstname}
              </td>
            </tr>
            <tr className="h-12.5">
              <th className="pl-2">Lastname:</th>
              <td align="right" className="pr-5 break-all">
                {data.user.lastname ?? ""}
              </td>
            </tr>
            <tr className="h-12.5">
              <th className="pl-2">Email:</th>
              <td align="right" className="pr-5 break-all">
                {data.user.email}
              </td>
            </tr>
            <tr className="h-12.5">
              <th className="pl-2 rounded-bl-lg">Phone Number:</th>
              <td align="right" className="pr-5 rounded-br-lg break-all" />
            </tr>
          </tbody>
        </table>
      );
    }

    if (view === "shipping") {
      return (
        <table align="left" className="text-left" width="100%">
          <tbody className="bg-white">
            {[
              ["Firstname", data.shipping?.firstname],
              ["Lastname", data.shipping?.lastname],
              ["HouseId", data.shipping?.houseId],
              ["District / Khan", data.shipping?.district],
              ["Songkat", data.shipping?.songkhat],
              ["City / Province", data.shipping?.province],
              ["PostalCode", data.shipping?.postalcode],
            ].map(([label, value]) => (
              <tr key={label} className="h-12.5">
                <th className="pl-2">{label}:</th>
                <td align="right" className="pr-5 break-all">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <SecondaryModal
      size="3xl"
      open={openmodal[close] as boolean}
      onPageChange={setclose}
      closebtn
      style={{ backgroundColor: "#f2f2f2" }}
    >
      <div className="w-full h-full relative bg-[#f2f2f2] flex flex-col items-center rounded-lg max-small_phone:p-2 pl-5 pr-5">
        <h3 className="w-full h-fit text-center text-xl font-bold mt-5 mb-5">
          Order Detail
        </h3>

        {view === "none" ? (
          <div className="w-full h-full flex flex-col gap-y-20">
            <div className="flex flex-col gap-y-5 w-full">
              {isAdmin && (
                <PrimaryButton
                  text="Buyers"
                  width="100%"
                  onClick={() => setview("user")}
                  radius="10px"
                  type="button"
                  textsize="15px"
                />
              )}
              {data?.shipping && orderdata.shippingtype !== "Pickup" && (
                <PrimaryButton
                  text="Shipping"
                  width="100%"
                  onClick={() => setview("shipping")}
                  radius="10px"
                  type="button"
                  textsize="15px"
                />
              )}
            </div>

            <div className="dates w-full p-2 max-small_phone:p-0">
              <table
                width="100%"
                className="p-2 rounded-lg bg-white"
                style={{ boxShadow: "0px 3px 3px 0px inset rgba(0,0,0,0.15)" }}
              >
                <tbody className="text-left">
                  <tr className="h-12.5">
                    <th className="pl-5">Order On:</th>
                    <td align="right" className="pr-5">
                      {formatDate(orderdata.createdAt)}
                    </td>
                  </tr>
                  <tr className="h-12.5">
                    <th className="pl-5">Updated At:</th>
                    <td align="right" className="pr-5">
                      {formatDate(orderdata.updatedAt)}
                    </td>
                  </tr>
                  <tr className="h-12.5">
                    <th className="pl-5">Shipping Type:</th>
                    <td align="right" className="pr-5">
                      {orderdata.shippingtype}
                    </td>
                  </tr>
                  <tr className="h-25">
                    <th className="rounded-bl-lg pl-5">Price:</th>
                    <td align="right" className="pr-5 rounded-br-lg">
                      <div className="flex flex-col w-full h-full">
                        <p className="text-lime-700">{`Subtotal: $${orderdata.price?.subtotal.toFixed(2)}`}</p>
                        <p className="text-amber-600">{`Shipping: $${orderdata.price?.shipping?.toFixed(2) ?? "0.0"}`}</p>
                        <p>{`Total: $${orderdata.price?.total.toFixed(2)}`}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full p-2">
              <DetailTable />
            </div>
            <PrimaryButton
              onClick={() => setview("none")}
              type="button"
              text="Back"
              radius="10px"
            />
          </>
        )}
      </div>
    </SecondaryModal>
  );
};
