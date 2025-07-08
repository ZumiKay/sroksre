"use client";
import PrimaryButton from "../../component/Button";
import { useCallback, useEffect, useMemo, useRef, useState, use } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { errorToast, successToast } from "../../component/Loading";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { InventoryParamType } from "./varaint_action";
import { Category } from "../../component/Modals/Category";
import { BannerModal } from "../../component/Modals/Banner";
import {
  CreatePromotionModal,
  DiscountModals,
} from "../../component/Modals/Promotion";
import { IsNumber } from "@/src/lib/utilities";
import React from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  InventoryPage,
  ProductState,
  SelectType,
} from "@/src/context/GlobalType.type";
import TableComponent from "../../component/Table/Table_Component";
import ImagePreview from "../../component/Modals/ImagePreview";
import { Variantcontainer } from "../../component/Modals/VariantModal";
import { Button } from "@heroui/react";
import FilterMenu from "@/src/app/component/FilterMenu/FilterMenu";
import { isDate } from "date-fns";
import { AsyncSelection } from "../../component/AsynSelection";
import { SubInventoryMenu } from "../../component/SideMenu";

const createmenu: Readonly<Array<SelectType>> = Object.freeze([
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
]);
const Filteroptions: Readonly<Array<SelectType>> = Object.freeze([
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
]);

const defaultparams = (type: string) => `?ty=${type}&p=1&limit=1`;

// Check for valid number parameters
const isValidParams = (params: InventoryParamType): boolean => {
  const { p, limit, parentcate, childcate, expired, pid, promoids } = params;

  return !(
    (p && !IsNumber(p)) ||
    (limit && !IsNumber(limit)) ||
    (parentcate && !IsNumber(parentcate)) ||
    (childcate && !IsNumber(childcate)) ||
    (expired && !IsNumber(expired)) ||
    (pid && !IsNumber(pid)) ||
    (promoids && !promoids.split(",").every(IsNumber))
  );
};

export default function Inventory(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = use(props.searchParams as never);
  const {
    openmodal,
    setopenmodal,
    allData,
    setalldata,
    tableselectitems,
    settableselectitems,
    promotion,
    setpromotion,
    itemlength,
    setitemlength,
    globalindex,
    filtervalue,
    setfiltervalue,
  } = useGlobalContext();
  const parsedParams = useMemo(
    () => searchParams as InventoryParamType,
    [searchParams]
  );
  const {
    ty: type,
    p,
    limit,
    parentcate,
    childcate,
    expired,
    promoids,
    promotiononly,
    expiredate,
    search,
    pid,
  } = parsedParams;

  const [loaded, setloaded] = useState(false);
  const [updateLoading, setUpdateLoading] = useState<boolean | undefined>(
    undefined
  );
  const router = useRouter();
  const searchParam = useSearchParams();
  const [show, setshow] = useState(limit ?? "1");
  const [page, setpage] = useState(p ?? "1");
  const [lowstock, setlowstock] = useState(0);
  const [reloaddata, setreloaddata] = useState(false);
  const [ty, settype] = useState<InventoryPage>(type ?? "product");
  const [promoexpire, setpromoexpire] = useState(0);

  //Prevent Excessive Redirect
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    if (!type) {
      hasRedirected.current = true;
      return redirect(
        `/dashboard/inventory${defaultparams(type ?? "product")}`
      );
    }

    if (!isValidParams(parsedParams)) {
      return redirect(`/dashboard/inventory?ty=${type}&p=1&limit=1`);
    }

    const storedCategories = window.localStorage.getItem("categories");

    setfiltervalue({
      categories: storedCategories ? JSON.parse(storedCategories) : undefined,
      search: search ?? "",
      expiredate: expiredate && isDate(expiredate) ? expiredate : undefined,
      parentcate: parentcate && IsNumber(parentcate) ? parentcate : undefined,
      childcate: childcate && IsNumber(childcate) ? childcate : undefined,
      // Array handling optimized
      promoids:
        promoids && promoids.split(",").every(IsNumber)
          ? promoids.split(",")
          : undefined,
    });
    setreloaddata(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    childcate,
    expired,
    expiredate,
    limit,
    p,
    parentcate,
    pid,
    promoids,
    promotiononly,
    search,
    type,
  ]);

  useEffect(() => {
    const fetchdata = async (pid?: number) => {
      try {
        let apiUrl: string = "";
        const {
          status,
          search,
          childcate,
          parentcate,
          bannersize,
          bannertype,
          expired,
          expiredate,
          promoids,
        } = filtervalue ?? {};

        if (ty === "product") {
          apiUrl =
            status ||
            search ||
            childcate ||
            parentcate ||
            promotion.selectproduct ||
            promoids
              ? `/api/products?ty=filter&p=${page}&limit=${show}${
                  status ? `&sk=${status}` : ""
                }${search ? `&q=${search}` : ""}${
                  parentcate ? `&pc=${parentcate}` : ""
                }${childcate ? `&cc=${childcate}` : ""}${
                  pid ? `&pid=${pid}` : ""
                }${!pid && promotion.selectproduct ? "&sp=1" : ""}${
                  promoids ? `&pids=${promoids.join(",")}` : ""
                }`
              : `/api/products?ty=all&limit=${show}&p=${page}`;
        } else if (ty === "banner") {
          apiUrl =
            search || bannersize || bannertype
              ? `/api/banner?ty=filter&limit=${show}&p=${page}${
                  bannertype ? `&bty=${bannertype}` : ""
                }${bannersize ? `&bs=${bannersize}` : ""}${
                  search ? `&q=${search}` : ""
                }`
              : promotion.selectbanner
              ? `/api/banner?ty=filter&limit=${show}&p=${page}&bty=normal&promoselect=1`
              : `/api/banner?ty=all&limit=${show}&p=${page}`;
        } else if (ty === "promotion") {
          apiUrl =
            search || expiredate || expired
              ? `/api/promotion?ty=filter&lt=${show}&p=${page ?? "1"}${
                  search ? `&q=${search}` : ""
                }${
                  expiredate ? `&exp=${dayjs(expiredate).toISOString()}` : ""
                }${expired ? `&expired=${expired}` : ""}`
              : `/api/promotion?ty=all&lt=${show}&p=${page ?? "1"}`;
        }

        const makerequest = async () => {
          const allfetchdata = await ApiRequest({
            url: apiUrl,
            method: "GET",
          });

          if (allfetchdata.success) {
            const modifieddata = allfetchdata.data;

            if (ty === "product") {
              setlowstock(allfetchdata.lowStock as number);
            }

            setalldata(
              (ty === "product"
                ? {
                    product: promotion.selectproduct
                      ? (modifieddata as Array<ProductState>).map((newProd) => {
                          const existingProd = promotion.Products?.find(
                            (prod) => prod?.id === newProd.id
                          );
                          return existingProd?.discount
                            ? { ...newProd, discount: existingProd.discount }
                            : newProd;
                        })
                      : modifieddata,
                  }
                : { [ty as string]: modifieddata }) as never
            );
            setpromoexpire(allfetchdata?.expireCount ?? 0);
            setitemlength({
              total: allfetchdata.total ?? 0,
              lowstock: allfetchdata.lowStock ?? 0,
              totalpage: allfetchdata.totalPages ?? 0,
              totalitems: allfetchdata.totalFiltered ?? 0,
            });
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

    if (reloaddata) {
      fetchdata(promotion.id);
    }
  }, [
    reloaddata,
    promotion.id,
    ty,
    promotion.selectproduct,
    promotion.selectbanner,
    promotion.Products,
    page,
    show,
    setalldata,
    setitemlength,
    filtervalue,
  ]);

  const handleShowPerPage = useCallback(
    (value: number | string) => {
      const param = new URLSearchParams(searchParam);
      param.set("p", "1");
      param.set("limit", value.toString());
      setpage("1");
      setshow(value as string);
      router.push(`?${param}`);
      setreloaddata(true);
    },
    [router, searchParam]
  );

  const handlePage = useCallback(
    (value: string) => {
      const param = new URLSearchParams(searchParam);
      param.set("p", value);
      setpage(value);
      router.push(`?${param}`);
      setreloaddata(true);
    },
    [router, searchParam]
  );

  const handleDoneButton = useCallback(async () => {
    if (globalindex.promotioneditindex !== -1) {
      const url = `/api/promotion?ty=${
        promotion.selectproduct
          ? "editproduct"
          : promotion.selectbanner
          ? "editbanner"
          : ""
      }`;

      setUpdateLoading(true);
      const updateReq = await ApiRequest({
        url,
        method: "PUT",
        data: {
          id: promotion.id,
          products: promotion.Products,
          banner_id: promotion.banner_id,
        },
      });
      setUpdateLoading(false);

      if (!updateReq.success) {
        errorToast("Can't Update Promotion");
        return;
      }

      setreloaddata(true);
    }
    setopenmodal((prev) => ({
      ...prev,
      createPromotion: true,
    }));
  }, [globalindex.promotioneditindex, promotion, setopenmodal]);

  const handleFilter = useCallback(
    (value: InventoryPage) => {
      if (!filtervalue) return;
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
    },
    [filtervalue, router, searchParam]
  );

  const handleSelection = useCallback(
    (key: Array<string | number>) => {
      if (!promotion.selectproduct && !promotion.selectbanner) {
        settableselectitems(key);
        return;
      }

      // Check banner selection
      if (promotion.selectbanner) {
        if (promotion.banner_id && key.includes(promotion.banner_id)) {
          setpromotion((prev) => ({ ...prev, banner_id: undefined }));
        } else {
          setpromotion((prev) => ({ ...prev, banner_id: key[0] as number }));
        }
      }

      settableselectitems(key);
    },
    [
      promotion.banner_id,
      promotion.selectbanner,
      promotion.selectproduct,
      setpromotion,
      settableselectitems,
    ]
  );
  const handleSelectDelete = useCallback(async () => {
    if (!tableselectitems?.length) return;

    setloaded(true);

    try {
      const delReq = await ApiRequest({
        url: `/api/${ty}`,
        method: "DELETE",
        data: {
          ids: tableselectitems,
        },
      });

      if (!delReq.success) {
        errorToast("Error Occured");
        return;
      }

      successToast("Items Deleted");

      // Optimized state update with type safety
      setalldata((prev) => {
        if (!prev?.[ty]) return prev;

        const itemsToDelete = new Set(tableselectitems);
        return {
          ...prev,
          [ty]: (prev[ty] as Array<{ id: number }>).filter(
            ({ id }) => !itemsToDelete.has(id)
          ),
        } as never;
      });

      // Clear selection after successful deletion
      settableselectitems([]);
    } catch (error) {
      console.error("Delete operation failed:", error);
      errorToast("Error Occured");
    } finally {
      setloaded(false);
    }
  }, [ty, tableselectitems, setalldata, settableselectitems]);

  const MultipleDeleteConfirmation = useCallback(() => {
    setopenmodal({
      confirmmodal: {
        type: ty as never,
        open: true,
        onAsyncDelete: () => handleSelectDelete(),
        onDelete() {
          setreloaddata(true);
        },
      },
    });
  }, [handleSelectDelete, setopenmodal, ty]);

  const handleRemoveDiscount = useCallback(
    (id: number[]) => {
      if (promotion.selectproduct && !promotion.Products) {
        errorToast("No Products Selected");
        return;
      }

      if (promotion.selectproduct) {
        setpromotion((prev) => ({
          ...prev,
          products: prev.Products?.filter((prod) => !id.includes(prod.id)),
        }));
        setalldata((prev) => ({
          ...prev,
          product: prev?.product?.map((prod) =>
            prod.id && id.includes(prod.id)
              ? { ...prod, discount: undefined }
              : prod
          ),
        }));
      }
    },
    [promotion.Products, promotion.selectproduct, setalldata, setpromotion]
  );

  const handleBackToPromotion = useCallback(() => {
    setpromotion((prev) => ({ ...prev, id: undefined, view: undefined }));

    const updateparam = new URLSearchParams();

    updateparam.set("ty", "promotion");

    router.push(`?${updateparam}`);
    settype("promotion");
    setreloaddata(true);
  }, [router, setpromotion]);

  return (
    <>
      <title>Inventory Management | SrokSre</title>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {(openmodal[`cover${globalindex.producteditindex}`] ||
          openmodal[`showbanner${globalindex.bannereditindex}`]) &&
          (globalindex.producteditindex !== -1 ||
            globalindex.bannereditindex !== -1) && (
            <ImagePreview
              open={
                (openmodal[`showbanner${globalindex.bannereditindex}`] ||
                  openmodal[`cover${globalindex.producteditindex}`]) as boolean
              }
              data={{
                id: globalindex.producteditindex,
                image:
                  allData?.banner &&
                  allData.banner.find(
                    (i) => i.id === globalindex.bannereditindex
                  )?.Image,
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
            searchparams={searchParams as InventoryParamType}
            settype={settype}
            setreloaddata={setreloaddata}
          />
        )}
        {openmodal.filteroption && (
          <FilterMenu
            type={type as never}
            reloaddata={() => setreloaddata(true)}
          />
        )}
        {openmodal.discount && <DiscountModals />}

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
              !promotion.view &&
              !openmodal.managebanner ? (
                <>
                  <div className="w-fit h-full">
                    <AsyncSelection
                      type="normal"
                      data={() => Filteroptions}
                      option={{
                        label: "Page",
                        size: "lg",
                        className: "w-[200px]",
                        selectedValue: [ty],
                        onValueChange: (val) =>
                          handleFilter(val.target.value as InventoryPage),
                      }}
                    />
                  </div>

                  <SubInventoryMenu
                    data={createmenu}
                    open="subcreatemenu_ivt"
                  />

                  <PrimaryButton
                    color="#60513C"
                    width="150px"
                    style={{ minWidth: "150px" }}
                    radius="10px"
                    type="button"
                    text={
                      "Total: " +
                      (itemlength.totalitems ?? itemlength.total ?? 0)
                    }
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
                    tableselectitems &&
                    tableselectitems.length > 0 && (
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

                        <PrimaryButton
                          color="lightcoral"
                          type="button"
                          text="Remove Discount"
                          radius="10px"
                          onClick={() =>
                            handleRemoveDiscount(tableselectitems as number[])
                          }
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

              {promotion.view && (
                <Button
                  isLoading={updateLoading}
                  onPress={() => handleBackToPromotion()}
                  className="bg_default w-[150px] h-[40px] text-white font-bold"
                >
                  Back
                </Button>
              )}

              {(promotion.selectproduct || promotion.selectbanner) && (
                <>
                  <Button
                    isLoading={updateLoading}
                    onPress={() => handleDoneButton()}
                    className="bg_default w-[150px] h-[40px] text-white font-bold"
                  >
                    Done
                  </Button>
                </>
              )}
              <PrimaryButton
                color="#4688A0"
                radius="10px"
                style={{ minWidth: "150px" }}
                type="button"
                text={
                  Object.values(filtervalue ?? {}).some(Boolean)
                    ? "Clear Filter"
                    : "Filter"
                }
                onClick={() =>
                  setopenmodal((prev) => ({ ...prev, filteroption: true }))
                }
              />
              {!promotion.selectbanner &&
                !promotion.selectproduct &&
                tableselectitems &&
                tableselectitems.length > 0 && (
                  <PrimaryButton
                    color="red"
                    radius="10px"
                    style={{ minWidth: "150px" }}
                    type="button"
                    text={`Delete ${tableselectitems.length}`}
                    onClick={() => MultipleDeleteConfirmation()}
                  />
                )}
            </div>
          </div>

          <section className="w-full h-full max-defaultsize:overflow-x-auto overflow-hidden">
            {type && (
              <TableComponent
                ty={type}
                settype={settype}
                data={allData && (allData[type as string] as never)}
                onPagination={(ty, val) =>
                  ty === "limit" ? handleShowPerPage(val) : handlePage(val)
                }
                isLoading={loaded}
                pagination={{
                  itemscount: itemlength.totalpage,
                  show,
                  page: Number(page),
                  setpage: (val) => handlePage(val.toString()),
                  onShowPage: (val) => handleShowPerPage(val),
                }}
                onSelection={(key) => handleSelection(key)}
                singleselect={type === "banner" && promotion.selectbanner}
                selectedvalue={tableselectitems}
              />
            )}
          </section>
        </div>
      </LocalizationProvider>
    </>
  );
}
//
