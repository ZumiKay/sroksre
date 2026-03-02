import { PlusIcon } from "../../../svg/icons";

interface VariantListDisplayProps {
  loading: boolean;
  variants: any[];
  onAdd: () => void;
  onEdit: (variantId: number) => void;
  onDelete: (editId: number, variantId: number) => void;
  editSectionId?: number;
  deletingVariantId?: number;
}

export const VariantListDisplay = ({
  variants,
  onAdd,
  onEdit,
  onDelete,
  editSectionId,
  deletingVariantId,
}: VariantListDisplayProps) => {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-lg text-gray-800">
          Variants in this section ({variants?.length || 0})
        </h4>

        <button
          onClick={onAdd}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
        >
          <PlusIcon />
          Add Variant
        </button>
      </div>

      {!variants || variants.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No variants added yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {variants.map((variant, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {variant.option_title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {variant.option_type} • {variant.option_value.length}{" "}
                    options
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variant.option_value
                      .slice(0, 5)
                      .map((val: any, vIdx: number) => (
                        <span
                          key={vIdx}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm"
                        >
                          {typeof val === "string" ? val : val.name || val.val}
                        </span>
                      ))}
                    {variant.option_value.length > 5 && (
                      <span className="text-xs text-gray-500 px-2 py-0.5">
                        +{variant.option_value.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const variantId = variant.id ?? variant.tempId;
                    if (variantId !== undefined) {
                      onEdit(variantId);
                    }
                  }}
                  disabled={deletingVariantId !== undefined}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    const variantId = variant.id ?? variant.tempId;
                    if (variantId !== undefined) {
                      onDelete(editSectionId ?? 0, variantId);
                    }
                  }}
                  disabled={deletingVariantId !== undefined}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingVariantId === (variant.id ?? variant.tempId) && (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                  )}
                  {deletingVariantId === (variant.id ?? variant.tempId)
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
