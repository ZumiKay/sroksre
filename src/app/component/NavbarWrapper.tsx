"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Navbar from "./Navbar";
import { ApiRequest } from "@/src/context/CustomHook";
import { Usersessiontype } from "@/src/types/user.type";
import { CheckAndGetUserInfo } from "../severactions/RecapchaAction";
import { errorToast } from "./Loading";

export default function NavbarWrapper() {
  const { data: session, status } = useSession();
  const [initialCartCount, setInitialCartCount] = useState(0);
  const [initialNotificationCount, setInitialNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const userSession = useMemo(
    () => session as unknown as Usersessiontype,
    [session],
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      if (status === "loading") return;

      setLoading(true);
      try {
        //verify active login session
        const checkReq = CheckAndGetUserInfo.bind(null, { nodata: true });
        const isValid = await checkReq();

        if (!isValid.success) {
          errorToast(isValid.message ?? "Error occured");
          if (isValid.isExpire) {
            await signOut({ redirect: false });
            errorToast(isValid.message, {
              onClose: () => window.location.reload(),
              closeOnClick: true,
            });
          }
          return;
        }

        if (userSession && userSession.role !== "ADMIN") {
          // Fetch cart count for non-admin users
          const cartResponse = await ApiRequest(
            "/api/order/cart?count=1",
            undefined,
            "GET",
          );
          if (cartResponse.success) {
            setInitialCartCount(cartResponse.data || 0);
          }
        } else if (userSession?.role === "ADMIN") {
          // Fetch notification count for admin users
          const notificationResponse = await ApiRequest(
            "/api/users/notification?ty=check",
            undefined,
            "GET",
          );
          if (notificationResponse.success) {
            setInitialNotificationCount(notificationResponse.data?.length || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [session, status]);

  return (
    <Navbar
      session={userSession}
      initialCartCount={initialCartCount}
      initialNotificationCount={initialNotificationCount}
      loading={loading}
    />
  );
}
