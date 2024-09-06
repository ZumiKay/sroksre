"use client";

import {
  ChangeEvent,
  CSSProperties,
  ReactNode,
  useEffect,
  useState,
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
import { SelectType, useGlobalContext } from "@/src/context/GlobalContext";
import React from "react";
import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
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
import { DateRangePicker } from "@nextui-org/react";
import { BannerSkeleton } from "./Component";
import { ContainerLoading, errorToast, successToast } from "../Loading";
import { BannerModal } from "../Modals/Banner";
import { parseDate } from "@internationalized/date";

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

const CreateContainerType = ({
  data,
  setdata,
}: {
  data: Containertype;
  setdata: React.Dispatch<React.SetStateAction<Containertype>>;
}) => {
  const { setopenmodal } = useGlobalContext();

  const handleDelete = (id: number) => {
    const updatedata = { ...data };
    updatedata.items = updatedata.items.filter((item) => item.item?.id !== id);
    setdata(updatedata);
  };
  return (
    <div className="slideshow w-full h-fit flex flex-col gap-y-5 max-small_phone:w-[90vw]">
      <PrimaryButton
        onClick={() => setopenmodal((prev) => ({ ...prev, Addbanner: true }))}
        width="200px"
        height="40px"
        type="button"
        text="Add Banner"
        Icon={<AddIcon />}
        color="#4688A0"
        radius="10px"
      />
      <div className="selected-slides w-full h-[58vh] overflow-y-auto grid grid-cols-2 gap-5 place-items-center">
        {data.items.map(
          (item, idx) =>
            item.item && (
              <Bannercard
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
  );
};

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

const ScrollableContainerModal = ({
  data,
  setdata,
}: {
  data: Containertype;
  setdata: React.Dispatch<React.SetStateAction<Containertype>>;
}) => {
  const { setopenmodal } = useGlobalContext();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setdata((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClick = (id: number) => {
    const updatedata = { ...data };
    const bannerIndex = data.items.findIndex((item) => item.item?.id === id);
    if (bannerIndex === -1) {
      return;
    }
    updatedata.items = data.items.filter((item) => item.item?.id !== id);
    setdata(updatedata);
  };

  const handleDelete = (id: number) => {
    const updatedata = { ...data };
    updatedata.items = updatedata.items.filter((item) => item.item?.id !== id);
    setdata(updatedata);
  };

  return (
    <div className="w-full h-full flex flex-col gap-y-5">
      <div className="w-full h-fit flex flex-row items-center max-small_phone:flex-col gap-5">
        <div className="w-full h-fit flex flex-col gap-y-5">
          <h3 className="text-lg font-bold">Type</h3>
          <Selection
            onChange={(e) =>
              setdata((prev) => ({
                ...prev,
                amountofitem: undefined,
                daterange: undefined,
                item: [],
                scrollabletype: e.target.value as any,
              }))
            }
            style={{ color: "black" }}
            value={data.scrollabletype}
            data={ScrollableTemplate}
          />
        </div>
        {data.scrollabletype !== "custom" && (
          <div className="w-full h-fit flex flex-col gap-y-5">
            <h3 className="text-lg font-bold">Amount of Items</h3>
            <TextInput
              value={data.amountofitem}
              type="number"
              name="amountofitem"
              placeholder="Amount"
              style={{ height: "40px", color: "black" }}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {data.scrollabletype === "popular" && (
        <div className="w-full h-fit flex flex-col gap-y-5">
          <h3 className="text-lg font-bold">Range of Date</h3>
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
            onChange={(date) => {
              setdata((prev) => ({
                ...prev,
                daterange: {
                  start: date.start.toString(),
                  end: date.end.toString(),
                },
              }));
            }}
            className="max-w-xs"
          />
        </div>
      )}

      {data.scrollabletype !== "new" && data.scrollabletype !== "popular" && (
        <PrimaryButton
          onClick={() => setopenmodal((prev) => ({ ...prev, Addbanner: true }))}
          width="200px"
          height="40px"
          type="button"
          text="Add Product"
          Icon={<AddIcon />}
          color="#4688A0"
          radius="10px"
        />
      )}

      {data.items && data.items.length !== 0 && (
        <h3 className="text-xl font-bold">Items: </h3>
      )}

      <div
        className="selectedproduct w-full overflow-y-auto
       max-sm:grid-cols-1
       h-[40vh] grid grid-cols-2 gap-x-5 gap-y-24 place-items-center"
      >
        {data.items.map(
          (item, idx) =>
            item.item && (
              <Bannercard
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
  );
};

const ContainerTypeContainer = ({
  type,
  onClick,
  Icon,
}: {
  type: string;
  Icon: ReactNode;
  onClick: () => void;
}) => {
  return (
    <div
      key={type}
      onClick={() => onClick()}
      className="w-[300px] h-[250px] 
      max-smallest_phone:w-full
      rounded-lg flex flex-col justify-start items-center bg-white text-black 
      transition-all duration-1000 active:pl-2 active:text-white 
      active:bg-gray-500 hover:pl-2 hover:text-white hover:bg-gray-500"
    >
      <h3 className="text-lg font-bold w-[90%] h-[40%] text-left">{type}</h3>
      <div className="icon h-full">{Icon}</div>
    </div>
  );
};

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

const ContainerTypeSelection = ({
  onClick,
}: {
  onClick: (type: string) => void;
}) => {
  return (
    <div
      className={`w-full h-full grid grid-cols-2 max-large_tablet:grid-cols-1 gap-y-10 pb-5 place-items-center`}
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
};

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

  const [loading, setloading] = useState(false);
  const { openmodal, setopenmodal, globalindex, setglobalindex } =
    useGlobalContext();

  const handleType = (type: string) => {
    setdata((prev) => ({
      ...prev,
      name: "",
      idx: 0,
      item: [],
      type: type as ContainerType,
    }));
  };

  useEffectOnce(() => {
    if (globalindex.homeeditindex && globalindex.homeeditindex !== -1) {
      const fetcheditdetail = async () => {
        setloading(true);
        const url = `/api/home?id=${globalindex.homeeditindex}`;
        const response = await ApiRequest(url, undefined, "GET");
        setloading(false);

        if (response.success) {
          setdata(response.data);
        }
      };
      fetcheditdetail();
    }
  });

  const handleCancel = () => {
    let updatedata = { ...data };
    if (openmodal?.Addbanner) {
      updatedata.items = [];
      setopenmodal({ ...openmodal, Addbanner: false });
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
  };

  const handleCreateAndUpdateContainer = async () => {
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
  };

  return (
    <>
      {openmodal.createBanner && <BannerModal />}
      <SecondaryModal
        size="5xl"
        open={openmodal["homecontainer"] as boolean}
        onPageChange={(val) =>
          setopenmodal((prev) => ({ ...prev, homecontainer: val }))
        }
        style={{ backgroundColor: "#495464" }}
        header={() => (
          <h3 className="title w-fit text-2xl font-bold text-white ">
            {openmodal["Addbanner"]
              ? data.type !== "scrollable"
                ? "Add Banner"
                : "Add Product"
              : data.type === "slide"
              ? `Create Slide`
              : data.type === "category"
              ? `Create Category`
              : data.type === "scrollable"
              ? `Create Scrollable Container`
              : data.type === "banner"
              ? `Create Banner`
              : `Choose Type`}
          </h3>
        )}
      >
        <div className="w-full  h-full relative bg-[#495464] text-white rounded-lg flex flex-col items-center overflow-y-auto overflow-x-hidden">
          {loading && <ContainerLoading />}

          <div className="w-full h-[90%] flex flex-col items-center gap-y-5 pt-2">
            {data.type === "" ? (
              <div className="w-full h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide mb-5">
                <ContainerTypeSelection onClick={(type) => handleType(type)} />
              </div>
            ) : openmodal["Addbanner"] ? (
              <AddBannerContainer
                data={data}
                setdata={setdata}
                singleselect={data.type === "banner"}
              />
            ) : (
              <>
                <div className="w-full h-fit flex flex-col gap-y-5 mt-5">
                  <h3 className="text-lg font-bold">Name</h3>
                  <TextInput
                    onChange={(e) =>
                      setdata((prev) => ({ ...prev, name: e.target.value }))
                    }
                    name="name"
                    value={data.name}
                    style={{ height: "40px", color: "black" }}
                    placeholder="Name"
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

          <div className="btn w-full h-[50px] max-smallest_phone:gap-x-2 pr-5 pt-2  flex flex-row gap-x-5 justify-end items-center border-t-4 border-white">
            {openmodal["Addbanner"] && (
              <PrimaryButton
                type="button"
                text="Add New"
                width="150px"
                radius="10px"
                height="35px"
                color="#3D788E"
                onClick={() =>
                  setopenmodal((prev) => ({
                    ...prev,
                    Addbanner: false,
                    createBanner: true,
                  }))
                }
              />
            )}

            <PrimaryButton
              text={
                openmodal["Addbanner"]
                  ? "Confirm"
                  : globalindex.homeeditindex &&
                    globalindex.homeeditindex !== -1
                  ? "Update"
                  : "Create"
              }
              width={isPhone ? "50%" : "200px"}
              radius="10px"
              height="35px"
              type="button"
              onClick={() => handleCreateAndUpdateContainer()}
              color="#438D86"
            />
            <PrimaryButton
              text="Cancel"
              radius="10px"
              height="35px"
              width={isPhone ? "50%" : "200px"}
              type="button"
              color="lightcoral"
              onClick={() => handleCancel()}
            />
          </div>
        </div>
      </SecondaryModal>
    </>
  );
};

export default Homecontainermodal;

//Add Banner Container
const Bannercard = ({
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
}) => {
  return (
    <div
      key={id}
      style={style ? style : {}}
      onClick={() => !preview && onClick && onClick(id)}
      className="relative w-fit h-fit flex flex-col transition-transform hover:-translate-y-2 active:-translate-y-2"
    >
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
        className={`h-[250px]  bg-white rounded-t-lg  ${
          typesize === "small"
            ? " w-[300px] h-[400px] max-smallest_phone:w-[275px] object-contain max-smallest_phone:h-[350px]"
            : "object-cover object-center"
        }`}
      />

      {isAdded && (
        <span className="w-[25px] h-[25px] text-white bg-blue-500 rounded-3xl p-1 grid place-content-center font-bold  absolute top-1 right-3">
          {idx}
        </span>
      )}

      {name && (
        <p className="text-lg font-normal w-fit max-w-full break-words">
          {name}
        </p>
      )}
      {!isAdd && (
        <PrimaryButton
          radius="0 0 10px 10px"
          type="button"
          text="Delete"
          width="100%"
          height="30px"
          onClick={() => onDelete && onDelete(id)}
          textsize="10px"
          color="lightcoral"
        />
      )}
    </div>
  );
};

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

function AddBannerContainer({
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

  useEffect(() => {
    const fetchdata = async () => {
      const asyncFetchData = async () => {
        const url =
          data.type === "category" ||
          data.type === "slide" ||
          data.type === "banner"
            ? `/api/home/banner?limit=${filter.limit}${
                filter.q ? `&q=${filter.q}` : ""
              }&ty=${data.type}`
            : `/api/home/product?limit=${filter.limit}${
                filter.q ? `&q=${filter.q}` : ""
              }${filter.parentcate ? `&pid=${filter.parentcate}` : ""}${
                filter.subcate ? `&cid=${filter.subcate}` : ""
              }${data.id ? `&conId=${data.id}` : ""}`;
        const request = await ApiRequest(url, undefined, "GET");

        if (request.success) {
          setbanners(request.data);
          setlimit(request.isLimit ?? false);
        }
      };
      await Delayloading(asyncFetchData, setloading, 1000);
    };
    fetchdata();
  }, [filter.q, filter.parentcate, filter.subcate, filter.limit]);

  useEffect(() => {
    if (isFilter) {
      const getCategories = async () => {
        const asyncfetchcategories = async () => {
          const parentcategories = await ApiRequest(
            "/api/categories/select?ty=parent",
            undefined,
            "GET"
          );

          if (parentcategories.success) {
            setcate((prev) => ({ ...prev, parent: parentcategories.data }));
          }
        };
        await Delayloading(asyncfetchcategories, setloading, 1000);
      };
      getCategories();
    }
  }, [isFilter]);

  const handleLoadMore = () => {
    setfilter((prev) => ({ ...prev, limit: prev.limit + 3 }));
  };

  const handleClick = (id: number) => {
    const updatedata = { ...data };
    const item = banners.find((banner) => banner.id === id);

    if (!item) {
      return;
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

    setdata(updatedata);
  };

  const handleSelect = async (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;

    //fetch subcategories
    if (name === "parentcate") {
      setfilter((prev) => ({ ...prev, parentcate: value, subcate: "" } as any));
      const fetchSubCategories = async () => {
        const asyncfetchsubcate = async () => {
          const childcategories = await ApiRequest(
            `/api/categories/select?ty=child&pid=${value}`,
            undefined,
            "GET"
          );

          if (childcategories.success) {
            setcate((prev) => ({ ...prev, sub: childcategories.data }));
          }
        };
        await Delayloading(asyncfetchsubcate, setloading, 2000);
      };
      await fetchSubCategories();
    } else {
      setfilter((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClear = (type: "select" | "filter") => {
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
  };

  return (
    <div className="addbannerContainer w-full h-fit flex flex-col items-center justify-center gap-y-5 relative">
      {!isFilter ? (
        <div className="w-full h-fit flex flex-row gap-x-5 items-center">
          <PrimaryButton
            type="button"
            text="Filter"
            color="black"
            radius="10px"
            height="30px"
            onClick={() => setisFilter(true)}
            width="100px"
          />
          {(filter.parentcate || filter.subcate) && (
            <PrimaryButton
              type="button"
              text="Clear Filter"
              color="lightcoral"
              radius="10px"
              height="30px"
              onClick={() => handleClear("filter")}
              width="100px"
            />
          )}
          {data.items.length !== 0 && (
            <PrimaryButton
              text="Clear"
              radius="10px"
              type="button"
              status={loading ? "loading" : "authenticated"}
              height="30px"
              width="100px"
              onClick={() => handleClear("select")}
              color="lightcoral"
            />
          )}
        </div>
      ) : (
        <div className="filtercontainer w-full h-fit p-3 border-2 rounded-lg border-white flex flex-col justify-center gap-y-5 mt-5 relative">
          <div
            onClick={() => setisFilter(false)}
            className="absolute w-fit h-fit top-1 right-1"
          >
            {" "}
            <CloseVector width="20px" height="20px" />{" "}
          </div>

          <div className="w-full h-fit flex flex-col gap-y-5">
            <h3 className="text-lg font-bold">Search</h3>
            <TextInput
              style={{ height: "30px", color: "black" }}
              type="text"
              placeholder="Search"
              value={filter.q}
              onChange={(e) =>
                setfilter((prev) => ({ ...prev, q: e.target.value }))
              }
            />
          </div>
          {data.type === "scrollable" && (
            <div className="w-full h-fit flex flex-row items-center gap-x-5">
              <div className="w-full h-fit flex flex-col gap-y-5">
                <h3 className="text-lg font-bold">Parent Category</h3>
                <Selection
                  name="parentcate"
                  defaultValue={""}
                  value={filter.parentcate}
                  data={cate.parent}
                  style={{ height: "40px", color: "black" }}
                  default="None"
                  onChange={handleSelect}
                />
              </div>
              {cate.sub && (
                <div className="w-full h-fit flex flex-col gap-y-5">
                  <h3 className="text-lg font-bold">Sub Category</h3>
                  <Selection
                    style={{ height: "40px", color: "black" }}
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

      <div
        className={`addbannerscroll__container w-full ${
          isFilter
            ? data.type !== "scrollable"
              ? "h-[60vh]"
              : "h-[48vh]"
            : data.type !== "scrollable"
            ? "h-[68vh]"
            : "h-[65vh]"
        } overflow-y-auto overflow-x-hidden grid grid-cols-2 max-smallest_tablet:grid-cols-1 gap-x-5 gap-y-20 place-items-center z-0 p-3`}
      >
        {/* Banner Card */}

        {loading &&
          Array.from({ length: banners.length === 0 ? 4 : banners.length }).map(
            (i, idx) => <BannerSkeleton key={idx} />
          )}

        {banners.map((banner) => (
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
        ))}
      </div>

      <div className="w-full h-[5%] flex flex-row gap-x-5 mb-2 items-start justify-center">
        {!loading && !islimit && (
          <PrimaryButton
            text="Load More"
            radius="10px"
            type="button"
            status={loading ? "loading" : "authenticated"}
            height="30px"
            width="100px"
            onClick={handleLoadMore}
            color="#35C191"
          />
        )}
      </div>
    </div>
  );
}
