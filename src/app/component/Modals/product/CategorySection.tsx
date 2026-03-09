"use client";

import {
  CateogoryState,
  SubcategoriesState,
} from "@/src/context/GlobalContext";
import { SelectionCustom } from "@/src/app/component/Pagination_Component";
import { useCallback, useEffect, useRef, useState } from "react";

const CategorySkeleton = () => (
  <div className="w-full flex flex-col gap-4">
    {[0, 200].map((delay) => (
      <div key={delay} className="animate-pulse">
        <div className="h-4 w-24 bg-gray-300 rounded-sm mb-2" />
        <div className="h-12 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg relative overflow-hidden">
          <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer"
            style={{ animationDelay: `${delay}ms` }}
          />
        </div>
      </div>
    ))}
    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="animate-pulse">Fetching categories...</span>
    </div>
  </div>
);

type CateType = "parent_id" | "child_id";
interface CategorySectionProps {
  cate: CateogoryState[] | undefined;
  subcate: SubcategoriesState[];
  parentId: number | undefined;
  childId: number | undefined;
  categoriesLoading: boolean;
  onSelect: (value: string, name: CateType) => void;
}

export const CategorySection = ({
  cate,
  subcate,
  parentId,
  childId,
  categoriesLoading,
  onSelect,
}: CategorySectionProps) => {
  //state
  const [categoriesState, setcategoriesState] = useState<
    Record<CateType, string>
  >({
    parent_id: parentId ? parentId.toString() : "",
    child_id: childId ? childId.toString() : "",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<
    HTMLElement | undefined
  >(undefined);

  useEffect(() => {
    if (containerRef.current) {
      const dialog =
        containerRef.current.closest<HTMLElement>('[role="dialog"]');
      setPortalContainer(dialog ?? undefined);
    }
  }, []);

  if (categoriesLoading) return <CategorySkeleton />;

  const handleSelect = (val: string, type: CateType) => {
    onSelect(val, type);
    setcategoriesState((prev) => ({ ...prev, [type]: val }));
  };

  //Eleement
  return (
    <div
      ref={containerRef}
      className="category_sec flex flex-col gap-y-4 w-full h-fit"
    >
      <SelectionCustom
        textplacement="outside"
        label="Category"
        defaultValue="Please Select"
        placeholder="Select"
        value={categoriesState.parent_id}
        data={cate?.map((i) => ({ label: i.name, value: `${i.id}` })) ?? []}
        onChange={(val) => handleSelect(val.toString(), "parent_id")}
        popoverProps={portalContainer ? { portalContainer } : undefined}
      />
      {parentId ? (
        <SelectionCustom
          label="Sub Category"
          textplacement="outside"
          value={categoriesState.child_id}
          data={subcate.map((sub) => ({ label: sub.name, value: `${sub.id}` }))}
          defaultValue="None"
          placeholder="Select"
          onChange={(val) => handleSelect(val.toString(), "child_id")}
          popoverProps={portalContainer ? { portalContainer } : undefined}
        />
      ) : null}
    </div>
  );
};
