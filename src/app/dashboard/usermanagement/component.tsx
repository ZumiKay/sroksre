"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ChangeEvent, useCallback, useState } from "react";
import { PasswordInput } from "../../component/FormComponent";

export const PasswordSection = () => {
  const { user, setuser } = useGlobalContext();
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    upperCase: false,
    lowerCase: false,
    number: false,
    specialChar: false,
  });

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  };

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setuser((prev) => ({ ...(prev ?? {}), [name]: value } as never));

      if (name === "password") {
        validatePassword(value);
      }
    },
    [setuser]
  );

  const isPasswordStrong = Object.values(passwordStrength).every(
    (check) => check === true
  );

  return (
    <div className="password_section w-full h-fit flex flex-col gap-y-5">
      <PasswordInput
        name="password"
        value={user?.password}
        onChange={handleChange}
        label="Password"
        size="md"
        isRequired
      />

      {/* Password strength indicators */}
      {user?.password && (
        <div className="password-strength-container mt-1 mb-3">
          <p className="text-sm font-semibold mb-2">Password must contain:</p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li
              className={
                passwordStrength.length ? "text-green-500" : "text-red-500"
              }
            >
              At least 8 characters
            </li>
            <li
              className={
                passwordStrength.upperCase ? "text-green-500" : "text-red-500"
              }
            >
              At least one uppercase letter
            </li>
            <li
              className={
                passwordStrength.lowerCase ? "text-green-500" : "text-red-500"
              }
            >
              At least one lowercase letter
            </li>
            <li
              className={
                passwordStrength.number ? "text-green-500" : "text-red-500"
              }
            >
              At least one number
            </li>
            <li
              className={
                passwordStrength.specialChar ? "text-green-500" : "text-red-500"
              }
            >
              At least one special character
            </li>
          </ul>

          {/* Overall strength indicator */}
          <div className="mt-2">
            <p className="text-sm">
              Password strength:
              <span
                className={
                  isPasswordStrong
                    ? "text-green-600 font-bold ml-1"
                    : "text-red-500 font-bold ml-1"
                }
              >
                {isPasswordStrong ? "Strong" : "Weak"}
              </span>
            </p>
          </div>
        </div>
      )}

      <PasswordInput
        name="confirmpassword"
        value={user?.confirmpassword}
        onChange={handleChange}
        label="Confirm Password"
        size="md"
        isRequired
      />

      {/* Password match indicator */}
      {user?.password && user?.confirmpassword && (
        <p
          className={`text-sm ${
            user?.password === user?.confirmpassword
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {user?.password === user?.confirmpassword
            ? "Passwords match"
            : "Passwords do not match"}
        </p>
      )}
    </div>
  );
};
