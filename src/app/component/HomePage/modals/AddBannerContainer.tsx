"use client";

import { ChangeEvent, memo, useCallback, useEffect, useState } from "react";
import React from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import {
  BannersType,
  Containertype,
} from "../../../severactions/containeraction";
import { SelectType } from "@/src/types/productAction.type";
import { CloseVector } from "../../Asset";
import PrimaryButton, { Selection } from "../../Button";
import { TextInput } from "../../FormComponent";
import { BannerSkeleton } from "../Component";
import { Button } from "@heroui/react";
import { Bannercard } from "./Bannercard";

const AddProductType = [
  { label: "All", value: "all" },
  { label: "Filter", value: "filter" },
];

const BannerGridSkeleton = memo(function BannerGridSkeleton({
  count,
}: {
  count: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <BannerSkeleton key={`skeleton-${idx}`} />
      ))}
    </>
  );
});

export const AddBannerContainer = memo(function AddBannerContainer({
  setdata,
  data,
  singleselect,
}: {
  data: Containertype;
  setdata: React.Dispatch<React.SetStateAction<Containertype>>;
  singleselect?: boolean;
}) {
  const [loading, setloading] = useState(false);
  const [islimit, setlimit] = useState(true);
  const [banners, setbanners] = useState<BannersType[]>([]);
  const [isFilter, setisFilter] = useState(false);
  const [cate, setcate] = useState<{
    parent: Array<SelectType>;
    sub?: Array<SelectType>;
  }>({ parent: [] });

  const [filter, setfilter] = useState({
    q: "",
    ty: AddProductType[0].value,
    limit: 3,
    parentcate: undefined,
    subcate: undefined,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchdata = async () => {
      setloading(true);
      try {
        const url =
          data.type === "category" ||
          data.type === "slide" ||
          data.type === "banner"
            ? `/api/home/banner?take=${filter.limit}${
                filter.q ? `&q=${filter.q}` : ""
              }&ty=${data.type}`
            : `/api/home/product?limit=${filter.limit}${
                filter.q ? `&q=${filter.q}` : ""
              }${filter.parentcate ? `&pid=${filter.parentcate}` : ""}${
                filter.subcate ? `&cid=${filter.subcate}` : ""
              }${data.id ? `&conId=${data.id}` : ""}`;

        const request = await ApiRequest(url, undefined, "GET");

        if (request.success && isMounted) {
          setbanners(request.data);
          setlimit(request.isLimit ?? false);
        }
      } catch (error) {
        console.log("Failed to fetch data:", error);
      } finally {
        if (isMounted) setloading(false);
      }
    };

    const timeoutId = setTimeout(
      () => {
        fetchdata();
      },
      filter.q ? 300 : 0,
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    filter.q,
    filter.parentcate,
    filter.subcate,
    filter.limit,
    data.type,
    data.id,
  ]);

  useEffect(() => {
    let isMounted = true;

    if (isFilter && cate.parent.length === 0) {
      const getCategories = async () => {
        setloading(true);
        try {
          const parentcategories = await ApiRequest(
            "/api/categories/select?ty=parent",
            undefined,
            "GET",
          );
          if (parentcategories.success && isMounted) {
            setcate((prev) => ({ ...prev, parent: parentcategories.data }));
          }
        } catch (error) {
          console.log("Failed to fetch categories:", error);
        } finally {
          if (isMounted) setloading(false);
        }
      };
      getCategories();
    }

    return () => {
      isMounted = false;
    };
  }, [isFilter, cate.parent.length]);

  const handleLoadMore = useCallback(() => {
    setfilter((prev) => ({ ...prev, limit: prev.limit + 3 }));
  }, []);

  const handleClick = useCallback(
    (id: number) => {
      const banner = banners.find((b) => b.id === id);
      if (!banner) return;

      setdata((prev) => {
        const baseItems = singleselect ? [] : [...prev.items];
        const itemIndex = baseItems.findIndex((i) => i.item?.id === id);

        const newItems =
          itemIndex !== -1
            ? baseItems.filter((_, i) => i !== itemIndex)
            : [
                ...baseItems,
                {
                  item: {
                    id: banner.id,
                    name: banner.name,
                    type: banner.type,
                    image: banner.image,
                  },
                },
              ];

        return { ...prev, items: newItems };
      });
    },
    [banners, singleselect, setdata],
  );

  const handleSelect = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = event.target;

      if (name === "parentcate") {
        setfilter(
          (prev) => ({ ...prev, parentcate: value, subcate: "" }) as any,
        );

        if (value) {
          setloading(true);
          try {
            const childcategories = await ApiRequest(
              `/api/categories/select?ty=child&pid=${value}`,
              undefined,
              "GET",
            );
            if (childcategories.success) {
              setcate((prev) => ({ ...prev, sub: childcategories.data }));
            }
          } catch (error) {
            console.log("Failed to fetch subcategories:", error);
          } finally {
            setloading(false);
          }
        } else {
          setcate((prev) => ({ ...prev, sub: undefined }));
        }
      } else {
        setfilter((prev) => ({ ...prev, [name]: value }));
      }
    },
    [],
  );

  const handleClear = useCallback(
    (type: "select" | "filter") => {
      if (type === "select") {
        setdata((prev) => ({ ...prev, items: [] }));
      } else {
        setfilter({
          q: "",
          ty: AddProductType[0].value,
          limit: 3,
          parentcate: undefined,
          subcate: undefined,
        });
      }
    },
    [setdata],
  );

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setfilter((prev) => ({ ...prev, q: e.target.value }));
  }, []);

  const toggleFilter = useCallback(() => {
    setisFilter((prev) => !prev);
  }, []);

  const itemType = data.type === "scrollable" ? "products" : "banners";

  return (
    <div className="addbannerContainer w-full h-fit flex flex-col items-center justify-center gap-y-6 relative">
      {/* Action / Filter Bar */}
      {!isFilter ? (
        <div className="w-full p-4 bg-linear-to-r from-gray-700 via-gray-600 to-gray-700 rounded-xl flex flex-row gap-x-3 items-center flex-wrap gap-y-3 shadow-lg border border-gray-600">
          <PrimaryButton
            type="button"
            text="Filter Options"
            color="#3B82F6"
            hoverColor="#2563EB"
            radius="12px"
            height="44px"
            onClick={toggleFilter}
            width="150px"
            Icon={
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            }
          />
          {(filter.parentcate || filter.subcate || filter.q) && (
            <PrimaryButton
              type="button"
              text="Clear Filters"
              color="#F59E0B"
              hoverColor="#D97706"
              radius="12px"
              height="44px"
              onClick={() => handleClear("filter")}
              width="140px"
            />
          )}
          {data.items.length !== 0 && (
            <PrimaryButton
              text="Clear Selection"
              radius="12px"
              type="button"
              status={loading ? "loading" : "authenticated"}
              height="44px"
              width="160px"
              onClick={() => handleClear("select")}
              color="#EF4444"
              hoverColor="#DC2626"
            />
          )}
          {data.items.length > 0 && (
            <div className="ml-auto bg-linear-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {data.items.length} selected
            </div>
          )}
        </div>
      ) : (
        <div className="filtercontainer w-full h-fit p-6 border-2 rounded-2xl border-blue-400 bg-linear-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col justify-center gap-y-5 relative shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-white">Filter Options</h4>
            </div>
            <button
              onClick={toggleFilter}
              className="w-9 h-9 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 bg-red-500 hover:bg-red-600 rounded-full shadow-lg"
            >
              <CloseVector width="20px" height="20px" />
            </button>
          </div>

          <div className="w-full h-fit flex flex-col gap-y-3">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-400"
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
              Search {itemType}
            </label>
            <TextInput
              style={{ height: "48px", color: "black" }}
              type="text"
              placeholder={`Search ${itemType} by name...`}
              value={filter.q}
              onChange={handleSearchChange}
            />
          </div>

          {data.type === "scrollable" && (
            <div className="w-full h-fit flex flex-row items-center gap-x-5 max-small_phone:flex-col max-small_phone:gap-y-5">
              <div className="w-full h-fit flex flex-col gap-y-3">
                <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Parent Category
                </label>
                <Selection
                  name="parentcate"
                  defaultValue={""}
                  value={filter.parentcate}
                  data={cate.parent}
                  style={{ height: "48px", color: "black" }}
                  default="None"
                  onChange={handleSelect}
                />
              </div>
              {cate.sub && (
                <div className="w-full h-fit flex flex-col gap-y-3">
                  <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-pink-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    Sub Category
                  </label>
                  <Selection
                    style={{ height: "48px", color: "black" }}
                    name="subcate"
                    default="None"
                    defaultValue={""}
                    data={cate.sub}
                    value={filter.subcate}
                    onChange={handleSelect}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Grid */}
      <div
        className={`addbannerscroll__container w-full h-fit ${
          isFilter
            ? data.type !== "scrollable"
              ? "max-h-[60vh]"
              : "max-h-[48vh]"
            : data.type !== "scrollable"
              ? "max-h-[68vh]"
              : "max-h-[65vh]"
        } overflow-y-auto overflow-x-hidden grid grid-cols-2 max-smallest_tablet:grid-cols-1 gap-x-6 gap-y-8 place-items-center z-0 p-4 bg-linear-to-b from-gray-800/30 to-transparent rounded-xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800`}
      >
        {loading ? (
          <BannerGridSkeleton
            count={banners.length === 0 ? 4 : banners.length}
          />
        ) : banners.length > 0 ? (
          banners.map((banner) => (
            <Bannercard
              onClick={handleClick}
              idx={data.items.findIndex((i) => i.item?.id === banner.id) + 1}
              id={banner.id ?? 0}
              image={banner.image.url}
              key={banner.id}
              isAdd={true}
              isAdded={data.items.some((item) => item.item?.id === banner.id)}
              typesize={banner.type ?? "small"}
              name={banner.name}
            />
          ))
        ) : (
          <div className="col-span-2 w-full py-16 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No {itemType} found
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                {filter.q || filter.parentcate || filter.subcate
                  ? "Try adjusting your filters or search query"
                  : `No ${itemType} available at the moment`}
              </p>
            </div>
          </div>
        )}
        {!loading && !islimit && banners.length > 0 && (
          <div className="col-span-2 w-full flex justify-center pt-4">
            <Button
              type="button"
              isLoading={loading}
              onClick={handleLoadMore}
              color="primary"
              variant="solid"
              className="text-white font-bold px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              Load More {itemType}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
