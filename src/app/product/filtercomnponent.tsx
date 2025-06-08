import React, { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ToggleSelect } from "../component/ToggleMenu";
import { NormalSkeleton } from "../component/Banner";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { filtervaluetype, getFilterValue } from "./action";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  ProductListSelectFilterType,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { Input, Spacer } from "@heroui/react";
import { SecondaryModal } from "../component/Modals";
import PrimaryButton from "../component/Button";

// Memoize child components for better performance
const MemoizedToggleSelect = memo(ToggleSelect);
const MemoizedNormalSkeleton = memo(NormalSkeleton);

export const FilterContainer = ({
  pid,
  cid,
  selected,
  productcount,
  isPromotion,
  latest,
  promoid,
}: {
  pid: string;
  cid?: string;
  selected?: ProductListSelectFilterType;
  productcount?: number;
  isPromotion?: string;
  latest?: boolean;
  promoid?: string;
}) => {
  const { setopenmodal, openmodal } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [filtervalue, setfiltervalue] = useState<filtervaluetype | undefined>(
    undefined
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch filter values once on component mount or when dependencies change
  useEffect(() => {
    if (selected?.search) {
      setfiltervalue((prev) => ({ ...prev, search: selected.search } as never));
    }

    const getFiltervalue = async () => {
      if (!pid && !cid) return;

      setloading(true);
      try {
        const request = getFilterValue.bind(
          null,
          parseInt(pid),
          cid ? parseInt(cid) : undefined,
          latest
        );

        const getreq = await request();

        if (getreq) {
          setfiltervalue((prev) => ({
            ...prev,
            ...getreq,
          }));
        }
      } catch (error) {
        console.error("Error fetching filter values:", error);
      } finally {
        setloading(false);
      }
    };

    getFiltervalue();
  }, [cid, latest, pid, selected?.search]);

  // Fetch promotion categories separately
  useEffect(() => {
    if (!isPromotion) return;

    const fetchcate = async () => {
      setloading(true);
      try {
        const res = await ApiRequest({
          url: `/api/categories/select?ty=promocate&promoid=${isPromotion}`,
          method: "GET",
        });

        if (res.success) {
          setfiltervalue((prev) => ({ ...prev, category: res.data } as never));
        }
      } catch (error) {
        console.error("Error fetching promotion categories:", error);
      } finally {
        setloading(false);
      }
    };

    fetchcate();
  }, [isPromotion]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleClick = useCallback(
    (idx: number, type: string, otheridx?: number) => {
      const param = new URLSearchParams(searchParams.toString());

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

      switch (type) {
        case "color":
          toggleParam("color", filtervalue?.variant.color[idx].val);
          break;
        case "text":
          if (otheridx !== undefined) {
            const val = filtervalue?.variant.text[idx].option_value[otheridx];
            toggleParam("other", val);
          }
          break;
        case "promo":
          toggleParam("promo", filtervalue?.promo?.[idx].name);
          break;
        case "pcate":
          toggleParam(
            "pcate",
            filtervalue?.category?.parent[idx].value.toString()
          );
          break;
        case "ccate":
          if (filtervalue?.category?.child) {
            toggleParam(
              "ccate",
              filtervalue.category.child[idx].value.toString()
            );
          }
          break;
      }

      router.push(`?${param}`, { scroll: false });
    },
    [filtervalue, router, searchParams]
  );

  const handleClear = useCallback(() => {
    if (!selected) return;

    const param = new URLSearchParams(searchParams.toString());
    Object.keys(selected).forEach((key) => {
      if (param.has(key)) {
        param.delete(key);
      }
    });

    router.push(`?${param}`);
  }, [router, searchParams, selected]);

  const handleClearSpecific = useCallback(
    (
      data: string[] | VariantColorValueType[],
      selectedValue: string[],
      promo?: boolean,
      type?: string
    ) => {
      const param = new URLSearchParams(searchParams.toString());

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

            if (type === "pcate" || type === "ccate") {
              param.delete(type);
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
    },
    [router, searchParams]
  );

  const handleSearchChange = useCallback((value: string) => {
    setfiltervalue((prev) => ({ ...prev, search: value } as never));
  }, []);

  const handleSearchClear = useCallback(() => {
    setfiltervalue((prev) => ({ ...prev, search: "" } as never));
  }, []);

  const handleShowProducts = useCallback(() => {
    if (filtervalue?.search) {
      const param = new URLSearchParams(searchParams.toString());
      param.set("search", filtervalue.search);
      router.push(`?${param}`);
    }

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  }, [filtervalue?.search, router, searchParams, setopenmodal]);

  const closeModal = useCallback(
    (val: boolean) => {
      setopenmodal((prev) => ({ ...prev, filteroption: val }));
    },
    [setopenmodal]
  );

  // Prepare data outside of the render function
  const hasColorVariants =
    filtervalue?.variant && filtervalue?.variant?.color.length > 0;
  const hasTextVariants =
    filtervalue?.variant && filtervalue?.variant?.text?.length > 0;
  const hasPromotions =
    !promoid &&
    !isPromotion &&
    filtervalue?.promotion &&
    filtervalue?.promotion.length > 0;
  const mainCategoryData = filtervalue?.category?.parent?.map((i) => i.label);
  const subCategoryData = filtervalue?.category?.child?.map((i) => i.label);
  const mainCategorySelected = filtervalue?.category?.parent
    ?.filter((i) => selected?.pcate?.includes(i.value.toString()))
    ?.map((i) => i.label);
  const subCategorySelected = filtervalue?.category?.child
    ?.filter((i) => selected?.ccate?.includes(i.value.toString()))
    ?.map((i) => i.label);

  return (
    <SecondaryModal
      size="4xl"
      placement="top"
      open={openmodal.filteroption ?? false}
      closebtn
      onPageChange={closeModal}
    >
      <div className="w-full h-full bg-white rounded-lg p-3 flex flex-col gap-y-5 items-center relative">
        <div className="w-full max-h-[400px] h-auto overflow-y-auto overflow-x-hidden flex flex-col gap-y-5 p-3 mt-2">
          <Input
            isClearable
            fullWidth
            type="text"
            label="Search"
            variant="bordered"
            placeholder="Search name"
            defaultValue={selected?.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onClear={handleSearchClear}
            size="lg"
          />

          {loading && (
            <MemoizedNormalSkeleton width="100%" height="50px" count={3} />
          )}

          {isPromotion && filtervalue?.category && (
            <>
              {mainCategoryData && (
                <MemoizedToggleSelect
                  title="Main Category"
                  type="pcate"
                  clickfunction={handleClick}
                  selected={mainCategorySelected}
                  data={mainCategoryData}
                  onClear={handleClearSpecific}
                />
              )}

              {filtervalue.category.child && subCategoryData && (
                <MemoizedToggleSelect
                  title="Sub Category"
                  type="ccate"
                  selected={subCategorySelected}
                  clickfunction={handleClick}
                  data={subCategoryData}
                  onClear={handleClearSpecific}
                />
              )}
            </>
          )}

          {filtervalue && (
            <>
              {hasColorVariants && (
                <MemoizedToggleSelect
                  title="Color"
                  type="color"
                  data={filtervalue.variant.color}
                  selected={selected?.color}
                  clickfunction={handleClick}
                  onClear={handleClearSpecific}
                />
              )}

              {hasTextVariants && (
                <>
                  <h3
                    className="text-lg font-bold"
                    hidden={filtervalue.variant.text.length === 0}
                  >
                    {selected?.other ? "Clear Filter" : "Other"}
                  </h3>

                  {filtervalue.variant.text.map((item, index) => (
                    <MemoizedToggleSelect
                      key={index}
                      title={item.option_title}
                      type="text"
                      data={item.option_value}
                      selected={selected?.other}
                      clickfunction={(idx, type) =>
                        handleClick(index, type, idx)
                      }
                      onClear={handleClearSpecific}
                    />
                  ))}
                </>
              )}

              <Spacer />

              {hasPromotions && (
                <MemoizedToggleSelect
                  title="Promotion"
                  type="text"
                  selected={selected?.promo}
                  data={filtervalue.promotion ?? []}
                  promo
                  clickfunction={(idx) => handleClick(idx, "promo")}
                  onClear={handleClearSpecific}
                />
              )}
            </>
          )}
        </div>

        <div className="btncontainer w-full flex flex-row gap-x-5">
          <PrimaryButton
            text={`Show Product ${productcount ?? "No Product"}`}
            type="button"
            onClick={handleShowProducts}
            radius="10px"
            width="100%"
          />
          <PrimaryButton
            text="Clear"
            type="button"
            onClick={handleClear}
            radius="10px"
            width="100%"
            color="lightcoral"
          />
        </div>
      </div>
    </SecondaryModal>
  );
};

export default memo(FilterContainer);
