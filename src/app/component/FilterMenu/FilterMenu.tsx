import { useGlobalContext } from "@/src/context/GlobalContext";
import PrimaryButton from "../Button";
import { SecondaryModal } from "../Modals";
import { ChangeEvent, useCallback, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";
import {
  BannerSize,
  BannerTypeSelect,
  categorytype,
  FiltermenuType,
} from "@/src/context/GlobalType.type";
import dayjs from "dayjs";
import { formatDate } from "../EmailTemplate";
import { AsyncSelection } from "../AsynSelection";
import { DateTimePicker } from "@mui/x-date-pickers";
import { Checkbox, Divider } from "@heroui/react";
import { FetchCategory } from "../../dashboard/inventory/createproduct/[editId]/action";
import { FetchPromotionSelection } from "./action";

const FilterMenu = ({
  type,
  totalproduct,
}: {
  type?: FiltermenuType;
  totalproduct?: number;
  setisFilter?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    openmodal,
    setopenmodal,
    promotion,
    globalindex,
    filtervalue,
    setfiltervalue,
  } = useGlobalContext();
  const [selectdate, setselectdate] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setfiltervalue((prev) => ({ ...prev, [name]: value }));
    },
    [setfiltervalue]
  );

  const handleFilter = useCallback(() => {
    if (!filtervalue) return;
    const params = new URLSearchParams(searchParams);
    const filtervalues = Object.entries(filtervalue);

    filtervalues.map(([key, value]) => {
      if (key === "expiredate" && value) {
        const val = dayjs(value as string);
        params.set(key, formatDate(val.toDate()));
      }
      if (key === "promoids" && value) {
        const val = value as number[];
        params.set("promoids", val.join(","));
      }

      if (key !== "p" && value && value !== "none") {
        params.set(key, value as string);
      }
    });

    params.set("p", "1");

    router.push(`?${params}`);

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  }, [filtervalue, router, searchParams, setopenmodal]);

  const handleClear = useCallback(() => {
    if (!filtervalue) return;

    const params = new URLSearchParams(searchParams);
    Object.keys(filtervalue).map((key) => {
      if (key !== "p") {
        params.delete(key);
      }
    });

    params.set("p", "1");

    router.push(`?${params}`);

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  }, [filtervalue, searchParams, router, setopenmodal]);

  const handleCloseModal = useCallback(() => {
    if (!selectdate) setopenmodal((prev) => ({ ...prev, filteroption: false }));
  }, [selectdate, setopenmodal]);

  return (
    <SecondaryModal
      open={openmodal.filteroption ?? false}
      size="5xl"
      onPageChange={() => handleCloseModal()}
      placement="top"
      closebtn
      footer={() => (
        <>
          {type !== "listproduct" ? (
            <PrimaryButton
              type="button"
              onClick={() => handleFilter()}
              text="Filter"
              disable={!filtervalue}
              radius="10px"
              width="100%"
            />
          ) : (
            <PrimaryButton
              type="button"
              text={`Show Product ${totalproduct === 0 ? "" : totalproduct}`}
              onClick={() =>
                setopenmodal((prev) => ({ ...prev, filteroption: false }))
              }
              radius="10px"
              width="100%"
            />
          )}
          <PrimaryButton
            type="button"
            onClick={() => handleClear()}
            text="Clear"
            color="lightcoral"
            radius="10px"
            width="100%"
          />
        </>
      )}
    >
      <div className="filtermenu w-full relative  h-fit bg-white p-5 max-small_phone:max-h-[50vh] rounded-md flex flex-col justify-center gap-y-5">
        {type !== "usermanagement" && (
          <input
            type="text"
            name="search"
            placeholder="Search Name"
            value={filtervalue?.search}
            onChange={handleChange}
            className="search w-full pl-2 h-[50px] rounded-md border border-gray-300"
            hidden={type === "listproduct"}
          />
        )}

        {type === "usermanagement" && (
          <input
            type="text"
            name="search"
            placeholder="Search (ID , Email)"
            value={filtervalue?.search}
            onChange={handleChange}
            className="search w-full pl-2 h-[50px] rounded-md border border-gray-300"
          />
        )}
        {type === "banner" && (
          <>
            <div className="w-full h-fit flex flex-col gap-y-5">
              <label className="w-full text-lg font-medium">Banner Type</label>
              <AsyncSelection
                type="normal"
                data={() => [
                  { label: "All", value: "none" },
                  ...BannerTypeSelect,
                ]}
                option={{
                  name: "bannertype",
                  "aria-label": "banner type",
                  selectedKeys: filtervalue?.bannertype
                    ? [filtervalue.bannertype]
                    : undefined,
                  onChange: (val) => handleChange(val as never),
                }}
              />
            </div>
            <div className="w-full h-fit flex flex-col gap-y-5">
              <label className="w-full text-lg font-medium">Banner Size</label>
              <AsyncSelection
                type="normal"
                data={() => [{ label: "All", value: "none", ...BannerSize }]}
                option={{
                  name: "banner size",
                  "aria-label": "bannersize",
                  selectedKeys: filtervalue?.bannersize
                    ? [filtervalue.bannersize]
                    : undefined,
                  onChange: (val) => handleChange(val as never),
                }}
              />
            </div>
          </>
        )}
        {type === "promotion" && (
          <>
            <div
              onMouseEnter={() => setselectdate(true)}
              onMouseLeave={() => setselectdate(false)}
              className="w-full h-[50px] relative z-[100]"
            >
              <DateTimePicker
                sx={{ width: "100%" }}
                value={
                  filtervalue?.expiredate ? dayjs(filtervalue.expiredate) : null
                }
                onChange={(e) => {
                  if (e) {
                    handleChange({
                      target: {
                        name: "expireddate",
                        value: e.toDate(),
                      },
                    } as never);
                  }
                }}
              />{" "}
            </div>

            {/* Expire Filtering  */}
          </>
        )}
        {type === "product" && (
          <>
            <h3>Detail Options</h3>
            <Divider />
            <div className="w-full h-fit flex flex-row gap-x-3">
              <AsyncSelection
                type="async"
                data={(take) =>
                  take
                    ? FetchCategory({
                        ty: "parent",
                        offset: take,
                        type: categorytype.normal,
                      })
                    : undefined
                }
                option={{
                  fullWidth: true,
                  selectedKeys: filtervalue?.parentcate
                    ? [filtervalue.parentcate]
                    : undefined,
                  onChange: (val) => {
                    handleChange({
                      target: {
                        name: "parentcate",
                        value: val.target.value,
                      },
                    } as never);
                  },
                  label: "Parent Categories",
                }}
              />
              <AsyncSelection
                type="async"
                data={(take) =>
                  take && filtervalue?.parentcate
                    ? FetchCategory({
                        ty: "child",
                        pid: filtervalue?.parentcate,
                        offset: take,
                      })
                    : undefined
                }
                forceRefetch={filtervalue?.parentcate}
                option={{
                  fullWidth: true,
                  label: "Child Categories",
                  size: "md",
                  isDisabled: !filtervalue?.parentcate,
                  selectedKeys: filtervalue?.childcate
                    ? [filtervalue.childcate]
                    : undefined,
                  onChange: (val) => {
                    handleChange({
                      target: {
                        name: "childcate",
                        value: val.target.value,
                      },
                    } as never);
                  },
                }}
              />
            </div>
            {globalindex.promotioneditindex !== -1 &&
            promotion.selectproduct ? (
              <Checkbox
                className="w-full h-[40px]"
                onValueChange={(value) => {
                  handleChange({
                    target: { name: "promotiononly", value: value as never },
                  } as never);
                }}
              >
                Only Discount
              </Checkbox>
            ) : (
              <AsyncSelection
                type="async"
                data={(val = 5) => FetchPromotionSelection(val)}
                option={{
                  selectionMode: "multiple",
                  label: "Promotion",
                  selectedKeys: filtervalue?.promoids
                    ? filtervalue.promoids
                    : undefined,
                  onChange: (e) =>
                    handleChange({
                      target: {
                        name: "promoids",
                        value: e.target.value.split(",") as never,
                      },
                    } as never),
                }}
              />
            )}
          </>
        )}
      </div>
    </SecondaryModal>
  );
};

export default FilterMenu;
