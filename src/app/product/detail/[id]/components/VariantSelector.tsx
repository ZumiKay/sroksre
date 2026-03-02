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

      if (!isOptionAvailable(selectedOption || value)) {
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
        await fetchAndUpdateQuantity(
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
      }, 0);
    },
    [
      prob,
      productorderdetail,
      selected,
      id,
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
      />
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
 * Helper function to fetch available quantity and update state
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
) {
  setloading(true);
  try {
    const requiredVariantDetails = getRequiredVariantDetails(
      orderDetail?.details,
      prob.Variant || [],
    );

    let maxqty = prob.id
      ? await fetchAvailableQuantity(prob.id, requiredVariantDetails)
      : 0;

    // Check option-level qty for ALL selected variants (both required and optional)
    const allSelectedDetails = getAllSelectedDetails(orderDetail?.details);
    const optionQty = computeOptionQty(allSelectedDetails, prob.Variant || []);

    // Take the minimum of stock qty and option qty
    if (optionQty > 0) {
      maxqty = Math.min(maxqty > 0 ? maxqty : Infinity, optionQty);
    }

    // If maxqty is still Infinity, it means we only have option-level qty
    if (maxqty === Infinity) {
      maxqty = 0;
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
  } finally {
    setloading(false);
  }
}
