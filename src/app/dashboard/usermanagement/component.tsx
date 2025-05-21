"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { PasswordInput } from "../../component/FormComponent";
import { SecondaryModal } from "../../component/Modals";
import { CircularProgress, Tab, Tabs } from "@heroui/react";
import { Address } from "@prisma/client";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../../component/Loading";

export const PasswordSection = () => {
  const { user, setuser } = useGlobalContext();
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    upperCase: false,
    lowerCase: false,
    number: false,
    specialChar: false,
  });

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  };

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setuser((prev) => ({ ...(prev ?? {}), [name]: value } as never));

      if (name === "password") {
        validatePassword(value);
      }
    },
    [setuser]
  );

  const isPasswordStrong = Object.values(passwordStrength).every(
    (check) => check === true
  );

  return (
    <div className="password_section w-full h-fit flex flex-col gap-y-5">
      <PasswordInput
        name="password"
        value={user?.password}
        onChange={handleChange}
        label="Password"
        labelPlacement="outside"
        size="md"
        isRequired
      />

      {/* Password strength indicators */}
      {user?.password && (
        <div className="password-strength-container mt-1 mb-3">
          <p className="text-sm font-semibold mb-2">Password must contain:</p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li
              className={
                passwordStrength.length ? "text-green-500" : "text-red-500"
              }
            >
              At least 8 characters
            </li>
            <li
              className={
                passwordStrength.upperCase ? "text-green-500" : "text-red-500"
              }
            >
              At least one uppercase letter
            </li>
            <li
              className={
                passwordStrength.lowerCase ? "text-green-500" : "text-red-500"
              }
            >
              At least one lowercase letter
            </li>
            <li
              className={
                passwordStrength.number ? "text-green-500" : "text-red-500"
              }
            >
              At least one number
            </li>
            <li
              className={
                passwordStrength.specialChar ? "text-green-500" : "text-red-500"
              }
            >
              At least one special character
            </li>
          </ul>

          {/* Overall strength indicator */}
          <div className="mt-2">
            <p className="text-sm">
              Password strength:
              <span
                className={
                  isPasswordStrong
                    ? "text-green-600 font-bold ml-1"
                    : "text-red-500 font-bold ml-1"
                }
              >
                {isPasswordStrong ? "Strong" : "Weak"}
              </span>
            </p>
          </div>
        </div>
      )}

      <PasswordInput
        name="confirmpassword"
        value={user?.confirmpassword}
        onChange={handleChange}
        label="Confirm Password"
        labelPlacement="outside"
        size="md"
        isRequired
      />

      {/* Password match indicator */}
      {user?.password && user?.confirmpassword && (
        <p
          className={`text-sm ${
            user?.password === user?.confirmpassword
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {user?.password === user?.confirmpassword
            ? "Passwords match"
            : "Passwords do not match"}
        </p>
      )}
    </div>
  );
};

const AddressTable = ({ addresses }: { addresses: Address[] }) => {
  return (
    <div className="w-full overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              First Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Last Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Street
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              House ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Province
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              District
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Songkhat
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Postal Code
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {addresses.map((address) => (
            <tr key={address.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.firstname}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.lastname}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.street || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.houseId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.province}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.district}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.songkhat}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {address.postalcode}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const UserDetailModel = () => {
  const { openmodal, setopenmodal, globalindex } = useGlobalContext();
  const [addresses, setaddresses] = useState<Address[]>();
  const [loading, setloading] = useState(false);

  useEffect(() => {
    async function fetchAddress() {
      setloading(true);
      const getReq = await ApiRequest({
        url: `/api/users/info?ty=shipping&uid=${globalindex.useredit}`,
        method: "GET",
      });
      setloading(false);

      if (!getReq.success) {
        errorToast("Can't Find Address");
        return;
      }
      setaddresses(getReq.data as Address[]);
    }
    fetchAddress();
  }, [globalindex.useredit]);

  return (
    <SecondaryModal
      onPageChange={() => {
        setopenmodal({});
      }}
      open={openmodal.userdetail ?? false}
      size="md"
    >
      <div className="flex w-full h-full flex-col min-h-[400px] items-center">
        {loading && <CircularProgress />}
        {!addresses || addresses.length === 0 ? (
          <p>No Address</p>
        ) : (
          <AddressTable addresses={addresses} />
        )}
      </div>
    </SecondaryModal>
  );
};
