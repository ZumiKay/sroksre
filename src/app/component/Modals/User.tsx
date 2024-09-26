import { useGlobalContext, Userinitialize } from "@/src/context/GlobalContext";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { errorToast, successToast } from "../Loading";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import Modal, { SecondaryModal } from "../Modals";
import Image from "next/image";
import CloseIcon from "../../../../public/Image/Close.svg";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import PrimaryButton, { Selection } from "../Button";
import {
  Addaddress,
  Deleteaddress,
  Editprofileaction,
  VerifyEmail,
} from "../../dashboard/action";
import { signOut } from "next-auth/react";
import { PasswordInput, TextInput } from "../FormComponent";
import { CloseVector } from "../Asset";
import { listofprovinces } from "@/src/lib/utilities";
import { useRouter } from "next/navigation";
import { userdata } from "../../account/actions";
import { Skeleton } from "@nextui-org/react";

export const Createusermodal = ({
  setpage,
}: {
  setpage: React.Dispatch<React.SetStateAction<number>>;
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
      if (allData?.user) setdata(allData.user[globalindex.useredit]);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

    successToast(`User ${editindex === -1 ? "Created" : "Updated"}`);
    editindex === -1 && setdata(Userinitialize);
    setglobalindex((prev) => ({ ...prev, useredit: -1 }));
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
        <h3 className="text-lg font-semibold">
          {globalindex.useredit !== -1 ? `#${data.id}` : "Register User"}{" "}
        </h3>
      )}
      placement="top"
    >
      <div className="relative w-full max-small_phone:max-h-[50vh] h-fit bg-white p-5 flex flex-col items-end gap-y-5 rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="form_container w-full h-full flex flex-col items-center gap-y-5"
        >
          <TextInput
            type="text"
            placeholder="Firstname (Username if it prefered)"
            name="firstname"
            value={data.firstname}
            onChange={handleChange}
            required
          />
          <TextInput
            type="text"
            name="lastname"
            value={data.lastname}
            onChange={handleChange}
            placeholder="Lastname (optional)"
          />
          <TextInput
            type="email"
            placeholder="Email Address"
            value={data.email}
            onChange={handleChange}
            name="email"
            required
          />

          {globalindex.useredit === -1 && (
            <>
              <FormControl
                sx={{
                  m: 1,
                  width: "100%",
                  height: "50px",
                  borderRadius: "10px",
                }}
                variant="outlined"
              >
                <InputLabel
                  className="font-bold"
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
            </>
          )}

          <PrimaryButton
            color="#0097FA"
            text={globalindex.useredit === -1 ? "Create" : "Update"}
            status={loading ? "loading" : "authenticated"}
            type="submit"
            width="100%"
            height="50px"
            radius="10px"
          />
          {globalindex.useredit !== -1 && (
            <>
              <PrimaryButton
                color="lightcoral"
                text="Delete"
                type="button"
                disable={
                  allData?.user &&
                  allData.user[globalindex.useredit].role === "ADMIN"
                }
                onClick={() => handleDelete(data.id as number)}
                width="100%"
                height="50px"
                radius="10px"
              />{" "}
            </>
          )}
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
  houseId: number;
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
  const [open, setopen] = useState<any>({});

  const [loading, setloading] = useState({
    post: false,
    get: true,
    edit: false,
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

  const handleAdd = async (index: number) => {
    const formeddata = new FormData();

    let userdata = { ...data };

    const { shipping } = userdata;

    if (shipping && index >= 0 && index < shipping.length) {
      let selectedShipping = shipping[index];
      const isNotEmpty = Object.values(selectedShipping).some((val) => {
        return val?.toString().trim() !== "";
      });

      if (!isNotEmpty) {
        errorToast("All field is required");
        return;
      }

      Object.entries(selectedShipping).forEach(([key, value]) => {
        if (typeof value === "string") {
          formeddata.set(key, value);
        }
      });
      setloading((prev) => ({ ...prev, post: true }));

      const address = Addaddress.bind(
        null,
        formeddata,
        selectedShipping.isSaved,
        selectedShipping.id
      );

      const add = await address();

      if (add.success) {
        if (!selectedShipping.isSaved) {
          selectedShipping.id = add.data.id;
        }

        setdata(userdata);
        successToast(add.message as string);
      } else {
        errorToast(add.message as string);
      }
      setloading((prev) => ({ ...prev, post: false }));
    }
  };

  const Handleaddresschange = (
    e: ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const { name, value } = e.target;
    const result = { ...data };
    if (result.shipping) {
      let update = result.shipping[idx];
      update[name] = value as string;
    }
    setdata(result);
    setloading((prev) => ({ ...prev, edit: true }));
  };
  const handleRemove = async (index: number) => {
    const update = { ...data };
    let del = update.shipping;

    if (del && del[index].id) {
      const deletedaddress = Deleteaddress.bind(null, del[index].id as number);
      const deleted = await deletedaddress();
      if (!deleted.success) {
        errorToast("Error Occured");
        return;
      }
    }

    del?.splice(index, 1);
    setdata(update);
  };
  const fetchdata = async (ty: typeof type) => {
    let userdata = { ...data };

    let url = `/api/users/info?ty=${type}`;
    if (ty === "shipping") {
      let updateopen = { ...open };

      const request = await ApiRequest(
        url,
        undefined,
        "GET",
        undefined,
        undefined,
        "userinfo"
      );
      setloading((prev) => ({ ...prev, get: false }));
      if (request.success) {
        userdata.shipping = request.data;
        userdata.shipping?.forEach((i, idx) => {
          i.isSaved = true;

          updateopen[`sub${idx + 1}`] = false;
        });
        setopen(updateopen);
      }
    }

    setdata(userdata);
  };

  useEffect(() => {
    fetchdata(type);
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
        : formeddata.set(key, val)
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
      data.email.code
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
      size="2xl"
      open={openmodal.editprofile}
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, editprofile: val }))
      }
      placement="top"
      closebtn
    >
      <div className="editprofile_container relative flex flex-col items-center gap-y-5 w-full h-full max-small_phone:max-h-[50vh] overflow-y-auto bg-white rounded-lg p-3">
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
          <div className="relative w-full min-h-[20vh] max-h-[80vh]">
            {loading.get ? (
              <AddressSkeleton />
            ) : (
              <>
                {!data.shipping ||
                  (data.shipping.length === 0 && (
                    <h3 className="w-full h-fit text-lg font-bold text-gray-300 italic">
                      No shipping address
                    </h3>
                  ))}
                {data.shipping?.map((i, idx) => (
                  <div
                    key={idx}
                    className={`address_container relative p-3 mb-5 transition w-full min-h-[50px] rounded-lg h-fit hover:border hover:border-gray-400 ${
                      open ? (open[`sub${idx + 1}`] ? "bg-gray-700" : "") : ""
                    }`}
                  >
                    <h3
                      className={`title w-full h-full text-lg font-bold cursor-pointer ${
                        open ? (open[`sub${idx + 1}`] ? "text-white" : "") : ""
                      }`}
                      onClick={() => {
                        const update = Object.entries(open).map(
                          ([key, _]: any) => {
                            if (key === `sub${idx + 1}`) {
                              return [key, true];
                            } else {
                              return [key, false];
                            }
                          }
                        );

                        setopen(Object.fromEntries(update));
                      }}
                    >
                      Address {idx + 1}
                    </h3>

                    {open && open[`sub${idx + 1}`] && (
                      <>
                        <div className="addressform  rela  w-full h-fit flex flex-col items-center gap-y-5 p-5">
                          <span
                            onClick={() => {
                              const update = Object.entries(open).map(
                                ([key, value]: any) => {
                                  if (key === `sub${idx + 1}`) {
                                    return [key, !value];
                                  } else {
                                    return [key, false];
                                  }
                                }
                              );

                              setopen(Object.fromEntries(update));
                            }}
                            className="absolute top-1 right-1 transition hover:translate-x-1 "
                          >
                            <CloseVector width="25px" height="25px" />
                          </span>
                          <Selection
                            style={{ width: "100%", height: "50px" }}
                            default="Province / Cities"
                            name="province"
                            value={i.province}
                            onChange={(e) => {
                              let result = { ...data };
                              if (result.shipping) {
                                let shipping = result.shipping[idx];
                                shipping[e.target.name] = e.target.value;
                              }
                              setdata(result);
                            }}
                            data={listofprovinces}
                          />
                          <div className="w-full h-fit flex flex-row items-center gap-x-5">
                            <TextInput
                              name="firstname"
                              type="text"
                              onChange={(e) => Handleaddresschange(e, idx)}
                              value={i.firstname}
                              placeholder="Firstname"
                            />
                            <TextInput
                              name="lastname"
                              type="text"
                              onChange={(e) => Handleaddresschange(e, idx)}
                              value={i.lastname}
                              placeholder="Lastname"
                            />
                          </div>
                          <TextInput
                            name="street"
                            type="text"
                            onChange={(e) => Handleaddresschange(e, idx)}
                            value={i.street}
                            placeholder="Street Address"
                          />
                          <TextInput
                            name="houseId"
                            type="text"
                            onChange={(e) => Handleaddresschange(e, idx)}
                            value={i.houseId === 0 ? "" : i.houseId}
                            placeholder="House(73) or Apartment ID (13, Floor 2)"
                          />
                          <TextInput
                            name="district"
                            type="text"
                            value={i.district}
                            onChange={(e) => Handleaddresschange(e, idx)}
                            placeholder="District / Khan"
                          />
                          <TextInput
                            name="songkhat"
                            type="text"
                            value={i.songkhat}
                            onChange={(e) => Handleaddresschange(e, idx)}
                            placeholder="Songkhat / Commune"
                          />
                          <TextInput
                            name="postalcode"
                            type="text"
                            value={i.postalcode}
                            onChange={(e) => Handleaddresschange(e, idx)}
                            placeholder="Postalcode (12061)"
                          />

                          <div className="flex flex-row gap-x-5 w-full h-fit">
                            <PrimaryButton
                              type="submit"
                              text={i.isSaved ? "Update" : "Add"}
                              color="#0097FA"
                              width="100%"
                              height="50px"
                              radius="10px"
                              status={
                                loading.post ? "loading" : "authenticated"
                              }
                              disable={
                                !data.shipping ||
                                Object.entries(data.shipping[idx]).every(
                                  ([_, val]) => !val
                                )
                              }
                              onClick={() => handleAdd(idx)}
                            />
                            <PrimaryButton
                              type="button"
                              text={"Delete"}
                              onClick={() => handleRemove(idx)}
                              color="lightcoral"
                              width="100%"
                              height="50px"
                              radius="10px"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}{" "}
              </>
            )}
          </div>
        )}
        {type === "shipping" && (
          <i
            onClick={() => {
              let update = { ...data };
              let address = update.shipping;
              if (address && address?.length >= 5) {
                errorToast("Can Add Only 5 Address");
                return;
              }
              address?.push({
                firstname: "",
                lastname: "",
                street: "",
                province: "",
                district: "",
                songkhat: "",
                houseId: 0,
                postalcode: "",
                isSaved: false,
              });
              setopen((prev: any) => ({
                ...prev,
                [`sub${address?.length}`]: true,
              }));
              setdata(update);
            }}
            className={`fa-solid fa-circle-plus font-bold text-4xl text-[#495464] transition active:translate-y-2 `}
          ></i>
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

const AddressSkeleton = () => {
  return (
    <div className=" w-full flex flex-col items-start gap-y-3 h-fit">
      <Skeleton className="h-[50px] w-full rounded-lg" />
      <Skeleton className="h-[50px] w-full rounded-lg" />
      <Skeleton className="h-[50px] w-full rounded-lg" />
    </div>
  );
};
