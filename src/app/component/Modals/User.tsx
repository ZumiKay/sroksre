import { useGlobalContext, Userinitialize } from "@/src/context/GlobalContext";
import React, { ChangeEvent, SubmitEvent, useEffect, useState } from "react";
import { errorToast, successToast } from "../Loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faTrash,
  faPlus,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import {
  ApiRequest,
  useDetectKeyboardOpen,
  useScreenSize,
} from "@/src/context/CustomHook";
import { SecondaryModal } from "../Modals";

import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import PrimaryButton from "../Button";
import { Editprofileaction, VerifyEmail } from "../../dashboard/action";
import { signOut } from "next-auth/react";
import { PasswordInput, TextInput } from "../FormComponent";
import { useRouter } from "next/navigation";
import { userdata } from "../../account/actions";
import { AddressModal } from "./AddressModal";

export const Createusermodal = ({
  setpage,
  onSuccess,
}: {
  setpage: React.Dispatch<React.SetStateAction<number>>;
  onSuccess?: () => void;
}) => {
  const { allData, globalindex, setglobalindex, openmodal, setopenmodal } =
    useGlobalContext();
  const [data, setdata] = useState<userdata>(Userinitialize);
  const [showpass, setshowpass] = useState({
    passowrd: false,
  });
  const [loading, setloading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (globalindex.useredit !== -1) {
      if (allData?.user) {
        const data = Object.entries({
          ...allData?.user?.[globalindex.useredit],
        }).map(([i, value]) => {
          if (!value) {
            return [i, i === "id" ? 0 : ""];
          }
          return [i, value];
        });
        const dataObj = Object.fromEntries(data);

        setdata(dataObj);
      }
    }
  }, []);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const editindex = globalindex.useredit;

    const URL = "/api/auth/register";
    const method = editindex === -1 ? "POST" : "PUT";

    if (editindex !== -1) {
      delete data.password;
      delete data.confirmpassword;
    }

    //register User
    setloading(true);
    const register = await ApiRequest(URL, undefined, method, "JSON", data);
    setloading(false);
    if (!register.success) {
      errorToast(register.error ?? "Failed to register");
      return;
    }

    successToast(
      `User ${editindex === -1 ? "Created" : "Updated"} Successfully`,
    );
    editindex === -1 && setdata(Userinitialize);
    setglobalindex((prev) => ({ ...prev, useredit: -1 }));
    setopenmodal((prev) => ({ ...prev, createUser: false }));

    // Call onSuccess callback to refetch data
    if (onSuccess) {
      onSuccess();
    }

    router.refresh();
  };
  const handleCancel = () => {
    setopenmodal((prev) => ({ ...prev, createUser: false }));
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setdata((prev) => ({ ...prev, [name]: value }));
  };
  const handleDelete = (id: number) => {
    setopenmodal((prev) => ({
      ...prev,
      confirmmodal: {
        open: true,
        confirm: false,
        closecon: "createUser",
        index: id,
        type: "user",
        onDelete: () => setpage(1),
      },
    }));
  };
  return (
    <SecondaryModal
      size="5xl"
      open={openmodal.createUser}
      onPageChange={(val) => {
        setglobalindex((prev) => ({ ...prev, useredit: -1 }));
        setopenmodal((prev) => ({ ...prev, createUser: val }));
      }}
      closebtn
      header={() => (
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faUserPlus} className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {globalindex.useredit !== -1 ? "Edit User" : "Create New User"}
            </h3>
            {globalindex.useredit !== -1 && (
              <p className="text-sm text-gray-500">User ID: #{data.id}</p>
            )}
          </div>
        </div>
      )}
      placement="top"
    >
      <div className="relative w-full max-small_phone:max-h-[50vh] h-fit bg-linear-to-br from-gray-50 to-white p-6 md:p-8 flex flex-col items-end gap-y-6 rounded-xl">
        <form
          onSubmit={handleSubmit}
          className="form_container w-full h-full flex flex-col items-center gap-y-5"
        >
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <TextInput
              type="text"
              placeholder="Enter first name or username"
              name="firstname"
              value={data.firstname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Name
            </label>
            <TextInput
              type="text"
              name="lastname"
              value={data.lastname}
              onChange={handleChange}
              placeholder="Enter last name (optional)"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <TextInput
              type="email"
              placeholder="user@example.com"
              value={data.email}
              onChange={handleChange}
              name="email"
              required
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              User Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={data.role || "USER"}
              onChange={(e) =>
                setdata((prev) => ({ ...prev, role: e.target.value }) as never)
              }
              disabled={globalindex.useredit !== -1 && data.role === "ADMIN"}
              className="w-full h-12.5 px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all bg-white text-gray-800 font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100"
              required
            >
              <option value="USER">User - Regular Customer</option>
              <option value="EDITOR">Editor - Content Manager</option>
              <option value="ADMIN">Admin - Full Access</option>
            </select>
            <p className="text-xs text-gray-500 mt-1.5">
              {data.role === "ADMIN" && globalindex.useredit !== -1
                ? "🔒 Admin role cannot be changed"
                : data.role === "ADMIN"
                  ? "⚠️ Admin has full system access"
                  : data.role === "EDITOR"
                    ? "✏️ Editor can manage content and products"
                    : "👤 User can browse and purchase"}
            </p>
          </div>

          {data.phonenumber !== undefined && (
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <TextInput
                type="tel"
                name="phonenumber"
                value={data.phonenumber || ""}
                onChange={handleChange}
                placeholder="+855 12 345 678"
              />
            </div>
          )}

          {globalindex.useredit === -1 && (
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <FormControl
                sx={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "12px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                }}
                variant="outlined"
              >
                <InputLabel
                  className="font-semibold"
                  htmlFor="outlined-adornment-password"
                >
                  Password
                </InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  name="password"
                  type={showpass.passowrd ? "text" : "password"}
                  onChange={handleChange}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() =>
                          setshowpass((prev) => ({
                            ...prev,
                            passowrd: !prev.passowrd,
                          }))
                        }
                        edge="end"
                      >
                        {showpass.passowrd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                  required
                />
              </FormControl>
            </div>
          )}

          <div className="w-full pt-4 border-t border-gray-200 flex flex-col gap-3">
            <PrimaryButton
              color="#3B82F6"
              hoverColor="#2563EB"
              text={globalindex.useredit === -1 ? "Create User" : "Update User"}
              status={loading ? "loading" : "authenticated"}
              type="submit"
              width="100%"
              height="54px"
              radius="12px"
              textcolor="white"
              Icon={
                <FontAwesomeIcon
                  icon={globalindex.useredit === -1 ? faPlus : faSave}
                  className="text-base"
                />
              }
            />
            {globalindex.useredit !== -1 && (
              <PrimaryButton
                color="#EF4444"
                hoverColor="#DC2626"
                text="Delete User"
                type="button"
                textcolor="white"
                disable={
                  allData?.user &&
                  allData.user[globalindex.useredit].role === "ADMIN"
                }
                onClick={() => handleDelete(data.id as number)}
                width="100%"
                height="54px"
                radius="12px"
                Icon={<FontAwesomeIcon icon={faTrash} className="text-base" />}
              />
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="w-full h-[54px] rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-all duration-200 hover:border-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </SecondaryModal>
  );
};
export interface editprofiledata {
  name: {
    firstname: string;
    lastname?: string;
  };
  email: {
    newemail: string;
    verify: boolean;
    code?: string;
  };
  password: {
    oldpassword: string;
    newpassword: string;
  };
  shipping?: Array<shippingtype>;
  isLoading?: boolean;
}
export interface shippingtype {
  id?: number;
  firstname: string;
  lastname: string;
  street?: string;
  province: string;
  houseId: string;
  district: string;
  songkhat: string;
  postalcode: string;
  isSaved: boolean;
  save?: string;
  [key: string]: string | number | boolean | undefined;
}

export const EditProfile = ({
  type,
}: {
  type: "name" | "email" | "password" | "shipping" | "none";
}) => {
  const { isMobile } = useScreenSize();
  const isKeyboardOpen = useDetectKeyboardOpen();
  const [loading, setloading] = useState({
    post: false,
    get: true,
  });
  const { openmodal, setopenmodal, userinfo, setuserinfo } = useGlobalContext();
  const [data, setdata] = useState<editprofiledata>({
    name: {
      firstname: userinfo.firstname as string,
      lastname: userinfo.lastname as string,
    },
    email: { newemail: "", verify: false },
    password: { oldpassword: "", newpassword: "" },
    shipping: [],
  });

  const fetchdata = async (ty: typeof type) => {
    if (ty === "shipping") {
      const url = `/api/users/info?ty=${type}`;
      const request = await ApiRequest(
        url,
        undefined,
        "GET",
        undefined,
        undefined,
        "userinfo",
      );
      setloading((prev) => ({ ...prev, get: false }));
      if (request.success) {
        const addresses = request.data.map((addr: shippingtype) => ({
          ...addr,
          isSaved: true,
        }));
        setdata((prev) => ({ ...prev, shipping: addresses }));
      }
    }
  };

  useEffect(() => {
    if (type === "shipping") {
      fetchdata(type);
    }
  }, [type]);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.endsWith("name") || name.endsWith("email")) {
      const end = name.endsWith("name") ? "name" : "email";

      setdata((prev) => ({ ...prev, [end]: { ...prev[end], [name]: value } }));
      return;
    }
    setdata((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateuser = async () => {
    setloading((prev) => ({ ...prev, post: true }));
    const formeddata = new FormData();
    data.password = {
      newpassword: userinfo.newpassword as string,
      oldpassword: userinfo.oldpassword as string,
    };
    Object.entries(data).forEach(([key, val]) =>
      key === "name" || key === "password"
        ? formeddata.set(key, JSON.stringify(val))
        : formeddata.set(key, val),
    );
    const updaterequest = Editprofileaction.bind(null, formeddata, type);
    const update = await updaterequest();
    setloading((prev) => ({ ...prev, post: false }));
    if (!update.success) {
      errorToast(update.message as string);
      return;
    }

    if (type === "name") {
      setuserinfo((prev) => ({
        ...prev,
        firstname: data.name.firstname,
        lastname: data.name.lastname,
      }));
    }
    if (type === "password") {
      setuserinfo((prev) => ({ ...prev, newpassword: "", oldpassword: "" }));
      setopenmodal((prev) => ({
        ...prev,
        editprofile: false,
        alert: {
          text: "All signed in device will be logged out",
          open: true,
          action: () => signOut(),
        },
      }));
      return;
    }

    successToast(update.message as string);
  };

  const handleVerify = async () => {
    setloading((prev) => ({ ...prev, post: true }));
    const verifyrequest = VerifyEmail.bind(
      null,
      data.email.newemail,
      data.email.verify,
      data.email.code,
    );

    if (!data.email.verify) {
      const verified = await verifyrequest();
      setloading((prev) => ({ ...prev, post: false }));
      if (!verified.success) {
        errorToast(verified.message as string);
        return;
      }
      successToast(verified.message as string);
      setdata((prev) => ({ ...prev, email: { ...prev.email, verify: true } }));
    } else if (data.email.verify) {
      const verified = await verifyrequest();
      setloading((prev) => ({ ...prev, post: false }));
      if (!verified.success) {
        errorToast(verified.message as string);
        return;
      }
      const formeddata = new FormData();
      formeddata.set("email", data.email.newemail);
      const updaterequest = Editprofileaction.bind(null, formeddata, type);
      const update = await updaterequest();
      if (!update.success) {
        errorToast(update.message as string);
        return;
      }

      successToast(update.message as string);
      setopenmodal((prev) => ({
        ...prev,
        editprofile: false,
        alert: {
          open: true,
          text: "Logging Out",
          action: () => signOut(),
        },
      }));
    }
  };

  return (
    <SecondaryModal
      size={isMobile ? "full" : "2xl"}
      open={openmodal.editprofile}
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, editprofile: val }))
      }
      placement="top"
      closebtn
    >
      <div
        style={
          isKeyboardOpen && type === "shipping"
            ? { minHeight: "100vh" }
            : { minHeight: "100%" }
        }
        className="editprofile_container relative flex flex-col items-center gap-y-5 w-full h-full bg-white rounded-lg p-6"
      >
        {type === "name" && (
          <>
            <TextInput
              type="text"
              name="firstname"
              value={data.name.firstname}
              placeholder="Firstname"
              onChange={handleChange}
            />
            <TextInput
              type="text"
              name="lastname"
              value={data.name.lastname}
              placeholder="Lastname"
              onChange={handleChange}
            />
          </>
        )}
        {type === "email" && (
          <>
            {" "}
            <TextInput
              type="email"
              name="newemail"
              value={data.email.newemail}
              placeholder="New Email"
              onChange={handleChange}
            />
            <TextInput
              hidden={!data.email.verify}
              type="number"
              name="code"
              placeholder="Verify Code"
              onChange={handleChange}
            />
            <PrimaryButton
              type="button"
              text={data.email.verify ? "Update" : "Verify"}
              onClick={() => handleVerify()}
              status={loading.post ? "loading" : "authenticated"}
              width="100%"
              height="50px"
              radius="10px"
            />
          </>
        )}
        {type === "password" && (
          <>
            <PasswordInput
              type="userinfo"
              name="oldpassword"
              label="Old Password"
            />{" "}
            <PasswordInput
              type="userinfo"
              name="newpassword"
              label="New Password"
            />{" "}
          </>
        )}
        {type === "shipping" && (
          <AddressModal
            addresses={data.shipping || []}
            onUpdate={(updatedAddresses) => {
              setdata((prev) => ({ ...prev, shipping: updatedAddresses }));
            }}
            isLoading={loading.get}
          />
        )}

        {type !== "shipping" && type !== "email" && (
          <>
            <PrimaryButton
              type="button"
              text="Update"
              onClick={() => handleUpdateuser()}
              status={loading.post ? "loading" : "authenticated"}
              width="100%"
              height="50px"
              radius="10px"
            />
            <PrimaryButton
              type="button"
              text="Cancel"
              disable={Object.values(loading).some((i) => i)}
              onClick={() => {
                setopenmodal((prev) => ({ ...prev, editprofile: false }));
              }}
              color="lightcoral"
              width="100%"
              height="50px"
              radius="10px"
            />
          </>
        )}
      </div>
    </SecondaryModal>
  );
};
