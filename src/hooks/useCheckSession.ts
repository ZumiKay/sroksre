"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Usersessiontype } from "../types/user.type";
import { errorToast } from "../app/component/Loading";

/**
 * Check for invalid session and auto sign out if expired
 * @returns handleCheckSession function to validate session
 */
const useCheckSession = () => {
  const { status, data } = useSession();
  const timerRef = useRef<NodeJS.Timeout>();
  const [sessionStatus, setStatus] = useState<string>("");

  useEffect(() => {
    setStatus(status);
  }, [status]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCheckSession = useCallback(() => {
    // Skip if session is still loading
    if (sessionStatus === "loading") return;

    const usersession = data as unknown as Usersessiontype & { cexp?: number };

    // Check if session exists
    if (!usersession) return;

    const now = Date.now();
    const nowInSeconds = Math.floor(now / 1000);
    let isExpired = false;

    // Check token.cexp (JWT expiration in seconds)
    if (usersession.cexp && usersession.cexp <= nowInSeconds) {
      isExpired = true;
    }

    // Check session.expires (ISO string)
    if (usersession.expireAt) {
      const expireDate = new Date(usersession.expireAt).getTime();
      if (expireDate <= now) {
        isExpired = true;
      }
    } else if (!usersession.cexp) {
      // Session exists but has neither expires nor cexp - invalid session
      errorToast("Invalid Session");
      timerRef.current = setTimeout(() => {
        signOut().catch(console.error);
      }, 150);
      return;
    }

    // Handle expired session
    if (isExpired) {
      errorToast("Invalid Session");
      timerRef.current = setTimeout(() => {
        signOut().catch(console.error);
      }, 150);
    }

    return true;
  }, [sessionStatus, data]);

  return { handleCheckSession };
};

export default useCheckSession;
