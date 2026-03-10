"use client";

import { memo, ReactNode } from "react";
import {
  BannerIcon,
  CategoriesIcon,
  ScrollableConIcon,
  SlideShowIcon,
} from "../../Asset";

const containerTypes = [
  { type: "Slide Show", value: "slide", icon: <SlideShowIcon /> },
  {
    type: "Scrollable Container",
    value: "scrollable",
    icon: <ScrollableConIcon />,
  },
  { type: "Categories", value: "category", icon: <CategoriesIcon /> },
  { type: "Banner", value: "banner", icon: <BannerIcon /> },
];

const ContainerTypeCard = memo(function ContainerTypeCard({
  type,
  onClick,
  Icon,
}: {
  type: string;
  Icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="w-80 h-70
      max-smallest_phone:w-full
      rounded-2xl flex flex-col justify-start items-center bg-linear-to-br from-white to-gray-100 text-gray-800
      transition-all duration-500 cursor-pointer
      hover:scale-105 hover:shadow-2xl hover:from-blue-500 hover:to-blue-600 hover:text-white
      active:scale-95
      border-2 border-gray-200 hover:border-blue-400
      shadow-lg group"
    >
      <h3 className="text-xl font-bold w-[90%] h-[35%] text-left flex items-center px-4 group-hover:scale-105 transition-transform duration-300">
        {type}
      </h3>
      <div className="icon h-[65%] flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
        {Icon}
      </div>
    </div>
  );
});

export const ContainerTypeSelection = memo(function ContainerTypeSelection({
  onClick,
}: {
  onClick: (type: string) => void;
}) {
  return (
    <div className="w-full h-full grid grid-cols-2 max-large_tablet:grid-cols-1 gap-y-12 gap-x-8 pb-5 place-items-center">
      {containerTypes.map((item, idx) => (
        <ContainerTypeCard
          onClick={() => onClick(item.value)}
          key={idx}
          Icon={item.icon}
          type={item.type}
        />
      ))}
    </div>
  );
});
