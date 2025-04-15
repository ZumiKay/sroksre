"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SelectType, UserState } from "@/src/context/GlobalType.type";
import { Button, Divider, Form, Input, NumberInput } from "@heroui/react";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { AsyncSelection } from "../component/AsynSelection";
import { listofprovinces } from "@/src/lib/utilities";
import { Address } from "@prisma/client";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import {
  ContainerLoading,
  errorToast,
  successToast,
} from "../component/Loading";
import { FetchDataForDashboard } from "./action";

export type ProfilePageType = "profile" | "wishlist" | "security" | "deletion";

const ProfileSideBarItems: Readonly<Array<SelectType>> = Object.freeze([
  { label: "Profile", value: "profile" },
  { label: "Wishlist", value: "wishlist" },
  { label: "Security", value: "security" },
]);

interface ProfileSideBarProps {
  onSelect?: (val: string) => void;
}

export const ProfileSideBar = ({ onSelect }: ProfileSideBarProps) => {
  return (
    <aside className="sidebar_container w-[300px] h-full flex flex-col items-center gap-y-10 border-l-2 border-gray-300">
      {ProfileSideBarItems.map((item) => (
        <div
          className="sidecard w-full h-[40px] p-5 hover:bg-slate-400 active:bg-slate-400 cursor-default rounded-lg"
          onClick={() => onSelect && onSelect(item.value as string)}
          key={item.value}
        >
          {item.label}
        </div>
      ))}
    </aside>
  );
};

const AddressForm = ({
  editdata,
  close,
  loading,
  setloading,
}: {
  editdata?: Partial<Address>;
  close?: () => void;
  loading?: boolean;
  setloading?: (val: boolean) => void;
}) => {
  const [address, setaddress] = useState<Partial<Address> | undefined>(
    editdata
  );

  useEffect(() => {
    const asyncGetAddress = async () => {
      const makeRequest = await FetchDataForDashboard(
        `/api/users/info?ty=address&id=${editdata?.id}`
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

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (setloading) setloading(true);
      const makeRequest = await ApiRequest({
        url: "/api/users/info",
        method: "PUT",
        data: { ...address, ty: "address" },
      });
      if (setloading) setloading(false);
      if (!makeRequest.success) {
        errorToast(makeRequest.error ?? "Error Occured");
        return;
      }
      successToast(editdata ? "Address Updated" : "Address Created");
      setaddress(undefined);
    },
    [address, editdata, setloading]
  );

  const handleCancel = useCallback(() => {
    if (close) close();
  }, [close]);
  return (
    <Form
      onSubmit={handleSubmit}
      className="adressform w-full h-fit flex flex-col items-center gap-y-5"
    >
      <div className="name w-full h-fit flex flex-row items-center">
        <Input
          value={address?.firstname}
          name="firstname"
          size="sm"
          fullWidth
          onChange={handleChange}
        />
        <Input
          value={address?.lastname}
          name="lastname"
          size="sm"
          fullWidth
          onChange={handleChange}
        />
      </div>
      <div className="info w-full h-fit flex flex-row items-center gap-x-3">
        <Input
          value={address?.houseId}
          name="houseId"
          placeholder="HomeNo"
          isRequired
          size="sm"
        />
        <Input
          value={address?.street ?? undefined}
          name="street"
          placeholder="Street"
          isRequired
          size="sm"
          onChange={handleChange}
        />
      </div>
      <div className="areainfo">
        <Input
          name="district"
          size="sm"
          value={address?.district}
          placeholder="District"
          isRequired
          onChange={handleChange}
        />
        <Input
          name="songkat"
          size="sm"
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
          fullWidth: true,
          selectedValue: address?.province ? [address?.province] : undefined,
          onValueChange: (e) =>
            handleChange({
              target: { name: "province", value: e.target.value },
            } as never),
        }}
      />
      <NumberInput
        min={0}
        name="postalcode"
        label="Postal Code"
        labelPlacement="outside"
        isWheelDisabled
        value={Number(address?.postalcode)}
        onValueChange={(val) =>
          handleChange({ target: { name: "postalcode", value: val } } as never)
        }
        size="sm"
      />
      <div className="btn flex flex-row items-end gap-x-3">
        <Button
          isLoading={loading}
          type="submit"
          color="primary"
          className="font-bold text-white"
        >
          Add
        </Button>
        <Button
          className="bg-rose-400 font-bold text-whtie
        "
          onPress={() => handleCancel()}
          isDisabled={loading}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
};

type profileactiontype = "AddAddress" | "EditAddress" | "EditInfo" | "Readonly";
export const ProfileTab = () => {
  const { user, setuser } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [actionty, setactionty] = useState<profileactiontype>("Readonly");

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
      successToast("User Updated");
    },
    [user]
  );

  return (
    <div className="w-full h-fit flex flex-col items-center gap-y-5">
      {loading && <ContainerLoading />}
      <Form
        onSubmit={handleSubmit}
        className="profile w-full h-fit flex flex-col items-center gap-y-5"
      >
        <Button
          type={actionty === "EditInfo" ? "submit" : "button"}
          onPress={() => setactionty("EditInfo")}
          style={
            actionty === "EditInfo" ? {} : { backgroundColor: "lightcoral" }
          }
          className="bg_default w-[100px] h-[30px] text-white font-bold"
        >
          {actionty === "EditInfo" ? "Done" : "Edit Info"}
        </Button>
        <Input name="username" value={user?.username} />
        <div className="name flex flex-row w-full h-[40px]">
          <Input
            className="w-full h-full"
            name="firstname"
            value={user?.firstname}
            size="lg"
            isReadOnly={actionty === "Readonly"}
          />
          <Input
            className="w-full h-full"
            name="lastname"
            value={user?.firstname}
            size="lg"
            isReadOnly={actionty === "Readonly"}
          />
        </div>
        <div className="info flex flex-row w-full h-[40px]">
          <Input
            fullWidth
            name="email"
            type="email"
            label="Email"
            labelPlacement="outside"
            value={user?.email}
            size="lg"
            isReadOnly={actionty === "Readonly"}
          />
          <Input
            fullWidth
            name="phonenumber"
            label="Phonenumber"
            labelPlacement="outside"
            placeholder="855023880880"
            type="number"
            value={user?.phonenumber}
            size="lg"
            isReadOnly={actionty === "Readonly"}
          />
        </div>
      </Form>
      <div className="Address_container w-full h-fit ">
        <div className="w-full h-fit border-2 border-gray-300 rounded-lg p-2 flex flex-row items-start gap-3 flex-wrap">
          {user?.address?.map((address, idx) => (
            <div
              key={address.id}
              className="addresscard w-[150px] h-[50px] rounded-lg border-1 border-gray-300 hover:bg-blue-400 active:bg-blue-400"
            >
              {`Location ${idx + 1}`}
            </div>
          ))}
        </div>
        {actionty === "AddAddress" || actionty === "EditAddress" ? (
          <AddressForm
            editdata={
              actionty === "EditAddress"
                ? user?.address && user.address[0]
                : undefined
            }
            close={() => setactionty("Readonly")}
            loading={loading}
            setloading={setloading}
          />
        ) : (
          <Button
            onPress={() => setactionty("AddAddress")}
            color="primary"
            className="font-bold"
          >
            Add Address
          </Button>
        )}
      </div>
    </div>
  );
};

export const SecurityTab = () => {
  const { user, setuser } = useGlobalContext();
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
    },
    [user]
  );
  const handleDeleteAcc = async () => {
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
  };

  return (
    <div className="security_tab w-full h-fit flex flex-col items-center gap-y-5">
      <h1>Security</h1>
      <Divider />

      <h3>Password</h3>
      <Divider />
      <Form
        onSubmit={handleSubmit}
        className="w-full h-fit flex flex-col items-center gap-y-5"
      >
        <Input
          type="password"
          label="Current Password"
          fullWidth
          size="md"
          value={user?.password}
          onChange={handleChange}
        />
        <Input
          fullWidth
          size="md"
          type="password"
          label="New Password"
          value={user?.newpassword}
          onChange={handleChange}
        />
        <Input
          fullWidth
          size="md"
          type="password"
          label="Confirm Password"
          value={user?.confirmpassword}
          onChange={handleChange}
        />
        <Button
          isLoading={loading}
          type="submit"
          color="primary"
          size="sm"
          className="font-bold text-white self-end"
        >
          Change Password
        </Button>
      </Form>
      <h3>Delete Account</h3>
      <Divider className="bg-red-400" />
      <div className="w-full h-fit flex flex-col gap-y-5">
        <Button
          onPress={() => handleDeleteAcc()}
          isLoading={loading}
          fullWidth
          size="md"
          className="font-bold text-white bg-red-400"
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
};
