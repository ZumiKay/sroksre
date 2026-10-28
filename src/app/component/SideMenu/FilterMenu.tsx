"use client";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers";
import { SecondaryModal } from "../Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
} from "@/src/context/CustomHook";
import { errorToast } from "../Loading";
import { ToggleSelect } from "../ToggleMenu";
import { formatDate } from "../EmailTemplate";
import {
  getSubCategories,
  InventoryParamType,
} from "../../dashboard/inventory/varaint_action";
import { BannerSize, BannerType } from "../Modals/Banner";
import { SelectAndSearchProduct } from "../Banner";
import { GetPromotionSelection } from "../Modals/Category";
import { FilterValue } from "@/src/types/product.type";
import { SelectType } from "@/src/types/productAction.type";

interface FilterCategoryType {
  id: number;
  name: string;
}

interface CategoriesType {
  parentcates: Array<FilterCategoryType>;
  childcate?: Array<FilterCategoryType>;
}

const fetchsubcate = async (value: string) => {
  const getsub = getSubCategories.bind(null, parseInt(value));
  const getreq = await getsub();
  return getreq;
};

interface FilterMenuProps {
  type?: string;
  totalproduct?: number;
  categories?: {
    parentid?: number;
    childid?: number;
  };
  expiredAt?: string;
  name?: string;
  stock?: string;
  expired?: string;
  param?: InventoryParamType;
  setisFilter?: React.Dispatch<React.SetStateAction<boolean>>;
  reloadData?: () => void;
  isSetPromotion?: boolean;
  /** Promotion product picking: list picked products first */
  selectedFirst?: boolean;
  onSelectedFirstChange?: (value: boolean) => void;
  setfilterdata?: React.Dispatch<
    React.SetStateAction<InventoryParamType | undefined>
  >;
}

export const FilterMenu = ({
  type,
  totalproduct,
  categories,
  expiredAt,
  name,
  param,
  setisFilter,
  expired,
  reloadData,
  setfilterdata,
  isSetPromotion,
  selectedFirst,
  onSelectedFirstChange,
}: FilterMenuProps) => {
  const { openmodal, setopenmodal, promotion, listproductfilval, globalindex } =
    useGlobalContext();

  const [loading, setloading] = useState(false);
  const [category, setcategory] = useState<CategoriesType | undefined>(
    undefined,
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filtervalue, setfilter] = useState<FilterValue>({
    parentcate: categories?.parentid ?? undefined,
    childcate: categories?.childid ?? undefined,
    name: name ?? param?.name ?? "",
    expiredate: expiredAt
      ? dayjs(expiredAt).toISOString()
      : param?.expiredate
        ? dayjs(param.expiredate).toISOString()
        : undefined,
    bannersize: param?.bannersize ?? "",
    bannertype: param?.bannertype ?? "",
    search: param?.search ?? "",
    status: param?.status ?? "",
    expired: expired ?? param?.expired ?? "",
    promoids: param?.promoids?.split(",").map((i) => parseInt(i, 10)),
  });

  const [filterdata, setdata] = useState<{
    size?: Array<string>;
    color?: Array<string>;
    text?: Array<string>;
  }>({});
  const [promoval, setpromoval] = useState<SelectType[] | undefined>(undefined);
  const [showSelectedFirst, setShowSelectedFirst] = useState(
    selectedFirst ?? true,
  );

  const fetchcate = useCallback(async () => {
    const asycnfetchdata = async () => {
      const categories = await ApiRequest("/api/categories", undefined, "GET");

      if (!categories.success) {
        errorToast("Error Connection");
        return;
      }
      setcategory({
        parentcates: categories.data,
      });
    };

    await Delayloading(asycnfetchdata, setloading, 500);
  }, []);

  useEffectOnce(() => {
    if (type === "listproduct") {
      setdata(listproductfilval);
      return;
    }

    type === "product" && fetchcate();
  });

  const fetchPromo = useCallback(async (promoids: string) => {
    const data = await ApiRequest(
      `/api/promotion?ty=byid&ids=${promoids}`,
      undefined,
      "GET",
    );
    if (data.success) {
      setpromoval(data.data);
    }
  }, []);

  useEffect(() => {
    if (param?.promoids) {
      fetchPromo(param.promoids);
    }
  }, [param?.promoids, fetchPromo]);

  const fetchSubcategory = useCallback(async (parentId: string) => {
    const data = await fetchsubcate(parentId);
    setcategory((prev) => ({ ...prev, childcate: data.data }) as any);
  }, []);

  useEffect(() => {
    if (filtervalue.parentcate) {
      fetchSubcategory(filtervalue.parentcate.toString());
    }
  }, [filtervalue.parentcate, fetchSubcategory]);

  const handleFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    const applied: Record<string, string> = {};

    // Write every field: set it when filled, remove it when cleared
    Object.entries(filtervalue).forEach(([key, value]) => {
      if (key === "p") return;
      let out: string | undefined;
      if (key === "expiredate") {
        out = value ? formatDate(dayjs(value).toDate()) : undefined;
      } else if (key === "promoids") {
        out =
          Array.isArray(value) && value.length > 0
            ? value.join(",")
            : undefined;
      } else if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "none"
      ) {
        out = String(value);
      }

      if (out) {
        params.set(key, out);
        applied[key] = out;
      } else {
        params.delete(key);
      }
    });

    if (promotion.selectproduct && onSelectedFirstChange) {
      if (showSelectedFirst) params.delete("selectedfirst");
      else params.set("selectedfirst", "0");
      onSelectedFirstChange(showSelectedFirst);
    }

    params.set("p", "1");

    setfilterdata && setfilterdata(applied as InventoryParamType);

    router.push(`?${params}`);

    setisFilter && setisFilter(true);

    reloadData && reloadData();

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  }, [
    filtervalue,
    searchParams,
    router,
    setfilterdata,
    setisFilter,
    reloadData,
    setopenmodal,
    promotion.selectproduct,
    showSelectedFirst,
    onSelectedFirstChange,
  ]);

  const handleSelect = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setfilter((prev) => ({
      ...prev,
      [name]: value,
      // A new category invalidates the chosen subcategory
      ...(name === "parentcate" ? { childcate: undefined } : {}),
    }));
  }, []);

  const handleClear = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filtervalue).map(([key, _]) => {
      if (key !== "p") {
        params.delete(key);
      }
    });

    params.delete("selectedfirst");
    setShowSelectedFirst(true);
    onSelectedFirstChange?.(true);

    params.set("p", "1");

    setfilterdata && setfilterdata({});

    router.push(`?${params}`);

    reloadData ? reloadData() : router.refresh();

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  }, [
    filtervalue,
    searchParams,
    router,
    setfilterdata,
    reloadData,
    setopenmodal,
    onSelectedFirstChange,
  ]);

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setfilter((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setfilter((prev) => ({ ...prev, search: e.target.value }));
  }, []);

  const handleDateChange = useCallback((e: any) => {
    if (e) {
      setfilter((prev) => ({
        ...prev,
        expiredate: dayjs(e).toISOString(),
      }));
    }
  }, []);

  const handleExpiredChange = useCallback((value: string | number) => {
    setfilter((prev) => ({ ...prev, expired: value as string }));
  }, []);

  const handlePromotionSelect = useCallback(
    (value?: SelectType | SelectType[]) => {
      // Clearing the picker removes the promotion filter
      const val = (value as SelectType[] | undefined) ?? [];
      setfilter((prev) => ({
        ...prev,
        promoids:
          val.length > 0
            ? val.map((i) => parseInt(i.value.toString(), 10))
            : undefined,
      }));
    },
    [],
  );

  const handleCheckboxChange = useCallback(
    (value: boolean) => {
      setfilter((prev) => ({
        ...prev,
        promoids: value ? [globalindex.promotioneditindex] : undefined,
      }));
    },
    [globalindex.promotioneditindex],
  );

  const parentCategoryOptions = useMemo(
    () =>
      category?.parentcates?.map((i) => ({ label: i.name, value: i.id })) ?? [],
    [category?.parentcates],
  );
  const subCategoryOptions = useMemo(
    () =>
      category?.childcate?.map((i) => ({ label: i.name, value: i.id })) ?? [],
    [category?.childcate],
  );

  const typeLabel =
    type === "product"
      ? "products"
      : type === "banner"
        ? "banners"
        : type === "promotion"
          ? "promotions"
          : type === "usermanagement"
            ? "users"
            : "items";

  const Footer = useMemo(() => {
    const FilterFooter = () => (
      <div className="w-full flex flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="h-10 px-3 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Clear all
        </button>
        {type !== "listproduct" ? (
          <button
            type="button"
            onClick={handleFilter}
            className="h-10 px-5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Apply filters
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, filteroption: false }))
            }
            className="h-10 px-5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Show {totalproduct || 0} product{totalproduct !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    );
    FilterFooter.displayName = "FilterFooter";
    return FilterFooter;
  }, [type, totalproduct, handleFilter, handleClear, setopenmodal]);

  const isPickingPromotionProducts =
    type === "product" && promotion.selectproduct;
  const isEditingPromotion =
    globalindex.promotioneditindex !== -1 && isSetPromotion;

  return (
    <SecondaryModal
      open={openmodal.filteroption}
      size="xl"
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, filteroption: val }))
      }
      placement="top"
      scroll="inside"
      closebtn
      footer={Footer}
    >
      <div
        className="filtermenu w-full flex flex-col gap-y-5 py-2 transition-opacity"
        style={{
          opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? "none" : "auto",
        }}
        aria-busy={loading}
      >
        <div className="pb-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            Filter {typeLabel}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Changes take effect when you click Apply filters.
          </p>
        </div>

        {type !== "usermanagement" && type !== "listproduct" && (
          <FilterField label="Name">
            <input
              type="text"
              name="name"
              placeholder={`Search ${typeLabel} by name`}
              value={filtervalue.name ?? ""}
              onChange={handleNameChange}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className={inputClass}
            />
          </FilterField>
        )}

        {type === "usermanagement" && (
          <FilterField label="Search users">
            <input
              type="text"
              name="search"
              placeholder="ID or email"
              value={filtervalue.search ?? ""}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className={inputClass}
            />
          </FilterField>
        )}

        {type === "listproduct" &&
          (filterdata.color || filterdata.size || filterdata.text) && (
            <>
              {filterdata.size && filterdata.size.length !== 0 && (
                <ToggleSelect type="size" title="Size" data={filterdata.size} />
              )}
              {filterdata.color && filterdata.color.length > 0 && (
                <ToggleSelect
                  type="color"
                  title="Color"
                  data={
                    filterdata.color?.filter((i) => i.length > 0) as string[]
                  }
                />
              )}
              {filterdata.text && filterdata.text.length !== 0 && (
                <ToggleSelect
                  type="text"
                  title="Other"
                  data={filterdata.text}
                />
              )}
            </>
          )}

        {type === "banner" && (
          <div className="grid grid-cols-2 gap-4 max-small_phone:grid-cols-1">
            <SelectField
              label="Type"
              name="bannertype"
              value={filtervalue.bannertype}
              onChange={handleSelect}
              placeholder="Any type"
              options={BannerType}
            />
            <SelectField
              label="Size"
              name="bannersize"
              value={filtervalue.bannersize}
              onChange={handleSelect}
              placeholder="Any size"
              options={BannerSize}
            />
          </div>
        )}

        {type === "promotion" && (
          <>
            <FilterField label="Expires before">
              <DateTimePicker
                sx={{
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    height: "40px",
                    fontSize: "14px",
                  },
                }}
                value={
                  filtervalue.expiredate ? dayjs(filtervalue.expiredate) : null
                }
                onChange={handleDateChange}
              />
            </FilterField>
            <SelectField
              label="Status"
              name="expired"
              value={filtervalue.expired}
              onChange={(e) => handleExpiredChange(e.target.value)}
              placeholder="Any status"
              options={[{ label: "Expired only", value: "1" }]}
            />
          </>
        )}

        {type === "product" && (
          <>
            <div className="grid grid-cols-2 gap-4 max-small_phone:grid-cols-1">
              <SelectField
                label="Category"
                name="parentcate"
                value={filtervalue.parentcate}
                onChange={handleSelect}
                placeholder={loading ? "Loading..." : "Any category"}
                options={parentCategoryOptions}
              />
              <SelectField
                label="Subcategory"
                name="childcate"
                value={filtervalue.childcate}
                onChange={handleSelect}
                placeholder={
                  filtervalue.parentcate
                    ? "Any subcategory"
                    : "Choose a category first"
                }
                options={filtervalue.parentcate ? subCategoryOptions : []}
                disabled={!filtervalue.parentcate}
              />
            </div>

            <SelectField
              label="Stock"
              name="status"
              value={filtervalue.status}
              onChange={handleSelect}
              placeholder="Any stock level"
              options={[{ label: "Low stock (5 or fewer)", value: "Low" }]}
            />

            {isPickingPromotionProducts ? (
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
                <span className="text-sm font-medium text-slate-700">
                  Promotion products
                </span>
                {onSelectedFirstChange && (
                  <CheckboxField
                    checked={showSelectedFirst}
                    onChange={setShowSelectedFirst}
                    label="Show selected products first"
                    hint="Products in this promotion appear at the start of the list, across all pages."
                  />
                )}
                {isEditingPromotion && (
                  <CheckboxField
                    checked={!!filtervalue.promoids}
                    onChange={handleCheckboxChange}
                    label="Show only discounted products"
                    hint="Hide products that aren't saved in this promotion."
                  />
                )}
              </div>
            ) : (
              <FilterField label="Promotion">
                <SelectAndSearchProduct
                  getdata={(take, value) => GetPromotionSelection(value, take)}
                  placeholder="Search promotions"
                  value={promoval}
                  onSelect={handlePromotionSelect}
                />
              </FilterField>
            )}
          </>
        )}
      </div>
    </SecondaryModal>
  );
};

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors hover:border-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

const FilterField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {children}
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  name: string;
  value?: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ label: string; value: string | number }>;
  placeholder: string;
  disabled?: boolean;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <select
      name={name}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const CheckboxField = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 shrink-0 accent-slate-900"
    />
    <span>
      <span className="block text-sm text-slate-900">{label}</span>
      {hint && (
        <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>
      )}
    </span>
  </label>
);
