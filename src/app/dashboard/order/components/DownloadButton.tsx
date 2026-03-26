"use client";

import { useState } from "react";
import PrimaryButton from "@/src/app/component/Button";
import Modal from "@/src/app/component/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFileExcel,
  faTable,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
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
        color="#059669"
        Icon={<FontAwesomeIcon icon={faDownload} />}
        radius="10px"
      />

      {open && (
        <Modal closestate="none" customZIndex={210}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faFileExcel}
                    className="text-white text-lg"
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">
                    Ready to Export
                  </p>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    Review before downloading
                  </p>
                </div>
              </div>
              <button
                onClick={() => setopen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-white text-sm" />
              </button>
            </div>

            {/* Summary */}
            <div className="px-6 py-5">
              {totalcount ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FontAwesomeIcon
                        icon={faTable}
                        className="text-xs w-4"
                      />
                      <span className="text-sm font-medium">Records</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {totalcount.toLocaleString()} orders
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FontAwesomeIcon
                        icon={faFileExcel}
                        className="text-xs w-4"
                      />
                      <span className="text-sm font-medium">Format</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                      Excel .xlsx
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FontAwesomeIcon
                        icon={faDownload}
                        className="text-xs w-4"
                      />
                      <span className="text-sm font-medium">File name</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-gray-800 truncate max-w-36">
                      {downloaddata.filename || "Sheet"}.xlsx
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faTable}
                      className="text-gray-300 text-xl"
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    No data found
                  </p>
                  <p className="text-xs text-gray-400">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                disabled={!totalcount}
                onClick={handleDownload}
                className="flex-1 h-10 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} className="text-xs" />
                Download
              </button>
              <button
                onClick={() => setopen(false)}
                className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
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
