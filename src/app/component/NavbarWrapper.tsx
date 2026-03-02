"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Navbar from "./Navbar";
import { ApiRequest } from "@/src/context/CustomHook";
import { Usersessiontype } from "@/src/types/user.type";
import { CheckAndGetUserInfo } from "../severactions/RecapchaAction";
import { ToastContainer } from "react-toastify";
import useCheckSession from "@/src/hooks/useCheckSession";
import TopModal from "../dashboard/TopModal";

// API endpoint constants
const API_ENDPOINTS = {
  CART_COUNT: "/api/order/cart?count=1",
  NOTIFICATION_CHECK: "/api/users/notification?ty=check",
} as const;

export default function NavbarWrapper() {
  const { handleCheckSession, data, status } = useCheckSession();
  const [initialCartCount, setInitialCartCount] = useState(0);
  const [initialNotificationCount, setInitialNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Refs for cleanup and preventing duplicate fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const userSession = useMemo(() => data as unknown as Usersessiontype, [data]);

  // Memoized fetch function to prevent recreating on every render
  const fetchInitialData = useCallback(async () => {
    // Prevent duplicate fetches
    if (isFetchingRef.current || hasFetchedRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Check for invalid session with expires "0" - handleCheckSession shows toast and signs out internally
      if (data?.expires === "0") {
        await handleCheckSession();
        return;
      }

      // Verify active login session
      const checkReq = CheckAndGetUserInfo.bind(null, { nodata: true });
      const isValid = await checkReq();

      if (!isValid.success) {
        return;
      }

      // Mark as successfully fetched
      hasFetchedRef.current = true;

      // Fetch role-specific data in parallel for better performance
      if (userSession && userSession.role !== "ADMIN") {
        // Fetch cart count for non-admin users
        const cartResponse = await ApiRequest(
          API_ENDPOINTS.CART_COUNT,
          undefined,
          "GET",
        );
        if (cartResponse.success) {
          setInitialCartCount(cartResponse.data || 0);
        }
      } else if (userSession?.role === "ADMIN") {
        // Fetch notification count for admin users
        const notificationResponse = await ApiRequest(
          API_ENDPOINTS.NOTIFICATION_CHECK,
          undefined,
          "GET",
        );
        if (notificationResponse.success) {
          setInitialNotificationCount(notificationResponse.data?.length || 0);
        }
      }
    } catch (error) {
      console.log("Error fetching initial data:", error);
      hasFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [data, userSession, handleCheckSession]);

  useEffect(() => {
    if (status === "authenticated" && data) {
      fetchInitialData();
    }

    // Reset fetch tracking when session changes significantly
    return () => {
      if (status !== "authenticated") {
        hasFetchedRef.current = false;
        isFetchingRef.current = false;
      }
    };
  }, [status, data, fetchInitialData]);

  // Memoize Navbar props to prevent unnecessary re-renders
  const navbarProps = useMemo(
    () => ({
      session: userSession,
      initialCartCount,
      initialNotificationCount,
      loading,
    }),
    [userSession, initialCartCount, initialNotificationCount, loading],
  );

  return (
    <>
      <TopModal />
      <ToastContainer />
      <Navbar {...navbarProps} />
    </>
  );
}
