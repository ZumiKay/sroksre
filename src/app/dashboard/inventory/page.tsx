"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

// Components
import Card, { BannerCard } from "../../component/Card";
import { FilterMenu } from "../../component/SideMenu";
import { CreateProducts } from "../../component/Modals/Product";
import { Category } from "../../component/Modals/Category";
import { BannerModal } from "../../component/Modals/Banner";
import {
  CreatePromotionModal,
  DiscountModals,
} from "../../component/Modals/Promotion";
import PaginationCustom from "../../component/Pagination_Component";
import { InventoryHeader } from "./components/InventoryHeader";
import {
  ProductListItem,
  BannerListItem,
  PromotionListItem,
} from "./components/ListViewItems";
import { EmptyState, LoadingState } from "./components/EmptyAndLoadingStates";

// Contexts & Hooks
import { useGlobalContext, CateogoryState } from "@/src/context/GlobalContext";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";

// Utils & Types
import { IsNumber } from "@/src/lib/utilities";
import { errorToast } from "../../component/Loading";
import { Orderpricetype } from "@/src/types/order.type";
import { PromotionState } from "@/src/types/productAction.type";
import { InventoryParamType } from "./varaint_action";
import {
  buildProductApiUrl,
  buildBannerApiUrl,
  buildPromotionApiUrl,
  transformProductData,
  transformBannerData,
  transformPromotionData,
} from "./utils/apiBuilder";
import useCheckSession from "@/src/hooks/useCheckSession";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faXmark, faFilterCircleXmark } from "@fortawesome/free-solid-svg-icons";

// Constants
const DEFAULT_PARAMS = (type: string) => `?ty=${type}&p=1&limit=1`;

// Filter chip key → human-readable label mapping
const FILTER_CHIP_LABELS: Record<string, string> = {
  name: "Name",
  status: "Status",
  parentcate: "Category",
  childcate: "Subcategory",
  expiredate: "Expire before",
  bannersize: "Size",
  bannertype: "Type",
  expired: "Expired only",
  promoids: "Promotion",
};

export default function Inventory() {
  // Router hooks
  const router = useRouter();
  const searchParam = useSearchParams();

  // URL parameters - Extract from useSearchParams hook
  const type = searchParam.get("ty") ?? undefined;
  const p = searchParam.get("p") ?? undefined;
  const limit = searchParam.get("limit") ?? undefined;
  const status = searchParam.get("status") ?? undefined;
  const name = searchParam.get("name") ?? undefined;
  const parentcate = searchParam.get("parentcate") ?? undefined;
  const childcate = searchParam.get("childcate") ?? undefined;
  const expiredate = searchParam.get("expiredate") ?? undefined;
  const bannersize = searchParam.get("bannersize") ?? undefined;
  const bannertype = searchParam.get("bannertype") ?? undefined;
  const expired = searchParam.get("expired") ?? undefined;
  const promoids = searchParam.get("promoids") ?? undefined;

  // Global context
  const {
    openmodal,
    setopenmodal,
    allData,
    setalldata,
    isLoading,
    setisLoading,
    promotion,
    setpromotion,
    itemlength,
    setitemlength,
    globalindex,
  } = useGlobalContext();
  const { handleCheckSession } = useCheckSession();

  // Local state
  const [loaded, setloaded] = useState(false);
  const [show, setshow] = useState(limit ?? "1");
  const [page, setpage] = useState(p ? parseInt(p) : 1);
  const [itemscount, setitemcount] = useState(0);
  const [lowstock, setlowstock] = useState(0);
  const [reloaddata, setreloaddata] = useState(true);
  const [ty, settype] = useState(type);
  const [promoexpire, setpromoexpire] = useState(0);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filtervalue, setfiltervalue] = useState<InventoryParamType>({
    parentcate,
    childcate,
    name,
    expiredate,
    bannersize,
    bannertype,
    status,
    expired,
    promoids,
  });

  const [searchInput, setSearchInput] = useState(name ?? "");
  // Maps category/subcategory IDs → names for chip display (kept separate to avoid ID collisions)
  const [parentCateNameMap, setParentCateNameMap] = useState<Record<string, string>>({});
  const [childCateNameMap, setChildCateNameMap] = useState<Record<string, string>>({});

  const hasActiveFilters = useMemo(
    () => Object.values(filtervalue).some((value) => value !== undefined),
    [filtervalue],
  );

  const currentData = useMemo(
    () => allData?.[type as string] || [],
    [allData, type],
  );

  //Check user session
  useEffect(() => {
    handleCheckSession();
  }, [reloaddata, ty, page, viewMode, filtervalue, openmodal]);

  // Fetch category names to display in filter chips
  useEffect(() => {
    if (!filtervalue.parentcate) return;
    ApiRequest("/api/categories", undefined, "GET").then((res) => {
      if (!res.success) return;
      const parentMap: Record<string, string> = {};
      const childMap: Record<string, string> = {};
      (res.data as CateogoryState[]).forEach((cat) => {
        if (cat.id !== undefined) parentMap[cat.id.toString()] = cat.name;
        cat.subcategories.forEach((sub) => {
          if (sub.id !== undefined) childMap[sub.id.toString()] = sub.name;
        });
      });
      setParentCateNameMap(parentMap);
      setChildCateNameMap(childMap);
    });
  }, [filtervalue.parentcate]);

  // Validation searchParams
  useEffect(() => {
    if (!type) {
      return redirect(
        `/dashboard/inventory${DEFAULT_PARAMS(type ?? "product")}`,
      );
    }

    const isValid =
      (p && !IsNumber(p)) ||
      (limit && !IsNumber(limit)) ||
      (parentcate && !IsNumber(parentcate)) ||
      (childcate && !IsNumber(childcate)) ||
      (expired && !IsNumber(expired));

    if (isValid) {
      return redirect(`/dashboard/inventory?ty=${type}&p=1&limit=1`);
    }

    if (reloaddata) {
      fetchdata(promotion.id);
    }
  }, [
    reloaddata,
    type,
    p,
    limit,
    parentcate,
    childcate,
    expired,
    promotion.id,
  ]);

  const fetchdata = useCallback(
    async (pid?: number) => {
      try {
        let apiUrl: string = "";
        let transformFunction: (item: any) => any = (item) => item;

        // Build API URL based on type
        if (ty === "product") {
          apiUrl = buildProductApiUrl(
            page,
            show,
            filtervalue,
            !!promotion.selectproduct,
            pid,
            promoids,
          );
          transformFunction = transformProductData;
        } else if (ty === "banner") {
          apiUrl = buildBannerApiUrl(
            page,
            show,
            filtervalue,
            !!promotion.selectbanner,
          );
          transformFunction = transformBannerData;
        } else if (ty === "promotion") {
          apiUrl = buildPromotionApiUrl(page, show, filtervalue);
          transformFunction = transformPromotionData;
        }

        const makerequest = async () => {
          const response = await ApiRequest(
            apiUrl,
            undefined,
            "GET",
            undefined,
            undefined,
            ty,
          );

          if (response.success) {
            let modifieddata = response.data?.map(transformFunction);

            // Handle product-specific data
            if (ty === "product") {
              setlowstock(response.lowstock as number);

              // Merge discount data for promotion products
              if (promotion.selectproduct && type === "product") {
                const productMap = new Map(
                  promotion.Products.map((product) => [
                    product.id,
                    product.discount,
                  ]),
                );

                modifieddata = modifieddata.map((item: any) => {
                  if (productMap.has(item.id)) {
                    return { ...item, discount: productMap.get(item.id) };
                  }
                  return item;
                });
              }
            }

            // Handle promotion-specific data
            if (ty === "promotion") {
              setpromoexpire(response?.expirecount ?? 0);

              let tempromoproduct = [...(promotion.tempproductstate ?? [])];
              tempromoproduct = modifieddata.map((i: any) => i.products);
              setpromotion((prev) => ({
                ...prev,
                tempproductstate: tempromoproduct,
              }));
            }

            setalldata({ [ty as string]: modifieddata });
            setitemlength({
              total: response.total ?? 0,
              lowstock: response.lowstock ?? 0,
              totalpage: response.totalpage ?? 0,
            });
            setitemcount(response.totalpage ?? 0);
          }
        };

        await Delayloading(makerequest, setloaded, 500);
      } catch (error) {
        console.log("Inventory Fetch Error", error);
        errorToast("Error Occurred, Reload is Required");
      } finally {
        setreloaddata(false);
      }
    },
    [
      ty,
      page,
      show,
      filtervalue,
      promotion,
      type,
      promoids,
      setalldata,
      setitemlength,
      setpromotion,
    ],
  );

  const handleShowPerPage = useCallback(
    (value: number | string) => {
      const param = new URLSearchParams(searchParam);
      param.set("p", "1");
      param.set("limit", value.toString());
      setpage(1);
      router.push(`?${param}`);
      setreloaddata(true);
    },
    [searchParam, router],
  );

  const handleUpdateProductBannerPromotion = useCallback(
    async (promotionData: PromotionState, updateType: "product" | "banner") => {
      const data =
        updateType === "product"
          ? {
              id: promotionData.id,
              Products: promotionData.Products,
              tempproduct: promotionData?.tempproduct,
              type: updateType,
            }
          : {
              id: promotionData.id,
              banner_id: promotionData.banner_id,
              type: updateType,
            };

      const updatereq = await ApiRequest(
        "/api/promotion",
        setisLoading,
        "PUT",
        "JSON",
        data,
      );

      if (updatereq.success) {
        return true;
      }

      console.log("Update request failed:", updatereq.error);
      return false;
    },
    [setisLoading],
  );

  const handleDoneButton = useCallback(async () => {
    if (promotion.selectbanner || promotion.selectproduct) {
      if (promotion.selectproduct && promotion.tempproduct) {
        const success = await handleUpdateProductBannerPromotion(
          promotion,
          "product",
        );
        if (!success) {
          errorToast("Failed to update");
          return;
        }
      } else if (
        promotion.selectbanner &&
        promotion.banner_id &&
        globalindex.promotioneditindex !== -1
      ) {
        const success = await handleUpdateProductBannerPromotion(
          promotion,
          "banner",
        );
        if (!success) {
          errorToast("Error Occurred");
          return;
        }
      }
    }
    setopenmodal((prev) => ({ ...prev, createPromotion: true }));
  }, [
    promotion,
    globalindex,
    handleUpdateProductBannerPromotion,
    setopenmodal,
  ]);

  const handleFilter = useCallback(
    async (value: string) => {
      const params = new URLSearchParams(searchParam);

      // Reset filter params
      Object.keys(filtervalue).forEach((key) => {
        if (key !== "ty" && key !== "p" && key !== "limit") {
          params.delete(key);
        }
      });

      params.set("ty", value);
      params.set("p", "1");
      params.set("limit", "1");

      setpage(1);
      setshow("1");
      settype(value);
      router.push(`?${params}`, { scroll: false });
      setreloaddata(true);
    },
    [searchParam, filtervalue, router, handleCheckSession],
  );

  const handleLowStockFilter = useCallback(() => {
    const params = new URLSearchParams(searchParam);
    params.set("status", "Low");
    params.set("p", "1");
    setfiltervalue((prev) => ({ ...prev, status: "Low" }));
    router.push(`?${params}`, { scroll: false });
    setreloaddata(true);
  }, [searchParam, router]);

  const handleInlineSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParam);
      if (searchInput.trim()) {
        params.set("name", searchInput.trim());
      } else {
        params.delete("name");
      }
      params.set("p", "1");
      setfiltervalue((prev) => ({
        ...prev,
        name: searchInput.trim() || undefined,
      }));
      router.push(`?${params}`, { scroll: false });
      setreloaddata(true);
    },
    [searchInput, searchParam, router],
  );

  const handleRemoveFilter = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParam);
      params.delete(key);
      params.set("p", "1");
      setfiltervalue((prev) => {
        const next = { ...prev };
        delete (next as any)[key];
        return next;
      });
      if (key === "name") setSearchInput("");
      router.push(`?${params}`, { scroll: false });
      setreloaddata(true);
    },
    [searchParam, router],
  );

  const handleClearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParam);
    Object.keys(filtervalue).forEach((key) => params.delete(key));
    params.set("p", "1");
    setfiltervalue({});
    setSearchInput("");
    router.push(`?${params}`, { scroll: false });
    setreloaddata(true);
  }, [searchParam, filtervalue, router]);

  // Active chips: only keys that have a value and are relevant to current type
  const activeFilterChips = useMemo(() => {
    const relevantKeys: Record<string, string[]> = {
      product: ["name", "status", "parentcate", "childcate", "promoids"],
      banner: ["name", "bannersize", "bannertype"],
      promotion: ["name", "expired", "expiredate"],
    };
    const keys = relevantKeys[type as string] ?? Object.keys(FILTER_CHIP_LABELS);
    return keys
      .filter((key) => {
        const val = (filtervalue as any)[key];
        return val !== undefined && val !== "" && val !== null;
      })
      .map((key) => {
        const raw = (filtervalue as any)[key];
        let displayVal = String(raw);
        if (key === "parentcate") {
          displayVal = parentCateNameMap[String(raw)] ?? String(raw);
        } else if (key === "childcate") {
          displayVal = childCateNameMap[String(raw)] ?? String(raw);
        } else if (key === "expiredate") {
          displayVal = dayjs(raw).format("MMM D, YYYY");
        } else if (key === "expired" || key === "promoids") {
          displayVal = "";
        }
        const label = FILTER_CHIP_LABELS[key] ?? key;
        return { key, label, displayVal };
      });
  }, [filtervalue, type, parentCateNameMap, childCateNameMap]);

  // ── Multi-select helpers ──────────────────────────────────────────────────
  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectId = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const ids: number[] = (currentData as any[])
      .map((item) => item.id)
      .filter(Boolean);
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }, [currentData]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);

    const URL =
      type === "product"
        ? "/api/products/crud"
        : type === "banner"
          ? "/api/banner"
          : "/api/promotion";

    for (const id of ids) {
      const res = await ApiRequest(URL, setisLoading, "DELETE", "JSON", { id });
      if (!res.success) {
        errorToast(`Failed to delete item ${id}`);
      }
    }
    exitSelectMode();
    setreloaddata(true);
  }, [selectedIds, type, setisLoading, exitSelectMode]);

  const openBulkDeleteConfirm = useCallback(() => {
    setopenmodal((prev) => ({
      ...prev,
      confirmmodal: {
        open: true,
        confirm: false,
        closecon: "",
        Warn: `Delete ${selectedIds.size} selected item${selectedIds.size > 1 ? "s" : ""}?`,
        onAsyncDelete: handleBulkDelete,
      },
    }));
  }, [selectedIds, setopenmodal, handleBulkDelete]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentData]);

  const renderCardView = () => {
    if (type === "product") {
      return allData?.product?.map((obj, index) => (
        <div key={index} className="relative">
          {isSelectMode && (
            <>
              <div
                className="absolute inset-0 z-20 cursor-pointer rounded-xl"
                onClick={() => toggleSelectId(obj.id ?? 0)}
              />
              {/* Selection ring */}
              {selectedIds.has(obj.id ?? 0) && (
                <div className="absolute inset-0 z-10 rounded-xl ring-2 ring-indigo-500 bg-indigo-500/10 pointer-events-none" />
              )}
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-30 pointer-events-none">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.has(obj.id ?? 0)
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-gray-400"
                  }`}
                >
                  {selectedIds.has(obj.id ?? 0) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </>
          )}
          <Card
            index={index}
            img={obj.covers}
            name={obj.name}
            hover={true}
            price={parseFloat(obj.price.toString()).toFixed(2)}
            id={obj.id ?? 0}
            discount={obj.discount as Orderpricetype}
            stock={obj.stock}
            stocktype={obj.stocktype}
            isAdmin={true}
            lowstock={obj.Stock?.length ? obj.lowstock : undefined}
            reloaddata={() => setreloaddata(true)}
          />
        </div>
      ));
    }

    if (type === "banner") {
      return allData?.banner?.map((obj, idx) => (
        <div key={obj.name} className="relative">
          {isSelectMode && (
            <>
              <div
                className="absolute inset-0 z-20 cursor-pointer rounded-xl"
                onClick={() => toggleSelectId(obj.id ?? 0)}
              />
              {selectedIds.has(obj.id ?? 0) && (
                <div className="absolute inset-0 z-10 rounded-xl ring-2 ring-indigo-500 bg-indigo-500/10 pointer-events-none" />
              )}
              <div className="absolute top-2 left-2 z-30 pointer-events-none">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.has(obj.id ?? 0)
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-gray-400"
                  }`}
                >
                  {selectedIds.has(obj.id ?? 0) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </>
          )}
          <BannerCard
            data={{ name: obj.name, url: obj.image.url }}
            bannersize={obj.size as any}
            index={idx}
            id={obj.id ?? 0}
            type="banner"
            reloaddata={() => setreloaddata(true)}
          />
        </div>
      ));
    }

    if (type === "promotion") {
      return allData?.promotion?.map((obj, idx) => (
        <div
          key={idx}
          className="relative banner-card w-125 h-75
              max-smaller_screen:w-100
              max-smaller_screen:h-62.5
              max-smallest_screen1:w-75
              max-smallest_screen1:h-37.5
              max-smallest_phone:w-62.5"
        >
          {isSelectMode && (
            <>
              <div
                className="absolute inset-0 z-20 cursor-pointer rounded-xl"
                onClick={() => toggleSelectId(obj.id ?? 0)}
              />
              {selectedIds.has(obj.id ?? 0) && (
                <div className="absolute inset-0 z-10 rounded-xl ring-2 ring-indigo-500 bg-indigo-500/10 pointer-events-none" />
              )}
              <div className="absolute top-2 left-2 z-30 pointer-events-none">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.has(obj.id ?? 0)
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-gray-400"
                  }`}
                >
                  {selectedIds.has(obj.id ?? 0) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </>
          )}
          <BannerCard
            key={obj.name}
            data={{ name: obj.name, url: obj.banner?.image.url ?? "" }}
            index={idx}
            id={obj.id ?? 0}
            type="promotion"
            isExpired={obj.isExpired}
            reloaddata={() => setreloaddata(true)}
          />
        </div>
      ));
    }

    return null;
  };

  const renderListView = () => {
    if (type === "product") {
      return allData?.product?.map((obj, index) => (
        <ProductListItem
          key={index}
          product={obj}
          index={index}
          isSelectMode={isSelectMode}
          isSelected={selectedIds.has(obj.id ?? 0)}
          onToggleSelect={() => toggleSelectId(obj.id ?? 0)}
          reloaddata={() => setreloaddata(true)}
        />
      ));
    }

    if (type === "banner") {
      return allData?.banner?.map((obj, idx) => (
        <BannerListItem
          key={idx}
          banner={obj}
          index={idx}
          isSelectMode={isSelectMode}
          isSelected={selectedIds.has(obj.id ?? 0)}
          onToggleSelect={() => toggleSelectId(obj.id ?? 0)}
          reloaddata={() => setreloaddata(true)}
        />
      ));
    }

    if (type === "promotion") {
      return allData?.promotion?.map((obj, idx) => (
        <PromotionListItem
          key={idx}
          promotion={obj}
          index={idx}
          isSelectMode={isSelectMode}
          isSelected={selectedIds.has(obj.id ?? 0)}
          onToggleSelect={() => toggleSelectId(obj.id ?? 0)}
          reloaddata={() => setreloaddata(true)}
        />
      ));
    }

    return null;
  };

  return (
    <>
      <title>Inventory Management | SrokSre</title>
      {/* Day JS Provider  */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* Action modals */}
        {openmodal.createProduct && (
          <CreateProducts setreloaddata={setreloaddata} />
        )}
        {openmodal.createCategory && <Category />}
        {openmodal.createBanner && (
          <BannerModal setreloaddata={setreloaddata} />
        )}
        {openmodal.createPromotion && (
          <CreatePromotionModal
            searchparams={{
              ty: type,
              p,
              limit,
              status,
              name,
              parentcate,
              childcate,
              expiredate,
            }}
            settype={settype}
            setreloaddata={setreloaddata}
          />
        )}
        {/** Filter Modals */}
        {openmodal.filteroption && (
          <FilterMenu
            name={name}
            categories={{
              parentid: parentcate ? parseInt(parentcate as string) : undefined,
              childid: childcate ? parseInt(childcate as string) : undefined,
            }}
            expiredAt={expiredate ? dayjs(expiredate).toISOString() : undefined}
            type={ty}
            expired={expired}
            param={filtervalue}
            reloadData={() => setreloaddata(true)}
            setfilterdata={setfiltervalue as any}
            isSetPromotion={promotion.selectproduct}
          />
        )}

        {/**Discount edit modal */}
        {openmodal.discount && <DiscountModals />}

        <div className="inventory__container w-full h-full min-h-screen relative flex flex-col items-center pb-50 bg-linear-to-b from-gray-50 to-white">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inventory_header bg-white/95 backdrop-blur-xs sticky z-30 top-13.75 w-full h-full p-3 md:p-4 border-b-2 border-gray-200 shadow-md"
          >
            <InventoryHeader
              type={type}
              itemTotal={itemlength.total}
              lowstock={lowstock}
              promoexpire={promoexpire}
              hasActiveFilters={hasActiveFilters}
              isPromotionSelection={!!promotion.selectproduct}
              isBannerSelection={!!promotion.selectbanner}
              isManagingBanner={!!openmodal.managebanner}
              isMultipleProducts={promotion.Products.length > 1}
              isLoadingUpdate={isLoading.PUT}
              viewMode={viewMode}
              onFilterChange={handleFilter}
              onFilterClick={() =>
                setopenmodal((prev) => ({ ...prev, filteroption: true }))
              }
              onLowStockClick={handleLowStockFilter}
              onDiscountClick={() =>
                setopenmodal((prev) => ({ ...prev, discount: true }))
              }
              onAddBannerClick={() =>
                setopenmodal((prev) => ({ ...prev, createBanner: true }))
              }
              onDoneClick={handleDoneButton}
              onViewModeChange={setViewMode}
            />
          </motion.div>

          {/* Search + Filter chips */}
          <div className="w-[95%] max-smallest_phone:w-full mt-6 flex flex-col gap-3">
            {/* Inline search bar */}
            <form onSubmit={handleInlineSearch} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-400 transition-colors">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Search ${type ?? "items"}...`}
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(""); handleRemoveFilter("name"); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="shrink-0 px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
              >
                Search
              </button>
            </form>

            {/* Active filter chips */}
            {activeFilterChips.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {activeFilterChips.map(({ key, label, displayVal }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full"
                  >
                    <span>{label}{displayVal ? `: ${displayVal}` : ""}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFilter(key)}
                      className="text-indigo-400 hover:text-indigo-700 transition-colors leading-none"
                      aria-label={`Remove ${label} filter`}
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-full hover:bg-red-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faFilterCircleXmark} className="text-[10px]" />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`productlist w-[95%] max-smallest_phone:w-full h-fit mt-4 ${
              viewMode === "card"
                ? `grid grid-cols-3 max-small_screen:grid-cols-2 gap-x-5 gap-y-5 max-small_phone:gap-x-2 max-smallest_tablet:grid-cols-1 ${
                    type === "product"
                      ? "max-smallest_tablet:grid-cols-2 max-large_phone:grid-cols-1"
                      : ""
                  } place-items-center place-content-center`
                : "flex flex-col gap-4"
            }`}
          >
            {loaded ? (
              <LoadingState type={ty} />
            ) : (
              <>
                {/* Select mode toolbar */}
                {!loaded && currentData.length > 0 && (
                  <div
                    className={`col-span-full w-full flex items-center gap-3 flex-wrap px-1 pb-2 ${
                      viewMode === "list" ? "" : ""
                    }`}
                  >
                    {isSelectMode ? (
                      <>
                        <button
                          onClick={toggleSelectAll}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                          {selectedIds.size === currentData.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                        <span className="text-sm text-gray-500">
                          {selectedIds.size} selected
                        </span>
                        <button
                          disabled={selectedIds.size === 0 || isLoading.DELETE}
                          onClick={openBulkDeleteConfirm}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                        >
                          {isLoading.DELETE
                            ? "Deleting…"
                            : `Delete (${selectedIds.size})`}
                        </button>
                        <button
                          onClick={exitSelectMode}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsSelectMode(true)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        Select
                      </button>
                    )}
                  </div>
                )}

                {viewMode === "card" ? renderCardView() : renderListView()}
                {currentData.length === 0 && <EmptyState type={type} />}
              </>
            )}
          </motion.div>
        </div>

        <div className="w-full h-fit">
          <PaginationCustom
            page={page}
            setpage={setpage}
            count={itemscount}
            show={show}
            onSelectShowPerPage={handleShowPerPage}
            onPageChange={() => setreloaddata(true)}
            setshow={setshow}
          />
        </div>
      </LocalizationProvider>
    </>
  );
}
