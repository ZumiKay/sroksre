import { STEPS_INITIAL } from "@/src/context/GlobalType.type";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useMemo,
  memo,
} from "react";
import { getAddress, handleShippingAdddress } from "../../checkout/action";
import { errorToast, LoadingText } from "../Loading";
import { Address } from "@prisma/client";
import { ApiRequest } from "@/src/context/CustomHook";
import { SelectionCustom } from "../Pagination_Component";
import { Checkbox } from "@heroui/react";
import { motion } from "framer-motion";

// Constants and types
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
};

const ANIMATION_PROPS = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 1, ease: "easeInOut" },
};

// Memoized FormWrapper component
export const FormWrapper = memo(
  ({
    children,
    step,
    order_id,
  }: {
    children: ReactNode;
    step: number;
    order_id: string;
  }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const handleProcceed = useCallback(() => {
      const getStep = STEPS_INITIAL.find((i) => i.step === step);
      if (!getStep) {
        return null;
      }
      const nextStep = step < 4 ? step + 1 : step;
      const current = new URLSearchParams(searchParams);
      current.set("step", nextStep.toString());

      router.push(`${pathname}?${current.toString()}`, { scroll: false });
      router.refresh();
    }, [pathname, router, searchParams, step]);

    const handleSubmit = useCallback(
      async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setLoading(true);
        try {
          const isShipping = event.currentTarget["shipping"];
          const isSaved = event?.currentTarget["save"]?.value;

          if (isShipping) {
            const isSelected = event.currentTarget["selected_address"];
            const value = parseInt(isSelected.value);

            if (value !== -1) {
              const request = await handleShippingAdddress(
                order_id,
                value,
                undefined,
                isSaved
              );

              if (!request.success) {
                errorToast(request.message ?? "Error occurred");
                return;
              }
            } else {
              const formData = new FormData(event.currentTarget);
              const allData = Object.fromEntries(formData.entries());

              if (Object.keys(allData).length === 0) {
                errorToast("Missing Information");
                return;
              }

              const request = await handleShippingAdddress(
                order_id,
                undefined,
                allData as unknown as Address,
                isSaved
              );

              if (!request.success) {
                errorToast(request.message ?? "Error occurred");
                return;
              }
            }
          }

          handleProcceed();
        } catch (error) {
          console.error("Form submission error:", error);
          errorToast("An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      },
      [order_id, handleProcceed]
    );

    const formClassName = useMemo(
      () => `
    checked_body w-full h-fit flex flex-row justify-center gap-x-5 
    max-smaller_screen:justify-between max-smaller_screen:pl-1 max-smaller_screen:pr-1
    max-small_tablet:flex-col max-small_tablet:gap-y-5
  `,
      []
    );

    return (
      <form onSubmit={handleSubmit} className={formClassName}>
        {loading && <LoadingText />}
        {children}
      </form>
    );
  }
);

FormWrapper.displayName = "FormWrapper";

// Memoized SelectionSSR component
export const SelectionSSR = memo(
  ({
    selectedvalue = "",
    data,
  }: {
    selectedvalue?: string;
    data: Array<{ label: string; value: number }>;
  }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const current = new URLSearchParams(searchParams);
        current.set("selectedaddress", e.target.value);
        router.push(`${pathname}?${current.toString()}`);
      },
      [pathname, router, searchParams]
    );

    return (
      <select
        onChange={handleChange}
        value={selectedvalue}
        className="select__container border-1 border-black rounded-md w-full h-full p-2"
        aria-label="Select address"
      >
        <option value="">None</option>
        {data.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    );
  }
);

SelectionSSR.displayName = "SelectionSSR";

// Memoized ShippingForm component
export const ShippingForm = memo(({ orderid }: { orderid: string }) => {
  const [addresses, setAddresses] = useState<Addresstype[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] =
    useState<Addresstype>(SHIPPING_INITIAL);
  const [selectedId, setSelectedId] = useState(0);
  const [saveForFuture, setSaveForFuture] = useState(0);

  // Fetch addresses once when component mounts
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

  // Handle input changes
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedAddress((prev) => ({ ...prev, id: -1, [name]: value }));
  }, []);

  // Handle address selection
  const handleSelect = useCallback(
    async (value: number) => {
      setSelectedId(value);

      if (value === 0) {
        setSelectedAddress(SHIPPING_INITIAL);
        setLoading(true);
        try {
          const updateResult = await ApiRequest({
            url: "/api/order",
            method: "PUT",
            data: { id: orderid, ty: "removeAddress" },
          });

          if (!updateResult.success) {
            errorToast("Can't Update Address");
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
        // Custom address mode, clear form
        setSelectedAddress({ ...SHIPPING_INITIAL, id: -1 });
        return;
      }

      // Find and set the selected address
      const found = addresses.find((addr) => addr.id === value);
      if (found) {
        setSelectedAddress(found);
      }
    },
    [addresses, orderid]
  );

  // Prepare address selection options
  const addressOptions = useMemo(
    () => [
      { label: "None", value: 0 },
      ...addresses.map((addr, idx) => ({
        label: `Address ${idx + 1}`,
        value: addr.id,
      })),
      { label: "Custom", value: -1 },
    ],
    [addresses]
  );

  // Calculate display label for current selection
  const addressDisplayLabel = useMemo(() => {
    if (!selectedAddress || selectedId === 0) return "None";

    const index = addresses.findIndex((addr) => addr.id === selectedAddress.id);
    return index >= 0 ? `Address ${index + 1}` : "Custom";
  }, [addresses, selectedAddress, selectedId]);

  return (
    <motion.div
      {...ANIMATION_PROPS}
      className="w-fit max-smaller_screen:w-full h-full flex flex-row gap-x-5"
    >
      <input type="hidden" name="shipping" value="shipping" />
      <div className="checkout_container bg-[#F1F1F1] w-[50vw] max-smaller_screen:w-full h-fit p-2 rounded-lg shadow-lg flex flex-col items-center">
        <h3 className="title text-2xl font-bold pb-5">Shipping Address</h3>

        <div className="shippingform w-[70%] max-large_phone:w-full h-fit p-2 flex flex-col gap-y-5 items-center">
          <SelectionCustom
            label="Address"
            placeholder={addressDisplayLabel}
            isLoading={loading}
            data={addressOptions}
            value={selectedId}
            onChange={(value) => handleSelect(value as number)}
          />

          <input
            type="hidden"
            name="selected_address"
            value={selectedAddress?.id ?? 0}
          />

          {selectedId !== 0 && (
            <>
              <div className="w-full h-fit flex flex-row items-center gap-x-5">
                <input
                  className="w-full h-[50px] p-1 font-medium text-sm"
                  placeholder="Firstname"
                  name="firstname"
                  value={selectedAddress?.firstname || ""}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full h-[50px] p-1 font-medium text-sm"
                  placeholder="Lastname"
                  name="lastname"
                  value={selectedAddress?.lastname || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              {[
                { name: "street", placeholder: "Street Name or Id" },
                { name: "houseId", placeholder: "House or Apartment Id" },
                { name: "province", placeholder: "Province / State" },
                { name: "district", placeholder: "District" },
                { name: "songkhat", placeholder: "Songkhat" },
              ].map((field) => (
                <input
                  key={field.name}
                  className="w-full h-[50px] p-1 font-medium text-sm"
                  placeholder={field.placeholder}
                  name={field.name}
                  value={
                    selectedAddress?.[field.name as keyof Addresstype] || ""
                  }
                  onChange={handleChange}
                  required
                />
              ))}

              <div className="flex flex-row w-full h-fit gap-x-5">
                <input
                  className="w-full h-[50px] p-1 font-medium text-sm"
                  placeholder="Postal code"
                  name="postalcode"
                  value={selectedAddress?.postalcode || ""}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full h-[50px] p-1 font-medium text-sm"
                  placeholder="Phone number (optional)"
                  name="phonenumber"
                  value={selectedAddress?.phonenumber || ""}
                  onChange={handleChange}
                />
              </div>

              <input type="hidden" name="save" value={saveForFuture} />
              <Checkbox
                aria-label="Save address for future use"
                content="Save for future use"
                onValueChange={(val) => setSaveForFuture(val ? 1 : 0)}
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ShippingForm.displayName = "ShippingForm";
