"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAnimation } from "framer-motion";
import Image from "next/image";
import { Card, CardBody, Chip, Skeleton } from "@heroui/react";
import { Stepindicatortype } from "@/src/context/Checkoutcontext";
import {
  STEPS_INITIAL,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { Selecteddetailcard } from "../Card";
import { updateShippingService } from "../../checkout/action";
import { errorToast, LoadingText, successToast } from "../Loading";
import CircleSvg, { LineSvg } from "./Asset";

// Types
interface Orderpricetype {
  price: number;
  discount?: {
    percent: number;
    newprice?: number;
  };
}

interface StepComponentProps {
  data: Stepindicatortype;
  isActive: boolean;
}

interface CheckoutProductCardProps {
  qty: number;
  price: Orderpricetype;
  cover: string;
  name: string;
  total: number;
  details?: (string | VariantColorValueType)[];
}

interface ShippingServiceCardProps {
  type: string;
  price: number;
  estimate: string;
  value: string;
  isSelected: boolean;
  orderId: string;
  onUpdate?: () => void;
}

// Styles
const styles = {
  stepContainer: {
    base: "flex justify-center transition-all duration-300 ease-in-out",
    sizes: {
      large: "w-[180px] max-h-[300px]",
      medium: "max-small_phone:w-[150px]",
      small: "max-smallest_phone:w-[120px]",
    },
    responsive: {
      step2: "max-large_phone:grid max-large_phone:place-content-start",
      general: "max-smallest_phone:grid max-smallest_phone:place-content-start",
    },
  },
  stepIndicator: {
    container: `
      w-full h-fit flex flex-row justify-center items-center pt-6 px-4
      max-small_tablet:px-6
      max-large_phone:justify-center max-large_phone:items-center
      max-small_phone:flex-wrap max-small_phone:justify-center max-small_phone:px-[10%]
      max-smallest_phone:grid max-smallest_phone:grid-cols-2 max-smallest_phone:gap-4
    `,
    indicator:
      "h-[150px] w-full flex flex-col items-center gap-2 max-small_phone:h-[120px]",
    title:
      "text-lg font-medium text-center text-gray-700 transition-colors duration-200",
    line: "w-full h-fit",
  },
  productCard: {
    container: `
      w-full bg-white rounded-xl shadow-sm border border-gray-200 
      transition-all duration-200 hover:shadow-md
    `,
    content:
      "p-6 flex flex-row gap-6 items-center max-large_phone:flex-col max-large_phone:gap-4",
    image: "w-[150px] h-[150px] rounded-lg object-cover flex-shrink-0",
    details: "flex-1 space-y-4",
    title: "text-xl font-bold text-gray-900",
    variants: "flex flex-wrap gap-2",
    priceSection: "flex justify-between items-center",
  },
  shippingCard: {
    base: `
      w-full max-w-[280px] p-6 bg-white rounded-xl border-2 
      transition-all duration-200 hover:scale-[1.02] cursor-pointer
      hover:shadow-lg active:scale-[0.98]
    `,
    selected: "border-blue-500 bg-blue-50 shadow-md",
    unselected: "border-gray-200 hover:border-gray-300",
    disabled: "opacity-50 cursor-not-allowed",
    content: "space-y-3",
    title: "text-lg font-semibold text-gray-900",
    price: "text-xl font-bold text-blue-600",
    estimate: "text-sm text-gray-500",
  },
  price: {
    container: "flex items-center justify-between w-full",
    details: "flex items-center flex-wrap gap-3",
    original: "text-lg text-red-500 line-through",
    discount: "text-lg font-medium text-red-500",
    current: "text-lg font-semibold text-gray-900",
    quantity: "text-lg text-gray-600",
    total: "text-xl font-bold text-gray-900",
  },
} as const;

// Step Component
export const StepComponent = memo<StepComponentProps>(({ data, isActive }) => {
  const sequence = useAnimation();
  const linesequence = useAnimation();

  useEffect(() => {
    const runAnimations = async () => {
      try {
        // Reset line animation
        await linesequence.start(
          data.active
            ? { pathLength: 0, transition: { duration: 0 } }
            : { pathLength: 1 }
        );

        // Run circle animation
        await sequence.start({
          pathLength: 1,
          transition: { duration: 0.5, ease: "easeInOut" },
        });

        // Complete the line animation
        await linesequence.start({
          pathLength: 1,
          stroke: data.active ? "#3B82F6" : "#D1D5DB",
          transition: { duration: 0.3 },
        });
      } catch (error) {
        console.error("Animation error:", error);
      }
    };

    runAnimations();
  }, [data.active, isActive, linesequence, sequence]);

  const containerClasses = useMemo(() => {
    let classes = `${styles.stepContainer.base} ${styles.stepContainer.sizes.large} ${styles.stepContainer.sizes.medium} ${styles.stepContainer.sizes.small}`;

    if (data.step === 2) {
      classes += ` ${styles.stepContainer.responsive.step2}`;
    }
    classes += ` ${styles.stepContainer.responsive.general}`;

    return classes;
  }, [data.step]);

  const lineClasses = useMemo(() => {
    let classes = styles.stepIndicator.line;

    if (data.step === 2) classes += " max-large_phone:hidden";
    if (data.step === 1 || data.step === 3)
      classes += " max-smallest_phone:hidden";

    return classes;
  }, [data.step]);

  return (
    <div
      className={containerClasses}
      style={data.noline ? { display: "grid", placeContent: "start" } : {}}
    >
      <div className={styles.stepIndicator.indicator}>
        <CircleSvg control={sequence} step={data.step} active={isActive} />
        <h3
          className={`${styles.stepIndicator.title} ${
            isActive ? "text-blue-600 font-semibold" : ""
          }`}
        >
          {data.title}
        </h3>
      </div>
      {!data.noline && (
        <div className={lineClasses}>
          <LineSvg control={linesequence} />
        </div>
      )}
    </div>
  );
});

StepComponent.displayName = "StepComponent";

// Price Display Component
const ShowPrice = memo<{
  price: Orderpricetype;
  total: number;
  qty: number;
}>(({ price, total, qty }) => {
  const { discount } = price;
  const isDiscount = Boolean(discount?.percent);

  const displayPrice = useMemo(() => {
    return isDiscount && discount?.newprice
      ? discount.newprice.toFixed(2)
      : price.price.toFixed(2);
  }, [isDiscount, discount?.newprice, price.price]);

  const formattedTotal = useMemo(() => {
    return total.toFixed(2);
  }, [total]);

  return (
    <div className={styles.price.container}>
      <div className={styles.price.details}>
        {isDiscount && discount && (
          <>
            <span className={styles.price.original}>
              ${price.price.toFixed(2)}
            </span>
            <Chip color="danger" variant="flat" size="sm">
              -{discount.percent}%
            </Chip>
          </>
        )}
        <span className={styles.price.current}>${displayPrice}</span>
        <span className={styles.price.quantity}>×{qty}</span>
      </div>
      <span className={styles.price.total}>${formattedTotal}</span>
    </div>
  );
});

ShowPrice.displayName = "ShowPrice";

// Product Card Component
export const Checkoutproductcard = memo<CheckoutProductCardProps>(
  ({ qty, price, cover, details, name, total }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = useCallback(() => {
      setImageLoading(false);
    }, []);

    const handleImageError = useCallback(() => {
      setImageLoading(false);
      setImageError(true);
    }, []);

    return (
      <Card className={styles.productCard.container}>
        <CardBody className={styles.productCard.content}>
          <div className="relative">
            {imageLoading && (
              <Skeleton className="w-[150px] h-[150px] rounded-lg" />
            )}
            <Image
              src={imageError ? "/placeholder-image.jpg" : cover}
              width={150}
              height={150}
              alt={`${name} product image`}
              className={`${styles.productCard.image} ${
                imageLoading ? "hidden" : "block"
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority
            />
          </div>

          <div className={styles.productCard.details}>
            <h3 className={styles.productCard.title}>{name}</h3>

            {details && details.length > 0 && (
              <div className={styles.productCard.variants}>
                {details.map((item, idx) => (
                  <Selecteddetailcard key={`detail-${idx}`} text={item} />
                ))}
              </div>
            )}

            <div className={styles.productCard.priceSection}>
              <ShowPrice total={total} qty={qty} price={price} />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }
);

Checkoutproductcard.displayName = "Checkoutproductcard";

// Shipping Service Card Component
export const Shippingservicecard = memo<ShippingServiceCardProps>(
  ({ type, price, estimate, value, isSelected, orderId, onUpdate }) => {
    const [loading, setLoading] = useState(false);

    const formattedPrice = useMemo(() => {
      return `$${price.toFixed(2)}`;
    }, [price]);

    const handleClick = useCallback(async () => {
      if (loading || isSelected) return;

      setLoading(true);
      try {
        const result = await updateShippingService(orderId, value);

        if (result.success) {
          successToast("Shipping service updated successfully");
          onUpdate?.();
        } else {
          errorToast(result.message || "Failed to update shipping service");
        }
      } catch (error) {
        console.error("Shipping service update error:", error);
        errorToast("An error occurred while updating shipping service");
      } finally {
        setLoading(false);
      }
    }, [loading, isSelected, orderId, value, onUpdate]);

    const cardClasses = useMemo(() => {
      let classes = styles.shippingCard.base;

      if (loading) classes += ` ${styles.shippingCard.disabled}`;
      else if (isSelected) classes += ` ${styles.shippingCard.selected}`;
      else classes += ` ${styles.shippingCard.unselected}`;

      return classes;
    }, [isSelected, loading]);

    return (
      <>
        {loading && <LoadingText />}
        <Card
          isPressable={!loading && !isSelected}
          onPress={handleClick}
          className={cardClasses}
        >
          <CardBody className={styles.shippingCard.content}>
            <div className="flex items-center justify-between">
              <h3 className={styles.shippingCard.title}>{type}</h3>
              {isSelected && (
                <Chip color="success" variant="flat" size="sm">
                  Selected
                </Chip>
              )}
            </div>

            <div className={styles.shippingCard.price}>{formattedPrice}</div>

            <p className={styles.shippingCard.estimate}>{estimate}</p>

            {loading && (
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              </div>
            )}
          </CardBody>
        </Card>
      </>
    );
  }
);

Shippingservicecard.displayName = "Shippingservicecard";

// Step Indicator Component
export const StepIndicator = memo<{ step: number }>(({ step }) => {
  const stepData = useMemo(() => {
    return STEPS_INITIAL.map((item) => ({
      ...item,
      active: item.step <= step, // Mark all previous steps as active
    }));
  }, [step]);

  return (
    <div className={styles.stepIndicator.container}>
      {stepData.map((item) => (
        <StepComponent
          key={`step-${item.step}`}
          data={item}
          isActive={item.step === step} // Only current step is "active"
        />
      ))}
    </div>
  );
});

StepIndicator.displayName = "StepIndicator";

export default StepIndicator;
