"use client";
import { ChangeEvent, SubmitEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGoogle } from "@fortawesome/free-brands-svg-icons";
import PrimaryButton from "../component/Button";
import { signIn } from "next-auth/react";
import { errorToast, successToast } from "../component/Loading";
import { useRouter } from "next/navigation";
import { useGlobalContext, Userinitialize } from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import ReactDOMServer from "react-dom/server";
import { CredentialEmail } from "../component/EmailTemplate";
import { SendVfyEmail } from "./actions";
import { PasswordInput } from "../component/FormComponent";
import RecapchaContainer from "../component/RecaphaComponent";
import { VerifyRecapcha } from "../severactions/RecapchaAction";
import { Button, Checkbox } from "@heroui/react";
import { userdata } from "@/src/types/user.type";

const validatePassword = (password: string) => {
  return (
    password.length >= 8 &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password) &&
    /\d/.test(password)
  );
};
export default function AuthenticatePage() {
  const router = useRouter();
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

  const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data.email || !data.password) {
      errorToast("Fill in the required information ");
      return;
    }

    setloading("loading");

    signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
      .then((res) => {
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
          errorToast("Login failed");
        }
      })
      .catch((err) => {
        console.log("Client Signin", err);
        setloading("authenticated");
        errorToast("An error occurred during login");
      });
  };

  const handleRegisterUser = async () => {
    //Validate user input data
    if (
      !data.password ||
      !data.firstname ||
      !data.confirmpassword ||
      !data.recapcha
    ) {
      errorToast("Fill in all required");
      return;
    }

    if (data.password !== data.confirmpassword) {
      errorToast("Invalid Confirm Password");
      return;
    }

    if (!data.agreement) {
      errorToast("Please Check Our Policy");
      return;
    }

    if (!validatePassword(data.password)) {
      errorToast("Invalid Password");
      return;
    }

    setloading("loading");

    //verify GOOGLE RECAPCHAv2
    const verify = VerifyRecapcha.bind(null, data.recapcha);
    const req = await verify();

    if (!req.success) {
      setloading("authenticated");
      errorToast("Invalid Recapcha");
      return;
    }

    const request = await ApiRequest(
      "/api/auth/register",
      undefined,
      "POST",
      "JSON",
      data,
    );
    setloading("authenticated");

    if (!request.success) {
      const error = request.message;
      if (error === "false") {
        errorToast("Invalid Password");
      } else {
        request.message && errorToast(request.message);
      }
      return;
    }
    successToast("Account Registered");
    setdata(Userinitialize);
    setverify({ email: false, cid: false });
    settype("login");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name, checked } = e.target;
    setdata({ ...data, [name]: name === "agreement" ? checked : value });
  };
  const handleConfirm = async (types: "email" | "cid") => {
    const isEmailType = types === "email";
    const URL = `/api/users/vfy${types === "cid" ? `?cid=${data.cid}` : ""}`;

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
      requestBody,
    );

    if (types === "cid") setloading("authenticated");

    if (verifyreq.success) {
      const vfydata = verifyreq.data;

      if (isEmailType && data.email) {
        const emailSubject =
          type === "register" ? "Email Verification" : "Reset Password";
        const emailTemplate = ReactDOMServer.renderToString(
          <CredentialEmail {...vfydata} />,
        );
        const sendemail = SendVfyEmail.bind(
          null,
          emailTemplate,
          data.email,
          emailSubject,
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
        { type: "email", cid: data.cid },
      );
      if (!deletecid.success) {
        errorToast("Error Occured");
        return;
      }
    }
    settype("login");
    setverify({ cid: false, email: false });
  };

  const servicesSignIn = async (type: "google" | "discord") => {
    const res = await signIn(type, { redirect: false });
    if (res?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
    if (res?.error) {
      console.log("OAuth login error:", res.error);
      errorToast("Failed to login with " + type);
    }
  };

  return (
    <>
      <title>Login / Signup | SrokSre</title>

      <form
        onSubmit={handleLogin}
        className="authentication__container w-full min-h-[90vh] mt-4 flex items-center justify-center px-4 py-8 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50"
      >
        <div
          className={`bg-white shadow-2xl flex text-lg flex-col justify-center items-center gap-y-8 
          max-large_phone:w-[90%] max-small_phone:w-[97%]
          w-full max-w-md min-h-[70vh] 
          h-fit p-8 md:p-10
          rounded-2xl backdrop-blur-xs border-5 border-incart`}
        >
          {/* Header with branding */}
          <div className="w-full text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">
              {type === "register"
                ? "Create Account"
                : type === "forget"
                  ? "Reset Password"
                  : "Welcome Back"}
            </h1>
            <p className="text-sm text-gray-500">
              {type === "register"
                ? "Join SrokSre today"
                : type === "forget"
                  ? "Enter your email to reset your password"
                  : "Login to your account"}
            </p>
          </div>

          {type === "register" && (!verify.cid || !verify.email) && (
            <div className="w-full space-y-4">
              {!verify.email ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden text-gray-700"
                    value={data.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <input
                    type="number"
                    name="cid"
                    value={data.cid}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden text-gray-700 text-center text-2xl tracking-widest"
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          )}
          {type === "register" ? (
            <>
              {verify.email && verify.cid && (
                <>
                  <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden text-gray-700"
                      placeholder="John"
                      name="firstname"
                      value={data.firstname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden text-gray-700"
                      placeholder="Doe"
                      name="lastname"
                      value={data.lastname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="w-full space-y-2">
                    <PasswordInput
                      name="password"
                      label="Password"
                      type="auth"
                      width="100%"
                      variant="filled"
                      onChange={handleChange}
                      require
                    />
                  </div>
                  <div className="w-full space-y-2">
                    <PasswordInput
                      name="confirmpassword"
                      label="Confirm Password"
                      width="100%"
                      type="auth"
                      variant="filled"
                      onChange={handleChange}
                      require
                    />
                  </div>
                  <div className="w-full">
                    <PasswordVerification password={data.password ?? ""} />
                  </div>

                  <div className="w-full flex justify-center">
                    <RecapchaContainer
                      captchaValue={data.recapcha}
                      setcaptchaValue={(value) =>
                        setdata((prev) => ({ ...prev, recapcha: value }))
                      }
                    />
                  </div>
                  <div className="w-full">
                    <Checkbox
                      checked={data.agreement}
                      onChange={(val) => {
                        setdata((prev) => ({
                          ...prev,
                          agreement: val.target.checked,
                        }));
                      }}
                      classNames={{
                        label: "text-gray-700 text-sm",
                      }}
                    >
                      <span className="text-gray-700">I agree to the </span>
                      <a
                        href="/privacyandpolicy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        terms and conditions
                      </a>
                    </Checkbox>
                  </div>
                </>
              )}
              <div className="form_actions flex flex-row gap-3 w-full">
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
                    onClick={() =>
                      handleConfirm(!verify.email ? "email" : "cid")
                    }
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
              <div className="w-full space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden text-gray-700"
                  value={data.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {type === "login" && (
                <>
                  <div className="w-full space-y-2">
                    <PasswordInput
                      label="Password"
                      type="auth"
                      name="password"
                      onChange={handleChange}
                      width="100%"
                    />
                  </div>

                  <div
                    onClick={() => {
                      settype("forget");
                    }}
                    className="w-full text-sm text-right text-blue-600 hover:text-blue-700 cursor-pointer font-medium transition-colors"
                  >
                    Forgot Password?
                  </div>
                  <div className="form_actions flex flex-col gap-y-4 w-full">
                    <Button
                      className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full text-white font-semibold shadow-lg shadow-blue-500/30 transition-all"
                      size="lg"
                      type="submit"
                      isLoading={loading === "loading"}
                    >
                      Login
                    </Button>
                    <div className="text-center">
                      <span className="text-gray-600 text-sm">
                        Don't have an account?{" "}
                      </span>
                      <span
                        onClick={() => {
                          setdata(Userinitialize);
                          settype("register");
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                      >
                        Sign up
                      </span>
                    </div>

                    <div className="relative w-full">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="signinWith__container w-full flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => servicesSignIn("google")}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                      >
                        <FontAwesomeIcon
                          icon={faGoogle}
                          className="text-lg text-red-500"
                        />
                        <span>Continue with Gmail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => servicesSignIn("discord")}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-white font-medium"
                      >
                        <FontAwesomeIcon icon={faDiscord} className="text-lg" />
                        <span>Continue with Discord</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
              {type === "forget" && (
                <>
                  <Button
                    type="button"
                    className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30"
                    size="lg"
                    onPress={() => handleConfirm("email")}
                    isLoading={loading === "loading"}
                  >
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold bg-white"
                    size="lg"
                    isDisabled={loading === "loading"}
                    onPress={() => settype("login")}
                  >
                    Back to Login
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </form>
    </>
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
    <div className="password_verification w-full h-fit flex flex-col gap-3 bg-linear-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
      <p className="text-sm font-semibold text-gray-700">
        Password requirements:
      </p>
      <ul className="space-y-2">
        {PasswordRequirement.map((requirement, idx) => {
          const isValid = validationStatus[requirement.value];
          return (
            <li
              key={idx}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  !isValid
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {isValid ? "✓" : "×"}
              </span>
              <span className={!isValid ? "text-gray-600" : "text-green-700"}>
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
