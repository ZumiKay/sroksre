"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Checkbox, FormControlLabel } from "@mui/material";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../Loading";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Addresstype {
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

const ADDRESS_INITIAL: Addresstype = {
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

// -----------------------------------------------------------------------------
// Input field style constant
// -----------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400";

const SELECT_CLASS =
  "w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm bg-white text-gray-700 appearance-none cursor-pointer";

// -----------------------------------------------------------------------------
// SelectionSSR – URL-driven address selector (server-side routing)
// -----------------------------------------------------------------------------

export function SelectionSSR(props: {
  selectedvalue?: string;
  data: Array<{ label: string; value: number }>;
}) {
  // Kept for compatibility – use SelectionCustom for client-driven usage
  // This component drives address selection via URL search params
  return (
    <select
      value={props.selectedvalue}
      className="select__container border border-black rounded-md w-full h-full p-2"
      // onChange intentionally omitted: consumers should use SelectionCustom instead
    >
      <option value="">None</option>
      {props.data.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

// -----------------------------------------------------------------------------
// ShippingForm
// -----------------------------------------------------------------------------

export function ShippingForm({ orderid }: { orderid: string }) {
  const [addresses, setAddresses] = useState<Addresstype[] | undefined>(
    undefined,
  );
  const [isHydrating, setIsHydrating] = useState(true);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [selected, setSelected] = useState(0);
  const [save, setSave] = useState(0);
  const [selectedAddress, setSelectedAddress] =
    useState<Addresstype>(ADDRESS_INITIAL);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsHydrating(true);
        const fetch = await ApiRequest(
          `/api/order?ty=shipping&q=${orderid}`,
          undefined,
          "GET",
        );

        if (fetch.success && fetch.data) {
          const shippingAddress = fetch.data
            .shipping as unknown as Addresstype | null;
          if (shippingAddress?.id) {
            setSelected(shippingAddress.id);
            setSelectedAddress(shippingAddress);
          } else {
            setSelected(0);
            setSelectedAddress(ADDRESS_INITIAL);
          }
          setAddresses(fetch.data.addresses as unknown as Addresstype[]);
        } else {
          setSelected(0);
          setSelectedAddress(ADDRESS_INITIAL);
          setAddresses([]);
        }
      } catch (error) {
        errorToast("Unable to load addresses");
      } finally {
        setIsHydrating(false);
      }
    };

    fetchAddresses();
  }, [orderid]);

  const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedAddress((prev) => ({ ...prev, id: -1, [name]: value }));
  };

  const handleSelect = async (value: number) => {
    setSelected(value);

    if (value === -1) {
      setSelectedAddress({ ...ADDRESS_INITIAL, id: -1 });
      setSave(0);
      return;
    }

    if (value === 0) {
      setSelectedAddress(ADDRESS_INITIAL);
      setSave(0);
      try {
        setIsUpdatingAddress(true);
        const res = await ApiRequest("/api/order", undefined, "PUT", "JSON", {
          id: orderid,
          ty: "removeAddress",
        });

        if (!res.success) {
          errorToast("Can't Update Address");
        }
      } catch (error) {
        errorToast("Can't Update Address");
      } finally {
        setIsUpdatingAddress(false);
      }
      return;
    }

    const found = addresses?.find((a) => a.id === value);
    if (found) {
      setSelectedAddress(found);
      try {
        setIsUpdatingAddress(true);
        const res = await ApiRequest("/api/order", undefined, "PUT", "JSON", {
          id: orderid,
          ty: "setShipping",
          addressId: value,
        });
        if (!res.success) {
          errorToast("Can't Update Address");
        }
      } catch {
        errorToast("Can't Update Address");
      } finally {
        setIsUpdatingAddress(false);
      }
    }
  };

  const addressOptions = [
    { label: "None", value: 0 },
    ...(addresses?.map((a, idx) => ({
      label: `Address ${idx + 1}`,
      value: a.id,
    })) ?? []),
    { label: "Custom", value: -1 },
  ];

  const isLoading = isHydrating || isUpdatingAddress;
  const inputDisabled = isLoading;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      <input type="hidden" name="shipping" value="shipping" />
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-smaller_screen:p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-linear-to-b from-purple-600 to-purple-400 rounded-full" />
          <h3 className="text-3xl font-bold text-gray-800">Shipping Address</h3>
        </div>

        <div className="shippingform w-full space-y-6">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <select
              value={selected}
              onChange={(e) => handleSelect(parseInt(e.target.value, 10))}
              disabled={isLoading}
              className={`${SELECT_CLASS} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.5em 1.5em",
                paddingRight: "2.5rem",
              }}
            >
              {addressOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="hidden"
            name="selected_address"
            value={selectedAddress?.id ?? 0}
          />

          {selected !== 0 ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={INPUT_CLASS}
                  placeholder="First name"
                  name="firstname"
                  value={selectedAddress?.firstname}
                  onChange={handleFieldChange}
                  disabled={inputDisabled}
                  autoComplete="given-name"
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Last name"
                  name="lastname"
                  value={selectedAddress?.lastname}
                  onChange={handleFieldChange}
                  disabled={inputDisabled}
                  autoComplete="family-name"
                  required
                />
              </div>

              <input
                className={INPUT_CLASS}
                placeholder="Street Name or ID"
                name="street"
                value={selectedAddress?.street}
                onChange={handleFieldChange}
                disabled={inputDisabled}
                autoComplete="address-line1"
                required
              />
              <input
                className={INPUT_CLASS}
                placeholder="House or Apartment ID"
                name="houseId"
                value={selectedAddress?.houseId}
                onChange={handleFieldChange}
                disabled={inputDisabled}
                autoComplete="address-line2"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={INPUT_CLASS}
                  placeholder="Province / State"
                  name="province"
                  value={selectedAddress?.province}
                  onChange={handleFieldChange}
                  disabled={inputDisabled}
                  autoComplete="address-level1"
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="District"
                  name="district"
                  value={selectedAddress?.district}
                  onChange={handleFieldChange}
                  disabled={inputDisabled}
                  autoComplete="address-level2"
                  required
                />
              </div>

              <input
                className={INPUT_CLASS}
                placeholder="Songkhat / Commune"
                name="songkhat"
                value={selectedAddress?.songkhat}
                onChange={handleFieldChange}
                disabled={inputDisabled}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={INPUT_CLASS}
                  placeholder="Postal code"
                  name="postalcode"
                  value={selectedAddress?.postalcode}
                  onChange={handleFieldChange}
                  disabled={inputDisabled}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Phone number (optional)"
                  name="phonenumber"
                  value={selectedAddress?.phonenumber ?? ""}
                  onChange={handleFieldChange}
                  disabled={inputDisabled}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <input type="hidden" name="save" value={save} />

              {selected === -1 && (
                <div className="pt-4 border-t border-gray-200">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={save === 1}
                        onChange={(e) => setSave(e.target.checked ? 1 : 0)}
                        style={{ color: "#3B82F6" }}
                      />
                    }
                    label={
                      <span className="text-gray-700 font-medium">
                        Save address for future orders
                      </span>
                    }
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
