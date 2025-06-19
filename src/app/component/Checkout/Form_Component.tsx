"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
} from "@heroui/react";
import { STEPS_INITIAL } from "@/src/context/GlobalType.type";
import { getAddress, handleShippingAdddress } from "../../checkout/action";
import { Address } from "@prisma/client";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast, successToast } from "../Loading";

// Types and interfaces
interface Addresstype {
  id: number;
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
  orderid: string;
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
    w-full max-w-2xl bg-gradient-to-br from-white to-gray-50 
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
const FORM_FIELDS = [
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
    required: true,
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
    label: "Commune/Ward",
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

              const request = await handleShippingAdddress(
                order_id,
                undefined,
                addressData as unknown as Address,
                isSaved ? "1" : "0"
              );

              if (!request.success) {
                errorToast(request.message ?? "Failed to save address");
                return;
              }
            }
          }

          successToast("Address saved successfully!");
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
export const ShippingForm = memo<ShippingFormProps>(({ orderid }) => {
  const [addresses, setAddresses] = useState<Addresstype[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] =
    useState<Addresstype>(SHIPPING_INITIAL);
  const [selectedId, setSelectedId] = useState(0);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch addresses on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAddress(orderid);

        if (result.selectedaddress?.shipping) {
          const shipping = result.selectedaddress.shipping as Addresstype;
          setSelectedId(shipping.id ?? 0);
          setSelectedAddress(shipping);
        }

        setAddresses((result.address as Addresstype[]) || []);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        errorToast("Failed to load addresses");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderid]);

  // Handle input changes with validation
  const handleChange = useCallback(
    (name: string, value: string) => {
      setSelectedAddress((prev) => ({ ...prev, id: -1, [name]: value }));

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

      if (value === 0) {
        setSelectedAddress(SHIPPING_INITIAL);
        try {
          setLoading(true);
          const updateResult = await ApiRequest({
            url: "/api/order",
            method: "PUT",
            data: { id: orderid, ty: "removeAddress" },
          });

          if (!updateResult.success) {
            errorToast("Failed to update address");
          }
        } catch (error) {
          console.error("Error removing address:", error);
          errorToast("Failed to update address");
        } finally {
          setLoading(false);
        }
        return;
      }

      if (value === -1) {
        setSelectedAddress({ ...SHIPPING_INITIAL, id: -1 });
        return;
      }

      const found = addresses.find((addr) => addr.id === value);
      if (found) {
        setSelectedAddress(found);
      }
    },
    [addresses, orderid]
  );

  // Address selection options
  const addressOptions = useMemo(
    () => [
      { label: "No Address", value: 0 },
      ...addresses.map((addr) => ({
        label: `${addr.firstname} ${addr.lastname} - ${addr.street}`,
        value: addr.id,
      })),
      { label: "Enter New Address", value: -1 },
    ],
    [addresses]
  );

  // Render form fields
  const renderFormFields = useMemo(() => {
    if (selectedId === 0) return null;

    return FORM_FIELDS.map((field) => {
      const isFullWidth = field;
      const value = selectedAddress?.[field.name as keyof Addresstype] || "";

      return (
        <motion.div
          key={field.name}
          variants={formAnimations.item}
          className={isFullWidth ? styles.inputFull : ""}
        >
          <Input
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            value={String(value)}
            onValueChange={(val) => handleChange(field.name, val)}
            isRequired={field.required}
            variant="bordered"
            size="lg"
            type={field.type}
            errorMessage={errors[field.name]}
            isInvalid={!!errors[field.name]}
            className="w-full"
            classNames={{
              input: "text-sm",
              label: "text-sm font-medium",
            }}
          />
        </motion.div>
      );
    });
  }, [selectedId, selectedAddress, errors, handleChange]);

  return (
    <motion.div
      variants={formAnimations.container}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className={styles.shippingCard}>
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
              {addressOptions.map((item) => (
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
                <div className={styles.inputRow}>
                  {renderFormFields?.slice(0, 2)}
                </div>

                <div className={styles.inputFull}>
                  {renderFormFields?.slice(2, 4)}
                </div>

                <div className={styles.inputRow}>
                  {renderFormFields?.slice(4, 6)}
                </div>

                <div className={styles.inputFull}>
                  {renderFormFields?.slice(6, 7)}
                </div>

                <div className={styles.inputRow}>
                  {renderFormFields?.slice(7)}
                </div>

                {/* Save for future checkbox */}
                <motion.div
                  variants={formAnimations.item}
                  className={styles.saveCheckbox}
                >
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

                {/* Address preview */}
                {selectedId === -1 && selectedAddress.firstname && (
                  <motion.div
                    variants={formAnimations.item}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200"
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
