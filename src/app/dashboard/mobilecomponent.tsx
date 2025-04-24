import { Tabs, Tab } from "@heroui/react";
import Image from "next/image";
import { ProfileSideBarItems } from "@/src/context/GlobalType.type";
import { ProfilePageType } from "./component";
import { memo } from "react";

export const DashBoardMobileTab = memo(
  ({
    type,
    settype,
  }: {
    type: ProfilePageType;
    settype: (val: ProfilePageType) => void;
  }) => {
    return (
      <div className="flex w-full flex-col">
        <Tabs
          onSelectionChange={settype as never}
          selectedKey={type}
          aria-label="Options"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-incart",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-gray-300",
          }}
          color="primary"
          variant="underlined"
        >
          {ProfileSideBarItems.map((item) => (
            <Tab
              key={item.value}
              title={
                <div className="flex items-center space-x-2">
                  <Image
                    alt="icon"
                    src={item.icon}
                    loading="lazy"
                    width={25}
                    height={25}
                  />
                  <span>{item.label}</span>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>
    );
  }
);

DashBoardMobileTab.displayName = "DashBoardMobileTab";
