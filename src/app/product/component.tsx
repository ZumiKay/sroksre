"use client";

import { ChangeEvent, useEffect, useState } from "react";
import PrimaryButton, { Selection } from "../component/Button";
import {
  ProductState,
  useGlobalContext,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import Modal from "../component/Modals";
import { TextField } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { filtervaluetype, getFilterValue } from "./action";
import { ToggleSelect } from "../component/ToggleMenu";
import Image from "next/image";
import Card from "../component/Card";
import { Input, Spacer } from "@nextui-org/react";

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
}: {
  pid: string;
  cid?: string;
  color?: string[];
  other?: string[];
  promo?: string[];
  search?: string;
  productcount?: number;
  isPromotion?: boolean;
  latest?: boolean;
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
          width="100%"
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
      style={{ height: "100%" }}
    />
  );
};

export const FilterContainer = ({
  pid,
  cid,
  selected,
  productcount,
  isPromotion,
  latest,
}: {
  pid: string;
  cid?: string;
  selected?: {
    color?: string[];
    size?: string[];
    other?: string[];
    promo?: string[];
    search?: string;
  };
  productcount?: number;
  isPromotion?: boolean;
  latest?: boolean;
}) => {
  const { setopenmodal } = useGlobalContext();
  const [filtervalue, setfiltervalue] = useState<filtervaluetype | undefined>(
    undefined
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    selected?.search &&
      setfiltervalue((prev) => ({ ...prev, search: selected.search } as any));

    const getFiltervalue = async () => {
      const res = getFilterValue.bind(
        null,
        parseInt(pid),
        cid ? parseInt(cid) : undefined,
        latest
      );
      const getreq = await res();

      if (getreq) {
        setfiltervalue(getreq);
      }
    };
    getFiltervalue();
  }, []);

  const handleClick = (idx: number, type: string, otheridx?: number) => {
    const param = new URLSearchParams(searchParams);

    const toggleParam = (key: string, value: string | undefined) => {
      if (!value) return;
      const existingValues = param.get(key)?.split(",") || [];
      if (existingValues.includes(value)) {
        const newValues = existingValues.filter((v) => v !== value);
        if (newValues.length > 0) {
          param.set(key, newValues.join(","));
        } else {
          param.delete(key);
        }
      } else {
        existingValues.push(value);
        param.set(key, existingValues.join(","));
      }
    };

    if (type === "color") {
      toggleParam("color", filtervalue?.variant.color[idx].val);
    } else if (type === "text" && otheridx !== undefined) {
      const val = filtervalue?.variant.text[idx].option_value[otheridx];
      toggleParam("other", val);
    } else if (type === "promo") {
      toggleParam("promo", filtervalue?.promo?.[idx].name);
    }

    router.push(`?${param}`, { scroll: false });
  };

  const handleClear = () => {
    const param = new URLSearchParams(searchParams);

    if (selected) {
      const selectedval = Object.entries(selected);
      selectedval.forEach(([key, _]) => {
        if (param.has(key)) {
          param.delete(key);
        }
      });
    }
    router.push(`?${param}`);
  };

  const handleClearSpecific = (
    data: string[] | VariantColorValueType[],
    selectedValue: string[],
    promo?: boolean
  ) => {
    const param = new URLSearchParams(searchParams);

    if (typeof data[0] === "string") {
      data.forEach((item) => {
        if (typeof item === "string" && selectedValue.includes(item)) {
          if (param.has("other") && !promo) {
            const otherValues = param.get("other")?.split(",") || [];
            const updatedOtherValues = otherValues.filter(
              (val) => val !== item
            );

            if (updatedOtherValues.length === 0) {
              param.delete("other");
            } else {
              param.set("other", updatedOtherValues.join(","));
            }
          }

          if (param.has("promo") && selectedValue.includes(item) && promo) {
            param.delete("promo");
          }
        }
      });
    } else {
      if (param.has("color")) {
        param.delete("color");
      }
    }

    router.push(`?${param.toString()}`, { scroll: false });
  };

  return (
    <Modal closestate="filteroption" customZIndex={200}>
      <div className="w-full h-full bg-white rounded-lg p-3 flex flex-col gap-y-5 items-center relative">
        <div className="w-full max-h-[400px] h-auto overflow-y-auto overflow-x-hidden flex flex-col gap-y-5 p-3">
          <Input
            isClearable
            fullWidth
            type="text"
            label="Search"
            variant="bordered"
            placeholder="Search name"
            defaultValue={selected?.search}
            onChange={(e) =>
              setfiltervalue(
                (prev) => ({ ...prev, search: e.target.value } as any)
              )
            }
            onClear={() =>
              setfiltervalue((prev) => ({ ...prev, search: "" } as any))
            }
            size="lg"
          />

          {filtervalue && (
            <>
              {filtervalue?.variant?.color.length > 0 && (
                <ToggleSelect
                  title="Color"
                  type="color"
                  data={filtervalue.variant.color}
                  selected={selected?.color}
                  clickfunction={handleClick}
                  onClear={handleClearSpecific}
                />
              )}

              <h3
                className="text-lg font-bold"
                hidden={filtervalue.variant?.text.length === 0}
              >
                {selected?.other ? "Clear Filter" : "Other"}
              </h3>
              {filtervalue.variant?.text.length > 0 &&
                filtervalue.variant?.text.map((item, index) => (
                  <ToggleSelect
                    key={index}
                    title={item.option_title}
                    type="text"
                    data={item.option_value}
                    selected={selected?.other}
                    clickfunction={(idx, type) => handleClick(index, type, idx)}
                    onClear={handleClearSpecific}
                  />
                ))}

              <Spacer />
              {!isPromotion &&
                filtervalue?.promotion &&
                filtervalue?.promotion.length > 0 && (
                  <ToggleSelect
                    title="Promotion"
                    type="text"
                    selected={selected?.promo}
                    data={filtervalue?.promotion}
                    promo
                    clickfunction={(idx, _) => {
                      handleClick(idx, "promo");
                    }}
                    onClear={handleClearSpecific}
                  />
                )}
            </>
          )}
        </div>

        <div className="btncontainer absolute w-[80%] flex flex-row gap-x-5 bottom-1">
          <PrimaryButton
            text={`Show Product ${productcount ?? "No Product"}`}
            type="button"
            onClick={() => {
              if (filtervalue?.search) {
                const param = new URLSearchParams(searchParams);
                param.set("search", filtervalue.search);
                router.push(`?${param}`);
              }

              setopenmodal((prev) => ({ ...prev, filteroption: false }));
            }}
            radius="10px"
            width="100%"
          />
          <PrimaryButton
            text="Clear"
            type="button"
            onClick={() => handleClear()}
            radius="10px"
            width="100%"
            color="lightcoral"
          />
        </div>
      </div>
    </Modal>
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
      <div className="header w-full h-fit flex flex-row justify-center items-center gap-x-10">
        <Image
          src={banner.url}
          alt={banner.name}
          width={700}
          height={700}
          loading="lazy"
          className="w-full h-[500px] object-contain rounded-lg"
        />
        <div className="description w-full min-h-[280px] h-fit p-3 rounded-lg bg-gray-500 text-white flex flex-col justify-center gap-y-5">
          <h3 className="title text-3xl font-bold">{name}</h3>
          <h3 className="title text-xl font-bold">{expiredDate}</h3>
          <p className="des w-full h-fit text-lg font-light">{description}</p>
        </div>
      </div>
      <div className="listproduct w-full h-full grid grid-cols-3 gap-10">
        {product.map((prod) => (
          <Card
            key={prod.id}
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