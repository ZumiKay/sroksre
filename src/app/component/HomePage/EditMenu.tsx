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
      className={`w-full min-h-[60px] h-fit p-4 rounded-xl flex flex-row justify-between items-center cursor-default border border-gray-200 bg-white ${
        isDragging
          ? "shadow-2xl scale-105 border-blue-400 bg-blue-50 z-50"
          : "shadow-sm hover:shadow-md"
      } transition-all duration-200 select-none hover:border-gray-300 group`}
    >
      {isEdit && (
        <div className="mr-3">
          <Checkbox
            size="lg"
            onChange={(e) => onEdit()}
            radius="md"
            classNames={{
              wrapper: "group-hover:border-blue-500",
            }}
          />
        </div>
      )}

      <div
        onClick={() => !isEdit && handleEdit(parseInt(id))}
        className={`flex flex-row items-center gap-x-4 w-full h-full ${
          !isEdit
            ? "cursor-pointer hover:scale-[1.01] transition-transform"
            : ""
        }`}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 group-hover:from-blue-100 group-hover:to-purple-100 transition-colors">
          {type === "slide" ? (
            <SlideIcon />
          ) : type === "category" ? (
            <CateconIcon />
          ) : type === "scrollable" ? (
            <ScrollableconIcon />
          ) : (
            <BannerHomeIcon />
          )}
        </div>
        <div className="flex flex-col gap-y-1 flex-1">
          <div className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors break-words">
            {name}
          </div>
          <div className="text-xs text-gray-500 capitalize">{type}</div>
        </div>
      </div>
      {isEdit && (
        <div
          {...listeners}
          className="ml-2 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <DragIcon />
        </div>
      )}
    </div>
  );
};

const HomeitemsSkeleton = ({ delay = 0 }: { delay?: number }) => {
  return (
    <div
      className="w-full min-h-[60px] p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center gap-4 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Skeleton
        className="flex rounded-lg w-[48px] h-[48px]"
        classNames={{
          base: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer",
        }}
      />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton
          className="h-[16px] w-3/4 rounded-lg"
          classNames={{
            base: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer",
          }}
        />
        <Skeleton
          className="h-[12px] w-1/2 rounded-lg"
          classNames={{
            base: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer",
          }}
        />
      </div>
      <Skeleton
        className="flex rounded-lg w-[32px] h-[32px]"
        classNames={{
          base: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer",
        }}
      />
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
      <div className="w-full h-fit max-h-[650px] flex flex-col justify-start gap-y-6 px-2">
        <div className="flex flex-col gap-y-2">
          {loading ? (
            <>
              <Skeleton className="h-8 w-64 rounded-lg">
                <div className="h-8 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
              </Skeleton>
              <Skeleton className="h-4 w-48 rounded-lg mt-2">
                <div className="h-4 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
              </Skeleton>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Homepage Customize
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit
                  ? "Drag to reorder or select items to delete"
                  : "Click any item to edit its content"}
              </p>
            </>
          )}
        </div>

        {!items && (
          <div className="w-full p-4 rounded-xl border-2 border-red-200 bg-red-50 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm font-medium text-red-800">
              No Items Available
            </p>
          </div>
        )}

        <div className="flex flex-col gap-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {loading ? (
            <div className="flex flex-col gap-y-3">
              {Array.from({
                length: items.length === 0 ? 3 : items.length,
              }).map((_, idx) => (
                <HomeitemsSkeleton key={idx} delay={idx * 100} />
              ))}
            </div>
          ) : (
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
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
          )}
        </div>
      </div>
    </DndContext>
  );
};
