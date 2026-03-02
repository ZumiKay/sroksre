import { Key, useEffect, useState } from "react";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { PlusIcon } from "../../svg/icons";
import PrimaryButton from "../../Button";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { errorToast } from "../../Loading";

// Types
import { VariantSectionEditorProps } from "./types";

// Custom Hooks
import {
  useSectionManagement,
  useVariantManagement,
  useSearchAndPagination,
} from "./hooks";

// Components
import {
  SearchBar,
  Pagination,
  SectionItem,
  VariantListDisplay,
  EmptyState,
  DeleteIcon,
} from "./components";

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
}: VariantSectionEditorProps) => {
  const { product } = useGlobalContext();
  const [tempVariantSectionId, settempVariantSectionId] = useState<number>(1);
  const [selectedTab, setSelectedTab] = useState<string>(
    newadd === "section-list" ? "list" : "create",
  );
  const [selectedSections, setSelectedSections] = useState<Set<number>>(
    new Set(),
  );

  // Custom Hooks
  const {
    loading,
    isDeleting,
    currentVariants,
    handleCreateSection,
    handleUpdateVariantSection,
    handleDeleteSections,
  } = useSectionManagement({
    editSectionId,
    tempVariantSectionId,
    sectionName,
    setSuccessMessage,
    setSectionName,
    seteditSectonId,
    setNew,
    settempVariantSectionId,
  });

  const {
    loading: variantLoading,
    handleAddVariant,
    handleEditVariant,
    handleDeleteVariant,
  } = useVariantManagement({
    setVariantSectionId,
    setNew,
    setaccessFromSection,
    setSuccessMessage,
  });

  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredItems: filteredSections,
    paginatedItems: paginatedSections,
  } = useSearchAndPagination(product.Variantsection, 20);

  // Update temp variant section ID based on existing sections
  useEffect(() => {
    if (
      !editSectionId &&
      product.Variantsection &&
      product.Variantsection.length > 0
    ) {
      settempVariantSectionId(product.Variantsection.length + 1);
    }
  }, [editSectionId, product.Variantsection]);

  // Load section data in edit mode
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

  // Sync selectedTab with newadd prop changes
  useEffect(() => {
    if (newadd === "section-list") {
      setSelectedTab("list");
    } else if (newadd === "section-edit" || newadd === "section") {
      setSelectedTab("create");
    }
  }, [newadd]);

  // Handler functions
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

  const handleTabs = (val: Key) => {
    if (val === "create") {
      setSectionName("");
      seteditSectonId(undefined);
      // Reset tempVariantSectionId to ensure clean state
      if (product.Variantsection && product.Variantsection.length > 0) {
        const maxId = Math.max(
          ...(product.Variantsection?.map((s) => s.id || s.tempId || 0) || [0]),
          tempVariantSectionId,
        );
        settempVariantSectionId(maxId + 1);
      }
    }
    setSelectedTab(val as string);
    setaccessFromSection(val === "create" ? "secion-create" : "section-list");
  };

  const handleDeleteSelected = () => {
    handleDeleteSections(undefined, selectedSections);
    setSelectedSections(new Set());
  };

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
            {/* Variant Section List Tab */}
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
                          onClick={handleDeleteSelected}
                          disabled={isDeleting}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <DeleteIcon />
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

                  {/* Search bar */}
                  {product.Variantsection &&
                    product.Variantsection.length > 10 && (
                      <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search sections..."
                        resultsCount={filteredSections.length}
                      />
                    )}

                  {/* Select all checkbox */}
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

                  {/* Empty state or section list */}
                  {!product.Variantsection ||
                  product.Variantsection.length === 0 ? (
                    <EmptyState
                      message="No sections created yet"
                      actionText="Create First Section"
                      onAction={() => setSelectedTab("create")}
                    />
                  ) : (
                    <div className="space-y-3">
                      {paginatedSections?.map((section, idx) => (
                        <SectionItem
                          key={section.id || section.tempId || idx}
                          section={section}
                          idx={idx + (currentPage - 1) * 20}
                          product={product}
                          isSelected={selectedSections.has(
                            section.id || section.tempId,
                          )}
                          onToggleSelection={handleToggleSectionSelection}
                          onEdit={handleEditVariantSection}
                          onAddVariant={(id) =>
                            handleAddVariant(id, selectedTab)
                          }
                          onDelete={handleDeleteSections}
                          isDeleting={isDeleting}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </CardBody>
              </Card>
            </Tab>

            {/* Create Variant Section Tab */}
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

                  <VariantListDisplay
                    variants={currentVariants || []}
                    loading={variantLoading}
                    onAdd={() =>
                      handleAddVariant(
                        editSectionId ?? tempVariantSectionId,
                        selectedTab,
                      )
                    }
                    onEdit={handleEditVariant}
                    onDelete={handleDeleteVariant}
                    editSectionId={editSectionId}
                  />

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
