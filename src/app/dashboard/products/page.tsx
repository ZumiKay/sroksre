"use client";
import PrimaryButton, { Selection } from "../../component/Button";
import Card, { BannerCard } from "../../component/Card";
import {
  BannerModal,
  Category,
  CreateProducts,
  CreatePromotionModal,
  DiscountModals,
} from "../../component/Modals";
import {
  FiltervalueInitialize,
  PromotionProductInitialize,
  SpecificAccess,
  filterinventorytype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { SubInventoryMenu } from "../../component/Navbar";
import { useEffect, useRef, useState } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import LoadingIcon, { errorToast, successToast } from "../../component/Loading";
import { FilterMenu } from "../../component/SideMenu";
import dayjs from "dayjs";
import { Pagination } from "@mui/material";
export enum INVENTORYENUM {
  size = "SIZE",
  normal = "NORMAL",
  color = "COLOR",
}
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
const showperpage = ["1", "3", "10", "20", "30"];

export default function Inventory() {
  const {
    openmodal,
    setopenmodal,
    allData,
    setalldata,
    isLoading,
    setisLoading,
    promotion,
    setpromotion,
    inventoryfilter,
    setinventoryfilter,
    globalindex,
    allfiltervalue,
    setallfilterval,
  } = useGlobalContext();
  const btnref = useRef<HTMLDivElement | null>(null);
  const [loaded, setloaded] = useState(false);
  const [show, setshow] = useState(1);
  const [page, setpage] = useState(1);
  const [itemslength, setlength] = useState({
    total: 0,
    lowstock: 0,
    totalpage: 0,
  });
  const fetchdata = async () => {
    setloaded(false);
    try {
      let apiUrl: string = "";
      let transformFunction: (item: any) => any = () => {};
      const { status, name, category, expiredate, page, promotionid } =
        allfiltervalue.find((i) => i.page === inventoryfilter)?.filter ?? {};
      if (inventoryfilter === "product") {
        apiUrl =
          status?.length !== 0 ||
          name?.length !== 0 ||
          category?.parent_id !== 0 ||
          category.child_id !== 0 ||
          promotionid
            ? `/api/products/ty=filter_p=${page}_limit=${show}${
                status ? `_sk=${status}` : ""
              }${name ? `_q=${name}` : ""}${
                category?.parent_id ? `_pc=${category?.parent_id}` : ""
              }${category?.child_id ? `_cc=${category?.child_id}` : ""}${
                promotionid ? `_pid=${promotionid}` : ""
              }`
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
      } else if (inventoryfilter === "banner") {
        apiUrl = `/api/banner?limit=${show}&ty=${!name ? "all" : "filter"}&p=${
          page ?? "1"
        }&p=${page}${name ? `&q=${name}` : ""}`;
        transformFunction = (item: any) => ({
          ...item,
          createdAt: undefined,
          updatedAt: undefined,
        });
      } else {
        apiUrl = `/api/promotion?lt=${show}&p=${page ?? "1"}${
          name ? `&q=${name}` : ""
        }${expiredate ? `&exp=${expiredate.toISOString()}` : ""}`;
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
      const allfetchdata = await ApiRequest(apiUrl, setisLoading, "GET");
      if (allfetchdata.success) {
        const modifieddata = allfetchdata.data?.map(transformFunction);
        setalldata((prev) => ({
          ...prev,
          [inventoryfilter]: modifieddata,
        }));
        if (inventoryfilter === "promotion") {
          let tempromoproduct = [...(promotion.tempproductstate ?? [])];
          tempromoproduct = modifieddata.map((i: any) => i.products);
          setpromotion((prev) => ({
            ...prev,
            tempproductstate: tempromoproduct,
          }));
        }
        setlength({
          total: allfetchdata.total ?? 0,
          lowstock: allfetchdata.lowstock ?? 0,
          totalpage: allfetchdata.totalpage ?? 0,
        });
      } else {
        errorToast("Error Connection");
      }
      setloaded(true);
    } catch (error) {
      console.log("Inventory Fetch Error", error);
      errorToast("Error Occrued, Relaod is Required");
    }
  };
  useEffect(() => {
    const isExist = allfiltervalue.findIndex((i) => i.page === inventoryfilter);
    if (isExist !== -1) {
      setpage(allfiltervalue[isExist].filter.page);
    } else {
      allfiltervalue.push({
        page: inventoryfilter,
        filter: FiltervalueInitialize,
      });
    }
  }, [inventoryfilter]);

  useEffect(() => {
    fetchdata();
  }, [inventoryfilter, allfiltervalue, show]);

  useEffect(() => {
    const handleLoad = async () => {
      const dib = localStorage.getItem("diB");
      const dip = localStorage.getItem("diP");
      const URL = "/api/image";

      const deleteImage = async (names: any) => {
        const result = await ApiRequest(URL, setisLoading, "DELETE", "JSON", {
          names,
        });

        if (!result.success) {
          errorToast("Error Occurred");
          return false;
        }

        return true;
      };

      if (dib) {
        if (await deleteImage({ name: dib })) {
          localStorage.removeItem("diB");
        }
      }

      if (dip) {
        const diP = JSON.parse(dip);
        if (await deleteImage({ names: diP })) {
          localStorage.removeItem("diP");
        }
      }
    };
    handleLoad();
  }, []);

  const handleManageBanner = () => {
    setinventoryfilter("banner");
    setopenmodal((prev) => ({ ...prev, managebanner: true }));
  };

  return (
    <main className="inventory__container w-full min-h-screen relative ">
      <div className="inventory_header bg-white sticky z-30 top-[6vh] flex flex-row justify-start items-center w-full gap-x-20 p-2 border-b border-black">
        {!promotion.selectproduct &&
        !promotion.selectbanner &&
        !openmodal.managebanner ? (
          <>
            <Selection
              default="Filter Items"
              style={{ width: "150px" }}
              data={Filteroptions}
              value={inventoryfilter}
              onChange={(e) => {
                const allfilter = [...allfiltervalue];
                const isExist = allfilter.findIndex(
                  (i) => i.page === e.target.value.toLowerCase(),
                );
                if (isExist === -1) {
                  allfilter.push({
                    page: e.target.value.toLowerCase() as filterinventorytype,
                    filter: {
                      page: 1,
                      name: "",
                      category: {
                        parent_id: 0,
                        child_id: 0,
                      },
                      status: "",
                    },
                  });
                  setallfilterval(allfilter);
                }

                setinventoryfilter(
                  e.target.value.toLowerCase() as typeof inventoryfilter,
                );
              }}
            />
            <div
              ref={btnref}
              className="createbtn_container flex flex-col justify-center items-start"
            >
              <PrimaryButton
                color="#6FCF97"
                radius="10px"
                type="button"
                text="Action"
                onClick={() =>
                  setopenmodal({
                    ...openmodal,
                    subcreatemenu_ivt: !openmodal.subcreatemenu_ivt,
                  })
                }
                Icon={<i className="fa-solid fa-plus text-sm text-black"></i>}
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
              radius="10px"
              type="button"
              text={"Total: " + itemslength.total}
            />
            {inventoryfilter === "product" ? (
              <PrimaryButton
                color="#F08080"
                radius="10px"
                type="button"
                text={`Low Stock: ${itemslength.lowstock ?? 0} `}
              />
            ) : (
              inventoryfilter === "banner" && (
                <PrimaryButton
                  text="Manage Banner"
                  type="button"
                  radius="10px"
                  onClick={() => handleManageBanner()}
                  color="lightcoral"
                />
              )
            )}
          </>
        ) : (
          <>
            {promotion.selectproduct && promotion.products.length > 0 && (
              <>
                <PrimaryButton
                  color="#6FCF97"
                  radius="10px"
                  type="button"
                  text="Set Discount"
                  onClick={() => {
                    setopenmodal((prev) => ({ ...prev, discount: true }));
                  }}
                />
              </>
            )}
          </>
        )}
        {((promotion.selectproduct &&
          promotion.products.every(
            (i) => i.discount && i.discount.percent.length !== 0,
          )) ||
          promotion.selectbanner ||
          openmodal.managebanner) && (
          <>
            <PrimaryButton
              text="Done"
              type="button"
              radius="10px"
              onClick={async () => {
                if (promotion.selectbanner || promotion.selectproduct) {
                  if (promotion.selectproduct) {
                    const allfilter = [...allfiltervalue];
                    allfilter.forEach((i) => {
                      if (i.page === "product") {
                        i.filter = { ...i.filter, promotionid: undefined };
                      }
                    });
                    setallfilterval(allfilter);
                  }
                  setopenmodal((prev) => ({ ...prev, createPromotion: true }));
                } else {
                  //update banner in databases
                  const allbanner = [...allData.banner];
                  const isShow = allbanner.map((i) => ({
                    id: i.id,
                    show: i.show,
                  }));

                  const update = await ApiRequest(
                    "/api/banner",
                    setisLoading,
                    "PUT",
                    "JSON",
                    { Ids: isShow },
                  );
                  if (!update.success) {
                    errorToast(update.error ?? "Error Occrued");
                    return;
                  }
                  successToast("Banner Updated");

                  setopenmodal((prev) => ({ ...prev, managebanner: false }));
                }
              }}
            />
            {openmodal.managebanner && (
              <PrimaryButton
                color="red"
                radius="10px"
                type="button"
                text={"Cancel"}
                disable={
                  openmodal.managebanner
                    ? allData.tempbanner
                      ? allData.tempbanner?.length === 0
                      : !allData.tempbanner
                    : null
                }
                onClick={() => {
                  if (promotion.selectproduct || promotion.selectbanner) {
                    let promo = { ...promotion };
                    promotion.selectproduct
                      ? (promo.products = promo.tempproductstate ?? [])
                      : (promo.banner_id = 0);
                    setpromotion(promo);
                    setopenmodal((prev) => ({
                      ...prev,
                      createPromotion: true,
                    }));
                  } else {
                    let tempbanner = [...(allData.tempbanner ?? [])];
                    const allbanner = [...allData.banner];
                    if (tempbanner.length > 0) {
                      allbanner.forEach((i) => {
                        tempbanner.forEach((j) => {
                          if (i.id === j.id) {
                            i.show = j.show;
                          }
                        });
                      });
                      setalldata((prev) => ({
                        ...prev,
                        banner: allbanner,
                        tempbanner: undefined,
                      }));
                    }
                  }
                }}
              />
            )}
          </>
        )}

        <PrimaryButton
          color="#4688A0"
          radius="10px"
          type="button"
          text={"Filter"}
          onClick={() =>
            setopenmodal((prev) => ({ ...prev, filteroption: true }))
          }
        />
      </div>
      <div className="productlist w-full grid mt-5 place-items-center grid-cols-4 lg:grid-cols-3 md:grid-col-2 sm:grid-cols-1 gap-y-32 ">
        {SpecificAccess(isLoading) && (
          <div className="absolute top-[40%] z-20 w-[150px] h-[150px]">
            <LoadingIcon />
          </div>
        )}
        {inventoryfilter === "product" &&
          allData.product.map((obj, index) => (
            <Card
              index={index}
              img={obj.covers}
              name={obj.name}
              hover={true}
              price={parseFloat(obj.price.toString()).toFixed(2)}
              id={obj.id ?? 0}
              discount={obj.discount}
              stock={obj.stock}
            />
          ))}
        {inventoryfilter === "banner" &&
          allData.banner.map((obj, idx) => (
            <div key={idx} className="banner-card w-[500px] h-[300px]">
              <BannerCard
                data={{
                  name: obj.name,
                  url: obj.image.url,
                }}
                index={idx}
                id={obj.id ?? 0}
                type="banner"
              />
            </div>
          ))}

        {inventoryfilter === "promotion" &&
          allData.promotion.map((obj, idx) => (
            <div key={idx} className="banner-card w-[500px] h-[300px]">
              <BannerCard
                data={{
                  name: obj.name,
                  url: obj.banner?.image.url ?? "",
                }}
                index={idx}
                id={obj.id ?? 0}
                type="promotion"
              />
            </div>
          ))}
        {loaded &&
          (inventoryfilter === "banner"
            ? allData.banner.length === 0 && (
                <h1 className="w-full ml-[5%] font-normal text-xl text-red-400 p-3 border-2 border-red-300 rounded-lg">
                  No Banner (Create Banner by Click on Action and Banner)
                </h1>
              )
            : inventoryfilter === "promotion"
              ? allData.promotion.length === 0 && (
                  <h1 className="w-full ml-[5%] font-normal text-xl text-red-400 p-3 border-2 border-red-300 rounded-lg">
                    No Promotion (Create Promotion by Click on Action and
                    Promotion)
                  </h1>
                )
              : allData.product.length === 0 && (
                  <h1 className="w-full ml-[5%] font-normal text-xl text-red-400 p-3 border-2 border-red-300 rounded-lg">
                    No Product (Create Product by Click on Action and Product)
                  </h1>
                ))}
      </div>

      {openmodal.createProduct && <CreateProducts />}
      {openmodal.createCategory && <Category />}
      {openmodal.createBanner && <BannerModal type="banner" />}
      {openmodal.createPromotion && <CreatePromotionModal />}
      {openmodal.filteroption && <FilterMenu />}
      {openmodal.discount && <DiscountModals />}
      <div className="pagination_container  w-full h-fit absolute -bottom-[5%] flex flex-row justify-center  ">
        <Pagination
          count={itemslength.totalpage}
          page={page}
          color="primary"
          onChange={(_, value) => {
            const isExist = allfiltervalue.findIndex(
              (i) => i.page === inventoryfilter,
            );
            if (isExist !== -1) {
              let allfil = [...allfiltervalue];
              allfil[isExist].filter.page = value;
              setallfilterval(allfil);
            }

            setpage(value);
          }}
          sx={{
            width: "80%",
            display: "flex",
            justifyContent: "center",
            paddingLeft: "10%",
          }}
          showFirstButton
          showLastButton
        />
        <Selection
          style={{ width: "10%" }}
          data={showperpage}
          value={show}
          onChange={(e) => {
            const allfilter = [...allfiltervalue];
            allfilter.forEach((i) => (i.filter.page = 1));
            setallfilterval(allfilter);
            setshow(parseInt(e.target.value));
          }}
          default="Show Per Page"
        />
      </div>
    </main>
  );
}
