"use client";

import React, { useMemo, useCallback } from "react";
import { SelectContainer } from "@/src/app/component/Button";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ProductState, VariantValueObjType } from "@/src/types/product.type";
import {
  Productorderdetailtype,
  Productordertype,
} from "@/src/types/order.type";
import { errorToast } from "@/src/app/component/Loading";
import {
  useStockCheck,
  useCartCheck,
  useOptionQuantity,
} from "../hooks/useProductStock";
import {
  isOptionAvailable,
  getOptionQuantity,
  areRequiredVariantsSelected,
  getRequiredVariantDetails,
  getAllSelectedDetails,
} from "../utils/productHelpers";
import { ErrorMessageType } from "./StockSelector";

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
    errormess,
    setmess,
    setqty,
    setloading,
    setincart,
  } = props;

  const { productorderdetail, setproductorderdetail } = useGlobalContext();
  const { fetchAvailableQuantity } = useStockCheck();
  const { checkInCart } = useCartCheck();
  const { computeOptionQty } = useOptionQuantity();

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

  // Check if the currently selected option for an optional variant is out of stock
  const isSelectedOptionalOutOfStock = useMemo(() => {
    if (!isOptionalVariant || !selected) return false;
    const variant = prob.Variant?.find((v) => v.id === id);
    if (!variant) return false;
    const option = (
      variant.option_value as (string | VariantValueObjType)[]
    ).find((opt) =>
      typeof opt === "string" ? opt === selected : opt.val === selected,
    );
    return !isOptionAvailable(option ?? selected);
  }, [isOptionalVariant, selected, prob.Variant, id]);

  const handleSelectVariant = useCallback(
    async (idx: number, value: string) => {
      const variant = prob.Variant?.[idx];
      if (!variant || !productorderdetail?.details) return;

      // Check if the selected option is available
      const selectedOption = (
        variant.option_value as (string | VariantValueObjType)[]
      ).find((opt) =>
        typeof opt === "string" ? opt === value : opt.val === value,
      );

      // For required variants, block selection of out-of-stock options.
      // For optional variants, allow selection even if out of stock
      // (qty impact is ignored; an indicator is shown in the UI instead).
      if (!isOptionalVariant && !isOptionAvailable(selectedOption || value)) {
        errorToast("This option is out of stock");
        return;
      }

      // Update order details
      const updatedOrderDetail = updateOrderDetail(
        productorderdetail,
        id,
        idx,
        value,
        selected,
      );

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
        setmess({ qty: "", option: "Please select all required option" });
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
          computeOptionQty,
        );

        // When no DB stock records and qty was auto-defaulted to 1,
        // auto-select quantity = 1 so Add to Cart is immediately enabled.
        const hasNoStockRecords = !prob.Stock || prob.Stock.length === 0;
        if (hasNoStockRecords && finalQty === 1) {
          setproductorderdetail((prev) => ({ ...prev, quantity: 1 }));
        }
      }, 0);
    },
    [
      prob,
      productorderdetail,
      selected,
      id,
      isOptionalVariant,
      setincart,
      setloading,
      setmess,
      setqty,
      setproductorderdetail,
      fetchAvailableQuantity,
      checkInCart,
      computeOptionQty,
    ],
  );

  return (
    <div className="w-full h-fit flex flex-col gap-y-5">
      <label htmlFor={name} className="text-lg font-bold w-fit h-fit">
        {name}
      </label>
      <SelectContainer
        type={type}
        data={data}
        onSelect={(val) => handleSelectVariant(idx, val)}
        isSelected={selected}
        allowOutOfStock={isOptionalVariant}
      />
      {isSelectedOptionalOutOfStock && (
        <p className="text-sm text-orange-500 font-medium mt-1">
          ⚠ Selected option is out of stock — it will not affect available
          quantity
        </p>
      )}
    </div>
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
  currentSelected: string | undefined,
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
  computeOptionQty: (
    selectedDetails: Productorderdetailtype[],
    variants: any[],
  ) => number,
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

    // Check option-level qty for ALL selected variants (collect all for cart-check)
    const allSelectedDetails = getAllSelectedDetails(orderDetail?.details);

    // Only use REQUIRED variant options for product QTY calculation.
    // Optional variants only affect price — their out-of-stock status does not
    // reduce the available quantity shown to the buyer.
    const requiredSelectedDetails = allSelectedDetails.filter((detail) => {
      const v = (prob.Variant || []).find((v) => v.id === detail.variant_id);
      return v && !v.optional;
    });
    const optionQty = computeOptionQty(
      requiredSelectedDetails,
      prob.Variant || [],
    );

    // Take the minimum of stock qty and option qty
    if (optionQty > 0) {
      maxqty = Math.min(maxqty > 0 ? maxqty : Infinity, optionQty);
    }

    // If maxqty is still Infinity, it means we only have option-level qty
    if (maxqty === Infinity) {
      maxqty = 0;
    }

    // Products with Variants/VariantSections but no DB Stock records:
    // default qty to 1 when no option explicitly defines a qty field.
    // (If an option has qty:0 it is already blocked in isOptionAvailable,
    //  and if it has qty>0 the optionQty branch above already handled it.)
    const hasNoStockRecords = !prob.Stock || prob.Stock.length === 0;
    if (hasNoStockRecords && maxqty === 0) {
      const hasExplicitOptionQty = allSelectedDetails.some((detail) => {
        const variant = (prob.Variant || []).find(
          (v) => v.id === detail.variant_id,
        );
        // Optional variants do not gate product availability
        if (!variant || variant.optional) return false;
        const opt = (variant.option_value as any[]).find((o: any) =>
          typeof o === "string" ? o === detail.value : o.val === detail.value,
        );
        return opt && typeof opt !== "string" && opt.qty !== undefined;
      });

      if (!hasExplicitOptionQty) {
        // No stock tracking at any level — treat as available with qty 1
        maxqty = 1;
      }
      // hasExplicitOptionQty && maxqty === 0 → option explicitly has qty 0 → truly OOS
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
