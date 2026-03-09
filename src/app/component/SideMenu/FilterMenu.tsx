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
import { Checkbox } from "@heroui/react";
import { DateTimePicker } from "@mui/x-date-pickers";
import { SecondaryModal } from "../Modals";
import { Selection } from "../Button";
import PrimaryButton from "../Button";
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
import { SelectionCustom } from "../Pagination_Component";
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

const statusFilter = ["Low"];

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
    const filtervalues = Object.entries(filtervalue);

    filtervalues.map(([key, value]) => {
      if (key === "expiredate" && value) {
        const val = dayjs(value);
        params.set(key, formatDate(val.toDate()));
        setfilterdata &&
          setfilterdata((prev) => ({
            ...prev,
            [key]: formatDate(val.toDate()),
          }));
      }
      if (key === "promoids" && value) {
        const val = value as number[];
        params.set("promoids", val.join(","));
        setfilterdata && setfilterdata((prev) => ({ ...prev, [key]: value }));
      }

      if (key !== "p" && value && value !== "none") {
        params.set(key, value);
        setfilterdata && setfilterdata((prev) => ({ ...prev, [key]: value }));
      }
    });

    params.set("p", "1");

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
  ]);

  const handleSelect = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;

      setfilter((prev) => ({ ...prev, [name]: value }));

      if (name === "parentcate") {
        const params = new URLSearchParams(searchParams);
        params.delete("childcate");
        router.push(`?${params}`);
      }
    },
    [searchParams, router],
  );

  const handleClear = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filtervalue).map(([key, _]) => {
      if (key !== "p") {
        params.delete(key);
      }
    });

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
      if (!value) return;
      const val = value as SelectType[];
      setfilter((prev) => ({
        ...prev,
        promoids: val.map((i) => parseInt(i.value.toString(), 10)),
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

  const isFilterDisabled = useMemo(() => {
    return Object.entries(filtervalue).every(([i, j]) => !j || j === "none");
  }, [filtervalue]);

  const mappedParentCategories = useMemo(() => {
    return category?.parentcates?.map((i) => ({
      label: i.name,
      value: i.id,
    }));
  }, [category?.parentcates]);

  const Footer = useMemo(() => {
    return () => (
      <div className="flex gap-3 w-full p-4 bg-linear-to-t from-gray-50 to-white border-t border-gray-100">
        {type !== "listproduct" ? (
          <PrimaryButton
            type="button"
            onClick={handleFilter}
            text="Apply Filters"
            disable={isFilterDisabled}
            radius="12px"
            width="70%"
            color="#3B82F6"
            hoverColor="#2563EB"
          />
        ) : (
          <PrimaryButton
            type="button"
            text={`Show ${totalproduct || 0} Product${
              totalproduct !== 1 ? "s" : ""
            }`}
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, filteroption: false }))
            }
            radius="12px"
            width="70%"
            color="#3B82F6"
            hoverColor="#2563EB"
          />
        )}
        <PrimaryButton
          type="button"
          onClick={handleClear}
          text="Clear All"
          color="#F87171"
          hoverColor="#EF4444"
          radius="12px"
          width="30%"
        />
      </div>
    );
  }, [
    type,
    totalproduct,
    handleFilter,
    handleClear,
    isFilterDisabled,
    setopenmodal,
  ]);

  return (
    <SecondaryModal
      open={openmodal.filteroption}
      size="5xl"
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, filteroption: val }))
      }
      placement="top"
      closebtn
      footer={Footer}
    >
      <div className="filtermenu w-full relative h-fit">
        <div
          className="bg-linear-to-b from-white to-gray-50 p-8 max-small_phone:p-5 max-small_phone:max-h-[50vh] rounded-2xl flex flex-col gap-y-6 transition-all duration-300 shadow-xs"
          style={{
            opacity: loading ? 0.5 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          {type !== "usermanagement" && (
            <div
              className={type === "listproduct" ? "hidden" : "w-full space-y-2"}
            >
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search by Name
              </label>
              {loading ? (
                <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
              ) : (
                <input
                  type="text"
                  name="name"
                  placeholder="Enter product name..."
                  value={filtervalue.name}
                  onChange={handleNameChange}
                  disabled={loading}
                  className="w-full px-4 py-3 h-[52px] rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-xs text-gray-900 placeholder:text-gray-400"
                />
              )}
            </div>
          )}
          {type === "listproduct" &&
            (filterdata.color || filterdata.size || filterdata.text) && (
              <>
                {filterdata.size && filterdata.size.length !== 0 && (
                  <ToggleSelect
                    type="size"
                    title="Size"
                    data={filterdata.size}
                  />
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
          {type === "usermanagement" && (
            <div className="w-full space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search Users
              </label>
              {loading ? (
                <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
              ) : (
                <input
                  type="text"
                  name="search"
                  placeholder="Search by ID or Email..."
                  value={filtervalue.search}
                  onChange={handleSearchChange}
                  disabled={loading}
                  className="w-full px-4 py-3 h-[52px] rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-xs text-gray-900 placeholder:text-gray-400"
                />
              )}
            </div>
          )}
          {type === "banner" && (
            <div className="space-y-6 p-4 bg-linear-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Banner Settings
                </h3>
              </div>
              <div className="w-full flex flex-col gap-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Banner Type
                </label>
                {loading ? (
                  <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                ) : (
                  <Selection
                    name="bannertype"
                    data={[{ label: "None", value: "none" }, ...BannerType]}
                    value={filtervalue.bannertype}
                    onChange={handleSelect}
                    disable={loading}
                  />
                )}
              </div>
              <div className="w-full flex flex-col gap-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Banner Size
                </label>
                {loading ? (
                  <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                ) : (
                  <Selection
                    name="bannersize"
                    data={[{ label: "None", value: "none" }, ...BannerSize]}
                    onChange={handleSelect}
                    value={filtervalue.bannersize}
                    disable={loading}
                  />
                )}
              </div>
            </div>
          )}
          {type === "promotion" && (
            <div className="space-y-6 p-4 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Promotion Filters
                </h3>
              </div>
              <div className="w-full flex flex-col gap-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Expiration Date
                </label>
                {loading ? (
                  <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                ) : (
                  <div className="w-full h-[52px] relative z-100">
                    <DateTimePicker
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                        },
                      }}
                      value={
                        filtervalue.expiredate
                          ? dayjs(filtervalue.expiredate)
                          : null
                      }
                      onChange={handleDateChange}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                {loading ? (
                  <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                ) : (
                  <SelectionCustom
                    data={[{ label: "Expired", value: "1" }]}
                    label="status"
                    value={filtervalue.expired}
                    placeholder="Select Status"
                    onChange={handleExpiredChange}
                  />
                )}
              </div>
            </div>
          )}
          {type === "product" && (
            <div className="space-y-6">
              <div className="p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Product Categories
                  </h3>
                </div>
                <div className="w-full flex flex-col gap-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  {loading ? (
                    <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                  ) : (
                    <Selection
                      name="parentcate"
                      data={mappedParentCategories}
                      default="Select Parent Category"
                      value={filtervalue.parentcate ?? ""}
                      onChange={handleSelect}
                      disable={loading}
                    />
                  )}
                </div>
                {filtervalue.parentcate !== 0 && (
                  <div className="w-full flex flex-col gap-y-2 animate-fade-in">
                    <label className="text-sm font-medium text-gray-700">
                      Subcategory
                    </label>
                    {loading ? (
                      <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                    ) : (
                      <Selection
                        type="subcategory"
                        subcategory={category?.childcate}
                        name="childcate"
                        default="Select Sub Category"
                        value={filtervalue.childcate ?? ""}
                        onChange={handleSelect}
                        disable={loading}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  Stock Status
                </label>
                {loading ? (
                  <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                ) : (
                  <Selection
                    default="Select Stock Status"
                    onChange={handleSelect}
                    name="status"
                    value={filtervalue.status}
                    data={statusFilter}
                    disable={loading}
                  />
                )}
              </div>
              {promotion.selectproduct && (
                <div className="w-full flex flex-col gap-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Discount
                  </label>
                  <Selection
                    default="Select Discount"
                    name="discount"
                    disable={loading}
                  />
                </div>
              )}
              {type === "product" &&
                (globalindex.promotioneditindex !== -1 && isSetPromotion ? (
                  <div className="p-4 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    {loading ? (
                      <div className="w-full h-[44px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                    ) : (
                      <Checkbox
                        className="w-full"
                        isSelected={!!filtervalue.promoids}
                        isDisabled={loading}
                        onValueChange={handleCheckboxChange}
                      >
                        <span className="text-sm font-medium text-gray-700">
                          Show Only Discounted Products
                        </span>
                      </Checkbox>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                        />
                      </svg>
                      Promotion
                    </label>
                    {loading ? (
                      <div className="w-full h-[52px] rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                    ) : (
                      <SelectAndSearchProduct
                        getdata={(take, value) =>
                          GetPromotionSelection(value, take)
                        }
                        placeholder="Select Promotion..."
                        value={promoval}
                        onSelect={handlePromotionSelect}
                      />
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </SecondaryModal>
  );
};

interface InfoContainerProps {
  container?: string;
  title: string;
  content: string;
}

export const InfoContainer = ({ title, content }: InfoContainerProps) => {
  return (
    <div className="info__container w-[300px] max-w-[400px] h-fit flex flex-col items-start justify-start gap-y-4 p-6 bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="info__header text-lg font-bold text-gray-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        {title}
      </div>
      <p className="info__body text-sm font-normal max-w-[350px] wrap-break-word text-left text-gray-600 leading-relaxed">
        {content}
      </p>
    </div>
  );
};
