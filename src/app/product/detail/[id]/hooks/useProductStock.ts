import { useState, useCallback, useEffect } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import { Productorderdetailtype } from "@/src/types/order.type";

let stockCheckTimeout: NodeJS.Timeout | null = null;
let cartCheckTimeout: NodeJS.Timeout | null = null;

/**
 * Hook for fetching available quantity from backend API based on selected variants.
 * Uses debouncing to prevent excessive API calls.
 */
export const useStockCheck = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableQuantity = useCallback(
    async (
      productId: number,
      selectedVariants: Productorderdetailtype[],
    ): Promise<number> => {
      setIsLoading(true);

      // Clear previous timeout
      if (stockCheckTimeout) {
        clearTimeout(stockCheckTimeout);
      }

      return new Promise((resolve) => {
        stockCheckTimeout = setTimeout(async () => {
          try {
            const response = await ApiRequest(
              "/api/products/stock/available",
              undefined,
              "POST",
              "JSON",
              {
                productId,
                selectedVariants: selectedVariants.filter(
                  (i) => i && i.value && i.value.length > 0,
                ),
              },
            );

            if (response.success) {
              resolve(response.data.availableQuantity || 0);
            } else {
              console.log("Error fetching stock:", response.error);
              resolve(0);
            }
          } catch (error) {
            console.log("Error fetching available quantity:", error);
            resolve(0);
          } finally {
            setIsLoading(false);
          }
        }, 300); // 300ms debounce
      });
    },
    [],
  );

  return { fetchAvailableQuantity, isLoading };
};

/**
 * Hook for checking if a product with specific variants is already in cart.
 * Uses debouncing to prevent excessive API calls.
 */
export const useCartCheck = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkInCart = useCallback(
    async (
      selecteddetail: Productorderdetailtype[],
      pid: number,
    ): Promise<{ success: boolean; incart: boolean }> => {
      setIsLoading(true);

      // Clear previous timeout
      if (cartCheckTimeout) {
        clearTimeout(cartCheckTimeout);
      }

      return new Promise((resolve) => {
        cartCheckTimeout = setTimeout(async () => {
          try {
            const req = await ApiRequest(
              "/api/order/cart/check",
              undefined,
              "POST",
              "JSON",
              { selecteddetail, pid },
            );
            resolve({
              success: req.success,
              incart: (req.data?.incart ?? false) as boolean,
            });
          } catch (error) {
            console.log("Cart check failed:", error);
            resolve({ success: false, incart: false });
          } finally {
            setIsLoading(false);
          }
        }, 300); // 300ms debounce
      });
    },
    [],
  );

  return { checkInCart, isLoading };
};

/**
 * Hook for computing option-level quantity constraints from selected variants
 */
export const useOptionQuantity = () => {
  const computeOptionQty = useCallback(
    (selectedDetails: Productorderdetailtype[], variants: any[]) => {
      let maxQty = Infinity;

      for (const detail of selectedDetails) {
        const variant = variants.find((v) => v.id === detail.variant_id);
        if (!variant) continue;

        const selectedOption = (variant.option_value as any[]).find((opt) =>
          typeof opt === "string"
            ? opt === detail.value
            : opt.val === detail.value,
        );

        if (
          selectedOption &&
          typeof selectedOption !== "string" &&
          selectedOption.qty !== undefined
        ) {
          const optionQty =
            typeof selectedOption.qty === "number"
              ? selectedOption.qty
              : parseInt(selectedOption.qty || "0");
          maxQty = Math.min(maxQty, optionQty);
        }
      }

      return maxQty === Infinity ? 0 : maxQty;
    },
    [],
  );

  return { computeOptionQty };
};
