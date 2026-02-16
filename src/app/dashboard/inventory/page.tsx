"use client";
import React, { useEffect, useState, useCallback, useMemo, use } from "react";
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
import { useGlobalContext } from "@/src/context/GlobalContext";
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
import { useSession } from "next-auth/react";
import useCheckSession from "@/src/hooks/useCheckSession";

// Constants
const DEFAULT_PARAMS = (type: string) => `?ty=${type}&p=1&limit=1`;

interface InventoryProps {
  searchParams: React.Usable<{ [x: string]: string | undefined }>;
}

export default function Inventory({ searchParams }: InventoryProps) {
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

  // URL parameters
  const {
    ty: type,
    p,
    limit,
    status,
    name,
    parentcate,
    childcate,
    expiredate,
    bannersize,
    bannertype,
    expired,
    promoids,
  } = use(searchParams) as InventoryParamType;

  // Router hooks
  const router = useRouter();
  const searchParam = useSearchParams();
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

  // Memoized values
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

  // Validation effect
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

  // Fetch data function
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
        console.error("Inventory Fetch Error", error);
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

  // Handler functions
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

      console.error("Update request failed:", updatereq.error);
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

  // Render card view items
  const renderCardView = () => {
    if (type === "product") {
      return allData?.product?.map((obj, index) => (
        <Card
          key={index}
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
          lowstock={obj.lowstock}
          reloaddata={() => setreloaddata(true)}
        />
      ));
    }

    if (type === "banner") {
      return allData?.banner?.map((obj, idx) => (
        <BannerCard
          key={obj.name}
          data={{ name: obj.name, url: obj.image.url }}
          bannersize={obj.size as any}
          index={idx}
          id={obj.id ?? 0}
          type="banner"
          reloaddata={() => setreloaddata(true)}
        />
      ));
    }

    if (type === "promotion") {
      return allData?.promotion?.map((obj, idx) => (
        <div
          key={idx}
          className="banner-card w-[500px] h-[300px]
              max-smaller_screen:w-[400px] 
              max-smaller_screen:h-[250px]
              max-smallest_screen1:w-[300px] 
              max-smallest_screen1:h-[150px]
              max-smallest_phone:w-[250px]"
        >
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

  // Render list view items
  const renderListView = () => {
    if (type === "product") {
      return allData?.product?.map((obj, index) => (
        <ProductListItem
          key={index}
          product={obj}
          index={index}
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
            searchparams={searchParams as any}
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
            reloadData={() => setreloaddata(true)}
            setfilterdata={setfiltervalue as any}
            isSetPromotion={promotion.selectproduct}
          />
        )}

        {/**Discount edit modal */}
        {openmodal.discount && <DiscountModals setreloaddata={setreloaddata} />}

        <div className="inventory__container w-full h-full min-h-screen relative flex flex-col items-center pb-[200px] bg-gradient-to-b from-gray-50 to-white">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inventory_header bg-white/95 backdrop-blur-sm sticky z-30 top-[55px] w-full h-full p-3 md:p-4 border-b-2 border-gray-200 shadow-md"
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

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`productlist w-[95%] max-smallest_phone:w-full h-fit mt-10 ${
              viewMode === "card"
                ? `grid grid-cols-3 max-small_screen:grid-cols-2 gap-x-5 gap-y-32 max-small_phone:gap-x-0 max-smallest_tablet:grid-cols-1 ${
                    type === "product" ? "max-smallest_tablet:grid-cols-2 " : ""
                  } place-items-center place-content-center`
                : "flex flex-col gap-4"
            }`}
          >
            {loaded ? (
              <LoadingState type={ty} />
            ) : (
              <>
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
