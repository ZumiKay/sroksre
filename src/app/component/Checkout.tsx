"use client";

import { Stepindicatortype } from "@/src/context/Checkoutcontext";
import { AnimationControls, motion, useAnimation } from "framer-motion";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import ReactDOMServer from "react-dom/server";
import {
  useGlobalContext,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import {
  Orderpricetype,
  Ordertype,
  Productordertype,
} from "@/src/context/OrderContext";
import PrimaryButton from "./Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CaptureOrder,
  Createpaypalorder,
  getAddress,
  handleShippingAdddress,
  updateShippingService,
  updateStatus,
} from "../checkout/action";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { errorToast, LoadingText, successToast } from "./Loading";
import { Checkbox, FormControlLabel } from "@mui/material";
import { OrderReceiptTemplate } from "./EmailTemplate";
import Image from "next/image";
// import { SendNotification } from "@/src/socket";
import Link from "next/link";
import { shippingtype } from "./Modals/User";
import { Selecteddetailcard } from "./Card";
import { ApiRequest } from "@/src/context/CustomHook";
import { SelectionCustom } from "./Pagination_Component";

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
      className="w-[70px] h-[70px] 
     
       relative grid place-items-center"
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
      className={`step_container w-[180px]  max-h-[300px] h-fit flex flex-row justify-center 
      max-small_phone:w-[150px] max-smallest_phone:w-[120px] ${
        data.step === 2
          ? "max-large_phone:grid max-large_phone:place-content-start"
          : ""
      } max-smallest_phone:grid max-smallest_phone:place-content-start`}
      style={data.noline ? { display: "grid", placeContent: "start" } : {}}
    >
      <div className="indicator h-[150px] w-[100%] max-small_phone:h-[100px] flex flex-col items-center">
        <CircleSvg control={sequence} step={data.step} active={isActive} />
        <h3 className="title text-lg font-medium w-full h-fit text-center">
          {data.title}
        </h3>
      </div>
      <div
        hidden={data.noline}
        className={`w-full h-fit ${
          data.step === 2 ? "max-large_phone:hidden" : ""
        } ${data.step === 1 ? "max-smallest_phone:hidden" : ""} ${
          data.step === 3 ? "max-smallest_phone:hidden" : ""
        }`}
      >
        <LineSvg control={linesequence} active={isActive} />
      </div>
    </div>
  );
};

export const Checkoutproductcard = ({
  qty,
  price,
  cover,
  details,
  name,
  total,
}: {
  qty: number;
  price: Orderpricetype;
  cover: string;
  name: string;
  total: number;
  details?: (string | VariantColorValueType)[];
}) => {
  return (
    <div
      key={cover}
      className={
        "w-full h-fit bg-white rounded-lg flex flex-row gap-x-5 items-center max-large_phone:flex-col max-large_phone:gap-y-5"
      }
    >
      <Image
        src={cover}
        width={200}
        height={200}
        alt="thumbnail"
        className="w-[150px] h-auto rounded-lg object-contain"
        loading="lazy"
      />
      <div className="w-[60%] max-large_phone:w-[90%] min-h-[200px] h-fit flex flex-col items-start gap-y-3 relative">
        <h3 className="text-xl font-bold w-fit h-fit">{name}</h3>
        {details && details.length > 0 && (
          <div className="w-full flex flex-row gap-3 flex-wrap h-fit">
            {details.map((item, idx) => (
              <Selecteddetailcard key={idx} text={item} />
            ))}
          </div>
        )}
        <ShowPrice total={total} qty={qty} price={price} />
      </div>
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
  const isDiscount = price.discount && price.discount;
  const Price = price.price;

  return (
    <div className="w-full h-fit flex flex-row items-center justify-between">
      <div className="price flex flex-row items-center max-small_phone:flex-wrap gap-x-3 w-full h-full">
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
    <div
      className="step_containter w-full h-fit flex flex-row justify-center items-center pt-2 
      pl-10
    max-small_tablet:pl-10 
    max-small_phone:flex-wrap
    max-large_phone:justify-center 
    max-large_phone:items-center max-small_phone:justify-center max-small_phone:pl-[15%]
    max-smallest_phone:grid max-smallest_phone:grid-cols-2
    "
    >
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
    <div
      className={`btn-1 flex flex-col items-center gap-3 w-[150px] h-fit 
        max-small_tablet:w-full max-small_tablet:order-3 max-small_tablet:flex-row`}
    >
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

    router.push(`${pathname}${query}`, { scroll: false });
    router.refresh();
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setloading(true);

    const isShipping = event.currentTarget["shipping"];
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
      className={`checked_body w-full h-fit flex flex-row justify-center gap-x-5 
        max-smaller_screen:justify-between max-smaller_screen:pl-1 max-smaller_screen:pr-1
        max-small_tablet:flex-col max-small_tablet:gap-y-5
        `}
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
  firstname: string;
  lastname: string;
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
  firstname: "",
  lastname: "",
  houseId: "",
  street: "",
  province: "",
  district: "",
  songkhat: "",
  postalcode: "",
};

export function ShippingForm({ orderid }: { orderid: string }) {
  const [address, setaddress] = useState<Addresstype[] | undefined>(undefined);
  const [loading, setloading] = useState(false);
  const [selectedaddress, setselectedaddress] =
    useState<Addresstype>(shippingInitialize);

  const [select, setselect] = useState(0);
  const [save, setsave] = useState(0);
  const fetchdata = async () => {
    const fetchshipping = getAddress.bind(null, orderid);
    const fetch = await fetchshipping();
    if (fetch.selectedaddress) {
      setselect(fetch.selectedaddress.shipping?.id ?? 0);
      setselectedaddress(fetch.selectedaddress.shipping as any);
    } else {
      setselect(0);
    }
    setaddress(fetch.address as any);
  };

  useEffect(() => {
    fetchdata();
  }, []);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setselectedaddress((prev) => ({ ...prev, id: -1 }));

    setselectedaddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = async (value: number) => {
    setselect(value);

    setselectedaddress(shippingInitialize);

    if (value === 0) {
      setloading(true);
      const updatereq = await ApiRequest(
        "/api/order",
        undefined,
        "PUT",
        "JSON",
        { id: orderid, ty: "removeAddress" }
      );
      setloading(false);
      if (!updatereq.success) {
        errorToast("Can't Update Address");
        return;
      }
    }

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
      className="w-fit max-smaller_screen:w-full h-full flex flex-row gap-x-5"
    >
      <input type="hidden" name="shipping" value={"shipping"} />
      <div
        className="checkout_container bg-[#F1F1F1] w-[50vw]
      max-smaller_screen:w-full
       h-fit p-2 rounded-lg shadow-lg flex flex-col items-center"
      >
        <h3 className="title text-2xl font-bold pb-5"> Shipping Address </h3>

        <div className="shippingform w-[70%] max-large_phone:w-full h-fit p-2 flex flex-col gap-y-5 items-center">
          <SelectionCustom
            label="Address"
            placeholder={
              address && selectedaddress
                ? `Address ${
                    address.findIndex((i) => i.id === selectedaddress.id) + 1
                  }`
                : "None"
            }
            isLoading={loading}
            data={[
              { label: "None", value: 0 },
              ...(address?.map((i, idx) => ({
                label: `Address ${idx + 1}`,
                value: i.id,
              })) ?? []),
              { label: "Custom", value: -1 },
            ]}
            value={select}
            onChange={(value) => handleSelect(value as number)}
          />

          <input
            type="hidden"
            name="selected_address"
            value={selectedaddress?.id ?? 0}
          />
          {select !== 0 && (
            <>
              <div className="w-full h-fit flex flex-row items-center gap-x-5">
                <input
                  className="w-full h-[50px] p-1  font-medium text-sm"
                  placeholder="Firstname"
                  name="firstname"
                  value={selectedaddress?.firstname}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full h-[50px] p-1  font-medium text-sm"
                  placeholder="Lastname"
                  name="lastname"
                  value={selectedaddress?.lastname}
                  onChange={handleChange}
                  required
                />
              </div>
              <input
                className="w-full h-[50px] p-1  font-medium text-sm"
                placeholder="Street Name or Id"
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
    id: number;
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
              throw new Error(
                `${errorDetail.description} (${orderData.debug_id})`
              );
            } else if (!orderData.purchase_units) {
              throw new Error(JSON.stringify(orderData));
            } else {
              const getPolicy = await ApiRequest(
                `/api/policy?type=email`,
                undefined,
                "GET"
              );
              if (!getPolicy.success) {
                throw Error("Error Occured");
              }

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
              router.refresh();
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
