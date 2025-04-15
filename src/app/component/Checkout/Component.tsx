import { Stepindicatortype } from "@/src/context/Checkoutcontext";
import { useAnimation } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import CircleSvg, { LineSvg } from "./Asset";
import { Orderpricetype } from "@/src/context/OrderContext";
import {
  STEPS_INITIAL,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import Image from "next/image";
import { Selecteddetailcard } from "../Card";
import { updateShippingService } from "../../checkout/action";
import { errorToast, LoadingText } from "../Loading";

export const StepComponent = memo(
  ({ data, isActive }: { data: Stepindicatortype; isActive: boolean }) => {
    const sequence = useAnimation();
    const linesequence = useAnimation();

    useEffect(() => {
      const animations = async () => {
        // Reset line based on active state
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

      animations();
    }, [data.active, isActive, linesequence, sequence]);

    // Pre-calculate classes to improve readability
    const containerClasses = useMemo(() => {
      const baseClasses =
        "step_container w-[180px] max-h-[300px] h-fit flex flex-row justify-center max-small_phone:w-[150px] max-smallest_phone:w-[120px]";

      let responsiveClasses = "";
      if (data.step === 2) {
        responsiveClasses +=
          " max-large_phone:grid max-large_phone:place-content-start";
      }
      responsiveClasses +=
        " max-smallest_phone:grid max-smallest_phone:place-content-start";

      return `${baseClasses} ${responsiveClasses}`;
    }, [data.step]);

    const lineClasses = useMemo(() => {
      let classes = "w-full h-fit";

      if (data.step === 2) classes += " max-large_phone:hidden";
      if (data.step === 1 || data.step === 3)
        classes += " max-smallest_phone:hidden";

      return classes;
    }, [data.step]);

    return (
      <div
        key={data.idx}
        className={containerClasses}
        style={data.noline ? { display: "grid", placeContent: "start" } : {}}
      >
        <div className="indicator h-[150px] w-[100%] max-small_phone:h-[100px] flex flex-col items-center">
          <CircleSvg control={sequence} step={data.step} active={isActive} />
          <h3 className="title text-lg font-medium w-full h-fit text-center">
            {data.title}
          </h3>
        </div>
        {!data.noline && (
          <div hidden={data.noline} className={lineClasses}>
            <LineSvg control={linesequence} />
          </div>
        )}
      </div>
    );
  }
);

StepComponent.displayName = "StepComponent";

const ShowPrice = memo(
  ({
    price,
    total,
    qty,
  }: {
    price: Orderpricetype;
    total: number;
    qty: number;
  }) => {
    const isDiscount = price.discount && price.discount;
    const basePrice = price.price;

    const displayPrice = useMemo(() => {
      return isDiscount ? isDiscount.newprice?.toFixed(2) : basePrice;
    }, [isDiscount, basePrice]);

    const formattedTotal = useMemo(() => {
      return parseFloat(total.toString()).toFixed(2);
    }, [total]);

    return (
      <div className="w-full h-fit flex flex-row items-center justify-between">
        <div className="price flex flex-row items-center max-small_phone:flex-wrap gap-x-3 w-full h-full">
          {isDiscount && (
            <>
              <h3 className="text-lg font-normal text-red-500 line-through">
                ${basePrice}
              </h3>
              <h3 className="text-lg font-normal text-red-500">
                -{isDiscount.percent}%
              </h3>
            </>
          )}
          <h3 className="text-lg font-normal">${displayPrice}</h3>
          <h3 className="text-lg font-normal">{`x${qty}`}</h3>
        </div>
        <h3 className="text-lg font-bold">${formattedTotal}</h3>
      </div>
    );
  }
);

ShowPrice.displayName = "ShowPrice";

export const Checkoutproductcard = memo(
  ({
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
    const containerClass =
      "w-full h-fit bg-white rounded-lg flex flex-row gap-x-5 items-center max-large_phone:flex-col max-large_phone:gap-y-5 border-1 border-gray-300";

    const contentContainerClass =
      "w-[60%] max-large_phone:w-[90%] min-h-[200px] h-fit flex flex-col items-start gap-y-3 relative";

    return (
      <div key={cover} className={containerClass}>
        <Image
          src={cover}
          width={200}
          height={200}
          alt={`${name} thumbnail`}
          className="w-[150px] h-auto rounded-lg object-contain"
          loading="lazy"
        />
        <div className={contentContainerClass}>
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
  }
);

Checkoutproductcard.displayName = "Checkoutproductcard";

export const Shippingservicecard = memo(
  ({
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
    const [loading, setLoading] = useState(false);

    // Format price once using useMemo
    const formattedPrice = useMemo(() => {
      return `$${parseFloat(price.toString()).toFixed(2)}`;
    }, [price]);

    // Use useCallback to prevent recreating this function on each render
    const handleClick = useCallback(async () => {
      if (loading) return; // Prevent multiple clicks

      setLoading(true);
      try {
        const request = await updateShippingService(orderId, value);

        if (!request.success) {
          errorToast(request.message ?? "Error Occurred");
        }
      } catch (error) {
        errorToast("Failed to update shipping service");
        console.error("Shipping service update error:", error);
      } finally {
        setLoading(false);
      }
    }, [loading, orderId, value]);

    // Prepare card style once
    const cardStyle = useMemo(() => {
      return isSelected ? { outline: "2px solid #495464" } : {};
    }, [isSelected]);

    const cardClassName =
      "w-[250px] h-[150px] p-2 flex flex-col gap-y-3 bg-white outline outline-2 rounded-lg outline-gray-300 transition duration-200 hover:outline-2 hover:outline-[#495464]";

    return (
      <>
        {loading && <LoadingText />}
        <div
          key={type}
          onClick={handleClick}
          style={cardStyle}
          className={cardClassName}
        >
          <h3 className="text-lg font-semibold w-fit h-fit">{type}</h3>
          <h3 className="text-lg font-normal w-fit h-fit">{formattedPrice}</h3>
          <h3 className="text-lg font-normal text-gray-500 w-full h-fit mt-5">
            {estimate}
          </h3>
        </div>
      </>
    );
  }
);

Shippingservicecard.displayName = "Shippingservicecard";

// Optimized StepIndicator component
export const StepIndicator = memo(({ step }: { step: number }) => {
  // Use useMemo to compute step data based on current step
  const stepData = useMemo(() => {
    return STEPS_INITIAL.map((item) => ({
      ...item,
      active: item.step === step,
    }));
  }, [step]);

  const containerClassName = `
      step_containter w-full h-fit flex flex-row justify-center items-center pt-2 
      pl-10
      max-small_tablet:pl-10 
      max-small_phone:flex-wrap
      max-large_phone:justify-center 
      max-large_phone:items-center max-small_phone:justify-center max-small_phone:pl-[15%]
      max-smallest_phone:grid max-smallest_phone:grid-cols-2
    `;

  return (
    <div className={containerClassName}>
      {stepData.map((item) => (
        <StepComponent
          key={item.step}
          data={item}
          isActive={item.active ?? false}
        />
      ))}
    </div>
  );
});

StepIndicator.displayName = "StepIndicator";
