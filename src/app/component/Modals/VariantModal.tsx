"use client";
import {
  ProductStockType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { errorToast } from "../Loading";
import {
  FormEvent,
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import tinycolor from "tinycolor2";
import { SecondaryModal } from "../Modals";
import PrimaryButton from "../Button";
import Variantimg from "../../../../public/Image/Variant.png";
import Variantstockimg from "../../../../public/Image/Stock.png";
import { ManageStockContainer } from "./VariantModalComponent";
import React from "react";

// Import types and utilities
import {
  Colortype,
  Colorinitalize,
  Variantcontainertype,
  ModalOpenState,
} from "./types";
import { useVariantManager } from "./Variantcomponent/hooks/useVariantManager";
import { useStockManager } from "./Variantcomponent/hooks/useStockManager";
import { useTemplateManager } from "./Variantcomponent/hooks/useTemplateManager";
import { SelectionCard } from "./Variantcomponent/SelectionCards";
import { VariantTypeSelection } from "./Variantcomponent/VariantTypeSelection";
import { VariantInfoEditor } from "./Variantcomponent/VariantInfoEditor";
import { VariantView } from "./Variantcomponent/VariantView";
import {
  ArraysAreEqualSets,
  checkVariantExists,
  updateStockOnVariantEdit,
  cleanEmptyStock,
} from "./Variantcomponent/utils";
import {
  Stocktype,
  VariantValueObjType,
  VariantTypeEnum,
} from "@/src/types/product.type";
import VariantSectionEditor from "./Variantcomponent/VariantSectionEditor";

export { Colorinitalize, ArraysAreEqualSets };
export type { Colortype, Variantcontainertype };

export type accessFromSectionType =
  | "secion-create"
  | "section-list"
  | undefined;

export const Variantcontainer = ({
  type,
  editindex,
  closename,
}: {
  type?: "stock";
  editindex?: number;
  closename?: string;
}) => {
  const { openmodal, setopenmodal, product, setproduct } = useGlobalContext();

  // Use custom hooks
  const variantManager = useVariantManager();
  const stockManager = useStockManager();
  const templateManager = useTemplateManager();

  // Local state
  const [open, setOpen] = useState<ModalOpenState>({
    addcolor: false,
    addoption: false,
    addtemplate: false,
  });
  const [newadd, setNew] = useState<Variantcontainertype>(type ?? "none");
  const [addstock, setaddstock] = useState(-1);
  const [reloaddata, setreloaddata] = useState(true);
  const [mainLoading, setMainLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Variant Section state
  const [sectionName, setSectionName] = useState("");
  const [sectionId, setsetionId] = useState<number>();
  const [editSectionId, setEditSectionId] = useState<number>();
  const [accessFromSection, setaccessFromSection] =
    useState<accessFromSectionType>();

  // Variant price and optional state
  const [variantPrice, setVariantPrice] = useState<number | undefined>(
    undefined,
  );
  const [variantOptional, setVariantOptional] = useState(false);

  // Search and filter state for large data handling
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Show 50 items per page

  // Memoize filtered variants based on search
  const filteredVariants = useMemo(() => {
    if (!product.Variant) return [];
    if (!searchQuery.trim()) return product.Variant;

    const query = searchQuery.toLowerCase();
    return product.Variant.filter(
      (variant) =>
        variant.option_title.toLowerCase().includes(query) ||
        variant.option_value.some((val) => {
          const valString = typeof val === "string" ? val : val.val;
          return valString.toLowerCase().includes(query);
        }),
    );
  }, [product.Variant, searchQuery]);

  // Memoize paginated variants
  const paginatedVariants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVariants.slice(startIndex, endIndex);
  }, [filteredVariants, currentPage, itemsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil(filteredVariants.length / itemsPerPage),
    [filteredVariants.length, itemsPerPage],
  );

  // Fetch variant stock
  const fetchstock = useCallback(
    async (index: number) => {
      const asyncfetchdata = async () => {
        const URL = `/api/products?ty=${type}&pid=${index}`;
        const response = await ApiRequest(URL, undefined, "GET");

        if (!response.success) {
          errorToast("Error Connection");
          return;
        }

        setproduct((prev) => ({
          ...prev,
          ...response.data,
        }));
        setreloaddata(false);
      };
      await Delayloading(asyncfetchdata, setMainLoading, 500);
    },
    [type, setproduct],
  );

  useEffect(() => {
    if (editindex && type && type === ProductStockType.stock) {
      if (reloaddata || (closename && openmodal?.[closename])) {
        fetchstock(editindex);
      }
    }
  }, [reloaddata, editindex, type, fetchstock, closename, openmodal]);

  useEffect(() => {
    templateManager.fetchTemplates();
  }, [templateManager.reloadTemp]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handler functions
  const handleCreate = useCallback(
    async ({ setLoading }: { setLoading?: (val: boolean) => void }) => {
      const isEditing = variantManager.added !== -1;
      const currentVariants = product.Variant;

      // Early validation
      if (
        !isEditing &&
        checkVariantExists(currentVariants, variantManager.name)
      ) {
        errorToast("Variant name exist");
        return;
      }

      if (isEditing && (!currentVariants || currentVariants.length === 0)) {
        errorToast("Error Occured");
        return;
      }

      // Generate temp ID only once if needed
      const tempId =
        !isEditing && !product.id
          ? (() => {
              if (!currentVariants?.length) return 1;
              const existingIds = currentVariants
                .map((v) => v.tempId ?? v.id ?? 0)
                .filter((id) => id > 0);
              return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            })()
          : undefined;

      // Build variant data
      const variantData = {
        id:
          isEditing && currentVariants
            ? currentVariants[variantManager.added]?.id
            : undefined,
        tempId:
          isEditing && currentVariants
            ? currentVariants[variantManager.added]?.tempId
            : tempId,
        option_title: variantManager.name,
        option_type: variantManager.temp?.type as VariantTypeEnum,
        option_value: variantManager.temp?.value ?? [],
        price: variantPrice,
        optional: variantOptional,
        sectionId: sectionId ?? undefined,
      };

      let updatedVariants: typeof currentVariants;
      let updatedStock: Stocktype[] | undefined;

      // Handle editing mode
      if (isEditing && currentVariants) {
        updatedVariants = currentVariants.map((v, idx) =>
          idx === variantManager.added ? variantData : v,
        );

        // Update stock if exists
        if (product.Stock?.length) {
          updatedStock = updateStockOnVariantEdit(
            product.Stock,
            updatedVariants,
          );
        }
      } else {
        // Create mode - prepare optimistic update
        updatedVariants = currentVariants
          ? [...currentVariants, variantData]
          : [variantData];
      }

      // Save to database
      if (product.id) {
        setLoading?.(true);
        try {
          const response = await ApiRequest(
            "/api/products/crud",
            undefined,
            "PUT",
            "JSON",
            {
              id: product.id,
              Variant: variantData,
              type: "editvariant",
            },
          );

          if (!response.success) {
            errorToast("Can't Create Variant");
            return;
          }

          // Update variant with server-generated ID for new variants
          if (
            !isEditing &&
            response.data?.createdVariantId &&
            updatedVariants
          ) {
            variantData.id = response.data.createdVariantId;
            // Update the last item in the array with the new ID
            updatedVariants = updatedVariants.map((v, idx) =>
              idx === updatedVariants!.length - 1 ? variantData : v,
            );
          }
        } catch (error) {
          errorToast("Network error occurred");
          return;
        } finally {
          setLoading?.(false);
        }
      }

      // Update state
      setproduct((prev) => ({
        ...prev,
        Variant: updatedVariants,
        ...(updatedStock && { Stock: updatedStock }),
      }));

      // Reset form state
      variantManager.setAdded(-1);
      variantManager.setName("");
      setVariantPrice(undefined);
      setVariantOptional(false);

      // Show success message
      setSuccessMessage(
        isEditing
          ? "Variant updated successfully"
          : "Variant created successfully",
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      setNew("variant");
    },
    [
      product.id,
      product.Variant,
      product.Stock,
      variantManager,
      setproduct,
      variantPrice,
      variantOptional,
      sectionId,
    ],
  );

  const handleColorSelect = useCallback(
    (idx: number, selectType: "color" | "text") => {
      if (selectType === "color") {
        const data = variantManager.temp?.value[idx] as VariantValueObjType;
        const rgb = tinycolor(data.val).toRgb();
        variantManager.setEdit(idx);
        variantManager.setColorData({
          name: data.name ?? "",
          color: { hex: data.val as string, rgb: rgb },
          price: data.price ? parseFloat(data.price) : undefined,
          qty: data.qty,
        });
        setOpen((prev) => ({ ...prev, addcolor: true }));
      } else {
        const data = variantManager.temp?.value[idx];
        variantManager.setEdit(idx);

        // Handle both string and object types
        if (typeof data === "string") {
          variantManager.setOption(data);
          variantManager.setOptionPrice(undefined);
          variantManager.setOptionQty(undefined);
        } else {
          const objData = data as VariantValueObjType;
          variantManager.setOption(objData.val);
          variantManager.setOptionPrice(
            objData.price ? parseFloat(objData.price) : undefined,
          );
          variantManager.setOptionQty(objData.qty);
        }

        setOpen((prev) => ({ ...prev, addoption: true }));
      }
    },
    [variantManager],
  );

  const handleUpdateVariantOption = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const existingTextOptions =
        product.Variant?.filter((v) => v.option_type === "TEXT").flatMap(
          (v) => v.option_value as string[],
        ) ?? [];

      if (variantManager.addTextOption(existingTextOptions)) {
        setOpen((prev) => ({ ...prev, addoption: false }));
      }
    },
    [product.Variant, variantManager],
  );

  const handleVariantEdit = useCallback(
    (idx: number) => {
      if (!product.Variant) return;

      const variantToEdit = product.Variant[idx];
      if (variantToEdit) {
        variantManager.setName(variantToEdit.option_title);
        variantManager.setTemp({
          name: variantToEdit.option_title,
          value: [...variantToEdit.option_value],
          type: variantToEdit.option_type as VariantTypeEnum,
          optional: variantToEdit.optional,
        });
        variantManager.setAdded(idx);
        setVariantPrice(variantToEdit.price);
        setVariantOptional(variantToEdit.optional ?? false);
        setNew("info");
      }
    },
    [product.Variant, variantManager],
  );

  const handleVariantDelete = useCallback(
    async (idx: number) => {
      const { Variant: variants, Stock: varaintstock } = product;
      if (!variants || idx < 0 || idx >= variants.length) return;

      const updatedVariants = variants.filter((_, i) => i !== idx);

      setproduct((prev) => ({
        ...prev,
        Variant: updatedVariants,
        Stock: varaintstock
          ? varaintstock.filter((stock) =>
              stock.Stockvalue.some((val) => {
                return updatedVariants.some((currentVariant) =>
                  currentVariant.option_value.some((v) => {
                    const variantVal = typeof v === "string" ? v : v.val;
                    return val.variant_val.includes(variantVal);
                  }),
                );
              }),
            )
          : undefined,
      }));

      setNew("variant");
    },
    [product, setproduct],
  );

  const handleDeleteMultiple = useCallback(
    async (variantIds: number[]) => {
      const { Variant: variants, Stock: varaintstock } = product;
      if (!variants || variantIds.length === 0) return;

      // Filter out the variants with the given IDs
      const updatedVariants = variants.filter((v) => {
        const vId = v.id ?? v.tempId;
        return !vId || !variantIds.includes(vId);
      });

      setproduct((prev) => ({
        ...prev,
        Variant: updatedVariants,
        Stock: varaintstock
          ? varaintstock.filter((stock) =>
              stock.Stockvalue.some((val) => {
                return updatedVariants.some((currentVariant) =>
                  currentVariant.option_value.some((v) => {
                    const variantVal = typeof v === "string" ? v : v.val;
                    return val.variant_val.includes(variantVal);
                  }),
                );
              }),
            )
          : undefined,
      }));

      setNew("variant");
    },
    [product, setproduct],
  );

  const handleSelectExistingVariant = useCallback(
    (variantId: number) => {
      if (!accessFromSection || !sectionId) return;

      const variant = product.Variant?.find(
        (v) => (v.id ?? v.tempId) === variantId,
      );
      if (!variant) return;

      // Update variant with section ID using tempId as fallback identifier
      setproduct((prev) => ({
        ...prev,
        Variant: prev.Variant?.map((v) =>
          (v.id ?? v.tempId) === variantId ? { ...v, sectionId: sectionId } : v,
        ),
      }));
    },
    [accessFromSection, sectionId, product.Variant, setproduct],
  );

  const handleSelectTemplate = useCallback(
    (id: number) => {
      //Find selected template
      const selectedTemp = templateManager.templates.find((i) => i.id === id);
      if (!selectedTemp) return;

      if (templateManager.isEditTemp) {
        templateManager.setEditTemplate(selectedTemp);
        setOpen((prev) => ({ ...prev, addtemplate: true }));
      } else {
        variantManager.setName(selectedTemp.variant?.option_title ?? "");
        variantManager.setTemp({
          name: selectedTemp.variant?.option_title ?? "",
          type: selectedTemp.variant?.option_type as any,
          value: selectedTemp.variant?.option_value as any,
        });
        setNew("info");
      }
    },
    [templateManager, variantManager],
  );

  const handleCreateAndUpdateVariantStock = useCallback(
    async (addnew?: boolean) => {
      //?addnew arg for flag addnew sub stock

      const cleanedStock = cleanEmptyStock(product.Stock);

      const result = stockManager.createOrUpdateStock(
        cleanedStock,
        product.Variant?.map((i) => i.option_title) ?? [],
        addnew,
      );

      //If stockvalue is null reset stock state
      if (!result) {
        if (stockManager.editStockIdx !== -1 && !addnew) {
          stockManager.setEditStockIdx(-1);
        }
        stockManager.resetStockState();

        if (!addnew) setNew("stock");

        if (
          variantManager.added === -1 &&
          stockManager.editStockIdx === -1 &&
          closename
        ) {
          setopenmodal((prev) => ({ ...prev, [closename]: false }));
        }
        variantManager.setAdded(-1);
        return;
      }

      //Update Stock when in editmode

      if (editindex) {
        await handleSaveUpdateSubStock(result);
      }

      setproduct((prev) => ({ ...prev, Stock: result }));
      if (addnew) {
        setNew("stockinfo");
      } else {
        stockManager.resetStockState();
        // Show success message
        setSuccessMessage(
          stockManager.editStockIdx !== -1
            ? "Stock updated successfully"
            : "Stock created successfully",
        );
        setTimeout(() => setSuccessMessage(""), 3000);
        setNew("stock");
      }
    },
    [
      product.Stock,
      product.Variant,
      stockManager,
      variantManager,
      editindex,
      closename,
      setproduct,
      setopenmodal,
      setSuccessMessage,
    ],
  );

  const handleSaveUpdateSubStock = useCallback(
    async (Stock: Array<Stocktype>) => {
      setMainLoading(true);
      const res = await ApiRequest(
        "/api/products/crud",
        undefined,
        "PUT",
        "JSON",
        {
          id: editindex,
          Stock,
          type: "editvariantstock",
        },
      );
      setMainLoading(false);

      if (!res.success) {
        errorToast("Error occurred");
        return;
      }

      setSuccessMessage("Stock updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      stockManager.setEditStockIdx(-1);
      stockManager.resetStockState();
      setNew("stock");
    },
    [editindex, stockManager],
  );

  /**
   * Helper function to close the modal
   */
  const closeModal = useCallback(() => {
    const modalKey = closename || "addproductvariant";
    setopenmodal((prev) => ({ ...prev, [modalKey]: false }));
  }, [closename, setopenmodal]);

  /**
   * Helper function to reset section state
   */
  const resetSectionState = useCallback(() => {
    setSectionName("");
    setsetionId(undefined);
    setEditSectionId(undefined);
    setaccessFromSection(undefined);
  }, []);

  /**
   * Back button handler of all variant modal operation
   */
  const handleBack = useCallback(async () => {
    // Close modal if on home screen
    if (newadd === "none") {
      closeModal();
      return;
    }

    // Stock info: Save and return to stock list
    if (newadd === "stockinfo") {
      handleCreateAndUpdateVariantStock();
      return;
    }

    // Stock edit mode: Close modal when editing existing product
    if (newadd === "stock" && editindex) {
      closeModal();
      return;
    }

    // Variant type/info screens with section context
    if (newadd === "type" || newadd === "info") {
      const hasVariants = product.Variant && product.Variant.length > 0;

      // Reset section access flag
      if (accessFromSection !== "section-list") {
        setaccessFromSection(undefined);
      }

      // Navigate based on section context
      if (editSectionId) {
        setNew("section-edit");
        return;
      }

      if (accessFromSection && hasVariants) {
        if (accessFromSection === "section-list") {
          setNew("variant");
          return;
        }
        setNew("section");
        return;
      }

      setNew("none");
      return;
    }

    // Variant list screen
    if (newadd === "variant") {
      if (editSectionId) {
        setNew("section-edit");
        return;
      }

      if (accessFromSection) {
        setaccessFromSection(undefined);
        const targetView =
          accessFromSection === "section-list" ? "section-list" : "section";
        setNew(targetView);
        return;
      }
    }

    // Type selection: Return to variant list
    if ((newadd as Variantcontainertype) === "type") {
      setNew("variant");
      return;
    }

    // Section creation/edit screens
    if (newadd === "section") {
      resetSectionState();
      setNew("none");
      return;
    }

    if (newadd === "section-edit") {
      resetSectionState();
      setNew("section-list");
      return;
    }

    // Default: Return to home screen
    setNew("none");
  }, [
    newadd,
    editindex,
    editSectionId,
    accessFromSection,
    product.Variant,
    product.Variantsection,
    closeModal,
    resetSectionState,
    handleCreateAndUpdateVariantStock,
  ]);

  const handleVariantSectionSelect = () => {
    //Generate Temp id for variant section
    const isVariantSection =
      product.Variantsection && product.Variantsection.length;

    if (isVariantSection) {
      setNew("section-list");
      return;
    }

    //Setup for adding new variant section - use tempId approach
    const generateSectionTempId = () => {
      if (!product.Variantsection?.length) return 1;
      const existingIds = product.Variantsection.map((s) => s.id ?? 0).filter(
        (id) => id > 0,
      );
      return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    };

    const variantSectionId = generateSectionTempId();

    setsetionId(variantSectionId);
    setNew("section");
  };

  return (
    <SecondaryModal
      size="4xl"
      open={
        closename
          ? (openmodal[closename] as boolean)
          : openmodal.addproductvariant
      }
      scroll="inside"
      onPageChange={() =>
        setopenmodal((prev) => ({ ...prev, [closename as string]: false }))
      }
    >
      <div className="relative productvariant_creation rounded-t-md w-full h-full bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-start pt-6 gap-y-6">
        <h3 className="title text-2xl font-bold text-left w-full h-fit px-6 pb-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {newadd === "variant" || newadd === "type" || newadd === "info"
            ? "Variant"
            : newadd === "stock" || newadd === "stockinfo"
              ? "Stock"
              : newadd === "section" || newadd === "section-edit"
                ? editSectionId
                  ? "Edit Variant Section"
                  : "Create Variant Section"
                : newadd === "section-list"
                  ? "Variant Sections"
                  : "Variant and Stock"}
        </h3>

        {/* Success Message Alert */}
        {successMessage && (
          <div className="w-full px-6 animate-in slide-in-from-top duration-300">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => setSuccessMessage("")}
                className="flex-shrink-0 text-green-500 hover:text-green-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {newadd === "variant" && (
          <VariantView
            variants={paginatedVariants}
            allVariants={product.Variant}
            variantSections={product.Variantsection}
            loading={mainLoading || templateManager.loading}
            onEdit={handleVariantEdit}
            onDelete={handleVariantDelete}
            onDeleteMultiple={handleDeleteMultiple}
            accessFromSection={accessFromSection}
            variantSectionId={sectionId}
            onSelectVariant={handleSelectExistingVariant}
            onVariantsSelected={() => setNew("section-edit")}
            onAddNew={() => {
              variantManager.setName("");
              variantManager.setAdded(-1);
              variantManager.setEdit(-1);
              setVariantPrice(undefined);
              setVariantOptional(false);
              setNew("type");
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalVariants={filteredVariants.length}
            productId={product.id}
          />
        )}

        {(newadd === "stock" || newadd === "stockinfo") && (
          <ManageStockContainer
            setreloaddata={setreloaddata}
            isloading={mainLoading}
            editindex={editindex}
            newadd={newadd}
            setedit={stockManager.setEditStockIdx}
            edit={stockManager.editStockIdx}
            stock={stockManager.stock}
            setstock={stockManager.setStock}
            addstock={addstock}
            setnew={setNew}
            setaddstock={setaddstock}
            selectedstock={stockManager.selectedValues ?? {}}
            setselectedstock={stockManager.setSelectedValues}
            editsubidx={stockManager.editSubStockIdx}
            seteditsubidx={stockManager.setEditSubStockIdx}
            setadded={variantManager.setAdded}
            isAddNew={stockManager.addNewSubStock}
            setisAddNew={stockManager.setAddNewSubStock}
            handleUpdateStock={(isAddnew) =>
              handleCreateAndUpdateVariantStock(isAddnew)
            }
          />
        )}

        {/* Chose type for Variant */}
        {newadd === "type" && (
          <VariantTypeSelection
            variantManager={variantManager}
            templateManager={templateManager}
            open={open}
            setOpen={setOpen}
            setNew={setNew}
            onSelectTemplate={handleSelectTemplate}
            setSuccessMessage={setSuccessMessage}
          />
        )}
        {newadd === "info" && (
          <VariantInfoEditor
            variantManager={variantManager}
            variantSectionId={sectionId}
            setVariantSectionId={setsetionId}
            open={open}
            setOpen={setOpen}
            setNew={setNew}
            onColorSelect={handleColorSelect}
            onUpdateOption={handleUpdateVariantOption}
            onCreate={({ setloading }) =>
              handleCreate({ setLoading: setloading })
            }
            price={variantPrice}
            setPrice={setVariantPrice}
            optional={variantOptional}
            setOptional={setVariantOptional}
            variantSections={product.Variantsection}
          />
        )}
        {/**Section Mananger */}
        {(newadd === "section" ||
          newadd === "section-list" ||
          newadd === "section-edit") && (
          <VariantSectionEditor
            accessFromSection={accessFromSection}
            setaccessFromSection={setaccessFromSection}
            editSectionId={editSectionId}
            sectionName={sectionName}
            setSectionName={setSectionName}
            newadd={newadd}
            seteditSectonId={setEditSectionId}
            setNew={setNew}
            setVariantSectionId={setsetionId}
            setSuccessMessage={setSuccessMessage}
          />
        )}

        {/* Choose Type of between Variant and Stock */}
        {newadd === "none" && (
          <>
            <div className="w-[90%] h-full grid grid-cols-1 gap-6 place-items-center">
              <SelectionCard
                title={`${
                  !product.Variant || product.Variant.length === 0
                    ? "Create"
                    : "Manage"
                } Variant`}
                image={Variantimg}
                count={product.Variant?.length}
                onClick={() => setNew("variant")}
                gradientFrom="from-blue-400"
                gradientVia="via-blue-500"
                gradientTo="to-purple-600"
                badgeColor="text-blue-600"
              />
              <SelectionCard
                title="Variant Sections"
                image={Variantimg}
                count={product.Variantsection?.length}
                onClick={() => handleVariantSectionSelect()}
                gradientFrom="from-purple-400"
                gradientVia="via-purple-500"
                gradientTo="to-pink-600"
                badgeColor="text-purple-600"
              />
              <SelectionCard
                title={`${
                  !product.Stock || product.Stock.length === 0
                    ? "Create"
                    : "Manage"
                } Stock`}
                image={Variantstockimg}
                count={product.Stock?.length}
                disabled={!product.Variant || product.Variant.length === 0}
                onClick={() => {
                  if (!product.Variant || product.Variant.length === 0) {
                    errorToast("Please Create Variant");
                    return;
                  }
                  setNew("stock");
                }}
                gradientFrom="from-green-400"
                gradientVia="via-emerald-500"
                gradientTo="to-teal-600"
                badgeColor="text-green-600"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-row justify-end gap-x-5 w-full h-fit bg-gradient-to-r from-gray-50 to-white rounded-b-lg p-4 border-t-2 border-gray-200 shadow-inner">
        {stockManager.editSubStockIdx === -1 && (
          <>
            <PrimaryButton
              text={newadd !== "none" ? "Back" : "Close"}
              onClick={() => handleBack()}
              status={mainLoading ? "loading" : "authenticated"}
              type="button"
              width="30%"
              height="40px"
              color="lightcoral"
              radius="10px"
            />
          </>
        )}
      </div>
    </SecondaryModal>
  );
};
