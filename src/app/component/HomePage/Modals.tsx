"use client";

import {
  ChangeEvent,
  CSSProperties,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import PrimaryButton, { Selection } from "../Button";
import { TextInput } from "../FormComponent";
import { SecondaryModal } from "../Modals";
import {
  BannersType,
  ContainerType,
  Containertype,
  CreateContainer,
} from "../../severactions/containeraction";
import { useGlobalContext } from "@/src/context/GlobalContext";
import React from "react";
import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
  useScreenSize,
} from "@/src/context/CustomHook";
import Image from "next/image";
import {
  AddIcon,
  BannerIcon,
  CategoriesIcon,
  CloseVector,
  ScrollableConIcon,
  SlideShowIcon,
} from "../Asset";
import { Button, DateRangePicker } from "@nextui-org/react";
import { BannerSkeleton } from "./Component";
import { ContainerLoading, errorToast, successToast } from "../Loading";
import { BannerModal } from "../Modals/Banner";
import { parseDate } from "@internationalized/date";
import { SelectType } from "@/src/types/productAction.type";

interface HomeContainerModalProps {
  setprofile: any;
  isTablet: boolean;
  isPhone: boolean;
}
const containertype = [
  {
    label: "Slide Show",
    value: "slide",
  },
  {
    label: "Scrollable container",
    value: "scrollable",
  },
  {
    label: "Categories",
    value: "category",
  },
  {
    label: "Banner",
    value: "banner",
  },
];

const CreateContainerType = memo(function CreateContainerType({
  data,
  setdata,
}: {
  data: Containertype;
  setdata: React.Dispatch<React.SetStateAction<Containertype>>;
}) {
  const { setopenmodal } = useGlobalContext();

  const handleDelete = useCallback(
    (id: number) => {
      setdata((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.item?.id !== id),
      }));
    },
    [setdata]
  );

  const handleAddBanner = useCallback(() => {
    setopenmodal((prev) => ({ ...prev, Addbanner: true }));
  }, [setopenmodal]);

  return (
    <div className="slideshow w-full h-fit flex flex-col gap-y-6">
      {/* Header Section with Add Button */}
      <div className="header-section w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-xl border border-blue-400/30 backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Banner Selection
          </h3>
          <p className="text-sm text-gray-300">
            {data.items.length === 0
              ? "Add banners to your container"
              : `${data.items.length} banner${
                  data.items.length !== 1 ? "s" : ""
                } selected`}
          </p>
        </div>
        <PrimaryButton
          onClick={handleAddBanner}
          width="220px"
          height="48px"
          type="button"
          text="Add Banner"
          Icon={<AddIcon />}
          color="#3B82F6"
          hoverColor="#2563EB"
          radius="12px"
        />
      </div>

      {/* Selected Banners Grid */}
      {data.items.length > 0 ? (
        <div className="selected-slides-container">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full"></div>
              Selected Banners
            </h4>
            <div className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-full shadow-lg">
              {data.items.length}
            </div>
          </div>
          <div className="selected-slides w-full h-fit max-h-[58vh] overflow-y-auto grid grid-cols-2 max-large_phone:grid-cols-1 gap-6 place-items-center p-4 bg-gradient-to-b from-gray-800/50 to-transparent rounded-xl">
            {data.items.map(
              (item, idx) =>
                item.item && (
                  <Bannercard
                    key={item.item.id}
                    id={item.item?.id ?? 0}
                    image={item.item?.image.url ?? ""}
                    isAdd={false}
                    idx={idx + 1}
                    onDelete={handleDelete}
                    style={{ width: "200px", height: "200px" }}
                    typesize={item.item.type}
                    preview
                  />
                )
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state w-full py-16 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border-2 border-dashed border-gray-600 hover:border-blue-500/50 transition-all duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No banners selected
            </h3>
            <p className="text-sm text-gray-400 max-w-md">
              Click the "Add Banner" button above to start adding banners to
              your container
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

const ScrollableTemplate = [
  {
    label: "Custom",
    value: "custom",
  },
  {
    label: "Popular Products",
    value: "popular",
  },
  {
    label: "Latest Products",
    value: "new",
  },
];

const ScrollableContainerModal = memo(function ScrollableContainerModal({
  data,
  setdata,
}: {
  data: Containertype;
  setdata: React.Dispatch<React.SetStateAction<Containertype>>;
}) {
  const { setopenmodal } = useGlobalContext();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setdata((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [setdata]
  );

  const handleClick = useCallback(
    (id: number) => {
      setdata((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.item?.id !== id),
      }));
    },
    [setdata]
  );

  const handleDelete = useCallback(
    (id: number) => {
      setdata((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.item?.id !== id),
      }));
    },
    [setdata]
  );

  const handleTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setdata((prev) => ({
        ...prev,
        amountofitem: undefined,
        daterange: undefined,
        item: [],
        scrollabletype: e.target.value as any,
      }));
    },
    [setdata]
  );

  const handleDateChange = useCallback(
    (date: any) => {
      setdata((prev) => ({
        ...prev,
        daterange: {
          start: date.start.toString(),
          end: date.end.toString(),
        },
      }));
    },
    [setdata]
  );

  const handleAddProduct = useCallback(() => {
    setopenmodal((prev) => ({ ...prev, Addproduct: true }));
  }, [setopenmodal]);

  // Memoize template description
  const templateDescription = useMemo(() => {
    switch (data.scrollabletype) {
      case "popular":
        return "Display products based on purchase frequency within a date range";
      case "new":
        return "Automatically show the latest products added to your store";
      case "custom":
        return "Manually select specific products to display";
      default:
        return "";
    }
  }, [data.scrollabletype]);

  return (
    <div className="w-full h-full flex flex-col gap-y-6">
      {/* Configuration Section */}
      <div className="config-section p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/30">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <h3 className="text-lg font-bold text-white">
            Container Configuration
          </h3>
        </div>

        <div className="w-full h-fit flex flex-row items-start max-small_phone:flex-col gap-5">
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
              Template Type
            </label>
            <Selection
              onChange={handleTypeChange}
              style={{ color: "black" }}
              value={data.scrollabletype}
              data={ScrollableTemplate}
            />
            {templateDescription && (
              <p className="text-xs text-gray-300 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                <span className="text-purple-400 font-semibold">ℹ️</span>{" "}
                {templateDescription}
              </p>
            )}
          </div>
          {data.scrollabletype !== "custom" && (
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
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                Item Count
              </label>
              <TextInput
                value={data.amountofitem}
                type="number"
                name="amountofitem"
                placeholder="e.g., 10"
                style={{ height: "48px", color: "black" }}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        {data.scrollabletype === "popular" && (
          <div className="w-full h-fit flex flex-col gap-y-3 mt-5 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/30">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Popularity Date Range
            </label>
            <DateRangePicker
              radius="sm"
              aria-label="Date Range Picker"
              value={
                data.daterange
                  ? {
                      start: parseDate(data.daterange.start ?? ""),
                      end: parseDate(data.daterange.end),
                    }
                  : undefined
              }
              onChange={handleDateChange}
              className="max-w-xs"
            />
            <p className="text-xs text-gray-400 mt-1">
              Products will be ranked by sales within this date range
            </p>
          </div>
        )}
      </div>

      {/* Add Product Button for Custom Type */}
      {data.scrollabletype !== "new" && data.scrollabletype !== "popular" && (
        <div className="add-product-section p-5 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-xl border border-green-400/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Product Selection
              </h4>
              <p className="text-sm text-gray-300">
                {data.items.length === 0
                  ? "Add products to your scrollable container"
                  : `${data.items.length} product${
                      data.items.length !== 1 ? "s" : ""
                    } added`}
              </p>
            </div>
            <PrimaryButton
              onClick={handleAddProduct}
              width="220px"
              height="48px"
              type="button"
              text="Add Product"
              Icon={<AddIcon />}
              color="#10B981"
              hoverColor="#059669"
              radius="12px"
            />
          </div>
        </div>
      )}

      {/* Selected Products Display */}
      {data.items && data.items.length !== 0 ? (
        <div className="selected-products-container">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-green-400 to-emerald-600 rounded-full"></div>
              Selected Products
            </h4>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg">
                {data.items.length}
              </div>
            </div>
          </div>
          <div className="selectedproduct w-full overflow-y-auto overflow-x-auto max-h-[60vh] flex flex-row justify-start items-start gap-x-6 gap-y-6 p-4 bg-gradient-to-b from-gray-800/50 to-transparent rounded-xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {data.items.map(
              (item, idx) =>
                item.item && (
                  <Bannercard
                    key={item.item.id}
                    id={item.item.id ?? 0}
                    image={item.item.image?.url ?? ""}
                    onClick={handleClick}
                    isAdd={false}
                    idx={idx + 1}
                    onDelete={handleDelete}
                    typesize="small"
                    style={{ width: "200px", height: "200px" }}
                    name={item.item.name}
                    preview
                  />
                )
            )}
          </div>
        </div>
      ) : data.scrollabletype === "custom" ? (
        <div className="empty-state w-full py-16 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border-2 border-dashed border-gray-600 hover:border-green-500/50 transition-all duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No products selected
            </h3>
            <p className="text-sm text-gray-400 max-w-md">
              Click the "Add Product" button above to start adding products to
              your container
            </p>
          </div>
        </div>
      ) : (
        <div className="auto-populate-info w-full p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-400/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white mb-2">
                Automatic Product Selection
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                Products will be automatically populated based on your selected
                template type.
                {data.scrollabletype === "new" &&
                  " The latest products will be displayed in chronological order."}
                {data.scrollabletype === "popular" &&
                  " Products will be ranked by sales within the specified date range."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const ContainerTypeContainer = memo(function ContainerTypeContainer({
  type,
  onClick,
  Icon,
}: {
  type: string;
  Icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      key={type}
      onClick={onClick}
      className="w-[320px] h-[280px] 
      max-smallest_phone:w-full
      rounded-2xl flex flex-col justify-start items-center bg-gradient-to-br from-white to-gray-100 text-gray-800
      transition-all duration-500 cursor-pointer
      hover:scale-105 hover:shadow-2xl hover:from-blue-500 hover:to-blue-600 hover:text-white
      active:scale-95
      border-2 border-gray-200 hover:border-blue-400
      shadow-lg group"
    >
      <h3 className="text-xl font-bold w-[90%] h-[35%] text-left flex items-center px-4 group-hover:scale-105 transition-transform duration-300">
        {type}
      </h3>
      <div className="icon h-[65%] flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
        {Icon}
      </div>
    </div>
  );
});

const containerTypes = [
  {
    type: "Slide Show",
    value: containertype[0].value,
    icon: <SlideShowIcon />,
  },
  {
    type: "Scrollable Container",
    value: containertype[1].value,
    icon: <ScrollableConIcon />,
  },
  {
    type: "Categories",
    value: containertype[2].value,
    icon: <CategoriesIcon />,
  },
  {
    type: "Banner",
    value: containertype[3].value,
    icon: <BannerIcon />,
  },
];

const ContainerTypeSelection = memo(function ContainerTypeSelection({
  onClick,
}: {
  onClick: (type: string) => void;
}) {
  return (
    <div
      className={`w-full h-full grid grid-cols-2 max-large_tablet:grid-cols-1 gap-y-12 gap-x-8 pb-5 place-items-center`}
    >
      {containerTypes.map((type, idx) => (
        <ContainerTypeContainer
          onClick={() => onClick(type.value)}
          key={idx}
          Icon={type.icon}
          type={type.type}
        />
      ))}
    </div>
  );
});

const HomecontainerdataInitialize: Containertype = {
  type: "",
  idx: 0,
  name: "",
  items: [],
  scrollabletype: "custom",
};

const Homecontainermodal = ({
  setprofile,
  isPhone,
}: HomeContainerModalProps) => {
  const [data, setdata] = useState<Containertype>(HomecontainerdataInitialize);
  const { isMobile } = useScreenSize();

  const [loading, setloading] = useState(false);
  const { openmodal, setopenmodal, globalindex, setglobalindex } =
    useGlobalContext();

  const handleType = useCallback((type: string) => {
    setdata((prev) => ({
      ...prev,
      name: "",
      idx: 0,
      item: [],
      type: type as ContainerType,
    }));
  }, []);

  // Optimized edit data fetching with proper error handling
  useEffectOnce(() => {
    if (globalindex.homeeditindex && globalindex.homeeditindex !== -1) {
      const fetcheditdetail = async () => {
        setloading(true);
        try {
          const url = `/api/home?id=${globalindex.homeeditindex}`;
          const response = await ApiRequest(url, undefined, "GET");

          if (response.success) {
            setdata(response.data);
          } else {
            errorToast("Failed to load container data");
          }
        } catch (error: any) {
          errorToast(error?.message ?? "Error loading data");
        } finally {
          setloading(false);
        }
      };
      fetcheditdetail();
    }
  });

  const handleCancel = useCallback(() => {
    let updatedata = { ...data };
    if (openmodal?.Addbanner || openmodal?.Addproduct) {
      const key = openmodal?.Addbanner ? "Addbanner" : "Addproduct";
      updatedata.items = [];
      setopenmodal({ ...openmodal, [key]: false });
      return;
    }

    if (globalindex.homeeditindex && globalindex.homeeditindex !== -1) {
      setglobalindex((prev) => ({ ...prev, homeeditindex: undefined }));
      setprofile(true);

      setopenmodal({ ...openmodal, homecontainer: false });
      return;
    }

    if (data.type !== "") {
      setdata(HomecontainerdataInitialize);
      return;
    }
    setdata(updatedata);
    setprofile(true);
    setopenmodal((prev) => ({ ...prev, editHome: true }));
    setopenmodal({ ...openmodal, homecontainer: false });
  }, [
    data,
    openmodal,
    globalindex.homeeditindex,
    setopenmodal,
    setglobalindex,
    setprofile,
  ]);

  const handleCreateAndUpdateContainer = useCallback(async () => {
    if (openmodal?.Addbanner) {
      setopenmodal({ ...openmodal, Addbanner: false });
      return;
    }

    if (data.type === "scrollable") {
      if (data.name.length === 0) {
        errorToast("Please enter the name");
        return;
      }
    }

    if (data.items.length === 0 && !data.scrollabletype) {
      errorToast(
        `Please Add ${data.type === "scrollable" ? "Product" : "Banner"}`
      );

      return;
    }

    setloading(true);

    try {
      let request;

      if (!globalindex.homeeditindex || globalindex.homeeditindex === -1) {
        // Create container
        const create = CreateContainer.bind(null, {
          ...data,
          items: [],
          item: data.items.map((i) => i.item?.id ?? 0),
          scrollabletype:
            data.type === "scrollable" ? data.scrollabletype : undefined,
        });
        request = await create();
      } else {
        // Update container

        request = await ApiRequest("/api/home", undefined, "PUT", "JSON", {
          ...data,
          items: data.items.map((i) => ({
            ...i,
            item: undefined,
            item_id: i.item?.id,
          })),
        });
      }

      if (!request.success) {
        throw new Error(request.message);
      }

      successToast(request.message as string);
      if (globalindex.homeeditindex) {
        setglobalindex((prev) => ({ ...prev, homeeditindex: undefined }));
      }
      setdata(HomecontainerdataInitialize);
    } catch (error: any) {
      errorToast(error?.message ?? "Error occurred");
    } finally {
      setloading(false);
    }
  }, [
    data,
    openmodal,
    globalindex.homeeditindex,
    setopenmodal,
    setglobalindex,
  ]);

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setdata((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const headerTitle = useMemo(() => {
    if (openmodal["Addbanner"]) {
      return data.type !== "scrollable" ? "Add Banner" : "";
    }
    if (openmodal["Addproduct"]) {
      return "Add Product";
    }
    if (data.type === "slide") return "Create Slide";
    if (data.type === "category") return "Create Category";
    if (data.type === "scrollable") return "Create Scrollable Container";
    if (data.type === "banner") return "Create Banner";
    return "Choose Type";
  }, [openmodal, data.type]);

  return (
    <>
      {openmodal.createBanner && <BannerModal />}
      <SecondaryModal
        size="5xl"
        open={openmodal["homecontainer"] as boolean}
        onPageChange={(val) => {
          if (globalindex.homeeditindex) {
            setglobalindex((prev) => ({ ...prev, homeeditindex: undefined }));
          }
          setopenmodal((prev) => ({ ...prev, homecontainer: val }));
        }}
        placement={isMobile ? "top" : "center"}
        style={{ backgroundColor: "#1F2937" }}
        header={() => (
          <div className="title w-fit flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full"></div>
            <p className="text-2xl font-bold text-white">{headerTitle}</p>
          </div>
        )}
      >
        <div className="w-full h-fit relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 text-white rounded-2xl flex flex-col items-center overflow-y-auto overflow-x-hidden shadow-2xl">
          {loading && (
            <div className="absolute inset-0 z-50">
              <ContainerLoading />
            </div>
          )}
          <div className="w-full h-fit max-h-[70vh] overflow-x-hidden overflow-y-auto flex flex-col items-center gap-y-6 pt-4 px-4">
            {data.type === "" ? (
              <div className="w-full h-fit max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide mb-5">
                <ContainerTypeSelection onClick={handleType} />
              </div>
            ) : openmodal["Addbanner"] || openmodal["Addproduct"] ? (
              <AddBannerContainer
                data={data}
                setdata={setdata}
                singleselect={data.type === "banner"}
              />
            ) : (
              <>
                <div className="w-full h-fit flex flex-col gap-y-3">
                  <p className="text-base font-semibold text-gray-100">
                    Container Name
                  </p>
                  <TextInput
                    onChange={handleNameChange}
                    name="name"
                    value={data.name}
                    style={{ height: "48px", color: "black" }}
                    placeholder="Enter container name..."
                  />
                </div>

                {data.type === "slide" ||
                data.type === "category" ||
                data.type === "banner" ? (
                  <CreateContainerType data={data} setdata={setdata} />
                ) : (
                  <ScrollableContainerModal data={data} setdata={setdata} />
                )}
              </>
            )}
          </div>

          <div className="btn w-full h-[70px] max-smallest_phone:gap-x-2 px-6 py-4 flex flex-row gap-x-4 justify-end items-center border-t-2 border-gray-600 bg-gradient-to-r from-gray-800 to-gray-900">
            {openmodal["Addbanner"] && (
              <PrimaryButton
                type="button"
                text="Add New"
                width="160px"
                radius="12px"
                height="44px"
                color="#10B981"
                hoverColor="#059669"
                onClick={() =>
                  setopenmodal((prev) => ({
                    ...prev,
                    Addbanner: false,
                    createBanner: true,
                  }))
                }
              />
            )}

            {(openmodal["Addproduct"] ? data.type !== "scrollable" : true) && (
              <PrimaryButton
                text={
                  openmodal["Addbanner"] || openmodal["Addproduct"]
                    ? "Confirm"
                    : globalindex.homeeditindex &&
                      globalindex.homeeditindex !== -1
                    ? "Update"
                    : "Create"
                }
                width={isPhone ? "50%" : "180px"}
                radius="12px"
                height="44px"
                type="button"
                onClick={handleCreateAndUpdateContainer}
                color="#3B82F6"
                hoverColor="#2563EB"
                status={loading ? "loading" : "authenticated"}
              />
            )}
            <PrimaryButton
              text="Cancel"
              radius="12px"
              height="44px"
              width={isPhone ? "50%" : "180px"}
              type="button"
              color="#EF4444"
              hoverColor="#DC2626"
              onClick={handleCancel}
            />
          </div>
        </div>
      </SecondaryModal>
    </>
  );
};

export default Homecontainermodal;

//Add Banner Container
const Bannercard = memo(function Bannercard({
  isAdd,
  image,
  id,
  idx,
  isAdded,
  onClick,
  onDelete,
  typesize,
  name,
  preview,
  style,
}: {
  id: number;
  idx: number;
  style?: CSSProperties;
  image: string;
  isAdd: boolean;
  isAdded?: boolean;
  onClick?: (id: number) => void;
  onDelete?: (id: number) => void;
  typesize?: "normal" | "small";
  name?: string;
  preview?: boolean;
}) {
  const handleClick = useCallback(() => {
    if (!preview && onClick) onClick(id);
  }, [preview, onClick, id]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) onDelete(id);
    },
    [onDelete, id]
  );

  const isClickable = !preview && onClick;

  return (
    <div
      key={id}
      style={style ? style : {}}
      onClick={handleClick}
      className={`relative w-fit h-fit flex flex-col transition-all duration-300 rounded-2xl overflow-hidden group shadow-lg ${
        isClickable
          ? "cursor-pointer hover:-translate-y-3 hover:shadow-2xl hover:scale-105"
          : "shadow-md"
      } ${
        isAdded
          ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-gray-800"
          : "bg-white hover:ring-2 hover:ring-blue-300"
      }`}
    >
      <div className="relative overflow-hidden">
        <Image
          src={image}
          alt="cover"
          width={500}
          height={500}
          style={
            style
              ? style
              : typesize === "normal"
              ? { width: "400px", height: "250px" }
              : {}
          }
          className={`bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 transition-transform duration-500 ${
            isClickable ? "group-hover:scale-110" : ""
          } ${
            typesize === "small"
              ? "w-[300px] h-[400px] max-smallest_phone:w-[275px] max-smallest_phone:h-[350px] object-contain"
              : "h-[250px] object-cover object-center"
          }`}
        />
        {/* Overlay on hover for clickable cards */}
        {isClickable && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        {/* Click hint for non-added items */}
        {isClickable && !isAdded && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-xl flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Click to Add
            </div>
          </div>
        )}
      </div>

      {isAdded && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="w-[36px] h-[36px] text-white bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center font-bold text-sm shadow-2xl ring-4 ring-white animate-pulse">
            {idx}
          </span>
          <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Selected
          </div>
        </div>
      )}

      {name && (
        <div className="p-4 bg-white">
          <p className="text-sm font-semibold w-fit max-w-[280px] h-fit break-words text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
            {name}
          </p>
        </div>
      )}
      {!isAdd && (
        <PrimaryButton
          radius="0 0 12px 12px"
          type="button"
          text="Delete"
          width="100%"
          height="40px"
          onClick={handleDelete}
          textsize="14px"
          color="#EF4444"
          hoverColor="#DC2626"
        />
      )}
    </div>
  );
});

const AddProductType = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Filter",
    value: "filter",
  },
];

// Memoized skeleton loader component for better performance
const OptimizedBannerSkeleton = memo(function OptimizedBannerSkeleton() {
  return <BannerSkeleton />;
});

// Memoized grid skeleton loader
const BannerGridSkeleton = memo(function BannerGridSkeleton({
  count,
}: {
  count: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <OptimizedBannerSkeleton key={`skeleton-${idx}`} />
      ))}
    </>
  );
});

const AddBannerContainer = memo(function AddBannerContainer({
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
  }>({
    parent: [],
  });

  const [filter, setfilter] = useState({
    q: "",
    ty: AddProductType[0].value,
    limit: 3,
    parentcate: undefined,
    subcate: undefined,
  });

  // Optimized data fetching with proper cleanup and debounce
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

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
        console.error("Failed to fetch data:", error);
      } finally {
        if (isMounted) {
          setloading(false);
        }
      }
    };

    // Debounce search queries
    const timeoutId = setTimeout(
      () => {
        fetchdata();
      },
      filter.q ? 300 : 0
    );

    return () => {
      isMounted = false;
      abortController.abort();
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

  // Optimized category fetching with caching
  useEffect(() => {
    let isMounted = true;

    if (isFilter && cate.parent.length === 0) {
      const getCategories = async () => {
        setloading(true);
        try {
          const parentcategories = await ApiRequest(
            "/api/categories/select?ty=parent",
            undefined,
            "GET"
          );

          if (parentcategories.success && isMounted) {
            setcate((prev) => ({ ...prev, parent: parentcategories.data }));
          }
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        } finally {
          if (isMounted) {
            setloading(false);
          }
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
      setdata((prev) => {
        const updatedata = { ...prev };
        const item = banners.find((banner) => banner.id === id);

        if (!item) {
          return prev;
        }

        if (singleselect) {
          updatedata.items = [];
        }

        const itemIndex = updatedata.items.findIndex(
          (item) => item.item?.id === id
        );

        if (itemIndex !== -1) {
          updatedata.items.splice(itemIndex, 1);
        } else {
          updatedata.items.push({
            item: {
              id: item.id,
              name: item.name,
              type: item.type,
              image: item.image,
            },
          });
        }

        return updatedata;
      });
    },
    [banners, singleselect, setdata]
  );

  const handleSelect = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = event.target;

      //fetch subcategories
      if (name === "parentcate") {
        setfilter(
          (prev) => ({ ...prev, parentcate: value, subcate: "" } as any)
        );

        if (value) {
          setloading(true);
          try {
            const childcategories = await ApiRequest(
              `/api/categories/select?ty=child&pid=${value}`,
              undefined,
              "GET"
            );

            if (childcategories.success) {
              setcate((prev) => ({ ...prev, sub: childcategories.data }));
            }
          } catch (error) {
            console.error("Failed to fetch subcategories:", error);
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
    []
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
    [setdata]
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
      {/* Action Bar */}
      {!isFilter ? (
        <div className="w-full p-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-xl flex flex-row gap-x-3 items-center flex-wrap gap-y-3 shadow-lg border border-gray-600">
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
            <div className="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2">
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
        <div className="filtercontainer w-full h-fit p-6 border-2 rounded-2xl border-blue-400 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col justify-center gap-y-5 relative shadow-2xl">
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
        } overflow-y-auto overflow-x-hidden grid grid-cols-2 max-smallest_tablet:grid-cols-1 gap-x-6 gap-y-8 place-items-center z-0 p-4 bg-gradient-to-b from-gray-800/30 to-transparent rounded-xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800`}
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
