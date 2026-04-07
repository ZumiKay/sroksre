"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { verifyUser } from "./action";
import PrimaryButton from "../../component/Button";
import { type ChangeEvent, useCallback, useState, memo } from "react";
import { PasswordInput } from "../../component/FormComponent";
import { PasswordVerification } from "../page";

// Style constants
const CONTAINER_CLASSES =
  "min-h-[50vh] w-full flex flex-col gap-y-5 items-center justify-center";
const HEADING_CLASSES =
  "text-2xl font-bold w-full max-w-md h-fit p-5 text-center rounded-lg";
const SUCCESS_HEADING_CLASSES =
  "text-2xl font-black w-full max-w-md text-incart h-fit p-5 text-center rounded-lg";
const ERROR_MESSAGE_CLASSES =
  "text-lg font-semibold w-full max-w-md h-fit text-center";
const FORM_CLASSES =
  "resetform flex flex-col gap-y-5 items-center w-full max-w-md h-fit";

const BUTTON_CONFIG = {
  height: "50px",
  textsize: "15px",
  radius: "10px",
} as const;

// Memoized submit button to prevent unnecessary re-renders
const SubmitButton = memo(() => {
  const { pending } = useFormStatus();

  return (
    <PrimaryButton
      type="submit"
      text="Confirm"
      width="100%"
      {...BUTTON_CONFIG}
      status={pending ? "loading" : "authenticated"}
      aria-label="Submit password reset"
    />
  );
});

SubmitButton.displayName = "SubmitButton";

// Success state component - extracted for better code organization
const SuccessState = memo(
  ({ onBackToLogin }: { onBackToLogin: () => void }) => (
    <>
      <h1 className={SUCCESS_HEADING_CLASSES} role="status" aria-live="polite">
        Password Updated
      </h1>
      <PrimaryButton
        type="button"
        text="Back To Login"
        color="lightcoral"
        width="100%"
        {...BUTTON_CONFIG}
        onClick={onBackToLogin}
        aria-label="Navigate back to login page"
      />
    </>
  ),
);

SuccessState.displayName = "SuccessState";

interface ResetPasswordFormProps {
  cid: string;
}

export default function ResetPasswordForm({ cid }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [state, formAction] = useFormState(verifyUser, {
    message: "",
    success: false,
  });
  const router = useRouter();

  // Optimized password change handler - only updates when password field changes
  const handlePasswordChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    [],
  );

  // Simplified navigation handler
  const handleBackToLogin = useCallback(() => {
    router.push("/account");
  }, [router]);

  return (
    <div className={CONTAINER_CLASSES}>
      {state.success ? (
        <SuccessState onBackToLogin={handleBackToLogin} />
      ) : (
        <>
          <h1 className={HEADING_CLASSES} id="reset-password-heading">
            Reset Password
          </h1>
          {state.message && (
            <p
              className={`${ERROR_MESSAGE_CLASSES} ${
                state.success ? "text-green-400" : "text-red-400"
              }`}
              role="alert"
              aria-live="assertive"
            >
              {state.message}
            </p>
          )}

          <form
            action={formAction}
            className={FORM_CLASSES}
            aria-labelledby="reset-password-heading"
          >
            <input value={cid} name="cid" type="hidden" readOnly />
            <PasswordInput
              label="Password"
              name="password"
              type="auth"
              onChange={handlePasswordChange}
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
