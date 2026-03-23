"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

const COUNTDOWN_SECONDS = 8;

/**
 * Fullscreen overlay shown when the user's session has expired.
 * Counts down then signs out to /account, or lets the user act immediately.
 */
export function SessionExpiredModal() {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const doSignOut = () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    signOut({ callbackUrl: "/account" }).catch(console.error);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          doSignOut();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Session Expired</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your login session has expired. You will be signed out automatically.
          </p>
        </div>

        {/* Countdown ring */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - seconds / COUNTDOWN_SECONDS)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-600">
            {seconds}
          </span>
        </div>

        {/* Button */}
        <button
          onClick={doSignOut}
          disabled={isSigningOut}
          className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {isSigningOut ? "Signing out…" : "Sign In Again"}
        </button>
      </div>
    </div>
  );
}
