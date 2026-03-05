"use client";

import { useState } from "react";
import PrimaryButton from "@/src/app/component/Button";
import Modal from "@/src/app/component/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { totalpricetype } from "@/src/types/order.type";
import { ExportOrderData } from "../action";
import { errorToast } from "@/src/app/component/Loading";
import { Dayjs } from "dayjs";
import ExcelJS from "exceljs";
import { FilterMenu } from "./FilterMenu";
import { Filterdatatype } from "./types";

export const DownloadButton = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const [open, setopen] = useState(false);
  const [totalcount, settotalcount] = useState(0);
  const [loading, setloading] = useState(false);
  const [downloaddata, setdata] = useState<{
    filename: string;
    filedata: any[];
  }>({ filename: "", filedata: [] });

  const handleGetData = async (filterdata: Filterdatatype) => {
    setloading(true);
    const orderdata = await ExportOrderData({
      ...filterdata,
      orderdate: undefined,
      fromdate:
        filterdata.fromdate && (filterdata.fromdate as Dayjs).toString(),
      todate: filterdata.todate && (filterdata.todate as Dayjs).toString(),
    });
    setloading(false);

    if (!orderdata.success || !orderdata.data) {
      errorToast("Error occurred");
      return;
    }

    const exporteddata: any[] = [];
    orderdata.data.forEach((order) => {
      order.Orderproduct.forEach((item) => {
        const price = order.price as unknown as totalpricetype;
        exporteddata.push({
          OrderID: order.id,
          OrderDate: order.createdAt,
          ProductName: item.product.name,
          ProductPricePerUnit: item.product.price,
          ProductDiscount: item.product.discount,
          ShippingType: order.shippingtype,
          ShippingPrice: price.shipping ?? 0,
          TotalPrice: price.total,
        });
      });
    });

    setdata({
      filename: filterdata.filename ?? "Sheet",
      filedata: exporteddata,
    });
    settotalcount(orderdata.data.length);
    setopen(true);
  };

  const handleDownload = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    if (downloaddata.filedata.length > 0) {
      const firstRow = downloaddata.filedata[0];
      worksheet.columns = Object.keys(firstRow).map((key) => ({
        header: key,
        key,
        width: 15,
      }));
      downloaddata.filedata.forEach((row) => worksheet.addRow(row));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${downloaddata.filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setopen(false);
  };

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
        Icon={<FontAwesomeIcon icon={faDownload} />}
        radius="10px"
      />

      {open && (
        <Modal closestate="none" customZIndex={210}>
          <div className="w-62.5 h-62.5 bg-[#f3f3f3] flex flex-col items-center justify-between p-5 rounded-lg">
            {totalcount ? (
              <table className="w-full text-lg">
                <tbody>
                  <tr>
                    <th align="left">Total Data</th>
                    <td>{totalcount}</td>
                  </tr>
                  <tr>
                    <th align="left">Format</th>
                    <td>Excel, xlsx</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <h3 className="text-xl font-bold">No data</h3>
            )}
            <div className="w-full h-12.5 flex flex-row gap-x-5">
              <PrimaryButton
                type="button"
                text="Yes"
                radius="10px"
                disable={!totalcount}
                onClick={handleDownload}
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
        </Modal>
      )}

      {openmodal.exportoption && (
        <FilterMenu
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
