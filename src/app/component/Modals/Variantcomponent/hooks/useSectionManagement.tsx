import { useState, useCallback, useMemo } from "react";
import { VariantSectionType } from "@/src/types/product.type";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../../../Loading";

interface UseSectionManagementProps {
  editSectionId?: number;
  tempVariantSectionId: number;
  sectionName: string;
  setSuccessMessage: (message: string) => void;
  setSectionName: (name: string) => void;
  seteditSectonId: (id: number | undefined) => void;
  setNew: (value: any) => void;
  settempVariantSectionId: (id: number) => void;
}

export const useSectionManagement = ({
  editSectionId,
  tempVariantSectionId,
  sectionName,
  setSuccessMessage,
  setSectionName,
  seteditSectonId,
  setNew,
  settempVariantSectionId,
}: UseSectionManagementProps) => {
  const { product, setproduct } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentVariants = useMemo(
    () =>
      product.Variant?.filter((variant) =>
        editSectionId
          ? variant.sectionId === editSectionId
          : variant.sectionId === tempVariantSectionId,
      ),
    [product.Variant, editSectionId, tempVariantSectionId],
  );

  const handleCreateSection = useCallback(async () => {
    if (!currentVariants || currentVariants.length === 0) {
      errorToast("Please Add Variant");
      return;
    }

    let newVariantSection: VariantSectionType = {
      tempId: tempVariantSectionId,
      name: sectionName,
      productsId: product.id,
    };

    if (product.id) {
      setLoading(true);
      const createReq = await ApiRequest(
        "/api/products/crud",
        undefined,
        "PUT",
        "JSON",
        {
          ...newVariantSection,
          tempId: undefined,
          Variants: currentVariants,
          type: "updateVariantSection",
        },
      );
      setLoading(false);

      if (!createReq.success || !createReq?.data?.id) {
        errorToast("Can't Create Variant Section");
        return;
      }

      newVariantSection.id = createReq.data.id;
    }

    setproduct(
      (prev) =>
        ({
          ...prev,
          Variant: prev.Variant?.map((variant) =>
            variant.sectionId === tempVariantSectionId
              ? { ...variant, sectionId: newVariantSection.id }
              : variant,
          ), //Assign created SectionId to selected variant
          Variantsection: prev.Variantsection
            ? [...prev.Variantsection, newVariantSection]
            : [newVariantSection],
        }) as never,
    );
    setSuccessMessage("Variant section created");
    setSectionName("");
    // Increment tempVariantSectionId for next section creation
    settempVariantSectionId(tempVariantSectionId + 1);
    setTimeout(() => setSuccessMessage(""), 3000);
  }, [
    currentVariants,
    tempVariantSectionId,
    sectionName,
    product.id,
    product.Variant,
    product.Variantsection,
    setproduct,
    setSuccessMessage,
    setSectionName,
    settempVariantSectionId,
    setNew,
  ]);

  const handleUpdateVariantSection = useCallback(async () => {
    if (!editSectionId) {
      errorToast("Invalid section or product");
      return;
    }

    if (!sectionName.trim()) {
      errorToast("Section name is required");
      return;
    }

    if (!currentVariants || currentVariants.length === 0) {
      errorToast("Please add at least one variant");
      return;
    }

    if (product.id) {
      setLoading(true);

      const response = await ApiRequest(
        "/api/products/crud",
        undefined,
        "PUT",
        "JSON",
        {
          id: editSectionId,
          name: sectionName,
          productsId: product.id,
          Variants: product.Variant?.filter(
            (i) => i.sectionId === editSectionId,
          ).map((v) => ({ id: v.id })),
          type: "updateVariantSection",
        },
      );
      setLoading(false);

      if (!response.success) {
        errorToast(response.message || "Failed to update section");
        return;
      }
    }

    setproduct((prev) => ({
      ...prev,
      Variantsection: prev.Variantsection?.map((section) =>
        section.id === editSectionId
          ? {
              ...section,
              name: sectionName,
            }
          : section,
      ),
    }));
    setSuccessMessage("Variant section updated successfully");
    setTimeout(() => setSuccessMessage(""), 3000);

    seteditSectonId(undefined);
    setSectionName("");

    settempVariantSectionId(
      Math.max(
        ...(product.Variantsection?.map((s) => s.id || s.tempId || 0) || [0]),
        tempVariantSectionId,
      ) + 1,
    );
    setNew("section-list");
  }, [
    editSectionId,
    product.id,
    product.Variant,
    product.Variantsection,
    sectionName,
    currentVariants,
    setproduct,
    seteditSectonId,
    setNew,
    setSuccessMessage,
    setSectionName,
    settempVariantSectionId,
    tempVariantSectionId,
  ]);

  const handleDeleteSections = useCallback(
    async (deleteId?: number, selectedSections?: Set<number>) => {
      if (deleteId ? false : !selectedSections || selectedSections.size === 0) {
        errorToast("Please select at least one section to delete");
        return;
      }

      const confirmMessage =
        deleteId || selectedSections?.size === 1
          ? "Are you sure you want to delete this section?"
          : `Are you sure you want to delete ${selectedSections?.size} sections?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setIsDeleting(true);
      try {
        if (product.id) {
          const deletePromise = await ApiRequest(
            "/api/products/crud",
            undefined,
            "DELETE",
            "JSON",
            {
              variantsectionIds: deleteId
                ? [deleteId]
                : Array.from(selectedSections!),
            },
          );

          if (!deletePromise.success) {
            errorToast(`Failed to delete`);
            return;
          }
        }

        const sectionsToDelete = deleteId
          ? new Set([deleteId])
          : selectedSections!;

        setproduct((prev) => ({
          ...prev,
          Variantsection: prev.Variantsection?.filter(
            (section) => !sectionsToDelete.has(section.id ?? section.tempId!),
          ),
          Variant: prev.Variant?.map((variant) => {
            if (variant.sectionId && sectionsToDelete.has(variant.sectionId)) {
              return { ...variant, sectionId: undefined };
            }
            return variant;
          }),
        }));

        const message =
          deleteId || selectedSections?.size === 1
            ? "Section deleted successfully"
            : `${selectedSections?.size} sections deleted successfully`;
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        errorToast("An error occurred while deleting sections");
      } finally {
        setIsDeleting(false);
      }
    },
    [product.id, setproduct, setSuccessMessage],
  );

  return {
    loading,
    isDeleting,
    currentVariants,
    handleCreateSection,
    handleUpdateVariantSection,
    handleDeleteSections,
  };
};
