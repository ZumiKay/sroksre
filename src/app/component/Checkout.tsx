"use client";

import { Stepindicatortype } from "@/src/context/Checkoutcontext";
import { AnimationControls, motion, useAnimation } from "framer-motion";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import ReactDOMServer from "react-dom/server";

import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  Orderpricetype,
  Ordertype,
  Productorderdetailtype,
  Productordertype,
} from "@/src/context/OrderContext";
import PrimaryButton, { Selection } from "./Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CaptureOrder,
  Createpaypalorder,
  getAddress,
  getOrderAddress,
  handleShippingAdddress,
  updateShippingService,
  updateStatus,
} from "../checkout/action";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { errorToast, LoadingText, successToast } from "./Loading";
import { Checkbox, FormControlLabel } from "@mui/material";
import { LogoVector } from "./Asset";
import { twj } from "tw-to-css";
import { calculatePrice } from "../checkout/page";
import { OrderReceiptTemplate } from "./EmailTemplate";
import Image from "next/image";
// import { SendNotification } from "@/src/socket";
import Link from "next/link";
import { shippingtype } from "./Modals/User";

//Step assets
const LineSvg = ({
  control,
  active,
}: {
  control: AnimationControls;
  active: boolean;
}) => {
  return (
    <svg
      style={{ position: "relative", top: "-15px" }}
      height="50"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.line
        initial={{ pathLength: 0 }}
        animate={control}
        x1="0"
        y1="50"
        x2="250"
        y2="50"
        stroke={"lightgray"}
        strokeWidth={"10px"}
      />
    </svg>
  );
};

const LinearGradient = (color: string, control?: AnimationControls) => {
  return (
    <defs>
      <motion.linearGradient
        initial={{ x2: 0 }}
        animate={control}
        id="grad5"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
      >
        <stop offset="100%" stopColor={color} />
        <stop offset="0%" stopColor="white" />
      </motion.linearGradient>
    </defs>
  );
};

const CircleSvg = ({
  step,
  children,
  control,
  active,
  handleClick,
}: {
  step?: number;
  children?: ReactNode;
  control?: AnimationControls;
  handleClick?: () => void;
  active: boolean;
}) => {
  return (
    <div
      onClick={() => {
        handleClick && handleClick();
      }}
      className="w-[70px] h-[70px] relative grid place-items-center"
    >
      <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
        {active && LinearGradient("#495464", control)}
        <motion.circle
          animate={control}
          r="25"
          cx="35"
          cy="35"
          fill={active ? `url(#grad5)` : "white"}
          stroke={"#495464"}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      {step === 4 ? (
        <div className="w-fit h-fit absolute">
          {" "}
          <Checkmarksvg />
        </div>
      ) : (
        <h3
          style={!active ? { color: "black" } : { color: "white" }}
          className="text-lg w-fit h-fit absolute text-white font-bold"
        >
          {step}
        </h3>
      )}
    </div>
  );
};

export default CircleSvg;

export const Checkmarksvg = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="white"
    >
      <motion.path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
    </motion.svg>
  );
};

//Inintialize
export const StepComponent = ({
  data,
  isActive,
}: {
  data: Stepindicatortype;
  isActive: boolean;
}) => {
  const sequence = useAnimation();
  const linesequence = useAnimation();

  const animations = async () => {
    await linesequence.start(
      data.active
        ? { pathLength: 0, transition: { duration: 0 } }
        : { pathLength: 1 }
    );
    await sequence.start({
      pathLength: 1,
      transition: { duration: 0.5, ease: "easeInOut" },
    });

    await sequence.start({
      x2: "100%",
      transition: { duration: 0.5, ease: "easeInOut" },
    });
    await linesequence.start({
      pathLength: 1,
      stroke: data.active ? "#495464" : "#d2d2d2",
    });
  };

  useEffect(() => {
    animations();
  }, [isActive]);
  return (
    <div
      key={data.idx}
      className="step_container w-[180px] max-h-[300px] h-fit flex flex-row"
      style={data.noline ? { display: "grid", placeContent: "start" } : {}}
    >
      <div className="indicator h-fit w-[100%] flex flex-col items-center ">
        <CircleSvg control={sequence} step={data.step} active={isActive} />
        <h3 className="title text-lg font-medium w-full h-fit text-center">
          {data.title}
        </h3>
      </div>
      <div hidden={data.noline} className="w-full h-fit">
        <LineSvg control={linesequence} active={isActive} />
      </div>
    </div>
  );
};

export const Checkoutproductcard = ({
  qty,
  total,
  price,
  cover,
  details,
  name,
}: {
  qty: number;
  total: number;
  price: Orderpricetype;
  cover: string;
  name: string;
  details?: Productorderdetailtype[];
}) => {
  return (
    <div
      key={cover}
      className={"w-full h-[250px] bg-white rounded-lg flex flex-row gap-x-5"}
    >
      <Image
        src={cover}
        width={200}
        height={200}
        alt="thumbnail"
        className="w-[150px] h-auto rounded-lg object-cover"
        loading="lazy"
      />
      <div className="w-[60%] min-h-[200px] flex flex-col items-start gap-y-3 relative">
        <h3 className="text-xl font-bold w-fit h-fit">{name}</h3>
        {details && (
          <div className="w-full flex flex-col max-h-[120px] overflow-y-auto gap-y-5">
            <ShowDetails details={details ?? []} />
          </div>
        )}
        <ShowPrice total={total} qty={qty} price={price} />
      </div>
    </div>
  );
};

const detailcard = (text: string, bg?: string) => {
  return (
    <div
      style={
        bg
          ? {
              width: "30px",
              backgroundColor: bg,
              borderRadius: "100%",
              height: "30px",
            }
          : {}
      }
      className="detailinfo w-fit max-w-full grid place-content-center h-fit break-all text-lg bg-gray-300 text-center font-medium p-1 rounded-lg"
    >
      {text}
    </div>
  );
};

const ShowPrice = ({
  price,
  total,
  qty,
}: {
  price: Orderpricetype;
  total: number;
  qty: number;
}) => {
  const isDiscount = price.discount;
  const Price = parseFloat(price.price.toString()).toFixed(2);

  return (
    <div className="w-full h-fit flex flex-row items-center justify-between absolute bottom-5">
      <div className="price flex flex-row items-center gap-x-3 w-full h-full">
        <h3
          hidden={!isDiscount}
          className="text-lg font-normal text-red-500 line-through"
        >
          ${Price}
        </h3>
        <h3 hidden={!isDiscount} className="text-lg font-normal text-red-500">
          -{isDiscount?.percent}%
        </h3>
        <h3 className="text-lg font-normal">
          ${isDiscount ? isDiscount.newprice?.toFixed(2) : Price}
        </h3>
        <h3 className="text-lg font-normal">{`x${qty}`}</h3>
      </div>
      <h3 className="text-lg font-bold">
        ${parseFloat(total.toString()).toFixed(2)}
      </h3>
    </div>
  );
};

const ShowDetails = ({
  details,
}: {
  details: Array<Productorderdetailtype>;
}) => {
  return (
    <>
      <div className="w-full h-fit grid grid-cols-3 gap-x-5 gap-y-5">
        {details
          ?.filter((opt) => opt.option_type !== "COLOR")
          ?.map((opt) => detailcard(opt.option_value))}
      </div>

      {details?.filter((i) => i.option_type === "COLOR").length !== 0 && (
        <div className="w-full h-fit flex flex-row gap-x-5 items-center">
          <h3>Color: </h3>
          {details
            ?.filter((opt) => opt.option_type === "COLOR")
            ?.map((opt) => detailcard("", opt.option_value))}
        </div>
      )}
    </>
  );
};

export const Shippingservicecard = ({
  type,
  price,
  estimate,
  value,
  isSelected,
  orderId,
}: {
  type: string;
  price: number;
  estimate: string;
  value: string;
  isSelected: boolean;
  orderId: string;
}) => {
  const [loading, setloading] = useState(false);
  const handleClick = async () => {
    setloading(true);
    //select shipping option
    const updateOrder = updateShippingService.bind(null, orderId, value);
    const request = await updateOrder();
    setloading(false);
    if (!request.success) {
      errorToast(request.message ?? "Error Occured");
      return;
    }
  };
  const showPrice = `$${parseFloat(price.toString()).toFixed(2)}`;
  return (
    <>
      {loading && <LoadingText />}
      <div
        key={type}
        onClick={() => handleClick()}
        style={isSelected ? { outline: "2px solid #495464 " } : {}}
        className="w-[250px] h-[150px] p-2 flex flex-col gap-y-3 bg-white outline outline-2 rounded-lg outline-gray-300 transition duration-200 hover:outline-2 hover:outline-[#495464]"
      >
        <h3 className="text-lg font-semibold w-fit h-fit">{type}</h3>
        <h3 className="text-lg font-normal w-fit h-fit">{showPrice}</h3>
        <h3 className="text-lg font-normal text-gray-500 w-full h-fit mt-5">
          {estimate}
        </h3>
      </div>
    </>
  );
};

const stepsinitialize: Array<Stepindicatortype> = [
  {
    step: 1,
    title: "Summary",
    active: false,
  },
  {
    step: 2,
    title: "Fill in info",
    active: false,
  },
  {
    step: 3,
    title: "Payment",
    active: false,
  },
  {
    step: 4,
    title: "Complete",
    noline: true,
    active: false,
  },
];
export const StepIndicator = ({ step }: { step: number }) => {
  const [stepdata, setstepdata] =
    useState<Stepindicatortype[]>(stepsinitialize);

  useEffect(() => {
    setstepdata(
      stepsinitialize.map((i) => ({ ...i, active: i.step === step }))
    );
  }, [step]);
  return (
    <div className="step_containter w-full h-fit flex flex-row justify-center pt-2">
      {stepdata?.map((i, idx) => (
        <StepComponent
          key={idx}
          data={i}
          isActive={stepdata[idx].active ?? false}
        />
      ))}
    </div>
  );
};

//Buttons Group

export const BackAndEdit = ({ step }: { step: number }) => {
  const { setcart } = useGlobalContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handleedit = () => {
    if (step === 1) {
      setcart(true);
    } else if (step > 1 && step < 4) {
      const current = new URLSearchParams(searchParams);
      const prevstep = step > 1 ? step - 1 : step;
      current.set("step", prevstep.toString());
      const value = current.toString();
      const query = `?${value}`;

      router.push(`${pathname}${query}`);
    }
  };
  return (
    <div className="btn-1 flex flex-col items-center gap-y-3 w-[150px] h-fit">
      <PrimaryButton
        text={step === 1 ? "Edit" : "Back"}
        color="lightcoral"
        type="button"
        onClick={() => handleedit()}
        height="50px"
        width="100%"
        radius="10px"
      />
      <PrimaryButton
        text="Back to shop"
        type="button"
        height="50px"
        width="100%"
        radius="10px"
      />
    </div>
  );
};

export const Proceedbutton = ({ step }: { step: number }) => {
  return (
    <PrimaryButton
      text="Confirm"
      type={step === 3 ? "button" : "submit"}
      height="50px"
      disable={step === 3}
      width="100%"
      radius="10px"
    />
  );
};

export const Navigatebutton = ({
  title,
  to,
}: {
  title: string;
  to: string;
}) => {
  return (
    <Link href={to}>
      <PrimaryButton
        text={title}
        type="button"
        height="50px"
        width="100%"
        radius="10px"
      />
    </Link>
  );
};

export const FormWrapper = ({
  children,
  step,
  order_id,
}: {
  children: ReactNode;
  step: number;
  order_id: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setloading] = useState(false);

  const handleProcceed = () => {
    const getStep = stepsinitialize.find((i) => i.step === step);
    if (!getStep) {
      return null;
    }

    const current = new URLSearchParams(searchParams);
    const nextstep = step < 4 ? step + 1 : step;
    current.set("step", nextstep.toString());
    const value = current.toString();
    const query = `?${value}`;

    router.push(`${pathname}${query}`);
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setloading(true);

    const isShipping = event.currentTarget["shipping"];
    const isPayment = event.currentTarget["isPayment"];
    const isSaved = event?.currentTarget["save"]?.value;

    if (isShipping) {
      const isSelected = event.currentTarget["selected_address"];
      const value = parseInt(isSelected.value);

      if (value !== -1) {
        const saveAddress = handleShippingAdddress.bind(
          null,
          order_id,
          value,
          undefined,
          isSaved
        );
        const request = await saveAddress();

        if (!request.success) {
          errorToast(request.message ?? "Error occured");
          return;
        }
      } else {
        const formdata = new FormData(event.currentTarget);

        const allData = Array.from(formdata.entries());
        let modifiedData: { [key: string]: any } = {};
        for (const [key, value] of allData) {
          modifiedData[key] = value;
        }

        if (allData.length === 0) {
          errorToast("Missing Information");
          return;
        }

        //create and saved address
        const createandsaveAddress = handleShippingAdddress.bind(
          null,
          order_id,
          undefined,
          modifiedData as shippingtype,
          isSaved
        );
        const request = await createandsaveAddress();
        if (!request.success) {
          errorToast(request.message ?? "Error occured");
          return;
        }
      }

      //save shipping
    }

    //procceed to next step

    setloading(false);

    handleProcceed();
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="checked_body w-full h-fit flex flex-row justify-center gap-x-5"
    >
      {loading && <LoadingText />}
      {children}
    </form>
  );
};

export function SelectionSSR(props: {
  selectedvalue?: string;
  data: Array<{ label: string; value: number }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const current = new URLSearchParams(searchParams);
    const value = e.target.value;

    current.set("selectedaddress", value);

    const query = `?${current.toString()}`;
    router.push(`${pathname}${query}`);
  };

  return (
    <select
      onChange={handleChange}
      value={props.selectedvalue}
      className={`select__container border-1 border-black rounded-md w-full h-full p-2`}
    >
      <option value="">None</option>
      {props.data.map((i, idx) => (
        <option key={idx} value={i.value}>
          {i.label}
        </option>
      ))}
    </select>
  );
}

//fetch data

interface Addresstype {
  id: number;
  street: string;
  houseId: string;
  province: string;
  district: string;
  songkhat: string;
  postalcode: string;
  phonenumber?: string;
}
const shippingInitialize: Addresstype = {
  id: 0,
  houseId: "",
  street: "",
  province: "",
  district: "",
  songkhat: "",
  postalcode: "",
};

export function ShippingForm({ orderid }: { orderid: string }) {
  const [address, setaddress] = useState<Addresstype[] | undefined>(undefined);
  const [selectedaddress, setselectedaddress] =
    useState<Addresstype>(shippingInitialize);

  const [select, setselect] = useState(0);
  const [save, setsave] = useState(0);
  const fetchdata = async () => {
    await fetchselectedData();
    const fetchshipping = await getAddress();
    setaddress(fetchshipping as any);
  };

  const fetchselectedData = async () => {
    const getselectedAddress = getOrderAddress.bind(null, orderid);

    const request = await getselectedAddress();

    if (request?.shipping_id && request?.shipping) {
      if (!request.shipping.userId) {
        setselect(0);
      }
      setselect(request.shipping_id);
      setselectedaddress(request.shipping as any);
    } else {
      setselect(0);
    }
  };

  useEffect(() => {
    fetchdata();
  }, []);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setselectedaddress((prev) => ({ ...prev, id: -1 }));

    setselectedaddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setselect(value);

    setselectedaddress(shippingInitialize);

    if (value === -1) {
      return;
    }
    const selectedaddress = address?.find((i) => i.id === value);

    setselectedaddress(selectedaddress as Addresstype);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="w-fit h-full flex flex-row gap-x-5"
    >
      <input type="hidden" name="shipping" value={"shipping"} />
      <div className="checkout_container bg-[#F1F1F1] w-[50vw] h-fit p-2 rounded-lg shadow-lg flex flex-col items-center">
        <h3 className="title text-2xl font-bold pb-5"> Shipping Address </h3>

        <div className="shippingform w-[70%] h-fit p-2 flex flex-col gap-y-5 items-center">
          <Selection
            data={[
              ...(address?.map((i, idx) => ({
                label: `Address ${idx + 1}`,
                value: i.id,
              })) ?? []),
              { label: "Custom", value: -1 },
            ]}
            default="None"
            defaultValue={0}
            value={!selectedaddress?.id ? select : selectedaddress.id}
            onChange={handleSelect}
          />

          <input
            type="hidden"
            name="selected_address"
            value={selectedaddress?.id ?? 0}
          />
          {select !== 0 && (
            <>
              <input
                className="w-full h-[50px] p-1  font-medium text-sm"
                placeholder="House or Apartment Id"
                name="street"
                value={selectedaddress?.street}
                onChange={handleChange}
                required
              />
              <input
                className="w-full h-[50px] p-1  font-medium text-sm"
                placeholder="House or Apartment Id"
                name="houseId"
                value={selectedaddress?.houseId}
                onChange={handleChange}
                required
              />
              <input
                className="w-full h-[50px] p-1  font-medium text-sm"
                placeholder="Province / State"
                name="province"
                value={selectedaddress?.province}
                onChange={handleChange}
                required
              />
              <input
                className="w-full h-[50px] p-1  font-medium text-sm"
                placeholder="District"
                name="district"
                value={selectedaddress?.district}
                onChange={handleChange}
                required
              />
              <input
                className="w-full h-[50px] p-1  font-medium text-sm"
                placeholder="Songkhat"
                name="songkhat"
                value={selectedaddress?.songkhat}
                onChange={handleChange}
                required
              />
              <div className="flex flex-row w-full h-fit gap-x-5">
                <input
                  className="w-full h-[50px] p-1  font-medium text-sm"
                  placeholder="Postal code"
                  name="postalcode"
                  value={selectedaddress?.postalcode}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full h-[50px] p-1  font-medium text-sm"
                  placeholder="Phone number (optional)"
                  name="phonenumber"
                />
              </div>
              <input type="hidden" name="save" value={save} />

              <FormControlLabel
                hidden={select !== -1}
                control={
                  <Checkbox
                    onChange={(e) => setsave(e.target.checked ? 1 : 0)}
                    style={{ color: "#495464" }}
                  />
                }
                label="Save for future use"
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

//Paypal Button

interface OrderUserType extends Ordertype {
  user: {
    firstname: string;
    lastname?: string;
    email: string;
  };
  Orderproduct: Productordertype[];
  createdAt: Date;
}

export function Paypalbutton({
  orderId,
  order,
  encripyid,
}: {
  orderId: string;
  encripyid: string;
  order: OrderUserType;
}) {
  const router = useRouter();

  const createOrder = async () => {
    const CreateOrder = Createpaypalorder.bind(null, orderId);
    const request = await CreateOrder();

    if (!request.success) {
      errorToast(request.message ?? "Server error");
      return;
    }

    if (request.data.id) {
      return request.data.id;
    } else {
      const errorDetail = request.data?.details?.[0];
      const errorMessage = errorDetail
        ? `${errorDetail.issue} ${errorDetail.description} (${request.data.debug_id})`
        : JSON.stringify(request);

      errorToast(errorMessage);
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.PAYPAL_ID as string,
        components: "buttons",
        currency: "USD",
      }}
    >
      <PayPalButtons
        createOrder={() => createOrder()}
        onApprove={async (data, actions) => {
          try {
            const captureOrder = CaptureOrder.bind(null, data.orderID);
            const request = await captureOrder();

            if (!request.success) {
              errorToast(request.message ?? "Server error");
              return;
            }
            const orderData = request.data;
            const errorDetail = orderData?.details?.[0];

            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
              return actions.restart();
            } else if (errorDetail) {
              // (2) Other non-recoverable errors -> Show a failure message
              throw new Error(
                `${errorDetail.description} (${orderData.debug_id})`
              );
            } else if (!orderData.purchase_units) {
              throw new Error(JSON.stringify(orderData));
            } else {
              // (3) Successful transaction -> Show confirmation or thank you message
              // Or go to another URL:  actions.redirect('thank_you.html');

              const transaction =
                orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
                orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];

              //update order status and send email

              const htmltemplate = ReactDOMServer.renderToString(
                <OrderReceiptTemplate
                  order={{ ...order, status: "Paid" }}
                  isAdmin={false}
                />
              );
              const adminhtmltemplate = ReactDOMServer.renderToString(
                <OrderReceiptTemplate
                  order={{ ...order, status: "Paid" }}
                  isAdmin={true}
                />
              );

              const updateOrder = updateStatus.bind(
                null,
                orderId,
                htmltemplate,
                adminhtmltemplate
              );

              const makeReq = await updateOrder();

              if (!makeReq.success) {
                errorToast(makeReq.message ?? "");
                return;
              }
              // await SendNotification({
              //   type: "New Order",
              //   content: `Order #${orderId} has requested`,
              //   checked: false,
              //   link: `${process.env.BASE_URL}/dashboard/order?&q=${orderId}`,
              // });

              successToast(`Purchase Complete`);

              router.replace(`/checkout?orderid=${encripyid}&step=4`);
            }
          } catch (error) {
            console.log("Payment error", error);
            errorToast("Payment failed , Please try again!");
          }
        }}
        style={{ disableMaxWidth: true }}
      />
    </PayPalScriptProvider>
  );
}

//Email templa

interface OrderEmailType<t> {
  orderProduct: t;
  name: string;
}

export function OrderEmail<t extends OrderUserType>({
  orderProduct,
  name,
}: OrderEmailType<t>) {
  return (
    <div
      style={twj(
        "flex flex-col gap-y-5 justify-center items-center w-[100%] h-[100%] bg-white"
      )}
    >
      <div
        style={twj(
          "flex flex-col gap-y-5 items-center w-[80%] h-fit bg-white p-5 bg-[#F2F2F2] rounded-lg border-2 border-[#495464] shadow-lg"
        )}
      >
        <LogoVector />
        <div style={twj("w-[80%] h-fit text-left flex flex-col gap-y-1")}>
          <h3 style={twj("text-xl font-bold w-full h-fit text-center")}>
            Thank you for shopping with us
          </h3>
          <h3 style={twj("text-lg font-medium w-full h-fit")}>
            {`Hi ${name}, we received your order and is being process for shipping`}
          </h3>
          <h3 style={twj("text-lg font-bold w-full h-fit")}>{`Order #: ${
            orderProduct?.id ?? "12345"
          }`}</h3>
          <h3 style={twj("text-lg font-bold w-full h-fit")}>
            {`Order on createdAt and fully paid`}
          </h3>
        </div>
        <div
          style={twj(
            "flex flex-col items-center gap-y-5 min-w-[400px] w-[100%] h-[100%]"
          )}
        >
          {orderProduct.Orderproduct.map((prob) => {
            const price: Orderpricetype = {
              price: prob.product?.price as number,
              discount: prob.product?.discount
                ? {
                    percent: prob.product.discount as any,
                    newprice: calculatePrice(
                      prob.product?.price,
                      prob.product.discount as any
                    ),
                  }
                : undefined,
            };
            return (
              <Checkoutproductcard
                key={prob.id}
                qty={prob.quantity}
                cover={prob.product?.covers[0].url as string}
                price={price}
                total={
                  prob.quantity *
                  parseFloat(prob.product?.price.toString() as string)
                }
                name={prob.product?.name as string}
                details={prob.details as Array<Productorderdetailtype>}
              />
            );
          })}
        </div>
        <div
          style={twj(
            "link_btn flex flex-row gap-x-5 w-full justify-center items-center h-fit text-center"
          )}
        >
          <a
            style={twj(
              "w-[100%] rounded-lg p-[5px] no-underline bg-[#495464] text-white font-bold cursor-pointer"
            )}
            href="http://"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Order
          </a>
          <a
            href="http://"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
            style={twj(
              "w-[100%] no-underline rounded-lg p-[5px] rounded-lg p-2 bg-[#495464] text-white font-bold cursor-pointer"
            )}
          >
            Continue Shopping
          </a>
        </div>
        <p
          style={twj(
            "text-lg no-underline font-bold text-blue w-full text-left text-blue-500 cursor-pointer"
          )}
        >
          Shipping and refund information
        </p>
        <table
          style={twj(
            "price_container w-full h-fit border-b-0 border-l-0 border-r-0 border-t-2 border-dashed border-[black]"
          )}
        >
          <tbody style={twj("text-left h-[120px]")}>
            <tr>
              <th>Subtotal</th>
              <td style={twj("text-right")}>19.99</td>
            </tr>
            <tr>
              <th>Shipping</th>
              <td style={twj("text-right")}>10.00</td>
            </tr>
            <tr>
              <th>Total</th>
              <td style={twj("text-right")}>29.99</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
