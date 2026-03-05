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

  // Cleanup unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (isSigningOutRef.current) {
        isSigningOutRef.current = false;
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

  const handleCheckSession = async () => {
    if (status === "loading" || isSigningOutRef.current) return false;

    const usersession = data as unknown as Usersessiontype;

    if (!usersession) return false;

    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (!usersession.cexp && !usersession.expireAt) {
      handleSignOut();
      return false;
    }

    // Renew if expired or expiring within 3 minutes (180 seconds)
    if (usersession.cexp && usersession.cexp < nowInSeconds + 180) {
      try {
        const renewedSession = await update();

        // Only sign out when the server explicitly marks the session as expired.
        // A null/undefined response means the request failed transiently (e.g. server cold-start,
        // network blip) — in that case keep the user logged in rather than force-logging them out.
        if (renewedSession?.expires && renewedSession.expires === "0") {
          handleSignOut();
          return false;
        }

        return true;
      } catch (error) {
        console.log("Session renewal failed:", error);
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
  };

  return { handleCheckSession, data, status };
};

export default useCheckSession;
