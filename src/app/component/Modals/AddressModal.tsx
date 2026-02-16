"use client";

import React, {
  ChangeEvent,
  useCallback,
  useMemo,
  useState,
  useEffect,
  memo,
} from "react";
import { CloseVector } from "../Asset";
import { Selection } from "../Button";
import { TextInput } from "../FormComponent";
import PrimaryButton from "../Button";
import { listofprovinces } from "@/src/lib/utilities";
import { Addaddress, Deleteaddress } from "../../dashboard/action";
import { errorToast, successToast } from "../Loading";
import { Skeleton } from "@heroui/react";
import { shippingtype } from "./User";
import { motion, AnimatePresence } from "framer-motion";

interface AddressModalProps {
  addresses: shippingtype[];
  onUpdate: (addresses: shippingtype[]) => void;
  isLoading: boolean;
}

const AddressItem = memo(
  ({
    address,
    index,
    isOpen,
    onToggle,
    onChange,
    onSave,
    onDelete,
    isLoading,
  }: {
    address: shippingtype;
    index: number;
    isOpen: boolean;
    onToggle: (index: number) => void;
    onChange: (e: ChangeEvent<HTMLInputElement>, idx: number) => void;
    onSave: (index: number) => Promise<void>;
    onDelete: (index: number) => Promise<void>;
    isLoading: boolean;
  }) => {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      setSaving(true);
      await onSave(index);
      setSaving(false);
    };

    const isEmpty = useMemo(() => {
      return Object.entries(address).every(([key, val]) => {
        if (key === "isSaved" || key === "id") return true;
        return !val || val === 0;
      });
    }, [address]);

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative rounded-xl overflow-hidden mb-4 transition-all duration-300 
        ${
          isOpen
            ? "bg-linear-to-br from-gray-800 to-gray-900 shadow-xl"
            : "bg-white border-2 border-gray-200 hover:border-gray-400 hover:shadow-md"
        }`}
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => onToggle(index)}
          className={`w-full px-6 py-4 flex items-center justify-between transition-colors
          ${isOpen ? "text-white" : "text-gray-800 hover:bg-gray-50"}
        `}
        >
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${isOpen ? "📍" : "📌"}`}>
              {isOpen ? "📍" : "📌"}
            </span>
            <div className="text-left">
              <h3 className="text-lg font-bold">Address {index + 1}</h3>
              {address.firstname && !isOpen && (
                <p className="text-sm opacity-75 mt-1">
                  {address.firstname} {address.lastname} - {address.province}
                </p>
              )}
            </div>
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl"
          >
            ▼
          </motion.span>
        </button>

        {/* Form Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-white rounded-b-xl">
                <button
                  type="button"
                  onClick={() => onToggle(-1)}
                  className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition-all z-10"
                  aria-label="Close"
                >
                  <CloseVector width="20px" height="20px" />
                </button>

                <div className="space-y-4 mt-4">
                  {/* Province Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Province / City *
                    </label>
                    <Selection
                      style={{ width: "100%", height: "50px" }}
                      default="Select Province"
                      name="province"
                      value={address.province}
                      onChange={(e) => {
                        const syntheticEvent = {
                          target: {
                            name: e.target.name,
                            value: e.target.value,
                          },
                        } as ChangeEvent<HTMLInputElement>;
                        onChange(syntheticEvent, index);
                      }}
                      data={listofprovinces}
                    />
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                      </label>
                      <TextInput
                        name="firstname"
                        type="text"
                        onChange={(e) => onChange(e, index)}
                        value={address.firstname}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <TextInput
                        name="lastname"
                        type="text"
                        onChange={(e) => onChange(e, index)}
                        value={address.lastname}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address
                    </label>
                    <TextInput
                      name="street"
                      type="text"
                      onChange={(e) => onChange(e, index)}
                      value={address.street}
                      placeholder="Enter street address"
                    />
                  </div>

                  {/* House ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      House / Apartment ID *
                    </label>
                    <TextInput
                      name="houseId"
                      type="text"
                      onChange={(e) => onChange(e, index)}
                      value={address.houseId === 0 ? "" : address.houseId}
                      placeholder="e.g., House 73 or Apt 13, Floor 2"
                    />
                  </div>

                  {/* District and Songkhat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        District / Khan *
                      </label>
                      <TextInput
                        name="district"
                        type="text"
                        value={address.district}
                        onChange={(e) => onChange(e, index)}
                        placeholder="Enter district"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sangkat / Commune *
                      </label>
                      <TextInput
                        name="songkhat"
                        type="text"
                        value={address.songkhat}
                        onChange={(e) => onChange(e, index)}
                        placeholder="Enter sangkat"
                      />
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <TextInput
                      name="postalcode"
                      type="text"
                      value={address.postalcode}
                      onChange={(e) => onChange(e, index)}
                      placeholder="e.g., 12061"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <PrimaryButton
                      type="button"
                      text={address.isSaved ? "✓ Update" : "+ Add"}
                      color={address.isSaved ? "#10b981" : "#0097FA"}
                      width="100%"
                      height="50px"
                      radius="10px"
                      status={saving ? "loading" : "authenticated"}
                      disable={isEmpty}
                      onClick={handleSave}
                    />
                    <PrimaryButton
                      type="button"
                      text="🗑 Delete"
                      onClick={() => onDelete(index)}
                      color="#ef4444"
                      width="100%"
                      height="50px"
                      radius="10px"
                      disable={saving}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

AddressItem.displayName = "AddressItem";

export const AddressModal = memo(
  ({ addresses, onUpdate, isLoading }: AddressModalProps) => {
    const [localAddresses, setLocalAddresses] =
      useState<shippingtype[]>(addresses);
    const [openIndex, setOpenIndex] = useState<number>(-1);

    useEffect(() => {
      setLocalAddresses(addresses);
    }, [addresses]);

    const handleToggle = useCallback((index: number) => {
      setOpenIndex((prev) => (prev === index ? -1 : index));
    }, []);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>, idx: number) => {
        const { name, value } = e.target;
        setLocalAddresses((prev) => {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], [name]: value };
          return updated;
        });
      },
      []
    );

    const handleSave = useCallback(
      async (index: number) => {
        const selectedAddress = localAddresses[index];

        const isNotEmpty = Object.entries(selectedAddress).some(
          ([key, val]) => {
            if (key === "isSaved" || key === "id") return false;
            return val?.toString().trim() !== "";
          }
        );

        if (!isNotEmpty) {
          errorToast("All fields are required");
          return;
        }

        const formData = new FormData();
        Object.entries(selectedAddress).forEach(([key, value]) => {
          if (
            key !== "isSaved" &&
            key !== "save" &&
            typeof value !== "undefined"
          ) {
            formData.set(key, value.toString());
          }
        });

        const address = Addaddress.bind(
          null,
          formData,
          selectedAddress.isSaved,
          selectedAddress.id
        );

        const result = await address();

        if (result.success) {
          const updated = [...localAddresses];
          if (!selectedAddress.isSaved) {
            updated[index] = {
              ...updated[index],
              id: result.data.id,
              isSaved: true,
            };
          }
          setLocalAddresses(updated);
          onUpdate(updated);
          successToast(result.message as string);
          setOpenIndex(-1);
        } else {
          errorToast(result.message as string);
        }
      },
      [localAddresses, onUpdate]
    );

    const handleDelete = useCallback(
      async (index: number) => {
        const addressToDelete = localAddresses[index];

        if (addressToDelete.id) {
          const deleteAddress = Deleteaddress.bind(
            null,
            addressToDelete.id as number
          );
          const result = await deleteAddress();
          if (!result.success) {
            errorToast("Error occurred while deleting");
            return;
          }
          successToast("Address deleted successfully");
        }

        const updated = localAddresses.filter((_, idx) => idx !== index);
        setLocalAddresses(updated);
        onUpdate(updated);
        setOpenIndex(-1);
      },
      [localAddresses, onUpdate]
    );

    const handleAddNew = useCallback(() => {
      if (localAddresses.length >= 5) {
        errorToast("Maximum 5 addresses allowed");
        return;
      }

      const newAddress: shippingtype = {
        firstname: "",
        lastname: "",
        street: "",
        province: "",
        district: "",
        songkhat: "",
        houseId: 0,
        postalcode: "",
        isSaved: false,
      };

      const updated = [...localAddresses, newAddress];
      setLocalAddresses(updated);
      setOpenIndex(updated.length - 1);
    }, [localAddresses]);

    if (isLoading) {
      return <AddressSkeleton />;
    }

    return (
      <div className="relative w-full h-fit">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Shipping Addresses
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your delivery addresses (Maximum 5)
          </p>
        </div>

        {/* Address List */}
        <div className="space-y-3">
          {localAddresses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg font-medium">
                No shipping addresses
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Add your first address to get started
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {localAddresses.map((address, index) => (
                <AddressItem
                  key={address.id || `new-${index}`}
                  address={address}
                  index={index}
                  isOpen={openIndex === index}
                  onToggle={handleToggle}
                  onChange={handleChange}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  isLoading={isLoading}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Add New Button */}
        {localAddresses.length < 5 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleAddNew}
            className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-xl 
            hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">
                ➕
              </span>
              <span className="text-lg font-semibold text-gray-600 group-hover:text-blue-600">
                Add New Address
              </span>
            </div>
          </motion.button>
        )}
      </div>
    );
  }
);

AddressModal.displayName = "AddressModal";

const AddressSkeleton = () => {
  return (
    <div className="w-full flex flex-col items-start gap-4 h-fit">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
};
