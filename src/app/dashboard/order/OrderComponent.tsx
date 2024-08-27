"use client";
import ReactDOMServer from "react-dom/server";
import { ChangeEvent, useEffect, useState } from "react";
import PrimaryButton, { Selection } from "../../component/Button";
import Modal from "../../component/Modals";
import { useGlobalContext, userdata } from "@/src/context/GlobalContext";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { CloseVector } from "../../component/Asset";
import {
  Allstatus,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { Checkoutproductcard } from "../../component/Checkout";
import { useRouter, useSearchParams } from "next/navigation";
import { AllorderStatus, AllorderType } from "./page";
import {
  formatDate,
  OrderReceiptTemplate,
} from "../../component/EmailTemplate";
import { deleteOrder, ExportOrderData, updateOrderStatus } from "./action";
import { errorToast, successToast } from "../../component/Loading";
import dayjs, { Dayjs } from "dayjs";
import { OrderUserType } from "../../checkout/action";
import * as XLSX from "xlsx";
import { isObjectEmpty } from "@/src/lib/utilities";
import { shippingtype } from "../../component/Modals/User";
import PaginationCustom from "../../component/Pagination_Component";
import { Input } from "@nextui-org/react";

export const SelectionSSR = ({
  name,
  data,
}: {
  name: string;
  data: string[];
}) => {
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {};

  return (
    <Selection
      default={name}
      onChange={handleSelect}
      style={{ height: "50px", width: "30%" }}
      data={data}
    />
  );
};

export interface DownloadData {
  orderID: string;
  orderDate: string;
  buyer: string;
  product: [
    {
      productid: string;
      productname: string;
      quantity: number;
      price: number;
      discount: number;
    }
  ];
  shippingtype: string;
  shippingprice?: number;
  totalprice: number;
}
export const DownloadButton = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const [open, setopen] = useState(false);
  const [totalcount, settotalcount] = useState(0);
  const [loading, setloading] = useState(false);
  const [downloaddata, setdata] = useState({
    filename: "",
    filedata: [],
  });
  const handleGetData = async (filterdata: Filterdatatype) => {
    //get order data
    setloading(true);
    const orderdata = await ExportOrderData({
      ...filterdata,
      orderdate: undefined,
      fromdate:
        filterdata.fromdate && (filterdata.fromdate as Dayjs).toString(),
      todate: filterdata.todate && (filterdata.todate as Dayjs).toString(),
    });
    setloading(false);

    if (!orderdata.success && !orderdata.data) {
      errorToast("Error occured");
      return;
    }
    let exporteddata: any = [];
    orderdata.data?.forEach((i) => {
      i.Orderproduct.forEach((j) => {
        const price = i.price as unknown as totalpricetype;
        exporteddata.push({
          OrderID: i.id,
          OrderDate: i.createdAt,
          ProductName: j.product.name,
          ProductPricePerUnit: j.product.price,
          ProductDisount: j.product.discount,
          ShippingType: i.shippingtype,
          ShippingPrice: price.shipping ?? 0,
          TotalPrice: price.total,
        });
      });
    });

    setdata({
      filename: filterdata.filename ?? "Sheet",
      filedata: exporteddata as any,
    });

    settotalcount(orderdata.data?.length ?? 0);
    setopen(true);
  };

  const handleDownload = () => {
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
  };

  return (
    <>
      <PrimaryButton
        onClick={() =>
          setopenmodal((prev) => ({ ...prev, exportoption: true }))
        }
        height="50px"
        type="button"
        text="Export"
        style={{ padding: "10px" }}
        color="#9B7D85"
        Icon={<i className="fa-solid fa-download"></i>}
        radius="10px"
      />

      {open && (
        <Modal closestate="none" customZIndex={150}>
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
        </Modal>
      )}

      {openmodal.exportoption && (
        <FilterMenu
          type="export"
          close="exportoption"
          handleNext={handleGetData}
          loading={loading}
        />
      )}
    </>
  );
};

export const FilterButton = ({
  data,
  isFilter,
}: {
  data: Filterdatatype;
  isFilter: boolean;
}) => {
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
        height="50px"
        width="50%"
      />

      {!isFilter && (
        <PrimaryButton
          type="button"
          text={"Clear Filter"}
          color={"red"}
          radius="10px"
          height="50px"
          width="50%"
          onClick={() => handleClear()}
        />
      )}

      {openmodal.filteroption && (
        <FilterMenu close="filteroption" type="filter" />
      )}
    </>
  );
};

export interface OrderDetailType {
  user: userdata;
  shipping: shippingtype;

  createdAt: Date;
  updatedAt: Date;

  price: totalpricetype;
}
export interface ModalDataType {
  detail?: OrderDetailType;
  product?: Array<Productordertype>;
  action?: OrderUserType;
}

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
              close={() => handleClose()}
              types="none"
              oid={id}
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

export interface Filterdatatype {
  q?: string;
  orderdate?: dayjs.Dayjs | string;
  fromdate?: dayjs.Dayjs | string;
  todate?: dayjs.Dayjs | string;
  startprice?: number | string;
  endprice?: number | string;
  filename?: string;
  [key: string]: any;
}

const FilterMenu = ({
  type,
  close,
  handleNext,
  loading,
}: {
  type: "filter" | "export";
  close: "exportoption" | "filteroption";
  handleNext?: (
    data: Filterdatatype,
    settotalcount?: React.Dispatch<React.SetStateAction<number>>
  ) => void;
  loading?: boolean;
}) => {
  const [pickdate, setpickdate] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterdata, setfilterdata] = useState<Filterdatatype>({});
  const [isFilter, setisFilter] = useState(false);

  useEffect(() => {
    if (
      searchParams.has("q") ||
      searchParams.has("orderdate") ||
      searchParams.has("startprice") ||
      searchParams.has("endprice") ||
      searchParams.has("fromdate") ||
      searchParams.has("todate")
    ) {
      searchParams.forEach((val, key) => {
        setfilterdata((prev) => ({ ...prev, [key]: val }));
      });
    }
  }, []);

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filterdata).forEach(([key, val]) => {
      if (key === "page") {
        params.set(key, "1");
      } else {
        if (val) {
          params.set(key, `${val}`);
        }
      }
    });
    router.push(`?${params}`);
    setisFilter(true);
  };

  const handleClear = () => {
    setfilterdata({});
    const params = new URLSearchParams(searchParams);

    Object.entries(filterdata).forEach(([key, val]) => {
      if (key !== "page" && key !== "show") {
        if (val) {
          params.delete(key);
        }
      }
    });
    router.push(`?${params}`);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement> | Dayjs | null,
    name?: string
  ) => {
    if (dayjs.isDayjs(event) && name) {
      setfilterdata((prev) => ({ ...prev, [name]: event }));
    } else if (event && "target" in event) {
      setfilterdata((prev) => ({
        ...prev,
        [event.target.name]: event.target.value,
      }));
    }
  };

  const next = () => {
    if (!filterdata.filename) {
      errorToast("Filename required");
      return;
    }
    handleNext && handleNext(filterdata);
  };

  return (
    <Modal closestate={pickdate ? "" : close} customheight="600px">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="w-full h-full bg-white rounded-lg grid gap-y-5 font-bold text-lg p-5">
          <h2 className="font-bold text-2xl" hidden={type !== "filter"}>
            Filter by
          </h2>

          <Input
            type="text"
            value={filterdata.q}
            onChange={handleChange}
            label={
              type === "export"
                ? "Customer (ID or Name)"
                : "Search (Customer Email , Name , Order Id)"
            }
            name="q"
            size="lg"
            className="w-full"
          />

          <label className="text-lg w-full text-left font-bold">
            Date Range
          </label>

          <div className="w-full h-fit flex flex-row items-center gap-x-5">
            <DateTimePicker
              label={"From"}
              onOpen={() => setpickdate(true)}
              onClose={() => setpickdate(false)}
              value={filterdata.fromdate ? dayjs(filterdata.fromdate) : null}
              sx={{ width: "100%", height: "50px" }}
              name="fromdate"
              onChange={(e) => handleChange(e, "fromdate")}
            />
            <DateTimePicker
              label={"To"}
              onOpen={() => setpickdate(true)}
              onClose={() => setpickdate(false)}
              value={filterdata.todate ? dayjs(filterdata.todate) : null}
              sx={{ width: "100%", height: "50px" }}
              name="todate"
              onChange={(e) => handleChange(e, "todate")}
            />
          </div>

          <label className="text-lg font-bold w-full text-left">
            {" "}
            Price Range{" "}
          </label>
          <AmountRange setdata={setfilterdata} data={filterdata} />

          {type === "export" && (
            <div className="w-full h-full grid gap-y-5">
              <label className="text-lg font-bold">File name (required)</label>
              <input
                type="text"
                id="filename"
                name="filename"
                placeholder="Sheet1"
                onChange={handleChange}
                className="w-full h-[50px] rounded-lg border border-black pl-2"
              />
            </div>
          )}

          <div className="Filter_btn inline-flex items-center gap-x-5 w-full h-[50px]">
            {type === "filter" ? (
              <PrimaryButton
                width="100%"
                type="button"
                text="Filter"
                radius="10px"
                disable={isFilter}
                onClick={() => handleFilter()}
              />
            ) : (
              <PrimaryButton
                width="100%"
                type="button"
                text={`Export`}
                status={loading ? "loading" : "authenticated"}
                radius="10px"
                disable={isObjectEmpty(filterdata)}
                onClick={() => {
                  next();
                }}
              />
            )}
            <PrimaryButton
              type="button"
              width="100%"
              text="Clear"
              disable={isObjectEmpty(filterdata)}
              onClick={() => handleClear()}
              color="lightcoral"
              radius="10px"
            />
          </div>
        </div>
      </LocalizationProvider>
    </Modal>
  );
};

export const AmountRange = ({
  data,
  setdata,
}: {
  data: Filterdatatype;
  setdata: React.Dispatch<React.SetStateAction<Filterdatatype>>;
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (parseInt(value) < 0 || !isNaN(value as any)) {
      e.target.value = "";
    }

    setdata((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div className="Pricerange_Container inline-flex gap-x-5 w-full justify-start">
      <div className="w-full start inline-flex gap-x-5 text-lg font-medium items-center">
        <label htmlFor="from"> From </label>
        <input
          type="number"
          id="price"
          name="startprice"
          value={data.startprice ?? ""}
          onChange={handleChange}
          min={0}
          className="w-full h-[50px] rounded-lg border border-black pl-2"
        />
      </div>
      <div className="w-full start inline-flex gap-x-5 text-lg font-medium items-center">
        <label htmlFor="from"> To </label>
        <input
          type="number"
          id="price"
          name="endprice"
          value={data.endprice ?? ""}
          onChange={handleChange}
          min={0}
          className="w-full h-[50px] rounded-lg border border-black pl-2"
        />
      </div>
    </div>
  );
};

export const PaginationSSR = ({
  total,
  pages,
  limit,
}: {
  total: number;
  pages?: number;
  limit?: string;
}) => {
  const [page, setpage] = useState(pages ?? 1);
  const [show, setshow] = useState(limit ?? "1");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelectPage = (value: number | string) => {
    const searchparam = new URLSearchParams(searchParams);

    searchparam.set("p", "1");
    searchparam.set("show", `${value}`);
    setpage(1);

    router.replace(`?${searchparam}`, { scroll: false });
  };

  return (
    <div className="w-full h-fit mt-[10%]">
      <PaginationCustom
        page={page}
        show={show}
        setpage={setpage}
        setshow={setshow}
        count={total}
        onSelectShowPerPage={handleSelectPage}
      />
    </div>
  );
};

//Modal

export function DetailModal({
  close,
  data,
  setclose,
  orderdata,
  isAdmin,
}: {
  close: string;
  data: OrderDetailType;
  orderdata: AllorderStatus;
  setclose: () => void;
  isAdmin: boolean;
}) {
  const [type, settype] = useState<"user" | "shipping" | "close" | "none">(
    "none"
  );

  const handleClick = (ty: typeof type) => {
    if (ty === "close") {
      setclose();
      return;
    }

    settype(ty);
  };

  const DetailTable = () => {
    return (
      <table align="left" className="text-left" width={"100%"}>
        {type === "user" && data?.user ? (
          <tbody className="bg-white">
            <tr className="h-[50px]">
              <th className="pl-5 rounded-tl-lg">Firstname: </th>
              <td align="right" className="pr-5 rounded-tr-lg break-all">
                {data?.user?.firstname}
              </td>
            </tr>
            <tr className="h-[50px]">
              <th className="pl-5">Lastname: </th>
              <td align="right" className="pr-5 break-all">
                {data.user?.lastname ?? ""}
              </td>
            </tr>
            <tr className="h-[50px]">
              <th className="pl-5">Email: </th>
              <td align="right" className="pr-5 break-all">
                {data.user?.email}
              </td>
            </tr>
            <tr className="h-[50px]">
              <th className="pl-5 rounded-bl-lg">Phone Number: </th>
              <td align="right" className="pr-5 rounded-br-lg break-all"></td>
            </tr>
          </tbody>
        ) : (
          type === "shipping" && (
            <tbody className="bg-white">
              <tr className="h-[50px]">
                <th className="pl-5">HouseId: </th>
                <td align="right" className="pr-5 break-all">
                  {data.shipping?.houseId}
                </td>
              </tr>
              <tr className="h-[50px]">
                <th className="pl-5">District / Khan: </th>
                <td align="right" className="pr-5 break-all">
                  {data.shipping?.district}
                </td>
              </tr>
              <tr className="h-[50px]">
                <th className="pl-5">Songkat: </th>
                <td align="right" className="pr-5 break-all">
                  {data.shipping?.songkhat}
                </td>
              </tr>
              <tr className="h-[50px]">
                <th className="pl-5">City / Province: </th>
                <td align="right" className="pr-5 break-all">
                  {data.shipping?.province}
                </td>
              </tr>
              <tr className="h-[50px]">
                <th className="pl-5">PostalCode: </th>
                <td align="right" className="pr-5 break-all">
                  {data.shipping?.postalcode}
                </td>
              </tr>
            </tbody>
          )
        )}
      </table>
    );
  };

  return (
    <Modal closestate={close} customheight="60vh">
      <div className="w-full h-full relative bg-[#f2f2f2] flex flex-col items-center rounded-lg pl-5 pr-5">
        <div
          onClick={() => handleClick("close")}
          className="w-[40px] h-[40px] absolute top-1 right-2"
        >
          <CloseVector width="100%" height="100%" />
        </div>
        <h3 className="w-full h-fit text-center text-xl font-bold mt-5 mb-5">
          Order Detail
        </h3>

        {type === "none" && (
          <div className="w-full h-full flex flex-col gap-y-20">
            <div className="action flex flex-col gap-y-5 w-full h-fit">
              {isAdmin && (
                <PrimaryButton
                  text="Buyers"
                  width="100%"
                  onClick={() => handleClick("user")}
                  radius="10px"
                  type="button"
                  textsize="15px"
                />
              )}

              {data?.shipping && orderdata.shippingtype !== "Pickup" && (
                <PrimaryButton
                  text="Shipping"
                  width="100%"
                  onClick={() => handleClick("shipping")}
                  radius="10px"
                  type="button"
                  textsize="15px"
                />
              )}
            </div>

            <div className="dates w-full p-2">
              <table
                width={"100%"}
                className="p-2 rounded-lg bg-white"
                style={{
                  boxShadow: "0px 3px 3px 0px inset rgba(0, 0, 0, 0.15)",
                }}
              >
                <tbody className="text-left">
                  <tr className="h-[50px]">
                    <th className="pl-5">Order On: </th>
                    <td align="right" className="pr-5">
                      {formatDate(orderdata.createdAt)}
                    </td>
                  </tr>
                  <tr className="h-[50px]">
                    <th className="pl-5">Updated At: </th>
                    <td align="right" className="pr-5">
                      {formatDate(orderdata.updatedAt)}
                    </td>
                  </tr>
                  <tr className="h-[50px]">
                    <th className="pl-5">Shipping Type: </th>
                    <td align="right" className="pr-5">
                      {orderdata.shippingtype}
                    </td>
                  </tr>
                  <tr className="h-[100px]">
                    <th className="rounded-bl-lg pl-5">Price: </th>
                    <td align="right" className="pr-5 rounded-br-lg">
                      <div className="flex flex-col w-full h-full">
                        <p className="text-lime-700">{`Subtotal: $${orderdata.price?.subtotal.toFixed(
                          2
                        )}`}</p>
                        <p className="text-amber-600">{`Shipping: $${
                          orderdata.price?.shipping?.toFixed(2) ?? "0.0"
                        }`}</p>
                        <p>{`Total: $${orderdata.price?.total.toFixed(2)}`}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {type !== "none" && (
          <>
            <div className="w-full p-2">
              <DetailTable />
            </div>
            <PrimaryButton
              onClick={() => settype("none")}
              type="button"
              text="Back"
              radius="10px"
            />
          </>
        )}
      </div>
    </Modal>
  );
}

export const OrderProductDetailsModal = ({
  setclose,
  close,
  data,
}: {
  setclose: any;
  close: string;
  data: Productordertype[];
}) => {
  const handleClose = () => setclose(false);

  return (
    <Modal closestate={close} customheight="70vh" customwidth="70vw">
      <div className="w-full h-full relative bg-[#f2f2f2] p-2 rounded-lg flex flex-col items-center gap-y-10">
        <div
          onClick={() => handleClose()}
          className="w-[40px] h-[40px] absolute top-1 right-2"
        >
          <CloseVector width="100%" height="100%" />
        </div>

        <h3 className="w-full text-center font-bold text-xl">{`Products (${
          data?.length ?? 0
        })`}</h3>

        <div className="productlist w-[90%] max-h-[60vh] overflow-y-auto flex flex-col items-center gap-y-5">
          {data?.map((prob) => (
            <Checkoutproductcard
              key={prob.id}
              qty={prob.quantity}
              cover={prob.product?.covers[0].url as string}
              name={prob.product?.name as string}
              details={prob.selectedvariant}
              price={prob.price}
              total={
                prob.quantity *
                (((prob.price.discount?.newprice ??
                  prob.product?.price) as number) ?? 0)
              }
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export const ActionModal = ({
  types,
  close,
  oid,
  order,
}: {
  types: "none" | "action" | "status";
  close: () => void;
  oid: string;
  order: OrderUserType;
}) => {
  const [actiontype, setactiontype] = useState<string>(types);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (type: string) => {
    setactiontype(type);
  };

  const handleClose = () => {
    const url = new URLSearchParams(searchParams);
    url.delete("id");
    url.delete("ty");
    close();
    router.push(`?${url}`, { scroll: false });
  };
  return (
    <Modal
      closestate={"discount"}
      customwidth="300px"
      customheight="fit-content"
    >
      <div className="w-full h-full bg-[#f2f2f2] p-5 rounded-lg flex flex-col gap-y-20 ">
        {actiontype === "none" && (
          <>
            <h3 className="w-full text-center text-xl font-bold">Action</h3>
            <div className="w-full h-fit flex flex-col gap-y-32 items-center">
              <div className="action_btn h-full flex flex-col w-full items-center gap-y-5">
                <PrimaryButton
                  type="button"
                  text="Update Status"
                  onClick={() => handleClick("status")}
                  radius="10px"
                  width="90%"
                />
                <PrimaryButton
                  type="button"
                  text="Delete"
                  width="90%"
                  onClick={() => handleClick("delete")}
                  radius="10px"
                  color="lightcoral"
                />
              </div>

              <PrimaryButton
                type="button"
                text="Close"
                width="90%"
                onClick={() => handleClose()}
                radius="10px"
                color="black"
              />
            </div>{" "}
          </>
        )}
        {actiontype === "status" && (
          <UpdateStatus setactiontype={setactiontype} oid={oid} order={order} />
        )}
        {actiontype === "delete" && (
          <OrderAlert settype={setactiontype} oid={oid} close={() => close()} />
        )}
      </div>
    </Modal>
  );
};

const UpdateStatus = ({
  setactiontype,
  oid,
  order,
}: {
  setactiontype: any;
  oid: string;
  order: OrderUserType;
}) => {
  const router = useRouter();
  const [status, setstatus] = useState("");
  const [loading, setloading] = useState(false);
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setstatus(e.target.value as typeof order.status);
  };

  useEffect(() => {
    setstatus(order?.status);
  }, [order?.status]);

  const handleCancel = () => {
    setactiontype("none");
  };

  const handleUpdate = async () => {
    setloading(true);
    const emailTemplate = ReactDOMServer.renderToStaticMarkup(
      <OrderReceiptTemplate
        order={{ ...order, status: status as any }}
        isAdmin={false}
      />
    );
    const makereq = updateOrderStatus.bind(
      null,
      status as any,
      oid,
      emailTemplate
    );
    const update = await makereq();
    setloading(false);
    if (!update.success) {
      errorToast(update.message);
      return;
    }
    successToast(update.message);
    router.refresh();
  };
  return (
    <div className="w-full h-full flex flex-col gap-y-10">
      <h3 className="w-full text-center font-bold text-xl">Update Status</h3>

      <div className="selection flex flex-col gap-y-2">
        <label className="w-full text-lg font-bold text-left">Status</label>
        <Selection
          default="Status"
          value={status}
          data={Object.entries(Allstatus).map(([_, val]) => val) ?? []}
          onChange={handleSelect}
        />
      </div>
      <div className="btn_container w-full h-fit inline-flex gap-x-5">
        <PrimaryButton
          type="button"
          disable={status?.length === 0 || status === order?.status}
          text="Update"
          status={loading ? "loading" : "authenticated"}
          onClick={() => handleUpdate()}
          color="#0097FA"
          radius="10px"
        />
        <PrimaryButton
          type="button"
          text="Cancel"
          radius="10px"
          onClick={() => handleCancel()}
          color="lightcoral"
        />
      </div>
    </div>
  );
};

export const OrderAlert = ({
  settype,
  oid,
  close,
}: {
  settype: (type: string) => void;
  close: () => void;
  oid: string;
}) => {
  const [loading, setloading] = useState(false);
  const handleYes = async () => {
    setloading(true);
    //delete order

    const makereq = deleteOrder.bind(null, oid);
    const deleteorder = await makereq();
    setloading(false);
    if (!deleteorder.success) {
      errorToast(deleteorder.message);
      return;
    }
    successToast("Deleted");
    close();
  };
  const handleNo = () => {
    settype("none");
  };
  return (
    <Modal
      closestate="discount"
      customZIndex={120}
      customheight="300px"
      customwidth="300px"
    >
      <div className="w-full h-[300px] bg-white rounded-lg grid place-items-center">
        <h3 className="w-full text-center"> {"Are you sure ?"}</h3>

        <div className="w-full h-full flex flex-col items-center gap-y-5">
          <PrimaryButton
            onClick={() => handleYes()}
            type="button"
            status={loading ? "loading" : "authenticated"}
            text="Yes"
            radius="10px"
          />
          <PrimaryButton
            type="button"
            onClick={() => handleNo()}
            text="No"
            radius="10px"
            color="lightcoral"
          />
        </div>
      </div>
    </Modal>
  );
};
