"use client";

/**UI COMPONENT FOR CHECKOUT PROCESS */

import { Stepindicatortype } from "@/src/context/Checkoutcontext";
import { AnimationControls, motion, useAnimation } from "framer-motion";
import {
  ChangeEvent,
  ReactNode,
  SubmitEvent,
  useEffect,
  useState,
} from "react";
import ReactDOMServer from "react-dom/server";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  Allstatus,
  Orderpricetype,
  OrderSelectedVariantType,
  Ordertype,
} from "@/src/types/order.type";
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
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { errorToast, LoadingText, successToast } from "./Loading";
import { Checkbox, FormControlLabel } from "@mui/material";
import { OrderReceiptTemplate } from "./EmailTemplate";
import Image from "next/image";
import Link from "next/link";
import { shippingtype } from "./Modals/User";
import { Selecteddetailcard } from "./Card";
import { ApiRequest } from "@/src/context/CustomHook";
import { SelectionCustom } from "./Pagination_Component";
import { SendNotification, useSocket } from "@/src/context/SocketContext";
import { VariantValueObjType } from "@/src/types/product.type";
import useCheckSession from "@/src/hooks/useCheckSession";

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
      className="w-17 h-17.5 
     
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
        : { pathLength: 1 },
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
      className={`step_container w-45  max-h-75 h-fit flex flex-row justify-center 
      max-small_phone:w-37.5 max-smallest_phone:w-30 ${
        data.step === 2
          ? "max-large_phone:grid max-large_phone:place-content-start"
          : ""
      } max-smallest_phone:grid max-smallest_phone:place-content-start`}
      style={data.noline ? { display: "grid", placeContent: "start" } : {}}
    >
      <div className="indicator h-37.5 w-full max-small_phone:h-25 flex flex-col items-center">
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
  details?: Array<string | VariantValueObjType> | OrderSelectedVariantType;
}) => {
  // Helper function to check if details is OrderSelectedVariantType
  const isOrderSelectedVariantType = (
    details: any,
  ): details is OrderSelectedVariantType => {
    return (
      details &&
      !Array.isArray(details) &&
      ("variantsection" in details || "variant" in details)
    );
  };

  const renderVariants = () => {
    if (!details) return null;

    if (isOrderSelectedVariantType(details)) {
      // Handle OrderSelectedVariantType - object with variantsection and variant
      return (
        <div className="w-full flex flex-col gap-3">
          {/* Render variants grouped by sections */}
          {details.variantsection?.map((section, sectionIdx) => (
            <div key={sectionIdx} className="flex flex-col gap-2">
              {section.variantSection && (
                <span className="text-sm font-semibold text-gray-600">
                  {section.variantSection.name}:
                </span>
              )}
              <div className="w-full flex flex-row gap-2 flex-wrap">
                {section.variants.map((item, idx) => (
                  <Selecteddetailcard
                    key={sectionIdx * 1000 + idx}
                    text={item}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* Render standalone variants (no section) */}
          {details.variant && details.variant.length > 0 && (
            <div className="w-full flex flex-row gap-2 flex-wrap">
              {details.variant.map((item, idx) => (
                <Selecteddetailcard key={idx} text={item} />
              ))}
            </div>
          )}
        </div>
      );
    } else if (Array.isArray(details)) {
      // Handle Array<string | VariantValueObjType> - flat array
      if (details.length === 0) return null;
      return (
        <div className="w-full flex flex-row gap-2 flex-wrap">
          {details.map((item, idx) => (
            <Selecteddetailcard key={idx} text={item} />
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      key={cover}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-row gap-6 items-center max-large_phone:flex-col hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative group">
        <Image
          src={cover}
          width={200}
          height={200}
          alt="thumbnail"
          className="w-40 h-40 rounded-lg object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="flex-1 w-full min-h-40 flex flex-col justify-between gap-3">
        <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{name}</h3>
        {renderVariants()}
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
    <div className="w-full flex flex-row items-center justify-between pt-4 border-t border-gray-100">
      <div className="price flex flex-row items-center flex-wrap gap-3">
        <h3
          hidden={!isDiscount}
          className="text-base font-medium text-gray-400 line-through"
        >
          ${Price}
        </h3>
        <span
          hidden={!isDiscount}
          className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded-full"
        >
          -{isDiscount?.percent}%
        </span>
        <h3 className="text-lg font-semibold text-gray-800">
          ${isDiscount ? isDiscount.newprice?.toFixed(2) : Price}
        </h3>
        <span className="text-sm text-gray-500 font-medium">{`× ${qty}`}</span>
      </div>
      <h3 className="text-xl font-bold text-blue-600">
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
        className={`group relative w-full h-40 p-6 flex flex-col justify-between bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer ${
          isSelected
            ? "border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-200"
            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
        }`}
      >
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800">{type}</h3>
          <p className="text-2xl font-bold text-blue-600">{showPrice}</p>
        </div>
        <p className="text-sm text-gray-500 font-medium">{estimate}</p>
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
      stepsinitialize.map((i) => ({ ...i, active: i.step === step })),
    );
  }, [step]);
  return (
    <div className="w-full flex flex-row justify-center items-center gap-0 max-small_phone:grid max-small_phone:grid-cols-2 max-small_phone:gap-y-4 max-small_phone:px-4">
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
    <div className="flex flex-col items-center gap-4 w-full max-w-xs max-small_tablet:max-w-full max-small_tablet:flex-row">
      <PrimaryButton
        text={step === 1 ? "Edit Cart" : "Back"}
        color="#6B7280"
        type="button"
        onClick={() => handleedit()}
        height="50px"
        width="100%"
        radius="12px"
      />
      <Link href="/" className="w-full">
        <PrimaryButton
          text="Continue Shopping"
          type="button"
          height="50px"
          width="100%"
          radius="12px"
        />
      </Link>
    </div>
  );
};

export const Proceedbutton = ({ step }: { step: number }) => {
  return (
    <PrimaryButton
      text={step === 3 ? "Processing..." : "Continue"}
      type={step === 3 ? "button" : "submit"}
      height="50px"
      disable={step === 3}
      width="100%"
      radius="12px"
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
    <Link href={to} className="w-full">
      <PrimaryButton
        text={title}
        type="button"
        height="56px"
        width="100%"
        radius="12px"
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
  const { handleCheckSession } = useCheckSession();

  const handleProcceed = () => {
    const getStep = stepsinitialize.find((i) => i.step === step);
    if (!getStep) {
      return null;
    }

    const current = new URLSearchParams(searchParams);

    //Determine for the next step
    const nextstep = step < 4 ? step + 1 : step;
    current.set("step", nextstep.toString());
    const value = current.toString();
    const query = `?${value}`;

    router.push(`${pathname}${query}`, { scroll: false });
    router.refresh();
  };
  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setloading(true);

    //Verify User Session
    const isValid = await handleCheckSession();
    if (!isValid) return;

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
          isSaved,
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
          isSaved,
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
      className="w-full flex flex-row justify-center gap-6 max-small_tablet:flex-col"
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
      className={`select__container border border-black rounded-md w-full h-full p-2`}
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
        { id: orderid, ty: "removeAddress" },
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
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      <input type="hidden" name="shipping" value={"shipping"} />
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-smaller_screen:p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-linear-to-b from-purple-600 to-purple-400 rounded-full"></div>
          <h3 className="text-3xl font-bold text-gray-800">Shipping Address</h3>
        </div>

        <div className="shippingform w-full space-y-6">
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
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                  placeholder="First name"
                  name="firstname"
                  value={selectedaddress?.firstname}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                  placeholder="Last name"
                  name="lastname"
                  value={selectedaddress?.lastname}
                  onChange={handleChange}
                  required
                />
              </div>
              <input
                className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                placeholder="Street Name or ID"
                name="street"
                value={selectedaddress?.street}
                onChange={handleChange}
                required
              />
              <input
                className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                placeholder="House or Apartment ID"
                name="houseId"
                value={selectedaddress?.houseId}
                onChange={handleChange}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                  placeholder="Province / State"
                  name="province"
                  value={selectedaddress?.province}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                  placeholder="District"
                  name="district"
                  value={selectedaddress?.district}
                  onChange={handleChange}
                  required
                />
              </div>
              <input
                className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                placeholder="Songkhat / Commune"
                name="songkhat"
                value={selectedaddress?.songkhat}
                onChange={handleChange}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                  placeholder="Postal code"
                  name="postalcode"
                  value={selectedaddress?.postalcode}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-sm placeholder:text-gray-400"
                  placeholder="Phone number (optional)"
                  name="phonenumber"
                />
              </div>
              <input type="hidden" name="save" value={save} />

              <div className="pt-4 border-t border-gray-200">
                <FormControlLabel
                  hidden={select !== -1}
                  control={
                    <Checkbox
                      onChange={(e) => setsave(e.target.checked ? 1 : 0)}
                      style={{ color: "#3B82F6" }}
                    />
                  }
                  label={
                    <span className="text-gray-700 font-medium">
                      Save address for future orders
                    </span>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

//Paypal Button

// PayPal Button Wrapper with Loading State
function PaypalButtonWrapper({
  orderId,
  order,
  encripyid,
  onCreateOrder,
  onApproveOrder,
}: {
  orderId: string;
  encripyid: string;
  order: Ordertype;
  onCreateOrder: () => Promise<string>;
  onApproveOrder: (data: any, actions: any) => Promise<void>;
}) {
  const [{ isPending, isResolved }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);

  if (isPending) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Loading PayPal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-700 font-medium">
              Processing Payment...
            </p>
          </div>
        </div>
      )}
      <PayPalButtons
        createOrder={async () => {
          setIsProcessing(true);
          try {
            return await onCreateOrder();
          } catch (error) {
            setIsProcessing(false);
            throw error;
          }
        }}
        onApprove={async (data, actions) => {
          setIsProcessing(true);
          try {
            await onApproveOrder(data, actions);
          } finally {
            setIsProcessing(false);
          }
        }}
        onError={(err) => {
          setIsProcessing(false);
          console.error("PayPal error:", err);
          errorToast("Payment error occurred. Please try again.");
        }}
        onCancel={() => {
          setIsProcessing(false);
          errorToast("Payment cancelled");
        }}
        style={{
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          height: 50,
        }}
        disabled={isProcessing}
      />
    </div>
  );
}

export function Paypalbutton({
  orderId,
  order,
  encripyid,
}: {
  orderId: string;
  encripyid: string;
  order: Ordertype;
}) {
  const router = useRouter();
  const socket = useSocket();
  const { setcarttotal } = useGlobalContext();
  const { handleCheckSession } = useCheckSession();

  const createOrder = async (): Promise<string> => {
    //Verify user session before create paypal order

    const isValid = await handleCheckSession();
    if (!isValid) {
      throw new Error("Session validation failed");
    }

    const CreateOrder = Createpaypalorder.bind(null, orderId);
    const request = await CreateOrder();

    if (!request.success) {
      const errorMsg = request.message ?? "Server error";
      errorToast(errorMsg);
      throw new Error(errorMsg);
    }

    if (request.data.id) {
      return request.data.id;
    } else {
      const errorDetail = request.data?.details?.[0];
      const errorMessage = errorDetail
        ? `${errorDetail.issue} ${errorDetail.description} (${request.data.debug_id})`
        : JSON.stringify(request);

      errorToast(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleApprove = async (data: any, actions: any) => {
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
        throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
      } else if (!orderData.purchase_units) {
        throw new Error(JSON.stringify(orderData));
      } else {
        const getPolicy = await ApiRequest(
          `/api/policy?type=email`,
          undefined,
          "GET",
        );
        if (!getPolicy.success) {
          throw Error("Error Occured");
        }

        const htmltemplate = ReactDOMServer.renderToString(
          <OrderReceiptTemplate
            order={{ ...order, status: Allstatus.paid }}
            isAdmin={false}
          />,
        );
        const adminhtmltemplate = ReactDOMServer.renderToString(
          <OrderReceiptTemplate
            order={{ ...order, status: Allstatus.paid }}
            isAdmin={true}
          />,
        );

        const updateOrder = updateStatus.bind(
          null,
          orderId,
          htmltemplate,
          adminhtmltemplate,
        );
        const makeReq = await updateOrder();

        if (!makeReq.success) {
          errorToast(makeReq.message ?? "");
          return;
        }
        socket &&
          (await SendNotification(
            {
              type: "New Order",
              content: `Order #${orderId} has requested`,
              checked: false,
              link: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order?&q=${orderId}`,
            },
            socket,
          ));
        successToast(`Purchase Complete`);
        router.replace(`/checkout?orderid=${encripyid}&step=4`);
        setcarttotal(0);
        router.refresh();
      }
    } catch (error) {
      console.log("Payment error", error);
      errorToast("Payment failed , Please try again!");
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_ID as string,
        components: "buttons",
        currency: "USD",
        intent: "capture",
      }}
    >
      <PaypalButtonWrapper
        orderId={orderId}
        order={order}
        encripyid={encripyid}
        onCreateOrder={createOrder}
        onApproveOrder={handleApprove}
      />
    </PayPalScriptProvider>
  );
}
