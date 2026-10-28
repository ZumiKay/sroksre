"use client";

import { ApiRequest } from "@/src/context/CustomHook";
import {
  PromotionInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import React, { ChangeEvent, SubmitEvent, useEffect, useState } from "react";
import { BlurLoading, errorToast, infoToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import dayjs from "dayjs";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { ImageUpload } from "./Image";
import { DatePicker, NumberInput, Switch } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBox,
  faCheck,
  faClock,
  faImage,
  faLayerGroup,
  faPen,
  faPercent,
} from "@fortawesome/free-solid-svg-icons";
import { ACCENTS, IconTile, ModalTitle, SectionCard } from "./FormSection";

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

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
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
  const handleChange = (e: ChangeEvent<any>) => {
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

  const isEdit = globalindex.promotioneditindex !== -1;
  const isSaving = !!(isLoading.POST || isLoading.PUT);
  const productCount =
    promotion.Products?.filter((i) => i.id !== 0).length ?? 0;
  const hasBanner = !!(promotion.banner?.id || promotion.banner_id);

  return (
    <SecondaryModal
      onPageChange={(val) =>
        !isPickDate &&
        setopenmodal((prev) => ({ ...prev, createPromotion: val }))
      }
      open={openmodal.createPromotion}
      size="xl"
      placement="top"
      isForm={{
        className: "promotionform w-full h-full flex flex-col",
        onSubmit: handleSubmit,
      }}
      footer={() => (
        <div className="w-full flex flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleCancel()}
            disabled={isSaving}
            className="h-10 px-5 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-small_phone:flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed max-small_phone:flex-1"
          >
            {isSaving ? (
              <Spinner />
            ) : (
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            )}
            {isEdit ? "Save Changes" : "Create Promotion"}
          </button>
        </div>
      )}
    >
      {loading && <BlurLoading />}
      <div className="createPromotion__container w-full flex flex-col gap-y-5 py-4">
        <ModalTitle
          title={isEdit ? "Edit Promotion" : "New Promotion"}
          subtitle="Discount a set of products until a set date, with an optional banner."
        />

        <SectionCard icon={faPen} title="Details">
          <label className="flex flex-col gap-y-1.5">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              name="name"
              placeholder="e.g. Black Friday"
              value={promotion.name}
              className={inputClass}
              onChange={handleChange}
              required
            />
          </label>
          <label className="flex flex-col gap-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <textarea
              name="description"
              value={promotion.description}
              onChange={handleChange}
              placeholder="What is this promotion about?"
              className={`${inputClass} h-auto py-2.5 resize-none`}
              rows={3}
            />
          </label>
        </SectionCard>

        <SectionCard
          icon={faClock}
          title="Ends on"
          hint="Discounts stop applying after this date and time."
        >
          <DatePicker
            aria-label="End date"
            variant="bordered"
            granularity="minute"
            isRequired
            value={
              promotion.expireAt
                ? parseAbsoluteToLocal(dayjs(promotion.expireAt).toISOString())
                : null
            }
            onOpenChange={(open) => setisPickDate(open)}
            onChange={(val) => {
              setpromotion((prev) => ({
                ...prev,
                expireAt: val ? dayjs(val.toDate()) : undefined,
              }));
            }}
            classNames={{ base: "w-full" }}
          />
        </SectionCard>

        <SectionCard
          icon={faLayerGroup}
          title="Products and banner"
          hint="Choosing closes this window so you can pick from the list."
        >
          <div className="flex flex-col gap-2">
            <PickRow
              icon={faBox}
              title="Products"
              required
              count={productCount}
              status={productCount > 0 ? `${productCount} selected` : undefined}
              actionLabel={productCount > 0 ? "Edit" : "Choose"}
              onClick={() => handleSelectProductAndBanner("product")}
            />
            <PickRow
              icon={faImage}
              title="Banner"
              count={hasBanner ? 1 : 0}
              status={hasBanner ? "Selected" : undefined}
              actionLabel={hasBanner ? "Change" : "Choose"}
              onClick={() => handleSelectProductAndBanner("banner")}
            />
          </div>
        </SectionCard>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <Switch
            isSelected={promotion.autocate}
            onValueChange={(val) => {
              setpromotion((prev) => ({ ...prev, autocate: val }));
            }}
            classNames={{
              base: "max-w-full w-full flex-row-reverse justify-between gap-4",
              label: "flex items-start gap-3",
              wrapper: "group-data-[selected=true]:bg-slate-900",
            }}
          >
            <IconTile icon={faPercent} size="sm" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                List in Sale category
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Show these products in the Sale category while the promotion
                runs.
              </span>
            </span>
          </Switch>
        </section>
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

const inputClass =
  "w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

const Spinner = () => (
  <span
    aria-hidden="true"
    className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
  />
);

function PickRow({
  icon,
  title,
  count,
  status,
  required,
  actionLabel,
  onClick,
}: {
  icon: IconDefinition;
  title: string;
  count: number;
  status?: string;
  required?: boolean;
  actionLabel: string;
  onClick: () => void;
}) {
  const done = count > 0;
  const badge = done
    ? { text: status, className: "bg-slate-900 text-white" }
    : required
      ? { text: "Required", className: "bg-red-50 text-red-600" }
      : { text: "Optional", className: "bg-slate-100 text-slate-600" };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <IconTile icon={icon} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}
          >
            {badge.text}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 h-9 px-4 rounded-lg text-sm font-semibold border transition-colors ${ACCENTS.neutral.soft}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export const DiscountModals = () => {
  const {
    promotion,
    allData,
    setalldata,
    setpromotion,
    globalindex,
    openmodal,
    setopenmodal,
  } = useGlobalContext();
  const [discount, setdiscount] = useState<number>(0);

  useEffect(() => {
    if (globalindex.promotionproductedit !== -1) {
      const idx = promotion.Products.findIndex(
        (i) => i.id === globalindex.promotionproductedit,
      );
      const promo = promotion.Products[idx].discount;
      const percent = promo?.percent;
      setdiscount(percent ?? 0);
    }
  }, []);

  const handleDiscount = (e: SubmitEvent<HTMLFormElement>) => {
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
        const productPrice = parseFloat(product.price?.toString() ?? "0");
        return {
          ...product,
          discount: {
            price: productPrice,
            discount: {
              percent: percent as number,
              newprice: newprice as string,
            },
          } as any,
        };
      }

      return product;
    });

    //update product
    setalldata((prev) => ({ ...prev, product: allproduct }));
    setpromotion((prev) => ({ ...prev, Products: promoproduct }));
    setopenmodal((prev) => ({ ...prev, discount: false }));
  };

  const isSingle = globalindex.promotionproductedit !== -1;

  return (
    <SecondaryModal
      size="md"
      open={openmodal.discount}
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, discount: val }))
      }
      closebtn
    >
      <form
        onSubmit={handleDiscount}
        className="discount_content w-full flex flex-col gap-y-5 py-4"
      >
        <ModalTitle
          title="Set Discount"
          subtitle={
            isSingle
              ? "Applies to this product only."
              : "Applies to every selected product."
          }
        />

        <NumberInput
          label="Discount"
          labelPlacement="outside"
          variant="bordered"
          placeholder="e.g. 20"
          description="Between 1% and 100%."
          endContent={
            <span className="text-sm font-semibold text-slate-600">%</span>
          }
          name="discount"
          value={discount}
          minValue={1}
          maxValue={100}
          onValueChange={(e) => setdiscount(e)}
          isRequired
          classNames={{ label: "text-sm font-medium text-slate-700" }}
        />

        <div className="flex flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, discount: false }))
            }
            className="h-10 px-5 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors max-small_phone:flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors max-small_phone:flex-1"
          >
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            Apply Discount
          </button>
        </div>
      </form>
    </SecondaryModal>
  );
};
