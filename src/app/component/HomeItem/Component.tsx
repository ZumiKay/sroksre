import { JSX } from "react";
import { CircleCheckMark } from "../Asset";
import {
  ContainerItemCardType,
  ContainerType,
} from "@/src/context/GlobalType.type";
import Image from "next/image";

interface ItemTypeCard {
  Img: () => JSX.Element;
  isActive?: boolean;
  des: {
    value: ContainerType;
    type: string;
  };
  onSelect?: (val: ContainerType) => void;
}

export const ItemTypeCard = ({
  Img,
  isActive,
  des,
  onSelect,
}: ItemTypeCard) => {
  return (
    <div
      style={isActive ? { border: `2px solid black` } : {}}
      className="ItemTypeCard w-[250px] h-[200px] rounded-lg border-1 border-gray-300 transition-all p-2 hover:border-3 hover:border-gray-400"
      onClick={() => onSelect && onSelect(des.value)}
    >
      <div className="Icon w-full h-[150px] grid place-content-center">
        {<Img />}
      </div>

      <div className="description w-full h-[20%] flex flex-col gap-y-3 relative">
        <p className="font-bold text-lg">{des.type}</p>
        {isActive && (
          <span className="w-fit h-fit absolute top-1 right-0">
            <CircleCheckMark />
          </span>
        )}
      </div>
    </div>
  );
};

type ItemCardProps = {
  item: ContainerItemCardType;
  onSelect: (val: number) => void;
  isSelected: boolean;
};
export const ItemCard = ({ item, onSelect, isSelected }: ItemCardProps) => {
  return (
    <div
      onClick={() => onSelect(item.id as number)}
      className={`item_card w-[250px] h-[350px] relative rounded-xl shadow-md transition-all duration-300 hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {isSelected && (
        <span className="absolute top-2 right-2 z-10">
          <CircleCheckMark />
        </span>
      )}
      <div
        className={`w-full h-1/2 rounded-t-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center overflow-hidden ${
          isSelected ? "border border-blue-500" : ""
        }`}
      >
        {!item.name ? (
          <p className="text-white">Cover</p>
        ) : (
          <Image
            src={item.image}
            alt={item.name}
            width={500}
            height={500}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="item_detail w-full h-1/2 p-4 flex flex-col gap-3 bg-white rounded-b-xl">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {item.name}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3">Description</p>
      </div>
    </div>
  );
};
