"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SecondaryModal } from "../Modals";
import {
  ChangeEvent,
  JSX,
  memo,
  RefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Button,
  DateRangePicker,
  DateValue,
  Form,
  Input,
  NumberInput,
  RangeValue,
} from "@heroui/react";
import {
  ContainerItemType,
  ContainerType,
  Homeitemtype,
  ScrollableTypeValueType,
} from "@/src/context/GlobalType.type";
import {
  BannerIcon,
  CategoriesIcon,
  ScrollableConIcon,
  SlideShowIcon,
} from "../Asset";
import { ItemTypeCard } from "./Component";
import ManageContainer from "./ManageContainer";
import { AsyncSelection } from "../AsynSelection";
import { SelectionType } from "../../dashboard/inventory/inventory.type";
import { parseDate } from "@internationalized/date";
import { ApiRequest } from "@/src/context/CustomHook";
import { ContainerLoading, errorToast, successToast } from "../Loading";

const containerTypes: Array<{
  type: string;
  value: ContainerType;
  icon: () => JSX.Element;
}> = [
  {
    type: "Slide Show",
    value: "slide",
    icon: () => <SlideShowIcon />,
  },
  {
    type: "Scrollable Container",
    value: "scrollable",
    icon: () => <ScrollableConIcon />,
  },
  {
    type: "Categories",
    value: "category",
    icon: () => <CategoriesIcon />,
  },
  {
    type: "Banner",
    value: "banner",
    icon: () => <BannerIcon />,
  },
];

const ScrollableType: Array<SelectionType<ScrollableTypeValueType>> = [
  {
    label: "Popular",
    value: "popular",
  },
  {
    label: "Latest",
    value: "new",
  },
  {
    label: "Sale",
    value: "sale",
  },
  { label: "Custom", value: "custom" },
];

interface FooterContainerPropType {
  handleBack?: () => void;
  handleClose?: () => void;
  type?: ContainerType;
  ref?: RefObject<HTMLFormElement | null>;
  isLoading?: boolean;
  handleSubmit?: () => void;
}

const FooterContainer = memo(
  ({
    handleBack,
    handleClose,
    type,
    handleSubmit,
    isLoading,
  }: FooterContainerPropType) => {
    const handleClick = useCallback(
      (ty: "back" | "close") => {
        if (ty === "back" && handleBack) {
          handleBack();
        } else if (ty === "close" && handleClose) handleClose();
      },
      [handleBack, handleClose]
    );
    const handleSubmitForm = useCallback(() => {
      if (handleSubmit) handleSubmit();
    }, [handleSubmit]);

    return (
      <div className="btnSec w-full h-[40px] flex flex-row gap-x-3 justify-end">
        <Button
          onPress={() => (type ? handleSubmitForm() : handleClick("close"))}
          size="sm"
          className="text-white font-bold bg_default"
          type="button"
          isLoading={isLoading}
        >
          {type ? "Confirm" : "Next"}
        </Button>
        {type && (
          <Button
            onPress={() => handleClick("back")}
            size="sm"
            className="text-white font-bold bg-red-300"
          >
            {" "}
            Back{" "}
          </Button>
        )}
      </div>
    );
  }
);

FooterContainer.displayName = "FooterContainer";

const ManageContainerType = () => {
  const { homeContainer, sethomeContainer } = useGlobalContext();
  const handleSelectContainerType = useCallback(
    (val: ContainerType) => {
      sethomeContainer((prev) => ({ ...prev, type: val } as never));
    },
    [sethomeContainer]
  );
  return (
    <div className="w-full h-fit flex flex-row gap-5 items-center justify-center flex-wrap">
      {containerTypes.map((item) => (
        <ItemTypeCard
          key={item.type}
          Img={item.icon}
          isActive={item.value === homeContainer?.type}
          des={{
            value: item.value,
            type: item.type,
          }}
          onSelect={handleSelectContainerType}
        />
      ))}
    </div>
  );
};

const CreateHomeItemModal = ({ onClose }: { onClose?: () => void }) => {
  const {
    openmodal,
    setopenmodal,
    globalindex,
    setglobalindex,
    homeContainer,
    sethomeContainer,
  } = useGlobalContext();

  const [manageItem, setmanageItem] = useState(false);
  const [loading, setloading] = useState(false);

  const handleCloseModal = useCallback(() => {
    setopenmodal({ mangageHomeItem: false });
    if (onClose) onClose();
  }, [onClose, setopenmodal]);

  useEffect(() => {
    async function getData() {
      if (!globalindex.homeeditindex) return;
      const getReq = await ApiRequest({
        url: `/api/home?id=${globalindex.homeeditindex}&ty=normal`,
        method: "GET",
      });
      if (!getReq.success) {
        errorToast(getReq.error ?? "Error Occured");
        return;
      }
      sethomeContainer(getReq.data as Homeitemtype);
    }
    getData();
  }, [globalindex.homeeditindex]);

  const handleSelectItem = useCallback(
    (val: number) => {
      if (!homeContainer?.type) return;

      const itemExists = homeContainer.items?.some((item) =>
        item.product_id ? item.product_id === val : item.banner_id === val
      );

      let newItems: ContainerItemType[] = [];

      if (itemExists) {
        newItems =
          homeContainer.items?.filter((item) =>
            item.product_id ? item.product_id !== val : item.banner_id !== val
          ) || [];
      } else {
        const newItem: ContainerItemType =
          homeContainer.type === "scrollable"
            ? { product_id: val }
            : { banner_id: val };

        newItems = [...(homeContainer.items || []), newItem];
      }

      // Update the container with the new items
      sethomeContainer(
        (prev) =>
          ({
            ...prev,
            items: newItems,
          } as never)
      );
    },
    [homeContainer?.items, homeContainer?.type, sethomeContainer]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const event = e.target;

      if (event.name === "daterange") {
        const dateVal = event.value as unknown as RangeValue<DateValue>;
        const val: RangeValue<string> = {
          start: dateVal.start.toString(),
          end: dateVal.end.toString(),
        };
        event.value = val as never;
      }

      sethomeContainer(
        (prev) => ({ ...prev, [event.name]: event.value } as never)
      );
    },
    [sethomeContainer]
  );

  const handleBack = useCallback(() => {
    sethomeContainer(undefined);
    setmanageItem(false);
    setglobalindex((prev) => ({ ...prev, homeeditindex: undefined }));
  }, [setglobalindex, sethomeContainer]);

  const Modaltitle = useCallback(() => {
    return homeContainer?.type === "banner"
      ? "Banner"
      : homeContainer?.type === "category"
      ? "Categories"
      : homeContainer?.type === "scrollable"
      ? "Scrollable Container"
      : homeContainer?.type === "slide"
      ? "Slide"
      : "Item";
  }, [homeContainer?.type]);

  const handleSubmit = useCallback(async () => {
    if (!homeContainer?.name || !homeContainer.items) {
      errorToast("Missing Requried Field");
      return;
    }

    const isEdit =
      globalindex.homeeditindex && globalindex.homeeditindex !== -1;
    setloading(true);

    const creatReq = await ApiRequest({
      url: "/api/home",
      method: !isEdit ? "POST" : "PUT",
      data: isEdit
        ? {
            ty: "info",
            editItem: homeContainer,
          }
        : homeContainer,
    });
    setloading(false);
    if (!creatReq.success) {
      errorToast(creatReq.error ?? "Error Occured");
      return;
    }
    successToast(
      `Item ${globalindex.homeeditindex === -1 ? "Created" : "Updated"}`
    );
    sethomeContainer(undefined);
  }, [globalindex.homeeditindex, homeContainer, sethomeContainer]);

  return (
    <SecondaryModal
      open={openmodal.mangageHomeItem ?? false}
      size="2xl"
      onPageChange={() => handleCloseModal()}
      footer={() => (
        <FooterContainer
          type={homeContainer?.type}
          handleBack={handleBack}
          isLoading={loading}
          handleSubmit={handleSubmit}
        />
      )}
      closebtn
    >
      {loading && <ContainerLoading />}
      <div className="CreateHomeContainer w-full h-full bg-white">
        <h3>{`${
          globalindex.homeeditindex ? "Edit" : "Create"
        } ${Modaltitle()}`}</h3>
      </div>

      {!homeContainer?.type ? (
        <ManageContainerType />
      ) : (
        <>
          <Form className="DetailForm w-full h-fit flex flex-col items-start gap-3">
            <Input
              aria-label="container_name"
              label="Container Name"
              labelPlacement="outside"
              name="name"
              size="md"
              placeholder="Name"
              value={homeContainer?.name}
              onChange={handleChange}
              isRequired
            />

            {homeContainer.type === "scrollable" && (
              <>
                <div className="w-full h-fit flex flex-row flex-wrap gap-5 items-start">
                  <AsyncSelection
                    option={{
                      name: "scrollabletype",
                      label: "Scroll Type",
                      labelPlacement: "outside",
                      placeholder: "Type",
                      isRequired: true,
                      selectedValue: homeContainer?.scrollabletype
                        ? [homeContainer?.scrollabletype]
                        : undefined,
                      onChange: handleChange as never,
                    }}
                    type="normal"
                    data={() => ScrollableType}
                  />

                  {homeContainer?.scrollabletype !== "custom" && (
                    <NumberInput
                      size="md"
                      name="amountofitem"
                      label="Amount of Item"
                      labelPlacement="outside"
                      aria-label="amount per item"
                      placeholder="amount of item"
                      value={homeContainer?.amountofitem}
                      isRequired
                      onValueChange={(val) =>
                        handleChange({
                          target: {
                            name: "amountofitem",
                            value: val,
                          },
                        } as never)
                      }
                    />
                  )}
                </div>

                {(homeContainer?.scrollabletype &&
                  homeContainer.scrollabletype === "popular") ||
                  (homeContainer?.scrollabletype === "sale" && (
                    <DateRangePicker
                      aria-label="date picker"
                      size="sm"
                      value={
                        homeContainer.daterange?.start &&
                        homeContainer.daterange.end
                          ? {
                              start: parseDate(homeContainer.daterange.start),
                              end: parseDate(homeContainer.daterange.end),
                            }
                          : null
                      }
                      onChange={(val) =>
                        handleChange({
                          target: { name: "datarange", value: val },
                        } as never)
                      }
                    />
                  ))}
              </>
            )}

            <Button
              onPress={() => setmanageItem(!manageItem)}
              className="w-full h-[30px] bg_default text-white font-bold"
            >
              {manageItem ? "Close" : "Manage Item"}
            </Button>

            {manageItem && (
              <ManageContainer
                manage={{
                  setSelectKey: handleSelectItem,
                  selectedKey: (homeContainer.type === "scrollable"
                    ? homeContainer.items?.map((i) => i.product_id)
                    : homeContainer.items?.map((i) => i.banner_id)) as number[],
                }}
              />
            )}
          </Form>
        </>
      )}
    </SecondaryModal>
  );
};

export default CreateHomeItemModal;
