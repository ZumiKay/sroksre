"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox, Skeleton } from "@heroui/react";
import {
  BannerHomeIcon,
  CateconIcon,
  DragIcon,
  ScrollableconIcon,
  SlideIcon,
} from "@/src/app/component/Icons/Homepage";
import { ContainerType } from "@/src/context/GlobalType.type";

const SortableItem = ({
  id,
  name,
  type,
  isEdit,
  onEdit,
}: {
  id: string;
  name: string;
  type: ContainerType;
  onEdit: () => void;
  isEdit?: boolean;
}) => {
  const { setopenmodal, setglobalindex } = useGlobalContext();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: {
      duration: 500,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEdit = (id: number) => {
    setopenmodal((prev) => ({ ...prev, homecontainer: true }));
    setglobalindex((prev) => ({ ...prev, homeeditindex: id }));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`w-full min-h-[50px] h-fit p-2 rounded-lg flex flex-row justify-between items-center cursor-default ${
        isDragging ? "shadow-lg" : ""
      } transition-colors select-none hover:bg-gray-200 active:bg-gray-200`}
    >
      {isEdit && <Checkbox size="lg" onChange={() => onEdit()} radius="md" />}

      <div
        onClick={() => !isEdit && handleEdit(parseInt(id))}
        className="flex flex-row items-center gap-x-5 w-full h-full"
      >
        {type === "slide" ? (
          <SlideIcon />
        ) : type === "category" ? (
          <CateconIcon />
        ) : type === "scrollable" ? (
          <ScrollableconIcon />
        ) : (
          <BannerHomeIcon />
        )}
        <div className="text-sm font-bold w-[150px] break-words">{name}</div>
      </div>
      <div
        hidden={!isEdit}
        {...listeners}
        className="w-fit h-fit cursor-pointer"
      >
        <DragIcon />
      </div>
    </div>
  );
};

export default SortableItem;

export const HomeitemsSkeleton = () => {
  return (
    <div className="max-w-[300px] w-full flex items-center gap-3">
      <div>
        <Skeleton className="flex rounded-small w-[40px] h-[40px]" />
      </div>
      <Skeleton className="h-[40px] w-full rounded-small" />
    </div>
  );
};
