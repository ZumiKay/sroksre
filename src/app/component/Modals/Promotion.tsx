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
  useMemo,
  useState,
} from "react";
import { BlurLoading, errorToast, infoToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import { motion } from "framer-motion";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import PrimaryButton from "../Button";
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
      setpromotion(request.data as PromotionState);
    };

    if (globalindex.promotioneditindex !== -1) {
      fetchdata(globalindex.promotioneditindex);
      return;
    }
  }, [globalindex.promotioneditindex]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("Promotion Submit", promotion);
      const param = new URLSearchParams(searchParams);
      const isNotProduct =
        !promotion.Products || promotion.Products.length === 0;
      if (isNotProduct || !promotion.expireAt || !promotion.name) {
        errorToast(
          !promotion.expireAt
            ? "Please Fill Expire Date"
            : isNotProduct
            ? "Please Select Product"
            : "Please Fill All Required Fields"
        );
        return;
      }

      const method = globalindex.promotioneditindex !== -1 ? "PUT" : "POST";

      const createpromo = await ApiRequest({
        url: "/api/promotion",
        setloading: setisLoading,
        method,
        data: method === "PUT" ? { ...promotion, type: "edit" } : promotion,
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
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setpromotion((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [setpromotion]
  );
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
            ? promotion.Products?.map((i) => i.id)
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
      promotion.Products,
      promotion.banner_id,
    ]
  );

  return (
    <SecondaryModal
      onPageChange={() => !isPickDate && handleCancel()}
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
            disablePast
            value={promotion.expireAt ? dayjs(promotion.expireAt) : null}
            onOpen={() => setisPickDate(true)}
            onClose={() => setisPickDate(false)}
            onChange={(e) => {
              if (e) {
                handleChange({
                  target: { name: "expireAt", value: e.toISOString() },
                } as never);
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
              {!promotion.Products || promotion.Products.length === 0
                ? "Select Product"
                : "Edit Product"}
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
    </SecondaryModal>
  );
};

const fadeAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const DiscountModals = () => {
  const {
    setpromotion,
    allData,
    setalldata,
    globalindex,
    openmodal,
    setopenmodal,
    tableselectitems,
  } = useGlobalContext();

  const [discount, setdiscount] = useState<number>(0);

  // Memoize values that are used in calculations
  const isEditing = useMemo(
    () => globalindex.promotionproductedit !== -1,
    [globalindex.promotionproductedit]
  );

  const selectedProducts = useMemo(() => {
    if (!allData?.product || !tableselectitems?.length) return [];
    return allData.product.filter(
      (prod) => prod.id && tableselectitems.includes(prod.id)
    );
  }, [allData?.product, tableselectitems]);

  // Clean up useEffect
  useEffect(() => {
    if (isEditing && selectedProducts.length > 0) {
      setdiscount(selectedProducts[0].discount?.percent ?? 0);
    }
  }, [isEditing, selectedProducts]);

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

      setpromotion((prev) => ({
        ...prev,
        products: [...(prev.Products ?? []), ...discountpromoproduct],
      }));
      setopenmodal((prev) => ({ ...prev, discount: false }));
    },
    [setalldata, setpromotion, setopenmodal, tableselectitems, discount]
  );

  // Memoize the modal open state
  const isModalOpen = useMemo(
    () => openmodal.discount ?? false,
    [openmodal.discount]
  );

  // Handler for modal state change
  const handleModalChange = useCallback(
    (val: boolean) => setopenmodal((prev) => ({ ...prev, discount: val })),
    [setopenmodal]
  );

  // Handler for discount value change
  const handleDiscountChange = useCallback(
    (val: number) => setdiscount(val),
    []
  );

  return (
    <SecondaryModal
      size="xl"
      open={isModalOpen}
      onPageChange={handleModalChange}
      closebtn
    >
      <motion.form
        {...fadeAnimation}
        onSubmit={handleDiscount}
        className="w-full p-5 bg-white rounded-lg shadow-sm flex flex-col gap-y-6"
      >
        {!isEditing && (
          <h3 className="text-xl font-semibold text-center text-gray-800">
            Set Discount
          </h3>
        )}

        <NumberInput
          aria-label="discount percentage"
          placeholder="Discount Percentage (e.g. 20)"
          name="discount"
          value={discount}
          min={0}
          max={100}
          className="w-full h-12 font-medium"
          startContent={<span className="text-gray-500">%</span>}
          onValueChange={handleDiscountChange}
          required
        />

        <Button
          type="submit"
          className="w-full h-12 bg_default font-semibold text-white rounded-md hover:opacity-90 transition-opacity"
        >
          {isEditing ? "Update Discount" : "Set Discount"}
        </Button>
      </motion.form>
    </SecondaryModal>
  );
};
