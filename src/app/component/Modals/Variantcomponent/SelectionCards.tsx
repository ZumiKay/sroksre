import React from "react";
import { motion } from "framer-motion";
import Image, { StaticImageData } from "next/image";

interface SelectionCardProps {
  title: string;
  image: StaticImageData;
  count?: number;
  disabled?: boolean;
  onClick: () => void;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  badgeColor: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  image,
  count,
  disabled,
  onClick,
  gradientFrom,
  gradientVia,
  gradientTo,
  badgeColor,
}) => {
  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -5 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`card w-[350px] h-[250px] max-small_phone:w-[200px] max-small_phone:h-[150px] rounded-2xl grid place-content-center place-items-center transition-all duration-300 shadow-lg relative overflow-hidden group ${
        disabled
          ? "bg-linear-to-br from-gray-300 to-gray-400 cursor-not-allowed opacity-60"
          : `bg-linear-to-br ${gradientFrom} ${gradientVia} ${gradientTo} cursor-pointer hover:shadow-2xl`
      }`}
    >
      {!disabled && (
        <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
      <Image
        src={image}
        alt="Icon"
        className="w-[100px] h-[100px] object-contain pb-10 relative z-10 drop-shadow-lg"
      />
      <div className="w-full h-fit text-white flex flex-row items-center justify-center gap-x-3 relative z-10">
        <h3 className="text-2xl font-bold drop-shadow-md">{title}</h3>
        {count !== undefined && count > 0 && (
          <div
            className={`font-bold w-[40px] h-[40px] text-[15px] p-1 bg-white ${badgeColor} rounded-full grid place-content-center shadow-md`}
          >
            {count}
          </div>
        )}
      </div>
    </motion.div>
  );
};
