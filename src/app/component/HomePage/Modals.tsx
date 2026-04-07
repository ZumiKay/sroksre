"use client";

import { ChangeEvent, useState, useCallback, useMemo, useEffect } from "react";
import React from "react";
import PrimaryButton from "../Button";
import { TextInput } from "../FormComponent";
import { SecondaryModal } from "../Modals";
import {
  ContainerType,
  Containertype,
  CreateContainer,
} from "../../severactions/containeraction";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  ApiRequest,
  useEffectOnce,
  useScreenSize,
} from "@/src/context/CustomHook";
import { ContainerLoading, errorToast, successToast } from "../Loading";
import { BannerModal } from "../Modals/Banner";
import { CreateContainerType } from "./modals/CreateContainerType";
import { ScrollableContainerModal } from "./modals/ScrollableContainerModal";
import { ContainerTypeSelection } from "./modals/ContainerTypeSelection";
import { AddBannerContainer } from "./modals/AddBannerContainer";

interface HomeContainerModalProps {
  setprofile: any;
  isPhone: boolean;
}

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

  useEffect(() => {
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
  }, []);

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
        `Please Add ${data.type === "scrollable" ? "Product" : "Banner"}`,
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
            <div className="w-1.5 h-8 bg-linear-to-b from-blue-400 to-purple-600 rounded-full"></div>
            <p className="text-2xl font-bold text-white">{headerTitle}</p>
          </div>
        )}
      >
        <div className="w-full h-fit relative bg-linear-to-br from-gray-800 via-gray-700 to-gray-800 text-white rounded-2xl flex flex-col items-center overflow-y-auto overflow-x-hidden shadow-2xl">
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
                    style={{ height: "48px", color: "white" }}
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

          <div className="btn w-full h-17.5 max-smallest_phone:gap-x-2 px-6 py-4 flex flex-row gap-x-4 justify-end items-center border-t-2 border-gray-600 bg-linear-to-r from-gray-800 to-gray-900">
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
