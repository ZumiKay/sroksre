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
          className="relative rounded-xl w-full h-full bg-gradient-to-br from-white to-gray-50"
        >
          <div className="p-8">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-black to-incart rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {isEditing ? "Edit Promotion" : "Create Promotion"}
              </h2>
              <p className="text-gray-500 mt-2">
                {isEditing
                  ? "Update your existing promotion details"
                  : "Set up a new promotional campaign"}
              </p>
            </div>

            <Form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-8"
            >
              <div className="space-y-6">
                <div className="group">
                  <Input
                    type="text"
                    name="name"
                    label="Promotion Name"
                    placeholder="Enter a catchy promotion name"
                    value={promotion.name || ""}
                    className="w-full transition-all duration-200 group-hover:scale-[1.02]"
                    onChange={handleChange}
                    isRequired
                    size="lg"
                    variant="bordered"
                    classNames={{
                      input: "text-lg",
                      inputWrapper:
                        "border-2 hover:border-blue-400 focus-within:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200",
                      label: "text-gray-700 font-semibold",
                    }}
                  />
                </div>

                <div className="group">
                  <Input
                    type="text"
                    name="description"
                    label="Description"
                    value={promotion.description || ""}
                    onChange={handleChange}
                    placeholder="Describe your promotion (optional)"
                    className="w-full transition-all duration-200 group-hover:scale-[1.02]"
                    size="lg"
                    variant="bordered"
                    classNames={{
                      input: "text-lg",
                      inputWrapper:
                        "border-2 hover:border-blue-400 focus-within:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200",
                      label: "text-gray-700 font-semibold",
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Expire Date *
                  </label>
                  <div className="relative">
                    <DateTimePicker
                      disablePast
                      value={
                        promotion.expireAt ? dayjs(promotion.expireAt) : null
                      }
                      onOpen={() => setisPickDate(true)}
                      onClose={() => setisPickDate(false)}
                      onChange={handleDateChange}
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          height: "64px",
                          borderRadius: "12px",
                          borderWidth: "2px",
                          fontSize: "16px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#60A5FA",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3B82F6",
                            boxShadow: "0 0 0 3px rgba(59,130,246,0.1)",
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                  <Switch
                    isSelected={promotion.autocate || false}
                    onValueChange={handleAutoCateChange}
                    size="lg"
                    classNames={{
                      wrapper:
                        "group-data-[selected=true]:bg-gradient-to-r group-data-[selected=true]:from-blue-500 group-data-[selected=true]:to-purple-600",
                      thumb: "group-data-[selected=true]:bg-white shadow-lg",
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-gray-800">
                        Auto List at Sale Category
                      </span>
                      <span className="text-sm text-gray-600 mt-1">
                        Automatically add promoted products to sale category
                      </span>
                    </div>
                  </Switch>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button
                  className="group relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 font-bold text-white h-16 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  variant="solid"
                  onPress={() => handleSelectProductAndBanner("banner")}
                  radius="lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-lg">
                      {hasBanner ? "Edit Banner" : "Select Banner"}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </Button>

                <Button
                  onPress={() => handleSelectProductAndBanner("product")}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 font-bold text-white h-16 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  variant="solid"
                  radius="lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <span className="text-lg">
                      {hasProducts ? "Edit Products" : "Select Products"}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  isLoading={loading}
                  startContent={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  }
                  className="w-full h-[60px] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-[#44C3A0]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg font-bold">
                      {isEditing ? "Update Promotion" : "Create Promotion"}
                    </span>
                  </div>
                </Button>
              </div>
            </Form>
          </div>
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
              promoExpiry: new Date(promotion.expireAt as string),
            });

            if (!calculatedDiscount) {
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
