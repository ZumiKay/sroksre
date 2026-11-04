"use client";

import { useEffect, useState } from "react";

/**
 * Asks for whatever GET /api/users/confirm says this account needs before a
 * delete: password, an emailed code, and/or the authenticator app code.
 */

export type DeleteConfirmAction = "delete_account" | "delete_users";

export interface DeleteConfirmValues {
  password?: string;
  emailCode?: string;
  code?: string;
  /** True once every required field is filled in. */
  ready: boolean;
}

interface Requirements {
  password: boolean;
  emailCode: boolean;
  totp: boolean;
}

const inputClass =
  "w-full h-10 px-3 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white outline-none hover:border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-colors disabled:bg-gray-50";
const codeClass = `${inputClass} text-center tracking-[0.3em] font-semibold`;
const labelClass = "text-xs font-semibold text-gray-600";

const sixDigits = (value: string) => value.replace(/\D/g, "").slice(0, 6);

export function DeleteConfirmFields({
  action,
  disabled,
  onChange,
}: {
  action: DeleteConfirmAction;
  disabled?: boolean;
  onChange: (values: DeleteConfirmValues) => void;
}) {
  const [needs, setNeeds] = useState<Requirements | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [code, setCode] = useState("");
  const [emailState, setEmailState] = useState<{
    sending: boolean;
    message?: string;
    isError?: boolean;
  }>({ sending: false });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/confirm?action=${action}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message ?? "Couldn't load");
        if (!cancelled) setNeeds(data as Requirements);
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [action]);

  useEffect(() => {
    if (!needs) {
      onChange({ ready: false });
      return;
    }
    const ready =
      (!needs.password || password.length > 0) &&
      (!needs.emailCode || emailCode.length === 6) &&
      (!needs.totp || code.length === 6);
    onChange({
      ...(needs.password && { password }),
      ...(needs.emailCode && { emailCode }),
      ...(needs.totp && { code }),
      ready,
    });
  }, [needs, password, emailCode, code, onChange]);

  const sendEmailCode = async () => {
    setEmailState({ sending: true });
    try {
      const res = await fetch("/api/users/confirm", {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      setEmailState({
        sending: false,
        message: data.message ?? (res.ok ? "Code sent" : "Failed to send code"),
        isError: !res.ok,
      });
    } catch {
      setEmailState({ sending: false, message: "Failed to send code", isError: true });
    }
  };

  if (loadError) {
    return <p className="w-full text-sm text-center text-red-500">{loadError}</p>;
  }
  if (!needs) {
    return <div className="w-full h-16 rounded-lg bg-gray-100 animate-pulse" />;
  }

  return (
    <div className="w-full flex flex-col gap-3 text-left">
      <p className="text-xs text-gray-500 text-center">
        To confirm, enter the following.
      </p>

      {needs.password && (
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Your password</span>
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={password}
            disabled={disabled}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      )}

      {needs.emailCode && (
        <div className="flex flex-col gap-1">
          <span className={labelClass}>Code from your email</span>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={codeClass}
              value={emailCode}
              disabled={disabled}
              onChange={(e) => setEmailCode(sixDigits(e.target.value))}
            />
            <button
              type="button"
              onClick={sendEmailCode}
              disabled={disabled || emailState.sending}
              className="shrink-0 h-10 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {emailState.sending ? "Sending…" : emailState.message ? "Resend" : "Send code"}
            </button>
          </div>
          {emailState.message && (
            <span
              className={`text-xs ${emailState.isError ? "text-red-500" : "text-gray-500"}`}
            >
              {emailState.message}
            </span>
          )}
        </div>
      )}

      {needs.totp && (
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Code from your authenticator app</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className={codeClass}
            value={code}
            disabled={disabled}
            onChange={(e) => setCode(sixDigits(e.target.value))}
          />
        </label>
      )}
    </div>
  );
}
