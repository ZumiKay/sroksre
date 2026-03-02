"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Checkbox, FormControlLabel } from "@mui/material";
import { getAddress } from "@/src/app/checkout/action";
import { ApiRequest } from "@/src/context/CustomHook";
import { SelectionCustom } from "../Pagination_Component";
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
      {props.data.map((item, idx) => (
        <option key={idx} value={item.value}>
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
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const [save, setSave] = useState(0);
  const [selectedAddress, setSelectedAddress] =
    useState<Addresstype>(ADDRESS_INITIAL);

  const fetchAddresses = async () => {
    const fetch = await getAddress.bind(null, orderid)();
    if (fetch.selectedaddress) {
      setSelected(fetch.selectedaddress.shipping?.id ?? 0);
      setSelectedAddress(
        fetch.selectedaddress.shipping as unknown as Addresstype,
      );
    } else {
      setSelected(0);
    }
    setAddresses(fetch.address as unknown as Addresstype[]);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedAddress((prev) => ({ ...prev, id: -1, [name]: value }));
  };

  const handleSelect = async (value: number) => {
    setSelected(value);
    setSelectedAddress(ADDRESS_INITIAL);

    if (value === 0) {
      setLoading(true);
      const res = await ApiRequest("/api/order", undefined, "PUT", "JSON", {
        id: orderid,
        ty: "removeAddress",
      });
      setLoading(false);
      if (!res.success) {
        errorToast("Can't Update Address");
      }
      return;
    }

    if (value === -1) return;

    const found = addresses?.find((a) => a.id === value);
    if (found) setSelectedAddress(found);
  };

  const addressOptions = [
    { label: "None", value: 0 },
    ...(addresses?.map((a, idx) => ({
      label: `Address ${idx + 1}`,
      value: a.id,
    })) ?? []),
    { label: "Custom", value: -1 },
  ];

  const addressPlaceholder =
    addresses && selectedAddress
      ? `Address ${addresses.findIndex((a) => a.id === selectedAddress.id) + 1}`
      : "None";

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
          <SelectionCustom
            label="Address"
            placeholder={addressPlaceholder}
            isLoading={loading}
            data={addressOptions}
            value={selected}
            onChange={(value) => handleSelect(value as number)}
          />

          <input
            type="hidden"
            name="selected_address"
            value={selectedAddress?.id ?? 0}
          />

          {selected !== 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={INPUT_CLASS}
                  placeholder="First name"
                  name="firstname"
                  value={selectedAddress?.firstname}
                  onChange={handleFieldChange}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Last name"
                  name="lastname"
                  value={selectedAddress?.lastname}
                  onChange={handleFieldChange}
                  required
                />
              </div>

              <input
                className={INPUT_CLASS}
                placeholder="Street Name or ID"
                name="street"
                value={selectedAddress?.street}
                onChange={handleFieldChange}
                required
              />
              <input
                className={INPUT_CLASS}
                placeholder="House or Apartment ID"
                name="houseId"
                value={selectedAddress?.houseId}
                onChange={handleFieldChange}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={INPUT_CLASS}
                  placeholder="Province / State"
                  name="province"
                  value={selectedAddress?.province}
                  onChange={handleFieldChange}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="District"
                  name="district"
                  value={selectedAddress?.district}
                  onChange={handleFieldChange}
                  required
                />
              </div>

              <input
                className={INPUT_CLASS}
                placeholder="Songkhat / Commune"
                name="songkhat"
                value={selectedAddress?.songkhat}
                onChange={handleFieldChange}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={INPUT_CLASS}
                  placeholder="Postal code"
                  name="postalcode"
                  value={selectedAddress?.postalcode}
                  onChange={handleFieldChange}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Phone number (optional)"
                  name="phonenumber"
                />
              </div>

              <input type="hidden" name="save" value={save} />

              <div className="pt-4 border-t border-gray-200">
                <FormControlLabel
                  hidden={selected !== -1}
                  control={
                    <Checkbox
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
