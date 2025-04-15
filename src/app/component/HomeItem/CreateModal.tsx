"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SecondaryModal } from "../Modals";
import { ChangeEvent, JSX, memo, useCallback, useState } from "react";
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
  Containertype,
  ContainerType,
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

const FooterContainer = memo(() => {
  return (
    <div className="btnSec w-full h-[40px] flex flex-row gap-x-3">
      <Button> Confirm </Button>
      <Button> Back </Button>
    </div>
  );
});
FooterContainer.displayName = "FooterContainer";

const ManageContainerType = ({
  containertype,
  setType,
}: {
  containertype: ContainerType | null;
  setType: React.Dispatch<React.SetStateAction<ContainerType | null>>;
}) => {
  const handleSelectContainerType = useCallback(
    (val: ContainerType) => {
      setType((prev) => (prev === val ? null : val));
    },
    [setType]
  );
  return (
    <div className="w-full h-fit flex flex-row gap-5 items-start">
      {containerTypes.map((item) => (
        <ItemTypeCard
          key={item.type}
          Img={item.icon}
          isActive={item.value === containertype}
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

const CreateHomeItemModal = () => {
  const { openmodal, setopenmodal, globalindex } = useGlobalContext();
  const [state, setstate] = useState<Containertype | null>(null);
  const [type, settype] = useState<ContainerType | null>(null);
  const [manageItem, setmanageItem] = useState(false);

  const handleCloseModal = useCallback(() => {
    setopenmodal({ mangageHomeItem: false });
  }, [setopenmodal]);

  const handleSelectItem = useCallback((val: number) => {
    setstate(
      (prev) => ({ ...(prev ?? {}), item: prev?.item?.push(val) } as never)
    );
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const event = e.target;

    if (event.name === "daterange") {
      const dateVal = event.value as unknown as RangeValue<DateValue>;
      const val: RangeValue<string> = {
        start: dateVal.start.toString(),
        end: dateVal.end.toString(),
      };
      event.value = val as never;
    }

    setstate((prev) => ({ ...prev, [event.name]: event.value } as never));
  }, []);

  return (
    <SecondaryModal
      open={openmodal.mangageHomeItem ?? false}
      size="lg"
      onPageChange={() => handleCloseModal()}
      closebtn
      footer={FooterContainer}
    >
      <div className="CreateHomeContainer w-full h-full bg-white">
        <h3>{`${
          globalindex.homeeditindex !== -1
            ? "Edit Container"
            : "Create Container"
        }`}</h3>
      </div>

      {!type ? (
        <ManageContainerType containertype={type} setType={settype} />
      ) : (
        <>
          <Form className="DetailForm w-full h-fit flex flex-col items-start gap-3">
            <Input
              aria-label="container_name"
              name="name"
              size="sm"
              placeholder="Name"
              onChange={handleChange}
              isRequired
            />

            {type === "scrollable" && (
              <>
                <div className="w-full h-fit flex flex-row flex-wrap gap-5 items-start">
                  <AsyncSelection
                    option={{
                      name: "scrollabletype",
                      selectedValue: state?.scrollabletype
                        ? [state.scrollabletype]
                        : undefined,
                      onChange: handleChange as never,
                    }}
                    type="normal"
                    data={() => ScrollableType}
                  />

                  {state?.scrollabletype !== "custom" && (
                    <NumberInput
                      size="sm"
                      name="amountofitem"
                      value={state?.amountofitem}
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

                {(state?.scrollabletype &&
                  state.scrollabletype === "popular") ||
                  (state?.scrollabletype === "sale" && (
                    <DateRangePicker
                      size="sm"
                      value={
                        state.daterange
                          ? {
                              start: parseDate(state.daterange.start),
                              end: parseDate(state.daterange.end),
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
                type={type}
                manage={{
                  selectedKey: state?.item,
                  setSelectKey: handleSelectItem as never,
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
