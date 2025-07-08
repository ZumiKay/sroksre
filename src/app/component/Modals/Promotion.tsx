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

interface CreatePromotionModalProps {
  searchparams: InventoryParamType;
  settype: (type: InventoryPage) => void;
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CreatePromotionModal = React.memo(
  ({ searchparams, settype, setreloaddata }: CreatePromotionModalProps) => {
    const {
      openmodal,
      setopenmodal,
      promotion,
      setpromotion,
      globalindex,
      setglobalindex,
      settableselectitems,
    } = useGlobalContext();

    const [loading, setloading] = useState(false);
    const [isPickDate, setisPickDate] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Memoized values
    const isEditing = useMemo(
      () => globalindex.promotioneditindex !== -1,
      [globalindex.promotioneditindex]
    );

    const isModalOpen = useMemo(
      () => openmodal.createPromotion ?? false,
      [openmodal.createPromotion]
    );

    const hasProducts = useMemo(
      () => promotion.Products && promotion.Products.length > 0,
      [promotion.Products]
    );

    const hasBanner = useMemo(
      () => promotion.banner?.id || promotion.banner_id,
      [promotion.banner?.id, promotion.banner_id]
    );

    // Fetch promotion data for editing
    useEffect(() => {
      const fetchdata = async (id: number) => {
        setloading(true);
        try {
          const request = await ApiRequest({
            url: `/api/promotion?ty=edit&p=${id}`,
            method: "GET",
          });

          if (!request.success) {
            errorToast("Error Occurred");
            return;
          }

          setpromotion(request.data as PromotionState);
        } catch (error) {
          errorToast("Failed to fetch promotion data");
          throw error;
        } finally {
          setloading(false);
        }
      };

      if (isEditing) {
        fetchdata(globalindex.promotioneditindex);
      }
    }, [isEditing, globalindex.promotioneditindex, setpromotion]);

    const handleSubmit = useCallback(
      async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validation
        if (!promotion.expireAt) {
          errorToast("Please Fill Expire Date");
          return;
        }

        if (!hasProducts) {
          errorToast("Please Select Product");
          return;
        }

        if (!promotion.name?.trim()) {
          errorToast("Please Fill All Required Fields");
          return;
        }

        const method = isEditing ? "PUT" : "POST";
        const param = new URLSearchParams(searchParams);

        setloading(true);
        try {
          const createpromo = await ApiRequest({
            url: "/api/promotion",
            method,
            data: method === "PUT" ? { ...promotion, type: "edit" } : promotion,
          });

          if (!createpromo.success) {
            errorToast(createpromo.error ?? "Error Occurred");
            return;
          }

          // Reset and navigate
          setpromotion(PromotionInitialize);
          successToast(`Promotion ${isEditing ? "Updated" : "Created"}`);

          // Clean up URL parameters
          Object.keys(searchparams).forEach((key) => {
            if (key === "ty") {
              param.set("ty", "promotion");
              settype("promotion");
            } else {
              param.delete(key);
            }
          });

          router.push(`?${param}`);
          setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
          setopenmodal((prev) => ({ ...prev, createPromotion: false }));
          setreloaddata(true);
        } catch (error) {
          errorToast("Failed to save promotion");
          throw error;
        } finally {
          setloading(false);
        }
      },
      [
        promotion,
        hasProducts,
        isEditing,
        searchParams,
        searchparams,
        router,
        setpromotion,
        setglobalindex,
        setopenmodal,
        setreloaddata,
        settype,
      ]
    );

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setpromotion((prev) => ({ ...prev, [name]: value }));
      },
      [setpromotion]
    );

    const handleCancel = useCallback(() => {
      const param = new URLSearchParams(searchParams);

      // Clean up URL parameters
      Object.keys(searchparams).forEach((key) => {
        if (key === "ty") {
          param.set("ty", "promotion");
          settype("promotion");
        } else {
          param.delete(key);
        }
      });

      setpromotion(PromotionInitialize);

      if (isEditing) {
        setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
      }

      setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      router.push(`?${param}`);
    }, [
      searchParams,
      searchparams,
      setpromotion,
      isEditing,
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

        // Clean URL parameters
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

        // Set selected items for editing
        if (isEditing) {
          const selectedItems =
            type === "product"
              ? promotion.Products?.map((i) => i.id)
              : promotion.banner_id
              ? [promotion.banner_id]
              : undefined;

          settableselectitems(selectedItems);
        }

        setreloaddata(true);
        setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      },
      [
        searchParams,
        setpromotion,
        settype,
        router,
        isEditing,
        promotion.Products,
        promotion.banner_id,
        settableselectitems,
        setreloaddata,
        setopenmodal,
      ]
    );

    const handleDateChange = useCallback(
      (date: dayjs.Dayjs | null) => {
        if (date) {
          handleChange({
            target: { name: "expireAt", value: date.toISOString() },
          } as ChangeEvent<HTMLInputElement>);
        }
      },
      [handleChange]
    );

    const handleAutoCateChange = useCallback(
      (val: boolean) => {
        setpromotion((prev) => ({ ...prev, autocate: val }));
      },
      [setpromotion]
    );

    return (
      <SecondaryModal
        onPageChange={() => !isPickDate && handleCancel()}
        open={isModalOpen}
        size="xl"
        placement="top"
        closebtn
      >
        {loading && <BlurLoading />}

        <motion.div
          {...fadeAnimation}
          className="relative rounded-lg w-full h-full bg-white p-6 flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              {isEditing ? "Edit Promotion" : "Create Promotion"}
            </h2>
          </div>

          <Form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
            <div className="space-y-4">
              <Input
                type="text"
                name="name"
                label="Promotion Name"
                placeholder="Enter promotion name"
                value={promotion.name || ""}
                className="w-full"
                onChange={handleChange}
                isRequired
                size="lg"
              />

              <Input
                type="text"
                name="description"
                label="Description"
                value={promotion.description || ""}
                onChange={handleChange}
                placeholder="Enter description"
                className="w-full"
                size="lg"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Expire Date *
                </label>
                <DateTimePicker
                  disablePast
                  value={promotion.expireAt ? dayjs(promotion.expireAt) : null}
                  onOpen={() => setisPickDate(true)}
                  onClose={() => setisPickDate(false)}
                  onChange={handleDateChange}
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      height: "56px",
                    },
                  }}
                />
              </div>

              <div className="flex items-center">
                <Switch
                  isSelected={promotion.autocate || false}
                  onValueChange={handleAutoCateChange}
                  size="lg"
                >
                  Auto List at Sale Category
                </Switch>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                className="bg-[#3D788E] hover:bg-[#2D5A6B] font-semibold text-white h-12 transition-colors"
                variant="solid"
                onPress={() => handleSelectProductAndBanner("banner")}
              >
                {hasBanner ? "Edit Banner" : "Select Banner"}
              </Button>

              <Button
                onPress={() => handleSelectProductAndBanner("product")}
                className="bg_default hover:opacity-90 font-semibold text-white h-12 transition-opacity"
                variant="solid"
              >
                {hasProducts ? "Edit Products" : "Select Products"}
              </Button>
            </div>

            <div className="mt-auto pt-6">
              <PrimaryButton
                color="#44C3A0"
                text={isEditing ? "Update Promotion" : "Create Promotion"}
                type="submit"
                status={loading ? "loading" : "authenticated"}
                radius="10px"
                width="100%"
                height="50px"
              />
            </div>
          </Form>
        </motion.div>
      </SecondaryModal>
    );
  }
);

CreatePromotionModal.displayName = "CreatePromotionModal";

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
    promotion,
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
      if (!promotion) {
        errorToast("No Selected Promotion");
        return;
      }
      e.preventDefault();

      const discountpromoproduct: Array<PromotionProductState> = [];

      const isExpire =
        promotion.expireAt && new Date(promotion.expireAt) < new Date();
      if (isExpire) {
        errorToast("Promotion is expired");
        return;
      }

      setalldata((prev) => ({
        ...prev,
        product: prev?.product?.map((prod) => {
          if (prod.id && tableselectitems?.includes(prod.id)) {
            const calculatedDiscount = calculateDiscountPrice({
              price: prod.price,
              discount,
              id: prod.id,
              promoExpiry: new Date(promotion.expireAt as string),
            });

            if (calculatedDiscount.id) {
              return;
            }

            discountpromoproduct.push({
              id: prod.id,
              discount: calculatedDiscount as never,
            });

            return {
              ...prod,
              discount: calculatedDiscount,
            };
          }
          return prod;
        }) as never,
      }));

      setpromotion((prev) => ({
        ...prev,
        products: [...(prev.Products ?? []), ...discountpromoproduct],
      }));
      setopenmodal((prev) => ({ ...prev, discount: false }));
    },
    [
      promotion,
      setalldata,
      setpromotion,
      setopenmodal,
      tableselectitems,
      discount,
    ]
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
