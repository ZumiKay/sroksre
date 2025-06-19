"use client";
import { FormEvent, useCallback, useState } from "react";
import PrimaryButton from "../component/Button";
import { signIn } from "next-auth/react";
import { errorToast, successToast } from "../component/Loading";
import { useRouter } from "next/navigation";
import { useGlobalContext, Userinitialize } from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import ReactDOMServer from "react-dom/server";
import { CredentialEmail } from "../component/EmailTemplate";
import { CredentialEmailType, SendVfyEmail } from "./actions";
import { VerifyRecapcha } from "../severactions/RecapchaAction";
import { userdata } from "@/src/context/GlobalType.type";
import { Form } from "@heroui/react";
import {
  LoginComponent,
  RegisterUserForm,
  VerfyEmailComponent,
} from "./component";
const validatePassword = (password: string) => {
  return (
    password.length >= 8 &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password) &&
    /\d/.test(password)
  );
};

export type logintype = "login" | "register" | "forget";

export default function AuthenticatePage() {
  const { isLoading } = useGlobalContext();
  const [type, settype] = useState<logintype>("login");
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
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    //verify bot
    const verify = VerifyRecapcha.bind(null, data.recapcha);
    const req = await verify();

    if (!req.success) {
      setloading("authenticated");
      errorToast("Invalid Recapcha");
      return;
    }

    const request = await ApiRequest({
      url: "/api/auth/register",
      method: "POST",
      data,
    });
    setloading("authenticated");

    if (!request.success) {
      const error = request.message;
      if (error === "false") {
        errorToast("Invalid Password");
      } else {
        if (request.message) errorToast(request.message);
      }
      return;
    }
    successToast("Account Registered");
    setdata(Userinitialize);
    setverify({ email: false, cid: false });
    settype("login");
  };

  const handleChange = (name: string, value: string | boolean) => {
    setdata({ ...data, [name]: value });
  };
  const handleConfirm = useCallback(
    async (types: "email" | "cid") => {
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
      const verifyreq = await ApiRequest({
        url: URL,
        method,
        data: requestBody,
      });

      if (types === "cid") setloading("authenticated");

      if (verifyreq.success) {
        const vfydata = verifyreq.data as CredentialEmailType;

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
    },
    [data, type]
  );

  const handleBack = useCallback(async () => {
    if (verify.email) {
      setloading("loading");
      const deletecid = await ApiRequest({
        url: "/api/users/vfy",

        method: "DELETE",
        data: { type: "email", cid: data.cid },
      });
      setloading("authenticated");
      if (!deletecid.success) {
        errorToast("Error Occured");
        return;
      }
    }
    settype("login");
    setverify({ cid: false, email: false });
  }, [data.cid, verify.email]);

  return (
    <>
      <title>Login / Signup | SrokSre</title>

      <Form
        onSubmit={handleLogin}
        className="authentication__container  w-full min-h-[90vh] mt-4 flex items-center justify-center"
      >
        <div
          className={`bg-[#495464] shadow-large flex text-lg flex-col justify-center items-center gap-y-10 
          max-large_phone:w-[90%] max-small_phone:w-[97%]
          w-[70%] min-h-[70vh] 
          h-fit p-5 
          rounded-lg`}
        >
          <h3 className="w-full text-2xl text-white font-bold text-center">
            {type === "register"
              ? "Create Account"
              : type === "forget"
              ? "Reset Password"
              : "Login to your account"}
          </h3>
          {type === "register" && (!verify.cid || !verify.email) && (
            <div className="w-[80%] max-small_phone:w-[97%] flex flex-col gap-y-5">
              <VerfyEmailComponent
                data={data}
                isVerify={verify.email}
                handleChange={(name, val) => handleChange(name, val as string)}
              />
            </div>
          )}
          {type === "register" ? (
            <>
              {verify.email && verify.cid && (
                <RegisterUserForm
                  handleChange={(name, val) =>
                    handleChange(name, val as string)
                  }
                  data={data}
                />
              )}
              <div className="form_actions flex flex-row gap-5 w-[80%] max-small_phone:w-[100%]">
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
            <LoginComponent
              handleChange={(name, val) => handleChange(name, val as string)}
              settype={(val) => settype(val as logintype)}
              setdata={(val) => setdata(val)}
              loading={loading === "loading"}
              type={type}
              handleConfirm={handleConfirm}
            />
          )}
        </div>
      </Form>
    </>
  );
}

const PasswordRequirement = [
  { label: "8 Characters", value: "char" },
  { label: "Contain special character", value: "spec" },
  { label: "Contain number", value: "num" },
];

// Not exporting as a named export to avoid Next.js treating it as a page component
function PasswordVerification({ password }: { password: string }) {
  // Function to check if the password meets the requirements
  const validatePassword = (password: string) => ({
    char: password.length >= 8,
    spec: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    num: /\d/.test(password),
  });

  const validationStatus: Record<string, unknown> = validatePassword(password);

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
}

// Export the component as default or use it directly in the file
export { PasswordVerification };
