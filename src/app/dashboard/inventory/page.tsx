"use client";
import Card, { BannerCard } from "../../component/Card";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SubInventoryMenu } from "../../component/Navbar";
import { useEffect, useState } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { motion } from "framer-motion";
import { errorToast } from "../../component/Loading";
import { FilterMenu } from "../../component/SideMenu";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { InventoryParamType } from "./varaint_action";
import { CreateProducts } from "../../component/Modals/Product";
import { Category } from "../../component/Modals/Category";
import { BannerModal } from "../../component/Modals/Banner";
import {
  CreatePromotionModal,
  DiscountModals,
} from "../../component/Modals/Promotion";
import PaginationCustom, {
  SelectionCustom,
} from "../../component/Pagination_Component";
import { IsNumber } from "@/src/lib/utilities";
import React from "react";
import { Orderpricetype } from "@/src/types/order.type";
import { PromotionState } from "@/src/types/productAction.type";

const createmenu = [
  {
    value: "Product",
    opencon: "createProduct",
  },
  {
    value: "Category",
    opencon: "createCategory",
  },
  {
    value: "Banner",
    opencon: "createBanner",
  },
  {
    value: "Promotion",
    opencon: "createPromotion",
  },
];
const Filteroptions = [
  {
    value: "product",
    label: "Product",
  },
  {
    value: "banner",
    label: "Banner",
  },
  {
    value: "promotion",
    label: "Promotion",
  },
];

const defaultparams = (type: string) => `?ty=${type}&p=1&limit=1`;
export default function Inventory({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
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
  } = searchParams as InventoryParamType;
  const router = useRouter();
  const searchParam = useSearchParams();
  const [loaded, setloaded] = useState(false);
  const [show, setshow] = useState(limit ?? "1");
  const [page, setpage] = useState(p ? parseInt(p) : 1);
  const [itemscount, setitemcount] = useState(0);
  const [lowstock, setlowstock] = useState(0);
  const [reloaddata, setreloaddata] = useState(true);
  const [ty, settype] = useState(type);
  const [promoexpire, setpromoexpire] = useState(0);
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

  useEffect(() => {
    if (!type) {
      return redirect(
        `/dashboard/inventory${defaultparams(type ?? "product")}`
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
  }, [reloaddata]);

  const fetchdata = async (pid?: number) => {
    try {
      let apiUrl: string = "";
      let transformFunction: (item: any) => any = () => {};
      const {
        status,
        name,
        childcate,
        parentcate,
        bannersize,
        bannertype,
        expired,
        expiredate,
        promoids,
      } = filtervalue;

      if (ty === "product") {
        apiUrl =
          status ||
          name ||
          childcate ||
          parentcate ||
          promotion.selectproduct ||
          promoids
            ? `/api/products?ty=filter&p=${page}&limit=${show}${
                status ? `&sk=${status}` : ""
              }${name ? `&q=${name}` : ""}${
                parentcate ? `&pc=${parentcate}` : ""
              }${childcate ? `&cc=${childcate}` : ""}${
                pid ? `&pid=${pid}` : ""
              }${promotion.selectproduct ? "&sp=1" : ""}${
                promoids ? `&pids=${promoids}` : ""
              }`
            : `/api/products?ty=all&limit=${show}&p=${page}`;
        transformFunction = (item: any) => ({
          ...item,
          category: {
            parent_id: item.parentcategory_id,
            child_id: item.childcategory_id,
          },
          parentcategory_id: undefined,
          childcategory_id: undefined,
        });
      } else if (ty === "banner") {
        apiUrl =
          name || bannersize || bannertype
            ? `/api/banner?ty=filter&limit=${show}&p=${page}${
                bannertype ? `&bty=${bannertype}` : ""
              }${bannersize ? `&bs=${bannersize}` : ""}${
                name ? `&q=${name}` : ""
              }`
            : promotion.selectbanner
            ? `/api/banner?ty=filter&limit=${show}&p=${page}&bty=normal&promoselect=1`
            : `/api/banner?ty=all&limit=${show}&p=${page}`;

        transformFunction = (item: any) => ({
          ...item,
          createdAt: undefined,
          updatedAt: undefined,
        });
      } else if (ty === "promotion") {
        apiUrl =
          name || expiredate || expired
            ? `/api/promotion?ty=filter&lt=${show}&p=${page ?? "1"}${
                name ? `&q=${name}` : ""
              }${expiredate ? `&exp=${dayjs(expiredate).toISOString()}` : ""}${
                expired ? `&expired=${expired}` : ""
              }`
            : `/api/promotion?ty=all&lt=${show}&p=${page ?? "1"}`;
        transformFunction = (item: any) => ({
          ...item,
          products: item.Products,
          expiredAt: dayjs(item.expireAt),
          tempproduct: [],

          createdAt: undefined,
          updatedAt: undefined,
          Products: undefined,
        });
      }

      const makerequest = async () => {
        const allfetchdata = await ApiRequest(
          apiUrl,
          undefined,
          "GET",
          undefined,
          undefined,
          ty
        );

        if (allfetchdata.success) {
          let modifieddata = allfetchdata.data?.map(transformFunction);

          if (ty === "product") {
            setlowstock(allfetchdata.lowstock as number);
          }

          if (promotion.selectproduct && type === "product") {
            const productMap = new Map(
              promotion.Products.map((product) => [
                product.id,
                product.discount,
              ])
            );

            modifieddata = modifieddata.map((item: any) => {
              if (productMap.has(item.id)) {
                return {
                  ...item,
                  discount: productMap.get(item.id),
                };
              }
              return item;
            });
          }

          setalldata({ [ty as string]: modifieddata });
          setpromoexpire(allfetchdata?.expirecount ?? 0);

          if (ty === "promotion") {
            let tempromoproduct = [...(promotion.tempproductstate ?? [])];
            tempromoproduct = modifieddata.map((i: any) => i.products);
            setpromotion((prev) => ({
              ...prev,
              tempproductstate: tempromoproduct,
            }));
          }

          setitemlength({
            total: allfetchdata.total ?? 0,
            lowstock: allfetchdata.lowstock ?? 0,
            totalpage: allfetchdata.totalpage ?? 0,
          });

          setitemcount(allfetchdata.totalpage ?? 0);
        }
      };

      await Delayloading(makerequest, setloaded, 500);

      ///Make Request
    } catch (error) {
      console.log("Inventory Fetch Error", error);
      errorToast("Error Occrued, Relaod is Required");
    } finally {
      setreloaddata(false);
    }
  };

  const handleShowPerPage = (value: number | string) => {
    const param = new URLSearchParams(searchParam);

    param.set("p", "1");
    param.set("limit", value.toString());
    setpage(1);
    router.push(`?${param}`);
    setreloaddata(true);
  };

  const handleUpdateProductBannerPromotion = async (
    promotion: PromotionState,
    type: "product" | "banner"
  ) => {
    const data =
      type === "product"
        ? {
            id: promotion.id,
            Products: promotion.Products,
            tempproduct: promotion?.tempproduct,
            type: type,
          }
        : { id: promotion.id, banner_id: promotion.banner_id, type: type };

    const updatereq = await ApiRequest(
      "/api/promotion",
      setisLoading,
      "PUT",
      "JSON",
      data
    );

    if (updatereq.success) {
      return true;
    } else {
      console.error("Update request failed:", updatereq.error);
      return null;
    }
  };

  const handleDoneButton = async () => {
    if (promotion.selectbanner || promotion.selectproduct) {
      if (promotion.selectproduct && promotion.tempproduct) {
        const updateproduct = await handleUpdateProductBannerPromotion(
          promotion,
          "product"
        );
        if (!updateproduct) {
          errorToast("Failed to update");
        }
      } else if (
        promotion.selectbanner &&
        promotion.banner_id &&
        globalindex.promotioneditindex !== -1
      ) {
        const updatebanner = await handleUpdateProductBannerPromotion(
          promotion,
          "banner"
        );
        if (!updatebanner) {
          errorToast("Error Occured");
          return;
        }
      }
    }
    setopenmodal((prev) => ({
      ...prev,
      createPromotion: true,
    }));
  };

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParam);

    //Reset Search Params
    Object.keys(filtervalue).map((key) => {
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
            param={searchParams}
            expired={expired}
            reloadData={() => setreloaddata(true)}
            setfilterdata={setfiltervalue as any}
            isSetPromotion={promotion.selectproduct}
          />
        )}

        {/**Discount edit modal */}
        {openmodal.discount && <DiscountModals setreloaddata={setreloaddata} />}

        <div className="inventory__container w-full h-full min-h-screen relative flex flex-col items-center pb-[200px] bg-gradient-to-b from-gray-50 to-white">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inventory_header bg-white/95 backdrop-blur-sm sticky z-30 top-[55px] w-full h-full p-3 md:p-4 border-b-2 border-gray-200 shadow-md"
          >
            <div className="w-full flex flex-row items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              {!promotion.selectproduct &&
              !promotion.selectbanner &&
              !openmodal.managebanner ? (
                <>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg md:rounded-xl border-2 border-indigo-200">
                      <i className="fa-solid fa-layer-group text-indigo-500 text-sm md:text-base"></i>
                      <SelectionCustom
                        label="Filter"
                        data={Filteroptions}
                        placeholder="Item"
                        value={type}
                        onChange={(val) =>
                          handleFilter(val.toString().toLowerCase())
                        }
                        style={{ width: "140px" }}
                      />
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <SubInventoryMenu
                      data={createmenu as any}
                      open="subcreatemenu_ivt"
                    />
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all">
                    <i className="fa-solid fa-box text-sm md:text-lg"></i>
                    <span className="font-bold text-xs md:text-sm whitespace-nowrap">
                      Total: {itemlength.total}
                    </span>
                  </div>
                  {type === "product" ? (
                    <div className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all">
                      <i className="fa-solid fa-triangle-exclamation text-sm md:text-lg"></i>
                      <span className="font-bold text-xs md:text-sm whitespace-nowrap">
                        Low: {lowstock}
                      </span>
                    </div>
                  ) : (
                    type === "promotion" && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all">
                        <i className="fa-solid fa-clock text-sm md:text-lg"></i>
                        <span className="font-bold text-xs md:text-sm whitespace-nowrap">
                          Expired: {promoexpire}
                        </span>
                      </div>
                    )
                  )}
                </>
              ) : (
                <>
                  {promotion.selectproduct &&
                    promotion.Products.length !== 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setopenmodal((prev) => ({
                            ...prev,
                            discount: true,
                          }));
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 font-bold text-xs md:text-sm"
                      >
                        <i className="fa-solid fa-percent text-sm md:text-base"></i>
                        <span className="whitespace-nowrap">Discount</span>
                      </button>
                    )}
                </>
              )}
              {promotion.selectbanner && (
                <button
                  type="button"
                  onClick={() =>
                    setopenmodal((prev) => ({ ...prev, createBanner: true }))
                  }
                  className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 font-bold text-xs md:text-sm"
                >
                  <i className="fa-solid fa-plus text-sm md:text-base"></i>
                  <span className="whitespace-nowrap">Add New</span>
                </button>
              )}
              {(promotion.selectproduct || promotion.selectbanner) && (
                <button
                  type="button"
                  onClick={() => handleDoneButton()}
                  disabled={isLoading.PUT}
                  className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl shadow-md font-bold text-xs md:text-sm transition-all ${
                    isLoading.PUT
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-lg hover:scale-105"
                  }`}
                >
                  {isLoading.PUT ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin text-sm md:text-base"></i>
                      <span className="whitespace-nowrap">Processing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check text-sm md:text-base"></i>
                      <span className="whitespace-nowrap">Done</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setopenmodal((prev) => ({ ...prev, filteroption: true }))
                }
                className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 font-bold text-xs md:text-sm"
              >
                <i className="fa-solid fa-filter text-sm md:text-base"></i>
                <span className="whitespace-nowrap">
                  {Object.values(filtervalue).some((i) => i !== undefined)
                    ? "Clear"
                    : "Filter"}
                </span>
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`productlist w-[95%] max-smallest_phone:w-full h-fit mt-10 grid grid-cols-3 
        max-small_screen:grid-cols-2 gap-x-5 gap-y-32
        max-small_phone:gap-x-0 max-smallest_tablet:grid-cols-1 
        ${type === "product" ? "max-smallest_tablet:grid-cols-2 " : ""}
        place-items-center place-content-center`}
          >
            {loaded ? (
              <div className="col-span-full w-full h-fit flex flex-col gap-6 items-center py-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                  <i className="fa-solid fa-spinner fa-spin text-2xl text-white"></i>
                </div>
                <p className="text-lg font-semibold text-gray-600">
                  Loading {ty}...
                </p>
                <div className="w-full grid grid-cols-3 max-small_screen:grid-cols-2 max-smallest_tablet:grid-cols-1 gap-6 px-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-4 shadow-lg animate-pulse"
                    >
                      <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {type === "product" &&
                  allData?.product?.map((obj, index) => (
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
                  ))}
                {type === "banner" &&
                  allData?.banner?.map((obj, idx) => (
                    <div
                      key={idx}
                      className={`banner-card
                      ${
                        obj.size !== "small"
                          ? `w-[500px] h-[350px] max-smaller_screen:w-[400px] 
                          max-smaller_screen:h-[250px]
                          max-smallest_screen1:w-[300px] 
                          max-smallest_screen1:h-[150px]
                          max-smallest_tablet:w-[250px]
                          max-smallest_tablet:h-[150px]
                          `
                          : "w-[400px] h-[500px] max-smallest_screen1:w-[150px] max-smallest_screen1:h-[250px]"
                      }
                      
                      `}
                    >
                      <BannerCard
                        key={obj.name}
                        data={{
                          name: obj.name,
                          url: obj.image.url,
                        }}
                        bannersize={obj.size as any}
                        index={idx}
                        id={obj.id ?? 0}
                        type="banner"
                        reloaddata={() => setreloaddata(true)}
                      />
                    </div>
                  ))}
                {type === "promotion" &&
                  allData?.promotion?.map((obj, idx) => (
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
                        data={{
                          name: obj.name,
                          url: obj.banner?.image.url ?? "",
                        }}
                        index={idx}
                        id={obj.id ?? 0}
                        type="promotion"
                        isExpired={obj.isExpired}
                        reloaddata={() => setreloaddata(true)}
                      />
                    </div>
                  ))}
                {allData &&
                  allData[type as string] &&
                  allData[type as string].length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="col-span-full flex flex-col items-center justify-center py-16 px-4"
                    >
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-6">
                        <i className="fa-solid fa-inbox text-4xl text-gray-400"></i>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-2">
                        No{" "}
                        {type === "banner"
                          ? "Banners"
                          : type === "promotion"
                          ? "Promotions"
                          : "Products"}{" "}
                        Found
                      </h3>
                      <p className="text-gray-500 text-center max-w-md">
                        {type === "banner"
                          ? "Create your first banner by clicking on Action → Banner"
                          : type === "promotion"
                          ? "Create your first promotion by clicking on Action → Promotion"
                          : "Create your first product by clicking on Action → Product"}
                      </p>
                    </motion.div>
                  )}
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
