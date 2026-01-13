"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "./Navbar";
import { ApiRequest } from "@/src/context/CustomHook";
import { Usersessiontype } from "@/src/types/user.type";

export default function NavbarWrapper() {
  const { data: session, status } = useSession();
  const [initialCartCount, setInitialCartCount] = useState(0);
  const [initialNotificationCount, setInitialNotificationCount] = useState(0);

  const userSession = session?.user as Usersessiontype | null;

  useEffect(() => {
    const fetchInitialData = async () => {
      if (status === "loading") return;

      try {
        if (userSession && userSession.role !== "ADMIN") {
          // Fetch cart count for non-admin users
          const cartResponse = await ApiRequest(
            "/api/order/cart?count=1",
            undefined,
            "GET"
          );
          if (cartResponse.success) {
            setInitialCartCount(cartResponse.data || 0);
          }
        } else if (userSession?.role === "ADMIN") {
          // Fetch notification count for admin users
          const notificationResponse = await ApiRequest(
            "/api/users/notification?ty=check",
            undefined,
            "GET"
          );
          if (notificationResponse.success) {
            setInitialNotificationCount(notificationResponse.data?.length || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  return (
    <Navbar
      session={userSession}
      initialCartCount={initialCartCount}
      initialNotificationCount={initialNotificationCount}
    />
  );
}
