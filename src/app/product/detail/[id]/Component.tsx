"use client";
import { ProductState } from "@/src/context/GlobalContext";

export const ShowPrice = ({
  price,
  discount,
}: Pick<ProductState, "price" | "discount">) => {
  const priceString = price.toFixed(2);
  const isDiscount = discount && (
    <div className="discount_section text-lg flex flex-row items-center justify-start gap-x-5 font-semibold">
      <h3 className="oldprice line-through w-fit font-normal">
        {`$ ${priceString}`}
      </h3>
      <h3 className="w-fit text-red-400">{`-${discount.percent}%`}</h3>
      <h3 className="w-fit">{`$ ${parseFloat(discount.newprice).toFixed(
        2
      )}`}</h3>
    </div>
  );
  const normalprice = (
    <h3 className="text-lg font-bold w-full">{`$${priceString}`}</h3>
  );

  return isDiscount ? isDiscount : normalprice;
};
