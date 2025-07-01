"use client";

import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Button,
  Spinner,
  Divider,
  InputProps,
} from "@heroui/react";
import { SelectType, STEPS_INITIAL } from "@/src/context/GlobalType.type";
import { handleShippingAdddress } from "../../checkout/action";
import { Address } from "@prisma/client";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../Loading";
import { Ordertype } from "@/src/context/OrderContext";

// Types and interfaces
interface Addresstype {
  id?: number;
  firstname: string;
  lastname: string;
  street: string;
  houseId: string;
  province: string;
  district: string;
  songkhat: string;
  postalcode: string;
  phonenumber?: string;
}

interface FormWrapperProps {
  children: React.ReactNode;
  step: number;
  order_id: string;
}

interface ShippingFormProps {
  order: Ordertype;
}

// Constants
const SHIPPING_INITIAL: Addresstype = {
  id: 0,
  firstname: "",
  lastname: "",
  houseId: "",
  street: "",
  province: "",
  district: "",
  songkhat: "",
  postalcode: "",
  phonenumber: "",
};

// Styles
const styles = {
  formContainer: `
    w-full min-h-fit flex flex-row justify-center gap-6 p-6
    max-lg:flex-col max-lg:gap-4 max-lg:p-4
  `,
  shippingCard: `
    w-full  bg-gradient-to-br from-white to-gray-50 
    shadow-xl border border-gray-200
  `,
  cardHeader: "pb-6",
  cardTitle: "text-2xl font-bold text-gray-900 flex items-center gap-3",
  formGrid: "grid gap-6",
  inputRow: "grid grid-cols-1 md:grid-cols-2 gap-4",
  inputFull: "grid grid-cols-1 gap-4",
  saveCheckbox: "flex items-center gap-2 pt-4",
  submitButton: `
    w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 
    hover:from-blue-700 hover:to-blue-800 
    text-white font-semibold py-3 px-6 rounded-lg
    transition-all duration-200 transform hover:scale-[1.02]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
} as const;

// Animation variants
const formAnimations = {
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  },
} as const;

// Form field configuration
const FORM_FIELDS: Array<{
  name: string;
  placeholder: string;
  label: string;
  required: boolean;
  type: string;
  fullWidth?: boolean;
}> = [
  {
    name: "firstname",
    placeholder: "First Name",
    label: "First Name",
    required: true,
    type: "text",
  },
  {
    name: "lastname",
    placeholder: "Last Name",
    label: "Last Name",
    required: false,
    type: "text",
  },
  {
    name: "street",
    placeholder: "Street Address",
    label: "Street Address",
    required: true,
    type: "text",
    fullWidth: true,
  },
  {
    name: "houseId",
    placeholder: "Apartment, suite, etc.",
    label: "Apartment/Suite",
    required: true,
    type: "text",
    fullWidth: true,
  },
  {
    name: "province",
    placeholder: "Province/State",
    label: "Province/State",
    required: true,
    type: "text",
  },
  {
    name: "district",
    placeholder: "District",
    label: "District",
    required: true,
    type: "text",
  },
  {
    name: "songkhat",
    placeholder: "Commune/Ward",
    label: "Songkat/Commune/Ward",
    required: true,
    type: "text",
    fullWidth: true,
  },
  {
    name: "postalcode",
    placeholder: "Postal Code",
    label: "Postal Code",
    required: true,
    type: "text",
  },
  {
    name: "phonenumber",
    placeholder: "Phone Number",
    label: "Phone Number (Optional)",
    required: false,
    type: "tel",
  },
] as const;

// Enhanced FormWrapper Component
export const FormWrapper = memo<FormWrapperProps>(
  ({ children, step, order_id }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const handleProceed = useCallback(() => {
      const getStep = STEPS_INITIAL.find((i) => i.step === step);
      if (!getStep) return;
      const nextStep = step < 4 ? step + 1 : step;
      const current = new URLSearchParams(searchParams);
      current.set("step", nextStep.toString());

      router.push(`${pathname}?${current.toString()}`, { scroll: false });
    }, [pathname, router, searchParams, step]);

    const handleSubmit = useCallback(
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
          const formData = new FormData(event.currentTarget);
          const isShipping = formData.get("shipping");
          const isSaved = formData.get("save") === "1";

          if (isShipping) {
            const selectedAddressId = parseInt(
              formData.get("selected_address") as string
            );

            if (selectedAddressId !== -1) {
              // Using existing address
              const request = await handleShippingAdddress(
                order_id,
                selectedAddressId,
                undefined,
                isSaved ? "1" : "0"
              );

              if (!request.success) {
                errorToast(request.message ?? "Failed to save address");
                return;
              }
            } else {
              // Creating new address
              const addressData = Object.fromEntries(
                Array.from(formData.entries()).filter(([key]) =>
                  FORM_FIELDS.some((field) => field.name === key)
                )
              );

              if (Object.keys(addressData).length === 0) {
                errorToast("Please fill in the required address information");
                return;
              }

              const shippingReq = handleShippingAdddress.bind(
                null,
                order_id,
                undefined,
                addressData as unknown as Address,
                isSaved ? "1" : "0"
              );

              const request = await shippingReq();

              if (!request.success) {
                errorToast(request.message ?? "Failed to save address");
                return;
              }
            }
          }

          handleProceed();
        } catch (error) {
          console.error("Form submission error:", error);
          errorToast("An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      },
      [order_id, handleProceed]
    );

    return (
      <motion.form
        onSubmit={handleSubmit}
        className={styles.formContainer}
        variants={formAnimations.container}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
                <Spinner size="lg" color="primary" />
                <span className="text-lg font-medium">Processing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </motion.form>
    );
  }
);

FormWrapper.displayName = "FormWrapper";

// Enhanced SelectionSSR Component
export const SelectionSSR = memo<{
  selectedvalue?: string;
  data: Array<{ label: string; value: number }>;
}>(({ selectedvalue = "", data }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (value: string) => {
      const current = new URLSearchParams(searchParams);
      current.set("selectedaddress", value);
      router.push(`${pathname}?${current.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <Select
      label="Saved Addresses"
      placeholder="Select an address"
      selectedKeys={selectedvalue ? [selectedvalue] : []}
      onSelectionChange={(keys) => {
        const value = Array.from(keys)[0] as string;
        handleChange(value);
      }}
      className="w-full"
      variant="bordered"
    >
      {data.map((item) => (
        <SelectItem
          key={item.value.toString()}
          textValue={item.value.toString()}
        >
          {item.label}
        </SelectItem>
      ))}
    </Select>
  );
});

SelectionSSR.displayName = "SelectionSSR";

// Enhanced ShippingForm Component
export const ShippingForm = memo<ShippingFormProps>(({ order }) => {
  const [addressOptions, setAddressOptions] = useState<Array<SelectType>>();
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] =
    useState<Addresstype>(SHIPPING_INITIAL);
  const [selectedId, setSelectedId] = useState(order.shipping_id ?? -1);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch addresses on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await ApiRequest({
        url: "/api/order?ty=addressselect",
        method: "GET",
      });
      setLoading(false);
      if (result.success && result.data) {
        setAddressOptions(result.data as Array<SelectType>);
      }
    };

    fetchData();
  }, [order.id]);

  //fetch selected Address
  useEffect(() => {
    async function FetchSelectedAddr() {
      if (order.shipping_id) {
        const AddrReq = await ApiRequest({
          url: `/api/order?ty=addressbyid&aid=${order.shipping_id}`,
        });

        if (AddrReq.success && AddrReq.data) {
          setSelectedAddress(AddrReq.data as Addresstype);
          setSelectedId(order.shipping_id);
        }
      }
    }
    FetchSelectedAddr();
  }, [order.shipping_id]);

  // Handle input changes with validation
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSelectedAddress((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [errors]
  );

  // Handle address selection
  const handleSelect = useCallback(
    async (value: number) => {
      setSelectedId(value);
      setErrors({}); // Clear errors when switching addresses

      if (order.shipping_id && value === order.shipping_id) {
        setSelectedAddress(SHIPPING_INITIAL);
        if (order.shipping_id) {
          setLoading(true);
          const updateResult = await ApiRequest({
            url: "/api/order",
            method: "PUT",
            data: { id: order.id, ty: "removeAddress" },
          });
          setLoading(false);

          if (!updateResult.success) {
            errorToast("Failed to update address");
          }
        }
        return;
      } else if (value === 0) {
        setSelectedAddress(SHIPPING_INITIAL);
      } else if (value === -1) {
        setSelectedAddress({ ...SHIPPING_INITIAL, id: -1 });
        return;
      } else if (value !== 0 && value !== -1) {
        //get selected address
        const getReq = await ApiRequest({
          url: `/api/order?ty=addressbyid&aid=${value}`,
          method: "GET",
        });

        if (!getReq.success) {
          errorToast(getReq.error ?? "Error Occured");
          return;
        }
        setSelectedAddress(getReq.data as Addresstype);
      }
    },
    [order.id, order.shipping_id]
  );

  // Address selection options
  const addressSelectOptions = useMemo(
    () => [
      { label: "No Address", value: 0 },
      ...(addressOptions?.map((i) => i) ?? []),
      { label: "Enter New Address", value: -1 },
    ],
    [addressOptions]
  );

  return (
    <motion.div
      variants={formAnimations.container}
      className="w-full max-w-4xl mx-auto"
    >
      <Card fullWidth className={styles.shippingCard}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <span className="text-3xl">🏠</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Shipping Address
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose or enter your delivery address
              </p>
            </div>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="space-y-6">
          <input type="hidden" name="shipping" value="shipping" />
          <input
            type="hidden"
            name="selected_address"
            value={selectedAddress?.id ?? 0}
          />
          <input type="hidden" name="save" value={saveForFuture ? "1" : "0"} />

          {/* Address Selection */}
          <motion.div variants={formAnimations.item}>
            <Select
              label="Select Address"
              placeholder="Choose an address option"
              selectedKeys={selectedId ? [selectedId.toString()] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleSelect(parseInt(value));
              }}
              variant="bordered"
              size="lg"
              isLoading={loading}
              startContent={<span className="text-lg">📍</span>}
              className="w-full"
            >
              {addressSelectOptions.map((item) => (
                <SelectItem
                  key={item.value.toString()}
                  startContent={
                    item.value === 0 ? "🚫" : item.value === -1 ? "➕" : "🏠"
                  }
                >
                  {item.label}
                </SelectItem>
              ))}
            </Select>
          </motion.div>

          {/* Form Fields */}
          <AnimatePresence mode="wait">
            {selectedId !== 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={styles.formGrid}
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  {selectedId === -1 ? "Add New Address" : "Edit Address"}
                </h3>

                <div className="w-full h-fit flex flex-col items-center gap-y-5">
                  {FORM_FIELDS.map((field, idx) => {
                    return (
                      <Input
                        key={idx}
                        {...(field as unknown as InputProps)}
                        onChange={handleChange as never}
                        value={selectedAddress[field.name as never]}
                      />
                    );
                  })}
                </div>

                {/* Save for future checkbox */}
                {selectedId === -1 && (
                  <motion.div className={"w-full h-fit"}>
                    <Checkbox
                      isSelected={saveForFuture}
                      onValueChange={setSaveForFuture}
                      color="primary"
                      size="lg"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        Save this address for future orders
                      </span>
                    </Checkbox>
                  </motion.div>
                )}

                {/* Address preview */}
                {selectedId === -1 && selectedAddress.firstname && (
                  <motion.div
                    variants={formAnimations.item}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-4"
                  >
                    <h4 className="font-medium text-blue-900 mb-2">
                      Address Preview:
                    </h4>
                    <p className="text-sm text-blue-800">
                      {selectedAddress.firstname} {selectedAddress.lastname}
                      <br />
                      {selectedAddress.street} {selectedAddress.houseId}
                      <br />
                      {selectedAddress.songkhat}, {selectedAddress.district}
                      <br />
                      {selectedAddress.province}, {selectedAddress.postalcode}
                      {selectedAddress.phonenumber && (
                        <>
                          <br />
                          📞 {selectedAddress.phonenumber}
                        </>
                      )}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div variants={formAnimations.item}>
            <Button
              type="submit"
              className={styles.submitButton}
              size="lg"
              isLoading={loading}
              isDisabled={selectedId === 0}
              startContent={!loading && <span>🚚</span>}
            >
              {loading ? "Saving Address..." : "Continue to Shipping Options"}
            </Button>
          </motion.div>
        </CardBody>
      </Card>
    </motion.div>
  );
});

ShippingForm.displayName = "ShippingForm";

export default ShippingForm;
