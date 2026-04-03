"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Usersessiontype } from "../types/user.type";

/**
 * Validates the user's session and exposes a `sessionExpired` flag.
 *
 * When the session is confirmed expired by the server, `sessionExpired` flips
 * to `true`. The caller is responsible for rendering the <SessionExpiredModal>
 * based on this flag — the hook never triggers a hard sign-out directly.
 *
 * Network/transient failures do NOT set `sessionExpired`; the user stays
 * logged in and the failed action is simply blocked.
 */
const useCheckSession = () => {
  const { status, data, update } = useSession();
  const [sessionExpired, setSessionExpired] = useState(false);
  const isHandlingRef = useRef(false);

  // Expose for tests / consumers that need to reset the flag (e.g. after modal closes)
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  // Immediately detect an already-expired session on mount / session data change
  useEffect(() => {
    if (
      status === "authenticated" &&
      data?.expires === "0" &&
      !isHandlingRef.current
    ) {
      isHandlingRef.current = true;
      setSessionExpired(true);
    }
  }, [status, data?.expires]);

  // Reset the guard when a fresh authenticated session arrives
  useEffect(() => {
    if (status === "authenticated" && data?.expires !== "0") {
      isHandlingRef.current = false;
    }
  }, [status, data?.expires]);

  /**
   * Call before any server action. Returns `true` if the session is valid,
   * `false` (and sets `sessionExpired` when appropriate) if not.
   */
  const handleCheckSession = useCallback(async (): Promise<boolean> => {
    if (status === "loading" || isHandlingRef.current) return false;

    const usersession = data as unknown as Usersessiontype | null;
    if (!usersession) return false;

    // Session was already marked expired by the server
    if ((data as any)?.expires === "0") {
      if (!isHandlingRef.current) {
        isHandlingRef.current = true;
        setSessionExpired(true);
      }
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);

    // No expiry info at all — treat as expired
    if (!usersession.cexp && !usersession.expireAt) {
      isHandlingRef.current = true;
      setSessionExpired(true);
      return false;
    }

    // Access token is expired or expiring within 3 minutes — rotate via update()
    if (usersession.cexp && usersession.cexp < nowInSeconds + 180) {
      try {
        const renewedSession = await update();

        // Server explicitly marks session as dead
        if (renewedSession?.expires === "0") {
          isHandlingRef.current = true;
          setSessionExpired(true);
          return false;
        }

        // null/undefined → transient failure (network blip, cold start). Keep user in.
        return true;
      } catch {
        // Network or unexpected error — do NOT sign out. Let the action proceed
        // optimistically; if the session is truly dead the server action will fail.
        return true;
      }
    }

    // DB-level session expiry from expireAt
    if (usersession.expireAt) {
      const expireMs = new Date(usersession.expireAt).getTime();
      if (expireMs <= Date.now()) {
        isHandlingRef.current = true;
        setSessionExpired(true);
        return false;
      }
    }

    return true;
  }, [status, data, update]);

  return {
    handleCheckSession,
    sessionExpired,
    clearSessionExpired,
    data,
    status,
  };
};

export default useCheckSession;
