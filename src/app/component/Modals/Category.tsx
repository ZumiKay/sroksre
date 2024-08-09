"use client";
import {
  CateogoryInitailizestate,
  CateogoryState,
  SelectType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import React, { useEffect, useState } from "react";
import { errorToast, LoadingText, successToast } from "../Loading";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { motion } from "framer-motion";
import Modal from "../Modals";
import { AddSubCategoryMenu } from "../ToggleMenu";
import PrimaryButton from "../Button";
import { SelectionCustom } from "../Pagination_Component";
import { Categorytype } from "../../api/categories/route";
import { DateRangePicker, Input } from "@nextui-org/react";
import { parseDate } from "@internationalized/date";
import { SelectAndSearchProduct } from "../Banner";

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

const getPromotionSelection = async (search: string, limit: number = 5) => {
  const url = `/api/promotion?ty=selection&lt${limit}`;
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
  const {
    openmodal,
    setopenmodal,
    category,
    setcategory,
    allData,
    setalldata,
  } = useGlobalContext();
  const [show, setshow] = useState<"Create" | "Edit">("Create");

  const [loading, setloading] = useState(false);
  const [catetype, setcatetype] = useState<Categorytype>("normal");

  const handleAdd = async () => {
    const isExist = allData.category?.some((obj) => obj.name === category.name);
    if (isExist) {
      errorToast("Category Existed");
      return;
    }

    setloading(true);

    //Save To DB
    const saved = await ApiRequest(
      "/api/categories",
      undefined,
      "POST",
      "JSON",
      { ...category, type: catetype }
    );
    setloading(false);
    if (!saved.success) {
      errorToast("Failed To Create");
      return;
    }
    setalldata((prev) => ({
      ...prev,
      category: [...(prev.category ?? []), { ...category, id: saved.data.id }],
    }));
    setcategory(CateogoryInitailizestate);

    successToast("Category Created");
  };
  const handleCancel = () => {
    setalldata((prev) => ({ ...prev, category: [] }));
    setcategory(CateogoryInitailizestate);
    setopenmodal((prev) => ({ ...prev, createCategory: false }));
  };
  const handleNavbar = (show: "Create" | "Edit") => {
    setshow(show);
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
    setcategory(CateogoryInitailizestate);
  };

  const handleSelectPromotion = (value: Array<SelectType>) => {
    const categories = { ...category };
    categories.subcategories = value.map((i) => ({
      name: i.label,
      type: "promo",
      pid: i.value as number,
    }));

    setcategory(categories);
  };

  //category navbar

  const CategoryNavBar = () => {
    return (
      <div className="category__navbar w-[80%] h-[50px] flex flex-row items-center">
        <h3
          onClick={() => handleNavbar("Create")}
          className="category_header w-[50%] text-center text-lg font-semibold transition hover:-translate-y-1 cursor-pointer"
          style={show === "Create" ? { borderBottom: "3px solid #495464" } : {}}
        >
          Create
        </h3>
        <h3
          onClick={() => handleNavbar("Edit")}
          className="category_header w-[50%] text-center text-lg font-semibold transition hover:-translate-y-1 cursor-pointer"
          style={show === "Edit" ? { borderBottom: "3px solid #495464" } : {}}
        >
          Edit
        </h3>
      </div>
    );
  };

  return (
    <Modal closestate="createCategory" customheight="600px" customZIndex={150}>
      <motion.div
        initial={{ y: 1000 }}
        animate={{ y: 0 }}
        exit={{ y: -1000 }}
        className="category relative rounded-md p-2 w-full min-h-[600px] max-h-[700px] flex flex-col items-center bg-white gap-y-5"
      >
        <CategoryNavBar />
        {show === "Create" ? (
          <>
            <div className="w-[80%] h-fit">
              <SelectionCustom
                value={catetype}
                setvalue={setcatetype as any}
                data={selecttype}
                label="Type"
                placeholder="Type"
              />
            </div>
            <div className="w-[80%] h-fit flex flex-col gap-y-5">
              <Input
                type="text"
                variant="bordered"
                label="Name"
                onChange={(e) =>
                  setcategory((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              {catetype === "sale" && (
                <SelectAndSearchProduct
                  getdata={(take, value) => getPromotionSelection(value, take)}
                  placeholder="Select Promotion"
                  value={category.subcategories.map((sub) => ({
                    label: sub.name,
                    value: sub.id ?? 0,
                  }))}
                  onSelect={(value) =>
                    handleSelectPromotion(value as Array<SelectType>)
                  }
                />
              )}

              {catetype === "popular" && (
                <DateRangePicker
                  value={
                    category.daterange
                      ? {
                          start: parseDate(category.daterange.start),
                          end: parseDate(category.daterange.end),
                        }
                      : undefined
                  }
                  onChange={(val) =>
                    setcategory((prev) => ({
                      ...prev,
                      daterange: {
                        start: val.start.toString(),
                        end: val.end.toString(),
                      },
                    }))
                  }
                  label="Range of Date"
                  className="w-full"
                />
              )}
            </div>

            {catetype === "normal" &&
              (openmodal.addsubcategory ? (
                <div className="w-[80%] max-h-[500px]">
                  <AddSubCategoryMenu index={-1} />
                </div>
              ) : (
                <PrimaryButton
                  width="80%"
                  height="50px"
                  radius="10px"
                  onClick={() =>
                    category.name.length > 0 &&
                    setopenmodal((prev) => ({ ...prev, addsubcategory: true }))
                  }
                  text={
                    category.subcategories.length > 0
                      ? "Open Subcategory"
                      : "Add Subcategory"
                  }
                  type="button"
                  disable={category.name.length === 0}
                />
              ))}
            <div className="flex flex-row justify-start gap-x-5 h-[40px] w-[90%] absolute bottom-5">
              <PrimaryButton
                width="100%"
                height="100%"
                radius="10px"
                onClick={() => category.name.length > 0 && handleAdd()}
                text="Create"
                status={loading ? "loading" : "authenticated"}
                color="#35C191"
                type="button"
                disable={category.name.length === 0}
              />
              <PrimaryButton
                width="100%"
                height="100%"
                radius="10px"
                text="Cancel"
                onClick={() => handleCancel()}
                color="lightcoral"
                type="button"
              />{" "}
            </div>
          </>
        ) : (
          <EditCategory loading={loading} setloading={setloading} />
        )}
      </motion.div>
    </Modal>
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

  //API Request

  useEffect(() => {
    const fetchAllCate = async () => {
      const request = async () => {
        const res = await ApiRequest(URL, undefined, "GET");
        if (res.success) {
          setalldata((prev) => ({ ...prev, category: res.data }));
        }
      };
      await Delayloading(request, setloading, 1000);
    };
    fetchAllCate();
  }, []);

  /////

  const handleClick = (index: number) => {
    setedit(!edit);
    seteditindex(index);

    if (allData.category) {
      setcategory(allData.category[index]);
    }
  };
  const handleDelete = async () => {
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
      handleReset();
      errorToast(deleterequest.error as string);
    }
  };

  const handleConfirm = async () => {
    if (category.name.length === 0) {
      errorToast("Name is requried");
      return;
    }

    const updateReq = async () => {
      const updateRequest = async () => {
        const res = await ApiRequest(URL, undefined, "PUT", "JSON", category);
        if (res.success) {
          let allcate = [...(allData.category ?? [])];

          allcate[editindex].name = category.name;
          allcate[editindex].subcategories = category.subcategories;
          setalldata((prev) => ({ ...prev, category: allcate }));
          setedit(false);
          seteditindex(-1);
          successToast("Category Updated");
        } else {
          errorToast("Failed To Update");
        }
      };

      await Delayloading(updateRequest, setloading, 1000);
    };
    await updateReq();
  };
  const handleReset = () => {
    let deletedcate = [...tempcate];
    let allcate = [...(allData.category ?? [])];
    const resetcate = deletedcate.filter((obj) =>
      globalindex.categoryeditindex.includes(obj.id as number)
    );
    resetcate.forEach((obj) => allcate.push(obj));
    setalldata((prev) => ({ ...prev, category: allcate }));
    settempcate([]);
    setglobalindex((prev) => ({ ...prev, categoryeditindex: [] }));
  };

  const handleSelectPromotion = (value: Array<SelectType>) => {
    const categories = { ...category };
    categories.subcategories = value.map((i) => ({
      name: i.label,
      type: "promo",
      pid: i.value as number,
    }));

    setcategory(categories);
  };

  return (
    <>
      <div className="EditCategory w-[90%] h-full overflow-y-auto overflow-x-hidden  flex flex-col gap-y-5 p-1">
        {!edit ? (
          <>
            {loading ? (
              <LoadingText style={{ left: "45%" }} />
            ) : (
              allData.category?.length === 0 && (
                <h1 className="text-lg text-red-400 font-bold text-center">
                  No Category
                </h1>
              )
            )}
            {allData.category?.map((obj, idx) => (
              <motion.div
                key={idx}
                initial={{ x: "-120%" }}
                animate={{ x: 0 }}
                transition={{
                  duration: 0.2,
                }}
                className="parentcategory w-full bg-white outline outline-2 outline-black outline-offset-1 h-fit min-h-[50px] rounded-lg flex flex-row items-center gap-x-5"
              >
                <p
                  onClick={() => handleClick(idx)}
                  className="parentcateogry text-xl transition duration-300 hover:text-white font-bold w-full h-full break-all flex items-center justify-center cursor-pointer text-center rounded-lg "
                >
                  {obj.name}
                </p>
                <p
                  onClick={() => {
                    let categorydeleteindex = [
                      ...globalindex.categoryeditindex,
                    ];
                    let allcate = [...(allData.category ?? [])];
                    let copytemp = [...tempcate];
                    copytemp.push(allcate[idx]);
                    allcate.splice(idx, 1);

                    setalldata((prev) => ({ ...prev, category: allcate }));
                    settempcate(copytemp);

                    categorydeleteindex.push(obj.id as number);
                    setglobalindex((prev) => ({
                      ...prev,
                      categoryeditindex: categorydeleteindex,
                    }));
                  }}
                  className="actions text-red-500 font-bold text-lg cursor-pointer w-1/2 h-full transition duration-300 rounded-lg  flex items-center justify-center hover:text-white active:text-white"
                >
                  {" "}
                  Delete
                </p>
              </motion.div>
            ))}{" "}
          </>
        ) : (
          <div className="editcontainer flex flex-col gap-y-3 w-full h-full bg-white p-2 relative items-center">
            <input
              type="text"
              onChange={(e) =>
                setcategory((prev) => ({ ...prev, name: e.target.value }))
              }
              value={category.name}
              className="subcate_name w-full h-[50px] border border-gray-300 pl-3 text-lg font-bold"
              placeholder="Parent Cateogory Name"
            />

            {category.type === "sale" && (
              <SelectAndSearchProduct
                getdata={(take, value) => getPromotionSelection(value, take)}
                placeholder="Select Promotion"
                value={category.subcategories.map((sub) => ({
                  label: sub.name,
                  value: sub.id ?? 0,
                }))}
                onSelect={(value) =>
                  handleSelectPromotion(value as Array<SelectType>)
                }
              />
            )}
            {category.type === "normal" && (
              <AddSubCategoryMenu index={editindex} />
            )}

            {category.type === "popular" && (
              <DateRangePicker
                value={
                  category.daterange
                    ? {
                        start: parseDate(category.daterange.start),
                        end: parseDate(category.daterange.end),
                      }
                    : undefined
                }
                onChange={(val) =>
                  setcategory((prev) => ({
                    ...prev,
                    daterange: {
                      start: val.start.toString(),
                      end: val.end.toString(),
                    },
                  }))
                }
                label="Range of Date"
                className="w-full"
              />
            )}
            <div className="w-[90%] h-fit flex flex-row gap-x-5 justify-center absolute bottom-0">
              <PrimaryButton
                type="button"
                text="Confirm"
                onClick={() => handleConfirm()}
                width="100%"
                height="40px"
                radius="10px"
                status={loading ? "loading" : "authenticated"}
              />
              <PrimaryButton
                type="button"
                text="Back"
                onClick={() => {
                  setedit(false);
                  setcategory(CateogoryInitailizestate);
                }}
                width="100%"
                color="lightpink"
                height="40px"
                radius="10px"
              />
            </div>
          </div>
        )}
      </div>
      {globalindex.categoryeditindex.length > 0 && (
        <div className="flex flex-row gap-x-5 w-full h-fit">
          <PrimaryButton
            type="button"
            text="Confirm"
            onClick={() => handleDelete()}
            status={loading ? "loading" : "authenticated"}
            width="100%"
            height="40px"
            radius="10px"
          />
          <PrimaryButton
            type="button"
            text="Reset"
            onClick={() => {
              handleReset();
            }}
            width="100%"
            disable={globalindex.categoryeditindex.length === 0}
            color="lightcoral"
            height="40px"
            radius="10px"
          />
        </div>
      )}
    </>
  );
};