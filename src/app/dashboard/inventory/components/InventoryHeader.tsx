"use client";
import React from "react";
import { SelectionCustom } from "../../../component/Pagination_Component";
import { SubInventoryMenu } from "../../../component/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faCheck,
  faClock,
  faFilter,
  faGrip,
  faLayerGroup,
  faList,
  faPercent,
  faPlus,
  faSpinner,
  faTriangleExclamation,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

interface InventoryHeaderProps {
  type?: string;
  itemTotal: number;
  lowstock: number;
  promoexpire: number;
  hasActiveFilters: boolean;
  isPromotionSelection: boolean;
  isBannerSelection: boolean;
  isManagingBanner: boolean;
  isMultipleProducts: boolean;
  isLoadingUpdate: boolean;
  viewMode: "card" | "list";
  onFilterChange: (value: string) => void;
  onFilterClick: () => void;
  onDiscountClick: () => void;
  onAddBannerClick: () => void;
  onDoneClick: () => void;
  onViewModeChange: (mode: "card" | "list") => void;
}

const createMenu = [
  { value: "Product", opencon: "createProduct" },
  { value: "Category", opencon: "createCategory" },
  { value: "Banner", opencon: "createBanner" },
  { value: "Promotion", opencon: "createPromotion" },
];

const filterOptions = [
  { value: "product", label: "Product" },
  { value: "banner", label: "Banner" },
  { value: "promotion", label: "Promotion" },
];

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  type,
  itemTotal,
  lowstock,
  promoexpire,
  hasActiveFilters,
  isPromotionSelection,
  isBannerSelection,
  isManagingBanner,
  isMultipleProducts,
  isLoadingUpdate,
  viewMode,
  onFilterChange,
  onFilterClick,
  onDiscountClick,
  onAddBannerClick,
  onDoneClick,
  onViewModeChange,
}) => {
  const showNormalMode =
    !isPromotionSelection && !isBannerSelection && !isManagingBanner;

  return (
    <div className="w-full flex flex-row items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      {showNormalMode ? (
        <>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-linear-to-r from-indigo-50 to-purple-50 rounded-lg md:rounded-xl border-2 border-indigo-200">
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="text-indigo-500 text-sm md:text-base"
              />
              <SelectionCustom
                label="Filter"
                data={filterOptions}
                placeholder="Item"
                value={type}
                onChange={(val) => onFilterChange(val.toString().toLowerCase())}
                style={{ width: "140px" }}
              />
            </div>
          </div>

          <div className="shrink-0">
            <SubInventoryMenu
              data={createMenu as any}
              open="subcreatemenu_ivt"
            />
          </div>

          <StatBadge
            icon={faBox}
            label="Total"
            value={itemTotal}
            gradient="from-blue-500 to-cyan-600"
          />

          {type === "product" && (
            <StatBadge
              icon={faTriangleExclamation}
              label="Low"
              value={lowstock}
              gradient="from-red-500 to-pink-600"
            />
          )}

          {type === "promotion" && (
            <StatBadge
              icon={faClock}
              label="Expired"
              value={promoexpire}
              gradient="from-orange-500 to-red-600"
            />
          )}
        </>
      ) : (
        <>
          {isPromotionSelection && isMultipleProducts && (
            <ActionButton
              icon={faPercent}
              label="Discount"
              gradient="from-purple-500 to-pink-600"
              onClick={onDiscountClick}
            />
          )}
        </>
      )}

      {isBannerSelection && (
        <ActionButton
          icon={faPlus}
          label="Add New"
          gradient="from-green-500 to-emerald-600"
          onClick={onAddBannerClick}
        />
      )}

      {(isPromotionSelection || isBannerSelection) && (
        <button
          type="button"
          onClick={onDoneClick}
          disabled={isLoadingUpdate}
          className={`shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl shadow-md font-bold text-xs md:text-sm transition-all ${
            isLoadingUpdate
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-linear-to-r from-blue-500 to-cyan-600 text-white hover:shadow-lg hover:scale-105"
          }`}
        >
          {isLoadingUpdate ? (
            <>
              <FontAwesomeIcon
                icon={faSpinner}
                className="text-sm md:text-base"
              />
              <span className="whitespace-nowrap">Processing...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-check text-sm md:text-base"></i>
              <FontAwesomeIcon
                icon={faCheck}
                className="text-sm md:text-base"
              />
              <span className="whitespace-nowrap">Done</span>
            </>
          )}
        </button>
      )}

      <ActionButton
        icon={faFilter}
        label={hasActiveFilters ? "Clear" : "Filter"}
        gradient="from-cyan-500 to-blue-600"
        onClick={onFilterClick}
      />

      <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
    </div>
  );
};

// Sub-components
const StatBadge: React.FC<{
  icon: IconDefinition;
  label: string;
  value: number;
  gradient: string;
}> = ({ icon, label, value, gradient }) => (
  <div
    className={`shrink-0 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2.5 bg-linear-to-r ${gradient} text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all`}
  >
    <FontAwesomeIcon icon={icon} className={`text-sm md:text-lg`} />
    <span className="font-bold text-xs md:text-sm whitespace-nowrap">
      {label}: {value}
    </span>
  </div>
);

const ActionButton: React.FC<{
  icon: IconDefinition;
  label: string;
  gradient: string;
  onClick: () => void;
}> = ({ icon, label, gradient, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 bg-linear-to-r ${gradient} text-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 font-bold text-xs md:text-sm`}
  >
    <FontAwesomeIcon icon={icon} className={`text-sm md:text-base`} />
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

const ViewModeToggle: React.FC<{
  viewMode: "card" | "list";
  onChange: (mode: "card" | "list") => void;
}> = ({ viewMode, onChange }) => (
  <div className="shrink-0 flex items-center gap-1 bg-white rounded-lg md:rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
    <button
      type="button"
      onClick={() => onChange("card")}
      className={`px-2.5 md:px-3 py-1.5 md:py-2 transition-all ${
        viewMode === "card"
          ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
      title="Card View"
    >
      <FontAwesomeIcon icon={faGrip} className="text-sm md:text-base" />
    </button>
    <button
      type="button"
      onClick={() => onChange("list")}
      className={`px-2.5 md:px-3 py-1.5 md:py-2 transition-all ${
        viewMode === "list"
          ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
      title="List View"
    >
      <FontAwesomeIcon icon={faList} className="text-sm md:text-base" />
    </button>
  </div>
);
