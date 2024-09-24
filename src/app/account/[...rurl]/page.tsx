"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { verifyUser } from "./action";
import PrimaryButton from "../../component/Button";
import { ApiRequest } from "@/src/context/CustomHook";
import { ChangeEvent, useEffect, useState } from "react";
import LoadingIcon from "../../component/Loading";
import { PasswordInput } from "../../component/FormComponent";
import { userdata } from "../actions";
import { PasswordVerification } from "../page";

export default function ResetPage({ params }: { params: { rurl: string } }) {
  const [verify, setverify] = useState(true);
  const [loading, setloading] = useState(true);

  const [data, setdata] = useState<userdata>();

  const [state, formAction] = useFormState(verifyUser, {
    message: "",
    success: false,
  });
  const router = useRouter();
  const URL = decodeURIComponent(params.rurl);
  const match = URL.match(/cid=(\d+)/);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;

    setdata((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const handleVerify = async () => {
      if (match) {
        const url = `/api/users/vfy?cid=${match[1]}`;
        const verify = await ApiRequest(url, undefined, "GET", "JSON");
        if (!verify.success) {
          setloading(false);
          setverify(false);
          return;
        }
        setverify(true);
        setloading(false);
      }
    };
    handleVerify();
  }, []);

  const Btn = () => {
    const { pending } = useFormStatus();

    return (
      <>
        <PrimaryButton
          type="submit"
          text={"Confirm"}
          width="100%"
          height="50px"
          textsize="15px"
          radius="10px"
          status={pending ? "loading" : "authenticated"}
        />
      </>
    );
  };

  return (
    <div className="min-h-[50vh] w-full flex flex-col gap-y-5 items-center justify-center">
      {loading ? (
        <LoadingIcon />
      ) : verify ? (
        <>
          {state.success ? (
            <>
              <h1 className="text-2xl font-black w-[50%] text-[#495464] h-fit p-5 text-center rounded-lg">
                Password Updated
              </h1>
              <PrimaryButton
                type="button"
                text={"Back To Login"}
                color="lightcoral"
                width="50%"
                height="50px"
                textsize="15px"
                radius="10px"
                onClick={() => router.push("/account")}
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold w-[50%] h-fit p-5 text-center rounded-lg">
                Reset Password
              </h1>
              <h3
                hidden={!state.message}
                className={`text-lg font-semibold w-[50%] h-fit text-center ${
                  state.success ? `text-green-400` : "text-red-400"
                }`}
              >
                Invalid Password
              </h3>

              <form
                action={formAction}
                method="POST"
                className="resetform flex flex-col gap-y-5 items-center w-1/2 h-fit"
              >
                <input value={match ? match[1] : ""} name="cid" hidden />
                <PasswordInput
                  label="Password"
                  name="password"
                  type="auth"
                  onChange={handleChange}
                />
                <PasswordInput
                  label="Confirm Password"
                  name="confirmpassword"
                  type="auth"
                  onChange={handleChange}
                />
                <PasswordVerification password={data?.password ?? ""} />
                <Btn />
              </form>
            </>
          )}
        </>
      ) : (
        <h1 className="text-xl font-black text-[#495464]"> 404 | Not Found</h1>
      )}
    </div>
  );
}
