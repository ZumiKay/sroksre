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
import { useScreenSize } from "@/src/context/CustomHook";
import { DashBoardMobileTab } from "./mobilecomponent";

const UserDashboard = () => {
  const [type, settype] = useState<ProfilePageType>("profile");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSmallTablet, isMobile } = useScreenSize();

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
    <div className="userdashboard w-[95%] h-fit pt-20">
      <h1
        hidden={isMobile}
        className="w-full text-left p-3 max-small_phone:text-xl"
      >{`Zumi's Dashboard`}</h1>
      <div
        className="Userdashboard_container w-full h-fit flex flex-row justify-start items-start gap-3
      max-smallest_tablet:flex-col
      "
      >
        {isSmallTablet || isMobile ? (
          <DashBoardMobileTab type={type} settype={settype} />
        ) : (
          <div className="w-fit h-full">
            <ProfileSideBar isSelected={type} onSelect={handleTab} />
          </div>
        )}
        <div className="w-full h-full min-h-[600px] border-2 border-gray-300 p-3 rounded-lg">
          {RenderTabContent(type)}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
