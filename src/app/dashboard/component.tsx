"use client";
import { renderToString } from "react-dom/server";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ProfileSideBarItems, UserState } from "@/src/context/GlobalType.type";
import {
  Badge,
  Button,
  CircularProgress,
  Divider,
  Form,
  Input,
  Skeleton,
} from "@heroui/react";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { AsyncSelection } from "../component/AsynSelection";
import { getBaseUrl, listofprovinces } from "@/src/lib/utilities";
import { Address } from "@prisma/client";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { errorToast, successToast } from "../component/Loading";
import { FetchDataForDashboard } from "./action";
import Image from "next/image";
import { SendVfyEmail } from "../account/actions";
import { CredentialEmail } from "../component/EmailTemplate";

export type ProfilePageType = "profile" | "wishlist" | "security" | "deletion";

interface ProfileSideBarProps {
  onSelect?: (val: string) => void;
  isSelected?: string;
}

export const ProfileSideBar = ({
  onSelect,
  isSelected,
}: ProfileSideBarProps) => {
  return (
    <aside className="sidebar_container min-w-[150px] w-[280px] max-large_tablet:w-1/2 min-h-full p-3 pr-0 bg-gray-200 flex flex-col gap-y-10 rounded-lg">
      {ProfileSideBarItems.map((item) => (
        <div
          style={
            isSelected === item.value
              ? {
                  backgroundColor: "white",
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : {}
          }
          className="sidecard w-full h-full flex flex-row gap-x-3 p-5 items-center font-bold hover:bg-incart active:bg-slate-400 
          hover:text-white active:text-white cursor-default rounded-lg"
          onClick={() => onSelect && onSelect(item.value as string)}
          key={item.value}
        >
          <Image
            width={25}
            height={25}
            alt="icon"
            src={item.icon}
            loading="lazy"
          />
          {item.label}
        </div>
      ))}
    </aside>
  );
};

const AddressForm = ({
  editdata,
  close,
}: {
  editdata?: number;
  close?: () => void;
}) => {
  const { user } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [address, setaddress] = useState<Partial<Address> | undefined>({
    firstname: user?.firstname,
    lastname: user?.lastname,
  });

  useEffect(() => {
    const asyncGetAddress = async () => {
      const makeRequest = await FetchDataForDashboard(
        `/api/users/info?ty=address&id=${editdata}`
      );
      if (!makeRequest) {
        return;
      }
      setaddress(makeRequest);
    };
    if (editdata && setloading) {
      Delayloading(asyncGetAddress, setloading, 1000);
    }
  }, [editdata]);
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setaddress((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (setloading) setloading(true);
    const makeRequest = await ApiRequest({
      url: "/api/users/info/address",
      method: editdata ? "PUT" : "POST",
      data: address,
    });
    if (setloading) setloading(false);
    if (!makeRequest.success) {
      errorToast(makeRequest.error ?? "Error Occured");
      return;
    }
    successToast(editdata ? "Address Updated" : "Address Created");
    setaddress(undefined);
  }, [address, editdata, setloading]);

  const handleCancel = useCallback(() => {
    if (close) close();
  }, [close]);
  return (
    <div className="adressform w-full h-fit flex flex-col items-center gap-y-5">
      {loading && <CircularProgress />}
      <div className="name w-full h-fit flex flex-row items-center gap-5">
        <Input
          value={address?.firstname}
          label="Firstname"
          labelPlacement="outside"
          placeholder="Fistname"
          name="firstname"
          size="md"
          fullWidth
          onChange={handleChange}
        />
        <Input
          value={address?.lastname}
          label="Lastname"
          labelPlacement="outside"
          placeholder="Lastname"
          name="lastname"
          size="md"
          fullWidth
          onChange={handleChange}
        />
      </div>
      <div className="info w-full h-fit flex flex-row items-center gap-x-3">
        <Input
          value={address?.houseId}
          name="houseId"
          label="House/Apt No"
          labelPlacement="outside"
          placeholder="No"
          isRequired
          onChange={handleChange}
          size="md"
        />
        <Input
          value={address?.street ?? undefined}
          label="Street"
          labelPlacement="outside"
          name="street"
          placeholder="Street"
          isRequired
          size="md"
          onChange={handleChange}
        />
      </div>
      <div className="areainfo w-full h-fit flex flex-row items-center gap-5">
        <Input
          label="District"
          labelPlacement="outside"
          name="district"
          size="md"
          value={address?.district}
          placeholder="District / Khan"
          isRequired
          onChange={handleChange}
        />
        <Input
          name="songkhat"
          label="Sangkat / Commune"
          labelPlacement="outside"
          size="md"
          value={address?.songkhat}
          placeholder="Sangkat / Commune"
          onChange={handleChange}
        />
      </div>
      <AsyncSelection
        type="normal"
        data={() => listofprovinces.map((i) => ({ label: i, value: i }))}
        option={{
          label: "Province / City",
          labelPlacement: "outside",
          placeholder: "select",
          fullWidth: true,
          selectedValue: address?.province ? [address?.province] : undefined,
          onValueChange: (e) =>
            handleChange({
              target: { name: "province", value: e.target.value },
            } as never),
        }}
      />
      <Input
        name="postalcode"
        label="Postal Code"
        labelPlacement="outside"
        placeholder="Postal Code"
        value={address?.postalcode}
        onValueChange={(val) =>
          handleChange({ target: { name: "postalcode", value: val } } as never)
        }
        size="md"
      />
      <div className="btn flex flex-row items-end gap-x-3">
        <Button
          isLoading={loading}
          onPress={handleSubmit}
          size="md"
          className=" bg-incart font-bold text-white"
        >
          {editdata ? "Update" : "Add"}
        </Button>
        <Button
          className="bg-red-400 font-bold text-white
        "
          onPress={() => handleCancel()}
          isDisabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

type profileactiontype =
  | "AddAddress"
  | "EditEmail"
  | "VerifyEmail"
  | "VerifyEmailOnly"
  | "EditInfo"
  | "Readonly"
  | "Done";
export const ProfileTab = () => {
  const { user, setuser } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [actionty, setactionty] = useState<profileactiontype>("Readonly");
  const [editaddress, seteditaddress] = useState<number | undefined>(undefined);
  const [temp, settemp] = useState<UserState | undefined>();

  useEffect(() => {
    async function fetchUser() {
      setloading(true);
      const makeRequest = await FetchDataForDashboard(
        "/api/users/info?ty=userinfo"
      );
      setloading(false);
      if (!makeRequest) {
        return;
      }
      setuser(makeRequest as UserState);
      settemp(makeRequest as UserState);
    }
    fetchUser();
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setloading(true);
      const editrequest = await ApiRequest({
        url: "/api/users/info",
        data: { ...user, ty: "userinfo" },
        method: "PUT",
      });
      setloading(false);
      if (!editrequest.success) {
        errorToast(editrequest.error ?? "Error Occured");
        return;
      }
      setactionty("Readonly");
      successToast("User Updated");
    },
    [user]
  );

  const handleAddressClick = useCallback((data: number) => {
    seteditaddress((prev) => (prev === data ? undefined : data));
  }, []);

  const handleCloseAddressForm = useCallback(() => {
    setactionty("Readonly");
    seteditaddress(undefined);
  }, []);

  const handleDeleteAddress = useCallback(
    (id: number) => {
      setuser(
        (prev) =>
          ({
            ...prev,
            addresses: prev?.addresses?.filter((i) => i.id !== id),
          } as never)
      );
    },
    [setuser]
  );
  const handleResetUser = useCallback(() => {
    setuser(temp);
    settemp(undefined);
  }, [setuser, temp]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setuser((prev) => ({ ...prev, [name]: value } as never));
  }, []);

  const handleEditEmail = useCallback(
    async (vfyExistEmail?: boolean) => {
      if (!user?.email) return;

      // Helper functions to reduce repetition
      const verifyEmail = async () => {
        const vfyReq = await ApiRequest({
          method: "PUT",
          url: "api/users/info",
          data: {
            ty: "email",
            email: user?.email,
          },
        });

        if (!vfyReq.success) {
          setloading(false);
          errorToast("Can't Verify Email");
          return null;
        }

        return vfyReq.data;
      };

      const sendVerificationEmail = async (
        template: string,
        subject: string
      ) => {
        const sendEmail = SendVfyEmail.bind(
          null,
          template,
          user.email,
          subject
        );

        const sendReq = await sendEmail();
        if (!sendReq.success) {
          errorToast("Error Occurred");
          return false;
        }
        return true;
      };

      // Handle verification link flow
      if (vfyExistEmail) {
        setactionty("VerifyEmailOnly");
        setloading(true);
        const verificationCode = await verifyEmail();

        if (!verificationCode) {
          setloading(false);
          return;
        }

        const baseUrl = getBaseUrl();

        const linkTemplate = renderToString(
          <CredentialEmail
            infotype="link"
            infovalue={`${baseUrl}/verify?vc=${verificationCode}`}
            warn="For Verification Only"
            message="Verify Email Through This Link"
          />
        );

        const sent = await sendVerificationEmail(
          linkTemplate,
          "Email Verification"
        );
        setloading(false);
        setactionty("Readonly");
        if (sent) successToast("Verify Code Sent");
        return;
      }

      // Handle different action types
      if (actionty !== "EditEmail") {
        setactionty("EditEmail");
        return;
      }

      if (actionty === "EditEmail") {
        setloading(true);

        const verificationCode = await verifyEmail();
        if (!verificationCode) {
          setloading(false);
          return;
        }

        const codeTemplate = renderToString(
          <CredentialEmail
            message="Verify your email"
            infotype="code"
            infovalue={verificationCode as string}
            warn="For Verification Only"
          />
        );

        const sent = await sendVerificationEmail(codeTemplate, "Verify Email");
        setloading(false);
        if (sent) successToast("Verification Sent");
      } else if (actionty === "VerifyEmail") {
        setloading(true);

        const updateEmail = await ApiRequest({
          method: "PUT",
          url: "/users/info",
          data: {
            ty: "vfyemail",
            code: user.code,
          },
        });

        setloading(false);

        if (!updateEmail.success) {
          errorToast(updateEmail.error ?? "Can't Verify Email");
          return;
        }

        successToast("Email Updated");
      }
    },
    [actionty, user?.code, user?.email]
  );

  const handleBackEmail = useCallback(() => {
    if (actionty === "EditEmail") {
      setactionty("Readonly");
      setuser((prev) => ({ ...prev, email: temp?.email } as never));
    } else if (actionty === "VerifyEmail") {
      setactionty("EditEmail");
    }
  }, [actionty, setuser, temp?.email]);

  return (
    <div className="w-full h-fit flex flex-col items-center gap-y-20">
      {actionty === "Readonly" && loading ? (
        <div className="w-full h-fit flex flex-col gap-y-5">
          {Array.from({ length: 5 }).map((i, idx) => (
            <Skeleton key={idx} className="w-full h-[50px] rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <Form
            onSubmit={handleSubmit}
            className="profile w-full h-fit flex flex-col items-center gap-y-10"
          >
            <div className="w-full h-fit flex flex-row items-center gap-x-5">
              <div className="w-[100px] h-fit">
                <p className="w-full text-left text-lg font-bold">User Info</p>
              </div>
              <div className="w-full h-fit flex flex-row items-center gap-3">
                <Button
                  type={actionty === "Done" ? "submit" : "button"}
                  onPress={() =>
                    setactionty((prev) =>
                      prev === "Readonly"
                        ? "EditInfo"
                        : prev === "EditInfo"
                        ? "Done"
                        : "Readonly"
                    )
                  }
                  style={
                    actionty === "EditInfo"
                      ? {}
                      : { backgroundColor: "lightcoral" }
                  }
                  size="sm"
                  className="text-white font-bold bg-incart self-start"
                  isLoading={actionty === "Done" && loading}
                >
                  {actionty === "EditInfo" ? "Done" : "Edit Info"}
                </Button>
                {JSON.stringify(temp) !== JSON.stringify(user) && (
                  <Button
                    size="sm"
                    color="success"
                    variant="solid"
                    className="font-bold"
                    isDisabled={actionty === "Readonly"}
                    onPress={() => handleResetUser()}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
            <Divider className="-mt-7" />

            <Input
              name="username"
              value={user?.username}
              label="Username"
              labelPlacement="outside"
              onChange={handleChange}
              placeholder="Username"
              isReadOnly={actionty === "Readonly"}
            />
            <div className="name flex flex-row w-full h-fit gap-3 max-small_phone:flex-wrap">
              <Input
                className="w-full h-full"
                name="firstname"
                label="Firstname"
                labelPlacement="outside"
                value={user?.firstname}
                onChange={handleChange}
                size="lg"
                isReadOnly={actionty === "Readonly"}
              />
              <Input
                className="w-full h-full"
                name="lastname"
                label="Lastname"
                labelPlacement="outside"
                value={user?.lastname}
                onChange={handleChange}
                size="lg"
                isReadOnly={actionty === "Readonly"}
              />
            </div>
            <Input
              fullWidth
              name="phonenumber"
              label="Phonenumber"
              labelPlacement="outside"
              placeholder="855023880880"
              type="number"
              value={user?.phonenumber}
              onChange={handleChange}
              size="lg"
              isReadOnly={actionty === "Readonly"}
            />
            <div className="Address_container w-full h-fit flex flex-col gap-y-5">
              <h3 className="text-lg">Address</h3>
              <div className="w-full min-h-[100px] h-fit border-2 border-gray-300 rounded-lg p-2 flex flex-row items-start gap-3 flex-wrap">
                {(!user?.addresses || user.addresses.length === 0) && (
                  <p className="text-md text-gray-300">No Address</p>
                )}
                {user?.addresses &&
                  user?.addresses?.map((address, idx) => (
                    <Badge
                      isInvisible={actionty !== "EditInfo"}
                      key={address.id}
                      content="-"
                      color="danger"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <div
                        key={address.id}
                        onClick={() => handleAddressClick(address.id)}
                        className="addresscard w-[150px] h-[50px] grid place-content-center rounded-lg font-bold border-2 border-incart  
                      hover:bg-incart hover:border-0 active:bg-incart active:border-0"
                        style={
                          address.id === editaddress
                            ? { backgroundColor: "lightgray" }
                            : {}
                        }
                      >
                        {`Location ${idx + 1}`}
                      </div>
                    </Badge>
                  ))}
              </div>

              {actionty === "Readonly" && loading && (
                <Skeleton className="w-full h-[100px] rounded-lg" />
              )}
              {actionty === "AddAddress" || editaddress ? (
                <AddressForm
                  editdata={editaddress}
                  close={() => handleCloseAddressForm()}
                />
              ) : (
                <Button
                  onPress={() => setactionty("AddAddress")}
                  size="sm"
                  className="bg-incart text-white font-bold max-w-xs"
                >
                  Add Address
                </Button>
              )}
            </div>
          </Form>

          <div className="Email_container w-full h-fit flex flex-col gap-y-5">
            <div className="w-full h-fit">
              <h3 className="w-full text-left">Email Address</h3>
              <Divider />
            </div>
            <Input
              type="email"
              size="lg"
              name="email"
              aria-label="email addresss"
              value={user?.email}
              onChange={handleChange}
              isDisabled={
                actionty !== "EditEmail" && actionty !== "VerifyEmail"
              }
            />
            {actionty === "VerifyEmail" && (
              <Input
                className="max-w-xs"
                type="text"
                size="sm"
                name="code"
                label="Code"
                labelPlacement="outside"
                aria-label="code"
                placeholder="Verify Code"
              />
            )}
            <div className="btn w-full h-fit flex flex-row gap-3">
              {!user?.isVerified && (
                <Button
                  onPress={() => handleEditEmail(true)}
                  className="bg-orange-300 font-bold text-white"
                  isLoading={!user?.isVerified && loading}
                  size="sm"
                >
                  Verify
                </Button>
              )}
              <Button
                size="sm"
                className="bg-incart text-white font-bold"
                onPress={() => handleEditEmail()}
                isLoading={
                  (actionty === "EditEmail" || actionty === "VerifyEmail") &&
                  loading
                }
              >
                {actionty === "VerifyEmail"
                  ? "Confirm"
                  : actionty === "EditEmail"
                  ? "Verify"
                  : "Edit"}
              </Button>
              {actionty === "VerifyEmail" ||
                (actionty === "EditEmail" && (
                  <Button
                    isDisabled={actionty !== "EditEmail"}
                    size="sm"
                    onPress={() => handleBackEmail()}
                    className="bg-red-400 font-bold text-white "
                  >
                    Back
                  </Button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const SecurityTab = () => {
  const { user, setuser, setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState(false);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setuser(
        (prev) => ({ ...prev, [e.target.name]: e.target.value } as never)
      );
    },
    [setuser]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setloading(true);
      const editRequest = await ApiRequest({
        url: "/api/users/info",
        method: "PUT",
        data: { ...user, ty: "password" },
      });
      setloading(false);
      if (!editRequest.success) {
        errorToast(editRequest.error ?? "Error Occured");
        return;
      }
      successToast("Password Updated");
      // Clear password fields after successful update
      setuser(
        (prev) =>
          ({
            ...prev,
            password: "",
            newpassword: "",
            confirmpassword: "",
          } as never)
      );
    },
    [user, setuser]
  );

  const asyncDeleteAcc = useCallback(async () => {
    setloading(true);
    const deleteRequest = await ApiRequest({
      url: "/api/users",
      method: "DELETE",
      data: { id: user?.id },
    });
    setloading(false);
    if (!deleteRequest.success) {
      errorToast(deleteRequest.error ?? "Error Occured");
      return;
    }
    successToast("Account Deleted");
  }, [user?.id]);

  const handleDeleteAcc = useCallback(() => {
    setopenmodal({
      confirmmodal: {
        open: true,
        onAsyncDelete: asyncDeleteAcc,
      },
    });
  }, [asyncDeleteAcc, setopenmodal]);

  const isPasswordValid = user?.newpassword && user?.newpassword.length >= 8;
  const isPasswordMatch = user?.newpassword === user?.confirmpassword;
  const isFormValid = user?.password && isPasswordValid && isPasswordMatch;

  return (
    <div className="security_tab w-full h-fit flex flex-col gap-y-8 p-6">
      <div className="header">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Security Settings
        </h1>
        <p className="text-gray-600">
          Manage your account security and privacy
        </p>
      </div>

      {/* Password Section */}
      <div className="password_section bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="section_header mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Change Password
          </h2>
          <p className="text-sm text-gray-600">
            Update your password to keep your account secure
          </p>
          <Divider className="mt-3" />
        </div>

        <Form
          onSubmit={handleSubmit}
          className="w-full h-fit flex flex-col gap-y-4"
        >
          <Input
            type="password"
            label="Current Password"
            labelPlacement="outside"
            placeholder="Enter your current password"
            fullWidth
            size="lg"
            value={user?.password}
            name="password"
            onChange={handleChange}
            variant="bordered"
            classNames={{
              input: "text-sm",
              label: "text-sm font-medium text-gray-700",
            }}
          />

          <Input
            fullWidth
            size="lg"
            type="password"
            name="newpassword"
            label="New Password"
            labelPlacement="outside"
            placeholder="Enter your new password (min 8 characters)"
            value={user?.newpassword}
            onChange={handleChange}
            variant="bordered"
            color={user?.newpassword && !isPasswordValid ? "danger" : "default"}
            errorMessage={
              user?.newpassword && !isPasswordValid
                ? "Password must be at least 8 characters"
                : ""
            }
            classNames={{
              input: "text-sm",
              label: "text-sm font-medium text-gray-700",
            }}
          />

          <Input
            fullWidth
            size="lg"
            type="password"
            label="Confirm New Password"
            labelPlacement="outside"
            placeholder="Confirm your new password"
            name="confirmpassword"
            value={user?.confirmpassword}
            onChange={handleChange}
            variant="bordered"
            color={
              user?.confirmpassword && !isPasswordMatch ? "danger" : "default"
            }
            errorMessage={
              user?.confirmpassword && !isPasswordMatch
                ? "Passwords do not match"
                : ""
            }
            classNames={{
              input: "text-sm",
              label: "text-sm font-medium text-gray-700",
            }}
          />

          <div className="flex justify-end mt-4">
            <Button
              isLoading={loading}
              type="submit"
              size="lg"
              isDisabled={!isFormValid}
              className="font-semibold text-white bg-incart hover:bg-incart/90 disabled:bg-gray-300 px-8"
            >
              Update Password
            </Button>
          </div>
        </Form>
      </div>

      {/* Danger Zone */}
      <div className="danger_section bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="section_header mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-1">
            Danger Zone
          </h2>
          <p className="text-sm text-red-600">
            Irreversible and destructive actions
          </p>
          <Divider className="mt-3 bg-red-200" />
        </div>

        <div className="delete_account_container bg-white rounded-lg border border-red-200 p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
          </div>

          <Button
            onPress={handleDeleteAcc}
            isLoading={loading}
            size="lg"
            className="font-semibold text-white bg-red-500 hover:bg-red-600 border-red-500"
            variant="solid"
          >
            Delete My Account
          </Button>
        </div>
      </div>
    </div>
  );
};
