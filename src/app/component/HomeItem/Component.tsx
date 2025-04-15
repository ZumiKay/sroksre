import { JSX } from "react";
import { CircleCheckMark } from "../Asset";
import {
  ContainerType,
  HomeContainerItemType,
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
      className="ItemTypeCard w-[220px] h-[350px] rounded-lg border-1 border-gray-300 transition-all"
      onClick={() => onSelect && onSelect(des.value)}
    >
      <div className="Icon w-[95%] h-[80%]">{<Img />}</div>

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
  item: HomeContainerItemType;
  onSelect: (val: number | string) => void;
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
