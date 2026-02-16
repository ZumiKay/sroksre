import { ApiRequest, useEffectOnce } from "@/src/context/CustomHook";
import {
  PromotionInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { BlurLoading, errorToast, infoToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import { motion } from "framer-motion";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { ImageUpload } from "./Image";
import { Switch } from "@heroui/react";

interface InventoryParamType {
  ty?: string;
  p?: string;
  limit?: string;
  status?: string;
  name?: string;
  parentcate?: string;
  childcate?: string;
  expiredate?: string;
  pid?: string;
  promoselect?: "banner" | "product";
}
export const CreatePromotionModal = ({
  searchparams,
  settype,
  setreloaddata,
}: {
  searchparams: InventoryParamType;
  settype: (type: string) => void;
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    openmodal,
    setopenmodal,
    promotion,
    setpromotion,
    setisLoading,
    isLoading,
    globalindex,
    setglobalindex,
  } = useGlobalContext();

  const [loading, setloading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPickDate, setisPickDate] = useState(false);

  const fetchdata = async (id: number) => {
    setloading(true);
    const request = await ApiRequest(
      `/api/promotion?ty=edit&p=${id}`,
      undefined,
      "GET",
    );
    setloading(false);
    if (request.success) {
      setpromotion(request.data);
    } else {
      errorToast("Error Connection");
    }
  };
  useEffect(() => {
    if (globalindex.promotioneditindex !== -1) {
      fetchdata(globalindex.promotioneditindex);
    } else {
      setpromotion((prev) => ({ ...prev, id: -1 }));
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const param = new URLSearchParams(searchParams);
    const promo = { ...promotion };
    const isProduct = promo.Products.filter((i) => i.id !== 0).length;
    if (isProduct === 0 || !promo.expireAt) {
      errorToast(
        !promo.expireAt ? "Please Fill Expire Date" : "Please Select Product",
      );
      return;
    }

    const method = globalindex.promotioneditindex !== -1 ? "PUT" : "POST";

    const createpromo = await ApiRequest(
      "/api/promotion",
      setisLoading,
      method,
      "JSON",
      { ...promo, type: "edit" },
    );
    if (!createpromo.success) {
      errorToast(createpromo.error ?? "Error Occured");
      return;
    }

    setpromotion(PromotionInitialize);

    successToast(
      `Promotion ${
        globalindex.promotioneditindex === -1 ? "Created" : "Updated"
      }`,
    );
    Object.keys(searchparams).forEach((key) => {
      if (key === "ty") {
        const type = "promotion";
        param.set("ty", type);
        settype(type);
      } else {
        param.delete(key);
      }
    });

    router.push(`?${param}`);
    setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
    setreloaddata(true);
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setpromotion((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleCancel = async () => {
    const param = new URLSearchParams(searchParams);

    const deletepromoproduct = await ApiRequest(
      "/api/promotion",
      setisLoading,
      "PUT",
      "JSON",
      { type: "cancelproduct" },
    );

    if (!deletepromoproduct.success) {
      errorToast("Error Occured");
      return;
    }

    Object.keys(searchParams).forEach((key) => {
      if (key === "ty") {
        const type = "promotion";
        param.set("ty", type);
        settype(type);
      } else {
        param.delete(key);
      }
    });

    setpromotion(PromotionInitialize);
    setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
    router.push(`?${param}`);
    setreloaddata(true);
  };
  const handleSelectProductAndBanner = (type: "product" | "banner") => {
    const param = new URLSearchParams(searchParams);

    const isSelect = promotion.Products.every((i) => i.id !== 0);

    setpromotion((prev) => ({
      ...prev,
      products: isSelect ? prev.Products : [],
      selectbanner: type === "banner",
      selectproduct: type === "product",
    }));

    infoToast("Start selection by clicking on the card");

    // Remove all parameters except 'ty'
    param.forEach((_, key) => {
      if (key !== "ty") {
        param.delete(key);
      }
    });

    param.set("ty", type);
    param.set("p", "1");
    param.set("limit", "1");
    settype(type);

    router.push(`?${param}`, { scroll: false });
    setreloaddata(true);
    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
  };

  return (
    <SecondaryModal
      onPageChange={(val) =>
        !isPickDate &&
        setopenmodal((prev) => ({ ...prev, createPromotion: val }))
      }
      open={openmodal.createPromotion}
      size="xl"
      placement="top"
    >
      {loading && <BlurLoading />}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="createPromotion__container relative rounded-2xl w-full h-full bg-gradient-to-br from-white to-orange-50 p-6 flex flex-col shadow-xl border-2 border-orange-200"
      >
        <div className="w-full space-y-2 pb-5 border-b-2 border-orange-200 mb-6">
          <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <i className="fa-solid fa-tags text-white"></i>
            </div>
            {globalindex.promotioneditindex === -1
              ? "Create Promotion"
              : "Edit Promotion"}
          </h4>
          <p className="text-sm text-gray-500 ml-13">
            Set up promotional offers with discounts and banners
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="promotionform w-full h-full flex flex-col justify-start items-start gap-y-5 overflow-y-auto pr-2"
        >
          <div className="w-full bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-info-circle text-lg text-orange-500"></i>
              <h5 className="font-bold text-gray-800">Basic Information</h5>
            </div>
            <input
              type="text"
              name="name"
              placeholder="Promotion Name"
              value={promotion.name}
              className="w-full h-14 px-4 border-2 border-gray-300 rounded-xl text-base font-medium focus:border-orange-500 focus:outline-none transition-colors"
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="description"
              value={promotion.description}
              onChange={handleChange}
              placeholder="Description (optional)"
              className="w-full h-14 px-4 border-2 border-gray-300 rounded-xl text-base font-medium focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="w-full bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200 space-y-3">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-clock text-lg text-red-500"></i>
              <h5 className="font-bold text-gray-800">Expiration</h5>
              <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-1 rounded-full">
                Required
              </span>
            </div>
            <DateTimePicker
              value={promotion.expireAt ? dayjs(promotion.expireAt) : null}
              onOpen={() => setisPickDate(true)}
              onClose={() => setisPickDate(false)}
              onChange={(e) => {
                if (e) {
                  setpromotion((prev) => ({ ...prev, expireAt: e }));
                }
              }}
              sx={{ width: "100%", height: "56px" }}
            />
          </div>
          <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-layer-group text-lg text-blue-500"></i>
              <Switch
                isSelected={promotion.autocate}
                onValueChange={(val) => {
                  setpromotion((prev) => ({ ...prev, autocate: val }));
                }}
              >
                <span className="font-semibold text-gray-700">
                  Auto List at Sale Category
                </span>
              </Switch>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectProductAndBanner("banner")}
            className="w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02]"
          >
            <i className="fa-solid fa-image text-lg"></i>
            <span>
              {promotion.banner?.id || promotion.banner_id
                ? "Edit Banner"
                : "Select Banner"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectProductAndBanner("product")}
            className="w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 hover:shadow-xl hover:scale-[1.02]"
          >
            <i className="fa-solid fa-box text-lg"></i>
            <span>
              {promotion.Products?.filter((i) => i.id !== 0).length > 0
                ? `Edit Products (${
                    promotion.Products.filter((i) => i.id !== 0).length
                  })`
                : "Select Product"}
            </span>
          </button>
          <div className="w-full h-fit flex flex-row gap-4 pt-4 border-t-2 border-orange-200">
            <button
              type="submit"
              disabled={isLoading.POST || isLoading.PUT}
              className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                isLoading.POST || isLoading.PUT
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-[1.02]"
              }`}
            >
              {isLoading.POST || isLoading.PUT ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>
                    {globalindex.promotioneditindex === -1
                      ? "Creating..."
                      : "Updating..."}
                  </span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>
                    {globalindex.promotioneditindex === -1
                      ? "Create Promotion"
                      : "Update Promotion"}
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCancel()}
              disabled={isLoading.POST || isLoading.PUT}
              className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                isLoading.POST || isLoading.PUT
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-red-600 text-white hover:from-pink-600 hover:to-red-700 hover:shadow-xl hover:scale-[1.02]"
              }`}
            >
              <i className="fa-solid fa-times"></i>
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </motion.div>
      {openmodal.imageupload && (
        <ImageUpload
          mutitlple={false}
          limit={1}
          type="createpromotion"
          setreloaddata={setreloaddata}
        />
      )}
    </SecondaryModal>
  );
};

export const DiscountModals = ({
  setreloaddata,
}: {
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    promotion,
    allData,
    setpromotion,
    globalindex,
    openmodal,
    setopenmodal,
  } = useGlobalContext();
  const [discount, setdiscount] = useState<number>(0);

  useEffectOnce(() => {
    if (globalindex.promotionproductedit !== -1) {
      const idx = promotion.Products.findIndex(
        (i) => i.id === globalindex.promotionproductedit,
      );
      const promo = promotion.Products[idx].discount;
      const percent = promo?.percent;
      setdiscount(percent ?? 0);
    }
  });

  const handleDiscount = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let promoproduct = [...promotion.Products];
    let allproduct = [...(allData?.product ?? [])];
    const producteditidx = globalindex.promotionproductedit;

    const calculateDiscount = (price: number) => ({
      percent: discount,
      newprice: (price - (price * discount) / 100).toFixed(2),
      oldprice: price,
    });

    promoproduct = promoproduct.map((i) => {
      if (producteditidx === -1 || i.id === producteditidx) {
        return {
          ...i,
          discount: calculateDiscount(i.discount?.oldprice ?? 0),
        };
      }
      return i;
    });

    //update product discount
    allproduct = allproduct.map((product) => {
      const matchingPromoProduct = promoproduct.find(
        (promoProduct) => promoProduct.id === product.id,
      );

      if (matchingPromoProduct) {
        const { percent, newprice } = matchingPromoProduct.discount || {};
        return {
          ...product,
          discount: (typeof product.discount === "object"
            ? {
                ...product.discount,
                percent: percent as number,
                newprice: newprice as string,
              }
            : {
                percent: percent as number,
                newprice: newprice as string,
              }) as any,
        };
      }

      return product;
    });

    //update product

    setpromotion((prev) => ({ ...prev, Products: promoproduct }));
    setreloaddata(true);
    setopenmodal((prev) => ({ ...prev, discount: false }));
  };

  return (
    <SecondaryModal
      size="xl"
      open={openmodal.discount}
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, discount: val }))
      }
      closebtn
    >
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleDiscount}
        className="discount_content rounded-2xl w-full h-full p-6 bg-gradient-to-br from-white to-purple-50 flex flex-col gap-y-6 shadow-xl border-2 border-purple-200"
      >
        <div className="w-full space-y-2 pb-4 border-b-2 border-purple-200">
          <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <i className="fa-solid fa-percent text-white"></i>
            </div>
            Set Discount
          </h4>
          {globalindex.promotionproductedit === -1 && (
            <p className="text-sm text-gray-500 ml-13">
              Apply discount percentage to all selected products
            </p>
          )}
        </div>

        <div className="w-full bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-tag text-lg text-purple-500"></i>
            <h5 className="font-bold text-gray-800">Discount Percentage</h5>
          </div>
          <input
            type="number"
            placeholder="Enter discount (1-100)"
            name="discount"
            value={discount}
            min={1}
            max={100}
            className="w-full h-14 rounded-xl px-4 text-lg font-bold border-2 border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
            onChange={(e) => setdiscount(parseFloat(e.target.value))}
            required
          />
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <i className="fa-solid fa-info-circle"></i>
            Enter a value between 1% and 100%
          </p>
        </div>

        <button
          type="submit"
          className="w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 hover:shadow-xl hover:scale-[1.02]"
        >
          <i className="fa-solid fa-check"></i>
          <span>Apply Discount</span>
        </button>
      </motion.form>
    </SecondaryModal>
  );
};
