"use client";
import PrimaryButton from "../../component/Button";
import { SubInventoryMenu } from "../../component/Navbar";
import { useEffect, useState } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
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
import { SelectionCustom } from "../../component/Pagination_Component";
import { IsNumber } from "@/src/lib/utilities";
import React from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  InventoryPage,
  PromotionState,
  SelectType,
} from "@/src/context/GlobalType.type";
import TableComponent from "../../component/Table/Table_Component";
import ImagePreview from "../../component/Modals/ImagePreview";
import { Variantcontainer } from "../../component/Modals/VariantModal";

const createmenu: Array<SelectType> = [
  {
    label: "Product",
    value: "createProduct",
  },
  {
    label: "Category",
    value: "createCategory",
  },
  {
    label: "Banner",
    value: "createBanner",
  },
  {
    label: "Promotion",
    value: "createPromotion",
  },
];
const Filteroptions: Array<SelectType> = [
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
  const [loaded, setloaded] = useState(false);
  const router = useRouter();
  const searchParam = useSearchParams();
  const [show, setshow] = useState(limit ?? "1");
  const [page, setpage] = useState(p ?? "1");
  const [itemscount, setitemcount] = useState(0);
  const [lowstock, setlowstock] = useState(0);
  const [reloaddata, setreloaddata] = useState(true);
  const [ty, settype] = useState<InventoryPage | undefined>(type);
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
      } else if (ty === "promotion") {
        apiUrl =
          name || expiredate || expired
            ? `/api/promotion?ty=filter&lt=${show}&p=${page ?? "1"}${
                name ? `&q=${name}` : ""
              }${expiredate ? `&exp=${dayjs(expiredate).toISOString()}` : ""}${
                expired ? `&expired=${expired}` : ""
              }`
            : `/api/promotion?ty=all&lt=${show}&p=${page ?? "1"}`;
      }

      const makerequest = async () => {
        const allfetchdata = await ApiRequest({
          url: apiUrl,
          method: "GET",
        });

        if (allfetchdata.success) {
          let modifieddata = allfetchdata.data;

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
    setpage("1");
    setshow(value as string);
    router.push(`?${param}`);
    setreloaddata(true);
  };

  const handlePage = (value: string) => {
    const param = new URLSearchParams(searchParam);
    param.set("p", value);
    setpage(value);
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

    const updatereq = await ApiRequest({
      url: "/api/promotion",
      setloading: setisLoading,
      method: "PUT",
      data,
    });

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

  const handleFilter = (value: InventoryPage) => {
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

    setpage("1");
    setshow("1");
    settype(value);
    router.push(`?${params}`, { scroll: false });
    setreloaddata(true);
  };

  const handleSelection = (key: number[]) => {
    console.log({ key });
  };

  return (
    <>
      <title>Inventory Management | SrokSre</title>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {type &&
          globalindex.producteditindex !== -1 &&
          openmodal[`cover${globalindex.producteditindex}`] && (
            <ImagePreview
              open={
                openmodal[`cover${globalindex.producteditindex}`] as boolean
              }
              data={{
                id: globalindex.producteditindex,
                ty: type as InventoryPage,
              }}
            />
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
        {openmodal.filteroption && (
          <FilterMenu
            name={name}
            categories={{
              parentid: parseInt(parentcate as string),
              childid: parseInt(childcate as string),
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
        {openmodal.discount && <DiscountModals setreloaddata={setreloaddata} />}
        {openmodal.editvariantstock && (
          <Variantcontainer
            type="stock"
            editindex={globalindex.producteditindex}
            closename="editvariantstock"
          />
        )}

        <div className="inventory__container w-full h-full min-h-screen relative flex flex-col items-center pb-[200px]">
          <div className="inventory_header bg-white sticky z-30 top-[55px] w-full h-full p-2 border-b border-black">
            <div className="w-full flex flex-row items-center overflow-x-auto gap-x-5 scrollbar-hide">
              {!promotion.selectproduct &&
              !promotion.selectbanner &&
              !openmodal.managebanner ? (
                <>
                  <div className="w-fit h-full">
                    <SelectionCustom
                      label="Filter"
                      data={Filteroptions}
                      placeholder="Item"
                      value={type}
                      onChange={(val) =>
                        handleFilter(
                          val.toString().toLowerCase() as InventoryPage
                        )
                      }
                      style={{ width: "275px" }}
                    />
                  </div>

                  <SubInventoryMenu
                    data={createmenu as any}
                    open="subcreatemenu_ivt"
                  />

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
                        text={`Expire: ${promoexpire} `}
                        style={{ minWidth: "150px" }}
                        onClick={() => {}}
                        type="button"
                        radius="10px"
                      />
                    )
                  )}
                </>
              ) : (
                <>
                  {promotion.selectproduct &&
                    promotion.Products.length !== 1 && (
                      <>
                        <PrimaryButton
                          color="#6FCF97"
                          radius="10px"
                          type="button"
                          style={{ minWidth: "150px" }}
                          text="Set Discount"
                          onClick={() => {
                            setopenmodal((prev) => ({
                              ...prev,
                              discount: true,
                            }));
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
                  style={{ minWidth: "150px" }}
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
                    style={{ minWidth: "150px" }}
                    onClick={() => handleDoneButton()}
                  />
                </>
              )}

              <PrimaryButton
                color="#4688A0"
                radius="10px"
                style={{ minWidth: "150px" }}
                type="button"
                text={
                  Object.values(filtervalue).some((i) => i !== undefined)
                    ? "Clear Filter"
                    : "Filter"
                }
                onClick={() =>
                  setopenmodal((prev) => ({ ...prev, filteroption: true }))
                }
              />
            </div>
          </div>

          {type && (
            <TableComponent
              ty={type}
              data={allData && allData[type as string]}
              onPagination={(ty, val) =>
                ty === "limit" ? handleShowPerPage(val) : handlePage(val)
              }
              isLoading={loaded}
              pagination={{
                itemscount,
                show,
                page: Number(page),
                setpage: (val) => handlePage(val.toString()),
                onShowPage: (val) => handleShowPerPage(val),
              }}
              onSelection={(key) => handleSelection(key)}
            />
          )}
        </div>
      </LocalizationProvider>
    </>
  );
}
