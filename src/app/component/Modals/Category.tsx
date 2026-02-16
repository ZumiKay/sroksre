"use client";
import {
  CateogoryInitailizestate,
  CateogoryState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { errorToast, successToast } from "../Loading";
import {
  ApiRequest,
  Delayloading,
  useScreenSize,
} from "@/src/context/CustomHook";
import { motion } from "framer-motion";
import { SecondaryModal } from "../Modals";
import { AddSubCategoryMenu } from "../ToggleMenu";
import { SelectionCustom } from "../Pagination_Component";
import { Categorytype } from "../../api/categories/route";
import { DateRangePicker, Input } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { SelectAndSearchProduct } from "../Banner";
import { SelectType } from "@/src/types/productAction.type";

const selecttype: Array<SelectType> = [
  {
    label: "Normal",
    value: "normal",
  },
  {
    label: "Popular",
    value: "popular",
  },
  {
    label: "Latest",
    value: "latest",
  },
  {
    label: "Sale",
    value: "sale",
  },
];

export const GetPromotionSelection = async (
  search: string,
  limit: number = 1,
) => {
  const url = `/api/promotion?ty=selection&lt=${limit}${
    search !== "" ? `&q=${search}` : ""
  }`;
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
  const { openmodal, setopenmodal, category, setcategory, allData } =
    useGlobalContext();
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
    const isExist = allData?.category?.some(
      (obj) => obj.name === category.name,
    );
    if (isExist) {
      errorToast("Category Existed");
      return;
    }

    setloading(true);
    const saved = await ApiRequest(
      "/api/categories",
      undefined,
      "POST",
      "JSON",
      { ...category, type: catetype },
    );
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

  //category navbar

  const CategoryNavBar = () => {
    return (
      <div className="category__navbar w-full h-fit bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-2 shadow-md border-2 border-gray-200">
        <div className="flex flex-row items-center gap-2">
          {(["Create", "Edit"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleNavbar(mode)}
              className={`category_header w-[50%] h-12 text-center text-base font-bold transition-all duration-300 rounded-xl flex items-center justify-center gap-2 ${
                show === mode
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-md"
              }`}
            >
              <i
                className={`fa-solid ${
                  mode === "Create" ? "fa-plus" : "fa-pen-to-square"
                } text-sm`}
              ></i>
              <span>{mode}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <SecondaryModal
      open={openmodal.createCategory}
      size="4xl"
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, createCategory: val }))
      }
      placement={isMobile ? "top-center" : isTablet ? "center" : undefined}
    >
      <div className="category relative rounded-2xl p-6 w-full h-full flex flex-col items-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 gap-y-6 shadow-inner">
        <CategoryNavBar />
        {show === "Create" ? (
          <>
            <div className="w-full h-fit bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
              <div className="space-y-2 mb-4">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-layer-group text-blue-500"></i>
                  Category Type
                </h4>
                <p className="text-sm text-gray-500">
                  Select the type of category
                </p>
              </div>
              <SelectionCustom
                value={catetype}
                setvalue={setcatetype as any}
                data={selecttype}
                label="Type"
                placeholder="Type"
              />
            </div>
            <div className="w-full h-fit flex flex-col gap-y-5 bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-info-circle text-purple-500"></i>
                  Basic Information
                </h4>
                <p className="text-sm text-gray-500">Enter category details</p>
              </div>
              <Input
                type="text"
                variant="bordered"
                size="lg"
                label="Category Name"
                name="name"
                value={category.name}
                onChange={handleChange}
                required
                classNames={{
                  label: "text-gray-700 font-semibold",
                  input: "bg-gray-50",
                }}
              />
              <Input
                type="text"
                variant="bordered"
                size="lg"
                label="Description"
                name="description"
                value={category.description}
                onChange={handleChange}
                required
                classNames={{
                  label: "text-gray-700 font-semibold",
                  input: "bg-gray-50",
                }}
              />
            </div>
            {catetype === "sale" && (
              <div className="w-full h-fit bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 shadow-lg border-2 border-orange-200">
                <div className="space-y-2 mb-4">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <i className="fa-solid fa-tags text-orange-500"></i>
                    Promotion Selection
                  </h4>
                  <p className="text-sm text-gray-500">
                    Link this category to a promotion
                  </p>
                </div>
                <SelectAndSearchProduct
                  getdata={(take, value) => GetPromotionSelection(value, take)}
                  placeholder="Select Promotion"
                  value={category.subcategories.map((sub) => ({
                    label: sub.name,
                    value: sub.id ?? 0,
                  }))}
                  onSelect={(value) =>
                    handleSelectPromotion(value as Array<SelectType>)
                  }
                />
              </div>
            )}

            {catetype === "popular" && (
              <div className="w-full h-fit bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 shadow-lg border-2 border-green-200">
                <div className="space-y-2 mb-4">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <i className="fa-solid fa-calendar-days text-green-500"></i>
                    Date Range
                  </h4>
                  <p className="text-sm text-gray-500">
                    Set the popularity period
                  </p>
                </div>
                <DateRangePicker
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
                  label="Range of Date"
                  className="w-full"
                />
              </div>
            )}

            {catetype === "normal" &&
              (openmodal.addsubcategory ? (
                <div className="w-full max-h-[500px] bg-white rounded-2xl p-4 shadow-lg border-2 border-indigo-200">
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
                  className={`w-full h-14 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                    category.name.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl hover:scale-105"
                  }`}
                >
                  <i className="fa-solid fa-folder-tree text-lg"></i>
                  <span>
                    {category.subcategories.length > 0
                      ? "Manage Subcategories"
                      : "Add Subcategories"}
                  </span>
                </button>
              ))}
          </>
        ) : (
          <EditCategory loading={loading} setloading={setloading} show={show} />
        )}
        <div className="flex flex-row justify-start gap-4 w-full">
          {show === "Create" && (
            <button
              type="button"
              onClick={() => category.name.length > 0 && handleAdd()}
              disabled={category.name.length === 0 || loading}
              className={`w-full h-14 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3 ${
                category.name.length === 0 || loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-2xl hover:scale-105"
              }`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Create Category</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </SecondaryModal>
  );
};

const EditCategory = ({
  loading,
  setloading,
  show,
}: {
  loading: boolean;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  show: "Create" | "Edit";
}) => {
  const {
    allData,
    category,
    setcategory,
    setalldata,
    globalindex,
    setglobalindex,
  } = useGlobalContext();
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

  return (
    <>
      <div className="EditCategory w-full h-full overflow-y-auto overflow-x-hidden flex flex-col gap-y-5">
        {!edit ? (
          <>
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-list text-xl text-indigo-500"></i>
                <h3 className="text-lg font-bold text-gray-800">
                  All Categories
                </h3>
              </div>
              {!loading && allData?.category && allData.category.length > 0 && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-indigo-500 text-white">
                  {allData.category.length}{" "}
                  {allData.category.length === 1 ? "Category" : "Categories"}
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full h-[60px] rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
                    style={{
                      animationDelay: `${idx * 0.1}s`,
                    }}
                  >
                    <div className="flex items-center h-full px-4 gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                      <div className="flex-1 h-4 bg-gray-300 rounded"></div>
                      <div className="w-20 h-8 bg-gray-300 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allData?.category && allData.category.length === 0 ? (
              <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <i className="fa-solid fa-folder-open text-3xl text-gray-400"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-600 mb-2">
                      No Categories Yet
                    </h3>
                    <p className="text-sm text-gray-500">
                      Start by creating your first category
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              allData?.category?.map((obj, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.05,
                  }}
                  className="parentcategory w-full bg-gradient-to-r from-white to-gray-50 h-fit min-h-[60px] rounded-xl flex flex-row items-center gap-3 p-3 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
                >
                  <button
                    onClick={() => handleClick(idx)}
                    className="parentcateogry text-base font-bold w-full h-full break-all flex items-center justify-start gap-2 cursor-pointer px-4 py-2 rounded-lg bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 group-hover:scale-105"
                  >
                    <i className="fa-solid fa-folder text-lg"></i>
                    <span>{obj.name}</span>
                  </button>
                  <button
                    onClick={() => {
                      const allcate = [...(allData.category ?? [])];
                      const deletedItem = allcate.splice(idx, 1)[0];

                      setalldata((prev) => ({ ...prev, category: allcate }));
                      settempcate((prev) => [...prev, deletedItem]);
                      setglobalindex((prev) => ({
                        ...prev,
                        categoryeditindex: [
                          ...prev.categoryeditindex,
                          obj.id as number,
                        ],
                      }));
                    }}
                    className="actions text-white font-bold text-sm cursor-pointer min-w-[100px] h-full transition-all duration-300 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:shadow-lg px-4 py-2"
                  >
                    <i className="fa-solid fa-trash"></i>
                    <span>Delete</span>
                  </button>
                </motion.div>
              ))
            )}{" "}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="editcontainer flex flex-col gap-y-6 w-full h-full bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 relative shadow-xl border-2 border-blue-200"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <i className="fa-solid fa-spinner fa-spin text-2xl text-white"></i>
                  </div>
                  <p className="text-base font-semibold text-gray-700">
                    Processing...
                  </p>
                </div>
              </div>
            )}

            <div className="w-full space-y-2 pb-4 border-b-2 border-blue-200">
              <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <i className="fa-solid fa-pen-to-square text-white"></i>
                </div>
                Edit Category
              </h4>
              <p className="text-sm text-gray-500 ml-13">
                Update category information and settings
              </p>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fa-solid fa-info-circle text-lg text-blue-500"></i>
                  <h5 className="font-bold text-gray-800">Basic Information</h5>
                </div>
                <Input
                  type="text"
                  onChange={(e) =>
                    setcategory((prev) => ({ ...prev, name: e.target.value }))
                  }
                  size="lg"
                  variant="bordered"
                  value={category.name}
                  className="subcate_name w-full"
                  label="Category Name"
                  placeholder="Enter category name"
                  required
                  classNames={{
                    label: "text-gray-700 font-semibold",
                    input: "bg-gray-50",
                  }}
                />
                <Input
                  size="lg"
                  variant="bordered"
                  type="text"
                  onChange={(e) =>
                    setcategory((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  value={category.description}
                  className="subcate_name w-full"
                  label="Description"
                  placeholder="Enter description"
                  required
                  classNames={{
                    label: "text-gray-700 font-semibold",
                    input: "bg-gray-50",
                  }}
                />
              </div>

              {category.type === "sale" && (
                <div className="w-full bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                  <div className="space-y-2 mb-4">
                    <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                      <i className="fa-solid fa-tags text-orange-500"></i>
                      Promotion
                    </h5>
                  </div>
                  <SelectAndSearchProduct
                    getdata={(take, value) =>
                      GetPromotionSelection(value, take)
                    }
                    placeholder="Select Promotion"
                    value={category.subcategories.map((sub) => ({
                      label: sub.name,
                      value: sub.pid ?? 0,
                    }))}
                    onSelect={(value) =>
                      handleSelectPromotion(value as Array<SelectType>)
                    }
                  />
                </div>
              )}
              {category.type === "normal" && (
                <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                  <AddSubCategoryMenu index={editindex} />
                </div>
              )}

              {category.type === "popular" && (
                <div className="w-full bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="space-y-2 mb-4">
                    <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                      <i className="fa-solid fa-calendar-days text-green-500"></i>
                      Date Range
                    </h5>
                  </div>
                  <DateRangePicker
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
                    label="Range of Date"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="w-full h-fit flex flex-row gap-4 justify-center pt-4 border-t-2 border-blue-200">
              <button
                type="button"
                onClick={() => handleConfirm()}
                disabled={loading}
                className={`w-full h-12 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i>
                    <span>Confirm</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setedit(false);
                  setcategory(CateogoryInitailizestate);
                }}
                className="w-full h-12 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-red-600 text-white hover:from-pink-600 hover:to-red-700 hover:shadow-xl"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
      {globalindex.categoryeditindex.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 w-full h-fit bg-gradient-to-r from-red-50 to-pink-50 p-5 rounded-2xl border-2 border-red-300 shadow-lg"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-red-200">
            <i className="fa-solid fa-exclamation-triangle text-red-500"></i>
            <h4 className="font-bold text-gray-800">Pending Deletions</h4>
            <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-red-500 text-white">
              {globalindex.categoryeditindex.length}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            You have {globalindex.categoryeditindex.length}{" "}
            {globalindex.categoryeditindex.length === 1
              ? "category"
              : "categories"}{" "}
            marked for deletion. Confirm to permanently delete.
          </p>
          <div className="flex flex-row gap-3">
            <button
              type="button"
              onClick={() => handleDelete()}
              disabled={loading}
              className={`w-full h-12 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 hover:shadow-2xl hover:scale-105"
              }`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-trash-can"></i>
                  <span>
                    Confirm Delete ({globalindex.categoryeditindex.length})
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                handleReset();
              }}
              disabled={loading || globalindex.categoryeditindex.length === 0}
              className={`w-full h-12 rounded-xl font-bold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                loading || globalindex.categoryeditindex.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-gray-500 to-gray-700 text-white hover:from-gray-600 hover:to-gray-800 hover:shadow-2xl hover:scale-105"
              }`}
            >
              <i className="fa-solid fa-rotate-left"></i>
              <span>Undo All</span>
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
};
