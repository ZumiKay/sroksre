"use client";
import React from "react";
import { VariantList } from "./VariantList";
import { EmptyState } from "./EmptyState";
import { NormalSkeleton } from "../../Banner";
import { PlusRoundSignIcon } from "../../svg/icons";

interface VariantViewProps {
  variants?: any[];
  loading: boolean;
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
  onAddNew: () => void;
}

export const VariantView: React.FC<VariantViewProps> = ({
  variants,
  loading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  return (
    <>
      <div className="w-full flex flex-col items-center gap-y-5">
        {(!variants || variants.length === 0) && (
          <EmptyState
            title="No Variants Yet"
            description="Create your first variant to get started"
          />
        )}
        {loading ? (
          <NormalSkeleton count={3} width="90%" height="fit-content" />
        ) : (
          variants && (
            <VariantList
              variants={variants}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        )}
      </div>
      <button
        type="button"
        onClick={onAddNew}
        className="w-[90%] h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
      >
        <PlusRoundSignIcon />
        Add New Variant
      </button>
    </>
  );
};
