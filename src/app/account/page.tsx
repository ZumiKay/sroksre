"use client";
import { ChangeEvent, useState } from "react";
import PrimaryButton from "../component/Button";
import { Checkbox, FormControlLabel } from "@mui/material";
import { signIn } from "next-auth/react";
import { postRequest } from "@/src/lib/utilities";
import { errorToast, successToast } from "../component/Loading";
import { useRouter } from "next/navigation";
import {
  useGlobalContext,
  userdata,
  Userinitialize,
} from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import ReactDOMServer from "react-dom/server";
import { CredentialEmail } from "../component/EmailTemplate";
import { SendVfyEmail } from "./actions";
import { PasswordInput } from "../component/FormComponent";
import RecapchaContainer from "../component/RecaphaComponent";
import { VerifyRecapcha } from "../severactions/RecapchaAction";

const validatePassword = (password: string) => {
  return (
    password.length >= 8 &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password) &&
    /\d/.test(password)
  );
};
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
    recapcha: null,
  });
  const [verify, setverify] = useState({
    email: false,
    cid: false,
  });

  const router = useRouter();
  const handleLogin = async () => {
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
        router.refresh();
      }
      if (res?.error) {
        if (res.status === 401) {
          errorToast("Incorrect Informations");
          return;
        }
      }
    });
  };

  const handleRegisterUser = async () => {
    if (
      !data.password ||
      !data.firstname ||
      !data.confirmpassword ||
      !data.recapcha
    ) {
      errorToast("Fill in all required");
      return;
    }

    if (
      data.password &&
      data.password === data.confirmpassword &&
      data.agreement
    ) {
      if (!validatePassword(data.password)) {
        errorToast("Invalid Password");
        return;
      }

      setloading("loading");

      //verify bot
      const verify = VerifyRecapcha.bind(null, data.recapcha);
      const req = await verify();

      if (!req.success) {
        setloading("authenticated");
        errorToast("Invalid Recapcha");
        return;
      }

      const request = await postRequest("/api/auth/register", data);
      setloading("authenticated");

      if (request.status === 500) {
        const error = request.message;
        if (error === "false") {
          errorToast("Invalid Password");
        } else {
          errorToast(request.message);
        }
      } else if (request.message === "Registered") {
        successToast("Account Registered");
        setdata(Userinitialize);
        setverify({ email: false, cid: false });
        settype("login");
      }
    } else if (!data.agreement) {
      errorToast("Please Check Our Policy");
    } else {
      errorToast("Invalid Confirm Passwords");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name, checked } = e.target;
    setdata({ ...data, [name]: name === "agreement" ? checked : value });
  };
  const handleConfirm = async (types: "email" | "cid") => {
    const isEmailType = types === "email";
    const URL = `/api/users/vfy${types === "cid" ? `/${data.cid}` : ""}`;

    if (isEmailType && !data.email) {
      errorToast("Email Required");
      return setloading("authenticated");
    }

    setloading("loading");
    const requestBody = isEmailType ? { email: data.email, type } : undefined;
    const method = isEmailType ? "POST" : "GET";

    // Make API request
    const verifyreq = await ApiRequest(
      URL,
      undefined,
      method,
      "JSON",
      requestBody
    );

    if (types === "cid") setloading("authenticated");

    if (verifyreq.success) {
      const vfydata = verifyreq.data;

      if (isEmailType && data.email) {
        const emailSubject =
          type === "register" ? "Email Verification" : "Reset Password";
        const emailTemplate = ReactDOMServer.renderToString(
          <CredentialEmail {...vfydata} />
        );
        const sendemail = SendVfyEmail.bind(
          null,
          emailTemplate,
          data.email,
          emailSubject
        );

        const makereq = await sendemail();
        setloading("authenticated");

        if (!makereq.success) {
          errorToast("Error occurred");
          return;
        }

        successToast("Please Check Your Email");
        setdata((prev) => ({ ...prev, password: "", confirmpassword: "" }));
      }

      if (type === "register") {
        setverify((prev) => ({ ...prev, [types]: true }));
        if (vfydata?.id) setdata((prev) => ({ ...prev, id: vfydata.id }));
      }
    } else {
      // Handle error scenario
      setloading("authenticated");
      errorToast(verifyreq.error ?? "Error Occurred");

      if (type === "register") {
        setverify((prev) => ({ ...prev, [types]: false }));
      }
    }
  };

  const handleBack = async () => {
    if (verify.email) {
      const deletecid = await ApiRequest(
        "/api/users/vfy",
        setisLoading,
        "DELETE",
        "JSON",
        { type: "email", cid: data.cid }
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
    <div className="authentication__container  w-full min-h-[90vh] mt-4 flex items-center justify-center">
      <div className=" bg-[#495464] shadow-large flex text-lg flex-col justify-center items-center gap-y-10 w-[70%] min-h-[70vh] h-fit p-5 rounded-lg">
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
                  <PasswordInput
                    name="password"
                    label="Password"
                    type="auth"
                    width="80%"
                    variant="filled"
                    onChange={handleChange}
                    require
                  />
                </div>
                <PasswordInput
                  name="confirmpassword"
                  label="Confirm Password"
                  width="80%"
                  type="auth"
                  variant="filled"
                  onChange={handleChange}
                  require
                />
                <div className="w-[80%] h-fit">
                  <PasswordVerification password={data.password ?? ""} />
                </div>

                <RecapchaContainer
                  captchaValue={data.recapcha}
                  setcaptchaValue={(value) =>
                    setdata((prev) => ({ ...prev, recapcha: value }))
                  }
                />
                <div className="w-[80%] h-fit">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={data.agreement}
                        onChange={handleChange}
                        className="checkbox w-fit"
                        name="agreement"
                        color="primary"
                      />
                    }
                    label={
                      <h3
                        className="text-white text-lg font-bold"
                        style={{
                          color: data.agreement ? "white" : "lightcoral",
                        }}
                      >
                        {" "}
                        Agree to policy and agreement{" "}
                      </h3>
                    }
                  />
                </div>
              </>
            )}
            <div className="form_actions flex flex-row gap-5 w-[80%] ">
              {verify.cid && verify.email ? (
                <PrimaryButton
                  text="Create Account"
                  type="button"
                  color="#3D788E"
                  onClick={() => handleRegisterUser()}
                  width="100%"
                  height="40px"
                  radius="10px"
                  status={loading}
                />
              ) : (
                <PrimaryButton
                  type="button"
                  text={!verify.email ? "Next" : "Confirm"}
                  color="#3D788E"
                  width="100%"
                  height="40px"
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
                height="40px"
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
                <PasswordInput
                  label="Password"
                  type="auth"
                  name="password"
                  onChange={handleChange}
                  width="80%"
                />

                <div
                  onClick={() => {
                    settype("forget");
                  }}
                  className="w-[80%] text-lg underline text-right text-white cursor-pointer hover:text-black active:text-black"
                >
                  Forget Password?
                </div>
                <div className="form_actions flex flex-col gap-y-5 w-[80%] ">
                  <PrimaryButton
                    type="button"
                    onClick={() => handleLogin()}
                    text="Login"
                    color="#438D86"
                    width="100%"
                    height="50px"
                    radius="10px"
                    status={loading}
                  />

                  <div
                    onClick={() => {
                      setdata(Userinitialize);
                      settype("register");
                    }}
                    className="w-full text-right text-lg font-medium underline text-white cursor-pointer hover:text-black active:text-black"
                  >
                    Create Account ?
                  </div>
                  <label className="text-lg font-bold text-white">
                    Sign with:{" "}
                  </label>
                  <div className="signinWith__container w-full flex flex-row items-center gap-x-2 flex-wrap">
                    <PrimaryButton
                      type="button"
                      text="Discord"
                      width="250px"
                      color="black"
                      height="50px"
                      radius="10px"
                      Icon={
                        <i className="fa-brands fa-discord text-lg text-blue-900"></i>
                      }
                      onClick={() => signIn("discord")}
                    />
                    <PrimaryButton
                      type="button"
                      text="Gmail"
                      hoverColor="black"
                      hoverTextColor="white"
                      width="250px"
                      height="50px"
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
                  height="50px"
                  radius="10px"
                  onClick={() => handleConfirm("email")}
                  status={loading}
                />
                <PrimaryButton
                  type="button"
                  text="Back"
                  color="lightcoral"
                  width="80%"
                  height="50px"
                  radius="10px"
                  disable={loading === "loading"}
                  onClick={() => settype("login")}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const PasswordRequirement = [
  { label: "8 Characters", value: "char" },
  { label: "Contain special character", value: "spec" },
  { label: "Contain number", value: "num" },
];

export const PasswordVerification = ({ password }: { password: string }) => {
  // Function to check if the password meets the requirements
  const validatePassword = (password: string) => ({
    char: password.length >= 8,
    spec: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    num: /\d/.test(password),
  });

  const validationStatus: Record<string, any> = validatePassword(password);

  return (
    <ul className="password_verification w-full h-fit flex flex-col gap-5 bg-white p-3 rounded-lg">
      <li className="text-lg font-bold">Your password must contains: </li>
      {PasswordRequirement.map((requirement, idx) => {
        const isValid = validationStatus[requirement.value];
        return (
          <li
            key={idx}
            className={`text-sm font-bold ${
              !isValid ? "text-red-400" : "text-green-500"
            }`}
          >
            - {requirement.label}
          </li>
        );
      })}
    </ul>
  );
};
