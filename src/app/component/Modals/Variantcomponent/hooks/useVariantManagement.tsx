import { useCallback, useState } from "react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../../../Loading";

interface UseVariantManagementProps {
  setVariantSectionId: (id: number | undefined) => void;
  setNew: (value: any) => void;
  setaccessFromSection: (value: any) => void;
  setSuccessMessage: (message: string) => void;
}

export const useVariantManagement = ({
  setVariantSectionId,
  setNew,
  setaccessFromSection,
  setSuccessMessage,
}: UseVariantManagementProps) => {
  const { product, setproduct } = useGlobalContext();
  const [loading, setLoading] = useState(false);

  const handleAddVariant = useCallback(
    (sectionId: number, selectedTab: string) => {
      console.log("Start add variant with temp_ID", sectionId);
      setVariantSectionId(sectionId);
      setaccessFromSection(
        selectedTab === "create" ? "secion-create" : "section-list",
      );
      if (product.Variant && product.Variant.length > 0) {
        setNew("variant");
      } else {
        setNew("type");
      }
    },
    [setVariantSectionId, setaccessFromSection, setNew, product.Variant],
  );

  const handleEditVariant = useCallback(
    (variantId: number) => {
      const variantToEdit = product.Variant?.find(
        (v) => (v.id ?? v.tempId) === variantId,
      );
      if (!variantToEdit) {
        errorToast("Variant not found");
        return;
      }

      setVariantSectionId(variantToEdit.sectionId);
      setNew("type");
    },
    [product.Variant, setVariantSectionId, setNew],
  );

  const handleDeleteVariant = useCallback(
    async (editId: number, variantId: number) => {
      if (!window.confirm("Are you sure you want to delete this variant?")) {
        return;
      }

      setLoading(true);
      try {
        if (product.id && editId) {
          const response = await ApiRequest(
            "/api/products/crud",
            undefined,
            "PUT",
            "JSON",
            {
              id: editId,
              variantId: variantId,
              type: "updateVariantSection",
            },
          );

          if (!response.success) {
            errorToast(response.message || "Failed to delete variant");
            return;
          }
        }

        setproduct((prev) => ({
          ...prev,
          Variant: prev.Variant?.filter(
            (v) => (v.id ?? v.tempId) !== variantId,
          ),
        }));

        setSuccessMessage("Variant deleted successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        errorToast("An error occurred while deleting variant");
      } finally {
        setLoading(false);
      }
    },
    [product.id, setproduct, setSuccessMessage],
  );

  return {
    loading,
    handleAddVariant,
    handleEditVariant,
    handleDeleteVariant,
  };
};
