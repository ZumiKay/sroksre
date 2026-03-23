"use client";
import React, { SetStateAction, useEffect, useMemo, useState } from "react";
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
import {
  Productordertype,
  totalpricetype,
  VariantOptionsType,
  VariantPriceBreakdown,
} from "@/src/types/order.type";
import { Createorder } from "../../checkout/action";
import { CloseVector } from "../Asset";
import { getVariantPriceBreakDownByActiveCart } from "../../checkout/helper";

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
        settotal({
          subtotal: response.subtotal ?? 0,
          total: response.total ?? 0,
          extra: response.extra ?? 0,
        });
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
  const totalDisplay = totalprice
    ? parseFloat(totalprice.total.toString()).toFixed(2)
    : `0.00`;

  const cartVariantBreakDown = useMemo<VariantPriceBreakdown[]>(() => {
    return cartItem
      .map((item) => {
        const selectedVariantArray = Array.isArray(item.selectedvariant)
          ? (item.selectedvariant as unknown[])
          : [];
        const optionsPrice = selectedVariantArray.filter(
          (option): option is VariantOptionsType =>
            !!option &&
            typeof option === "object" &&
            "name" in option &&
            "price" in option,
        );

        return getVariantPriceBreakDownByActiveCart([item], optionsPrice);
      })
      .filter((breakdown) => breakdown.variantOptions.length > 0);
  }, [cartItem]);

  const totalVariantPrice = useMemo(() => {
    return cartVariantBreakDown.reduce(
      (sum, product) =>
        sum +
        product.variantOptions.reduce(
          (optSum, option) => optSum + option.price,
          0,
        ),
      0,
    );
  }, [cartVariantBreakDown]);

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
      className="Cart__Sidemenu fixed h-full w-175 max-large_tablet:w-137.5 max-large_phone:w-screen right-0 bg-linear-to-b from-white to-gray-50 z-40 flex flex-col items-center gap-y-4 transition-all border-l border-gray-200 shadow-2xl"
    >
      <div
        onClick={() => setcart(false)}
        className="w-fit h-fit absolute top-3 right-3 cursor-pointer rounded-full p-1 hover:bg-gray-100 transition-colors"
      >
        <CloseVector width="30px" height="30px" />
      </div>
      <h1 className="heading text-2xl font-extrabold tracking-tight text-center w-full pt-5">
        Shopping Cart{" "}
        <span className="text-base font-semibold text-gray-500">
          ( {cartItem?.length} item )
        </span>
      </h1>
      <div className="w-[90%] h-px bg-gray-200" />
      <div className="card_container flex flex-col w-[95%] gap-y-4 h-full max-h-[62vh] overflow-y-auto pr-1">
        {(!cartItem || cartItem.length === 0) && (
          <h3 className="text-lg font-semibold text-gray-500 w-full h-fit text-center bg-white border border-dashed border-gray-300 rounded-xl py-8">
            No items
          </h3>
        )}
        {loading.fetch &&
          Array.from({ length: 3 }).map((_, idx) => <CardSkeleton key={idx} />)}

        {cartItem?.map((i, idx) => {
          const selectedVariantArray = Array.isArray(i.selectedvariant)
            ? (i.selectedvariant as unknown[])
            : [];
          const optionsPrice = selectedVariantArray.filter(
            (option): option is VariantOptionsType =>
              !!option &&
              typeof option === "object" &&
              "name" in option &&
              "price" in option,
          );
          const variantBreakdown = getVariantPriceBreakDownByActiveCart(
            [i],
            optionsPrice,
          );

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
              selectedVariantOptions={variantBreakdown.variantOptions}
              price={i.price}
              removecart={() => removecart(i.id)}
              settotal={settotal}
              setreloadcart={setreloaddata}
            />
          );
        })}
      </div>
      <div className="totalprice w-[90%] text-left font-medium flex flex-col gap-y-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <h5 className="text-[15px] flex items-center justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-900">{`$${subprice}`}</span>
        </h5>
        {cartVariantBreakDown.length > 0 && (
          <div className="w-full h-fit flex flex-col gap-y-2 border-t border-gray-100 pt-2">
            <h5 className="text-[15px] flex items-center justify-between">
              <span className="text-gray-500">Variant Options</span>
              <span className="font-semibold text-emerald-600">{`$${totalVariantPrice.toFixed(2)}`}</span>
            </h5>
            <div className="w-full max-h-30 overflow-y-auto flex flex-col gap-y-2 rounded-xl bg-gray-50 border border-gray-100 p-2">
              {cartVariantBreakDown.map((product, pIdx) => (
                <div key={pIdx} className="text-sm text-gray-600">
                  <p className="font-semibold text-gray-700">
                    {product.productName}
                  </p>
                  {product.variantOptions.map((option, oIdx) => (
                    <p
                      key={oIdx}
                      className="pl-3 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        -{" "}
                        {typeof option.name === "string"
                          ? option.name
                          : (option.name.name ?? option.name.val)}
                      </span>
                      {option.price > 0 && (
                        <span className="text-emerald-600 font-medium shrink-0">
                          +${option.price.toFixed(2)}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        <h5 className="textprice text-[15px] flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="text-gray-500">Shipping</span>
          <span className="font-semibold text-gray-700">-</span>
        </h5>
        <h3 className="text-xl font-bold flex items-center justify-between">
          <span>Total</span>
          <span>{`$${totalDisplay}`}</span>
        </h3>
      </div>
      <div className="w-full px-[5%] pb-5">
        <PrimaryButton
          type="button"
          text="Check Out"
          onClick={() => handleCheckout()}
          disable={cartItem?.length === 0}
          width="100%"
          height="50px"
          radius="12px"
          status={loading.checkout ? "loading" : "authenticated"}
        />
      </div>
    </aside>
  );
}
