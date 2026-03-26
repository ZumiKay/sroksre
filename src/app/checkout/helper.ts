import {
  Allstatus,
  Ordertype,
  Productorderdetailtype,
  Productordertype,
  ShippingTypeEnum,
  VariantOptionsType,
  VariantPriceBreakdown,
} from "@/src/types/order.type";
import { Varianttype, VariantValueObjType } from "@/src/types/product.type";

export function hasValidBuyer(order: Ordertype): boolean {
  return !!(order.buyer_id && order.user && order.user.email);
}

export function hasProducts(order: Ordertype): boolean {
  return order.Orderproduct && order.Orderproduct.length > 0;
}

export function hasValidQuantities(order: Ordertype): boolean {
  if (!order.Orderproduct) return false;
  return order.Orderproduct.every(
    (product) =>
      product.quantity > 0 && product.quantity <= (product.maxqty || Infinity),
  );
}

export function hasValidPrice(order: Ordertype): boolean {
  const { price } = order;
  if (!price || price.total <= 0 || price.subtotal <= 0) return false;

  // Check if total is at least equal to subtotal
  return price.total >= price.subtotal;
}

export function hasValidShipping(order: Ordertype): boolean {
  return !!(
    order.shippingtype &&
    Object.values(ShippingTypeEnum).includes(order.shippingtype)
  );
}

export function hasShippingAddress(order: Ordertype): boolean {
  if (order.shippingtype === ShippingTypeEnum.pickup) {
    return true; // No address needed for pickup
  }
  return !!(order.shipping_id && order.shipping);
}

export function hasValidStatus(order: Ordertype): boolean {
  return !!(order.status && Object.values(Allstatus).includes(order.status));
}

export function hasValidProductDetails(product: Productordertype): boolean {
  if (!product.details || product.details.length === 0) {
    return true; // Details are optional
  }
  return product.details.every((detail) => detail.variant_id && detail.value);
}

export function hasValidProductPrice(product: Productordertype): boolean {
  const { price } = product;
  if (!price || price.price <= 0) return false;

  // If discount exists, validate it
  if (price.discount) {
    const { percent, newprice } = price.discount;
    if (percent !== undefined && (percent < 0 || percent > 100)) return false;
    if (newprice !== undefined && newprice >= price.price) return false;
  }

  return true;
}

export function calculateOrderTotal(products: Productordertype[]): number {
  return products.reduce((total, product) => {
    const price =
      product.price.discount?.newprice ??
      (product.price.price + (product.price.extra ?? 0));
    return total + price * product.quantity;
  }, 0);
}

/**
 * Check if order total matches product prices
 */
export function isPricingConsistent(order: Ordertype): boolean {
  const calculatedSubtotal = calculateOrderTotal(order.Orderproduct);
  const { price } = order;

  // Allow small floating point differences
  const difference = Math.abs(price.subtotal - calculatedSubtotal);
  return difference < 0.01;
}

/**
 * Check if order can be placed (all validations pass)
 */
export function canPlaceOrder(order: Ordertype): boolean {
  return (
    hasValidBuyer(order) &&
    hasProducts(order) &&
    hasValidQuantities(order) &&
    hasValidPrice(order) &&
    hasValidShipping(order) &&
    hasShippingAddress(order) &&
    hasValidStatus(order) &&
    order.Orderproduct.every(
      (product) =>
        hasValidProductDetails(product) && hasValidProductPrice(product),
    )
  );
}

/**
 * Get validation errors for an order
 */
export function getOrderValidationErrors(order: Ordertype): string[] {
  const errors: string[] = [];

  if (!hasValidBuyer(order)) {
    errors.push("Invalid buyer information");
  }

  if (!hasProducts(order)) {
    errors.push("Order must have at least one product");
  }

  if (!hasValidQuantities(order)) {
    errors.push("Invalid product quantities");
  }

  if (!hasValidPrice(order)) {
    errors.push("Invalid order price");
  }

  if (!hasValidShipping(order)) {
    errors.push("Invalid shipping type");
  }

  if (!hasShippingAddress(order)) {
    errors.push("Missing shipping address");
  }

  if (!hasValidStatus(order)) {
    errors.push("Invalid order status");
  }

  order.Orderproduct.forEach((product, index) => {
    if (!hasValidProductDetails(product)) {
      errors.push(`Invalid details for product ${index + 1}`);
    }
    if (!hasValidProductPrice(product)) {
      errors.push(`Invalid price for product ${index + 1}`);
    }
  });

  if (!isPricingConsistent(order)) {
    errors.push("Order pricing is inconsistent");
  }

  return errors;
}

export function isOrderPaid(order: Ordertype): boolean {
  return (
    order.status === Allstatus.paid ||
    order.status === Allstatus.prepareing ||
    order.status === Allstatus.shipped ||
    order.status === Allstatus.arrived
  );
}

export function isOrderCompleted(order: Ordertype): boolean {
  return order.status === Allstatus.arrived;
}

export function canCancelOrder(order: Ordertype): boolean {
  return (
    order.status === Allstatus.incart ||
    order.status === Allstatus.unpaid ||
    order.status === Allstatus.paid
  );
}

export function isInCart(order: Ordertype): boolean {
  return order.status === Allstatus.incart;
}

export function needsPayment(order: Ordertype): boolean {
  return order.status === Allstatus.unpaid;
}

export function sanitizeOrderData(order: Ordertype): Partial<Ordertype> {
  return {
    buyer_id: order.buyer_id,
    Orderproduct: order.Orderproduct.map((product) => ({
      id: product.id,
      quantity: product.quantity,
      price: product.price,
      productId: product.productId,
      details: product.details,
    })),
    status: order.status,
    price: order.price,
    shippingtype: order.shippingtype,
    shipping_id: order.shipping_id,
    estimate: order.estimate,
  };
}

export const getVariantDetail = ({
  val,
  productvariant,
}: {
  val: string;
  productvariant: Varianttype;
}): VariantOptionsType | null => {
  let finalPrice = 0;

  //Verify
  if (
    !productvariant.price &&
    typeof productvariant.option_value === "string" &&
    (productvariant.option_value as Array<VariantValueObjType>).every(
      (i) => !i.price || Number(i.price) === 0,
    )
  ) {
    return null;
  }

  if (productvariant.price) finalPrice = productvariant.price;
  else {
    (productvariant.option_value as Array<VariantValueObjType>).forEach(
      (variant) => {
        if (variant.val === val && variant.price && Number(variant.price) !== 0)
          finalPrice = parseFloat(variant.price);
      },
    );
  }

  return {
    name: (typeof productvariant.option_value !== "string"
      ? productvariant.option_value.find((i) =>
          typeof i === "string" ? i === val : i.val === val,
        )
      : val) as never,
    price: finalPrice,
  };
};

export const getVariantPriceBreakDownByActiveCart = (
  orderProduct: Productordertype[],
  optionsPrice: VariantOptionsType[],
): VariantPriceBreakdown => {
  const productName =
    orderProduct.length === 1
      ? (orderProduct[0]?.product?.name ?? "Cart Item")
      : "Cart Items";

  if (optionsPrice.length > 0) {
    return {
      productName,
      variantOptions: optionsPrice,
    };
  }

  const variantOptions = orderProduct.flatMap((item) => {
    if (!item.product || !item.details) return [];

    const details = item.details as Productorderdetailtype[];
    const variants = item.product.Variant ?? [];

    return details
      .map((detail) => {
        const matchedVariant = variants.find((v) => v.id === detail.variant_id);
        if (!matchedVariant) return null;

        return getVariantDetail({
          val: detail.value,
          productvariant: matchedVariant as Varianttype,
        });
      })
      .filter(Boolean) as VariantOptionsType[];
  });

  return {
    productName,
    variantOptions,
  };
};
