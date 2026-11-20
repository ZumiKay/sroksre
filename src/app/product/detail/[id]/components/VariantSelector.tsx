"use client";

import React, { useMemo, useCallback } from "react";
import { OptionPicker } from "./OptionPicker";
import { useGlobalStore } from "@/src/context/GlobalContext";
import {
  ProductState,
  VariantValueObjType,
} from "@/src/types/product.type";
import {
  Productorderdetailtype,
  Productordertype,
} from "@/src/types/order.type";
import { useStockCheck, useCartCheck } from "../hooks/useProductStock";
import {
  areRequiredVariantsSelected,
  getRequiredVariantDetails,
  getAllSelectedDetails,
} from "../utils/productHelpers";
import { ErrorMessageType } from "./StockSelector";
import {
  clearInactiveSelections,
  describeCondition,
  isVariantActive,
  parseCondition,
} from "@/src/lib/variantCondition";

interface VariantSelectorProps {
  id: number;
  name: string;
  type: "COLOR" | "TEXT";
  idx: number;
  data: (string | VariantValueObjType)[];
  prob: Pick<ProductState, "id" | "Stock" | "Variant">;
  errormess: ErrorMessageType;
  setmess: React.Dispatch<React.SetStateAction<ErrorMessageType>>;
  setqty: React.Dispatch<React.SetStateAction<number>>;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  setincart: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VariantSelector = React.memo((props: VariantSelectorProps) => {
  const {
    id,
    name,
    type,
    idx,
    data,
    prob,
    setmess,
    setqty,
    setloading,
    setincart,
  } = props;

  const productorderdetail = useGlobalStore((s) => s.productorderdetail);
  const setproductorderdetail = useGlobalStore((s) => s.setproductorderdetail);
  const { fetchAvailableQuantity } = useStockCheck();
  const { checkInCart } = useCartCheck();

  const selected = useMemo(() => {
    const detail = productorderdetail?.details
      ?.filter((i) => i)
      .find((i) => i.variant_id === id);
    return detail?.value;
  }, [productorderdetail, id]);

  // Determine if this variant is optional
  const isOptionalVariant = useMemo(() => {
    const variant = prob.Variant?.find((v) => v.id === id);
    return variant?.optional ?? false;
  }, [prob.Variant, id]);

  // Add-on variants are only selectable while their trigger option is selected
  const { isActive, conditionHint } = useMemo(() => {
    const variants = prob.Variant ?? [];
    const variant = variants.find((v) => v.id === id);
    const condition = parseCondition(variant?.condition);
    if (!variant || !condition) return { isActive: true, conditionHint: "" };
    return {
      isActive: isVariantActive(
        variant,
        variants,
        productorderdetail?.details,
      ),
      conditionHint: describeCondition(condition, variants),
    };
  }, [prob.Variant, id, productorderdetail?.details]);

  const handleSelectVariant = useCallback(
    async (idx: number, value: string) => {
      const variant = prob.Variant?.[idx];
      if (!variant || !productorderdetail?.details || !isActive) return;

      // Update order details, clearing add-ons whose trigger is no longer
      // selected
      const updatedOrderDetail = updateOrderDetail(
        productorderdetail,
        id,
        idx,
        value,
      );
      if (updatedOrderDetail.details) {
        updatedOrderDetail.details = clearInactiveSelections(
          updatedOrderDetail.details,
          prob.Variant ?? [],
        );
      }

      // Check if any selection exists after update
      const filteredDetails = updatedOrderDetail?.details?.filter(
        (i) => i?.value?.length > 0,
      );

      if (filteredDetails?.length === 0) {
        setmess({ qty: "", option: "" });
        setqty(0);
        // Reset quantity in the order detail as well
        updatedOrderDetail.quantity = 0;
        setproductorderdetail(updatedOrderDetail);
        setincart(false);
        return;
      }

      // Validate required variants
      if (!updatedOrderDetail.details) {
        setmess({ qty: "", option: "Please select option" });
        return;
      }

      const allRequiredSelected = areRequiredVariantsSelected(
        updatedOrderDetail.details,
        prob.Variant || [],
      );

      if (!allRequiredSelected) {
        // Not an error: OptionSection shows which options are still needed
        setmess({ qty: "", option: "" });
        // Still update quantity based on current selections, even if incomplete
        setqty(0);
        // Reset quantity in the order detail as well
        updatedOrderDetail.quantity = 0;
        setproductorderdetail(updatedOrderDetail);
        setincart(false);
        return;
      }

      // Update selection state first so it renders before loading starts
      setproductorderdetail(updatedOrderDetail);

      // Defer API calls slightly to ensure selection renders first
      setTimeout(async () => {
        // Fetch quantity and check cart
        const finalQty = await fetchAndUpdateQuantity(
          prob,
          updatedOrderDetail,
          setloading,
          setmess,
          setqty,
          setincart,
          fetchAvailableQuantity,
          checkInCart,
        );

        // Once the selection is complete, default the quantity to 1 and
        // keep an earlier choice within what is available, so Add to Cart
        // works without an extra step
        setproductorderdetail((prev) => ({
          ...prev,
          quantity:
            finalQty > 0
              ? Math.min(Math.max(prev.quantity || 1, 1), finalQty)
              : 0,
        }));
      }, 0);
    },
    [prob, productorderdetail, id, isActive, setincart, setloading, setmess, setqty, setproductorderdetail, fetchAvailableQuantity, checkInCart],
  );

  const selectedLabel = useMemo(() => {
    if (!selected) return "";
    const opt = data.find((o) =>
      typeof o === "string" ? o === selected : o.val === selected,
    );
    return opt && typeof opt !== "string" ? (opt.name ?? opt.val) : selected;
  }, [data, selected]);

  return (
    <fieldset
      className={`w-full flex flex-col gap-y-3 ${
        conditionHint ? "pl-4 border-l-2 border-gray-200" : ""
      }`}
    >
      <legend className="sr-only">{name}</legend>
      <div className="flex flex-col gap-y-0.5">
        <p
          className={`text-sm font-semibold ${isActive ? "text-gray-900" : "text-gray-400"}`}
        >
          {name}
          {selectedLabel && (
            <span className="font-normal text-gray-600">: {selectedLabel}</span>
          )}
          {isOptionalVariant && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              Optional
            </span>
          )}
        </p>
        {conditionHint && (
          <p className={`text-xs ${isActive ? "text-gray-500" : "text-gray-400"}`}>
            {isActive ? "Add-on for" : "Available when"} {conditionHint}
          </p>
        )}
      </div>
      <div
        inert={!isActive}
        aria-disabled={!isActive}
        className={isActive ? "" : "opacity-40 grayscale"}
      >
        <OptionPicker
          label={name}
          type={type}
          data={data}
          selected={selected}
          onSelect={(val) => handleSelectVariant(idx, val)}
        />
      </div>
    </fieldset>
  );
});

VariantSelector.displayName = "VariantSelector";

/**
 * Helper function to update order detail when variant is selected/unselected
 */
function updateOrderDetail(
  productorderdetail: Productordertype,
  variantId: number,
  idx: number,
  value: string,
): Productordertype {
  const orderDetail = { ...productorderdetail } as Productordertype;
  const validDetails = orderDetail?.details?.filter((i) => i);

  const existingDetailIdx = validDetails?.findIndex(
    (i) => i.variant_id === variantId,
  );
  const currentDetail =
    existingDetailIdx !== -1
      ? validDetails?.[existingDetailIdx as number]
      : null;
  const isSelected = currentDetail?.value === value;

  if (isSelected) {
    // Remove selection
    if (existingDetailIdx !== -1 && orderDetail.details) {
      const actualIdx = orderDetail.details.findIndex(
        (i) => i && i.variant_id === variantId,
      );
      if (actualIdx !== -1) {
        orderDetail.details[actualIdx] = { variant_id: 0, value: "" };
      }
    }
  } else {
    // Add or update selection
    if (orderDetail.details) {
      const actualIdx = orderDetail.details.findIndex(
        (i) => i && i.variant_id === variantId,
      );
      const targetIdx = actualIdx !== -1 ? actualIdx : idx;
      orderDetail.details[targetIdx] = {
        variant_id: variantId,
        value: value,
      };
    }
  }

  return orderDetail;
}

/**
 * Helper function to fetch available quantity and update state.
 * Returns the final resolved maxqty so callers can react (e.g. auto-set qty=1).
 */
async function fetchAndUpdateQuantity(
  prob: Pick<ProductState, "id" | "Stock" | "Variant">,
  orderDetail: Productordertype,
  setloading: React.Dispatch<React.SetStateAction<boolean>>,
  setmess: React.Dispatch<React.SetStateAction<ErrorMessageType>>,
  setqty: React.Dispatch<React.SetStateAction<number>>,
  setincart: React.Dispatch<React.SetStateAction<boolean>>,
  fetchAvailableQuantity: (
    productId: number,
    selectedVariants: Productorderdetailtype[],
  ) => Promise<number>,
  checkInCart: (
    selecteddetail: Productorderdetailtype[],
    pid: number,
  ) => Promise<{ success: boolean; incart: boolean }>,
): Promise<number> {
  setloading(true);
  try {
    const requiredVariantDetails = getRequiredVariantDetails(
      orderDetail?.details,
      prob.Variant || [],
    );

    let maxqty = prob.id
      ? await fetchAvailableQuantity(prob.id, requiredVariantDetails)
      : 0;

    const allSelectedDetails = getAllSelectedDetails(orderDetail?.details);

    // Products with Variants/VariantSections but no stock records aren't
    // stock-tracked: allow one at a time
    const hasNoStockRecords = !prob.Stock || prob.Stock.length === 0;
    if (hasNoStockRecords && maxqty === 0) {
      maxqty = 1;
    }

    const mess: ErrorMessageType = {
      qty: maxqty === 0 ? "Product Unavailable" : "",
      option: "",
    };

    // Check if the selected combination is already in cart
    // Use ALL selected details (not just required) to check exact combination
    if (prob.id && allSelectedDetails.length > 0) {
      const checkreq = await checkInCart(allSelectedDetails, prob.id);
      setincart(checkreq.incart);
    } else {
      // No selections, item not in cart
      setincart(false);
    }

    setmess(mess);
    setqty(maxqty);
    return maxqty;
  } finally {
    setloading(false);
  }
  return 0;
}
