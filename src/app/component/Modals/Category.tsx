"use client";
import {
  CateogoryInitailizestate,
  CateogoryState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendarDays,
  faCheck,
  faCircleInfo,
  faClock,
  faFire,
  faFolder,
  faFolderOpen,
  faFolderTree,
  faLayerGroup,
  faPen,
  faPenToSquare,
  faPlus,
  faRotateLeft,
  faTags,
  faTrash,
  faTrashCan,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { errorToast, successToast } from "../Loading";
import { ApiRequest, Delayloading, useScreenSize } from "@/src/context/CustomHook";
import { SecondaryModal } from "../Modals";
import { AddSubCategoryMenu } from "../ToggleMenu";
import { Categorytype } from "../../api/categories/route";
import { DateRangePicker, Input } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { SelectAndSearchProduct } from "../Banner";
import { SelectType } from "@/src/types/productAction.type";
import { ACCENTS, IconTile, ModalTitle, Option, OptionGroup, SectionCard } from "./FormSection";

export const GetPromotionSelection = async (search: string, limit: number = 1) => {
  const url = `/api/promotion?ty=selection&lt=${limit}${search !== "" ? `&q=${search}` : ""}`;
  const request = await ApiRequest(url, undefined, "GET");

  if (!request.success) {
    return { success: false };
  }
  return {
    success: true,
    isLimit: request.isLimit,
    data: request.data.map((i: any) => ({
      label: i.name,
      value: i.id,
    })),
  };
};
export const Category = () => {
  const { openmodal, setopenmodal, category, setcategory, allData } = useGlobalContext();
  const [show, setshow] = useState<"Create" | "Edit">("Create");
  const [loading, setloading] = useState(false);
  const [catetype, setcatetype] = useState<Categorytype>("normal");
  const { isMobile, isTablet } = useScreenSize();

  const handleAdd = useCallback(async () => {
    if (!category.name || !category.description) {
      errorToast("Please Fill all required");
      return;
    }

    // Check if category name already exists
    const isExist = allData?.category?.some((obj) => obj.name === category.name);
    if (isExist) {
      errorToast("Category Existed");
      return;
    }

    setloading(true);
    const saved = await ApiRequest("/api/categories", undefined, "POST", "JSON", {
      ...category,
      type: catetype,
    });
    setloading(false);

    if (!saved.success) {
      errorToast("Failed To Create");
      return;
    }

    setcategory(CateogoryInitailizestate);
    successToast("Category Created");
  }, [allData?.category, category, catetype]);

  const handleNavbar = useCallback((show: "Create" | "Edit") => {
    setshow(show);
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
    setcategory(CateogoryInitailizestate);
  }, []);

  const handleSelectPromotion = useCallback((value: Array<SelectType>) => {
    const subcategories =
      value?.length > 0
        ? value.map((i) => ({
            name: i.label,
            type: "promo" as const,
            pid: i.value as number,
            id: i.value as number,
          }))
        : [];

    setcategory((prev) => ({ ...prev, subcategories }));
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setcategory((prev) => ({ ...prev, [name]: value }));
  }, []);

  const canCreate = category.name.length > 0 && !loading;

  return (
    <SecondaryModal
      open={openmodal.createCategory}
      size="4xl"
      onPageChange={(val) => setopenmodal((prev) => ({ ...prev, createCategory: val }))}
      placement={isMobile ? "top-center" : isTablet ? "center" : undefined}
    >
      <div className="category w-full flex flex-col gap-y-5 py-4">
        <ModalTitle
          title="Categories"
          subtitle="Create a new category or edit the ones you have."
        />

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Category mode"
          className="category__navbar grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100"
        >
          {(["Create", "Edit"] as const).map((mode) => {
            const active = show === mode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleNavbar(mode)}
                className={`category_header h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  active
                    ? "primary__button text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <FontAwesomeIcon
                  icon={mode === "Create" ? faPlus : faPenToSquare}
                  className="text-xs"
                />
                {mode === "Create" ? "Create new" : "Edit existing"}
              </button>
            );
          })}
        </div>

        {show === "Create" ? (
          <>
            <SectionCard
              icon={faLayerGroup}
              title="Type"
              hint="Normal categories are managed by you. The others fill with products automatically."
            >
              <OptionGroup
                label="Category type"
                options={TYPE_OPTIONS}
                value={catetype}
                onChange={(value) => setcatetype(value as Categorytype)}
              />
            </SectionCard>

            <SectionCard icon={faPen} title="Details">
              <DetailsFields
                name={category.name}
                description={category.description}
                onChange={handleChange}
              />
            </SectionCard>

            {catetype === "sale" && (
              <SectionCard
                icon={faTags}
                title="Promotions"
                hint="Products from these promotions are listed in this category."
              >
                <SelectAndSearchProduct
                  getdata={(take, value) => GetPromotionSelection(value, take)}
                  placeholder="Search promotions"
                  value={category.subcategories.map((sub) => ({
                    label: sub.name,
                    value: sub.id ?? 0,
                  }))}
                  onSelect={(value) => handleSelectPromotion(value as Array<SelectType>)}
                />
              </SectionCard>
            )}

            {catetype === "popular" && (
              <SectionCard
                icon={faCalendarDays}
                title="Date range"
                hint="The period used to decide which products are popular."
              >
                <CategoryDateRange />
              </SectionCard>
            )}

            {catetype === "normal" && (
              <SectionCard
                icon={faFolderTree}
                title="Sub categories"
                hint="Optional. Group products further, e.g. Shirts under Men."
              >
                {openmodal.addsubcategory ? (
                  <div className="w-full max-h-125 overflow-y-auto">
                    <AddSubCategoryMenu index={-1} />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      category.name.length > 0 &&
                      setopenmodal((prev) => ({ ...prev, addsubcategory: true }))
                    }
                    disabled={category.name.length === 0}
                    className={`w-full h-11 rounded-lg text-sm font-semibold border flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 ${ACCENTS.neutral.soft}`}
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    {category.subcategories.length > 0
                      ? `Manage sub categories (${category.subcategories.length})`
                      : "Add sub categories"}
                  </button>
                )}
                {category.name.length === 0 && !openmodal.addsubcategory && (
                  <p className="text-xs text-slate-500">Enter a name first.</p>
                )}
              </SectionCard>
            )}

            {catetype === "latest" && (
              <p
                className={`text-sm rounded-lg border px-4 py-3 flex items-center gap-2 ${ACCENTS.neutral.soft}`}
              >
                <FontAwesomeIcon icon={faCircleInfo} />
                Newest products are added to this category automatically.
              </p>
            )}

            <div className="flex flex-row justify-end">
              <button
                type="button"
                onClick={() => canCreate && handleAdd()}
                disabled={!canCreate}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold primary__button text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-small_phone:w-full"
              >
                {loading ? <Spinner /> : <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                {loading ? "Creating..." : "Create Category"}
              </button>
            </div>
          </>
        ) : (
          <EditCategory loading={loading} setloading={setloading} show={show} />
        )}
      </div>
    </SecondaryModal>
  );
};

const TYPE_OPTIONS: Option[] = [
  {
    value: "normal",
    label: "Normal",
    description: "You pick sub categories",
    icon: faFolder,
  },
  {
    value: "popular",
    label: "Popular",
    description: "Most popular products",
    icon: faFire,
  },
  {
    value: "latest",
    label: "Latest",
    description: "Newest products",
    icon: faClock,
  },
  {
    value: "sale",
    label: "Sale",
    description: "Products on promotion",
    icon: faTags,
  },
];

const TYPE_ACCENT: Record<string, Option> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o]),
);

const Spinner = ({ className = "border-white/40 border-t-white" }: { className?: string }) => (
  <span aria-hidden="true" className={`w-4 h-4 rounded-full border-2 animate-spin ${className}`} />
);

function DetailsFields({
  name,
  description,
  onChange,
}: {
  name: string;
  description: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const classNames = {
    label: "text-sm font-medium text-slate-700",
    inputWrapper: "border-slate-300 group-data-[focus=true]:border-slate-500",
  };
  return (
    <>
      <Input
        type="text"
        variant="bordered"
        size="lg"
        label="Name"
        labelPlacement="outside"
        placeholder="e.g. Men"
        name="name"
        value={name}
        onChange={onChange}
        isRequired
        classNames={classNames}
      />
      <Input
        type="text"
        variant="bordered"
        size="lg"
        label="Description"
        labelPlacement="outside"
        placeholder="A short line about this category"
        name="description"
        value={description}
        onChange={onChange}
        isRequired
        classNames={classNames}
      />
    </>
  );
}

function CategoryDateRange() {
  const { category, setcategory } = useGlobalContext();
  return (
    <DateRangePicker
      aria-label="Date range"
      variant="bordered"
      value={
        category.daterange
          ? ({
              start: parseDate(category.daterange.start),
              end: parseDate(category.daterange.end),
            } as any)
          : undefined
      }
      onChange={(val) => {
        if (val) {
          setcategory((prev) => ({
            ...prev,
            daterange: {
              start: val.start.toString(),
              end: val.end.toString(),
            },
          }));
        }
      }}
      className="w-full"
    />
  );
}

const EditCategory = ({
  loading,
  setloading,
  show,
}: {
  loading: boolean;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  show: "Create" | "Edit";
}) => {
  const { allData, category, setcategory, setalldata, globalindex, setglobalindex } =
    useGlobalContext();
  const [editindex, seteditindex] = useState(-1);
  const [tempcate, settempcate] = useState<CateogoryState[]>([]);

  const [edit, setedit] = useState(false);
  const URL = "/api/categories";

  //API Request

  useEffect(() => {
    if (show !== "Edit") return;

    const fetchAllCate = async () => {
      const request = async () => {
        const res = await ApiRequest(URL, undefined, "GET");
        if (res.success) {
          setalldata((prev) => ({ ...prev, category: res.data }));
        }
      };
      await Delayloading(request, setloading, 500);
    };
    fetchAllCate();
  }, [show, setloading, setalldata]);

  const handleClick = useCallback(
    (index: number) => {
      setedit((prev) => !prev);
      seteditindex(index);

      if (allData?.category) {
        setcategory(allData.category[index]);
      }
    },
    [allData?.category],
  );
  const handleDelete = useCallback(async () => {
    setloading(true);
    const deleterequest = await ApiRequest(URL, undefined, "DELETE", "JSON", {
      id: globalindex.categoryeditindex,
    });
    setloading(false);

    if (deleterequest.success) {
      settempcate([]);
      setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
      successToast("Category Deleted");
    } else {
      // Restore deleted categories on error
      const resetcate = tempcate.filter((obj) =>
        globalindex.categoryeditindex.includes(obj.id as number),
      );
      const allcate = [...(allData?.category ?? []), ...resetcate];
      setalldata((prev) => ({ ...prev, category: allcate }));
      settempcate([]);
      setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
      errorToast(deleterequest.error as string);
    }
  }, [globalindex.categoryeditindex, tempcate, allData?.category]);

  const handleConfirm = useCallback(async () => {
    if (!category.name || !category.description) {
      errorToast("Please fill all required");
      return;
    }

    const updateRequest = async () => {
      const res = await ApiRequest(URL, undefined, "PUT", "JSON", category);
      if (res.success) {
        const allcate = [...(allData?.category ?? [])];
        allcate[editindex] = {
          ...allcate[editindex],
          name: category.name,
          subcategories: category.subcategories,
        };
        setalldata((prev) => ({ ...prev, category: allcate }));
        setedit(false);
        seteditindex(-1);
        successToast("Category Updated");
      } else {
        errorToast("Failed To Update");
      }
    };

    await Delayloading(updateRequest, setloading, 1000);
  }, [category, editindex, allData?.category]);
  const handleReset = useCallback(() => {
    const resetcate = tempcate.filter((obj) =>
      globalindex.categoryeditindex.includes(obj.id as number),
    );
    const allcate = [...(allData?.category ?? []), ...resetcate];
    setalldata((prev) => ({ ...prev, category: allcate }));
    settempcate([]);
    setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
  }, [tempcate, allData?.category, globalindex.categoryeditindex]);

  const handleSelectPromotion = useCallback((value: Array<SelectType>) => {
    const subcategories =
      value?.length > 0
        ? value.map((i) => ({
            name: i.label,
            type: "promo" as const,
            pid: i.value as number,
          }))
        : [];

    setcategory((prev) => ({ ...prev, subcategories }));
  }, []);

  const handleEditChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setcategory((prev) => ({ ...prev, [name]: value }));
  }, []);

  const categories = allData?.category ?? [];
  const pendingCount = globalindex.categoryeditindex.length;

  return (
    <>
      <div className="EditCategory w-full flex flex-col gap-y-4">
        {!edit ? (
          <>
            <div className="w-full flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">All categories</h4>
              {!loading && categories.length > 0 && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ACCENTS.neutral.tile}`}
                >
                  {categories.length} {categories.length === 1 ? "category" : "categories"}
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full h-15 rounded-xl border border-slate-200 bg-white flex items-center px-3 gap-3 animate-pulse"
                  >
                    <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                    <div className="flex-1 h-4 bg-slate-200 rounded-sm" />
                    <div className="w-20 h-8 bg-slate-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="w-full py-12 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                <IconTile icon={faFolderOpen} size="lg" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">No categories yet</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Switch to &ldquo;Create new&rdquo; to add your first one.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {categories.map((obj, idx) => {
                  const typeInfo = TYPE_ACCENT[obj.type ?? "normal"] ?? TYPE_OPTIONS[0];
                  return (
                    <div
                      key={obj.id ?? idx}
                      className="parentcategory w-full flex flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pl-3 hover:border-slate-300 transition-colors"
                    >
                      <IconTile icon={typeInfo.icon} />
                      <button
                        type="button"
                        onClick={() => handleClick(idx)}
                        className="parentcateogry flex-1 min-w-0 text-left py-1"
                      >
                        <span className="block text-sm font-semibold text-slate-900 break-all">
                          {obj.name}
                        </span>
                        <span className="inline-block mt-0.5 text-xs font-medium text-slate-500">
                          {typeInfo.label}
                          {obj.type === "normal" || !obj.type
                            ? ` · ${obj.subcategories?.length ?? 0} sub`
                            : ""}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClick(idx)}
                        className={`actions shrink-0 h-9 px-3 rounded-lg text-sm font-semibold border flex items-center gap-2 transition-colors ${ACCENTS.neutral.soft}`}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                        <span className="max-small_phone:hidden">Edit</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${obj.name}`}
                        onClick={() => {
                          const allcate = [...categories];
                          const deletedItem = allcate.splice(idx, 1)[0];

                          setalldata((prev) => ({ ...prev, category: allcate }));
                          settempcate((prev) => [...prev, deletedItem]);
                          setglobalindex((prev) => ({
                            ...prev,
                            categoryeditindex: [...prev.categoryeditindex, obj.id as number],
                          }));
                        }}
                        className={`actions shrink-0 h-9 px-3 rounded-lg text-sm font-semibold border flex items-center gap-2 transition-colors ${ACCENTS.danger.soft}`}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        <span className="max-small_phone:hidden">Delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="editcontainer relative flex flex-col gap-y-4 w-full">
            {loading && (
              <div className="absolute inset-0 z-10 rounded-xl bg-white/80 flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <Spinner className="border-slate-200 border-t-slate-600" />
                  Saving...
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Back to list"
                onClick={() => {
                  setedit(false);
                  setcategory(CateogoryInitailizestate);
                }}
                className="w-9 h-9 shrink-0 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">All categories / Edit</p>
                <h4 className="text-base font-semibold text-slate-900 truncate">
                  {category.name || "Untitled category"}
                </h4>
              </div>
              {category.type && TYPE_ACCENT[category.type] && (
                <span
                  className={`ml-auto shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${ACCENTS.neutral.tile}`}
                >
                  {TYPE_ACCENT[category.type].label}
                </span>
              )}
            </div>

            <SectionCard icon={faPen} title="Details">
              <DetailsFields
                name={category.name}
                description={category.description}
                onChange={handleEditChange}
              />
            </SectionCard>

            {category.type === "sale" && (
              <SectionCard
                icon={faTags}
                title="Promotions"
                hint="Products from these promotions are listed in this category."
              >
                <SelectAndSearchProduct
                  getdata={(take, value) => GetPromotionSelection(value, take)}
                  placeholder="Search promotions"
                  value={category.subcategories.map((sub) => ({
                    label: sub.name,
                    value: sub.pid ?? 0,
                  }))}
                  onSelect={(value) => handleSelectPromotion(value as Array<SelectType>)}
                />
              </SectionCard>
            )}

            {category.type === "normal" && (
              <SectionCard icon={faFolderTree} title="Sub categories">
                <AddSubCategoryMenu index={editindex} />
              </SectionCard>
            )}

            {category.type === "popular" && (
              <SectionCard
                icon={faCalendarDays}
                title="Date range"
                hint="The period used to decide which products are popular."
              >
                <CategoryDateRange />
              </SectionCard>
            )}

            <div className="flex flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setedit(false);
                  setcategory(CateogoryInitailizestate);
                }}
                className="h-10 px-5 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors max-small_phone:flex-1"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleConfirm()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-small_phone:flex-1"
              >
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {pendingCount > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-3 w-full rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <IconTile icon={faTriangleExclamation} accent="danger" size="sm" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800">
                {pendingCount} {pendingCount === 1 ? "category" : "categories"} marked for deletion
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Nothing is deleted until you confirm. This can&apos;t be undone afterwards.
              </p>
            </div>
          </div>
          <div className="flex flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => handleReset()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-small_phone:flex-1"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
              Undo all
            </button>
            <button
              type="button"
              onClick={() => handleDelete()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-red-600 text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-small_phone:flex-1"
            >
              {loading ? <Spinner /> : <FontAwesomeIcon icon={faTrashCan} className="text-xs" />}
              {loading ? "Deleting..." : `Delete ${pendingCount}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
