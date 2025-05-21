"use client";
import * as XLSX from "xlsx";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  AllorderStatus,
  DownloadData,
  Filterdatatype,
  ModalDataType,
  OrderDetailType,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { useCallback, useState } from "react";
import { ExportOrderData } from "./action";
import { errorToast } from "../../component/Loading";
import PrimaryButton from "../../component/Button";
import { SecondaryModal } from "../../component/Modals";
import { ActionModal, OrderFilterMenu } from "./OrderComponent";
import { Dayjs } from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailModal, OrderProductDetailsModal } from "./Detail_Component";
import { AllorderType } from "@/src/lib/utilities";
import { OrderUserType } from "../../checkout/action";
import { GetOrder } from "./actions";

export const DownloadButton = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const [open, setopen] = useState(false);
  const [totalcount, settotalcount] = useState(0);
  const params = useSearchParams();
  const [loading, setloading] = useState(false);
  const [downloaddata, setdata] = useState({
    filename: "",
    filedata: [],
  });
  const handleGetData = useCallback(
    async (filterdata: Filterdatatype) => {
      //get order data
      setloading(true);

      const exportdata = await GetOrder(params as never);

      setloading(false);

      if (!exportdata?.success && !exportdata?.data) {
        errorToast("Error occured");
        return;
      }

      const data = exportdata.data as Array<DownloadData>;

      setdata({
        filename: filterdata.filename ?? `Sheet ${new Date().toISOString()}`,
        filedata: data as never,
      });

      settotalcount(data.length);
      setopen(true);
    },
    [params]
  );

  const handleDownload = useCallback(() => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(downloaddata.filedata);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    // Create a link element, use it to download the file and remove it
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${downloaddata.filename}.xlsx`; // Link download attribute to set file name
    document.body.appendChild(link); // Required for Firefox
    link.click(); // Trigger download
    document.body.removeChild(link); // Clean up
    URL.revokeObjectURL(url);

    setopen(false);
  }, [downloaddata.filedata, downloaddata.filename]);

  return (
    <>
      <PrimaryButton
        onClick={() =>
          setopenmodal((prev) => ({ ...prev, exportoption: true }))
        }
        height="40px"
        type="button"
        text="Export"
        style={{ padding: "10px" }}
        color="#9B7D85"
        Icon={<i className="fa-solid fa-download"></i>}
        radius="10px"
      />

      {open && (
        <SecondaryModal open={openmodal.exportoption ?? false} size="sm">
          <div className="w-[250px] h-[250px] bg-[#f3f3f3] flex flex-col items-center justify-between p-5 rounded-lg">
            {totalcount ? (
              <table className="w-full text-lg">
                <tr>
                  <th align="left">Total Data</th>
                  <td>{totalcount}</td>
                </tr>
                <tr>
                  <th align="left">Format</th>
                  <td>Excel, xlsx</td>
                </tr>
              </table>
            ) : (
              <h3 className="text-xl font-bold">No data</h3>
            )}

            <div className="w-full h-[50px] flex flex-row gap-x-5">
              <PrimaryButton
                type="button"
                text="Yes"
                radius="10px"
                disable={!totalcount}
                onClick={() => handleDownload()}
              />
              <PrimaryButton
                type="button"
                text="No"
                radius="10px"
                color="lightcoral"
                onClick={() => setopen(false)}
              />
            </div>
          </div>
        </SecondaryModal>
      )}

      {openmodal.exportoption && (
        <OrderFilterMenu
          type="export"
          close="exportoption"
          handleNext={handleGetData}
          loading={loading}
          open={openmodal.exportoption}
        />
      )}
    </>
  );
};

export const FilterButton = ({ isFilter }: { isFilter: boolean }) => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleClick = () => {
    setopenmodal((prev) => ({ ...prev, filteroption: true }));
  };
  const handleClear = () => {
    const params = new URLSearchParams(searchParams);
    const pararr = Array.from(params.keys());

    pararr.forEach((key) => {
      if (key !== "page" && key !== "show" && key !== "status") {
        if (params.has(key)) {
          params.delete(key);
        }
      }
    });

    router.push(`?${params}`);
  };
  return (
    <>
      <PrimaryButton
        onClick={() => handleClick()}
        type="button"
        text={isFilter ? "Filter" : "Filtered"}
        color={!isFilter ? "black" : undefined}
        radius="10px"
        height="40px"
        width="150px"
      />

      {!isFilter && (
        <PrimaryButton
          type="button"
          text={"Clear Filter"}
          color={"red"}
          radius="10px"
          height="40px"
          width="150px"
          onClick={() => handleClear()}
        />
      )}

      {openmodal.filteroption && (
        <OrderFilterMenu
          open={openmodal.filteroption}
          close="filteroption"
          type="filter"
        />
      )}
    </>
  );
};

export const ButtonSsr = ({
  width,
  height,
  name,
  color,
  type,
  idx,
  id,
  data,
  orderdata,
  isAdmin,
}: {
  id: string;
  idx: number;
  width: string;
  height: string;
  name: string;
  color?: string;
  orderdata?: AllorderStatus;
  type: string;
  data?: ModalDataType;
  isAdmin: boolean;
}) => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clickedtype = `${type}${idx}`;
  const handleClick = () => {
    const param = new URLSearchParams(searchParams);
    param.set("id", id);
    param.set("ty", type);

    const newurl = `?${param}`;
    setopenmodal((prev) => ({ ...prev, [clickedtype]: true }));

    router.push(newurl);
  };

  const handleClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    url.searchParams.delete("ty");
    setopenmodal((prev) => ({ ...prev, [clickedtype]: false }));
    router.replace(url.pathname + url.search);
  };

  return (
    <>
      <PrimaryButton
        type="button"
        radius="10px"
        text={name}
        color={color}
        height={height}
        width={width}
        style={{ minWidth: "100px" }}
        onClick={() => handleClick()}
      />
      {openmodal[clickedtype] && (
        <>
          {type.startsWith(AllorderType.orderdetail) ? (
            <DetailModal
              key={idx}
              close={clickedtype}
              data={data?.detail as OrderDetailType}
              orderdata={orderdata as AllorderStatus}
              setclose={handleClose}
              isAdmin={isAdmin}
            />
          ) : type.startsWith(AllorderType.orderproduct) ? (
            <OrderProductDetailsModal
              key={idx}
              close={clickedtype}
              setclose={handleClose}
              data={data?.product as Productordertype[]}
            />
          ) : type.startsWith(AllorderType.orderaction) ? (
            <ActionModal
              key={idx}
              close={clickedtype}
              types="none"
              oid={id}
              setclose={handleClose}
              order={data?.action as unknown as OrderUserType}
            />
          ) : (
            <></>
          )}
        </>
      )}
    </>
  );
};
