"use client";
import React, { useState, useMemo } from "react";
import { VariantList } from "./VariantList";
import { EmptyState } from "./EmptyState";
import { NormalSkeleton } from "../../Banner";
import { InfoMarkIcon, PlusRoundSignIcon } from "../../svg/icons";
import { VariantSectionType, Varianttype } from "@/src/types/product.type";
import { accessFromSectionType } from "../VariantModal";

interface VariantViewProps {
  variants?: Varianttype[];
  allVariants?: Varianttype[]; // For getting full list when needed
  variantSections?: VariantSectionType[];
  loading: boolean;
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
  onDeleteMultiple?: (variantIds: number[]) => void;
  onAddNew: () => void;
  accessFromSection: accessFromSectionType;
  variantSectionId?: number;
  onSelectVariant?: (variantId: number) => void;
  onVariantsSelected?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  currentPage?: number;
  totalPages?: number;
  setCurrentPage?: (page: number) => void;
  totalVariants?: number;
  productId?: number;
}

export const VariantView: React.FC<VariantViewProps> = ({
  variants,
  allVariants,
  variantSections,
  loading,
  onEdit,
  onDelete,
  onDeleteMultiple,
  onAddNew,
  accessFromSection,
  variantSectionId,
  onSelectVariant,
  onVariantsSelected,
  searchQuery = "",
  setSearchQuery,
  currentPage = 1,
  totalPages = 1,
  setCurrentPage,
  totalVariants = 0,
  productId,
}) => {
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(
    new Set(),
  );
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(
    new Set(),
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if a variant belongs to any section (by checking if it has a sectionId)
  const getVariantSection = (variant: Varianttype) => {
    if (!variant?.sectionId || !variantSections) return null;
    return variantSections.find((section) => section.id === variant.sectionId);
  };

  const isInCurrentSection = (variant: Varianttype) => {
    if (!accessFromSection || !variantSectionId) return false;
    if (
      accessFromSection !== "section-list" &&
      accessFromSection !== "secion-create"
    )
      return false;
    return variant?.sectionId === variantSectionId;
  };

  const handleVariantToggle = (variantId: number, variant: Varianttype) => {
    // Don't allow selection if variant already belongs to any section
    const belongsToSection = getVariantSection(variant);
    const inCurrentSection = isInCurrentSection(variant);

    if (belongsToSection || inCurrentSection) return;

    setSelectedVariants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return newSet;
    });
  };

  const handleAddSelectedVariants = () => {
    if (onSelectVariant && selectedVariants.size > 0) {
      selectedVariants.forEach((id) => onSelectVariant(id));
      setSelectedVariants(new Set());
      // Call callback after all variants are selected
      if (onVariantsSelected) {
        onVariantsSelected();
      }
    }
  };

  const handleToggleDeleteSelection = (variantId: number) => {
    setSelectedForDelete((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (!productId || selectedForDelete.size === 0 || !variants) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/products/crud", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: productId,
          variantId: Array.from(selectedForDelete),
        }),
      });

      if (response.ok) {
        // Use onDeleteMultiple if available, otherwise fall back to individual deletes
        if (onDeleteMultiple) {
          onDeleteMultiple(Array.from(selectedForDelete));
        } else {
          // Find the indices of the deleted variants
          const deletedIndices: number[] = [];
          variants.forEach((variant, idx) => {
            const variantId = variant.id ?? variant.tempId;
            if (variantId && selectedForDelete.has(variantId)) {
              deletedIndices.push(idx);
            }
          });

          // Call onDelete for each variant, starting from the end to maintain correct indices
          deletedIndices.reverse().forEach((idx) => {
            onDelete(idx);
          });
        }

        // Clear selection
        setSelectedForDelete(new Set());
      } else {
        console.log("Failed to delete variants");
      }
    } catch (error) {
      console.log("Error deleting variants:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = () => {
    if (!variants) return;
    const allIds = variants.filter((v) => v.id).map((v) => v.id as number);
    setSelectedForDelete(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedForDelete(new Set());
  };

  return (
    <>
      {accessFromSection &&
        accessFromSection === "secion-create" &&
        variantSectionId && (
          <div className="w-[90%] mb-4">
            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <InfoMarkIcon />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">
                  Select existing variants or create a new one for this section
                </p>
                {selectedVariants.size > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedVariants.size} variant(s) selected
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Search bar for filtering variants when there are many */}
      {!accessFromSection &&
        setSearchQuery &&
        (allVariants?.length ?? 0) > 10 && (
          <div className="w-[90%] mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search variants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                Found {totalVariants} variant{totalVariants !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

      <div className="w-full flex flex-col items-center gap-y-5">
        {(!variants || variants.length === 0) && (
          <EmptyState
            title={
              accessFromSection === "secion-create"
                ? "No Available Variants"
                : "No Variants Yet"
            }
            description={
              accessFromSection == "secion-create"
                ? "All existing variants are already in this section. Create a new one below."
                : "Create your first variant to get started"
            }
          />
        )}
        {loading ? (
          <NormalSkeleton count={3} width="90%" height="fit-content" />
        ) : (
          variants &&
          variants.length > 0 && (
            <>
              {/**Show as selection mode for variant create section */}
              {accessFromSection === "secion-create" ? (
                <div className="w-[90%] space-y-3">
                  {variants?.map((variant, idx) => {
                    const belongsToSection = getVariantSection(variant);
                    const inCurrentSection = isInCurrentSection(variant);
                    const isDisabled = !!belongsToSection || inCurrentSection;

                    return (
                      <div
                        key={variant.id ?? variant.tempId ?? idx}
                        onClick={() => {
                          const variantId = variant?.id ?? variant?.tempId ?? 0;
                          if (!isDisabled && variantId) {
                            handleVariantToggle(variantId, variant);
                          }
                        }}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          isDisabled
                            ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-60"
                            : selectedVariants.has(
                                  variant?.id ?? variant?.tempId ?? 0,
                                )
                              ? "border-blue-500 bg-blue-50 cursor-pointer"
                              : "border-gray-200 bg-white hover:border-blue-300 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`font-semibold ${isDisabled ? "text-gray-500" : "text-gray-800"}`}
                              >
                                {variant.option_title}
                              </h4>
                              {variant.optional && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Optional
                                </span>
                              )}
                              {isDisabled && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {inCurrentSection
                                    ? "Already Added"
                                    : "In Section"}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm ${isDisabled ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {variant.option_type} •{" "}
                              {Array.isArray(variant.option_value)
                                ? variant.option_value.length
                                : 0}{" "}
                              options
                              {isDisabled &&
                                belongsToSection &&
                                !inCurrentSection && (
                                  <span className="ml-2">
                                    • Section:{" "}
                                    <span className="font-medium">
                                      {belongsToSection.name}
                                    </span>
                                  </span>
                                )}
                              {inCurrentSection && (
                                <span className="ml-2">
                                  • Already in this section
                                </span>
                              )}
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isDisabled
                                ? "border-gray-400 bg-gray-300"
                                : selectedVariants.has(variant?.id ?? 0)
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                            }`}
                          >
                            {isDisabled ? (
                              <svg
                                className="w-4 h-4 text-gray-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : selectedVariants.has(variant?.id ?? 0) ? (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {!accessFromSection && variants && variants.length > 0 && (
                    <div className="w-[90%] flex items-center justify-between gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSelectAll}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={handleDeselectAll}
                          className="text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors"
                        >
                          Deselect All
                        </button>
                        {selectedForDelete.size > 0 && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({selectedForDelete.size} selected)
                          </span>
                        )}
                      </div>
                      {selectedForDelete.size > 0 && (
                        <button
                          onClick={handleDeleteSelected}
                          disabled={isDeleting}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {isDeleting ? (
                            <>
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
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Delete Selected ({selectedForDelete.size})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  <VariantList
                    variants={
                      accessFromSection === "section-list"
                        ? variants.filter(
                            (i) => i.sectionId === variantSectionId,
                          )
                        : variants
                    }
                    variantSections={variantSections}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    selectedForDelete={selectedForDelete}
                    onToggleDeleteSelection={handleToggleDeleteSelection}
                    showDeleteCheckbox={!accessFromSection}
                  />
                </>
              )}
            </>
          )
        )}
      </div>

      {/* Pagination controls for large datasets */}
      {!accessFromSection && totalPages > 1 && setCurrentPage && (
        <div className="w-[90%] flex items-center justify-between gap-4 py-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            {totalPages <= 10 ? (
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded ${
                        page === currentPage
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      } transition-colors`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
            ) : (
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded-sm text-center"
              />
            )}
          </div>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {accessFromSection === "secion-create" && selectedVariants.size > 0 && (
        <button
          type="button"
          onClick={handleAddSelectedVariants}
          className="w-[90%] h-12 rounded-xl bg-linear-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mb-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Add Selected Variants ({selectedVariants.size})
        </button>
      )}

      <button
        type="button"
        onClick={onAddNew}
        className="w-[90%] h-12 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
      >
        <PlusRoundSignIcon />
        {accessFromSection === "secion-create"
          ? "Create New Variant"
          : "Add New Variant"}
      </button>
    </>
  );
};
