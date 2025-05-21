import { JSX } from "react";
import { CircleCheckMark } from "../Asset";
import {
  ContainerItemCardType,
  ContainerType,
} from "@/src/context/GlobalType.type";

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
      onClick={() => onSelect(item.id)}
      className="item_card w-[250px] h-[350px] relative"
    >
      {isSelected && (
        <span className="w-fit h-fit absolute top-1 right-0">
          <CircleCheckMark />
        </span>
      )}
      <div
        style={isSelected ? { border: "1px solid lightgray" } : {}}
        className="bg-black w-full h-1/2 rounded-lg"
      >
        <p>Cover Banner</p>
      </div>

      <div className="item_detail w-full h-fit flex flex-col gap-3">
        <p>{item.name}</p>
        <p>Description</p>
      </div>
    </div>
  );
};
