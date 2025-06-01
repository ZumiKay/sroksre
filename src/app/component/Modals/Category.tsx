"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { errorToast, successToast } from "../Loading";
import {
  ApiRequest,
  Delayloading,
  useScreenSize,
} from "@/src/context/CustomHook";
import { motion } from "framer-motion";
import { SecondaryModal } from "../Modals";
import { AddSubCategoryMenu } from "../ToggleMenu";
import PrimaryButton from "../Button";
import { DateRangePicker, Input } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { NormalSkeleton, SelectAndSearchProduct } from "../Banner";
import {
  CateogoryState,
  SearchAndSelectReturnType,
  SelectType,
} from "@/src/context/GlobalType.type";
import { AsyncSelection } from "../AsynSelection";

const categoryType: Array<SelectType> = [
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
  limit: number = 1
) => {
  const url = `/api/promotion?ty=selection&lt=${limit}${
    search !== "" ? `&q=${search}` : ""
  }`;
  const request = await ApiRequest({ url, method: "GET" });

  if (!request.success) {
    return { success: false };
  }
  const data = request.data as SearchAndSelectReturnType;
  return {
    success: true,
    data,
  };
};
export const Category = () => {
  const { openmodal, setopenmodal, category, setcategory, allData } =
    useGlobalContext();
  const [show, setshow] = useState<"Create" | "Edit">("Create");
  const [loading, setloading] = useState(false);
  const { isMobile, isTablet } = useScreenSize();

  // Check if form is valid
  const isFormValid = useMemo(
    () => category?.name && category.name.length > 0 && category.description,
    [category?.name, category?.description]
  );

  // Check if category name already exists
  const categoryExists = useMemo(
    () => allData?.category?.some((obj) => obj.name === category?.name),
    [allData?.category, category?.name]
  );

  // Determine if subcategories exist
  const hasSubcategories = useMemo(
    () => category?.subcategories && category.subcategories.length > 0,
    [category?.subcategories]
  );

  // Modal placement based on screen size
  const modalPlacement = useMemo(() => {
    if (isMobile) return "top-center";
    if (isTablet) return "center";
    return undefined;
  }, [isMobile, isTablet]);

  useEffect(() => {
    setcategory({
      type: "normal",
      name: "",
      subcategories: [],
    });
  }, [setcategory]);

  const handleAdd = useCallback(async () => {
    if (!category) return;

    if (!isFormValid) {
      errorToast("Please fill all required fields");
      return;
    }

    if (categoryExists) {
      errorToast("Category already exists");
      return;
    }

    setloading(true);

    try {
      const saved = await ApiRequest({
        url: "/api/categories",
        method: "POST",
        data: { ...category },
      });

      if (!saved.success) {
        errorToast("Failed to create category");
        return;
      }

      setcategory(null);
      successToast("Category created successfully");
    } catch (error) {
      errorToast("An error occurred");
      throw error;
    } finally {
      setloading(false);
    }
  }, [category, setcategory, isFormValid, categoryExists]);

  const handleNavbar = useCallback(
    (show: "Create" | "Edit") => {
      setshow(show);
      setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
      setcategory(null);
    },
    [setcategory, setopenmodal]
  );

  const handleSelectPromotion = useCallback(
    (value: Array<SelectType>) => {
      if (!value || !category) {
        setcategory(
          (prev) => ({ ...prev, subcategories: [] } as CateogoryState)
        );
        return;
      }

      const subcategories = value.map((i) => ({
        name: i.label,
        type: "promo",
        pid: i.value as number,
        id: (i.value as number) ?? 0,
      }));

      setcategory((prev) => ({ ...prev, subcategories } as CateogoryState));
    },
    [category, setcategory]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setcategory(
        (prev) => (prev ? { ...prev, [name]: value } : null) as CateogoryState
      );
    },
    [setcategory]
  );

  const handleDateRangeChange = useCallback(
    (val: { start: Date; end: Date } | null) => {
      if (!val || !category) return;

      setcategory((prev) => ({
        ...(prev as CateogoryState),
        daterange: {
          start: val.start.toString(),
          end: val.end.toString(),
        },
      }));
    },
    [category, setcategory]
  );

  const handleCloseModal = useCallback(() => {
    setopenmodal({ createCategory: false });
    setcategory(null);
  }, [setcategory, setopenmodal]);

  const handleToggleSubcategory = useCallback(() => {
    if (!category || category.name.length === 0) return;

    setopenmodal((prev) => ({
      ...prev,
      addsubcategory: !prev.addsubcategory,
    }));
  }, [category, setopenmodal]);

  // Memoized CategoryNavBar component
  const CategoryNavBar = useMemo(
    () => (
      <div className="flex w-4/5 h-12 border-b border-gray-200">
        {["Create", "Edit"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleNavbar(tab as "Create" | "Edit")}
            className={`
            w-1/2 text-center font-semibold text-lg
            transition-all duration-200 hover:-translate-y-1 
            focus:outline-none
            ${
              show === tab
                ? "border-b-3 border-gray-800 text-gray-800"
                : "text-gray-500"
            }
          `}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
    ),
    [handleNavbar, show]
  );

  return (
    <SecondaryModal
      open={openmodal.createCategory ?? false}
      size="4xl"
      onPageChange={handleCloseModal}
      placement={modalPlacement}
    >
      <div className="relative rounded-lg p-6 w-full flex flex-col items-center bg-white gap-y-6 shadow-sm">
        {CategoryNavBar}

        {show === "Create" ? (
          <>
            <div className="w-full">
              <AsyncSelection
                type="normal"
                data={() => categoryType}
                option={{
                  label: "Type",
                  name: "type",
                  selectedValue: [category?.type as string],
                  onValueChange: (e) => handleChange(e as never),
                }}
              />
            </div>

            <div className="w-full space-y-5">
              <Input
                type="text"
                variant="bordered"
                size="lg"
                label="Name"
                name="name"
                value={category?.name || ""}
                onChange={handleChange}
                required
                className="focus:border-primary"
              />

              <Input
                type="text"
                variant="bordered"
                size="lg"
                label="Description"
                name="description"
                value={category?.description || ""}
                onChange={handleChange}
                required
                className="focus:border-primary"
              />

              {category?.type === "sale" && (
                <SelectAndSearchProduct
                  apiEndpoint={`/api/promotion`}
                  searchParam={"?ty=selection"}
                  placeholder="Select Promotion"
                  value={category?.subcategories?.map((sub) => ({
                    label: sub.name,
                    value: sub.id ?? 0,
                  }))}
                  onSelect={(value) =>
                    handleSelectPromotion(value as Array<SelectType>)
                  }
                />
              )}

              {category?.type === "popular" && (
                <DateRangePicker
                  value={
                    category.daterange
                      ? {
                          start: parseDate(category.daterange.start),
                          end: parseDate(category.daterange.end),
                        }
                      : undefined
                  }
                  onChange={handleDateRangeChange as never}
                  label="Range of Date"
                  className="w-full"
                />
              )}
            </div>

            {category?.type === "normal" &&
              (openmodal.addsubcategory ? (
                <div className="w-full max-h-[500px] overflow-y-auto rounded-md border border-gray-200">
                  <AddSubCategoryMenu index={-1} />
                </div>
              ) : (
                <PrimaryButton
                  width="80%"
                  height="50px"
                  radius="10px"
                  onClick={handleToggleSubcategory}
                  text={
                    hasSubcategories
                      ? "Manage Subcategories"
                      : "Add Subcategory"
                  }
                  type="button"
                  disable={!category?.name || category.name.length === 0}
                />
              ))}
          </>
        ) : (
          <EditCategory loading={loading} setloading={setloading} />
        )}

        {show === "Create" && (
          <div className="flex w-[90%] h-12 mt-2">
            <PrimaryButton
              width="100%"
              height="100%"
              radius="10px"
              onClick={handleAdd}
              text="Create Category"
              status={loading ? "loading" : "authenticated"}
              color="#35C191"
              type="button"
              disable={!isFormValid}
            />
          </div>
        )}
      </div>
    </SecondaryModal>
  );
};

const EditCategory = ({
  loading,
  setloading,
}: {
  loading: boolean;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
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

  // Memoized values
  const hasCategories = useMemo(
    () => allData?.category && allData.category.length > 0,
    [allData?.category]
  );

  const hasDeletedCategories = useMemo(
    () => globalindex.categoryeditindex.length > 0,
    [globalindex.categoryeditindex]
  );

  const isFormValid = useMemo(
    () => category?.name && category.name.length > 0 && category?.description,
    [category?.name, category?.description]
  );

  // Fetch categories on component mount
  useEffect(() => {
    const fetchAllCate = async () => {
      const request = async () => {
        try {
          const res = await ApiRequest({ url: URL, method: "GET" });
          if (res.success) {
            setalldata((prev) => ({
              ...prev,
              category: res.data as Array<CateogoryState>,
            }));
          }
        } catch (error) {
          console.log("Error fetching categories:", error);
          errorToast("Failed to fetch categories");
        }
      };

      await Delayloading(request, setloading, 500);
    };

    fetchAllCate();
  }, [setalldata, setloading]);

  // Event handlers with optimized implementations
  const handleClick = useCallback(
    (index: number) => {
      setedit(true);
      seteditindex(index);

      if (allData?.category) {
        setcategory(allData.category[index]);
      }
    },
    [allData?.category, setcategory]
  );
  const handleReset = useCallback(() => {
    if (!allData?.category) return;

    const deletedcate = [...tempcate];
    const allcate = [...allData.category];

    const resetcate = deletedcate.filter((obj) =>
      globalindex.categoryeditindex.includes(obj.id as number)
    );

    resetcate.forEach((obj) => allcate.push(obj));

    setalldata((prev) => ({ ...prev, category: allcate }));
    settempcate([]);
    setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
  }, [
    allData?.category,
    globalindex.categoryeditindex,
    setalldata,
    setglobalindex,
    tempcate,
  ]);

  const handleDelete = useCallback(async () => {
    try {
      setloading(true);
      const deleterequest = await ApiRequest({
        url: URL,
        method: "DELETE",
        data: {
          id: globalindex.categoryeditindex,
        },
      });

      if (deleterequest.success) {
        settempcate([]);
        setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
        successToast("Category deleted successfully");
      } else {
        handleReset();
        errorToast(deleterequest.error as string);
      }
    } catch (error) {
      errorToast("Failed to delete category");
      throw error;
    } finally {
      setloading(false);
    }
  }, [globalindex.categoryeditindex, handleReset, setglobalindex, setloading]);

  const handleConfirm = useCallback(async () => {
    if (!isFormValid) {
      errorToast("Please fill all required fields");
      return;
    }

    const updateReq = async () => {
      const updateRequest = async () => {
        try {
          const res = await ApiRequest({
            url: URL,
            method: "PUT",
            data: category,
          });

          if (res.success) {
            if (allData?.category) {
              const allcate = [...allData.category];

              if (allcate[editindex] && category) {
                allcate[editindex].name = category.name;
                allcate[editindex].subcategories = category.subcategories;
                allcate[editindex].description = category.description;

                if (category.daterange) {
                  allcate[editindex].daterange = category.daterange;
                }

                setalldata((prev) => ({ ...prev, category: allcate }));
              }
            }

            setedit(false);
            seteditindex(-1);
            successToast("Category updated successfully");
          } else {
            errorToast("Failed to update category");
          }
        } catch (error) {
          errorToast("An error occurred while updating");
          throw error;
        }
      };

      await Delayloading(updateRequest, setloading, 1000);
    };

    await updateReq();
  }, [
    allData?.category,
    category,
    editindex,
    setalldata,
    setloading,
    isFormValid,
  ]);

  const handleSelectPromotion = useCallback(
    (value: Array<SelectType>) => {
      if (!category) return;

      setcategory((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          subcategories:
            value?.map((i) => ({
              name: i.label,
              type: "promo",
              pid: i.value as number,
              id: i.value as number,
            })) || [],
        };
      });
    },
    [category, setcategory]
  );

  const handleCancelEdit = useCallback(() => {
    setedit(false);
    setcategory(null);
  }, [setcategory]);

  const handleMarkForDeletion = useCallback(
    (idx: number, obj: CateogoryState) => {
      if (!allData?.category) return;

      const categorydeleteindex = [...globalindex.categoryeditindex];
      const allcate = [...allData.category];
      const copytemp = [...tempcate];

      copytemp.push(allcate[idx]);
      allcate.splice(idx, 1);

      setalldata((prev) => ({ ...prev, category: allcate }));
      settempcate(copytemp);

      categorydeleteindex.push(obj.id as number);
      setglobalindex((prev) => ({
        ...prev,
        categoryeditindex: categorydeleteindex,
      }));
    },
    [
      allData?.category,
      globalindex.categoryeditindex,
      setalldata,
      setglobalindex,
      tempcate,
    ]
  );

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setcategory((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    [setcategory]
  );

  const handleDateRangeChange = useCallback(
    (val: { start: Date; end: Date } | null) => {
      if (!val || !category) return;

      setcategory((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          daterange: {
            start: val.start.toString(),
            end: val.end.toString(),
          },
        };
      });
    },
    [category, setcategory]
  );

  // Render category list or edit form
  return (
    <>
      <div className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col gap-y-5 p-2">
        {!edit ? (
          <>
            {!loading && !hasCategories && (
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                <p className="text-lg text-red-500 font-semibold">
                  No categories found
                </p>
              </div>
            )}

            {loading ? (
              <NormalSkeleton width="100%" height="50px" count={3} />
            ) : (
              <div className="space-y-3">
                {allData?.category?.map((obj, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="bg-white border-2 border-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center overflow-hidden">
                      <button
                        onClick={() => handleClick(idx)}
                        className="flex-1 p-3 text-lg font-medium text-left hover:bg-gray-800 hover:text-white transition-colors duration-200 truncate"
                      >
                        {obj.name}
                      </button>

                      <button
                        onClick={() => handleMarkForDeletion(idx, obj)}
                        className="p-3 text-red-500 font-medium hover:bg-red-500 hover:text-white transition-colors duration-200"
                        aria-label="Delete category"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-5 space-y-4"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Edit Category
            </h3>

            <Input
              type="text"
              onChange={(e) => handleInputChange("name", e.target.value)}
              size="lg"
              value={category?.name || ""}
              label="Category Name"
              placeholder="Enter category name"
              variant="bordered"
              className="w-full"
              required
            />

            <Input
              size="lg"
              type="text"
              onChange={(e) => handleInputChange("description", e.target.value)}
              value={category?.description || ""}
              label="Description"
              placeholder="Enter category description"
              variant="bordered"
              className="w-full"
              required
            />

            {category?.type === "sale" && (
              <div className="pt-2">
                <SelectAndSearchProduct
                  apiEndpoint={`/api/promotion`}
                  searchParam={"?ty=selection"}
                  placeholder="Select Promotion"
                  value={
                    category.subcategories?.map((sub) => ({
                      label: sub.name,
                      value: sub.pid ?? 0,
                    })) || []
                  }
                  onSelect={(value) =>
                    handleSelectPromotion(value as Array<SelectType>)
                  }
                />
              </div>
            )}

            {category?.type === "normal" && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <AddSubCategoryMenu index={editindex} />
              </div>
            )}

            {category?.type === "popular" && (
              <DateRangePicker
                value={
                  category.daterange
                    ? {
                        start: parseDate(category.daterange.start),
                        end: parseDate(category.daterange.end),
                      }
                    : undefined
                }
                onChange={handleDateRangeChange as never}
                label="Date Range"
                className="w-full"
              />
            )}

            <div className="flex gap-4 pt-3">
              <PrimaryButton
                type="button"
                text="Save Changes"
                onClick={handleConfirm}
                width="100%"
                height="44px"
                radius="8px"
                status={loading ? "loading" : "authenticated"}
                color="#35C191"
              />

              <PrimaryButton
                type="button"
                text="Cancel"
                onClick={handleCancelEdit}
                width="100%"
                color="#FF6B6B"
                height="44px"
                radius="8px"
              />
            </div>
          </motion.div>
        )}
      </div>

      {hasDeletedCategories && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full flex gap-4 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <PrimaryButton
            type="button"
            text="Confirm"
            onClick={handleDelete}
            status={loading ? "loading" : "authenticated"}
            width="100%"
            height="44px"
            radius="8px"
            style={{
              padding: "0 20px",
            }}
            color="#FF4757"
          />

          <PrimaryButton
            type="button"
            text="Undo"
            onClick={handleReset}
            width="100%"
            color="#74B9FF"
            height="44px"
            radius="8px"
          />
        </motion.div>
      )}
    </>
  );
};
