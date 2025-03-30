"use client";

import { ChangeEvent, useState } from "react";
import PrimaryButton, { Selection } from "../component/Button";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Card from "../component/Card";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ProductState } from "@/src/context/GlobalType.type";
import { FilterContainer } from "./filtercomnponent";

export const ProductFilterButton = ({
  pid,
  cid,
  color,
  promo,
  other,
  search,
  productcount,
  isPromotion,
  latest,
  pcate,
  ccate,
}: {
  pid: string;
  cid?: string;
  color?: string[];
  other?: string[];
  promo?: string[];
  search?: string;
  productcount?: number;
  isPromotion?: string;
  latest?: boolean;
  pcate?: string[];
  ccate?: string[];
}) => {
  const { openmodal, setopenmodal } = useGlobalContext();
  return (
    <>
      <div className="w-full h-[40px] flex flex-row items-center gap-x-5">
        <SortSelect />
        <PrimaryButton
          type="button"
          text={color || other || promo || search ? "Clear Filter" : "Filter"}
          radius="10px"
          style={{ maxWidth: "100px" }}
          height="100%"
          onClick={() => {
            setopenmodal((prev) => ({ ...prev, filteroption: true }));
          }}
        />
      </div>

      {openmodal.filteroption && (
        <FilterContainer
          pid={pid}
          cid={cid}
          productcount={productcount}
          isPromotion={isPromotion}
          selected={{
            color,
            other,
            search,
            promo,
            pcate,
            ccate,
          }}
          latest={latest}
        />
      )}
    </>
  );
};

export const SortSelect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setsort] = useState(searchParams.get("sort") ?? "");
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const param = new URLSearchParams(searchParams);
    setsort(value);

    param.set("sort", value);

    router.push(`?${param}`, { scroll: false });
  };
  return (
    <Selection
      onChange={handleSelect}
      value={sort}
      data={[
        {
          label: "Low To High",
          value: 1,
        },
        {
          label: "High To Low",
          value: 2,
        },
      ]}
      style={{ height: "100%", width: "150px", minWidth: "150px" }}
    />
  );
};

interface PromotionProductlistContainerProps {
  name: string;
  description: string;
  expiredDate: string;
  banner: { url: string; name: string };
  product: Array<
    Pick<ProductState, "id" | "name" | "price" | "discount" | "covers">
  >;
}

export const PromotionProductListContainer = ({
  name,
  description,
  expiredDate,
  banner,
  product,
}: PromotionProductlistContainerProps) => {
  return (
    <div className="promotioncontainer w-full h-fit flex flex-col gap-y-10 pl-5 pr-5 pb-10">
      <div className="header w-full h-fit flex flex-row justify-center items-center max-small_screen:flex-col gap-5">
        {banner && (
          <Image
            src={banner.url ?? ""}
            alt={banner.name}
            width={700}
            height={700}
            loading="lazy"
            className="w-full h-[500px] max-small_screen:h-auto object-contain rounded-lg"
          />
        )}
        <div className="description w-full min-h-[280px] h-fit p-3 rounded-lg bg-gray-500 text-white flex flex-col justify-center gap-y-5">
          <p className="title text-3xl font-bold">{name}</p>
          <p className="title text-xl font-bold">{expiredDate}</p>
          <p className="des w-full h-fit text-lg font-light">{description}</p>
        </div>
      </div>
      <div className="listproduct w-full h-full flex flex-row gap-5 flex-wrap justify-start max-smallest_tablet:justify-center">
        {product.map((prod) => (
          <Card
            key={prod.id}
            id={prod.id}
            name={prod.name}
            price={prod.price.toFixed(2)}
            img={prod.covers}
            discount={prod.discount}
          />
        ))}
      </div>
    </div>
  );
};
