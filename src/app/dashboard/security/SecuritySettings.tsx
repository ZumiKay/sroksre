"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCopy,
  faDownload,
  faEnvelope,
  faKey,
  faLaptop,
  faQrcode,
  faShieldHalved,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { errorToast, successToast } from "../../component/Loading";

interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
  required: boolean;
  configured: boolean;
  sessionVerified: boolean;
}

type Step =
  | { name: "idle" }
  | { name: "email" }
  | { name: "scan"; qrDataUrl: string; secret: string }
  | { name: "codes"; codes: string[] }
  | { name: "regenerate" };

async function callMfa(body?: object) {
  const res = await fetch("/api/users/mfa", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? "Something went wrong");
  return data;
}

const inputClass =
  "w-full h-11 px-3 text-center text-xl tracking-[0.4em] font-semibold text-gray-900 border border-gray-200 rounded-lg bg-white outline-none hover:border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-colors";
const primaryButton =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold shadow-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed";

export default function SecuritySettings() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>({ name: "idle" });
  const [busy, setBusy] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [appCode, setAppCode] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await callMfa());
      setLoadError(null);
    } catch (error) {
      setLoadError((error as Error).message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
  }, [loadStatus]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      errorToast((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendEmailCode = () =>
    run(async () => {
      const res = await callMfa({ action: "send-email-code" });
      successToast(res.message);
      setEmailCode("");
      setStep({ name: "email" });
    });

  const confirmEmail = () =>
    run(async () => {
      const res = await callMfa({ action: "start", emailCode });
      setAppCode("");
      setStep({ name: "scan", qrDataUrl: res.qrDataUrl, secret: res.secret });
    });

  const turnOn = () =>
    run(async () => {
      const res = await callMfa({ action: "enable", code: appCode });
      successToast("Two-factor login is on");
      setStep({ name: "codes", codes: res.recoveryCodes });
      loadStatus();
    });

  const regenerate = () =>
    run(async () => {
      const res = await callMfa({
        action: "regenerate-recovery-codes",
        code: appCode,
      });
      successToast("New recovery codes created");
      setStep({ name: "codes", codes: res.recoveryCodes });
      loadStatus();
    });

  return (
    <main className="w-full min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-7">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Dashboard / Security
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            Security
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Protect your admin account with a code from an authenticator app
          </p>
        </div>

        {loadError && (
          <Banner tone="red">
            {loadError === "Unauthorized"
              ? "Two-factor login is only available for admin accounts."
              : loadError}
          </Banner>
        )}

        {status && (
          <>
            {!status.configured && (
              <Banner tone="amber">
                The server is missing <code>MFA_ENCRYPTION_KEY</code>, so
                two-factor can&apos;t be set up yet.
              </Banner>
            )}
            {status.required && !status.sessionVerified && (
              <Banner tone="amber">
                {status.enabled
                  ? "Admin pages are locked for this login. Log out and sign in again with your code to unlock them."
                  : "Admin pages are locked until you set up two-factor login."}
              </Banner>
            )}

            <section className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 md:p-6 mb-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <FontAwesomeIcon
                      icon={faShieldHalved}
                      className="text-white text-base"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Two-factor login
                    </h2>
                    <p className="text-xs text-gray-500">
                      Google Authenticator, Microsoft Authenticator, Authy,
                      1Password or Apple Passwords
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    status.enabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {status.enabled ? "On" : "Off"}
                </span>
              </div>

              {step.name === "codes" ? (
                <RecoveryCodes
                  codes={step.codes}
                  onDone={() => setStep({ name: "idle" })}
                />
              ) : status.enabled ? (
                <EnabledPanel
                  status={status}
                  regenerating={step.name === "regenerate"}
                  appCode={appCode}
                  setAppCode={setAppCode}
                  busy={busy}
                  onStart={() => {
                    setAppCode("");
                    setStep({ name: "regenerate" });
                  }}
                  onCancel={() => setStep({ name: "idle" })}
                  onConfirm={regenerate}
                />
              ) : step.name === "email" ? (
                <StepCard
                  icon={faEnvelope}
                  title="Step 1 of 2 · Confirm it's you"
                  text="We emailed a 6-digit code to your account email. It expires in 10 minutes."
                >
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={emailCode}
                    onChange={(e) =>
                      setEmailCode(e.target.value.replace(/\D/g, ""))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={busy || emailCode.length !== 6}
                      onClick={confirmEmail}
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      className={secondaryButton}
                      disabled={busy}
                      onClick={sendEmailCode}
                    >
                      Resend code
                    </button>
                  </div>
                </StepCard>
              ) : step.name === "scan" ? (
                <StepCard
                  icon={faQrcode}
                  title="Step 2 of 2 · Add to your authenticator app"
                  text="Scan the QR code with your app, then enter the 6-digit code it shows."
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
                    <img
                      src={step.qrDataUrl}
                      alt="QR code for your authenticator app"
                      width={176}
                      height={176}
                      className="w-44 h-44 rounded-xl border border-gray-100"
                    />
                    <div className="flex-1 w-full flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                          Can&apos;t scan? Enter this key
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 min-w-0 break-all text-sm font-mono text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                            {step.secret.match(/.{1,4}/g)?.join(" ")}
                          </code>
                          <CopyButton text={step.secret} />
                        </div>
                      </div>
                      <input
                        className={inputClass}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        value={appCode}
                        onChange={(e) =>
                          setAppCode(e.target.value.replace(/\D/g, ""))
                        }
                      />
                      <button
                        type="button"
                        className={primaryButton}
                        disabled={busy || appCode.length !== 6}
                        onClick={turnOn}
                      >
                        <FontAwesomeIcon icon={faCheck} className="text-xs" />
                        Turn on two-factor
                      </button>
                    </div>
                  </div>
                </StepCard>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-600">
                    After you enter your password, you&apos;ll also enter a
                    6-digit code from your phone. Someone who steals your
                    password still can&apos;t sign in.
                  </p>
                  <div>
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={busy || !status.configured}
                      onClick={sendEmailCode}
                    >
                      <FontAwesomeIcon
                        icon={faShieldHalved}
                        className="text-xs"
                      />
                      Set up two-factor
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        <Link
          href="/dashboard/devices"
          className="w-full flex items-center justify-between gap-4 bg-white rounded-2xl shadow-xs border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faLaptop} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Signed-in devices
              </p>
              <p className="text-xs text-gray-500">
                See where you&apos;re logged in and sign out other devices
              </p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>
    </main>
  );
}

function EnabledPanel({
  status,
  regenerating,
  appCode,
  setAppCode,
  busy,
  onStart,
  onCancel,
  onConfirm,
}: {
  status: MfaStatus;
  regenerating: boolean;
  appCode: string;
  setAppCode: (value: string) => void;
  busy: boolean;
  onStart: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Turned on"
          value={
            status.enabledAt
              ? new Date(status.enabledAt).toLocaleDateString()
              : "—"
          }
        />
        <Stat
          label="Recovery codes left"
          value={`${status.recoveryCodesLeft} / 10`}
          warn={status.recoveryCodesLeft <= 3}
        />
      </div>

      {regenerating ? (
        <StepCard
          icon={faKey}
          title="New recovery codes"
          text="Enter a code from your app. Your old recovery codes will stop working."
        >
          <input
            className={inputClass}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={appCode}
            onChange={(e) => setAppCode(e.target.value.replace(/\D/g, ""))}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryButton}
              disabled={busy || appCode.length !== 6}
              onClick={onConfirm}
            >
              Create new codes
            </button>
            <button
              type="button"
              className={secondaryButton}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </StepCard>
      ) : (
        <div>
          <button type="button" className={secondaryButton} onClick={onStart}>
            <FontAwesomeIcon icon={faKey} className="text-xs" />
            Create new recovery codes
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Lost your phone and your recovery codes? Someone with server access can
        run <code>npm run mfa:reset -- your@email.com</code>.
      </p>
    </div>
  );
}

function RecoveryCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const text = codes.join("\n");

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sroksre-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StepCard
      icon={faKey}
      title="Save your recovery codes"
      text="Each code works once, if you lose your phone. They won't be shown again."
    >
      <div className="grid grid-cols-2 gap-2 font-mono text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-xl p-4">
        {codes.map((code) => (
          <span key={code} className="text-center">
            {code}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy" />
        <button type="button" className={secondaryButton} onClick={download}>
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
          Download
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="w-4 h-4 accent-gray-900"
        />
        I saved these codes somewhere safe
      </label>
      <div>
        <button
          type="button"
          className={primaryButton}
          disabled={!saved}
          onClick={onDone}
        >
          Done
        </button>
      </div>
    </StepCard>
  );
}

function StepCard({
  icon,
  title,
  text,
  children,
}: {
  icon: typeof faKey;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <FontAwesomeIcon icon={icon} className="text-gray-400 mt-1" />
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p
        className={`text-lg font-extrabold ${warn ? "text-amber-600" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "amber" | "red";
  children: React.ReactNode;
}) {
  const styles =
    tone === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-red-50 border-red-200 text-red-700";
  return (
    <div
      className={`flex items-start gap-2 border rounded-2xl px-4 py-3 mb-6 text-sm ${styles}`}
    >
      <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
      <p>{children}</p>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={secondaryButton}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy"
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
      {label}
    </button>
  );
}
