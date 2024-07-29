"use client";
import { ChangeEvent, FormEvent, useState } from "react";

import PrimaryButton from "../component/Button";
import { Checkbox, FormControlLabel } from "@mui/material";
import { signIn } from "next-auth/react";
import { postRequest } from "@/src/lib/utilities";
import { errorToast, successToast } from "../component/Loading";
import { useRouter } from "next/navigation";
import { useGlobalContext, userdata } from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import ReactDOMServer from "react-dom/server";
import { CredentialEmail } from "../component/EmailTemplate";
import { SendVfyEmail } from "./actions";

export default function AuthenticatePage() {
  const { setisLoading, isLoading } = useGlobalContext();
  const [type, settype] = useState<"login" | "register" | "forget">("login");
  const [loading, setloading] = useState<
    "authenticated" | "loading" | "unauthenticated"
  >("unauthenticated");
  const [data, setdata] = useState<userdata>({
    email: "",
    password: "",
    agreement: false,
  });
  const [verify, setverify] = useState({
    email: false,
    cid: false,
  });
  const router = useRouter();
  const handleSumbit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (type === "login") {
      if (!data.email || !data.password) {
        errorToast("Fill in the required information ");
        return;
      }
      setloading("loading");

      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      }).then((res) => {
        setloading("authenticated");
        if (res?.ok) {
          successToast("Logged In");
          router.replace("/dashboard");
        }
        if (res?.error) {
          if (res.status === 401) {
            errorToast("Incorrect Informations");
            return;
          }
        }
      });
    } else {
      if (data.password === data.confirmpassword && data.agreement) {
        setloading("loading");

        const request = await postRequest("/api/auth/register", data);
        request && setloading("authenticated");

        if (request.status === 500) {
          const error = request.message;
          if (error === "false") {
            errorToast("Invalid Password");
          } else {
            errorToast(request.message);
          }
        } else if (request.message === "Registered") {
          successToast("Account Registered");
          settype("login");
        }
      } else if (!data.agreement) {
        errorToast("Please Check Our Policy");
      } else {
        errorToast("Invalid Confirm Passwords");
      }
    }
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name, checked } = e.target;
    setdata({ ...data, [name]: name === "agreement" ? checked : value });
  };
  const handleConfirm = async (types: "email" | "cid") => {
    const URL = `/api/users/vfy${types === "cid" ? `?cid=${data.cid}` : ""}`;
    setloading("loading");
    if (!data.email) {
      errorToast("Email Required");
      return;
    }

    const verifyreq = await ApiRequest(
      URL,
      undefined,
      types === "email" ? "POST" : "GET",
      "JSON",
      types === "email"
        ? type === "register"
          ? { email: data.email, type }
          : { email: data.email, type: type }
        : undefined
    );
    if (verifyreq.success) {
      const vfydata = verifyreq.data;
      const template = ReactDOMServer.renderToString(
        <CredentialEmail {...vfydata} />
      );
      const sendemail = SendVfyEmail.bind(
        null,
        template,
        data.email,
        `${type === "register" ? "Email Verification" : "Reset Password"}`
      );
      const makereq = await sendemail();
      setloading("authenticated");
      if (!makereq.success) {
        errorToast("Error occured");
        return;
      }
      if (type === "register") {
        setverify((prev) => ({ ...prev, [types]: true }));
        if (verifyreq.data) {
          setdata((prev) => ({ ...prev, id: verifyreq.data.id }));
        }
      }
      successToast("Please Check You Email");
      setdata((prev) => ({ ...prev, email: "" }));
    } else {
      errorToast(verifyreq.error ?? "Error Occured");
      type === "register" && setverify((prev) => ({ ...prev, [types]: false }));
    }
  };
  const handleBack = async () => {
    if (verify.email) {
      const deletecid = await ApiRequest(
        "/api/users/vfy",
        setisLoading,
        "DELETE",
        "JSON",
        { type: "email", email: data.email }
      );
      if (!deletecid.success) {
        errorToast("Error Occured");
        return;
      }
    }
    settype("login");
    setverify({ cid: false, email: false });
  };

  return (
    <div className="authentication__container flex flex-row gap-x-4 justify-between w-full min-h-[90vh] mt-4">
      <div className="banner__section w-full h-full"></div>

      <form
        onSubmit={handleSumbit}
        className="from__container bg-[#495464] flex text-lg flex-col justify-center items-center gap-y-10 w-full h-[100vh]"
      >
        {type === "register" && (!verify.cid || !verify.email) && (
          <div className="w-[80%] flex flex-col gap-y-5">
            {!verify.email ? (
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="email w-full p-3 rounded-md"
                value={data.email}
                onChange={handleChange}
                required
              />
            ) : (
              <input
                type="number"
                name="cid"
                value={data.cid}
                placeholder="Verify Code"
                className="email w-full p-3 rounded-md"
                onChange={handleChange}
              />
            )}
          </div>
        )}
        {type === "register" ? (
          <>
            {verify.email && verify.cid && (
              <>
                <input
                  type="text"
                  className="username w-[80%] p-3 rounded-md"
                  placeholder="Firstname"
                  name="firstname"
                  value={data.firstname}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  className="username w-[80%] p-3 rounded-md"
                  placeholder="Lastname"
                  name="lastname"
                  value={data.lastname}
                  onChange={handleChange}
                  required
                />
                <div className="w-full flex flex-col gap-y-2 items-center justify-center ">
                  {type === "register" &&
                    data.password &&
                    data.password?.length < 8 && (
                      <span className="text-sm font-bold text-red-300">
                        {" "}
                        Password Need to contains at least one Uppercase,
                        Special Character and has 8 in length{" "}
                      </span>
                    )}
                  <input
                    type="password"
                    name="password"
                    value={data.password}
                    className="password w-[80%] p-3 rounded-md"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                  />
                </div>
                <input
                  type="password"
                  value={data.confirmpassword}
                  name="confirmpassword"
                  className="confirm_password w-[80%] p-3 rounded-md"
                  placeholder="Confirm Password"
                  onChange={handleChange}
                  required
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={data.agreement}
                      onChange={handleChange}
                      className="checkbox w-fit"
                      name="agreement"
                    />
                  }
                  label=<h3
                    className="text-white"
                    style={{ color: data.agreement ? "white" : "pink" }}
                  >
                    {" "}
                    Agree to policy and agreement{" "}
                  </h3>
                />{" "}
              </>
            )}
            <div className="form_actions flex flex-col gap-y-5 w-[80%] ">
              {verify.cid && verify.email ? (
                <PrimaryButton
                  text="Create Account"
                  type="submit"
                  color="#3D788E"
                  width="100%"
                  height="70px"
                  radius="10px"
                  status={loading}
                />
              ) : (
                <PrimaryButton
                  type="button"
                  text={!verify.email ? "Next" : "Confirm"}
                  color="#3D788E"
                  width="100%"
                  height="70px"
                  radius="10px"
                  status={loading}
                  onClick={() => handleConfirm(!verify.email ? "email" : "cid")}
                />
              )}
              <PrimaryButton
                type="button"
                text="Back"
                color="#F08080"
                width="100%"
                height="70px"
                radius="10px"
                status={isLoading.DELETE ? "loading" : "authenticated"}
                onClick={() => handleBack()}
              />
            </div>
          </>
        ) : (
          <>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="email w-[80%] p-3 rounded-md"
              value={data.email}
              onChange={handleChange}
              required
            />
            {type === "login" && (
              <>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="email w-[80%] p-3 rounded-md"
                  onChange={handleChange}
                />

                <label
                  onClick={() => {
                    settype("forget");
                  }}
                  className="text-md font-normal text-sm relative -right-[28%] underline text-white hover:text-black"
                >
                  Forget Password?
                </label>
                <div className="form_actions flex flex-col gap-y-5 w-[80%] ">
                  <PrimaryButton
                    type="submit"
                    text="Login"
                    color="#438D86"
                    width="100%"
                    height="70px"
                    radius="10px"
                    status={loading}
                  />

                  <PrimaryButton
                    type="button"
                    text="Register"
                    color="#3D788E"
                    width="100%"
                    height="70px"
                    radius="10px"
                    onClick={() => settype("register")}
                  />
                  <div className="signinWith__container w-full flex flex-row justify-between items-center gap-x-2">
                    <PrimaryButton
                      type="button"
                      text="Signin with Discord"
                      width="50%"
                      color="black"
                      height="70px"
                      radius="10px"
                      Icon={
                        <i className="fa-brands fa-discord text-lg text-blue-900"></i>
                      }
                      onClick={() => signIn("discord")}
                    />
                    <PrimaryButton
                      type="button"
                      text="Signin with Gmail"
                      hoverColor="black"
                      hoverTextColor="white"
                      width="50%"
                      height="70px"
                      color="white"
                      textcolor="black"
                      radius="10px"
                      onClick={() => signIn("google")}
                      Icon={
                        <i className="fa-brands fa-google text-lg text-red-600"></i>
                      }
                    />
                  </div>
                </div>
              </>
            )}
            {type === "forget" && (
              <>
                <PrimaryButton
                  type="button"
                  text="Verify"
                  color="#3D788E"
                  width="80%"
                  height="70px"
                  radius="10px"
                  onClick={() => handleConfirm("email")}
                  status={loading}
                />
                <PrimaryButton
                  type="button"
                  text="Back"
                  color="lightcoral"
                  width="80%"
                  height="70px"
                  radius="10px"
                  disable={loading === "loading"}
                  onClick={() => settype("login")}
                />
              </>
            )}
          </>
        )}
      </form>
    </div>
  );
}
