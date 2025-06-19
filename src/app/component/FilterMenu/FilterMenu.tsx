import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../Button";
import { SecondaryModal } from "../Modals";
import { ChangeEvent, memo, useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BannerSize,
  BannerTypeSelect,
  categorytype,
  FiltermenuType,
  FilterValueType,
  SelectType,
} from "@/src/context/GlobalType.type";
import dayjs from "dayjs";
import { formatDate } from "../EmailTemplate";
import { AsyncSelection } from "../AsynSelection";
import { DateTimePicker } from "@mui/x-date-pickers";
import { Checkbox, DateRangePicker, Divider, NumberInput } from "@heroui/react";
import { FetchCategory } from "../../dashboard/inventory/createproduct/[editId]/action";
import { FetchPromotionSelection } from "./action";

const FilterMenu = memo(
  ({
    type,
    reloaddata,
    isLoading,
  }: {
    type?: FiltermenuType;
    reloaddata?: () => void;
    isLoading?: boolean;
  }) => {
    const {
      openmodal,
      setopenmodal,
      promotion,
      globalindex,
      filtervalue,
      setfiltervalue,
    } = useGlobalContext();

    // All hooks must be at the top level - never inside conditionals or memoized components
    const [tempFilter, settempFilter] = useState<FilterValueType>({
      ...filtervalue,
      search: "",
    });
    const isFilter = useMemo(() => {
      return tempFilter && Object.values(tempFilter).some((i) => i);
    }, [tempFilter]);
    const [selectdate, setselectdate] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Callbacks remain the same as they don't affect hook order
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>, cate?: SelectType) => {
        const { name, value } = e.target;

        if (name === "search" && reloaddata) reloaddata();

        const toBeUpdateFilterdValue: Partial<FilterValueType> = {
          ...tempFilter,
        };

        if (cate) {
          toBeUpdateFilterdValue.categories = {
            ...toBeUpdateFilterdValue.categories,
            [name]: cate,
          } as never;
        }

        toBeUpdateFilterdValue[name as never] = value as never;

        settempFilter((prev) => ({
          ...prev,
          ...(name === "promoids"
            ? {
                ...toBeUpdateFilterdValue,
                promoids: toBeUpdateFilterdValue.promoids?.filter(
                  (i) => i.length > 0
                ),
              }
            : toBeUpdateFilterdValue),
        }));
      },
      [reloaddata, tempFilter]
    );

    const handleFilter = useCallback(() => {
      if (!tempFilter) return;

      const params = new URLSearchParams(searchParams);
      const filtervalues = Object.entries(tempFilter);

      filtervalues.map(([key, value]) => {
        if (value === "none" || value === undefined || value === "") {
          params.delete(key);
        }

        if (key === "expiredate" && value) {
          const val = dayjs(value as string);
          params.set(key, formatDate(val.toDate()));
        }
        if (key === "promoids" && value) {
          const val = value as string[];

          params.set("promoids", val.filter((i) => i.length > 0).join(","));
        }

        if (key === "categories" && value) {
          localStorage.setItem(key, JSON.stringify(value));
        }

        if (key !== "p" && key !== "categories" && value && value !== "none") {
          params.set(key, value as string);
        }
      });

      params.set("p", "1");
      router.push(`?${params}`);

      setfiltervalue(tempFilter);
      setopenmodal((prev) => ({ ...prev, filteroption: false }));
    }, [router, searchParams, setfiltervalue, setopenmodal, tempFilter]);

    const handleClear = useCallback(() => {
      if (!tempFilter) return;

      const params = new URLSearchParams(searchParams);
      Object.keys(tempFilter).map((key) => {
        if (key !== "p") {
          if (window.localStorage.getItem(key)) {
            window.localStorage.removeItem(key);
          }
          params.delete(key);
        }
      });

      params.set("p", "1");

      router.push(`?${params}`);

      settempFilter({ search: "" });
      setfiltervalue(undefined);
      setopenmodal((prev) => ({ ...prev, filteroption: false }));
    }, [tempFilter, searchParams, router, setfiltervalue, setopenmodal]);

    const handleCloseModal = useCallback(() => {
      if (!selectdate && !isLoading)
        setopenmodal((prev) => ({ ...prev, filteroption: false }));
    }, [selectdate, setopenmodal, isLoading]);

    // Memoize rendering parts without using hooks inside them
    const searchInputMemo = useMemo(() => {
      if (type === "listproduct") return null;

      const placeholder =
        type === "listorder"
          ? "OrderId | Email | Name"
          : type === "usermanagement"
          ? "Search (ID , Email)"
          : "Search Name";

      return (
        <input
          type="text"
          name="search"
          placeholder={placeholder}
          value={tempFilter?.search || ""}
          onChange={handleChange}
          className="search w-full pl-2 h-[50px] rounded-md border border-gray-300"
        />
      );
    }, [type, tempFilter?.search, handleChange]);

    // Memoize banner section
    const bannerSectionMemo = useMemo(() => {
      if (type !== "banner") return null;

      return (
        <>
          <div className="w-full h-fit flex flex-col gap-y-5">
            <label className="w-full text-lg font-medium">Banner Type</label>
            <AsyncSelection
              type="normal"
              data={() => [
                { label: "All", value: "none" },
                ...BannerTypeSelect,
              ]}
              option={{
                name: "bannertype",
                "aria-label": "banner type",
                selectedKeys: tempFilter?.bannertype
                  ? [tempFilter.bannertype]
                  : undefined,
                onChange: (val) => handleChange(val as never),
              }}
            />
          </div>
          <div className="w-full h-fit flex flex-col gap-y-5">
            <label className="w-full text-lg font-medium">Banner Size</label>
            <AsyncSelection
              type="normal"
              data={() => [{ label: "All", value: "none", ...BannerSize }]}
              option={{
                name: "banner size",
                "aria-label": "bannersize",
                selectedKeys: tempFilter?.bannersize
                  ? [tempFilter.bannersize]
                  : undefined,
                onChange: (val) => handleChange(val as never),
              }}
            />
          </div>
        </>
      );
    }, [type, tempFilter?.bannertype, tempFilter?.bannersize, handleChange]);

    // Memoize promotion section
    const promotionSectionMemo = useMemo(() => {
      if (type !== "promotion") return null;

      return (
        <div
          onMouseEnter={() => setselectdate(true)}
          onMouseLeave={() => setselectdate(false)}
          className="w-full h-[50px] relative z-[100]"
        >
          <DateTimePicker
            sx={{ width: "100%" }}
            value={tempFilter?.expiredate ? dayjs(tempFilter.expiredate) : null}
            onChange={(e) => {
              if (e) {
                handleChange({
                  target: {
                    name: "expireddate",
                    value: e.toDate(),
                  },
                } as never);
              }
            }}
          />
        </div>
      );
    }, [type, tempFilter?.expiredate, handleChange]);

    // Memoize product section
    const productSectionMemo = useMemo(() => {
      if (type !== "product") return null;

      return (
        <>
          <h3>Detail Options</h3>
          <Divider />
          <div className="w-full h-fit flex flex-row gap-x-3">
            <AsyncSelection
              type="async"
              data={(take) =>
                take
                  ? (FetchCategory({
                      ty: "parent",
                      offset: take,
                      type: categorytype.normal,
                    }) as never)
                  : undefined
              }
              option={{
                fullWidth: true,
                selectedValue: tempFilter?.parentcate
                  ? [tempFilter.parentcate]
                  : undefined,
                onValueChange: (val, cate) => {
                  handleChange(
                    {
                      target: {
                        name: "parentcate",
                        value: val.target.value,
                      },
                    } as never,
                    cate
                  );
                },
                label: "Parent Categories",
              }}
            />
            <AsyncSelection
              type="async"
              data={(take) =>
                take && tempFilter?.parentcate
                  ? (FetchCategory({
                      ty: "child",
                      pid: Number(tempFilter?.parentcate),
                      offset: take,
                    }) as never)
                  : undefined
              }
              forceRefetch={Number(tempFilter?.parentcate ?? "0")}
              option={{
                fullWidth: true,
                label: "Child Categories",
                size: "md",
                isDisabled: !tempFilter?.parentcate,
                selectedValue: tempFilter?.childcate
                  ? [tempFilter.childcate]
                  : undefined,
                onValueChange: (e, val) => {
                  handleChange(
                    {
                      target: { name: "childcate", value: e.target.value },
                    } as never,
                    val
                  );
                },
              }}
            />
          </div>
          {globalindex.promotioneditindex !== -1 && promotion.selectproduct ? (
            <Checkbox
              className="w-full h-[40px]"
              onValueChange={(value) => {
                handleChange({
                  target: { name: "promotiononly", value: value as never },
                } as never);
              }}
              aria-label="promotion only"
            >
              Only Discount
            </Checkbox>
          ) : (
            <AsyncSelection
              type="async"
              data={(val = 5) => FetchPromotionSelection(val) as never}
              option={{
                selectionMode: "multiple",
                label: "Promotion",
                selectedValue: tempFilter?.promoids
                  ? tempFilter.promoids
                  : undefined,
                onChange: (e) =>
                  handleChange({
                    target: {
                      name: "promoids",
                      value: e.target.value.split(",") as never,
                    },
                  } as never),
              }}
            />
          )}
        </>
      );
    }, [
      type,
      tempFilter?.parentcate,
      tempFilter?.childcate,
      tempFilter?.promoids,
      globalindex.promotioneditindex,
      promotion.selectproduct,
      handleChange,
    ]);

    const orderSectionMemo = useMemo(() => {
      if (type !== "listorder") return null;
      return (
        <>
          <DateRangePicker
            value={filtervalue?.orderdate}
            onChange={(val) => {
              handleChange({
                target: { name: "orderdate", value: val as never },
              } as never);
            }}
            label={"Order Date Range"}
            aria-label="order date range"
          />
          <div className="priceRange w-full h-fit flex flex-row items-center gap-x-5">
            <NumberInput
              label={"Start"}
              value={filtervalue?.price?.start}
              aria-label="price start"
              onValueChange={(val) =>
                handleChange({
                  target: {
                    name: "price",
                    value: { ...filtervalue?.price, start: val },
                  },
                } as never)
              }
            />
            <NumberInput
              label={"End"}
              value={filtervalue?.price?.end}
              aria-label="price end"
              onValueChange={(val) =>
                handleChange({
                  target: {
                    name: "price",
                    value: { ...filtervalue?.price, end: val },
                  },
                } as never)
              }
            />
          </div>
        </>
      );
    }, [filtervalue?.orderdate, filtervalue?.price, handleChange, type]);

    // Memoize footer buttons
    const footerButtonsMemo = useMemo(
      () => (
        <>
          <PrimaryButton
            type="button"
            onClick={() => handleFilter()}
            text="Filter"
            disable={!isFilter}
            radius="10px"
            width="100%"
          />

          <PrimaryButton
            type="button"
            onClick={() => handleClear()}
            text="Clear"
            color="lightcoral"
            radius="10px"
            width="100%"
            disable={!isFilter}
          />
        </>
      ),
      [isFilter, handleFilter, handleClear]
    );

    // Return the component with memoized parts
    return (
      <SecondaryModal
        open={openmodal.filteroption ?? false}
        size="5xl"
        onPageChange={handleCloseModal}
        placement="top"
        closebtn
        footer={() => footerButtonsMemo}
      >
        <div className="filtermenu w-full relative h-fit bg-white p-5 max-small_phone:max-h-[50vh] rounded-md flex flex-col justify-center gap-y-5">
          {searchInputMemo}
          {bannerSectionMemo}
          {promotionSectionMemo}
          {orderSectionMemo}
          {productSectionMemo}
        </div>
      </SecondaryModal>
    );
  }
);

FilterMenu.displayName = "FilterMenu";

export default FilterMenu;
