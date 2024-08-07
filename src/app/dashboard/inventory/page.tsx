"use client";
import PrimaryButton, { Selection } from "../../component/Button";
import Card, { BannerCard } from "../../component/Card";
import {
  AllDataInitialize,
  PromotionState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { SubInventoryMenu } from "../../component/Navbar";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
} from "@/src/context/CustomHook";
import { ContainerLoading, errorToast } from "../../component/Loading";
import { FilterMenu } from "../../component/SideMenu";
import dayjs from "dayjs";

import { AnimatePresence } from "framer-motion";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { InventoryParamType } from "./varaint_action";
import { IsNumber } from "../../product/page";
import { CreateProducts } from "../../component/Modals/Product";
import { Category } from "../../component/Modals/Category";
import { BannerModal } from "../../component/Modals/Banner";
import {
  CreatePromotionModal,
  DiscountModals,
} from "../../component/Modals/Promotion";
import PaginationCustom from "../../component/Pagination_Component";

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
  } = searchParams as InventoryParamType;
  const btnref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParam = useSearchParams();
  const [loaded, setloaded] = useState(false);
  const [show, setshow] = useState(limit ?? "1");
  const [page, setpage] = useState(p ? parseInt(p) : 1);
  const [itemscount, setitemcount] = useState(0);
  const [lowstock, setlowstock] = useState(0);

  const [isFilter, setisFilter] = useState(false);

  useEffectOnce(() => {
    const checkfilter =
      type === "product"
        ? !!status ||
          !!name ||
          !!childcate ||
          !!parentcate ||
          !!promotion.selectproduct
        : type === "banner"
        ? !!name || !!bannersize || !!bannertype
        : !!name || !!expiredate;

    setisFilter(checkfilter);
  });

  useEffect(() => {
    if (!type || !p || !limit) {
      return redirect(
        `/dashboard/inventory${defaultparams(type ?? "product")}`
      );
    }

    const isValid =
      !IsNumber(p) ||
      !IsNumber(limit) ||
      (parentcate && !IsNumber(parentcate)) ||
      (childcate && !IsNumber(childcate));

    if (isValid) {
      return redirect(`/dashboard/inventory?ty=${type}&p=1&limit=1`);
    }

    fetchdata(promotion.id);
  }, [
    page,
    limit,
    status,
    name,
    bannersize,
    bannertype,
    parentcate,
    childcate,
    expiredate,
    promotion.id,
    type,
  ]);

  const fetchdata = async (pid?: number) => {
    try {
      setalldata(AllDataInitialize);
      let apiUrl: string = "";
      let transformFunction: (item: any) => any = () => {};

      if (type === "product") {
        apiUrl =
          status || name || childcate || parentcate || promotion.selectproduct
            ? `/api/products/ty=filter_p=${page}_limit=${show}${
                status ? `_sk=${status}` : ""
              }${name ? `_q=${name}` : ""}${
                parentcate ? `_pc=${parentcate}` : ""
              }${childcate ? `_cc=${childcate}` : ""}${
                pid ? `_pid=${pid}` : ""
              }${promotion.selectproduct ? "_sp=1" : ""}`
            : `/api/products/ty=all_limit=${show}_p=${page}`;
        transformFunction = (item: any) => ({
          ...item,
          category: {
            parent_id: item.parentcategory_id,
            child_id: item.childcategory_id,
          },
          parentcategory_id: undefined,
          childcategory_id: undefined,
        });
      } else if (type === "banner") {
        apiUrl =
          name || bannersize || bannertype
            ? `/api/banner?ty=filter&limit=${show}&p=${page}${
                bannertype ? `&bty=${bannertype}` : ""
              }${bannersize ? `&bs=${bannersize}` : ""}${
                name ? `&q=${name}` : ""
              }`
            : promotion.selectbanner
            ? `/api/banner?ty=filter&limit=${show}&p=${page}&bty=normal`
            : `/api/banner?ty=all&limit=${show}&p=${page}`;

        transformFunction = (item: any) => ({
          ...item,
          createdAt: undefined,
          updatedAt: undefined,
        });
      } else {
        apiUrl =
          name || expiredate
            ? `/api/promotion?ty=filter&lt=${show}&p=${page ?? "1"}${
                name ? `&q=${name}` : ""
              }${expiredate ? `&exp=${dayjs(expiredate).toISOString()}` : ""}`
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
          type
        );

        if (allfetchdata.success) {
          let modifieddata = allfetchdata.data?.map(transformFunction);

          if (type === "product") {
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

          setalldata({ [type as string]: modifieddata });

          if (type === "promotion") {
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
      console.log("Fetch data");

      ///Make Request
    } catch (error) {
      console.log("Inventory Fetch Error", error);
      errorToast("Error Occrued, Relaod is Required");
    }
  };

  const handleShowPerPage = (value: number | string) => {
    const param = new URLSearchParams(searchParam);

    param.set("p", "1");
    param.set("limit", value.toString());
    setpage(1);
    router.push(`?${param}`);
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
      if (promotion.selectproduct) {
        const updateproduct = await handleUpdateProductBannerPromotion(
          promotion,
          "product"
        );
        if (!updateproduct) {
          errorToast("Failed to update");
        }
      } else if (promotion.selectbanner) {
        const updatebanner = await handleUpdateProductBannerPromotion(
          promotion,
          "banner"
        );
        if (!updatebanner) {
          errorToast("Error Occured");
          return;
        }
      }

      setopenmodal((prev) => ({
        ...prev,
        createPromotion: true,
      }));
    }
  };

  const handleFilter = (e: ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParam);
    const value = e.target.value.toLowerCase();

    params.set("ty", value);
    params.set("p", "1");
    params.set("limit", "1");

    params.delete("status");
    params.delete("expiredate");
    params.delete("name");
    params.delete("parentcate");
    params.delete("childcate");

    setpage(1);
    setshow("1");

    router.push(`?${params}`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="inventory__container w-full h-full min-h-screen relative flex flex-col items-center pb-[200px]">
        <div className="inventory_header bg-white sticky z-30 top-[6vh] w-full h-full p-2 border-b border-black">
          <div className="w-full flex flex-row items-center overflow-x-auto gap-x-5 scrollbar-hide">
            {!promotion.selectproduct &&
            !promotion.selectbanner &&
            !openmodal.managebanner ? (
              <>
                <Selection
                  default="Filter Items"
                  style={{ width: "150px", minWidth: "150px" }}
                  data={Filteroptions}
                  value={type}
                  onChange={handleFilter}
                />
                <div
                  ref={btnref}
                  className="createbtn_container flex flex-col justify-center items-start"
                >
                  <PrimaryButton
                    color="#6FCF97"
                    radius="10px"
                    type="button"
                    style={{ minWidth: "150px" }}
                    width="150px"
                    text="Action"
                    onClick={() =>
                      setopenmodal({
                        ...openmodal,
                        subcreatemenu_ivt: !openmodal.subcreatemenu_ivt,
                      })
                    }
                    Icon={
                      <i className="fa-solid fa-plus text-sm text-black"></i>
                    }
                  />
                  {openmodal.subcreatemenu_ivt && (
                    <SubInventoryMenu
                      data={createmenu as any}
                      open="subcreatemenu_ivt"
                      style={{ top: "100%" }}
                    />
                  )}
                </div>
                <PrimaryButton
                  color="#60513C"
                  width="150px"
                  style={{ minWidth: "150px" }}
                  radius="10px"
                  type="button"
                  text={"Total: " + itemlength.total}
                />
                {type === "product" ? (
                  <PrimaryButton
                    color="#F08080"
                    style={{ minWidth: "150px" }}
                    radius="10px"
                    width="150px"
                    type="button"
                    text={`Low Stock: ${lowstock} `}
                  />
                ) : (
                  type === "promotion" && (
                    <PrimaryButton
                      text={`Expire: `}
                      style={{ minWidth: "150px" }}
                      type="button"
                      radius="10px"
                    />
                  )
                )}
              </>
            ) : (
              <>
                {promotion.selectproduct && promotion.Products.length !== 1 && (
                  <>
                    <PrimaryButton
                      color="#6FCF97"
                      radius="10px"
                      type="button"
                      style={{ minWidth: "150px" }}
                      text="Set Discount"
                      onClick={() => {
                        setopenmodal((prev) => ({ ...prev, discount: true }));
                      }}
                    />
                  </>
                )}
              </>
            )}
            {promotion.selectbanner && (
              <PrimaryButton
                type="button"
                text="Add New"
                radius="10px"
                onClick={() =>
                  setopenmodal((prev) => ({ ...prev, createBanner: true }))
                }
                color="#6FCF97"
              />
            )}
            {(promotion.selectproduct || promotion.selectbanner) && (
              <>
                <PrimaryButton
                  text="Done"
                  type="button"
                  status={isLoading.PUT ? "loading" : "authenticated"}
                  radius="10px"
                  onClick={() => handleDoneButton()}
                />
              </>
            )}

            <PrimaryButton
              color="#4688A0"
              radius="10px"
              style={{ minWidth: "150px" }}
              type="button"
              text={isFilter ? "Clear Filter" : "Filter"}
              onClick={() =>
                setopenmodal((prev) => ({ ...prev, filteroption: true }))
              }
            />
          </div>
        </div>
        <div className="productlist w-full h-fit mt-10 grid grid-cols-3 max-small_screen:grid-cols-2 max-small_tablet:grid-cols-1 gap-x-5 gap-y-32 place-items-center">
          {loaded ? (
            <ContainerLoading />
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
                    discount={obj.discount}
                    stock={obj.stock}
                    stocktype={obj.stocktype}
                    isAdmin={true}
                    lowstock={obj.lowstock}
                  />
                ))}
              {type === "banner" &&
                allData?.banner?.map((obj, idx) => (
                  <div
                    key={idx}
                    style={
                      obj.size === "small"
                        ? { width: "400px", height: "500px" }
                        : { width: "550px", height: "350px" }
                    }
                    className="banner-card w-[500px] h-[350px]"
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
                    />
                  </div>
                ))}
              {type === "promotion" &&
                allData?.promotion?.map((obj, idx) => (
                  <div key={idx} className="banner-card w-[500px] h-[300px]">
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
                    />
                  </div>
                ))}

              <h3
                hidden={allData[type as any]?.length !== 0}
                className="w-fit ml-10 h-fit font-normal text-xl text-red-400 p-3 border-2 border-red-300 rounded-lg"
              >
                {type === "banner" ? (
                  <>
                    {allData.banner?.length === 0 && (
                      <>
                        No Banner (Create Banner by Click on Action and Banner)
                      </>
                    )}
                  </>
                ) : type === "promotion" ? (
                  <>
                    {allData?.promotion?.length === 0 && (
                      <>
                        No Promotion (Create Promotion by Click on Action and
                        Promotion)
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {allData.product?.length === 0 && (
                      <>
                        No Product (Create Product by Click on Action and
                        Product)
                      </>
                    )}
                  </>
                )}
              </h3>
            </>
          )}
        </div>

        <AnimatePresence>
          {openmodal.createProduct && <CreateProducts />}
          {openmodal.createCategory && <Category />}
          {openmodal.createBanner && <BannerModal />}
          {openmodal.createPromotion && (
            <CreatePromotionModal searchparams={searchParams as any} />
          )}
          {openmodal.filteroption && (
            <FilterMenu
              name={name}
              categories={{
                parentid: parseInt(parentcate as string),
                childid: parseInt(childcate as string),
              }}
              expiredAt={
                expiredate ? dayjs(expiredate).toISOString() : undefined
              }
              type={type}
              param={searchParams}
              setisFilter={setisFilter}
            />
          )}
          {openmodal.discount && <DiscountModals />}
        </AnimatePresence>
      </div>
      <div className="w-full h-fit">
        <PaginationCustom
          page={page}
          setpage={setpage}
          count={itemscount}
          show={show}
          onSelectShowPerPage={handleShowPerPage}
          setshow={setshow}
        />
      </div>
    </LocalizationProvider>
  );
}
