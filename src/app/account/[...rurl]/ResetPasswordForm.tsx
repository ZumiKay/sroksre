"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { verifyUser } from "./action";
import PrimaryButton from "../../component/Button";
import { ChangeEvent, useCallback, useState, memo } from "react";
import { PasswordInput } from "../../component/FormComponent";
import { PasswordVerification } from "../page";

const SubmitButton = memo(() => {
  const { pending } = useFormStatus();

  return (
    <PrimaryButton
      type="submit"
      text="Confirm"
      width="100%"
      height="50px"
      textsize="15px"
      radius="10px"
      status={pending ? "loading" : "authenticated"}
    />
  );
});

SubmitButton.displayName = "SubmitButton";

export default function ResetPasswordForm({ cid }: { cid: string }) {
  const [password, setPassword] = useState("");
  const [state, formAction] = useFormState(verifyUser, {
    message: "",
    success: false,
  });
  const router = useRouter();

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    if (name === "password") {
      setPassword(value);
    }
  }, []);

  const handleBackToLogin = useCallback(() => {
    router.push("/account");
  }, [router]);

  return (
    <div className="min-h-[50vh] w-full flex flex-col gap-y-5 items-center justify-center">
      {state.success ? (
        <>
          <h1 className="text-2xl font-black w-[50%] text-[#495464] h-fit p-5 text-center rounded-lg">
            Password Updated
          </h1>
          <PrimaryButton
            type="button"
            text="Back To Login"
            color="lightcoral"
            width="50%"
            height="50px"
            textsize="15px"
            radius="10px"
            onClick={handleBackToLogin}
          />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold w-[50%] h-fit p-5 text-center rounded-lg">
            Reset Password
          </h1>
          {state.message && (
            <h3
              className={`text-lg font-semibold w-[50%] h-fit text-center ${
                state.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {state.message}
            </h3>
          )}

          <form
            action={formAction}
            className="resetform flex flex-col gap-y-5 items-center w-1/2 h-fit"
          >
            <input value={cid} name="cid" type="hidden" readOnly />
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
            />
            <PasswordVerification password={password} />
            <SubmitButton />
          </form>
        </>
      )}
    </div>
  );
}
