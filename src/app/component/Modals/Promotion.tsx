import { ApiRequest } from "@/src/context/CustomHook";
import {
  PromotionInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { useRouter, useSearchParams } from "next/navigation";
import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { BlurLoading, errorToast, infoToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import { motion } from "framer-motion";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import PrimaryButton from "../Button";
import { ImageUpload } from "./Image";
import { Form, NumberInput, Switch, Input, Button } from "@heroui/react";
import {
  InventoryPage,
  PromotionProductState,
  PromotionState,
} from "@/src/context/GlobalType.type";
import { calculateDiscountPrice } from "@/src/lib/utilities";
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
  settype: (type: InventoryPage) => void;
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
    settableselectitems,
  } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPickDate, setisPickDate] = useState(false);
  useEffect(() => {
    const fetchdata = async (id: number) => {
      setloading(true);
      const request = await ApiRequest({
        url: `/api/promotion?ty=edit&p=${id}`,
        method: "GET",
      });
      setloading(false);
      if (!request.success) {
        errorToast("Error Occured");
        return;
      }
      setpromotion(request.data);
    };

    if (globalindex.promotioneditindex !== -1) {
      fetchdata(globalindex.promotioneditindex);
      return;
    }
  }, [globalindex.promotioneditindex]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const param = new URLSearchParams(searchParams);
      const isProduct = promotion.products && promotion.products.length;
      if (isProduct === 0 || !promotion.expireAt) {
        errorToast(
          !promotion.expireAt
            ? "Please Fill Expire Date"
            : "Please Select Product"
        );
        return;
      }

      const method = globalindex.promotioneditindex !== -1 ? "PUT" : "POST";

      const promodata: PromotionState = {
        ...promotion,
        expireAt: promotion.expireAt && (promotion.expireAt.toDate() as any),
      };
      const createpromo = await ApiRequest({
        url: "/api/promotion",
        setloading: setisLoading,
        method,
        data: method === "PUT" ? { ...promodata, type: "edit" } : promodata,
      });
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
    },
    [
      searchParams,
      promotion,
      globalindex.promotioneditindex,
      setisLoading,
      setpromotion,
      searchparams,
      router,
      setglobalindex,
      setopenmodal,
      setreloaddata,
      settype,
    ]
  );
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setpromotion((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleCancel = useCallback(() => {
    const param = new URLSearchParams(searchParams);

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
    if (globalindex.promotioneditindex !== -1)
      setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
    setopenmodal((prev) => ({ ...prev, createPromotion: false }));
    router.push(`?${param}`);
  }, [
    searchParams,
    setpromotion,
    globalindex.promotioneditindex,
    setglobalindex,
    setopenmodal,
    router,
    settype,
  ]);
  const handleSelectProductAndBanner = useCallback(
    (type: "product" | "banner") => {
      const param = new URLSearchParams(searchParams);

      setpromotion((prev) => ({
        ...prev,
        selectbanner: type === "banner",
        selectproduct: type === "product",
      }));

      infoToast(`Start selection for ${type}`);

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

      //Set select product and banne

      if (globalindex.promotioneditindex !== -1) {
        settableselectitems(
          type === "product"
            ? promotion.products?.map((i) => i.id)
            : promotion.banner_id
            ? [promotion.banner_id]
            : undefined
        );
      }

      setreloaddata(true);
      setopenmodal((prev) => ({ ...prev, createPromotion: false }));
    },
    [
      searchParams,
      setpromotion,
      settype,
      router,
      globalindex.promotioneditindex,
      setreloaddata,
      setopenmodal,
      settableselectitems,
      promotion.products,
      promotion.banner_id,
    ]
  );

  return (
    <SecondaryModal
      onPageChange={(val) => !isPickDate && handleCancel()}
      open={openmodal.createPromotion ?? false}
      size="xl"
      placement="top"
      closebtn
    >
      {loading && <BlurLoading />}
      <div className="createPromotion__container relative rounded-lg w-full h-full bg-white p-3 flex flex-col items-center">
        <Form
          onSubmit={handleSubmit}
          className="promotionform w-full h-full flex flex-col justify-start items-center gap-y-5"
        >
          <Input
            type="text"
            name="name"
            label={"Name"}
            placeholder="Name"
            value={promotion.name}
            className="w-full h-[50px] text-lg font-bold"
            onChange={handleChange}
            isRequired
          />
          <Input
            type="text"
            name="description"
            label={"Description"}
            value={promotion.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full h-[50px] text-lg font-bold"
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
          <div className="w-full h-full flex flex-row items-center gap-5">
            <Button
              className="bg-[#3D788E] font-bold text-white w-full h-[40px]"
              variant="solid"
              onPress={() => handleSelectProductAndBanner("banner")}
            >
              {promotion.banner?.id || promotion.banner_id
                ? "Edit Banner"
                : "Select Banner"}
            </Button>
            <Button
              onPress={() => handleSelectProductAndBanner("product")}
              className="bg_default  font-bold text-white w-full h-[40px]"
              variant="solid"
            >
              {promotion.products && promotion.products.length <= 0
                ? "Select Product"
                : "Edti Product"}
            </Button>
          </div>

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
          />
        </Form>
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

export const DiscountModals = () => {
  const {
    promotion,
    setpromotion,
    allData,
    setalldata,
    globalindex,
    openmodal,
    setopenmodal,
    tableselectitems,
  } = useGlobalContext();
  const [discount, setdiscount] = useState<number>(0);

  useEffect(() => {
    if (globalindex.promotionproductedit !== -1) {
      const product = allData?.product?.filter(
        (prod) =>
          prod.id && promotion?.products?.map((i) => i.id).includes(prod.id)
      );
      if (product && product.length > 0) {
        setdiscount(product[0].discount?.percent ?? 0);
      }
    }
  }, []);

  const handleDiscount = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const discountpromoproduct: Array<PromotionProductState> = [];
      setalldata((prev) => ({
        ...prev,
        product: prev?.product?.map((prod) => {
          if (prod.id && tableselectitems?.includes(prod.id)) {
            const calculatedDiscount = calculateDiscountPrice(
              prod.price,
              discount
            );
            discountpromoproduct.push({
              id: prod.id,
              discount: calculatedDiscount,
            });

            return {
              ...prod,
              discount: calculatedDiscount,
            };
          }
          return prod;
        }),
      }));

      setpromotion((prev) => ({ ...prev, products: discountpromoproduct }));
      setopenmodal((prev) => ({ ...prev, discount: false }));
    },
    [setalldata, discount, promotion.products, tableselectitems]
  );

  return (
    <SecondaryModal
      size="xl"
      open={openmodal.discount ?? false}
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
          <h3 className="text-lg font-bold">Set Discount</h3>
        )}
        <NumberInput
          aria-label="discount modal"
          placeholder="Discount Percentage EX: 20"
          name="discount"
          value={discount}
          min={0}
          max={100}
          className="w-full h-[50px] font-bold"
          startContent={"%"}
          onValueChange={(val) => setdiscount(val)}
          required
        />

        <Button
          type="submit"
          className="w-full bg_default font-bold text-white"
        >
          {globalindex.promotionproductedit !== -1 ? "Edit" : "Set"}{" "}
        </Button>
      </motion.form>
    </SecondaryModal>
  );
};
