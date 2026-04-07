"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faRotate,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Allstatus } from "@/src/types/order.type";
import { errorToast, successToast } from "@/src/app/component/Loading";
import { bulkDeleteOrders, bulkUpdateOrderStatus } from "../action";

// ─── Context ──────────────────────────────────────────────────────────────────

interface BulkSelectContextType {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  isEnabled: boolean;
}

const BulkSelectContext = createContext<BulkSelectContextType>({
  selectedIds: new Set(),
  toggle: () => {},
  isEnabled: false,
});

export const useBulkSelect = () => useContext(BulkSelectContext);

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface OrderBulkSelectProviderProps {
  children: ReactNode;
  orderIds: string[];
  isAdmin: boolean;
}

export function OrderBulkSelectProvider({
  children,
  orderIds,
  isAdmin,
}: OrderBulkSelectProviderProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [loadingAction, setLoadingAction] = useState<"status" | "delete" | null>(null);
  const router = useRouter();

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === orderIds.length ? new Set() : new Set(orderIds),
    );
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkUpdateStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setLoadingAction("status");
    const result = await bulkUpdateOrderStatus(Array.from(selectedIds), bulkStatus);
    setLoadingAction(null);
    if (!result.success) { errorToast(result.message); return; }
    successToast(result.message);
    setBulkStatus("");
    clearSelection();
    router.refresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setLoadingAction("delete");
    const result = await bulkDeleteOrders(Array.from(selectedIds));
    setLoadingAction(null);
    if (!result.success) { errorToast(result.message); return; }
    successToast(result.message);
    clearSelection();
    router.refresh();
  };

  const allSelected = orderIds.length > 0 && selectedIds.size === orderIds.length;

  return (
    <BulkSelectContext.Provider value={{ selectedIds, toggle, isEnabled: isAdmin }}>
      {/* Sticky bulk-action toolbar */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 mb-4 flex flex-wrap items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3 shadow-sm">
          <span className="text-sm font-semibold text-indigo-700">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-indigo-200 shrink-0" />

          {/* Status selector */}
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="h-9 px-3 text-sm border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Set status…</option>
            {Object.values(Allstatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            disabled={!bulkStatus || !!loadingAction}
            onClick={handleBulkUpdateStatus}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {loadingAction === "status" ? (
              <Spinner />
            ) : (
              <>
                <FontAwesomeIcon icon={faRotate} className="text-xs" />
                Update
              </>
            )}
          </button>

          <button
            disabled={!!loadingAction}
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {loadingAction === "delete" ? (
              <Spinner />
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                Delete ({selectedIds.size})
              </>
            )}
          </button>

          <button
            onClick={clearSelection}
            className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-indigo-200 hover:bg-indigo-100 text-indigo-600 text-sm font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
            Clear
          </button>
        </div>
      )}

      {/* Select-all row above the table */}
      {isAdmin && orderIds.length > 0 && (
        <div className="flex items-center gap-2 px-1 pb-2">
          <div
            onClick={toggleAll}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
              allSelected
                ? "bg-indigo-600 border-indigo-600"
                : "bg-white border-gray-300 hover:border-indigo-400"
            }`}
          >
            {allSelected && (
              <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
            )}
          </div>
          <span
            onClick={toggleAll}
            className="text-sm text-gray-500 cursor-pointer select-none hover:text-gray-700"
          >
            {selectedIds.size > 0
              ? `${selectedIds.size} / ${orderIds.length} selected`
              : "Select all"}
          </span>
        </div>
      )}

      {children}
    </BulkSelectContext.Provider>
  );
}

// ─── RowCheckbox ──────────────────────────────────────────────────────────────

export function RowCheckbox({ id }: { id: string }) {
  const { selectedIds, toggle, isEnabled } = useBulkSelect();
  if (!isEnabled) return null;

  const checked = selectedIds.has(id);
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
      }}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
        checked
          ? "bg-indigo-600 border-indigo-600"
          : "bg-white border-gray-300 hover:border-indigo-400"
      }`}
    >
      {checked && (
        <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
      )}
    </div>
  );
}
