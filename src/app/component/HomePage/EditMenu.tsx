"use client";
import { useState } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  useSortable,
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BannerHomeIcon,
  CateconIcon,
  DragIcon,
  ScrollableconIcon,
  SlideIcon,
} from "../Icons/Homepage";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { Checkbox, Skeleton } from "@nextui-org/react";
import {
  ContainerType,
  Homeitemtype,
} from "../../severactions/containeraction";
import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
} from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";

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
      {isEdit && <Checkbox size="lg" onChange={(e) => onEdit()} radius="md" />}

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

const HomeitemsSkeleton = () => {
  return (
    <div className="max-w-[300px] w-full flex items-center gap-3">
      <div>
        <Skeleton className="flex rounded-small w-[40px] h-[40px]" />
      </div>
      <Skeleton className="h-[40px] w-full rounded-small" />
    </div>
  );
};

export const Homeeditmenu = ({
  isEdit,
  onEdit,
  items,
  setItems,
}: {
  items: Homeitemtype[];
  setItems: React.Dispatch<React.SetStateAction<Homeitemtype[]>>;
  isEdit: boolean;
  onEdit: (idx: number) => void;
}) => {
  const [loading, setloading] = useState(false);

  useEffectOnce(() => {
    const fetchdata = async () => {
      async function getItems() {
        const response = await ApiRequest(
          "/api/home?ty=short",
          undefined,
          "GET"
        );
        if (response.success) {
          setItems(response.data);
        }
      }
      await Delayloading(getItems, setloading, 500);
    };
    fetchdata();
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-[90%] h-fit max-h-[600px] flex flex-col justify-start gap-y-5">
        <h3 className="text-lg w-full h-fit text-left font-bold">
          Homepage Customize
        </h3>
        {loading &&
          Array.from({ length: 3 }).map((i, idx) => (
            <HomeitemsSkeleton key={idx} />
          ))}

        {!loading && items.length === 0 && (
          <h3 className="text-lg font-normal border-2 border-red-300 p-1 w-full rounded-medium">
            No Items
          </h3>
        )}
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <SortableItem
              key={item.id}
              id={item.id}
              type={item.type}
              name={item.name}
              isEdit={isEdit}
              onEdit={() => onEdit(idx)}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};
