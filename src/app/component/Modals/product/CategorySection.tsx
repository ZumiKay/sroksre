"use client";

import { CateogoryState, SubcategoriesState } from "@/src/context/GlobalContext";
import { SelectionCustom } from "@/src/app/component/Pagination_Component";

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

interface CategorySectionProps {
  cate: CateogoryState[] | undefined;
  subcate: SubcategoriesState[];
  parentId: number | undefined;
  childId: number | undefined;
  categoriesLoading: boolean;
  onSelect: (value: string, name: "parent_id" | "child_id") => void;
}

export const CategorySection = ({
  cate,
  subcate,
  parentId,
  childId,
  categoriesLoading,
  onSelect,
}: CategorySectionProps) => {
  if (categoriesLoading) return <CategorySkeleton />;

  return (
    <div className="category_sec flex flex-col gap-y-4 w-full h-fit">
      <SelectionCustom
        textplacement="outside"
        label="Category"
        placeholder="Select"
        value={parentId ? `${parentId}` : undefined}
        data={cate?.map((i) => ({ label: i.name, value: `${i.id}` })) ?? []}
        onChange={(val) => onSelect(val.toString(), "parent_id")}
      />
      {parentId ? (
        <SelectionCustom
          label="Sub Category"
          textplacement="outside"
          value={childId ? `${childId}` : undefined}
          data={subcate.map((sub) => ({ label: sub.name, value: `${sub.id}` }))}
          placeholder="Select"
          onChange={(val) => onSelect(val.toString(), "child_id")}
        />
      ) : null}
    </div>
  );
};
