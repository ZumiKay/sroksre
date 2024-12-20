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
import PrimaryButton from "../Button";
import { ImageUpload } from "./Image";
import { Progress, Switch } from "@nextui-org/react";
import { Backdrop } from "@mui/material";

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
      "GET"
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
        !promo.expireAt ? "Please Fill Expire Date" : "Please Select Product"
      );
      return;
    }

    const method = globalindex.promotioneditindex !== -1 ? "PUT" : "POST";

    const createpromo = await ApiRequest(
      "/api/promotion",
      setisLoading,
      method,
      "JSON",
      { ...promo, type: "edit" }
    );
    if (!createpromo.success) {
      errorToast(createpromo.error ?? "Error Occured");
      return;
    }

    setpromotion(PromotionInitialize);

    successToast(
      `Promotion ${
        globalindex.promotioneditindex === -1 ? "Created" : "Updated"
      }`
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
      { type: "cancelproduct" }
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
      <div className="createPromotion__container relative rounded-lg w-full h-full bg-white p-3 flex flex-col items-center">
        <form
          onSubmit={handleSubmit}
          className="promotionform w-full h-full flex flex-col justify-start items-center gap-y-5"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={promotion.name}
            className="w-full h-[50px] pl-2 border border-gray-200 text-lg font-medium"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="description"
            value={promotion.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full h-[50px] pl-2 border border-gray-200 text-lg font-medium"
          />
          <label className="w-full text-lg font-bold text-left">
            Expire Date*
          </label>
          <DateTimePicker
            value={promotion.expireAt ? dayjs(promotion.expireAt) : null}
            onOpen={() => setisPickDate(true)}
            onClose={() => setisPickDate(false)}
            onChange={(e) => {
              if (e) {
                setpromotion((prev) => ({ ...prev, expireAt: e }));
              }
            }}
            sx={{ width: "100%", height: "50px" }}
          />
          <div className="w-full flex justify-start">
            <Switch
              isSelected={promotion.autocate}
              onValueChange={(val) => {
                setpromotion((prev) => ({ ...prev, autocate: val }));
              }}
            >
              Auto List at Sale Category
            </Switch>
          </div>
          <PrimaryButton
            text={
              promotion.banner?.id || promotion.banner_id
                ? "Edit Banner"
                : "Select Banner"
            }
            onClick={() => {
              handleSelectProductAndBanner("banner");
            }}
            type="button"
            color="#3D788E"
            radius="10px"
            width="100%"
            height="50px"
          />
          <PrimaryButton
            text={
              promotion.Products?.filter((i) => i.id !== 0).length > 0
                ? "Edit Products"
                : "Select Product"
            }
            onClick={() => handleSelectProductAndBanner("product")}
            type="button"
            radius="10px"
            width="100%"
            height="50px"
          />
          <div className="w-full h-fit flex flex-row gap-x-5">
            <PrimaryButton
              color="#44C3A0"
              text={globalindex.promotioneditindex === -1 ? "Create" : "Update"}
              type="submit"
              status={
                isLoading.POST || isLoading.PUT ? "loading" : "authenticated"
              }
              radius="10px"
              width="100%"
              height="50px"
            />{" "}
            <PrimaryButton
              color="#F08080"
              text="Cancel"
              type="button"
              disable={isLoading.POST || isLoading.PUT}
              radius="10px"
              width="100%"
              height="50px"
              onClick={() => handleCancel()}
            />
          </div>
        </form>
      </div>
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
        (i) => i.id === globalindex.promotionproductedit
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
        (promoProduct) => promoProduct.id === product.id
      );

      if (matchingPromoProduct) {
        const { percent, newprice } = matchingPromoProduct.discount || {};
        return {
          ...product,
          discount: {
            ...product.discount,
            percent: percent as number,
            newprice: newprice as string,
          },
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onSubmit={handleDiscount}
        className="discount_content rounded-lg w-full h-full p-3 bg-white flex flex-col gap-y-5 justify-center items-center"
      >
        {globalindex.promotionproductedit === -1 && (
          <h3 className="text-lg font-bold">
            Set Discount For All Selected Product
          </h3>
        )}
        <input
          type="number"
          placeholder="Discount Percentage EX: 20"
          name="discount"
          value={discount}
          min={1}
          max={100}
          className="w-full h-[50px] rounded-lg pl-3 text-lg font-bold round-lg border border-gray-300"
          onChange={(e) => setdiscount(parseFloat(e.target.value))}
          required
        />
        <PrimaryButton
          type="submit"
          text="Confirm"
          width="100%"
          radius="10px"
        />
      </motion.form>
    </SecondaryModal>
  );
};
