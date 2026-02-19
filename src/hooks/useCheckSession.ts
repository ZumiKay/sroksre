"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import { Usersessiontype } from "../types/user.type";
import { errorToast } from "../app/component/Loading";

/**
 * Check for invalid session and auto sign out if expired
 * Optimized for performance with efficient state management and early returns
 * @returns handleCheckSession function to validate session
 */
const useCheckSession = () => {
  const { status, data, update } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSigningOutRef = useRef(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleSignOut = useCallback(() => {
    // Prevent multiple simultaneous sign-out
    if (isSigningOutRef.current) return;

    isSigningOutRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    errorToast("Invalid Session", {
      autoClose: 5000,
      closeOnClick: true,
      onClose: () => {
        timerRef.current = setTimeout(() => {
          signOut().catch(console.error);
        }, 150);
      },
    });
  }, []);

  const handleCheckSession = useCallback(async () => {
    if (status === "loading" || isSigningOutRef.current) return false;

    const usersession = data as unknown as Usersessiontype;

    if (!usersession) return false;

    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (!usersession.cexp && !usersession.expireAt) {
      handleSignOut();
      return false;
    }

    // Check JWT token expiration (cexp is in seconds)
    if (usersession.cexp && usersession.cexp <= nowInSeconds) {
      try {
        const renewedSession = await update();

        // Renewal failed or returned null/undefined
        if (
          (renewedSession?.expires && renewedSession.expires === "0") ||
          !renewedSession
        ) {
          handleSignOut();
          return false;
        }

        return true;
      } catch (error) {
        console.error("Session renewal failed:", error);
        handleSignOut();
        return false;
      }
    }

    if (usersession.expireAt) {
      const expireDate = new Date(usersession.expireAt).getTime();
      if (expireDate <= nowInSeconds * 1000) {
        handleSignOut();
        return false;
      }
    }

    return true;
  }, [status, data, update, handleSignOut]);

  return { handleCheckSession };
};

export default useCheckSession;
