"use client";
import { useState, useEffect, memo } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import SortableItem, {
  HomeitemsSkeleton,
} from "@/src/app/component/HomePage/SortableComponent";
import { Homeitemtype } from "@/src/context/GlobalType.type";

const Homeeditmenu = memo(
  ({
    isEdit,
    onEdit,
    items,
    setItems,
  }: {
    items: Homeitemtype[];
    setItems?: React.Dispatch<React.SetStateAction<Homeitemtype[]>>;
    isEdit: boolean;
    onEdit?: (idx: number) => void;
  }) => {
    const [loading, setloading] = useState(false);

    useEffect(() => {
      const fetchdata = async () => {
        async function getItems() {
          const response = await ApiRequest({
            url: "/api/home?ty=short",
            method: "GET",
          });
          if (response.success && setItems) {
            setItems(response.data as Homeitemtype[]);
          }
        }

        await Delayloading(getItems, setloading, 500);
      };
      fetchdata();
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      console.log({ active, over });

      if (active.id !== over?.id && setItems) {
        setItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over?.id);
          const newItems = arrayMove(items, oldIndex, newIndex);

          // Update idx property for each item based on new position
          return newItems.map((item, index) => ({
            ...item,
            idx: index,
          }));
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
          <p className="text-lg w-full h-fit text-left font-bold">
            Homepage Customize
          </p>

          {!items && (
            <p className="text-lg font-normal border-2 border-red-300 p-1 w-full rounded-medium">
              No Items
            </p>
          )}
          {loading ? (
            Array.from({ length: items.length === 0 ? 3 : items.length }).map(
              (_, idx) => <HomeitemsSkeleton key={idx} />
            )
          ) : (
            <SortableContext
              items={items as never}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, idx) => (
                <SortableItem
                  key={item.id}
                  id={item.id as never}
                  type={item.type}
                  name={item.name}
                  isEdit={isEdit}
                  onEdit={() => onEdit && onEdit(idx)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
    );
  }
);

Homeeditmenu.displayName = "Homeeditmenu";

export default Homeeditmenu;
