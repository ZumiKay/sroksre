"use client";
import React, { SetStateAction, useEffect, useState } from "react";
import { StaticImageData } from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import PrimaryButton from "../Button";
import { CardSkeleton, SecondayCard } from "../Card";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useClickOutside,
} from "@/src/context/CustomHook";
import { errorToast } from "../Loading";
import { Productordertype, totalpricetype } from "@/src/types/order.type";
import { Createorder } from "../../checkout/action";
import { CloseVector } from "../Asset";

interface CartMenuProps {
  img: string | StaticImageData;
  setcart: (value: SetStateAction<boolean>) => void;
  setcarttotal: React.Dispatch<React.SetStateAction<number>>;
}

export function CartMenu({ img, setcart, setcarttotal }: CartMenuProps) {
  const { setreloadcart } = useGlobalContext();
  const router = useRouter();
  const searchparams = useSearchParams();
  const [cartItem, setitem] = useState<Array<Productordertype> | []>([]);
  const [reloaddata, setreloaddata] = useState(true);
  const ref = useClickOutside(() => setcart(false));

  const [loading, setloading] = useState({
    fetch: true,
    checkout: false,
  });

  const [totalprice, settotal] = useState<totalpricetype | undefined>(
    undefined,
  );

  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  const fetchcart = async () => {
    const asyncfetchcart = async () => {
      const response = await ApiRequest("/api/order/cart", undefined, "GET");

      if (response.success) {
        setitem(response.data);
        settotal({ subtotal: response.total ?? 0, total: response.total ?? 0 });
      }
    };

    await Delayloading(
      asyncfetchcart,
      (value) => setloading((prev) => ({ ...prev, fetch: value })),
      500,
    );

    setreloaddata(false);
  };

  useEffect(() => {
    if (reloaddata) fetchcart();
  }, [reloaddata]);

  const removecart = async (id: number) => {
    const deletereq = await ApiRequest(
      "/api/order/cart",
      undefined,
      "DELETE",
      "JSON",
      {
        id,
      },
    );
    if (!deletereq.success) {
      errorToast("Can't Delete Cart");
      return;
    }
    setcarttotal((prev) => (prev !== 0 ? prev - 1 : prev));
    setreloadcart(true);
    setreloaddata(true);
  };

  const subprice = totalprice
    ? parseFloat(totalprice.subtotal.toString()).toFixed(2)
    : `0.00`;

  const handleCheckout = async () => {
    const params = new URLSearchParams(searchparams);

    if (!cartItem || cartItem.length === 0) {
      errorToast("No items in cart");
      return;
    }

    if (totalprice && cartItem.length !== 0) {
      const cartitem_id = cartItem.map((i) => i.id);
      const makereq = Createorder.bind(null, {
        price: totalprice,
        incartProduct: cartitem_id,
      });
      setloading((prev) => ({ ...prev, checkout: true }));
      const createOrder = await makereq();
      setloading((prev) => ({ ...prev, checkout: false }));
      if (!createOrder.success) {
        errorToast("Error Occured");
        return;
      }

      params.set("orderid", createOrder.data.encrypt ?? "");
      params.set("step", "1");
      router.push(`/checkout?${params.toString()}`);
    }
  };

  return (
    <aside
      ref={ref}
      onMouseEnter={() => (document.body.style.overflow = "hidden")}
      onMouseLeave={() => {
        document.body.style.overflow = "auto";
        setcart(false);
      }}
      className="Cart__Sidemenu fixed h-full w-175 max-large_tablet:w-137.5 max-large_phone:w-screen right-0 bg-white z-40 flex flex-col items-center gap-y-5 transition-all"
    >
      <div
        onClick={() => setcart(false)}
        className="w-fit h-fit absolute top-1 right-1 cursor-pointer"
      >
        <CloseVector width="30px" height="30px" />
      </div>
      <h1 className="heading text-xl font-bold text-center w-full">
        Shopping Cart <span>( {cartItem?.length} item )</span>
      </h1>
      <div className="card_container flex flex-col w-[95%] gap-y-5 h-full max-h-[70vh] overflow-y-auto">
        {(!cartItem || cartItem.length === 0) && (
          <h3 className="text-xl font-bold text-red-500 w-full h-fit text-center">
            No items
          </h3>
        )}
        {loading.fetch &&
          Array.from({ length: 3 }).map((_, idx) => <CardSkeleton key={idx} />)}

        {cartItem?.map((i, idx) => {
          return (
            <SecondayCard
              key={idx}
              id={i.id}
              img={
                i.product?.covers.length !== 0
                  ? (i.product?.covers[0].url as string)
                  : img
              }
              name={i.product?.name ?? ""}
              maxqty={i.maxqty}
              selectedqty={i.quantity}
              selecteddetail={i.selectedvariant as never}
              price={i.price}
              removecart={() => removecart(i.id)}
              settotal={settotal}
              setreloadcart={setreloaddata}
            />
          );
        })}
      </div>
      <div className="totalprice w-[90%] text-left font-medium flex flex-col gap-y-3">
        <h5 className="text-lg text-[15px]">Subtotal: {`$${subprice}`} </h5>
        <h5 className="textprice text-[15px]">Shipping: </h5>
        <h3 className="text-xl font-bold">Total: </h3>
      </div>
      <PrimaryButton
        type="button"
        text="Check Out"
        onClick={() => handleCheckout()}
        disable={cartItem?.length === 0}
        width="90%"
        height="50px"
        radius="10px"
        status={loading.checkout ? "loading" : "authenticated"}
      />
    </aside>
  );
}
