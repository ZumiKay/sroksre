"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ProfilePageType,
  ProfileSideBar,
  ProfileTab,
  SecurityTab,
} from "./component";
import WishlistTab from "./wishlisth";
import { useSearchParams, useRouter } from "next/navigation";

const UserDashboard = () => {
  const [type, settype] = useState<ProfilePageType>("profile");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    settype((searchParams.get("type") as ProfilePageType) ?? "profile");
  }, [searchParams]);

  const handleTab = useCallback(
    (val: string) => {
      const param = new URLSearchParams(searchParams);
      param.set("type", val);

      router.push(`?${param}`);
      settype(val as ProfilePageType);
    },
    [router, searchParams]
  );

  const RenderTabContent = useCallback((type: ProfilePageType) => {
    switch (type) {
      case "profile":
        return <ProfileTab />;
      case "security":
        return <SecurityTab />;
      case "wishlist":
        return <WishlistTab />;

      default:
        break;
    }
  }, []);
  return (
    <div className="userdashboard">
      <h1>Dashboard</h1>
      <div className="Userdashboard_container w-full h-fit flex flex-row items-start">
        <ProfileSideBar onSelect={handleTab} />
        {RenderTabContent(type)}
      </div>
    </div>
  );
};

export default UserDashboard;
