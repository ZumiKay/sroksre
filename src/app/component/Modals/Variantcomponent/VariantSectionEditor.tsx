import { VariantSectionType } from "@/src/types/product.type";
import { Key, useCallback, useEffect, useMemo, useState, memo } from "react";
import { Variantcontainertype } from "../types";
import { PlusIcon } from "../../svg/icons";
import PrimaryButton from "../../Button";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { errorToast } from "../../Loading";
import { ApiRequest } from "@/src/context/CustomHook";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { accessFromSectionType } from "../VariantModal";
import React from "react";

interface VariantSectionEditor {
  editSectionId?: number;
  newadd: Variantcontainertype;
  sectionName: string;
  accessFromSection?: accessFromSectionType;

  //Set State Action
  setSectionName: React.Dispatch<React.SetStateAction<string>>;
  setNew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
  setVariantSectionId: React.Dispatch<React.SetStateAction<number | undefined>>;
  seteditSectonId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
  setaccessFromSection: React.Dispatch<
    React.SetStateAction<accessFromSectionType | undefined>
  >;
}

const VariantSectionEditor = ({
  editSectionId,
  newadd,
  sectionName,
  setaccessFromSection,
  setSectionName,
  setNew,
  setVariantSectionId,
  seteditSectonId,
  setSuccessMessage,
}: VariantSectionEditor) => {
  const { product, setproduct } = useGlobalContext();
  const [tempVariantSectionId, settempVariantSectionId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>(
    newadd === "section-list" ? "list" : "create",
  );
  const [selectedSections, setSelectedSections] = useState<Set<number>>(
    new Set(),
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Search and pagination for large datasets
  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
  const [currentSectionPage, setCurrentSectionPage] = useState(1);
  const sectionsPerPage = 20;

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!product.Variantsection) return [];
    if (!sectionSearchQuery.trim()) return product.Variantsection;

    const query = sectionSearchQuery.toLowerCase();
    return product.Variantsection.filter((section) =>
      section.name.toLowerCase().includes(query),
    );
  }, [product.Variantsection, sectionSearchQuery]);

  // Paginate filtered sections
  const paginatedSections = useMemo(() => {
    const startIndex = (currentSectionPage - 1) * sectionsPerPage;
    const endIndex = startIndex + sectionsPerPage;
    return filteredSections.slice(startIndex, endIndex);
  }, [filteredSections, currentSectionPage, sectionsPerPage]);

  const totalSectionPages = useMemo(
    () => Math.ceil(filteredSections.length / sectionsPerPage),
    [filteredSections.length, sectionsPerPage],
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentSectionPage(1);
  }, [sectionSearchQuery]);

  useEffect(() => {
    if (
      !editSectionId &&
      product.Variantsection &&
      product.Variantsection.length > 0
    ) {
      settempVariantSectionId(product.Variantsection.length + 1);
    }
  }, [editSectionId, product.Variantsection]);

  // Separate effect for loading section data in edit mode
  useEffect(() => {
    if (editSectionId) {
      const sectionToEdit = product.Variantsection?.find(
        (section) => section.id === editSectionId,
      );
      if (sectionToEdit && sectionToEdit.name !== sectionName) {
        setSectionName(sectionToEdit.name);
      }
    }
  }, [editSectionId]);
  const currentVariants = useMemo(
    () =>
      product.Variant?.filter((variant) =>
        editSectionId
          ? variant.sectionId === editSectionId
          : variant.sectionId === tempVariantSectionId,
      ),
    [editSectionId, tempVariantSectionId, product.Variant],
  );

  const handleCreateSection = useCallback(async () => {
    //Verify variants
    if (!currentVariants || currentVariants.length === 0) {
      errorToast("Please Add Variant");
      return;
    }

    //Creating Process

    let newVariantSection: VariantSectionType = {
      tempId: tempVariantSectionId,
      name: sectionName,
      productsId: product.id,
      Variants: product.Variant?.filter(
        (i) => i.sectionId === tempVariantSectionId,
      ),
    };

    //Edit Mode
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

    //Create Temp Variant Section
    setproduct(
      (prev) =>
        ({
          ...prev,
          VariantSection: prev.Variantsection
            ? [...prev.Variantsection, newVariantSection]
            : [newVariantSection],
        }) as never,
    );
    setSuccessMessage("Variant section created");
    setSectionName("");
    setTimeout(() => setSuccessMessage(""), 3000);
  }, [
    currentVariants,
    tempVariantSectionId,
    sectionName,
    product.id,
    product.Variant,
    setproduct,
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

    // Verify variants
    if (!currentVariants || currentVariants.length === 0) {
      errorToast("Please add at least one variant");
      return;
    }

    //If in product editmode request edit
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

    // Update local state
    setproduct((prev) => ({
      ...prev,
      VariantSection: prev.Variantsection?.map((section) =>
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
    setNew("section-list");
  }, [
    editSectionId,
    product.id,
    product.Variant,
    sectionName,
    currentVariants,
    setproduct,
    seteditSectonId,
    setNew,
    setSuccessMessage,
  ]);

  const handleEditVariantSection = (editId: number) => {
    const toBeEdit = product.Variantsection?.find(
      (section) => section.id === editId,
    );

    if (!toBeEdit) {
      errorToast("Error Occured");
      return;
    }

    setSectionName(toBeEdit.name);
    seteditSectonId(editId);
    setSelectedTab("create");
    setNew("section-edit");
  };

  {
    /**
    Add Temp Variant To Current Variant Section */
  }
  const handleAddVariant = (sectionId: number) => {
    //Mark as add variant mode from variant section

    setVariantSectionId(sectionId);

    //Set quick access
    setaccessFromSection(
      selectedTab === "create" ? "secion-create" : "section-list",
    );
    if (product.Variant && product.Variant.length > 0) {
      setNew("variant");
    } else {
      setNew("type");
    }
  };

  const handleEditVariant = (variantId: number) => {
    // Find the variant to edit using id or tempId
    const variantToEdit = product.Variant?.find(
      (v) => (v.id ?? v.tempId) === variantId,
    );
    if (!variantToEdit) {
      errorToast("Variant not found");
      return;
    }

    // Store variant ID in context for editing
    // Navigate to variant editing view
    setVariantSectionId(variantToEdit.sectionId);
    setNew("type"); // This will allow user to edit the variant
  };

  const handleToggleSectionSelection = (sectionId: number) => {
    setSelectedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSelectAllSections = () => {
    if (selectedSections.size === product.Variantsection?.length) {
      setSelectedSections(new Set());
    } else {
      const allIds = new Set(
        product.Variantsection?.map((s) => s.id || s.tempId) || [],
      );
      setSelectedSections(allIds);
    }
  };

  const handleDeleteSections = async (deleteId?: number) => {
    if (deleteId ? false : selectedSections.size === 0) {
      errorToast("Please select at least one section to delete");
      return;
    }

    const confirmMessage =
      selectedSections.size === 1
        ? "Are you sure you want to delete this section?"
        : `Are you sure you want to delete ${selectedSections.size} sections?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      if (product.id) {
        // Delete from database if editing product
        const deletePromise = await ApiRequest(
          "/api/products/crud",
          undefined,
          "DELETE",
          "JSON",
          {
            variantsectionIds: deleteId
              ? [deleteId]
              : Array.from(selectedSections),
          },
        );

        if (!deletePromise.success) {
          errorToast(`Failed to delete`);
          return;
        }
      }

      // Update local state - remove deleted sections
      const sectionsToDelete = deleteId
        ? new Set([deleteId])
        : selectedSections;

      setproduct((prev) => ({
        ...prev,
        Variantsection: prev.Variantsection?.filter(
          (section) => !sectionsToDelete.has(section.id ?? section.tempId!),
        ),
        // Also remove variants that belonged to deleted sections
        Variant: prev.Variant?.map((variant) => {
          if (variant.sectionId && sectionsToDelete.has(variant.sectionId)) {
            return { ...variant, sectionId: undefined };
          }
          return variant;
        }),
      }));

      const message =
        selectedSections.size === 1
          ? "Section deleted successfully"
          : `${selectedSections.size} sections deleted successfully`;
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedSections(new Set());
    } catch (error) {
      errorToast("An error occurred while deleting sections");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteVariant = async (editId: number, variantId: number) => {
    if (!window.confirm("Are you sure you want to delete this variant?")) {
      return;
    }

    setLoading(true);
    try {
      if (product.id && editId) {
        // If product exists in database, delete via API
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

      // Update local state - remove the variant using id or tempId
      setproduct((prev) => ({
        ...prev,
        Variant: prev.Variant?.filter((v) => (v.id ?? v.tempId) !== variantId),
      }));

      setSuccessMessage("Variant deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      errorToast("An error occurred while deleting variant");
    } finally {
      setLoading(false);
    }
  };

  const handleTabs = (val: Key) => {
    if (val === "create") {
      setSectionName("");
      seteditSectonId(undefined);
    }
    setSelectedTab(val as string);
    setaccessFromSection(val === "create" ? "secion-create" : "section-list");
  };

  // section-list

  return (
    <div className="w-full h-full flex flex-col px-6">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200 shrink-0">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Variant Sections
          </h3>
          <p className="text-sm text-gray-600">
            Manage your product variant sections
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mt-6">
          <Tabs
            aria-label="Variant Section Options"
            selectedKey={selectedTab}
            onSelectionChange={handleTabs}
            color="primary"
            variant="bordered"
            classNames={{
              tabList: "gap-4 w-full relative rounded-lg bg-white p-1",
              cursor: "w-full bg-blue-600",
              tab: "max-w-fit px-6 h-12",
              tabContent: "group-data-[selected=true]:text-white",
            }}
          >
            {/**Variant Section List */}
            <Tab
              key="list"
              title={
                <div className="flex items-center gap-2">
                  <span>Section List</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {product.Variantsection?.length || 0}
                  </span>
                </div>
              }
            >
              <Card className="border-2 border-gray-200 mt-4">
                <CardBody className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg text-gray-800">
                        All Sections
                      </h4>
                      {selectedSections.size > 0 && (
                        <span className="text-sm text-gray-600">
                          ({selectedSections.size} selected)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedSections.size > 0 && (
                        <button
                          onClick={() => handleDeleteSections()}
                          disabled={isDeleting}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete ({selectedSections.size})
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTab("create")}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <PlusIcon />
                        Add Section
                      </button>
                    </div>
                  </div>

                  {/* Search bar for filtering sections */}
                  {product.Variantsection &&
                    product.Variantsection.length > 10 && (
                      <div className="mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search sections..."
                            value={sectionSearchQuery}
                            onChange={(e) =>
                              setSectionSearchQuery(e.target.value)
                            }
                            className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
                          />
                          <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                          {sectionSearchQuery && (
                            <button
                              onClick={() => setSectionSearchQuery("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <svg
                                className="w-4 h-4"
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
                        {sectionSearchQuery && (
                          <p className="text-sm text-gray-600 mt-2">
                            Found {filteredSections.length} section
                            {filteredSections.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}

                  {product.Variantsection &&
                    product.Variantsection.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={
                            selectedSections.size ===
                            product.Variantsection.length
                          }
                          onChange={handleSelectAllSections}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded-sm focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 font-medium">
                          Select All
                        </span>
                      </div>
                    )}

                  {!product.Variantsection ||
                  product.Variantsection.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No sections created yet</p>
                      <button
                        onClick={() => setSelectedTab("create")}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create First Section
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedSections?.map((section, idx) => (
                        <SectionItem
                          key={section.id || section.tempId || idx}
                          section={section}
                          idx={idx + (currentSectionPage - 1) * sectionsPerPage}
                          product={product}
                          isSelected={selectedSections.has(
                            section.id || section.tempId,
                          )}
                          onToggleSelection={handleToggleSectionSelection}
                          onEdit={handleEditVariantSection}
                          onAddVariant={handleAddVariant}
                          onDelete={handleDeleteSections}
                          isDeleting={isDeleting}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination controls for sections */}
                  {totalSectionPages > 1 && (
                    <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          setCurrentSectionPage(
                            Math.max(1, currentSectionPage - 1),
                          )
                        }
                        disabled={currentSectionPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Page {currentSectionPage} of {totalSectionPages}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setCurrentSectionPage(
                            Math.min(totalSectionPages, currentSectionPage + 1),
                          )
                        }
                        disabled={currentSectionPage === totalSectionPages}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Tab>

            {/**Create Variant Section */}
            <Tab
              key="create"
              title={
                <div className="flex items-center gap-2">
                  <PlusIcon />
                  <span>Create Section</span>
                </div>
              }
            >
              <Card className="border-2 border-gray-200 mt-4">
                <CardBody className="p-6 space-y-6">
                  <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Section Name *
                    </label>
                    <input
                      type="text"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      placeholder="e.g., Size & Color Options"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-lg text-gray-800">
                        Variants in this section ({currentVariants?.length || 0}
                        )
                      </h4>

                      <button
                        onClick={() =>
                          handleAddVariant(
                            editSectionId ?? tempVariantSectionId,
                          )
                        }
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <PlusIcon />
                        Add Variant
                      </button>
                    </div>

                    {/**Show Added Variants */}
                    {!currentVariants || currentVariants.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No variants added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {currentVariants?.map((variant, idx) => (
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
                                  {variant.option_type} •{" "}
                                  {variant.option_value.length} options
                                </p>
                                {/* Show first few option values */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {variant.option_value
                                    .slice(0, 5)
                                    .map((val, vIdx) => (
                                      <span
                                        key={vIdx}
                                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm"
                                      >
                                        {typeof val === "string"
                                          ? val
                                          : val.name || val.val}
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
                                  const variantId =
                                    variant.id ?? variant.tempId;
                                  if (variantId !== undefined) {
                                    handleEditVariant(variantId);
                                  }
                                }}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  const variantId =
                                    variant.id ?? variant.tempId;
                                  if (variantId !== undefined) {
                                    handleDeleteVariant(
                                      editSectionId ?? 0,
                                      variantId,
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/**Action Button */}
                  <div className="flex gap-3">
                    <PrimaryButton
                      text={editSectionId ? "Update" : "Create"}
                      type="button"
                      textsize="12px"
                      onClick={() =>
                        editSectionId && product.id
                          ? handleUpdateVariantSection()
                          : handleCreateSection()
                      }
                      radius="10px"
                      width="100%"
                      status={loading ? "loading" : "authenticated"}
                      height="100%"
                      disable={loading || !sectionName?.trim()}
                    />
                  </div>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>

        <div className="flex gap-3 mt-6 shrink-0">
          <button
            onClick={() => setNew("none")}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantSectionEditor;

// Memoized section item component for better performance
const SectionItem = memo(
  ({
    section,
    idx,
    product,
    isSelected,
    onToggleSelection,
    onEdit,
    onAddVariant,
    onDelete,
    isDeleting,
  }: {
    section: VariantSectionType;
    idx: number;
    product: any;
    isSelected: boolean;
    onToggleSelection: (id: number) => void;
    onEdit: (id: number) => void;
    onAddVariant: (id: number) => void;
    onDelete: (id: number) => void;
    isDeleting: boolean;
  }) => {
    const variantCount =
      product.Variant?.filter((i: any) => i.sectionId === section.id)?.length ||
      0;

    return (
      <div
        key={section.id || idx}
        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border transition-colors ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-blue-300"
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(section.id || section.tempId)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded-sm focus:ring-blue-500"
          />
          <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p className="font-medium text-gray-800">{section.name}</p>
            <p className="text-sm text-gray-500">
              {`${variantCount} variant(s)`}
            </p>
            {section.Variants && section.Variants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {section.Variants.slice(0, 3).map((variant, vIdx) => (
                  <span
                    key={vIdx}
                    className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-sm"
                  >
                    {variant.option_title}
                  </span>
                ))}
                {section.Variants.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-0.5">
                    +{section.Variants.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(section.id || section.tempId)}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onAddVariant(section.id || section.tempId)}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            Manage Variants
          </button>
          <button
            onClick={() => section.id && onDelete(section.id)}
            disabled={isDeleting}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete this section"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  },
);

SectionItem.displayName = "SectionItem";
