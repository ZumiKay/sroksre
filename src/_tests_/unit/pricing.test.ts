import {
  calculateDiscountProductPrice,
  calculateCartTotalPrice,
} from "@/src/lib/utilities";
import {
  calculateOrderTotal,
  isPricingConsistent,
  hasValidProductPrice,
  hasValidQuantities,
  hasValidPrice,
} from "@/src/app/checkout/helper";
import { Productordertype, Ordertype } from "@/src/types/order.type";

describe("Pricing and Discount Unit Tests", () => {
  describe("calculateDiscountProductPrice", () => {
    it("returns original price when no discount is provided", () => {
      const result = calculateDiscountProductPrice({ price: 100 });
      expect(result).toEqual({ price: 100 });
      expect(result.discount).toBeUndefined();
    });

    it("calculates exact discounted price for whole percentage", () => {
      const result = calculateDiscountProductPrice({ price: 100, discount: 20 });
      expect(result.price).toBe(100);
      expect(result.discount).toBeDefined();
      expect(result.discount?.percent).toBe(20);
      expect(result.discount?.newprice).toBe(80);
    });

    it("handles 100% discount (free item)", () => {
      const result = calculateDiscountProductPrice({ price: 49.99, discount: 100 });
      expect(result.discount?.newprice).toBe(0);
      expect(result.discount?.percent).toBe(100);
    });

    it("correctly rounds fractional cents with two decimal precision", () => {
      // 15.5% discount on $99.99: 99.99 - (99.99 * 0.155) = 84.49155 -> 84.49
      const result = calculateDiscountProductPrice({ price: 99.99, discount: 15.5 });
      expect(result.discount?.newprice).toBe(84.49);
      expect(result.discount?.percent).toBe(15.5);
    });

    it("handles 0% discount by returning same price without discount", () => {
      const result = calculateDiscountProductPrice({ price: 50, discount: 0 });
      expect(result).toEqual({ price: 50 });
    });
  });

  describe("calculateCartTotalPrice", () => {
    it("returns 0 for an empty cart", () => {
      const total = calculateCartTotalPrice([]);
      expect(total).toBe(0);
    });

    it("calculates total for standard single item without discount", () => {
      const items = [
        {
          quantity: 2,
          price: { price: 25 },
        },
      ] as Productordertype[];

      const total = calculateCartTotalPrice(items);
      expect(total).toBe(50);
    });

    it("uses discount.newprice when discount exists", () => {
      const items = [
        {
          quantity: 3,
          price: {
            price: 50,
            discount: { percent: 20, newprice: 40 },
          },
        },
      ] as Productordertype[];

      const total = calculateCartTotalPrice(items);
      expect(total).toBe(120); // 3 * 40
    });

    it("adds variant extra on top of base price when no discount is active", () => {
      const items = [
        {
          quantity: 2,
          price: {
            price: 30,
            extra: 5,
          },
        },
      ] as Productordertype[];

      const total = calculateCartTotalPrice(items);
      expect(total).toBe(70); // 2 * (30 + 5)
    });

    it("sums multiple different items with mixed discounts and quantities", () => {
      const items = [
        {
          quantity: 1,
          price: { price: 100, discount: { percent: 10, newprice: 90 } },
        },
        {
          quantity: 2,
          price: { price: 15, extra: 5 }, // 2 * 20 = 40
        },
        {
          quantity: 4,
          price: { price: 10 }, // 4 * 10 = 40
        },
      ] as Productordertype[];

      const total = calculateCartTotalPrice(items);
      expect(total).toBe(170); // 90 + 40 + 40
    });
  });

  describe("calculateOrderTotal and isPricingConsistent", () => {
    it("calculates order total matching individual line items", () => {
      const products = [
        { quantity: 2, price: { price: 20 } },
        { quantity: 1, price: { price: 50, discount: { newprice: 45, percent: 10 } } },
      ] as Productordertype[];

      expect(calculateOrderTotal(products)).toBe(85); // 40 + 45
    });

    it("returns true when order price subtotal matches products within 0.01 tolerance", () => {
      const mockOrder = {
        price: { subtotal: 85.004, total: 95 },
        Orderproduct: [
          { quantity: 2, price: { price: 20 } },
          { quantity: 1, price: { price: 50, discount: { newprice: 45, percent: 10 } } },
        ],
      } as unknown as Ordertype;

      expect(isPricingConsistent(mockOrder)).toBe(true);
    });

    it("returns false when subtotal significantly differs from item calculations", () => {
      const mockOrder = {
        price: { subtotal: 50, total: 60 },
        Orderproduct: [
          { quantity: 2, price: { price: 20 } },
          { quantity: 1, price: { price: 50, discount: { newprice: 45, percent: 10 } } },
        ],
      } as unknown as Ordertype;

      expect(isPricingConsistent(mockOrder)).toBe(false);
    });
  });

  describe("Validation Helpers: hasValidProductPrice, hasValidQuantities, hasValidPrice", () => {
    it("validates product prices properly", () => {
      // Valid normal price
      expect(hasValidProductPrice({ price: { price: 20 } } as any)).toBe(true);

      // Invalid <= 0 price
      expect(hasValidProductPrice({ price: { price: 0 } } as any)).toBe(false);
      expect(hasValidProductPrice({ price: { price: -5 } } as any)).toBe(false);

      // Invalid discount percentage
      expect(
        hasValidProductPrice({
          price: { price: 20, discount: { percent: 110, newprice: 15 } },
        } as any)
      ).toBe(false);
      expect(
        hasValidProductPrice({
          price: { price: 20, discount: { percent: -5, newprice: 15 } },
        } as any)
      ).toBe(false);

      // Invalid discount newprice (greater than or equal to original price)
      expect(
        hasValidProductPrice({
          price: { price: 20, discount: { percent: 10, newprice: 25 } },
        } as any)
      ).toBe(false);
      expect(
        hasValidProductPrice({
          price: { price: 20, discount: { percent: 10, newprice: 20 } },
        } as any)
      ).toBe(false);
    });

    it("validates product quantities against maxqty and positive values", () => {
      const validOrder = {
        Orderproduct: [
          { quantity: 2, maxqty: 5 },
          { quantity: 1, maxqty: 1 },
        ],
      } as unknown as Ordertype;
      expect(hasValidQuantities(validOrder)).toBe(true);

      const invalidZeroQty = {
        Orderproduct: [{ quantity: 0, maxqty: 5 }],
      } as unknown as Ordertype;
      expect(hasValidQuantities(invalidZeroQty)).toBe(false);

      const invalidNegativeQty = {
        Orderproduct: [{ quantity: -2, maxqty: 5 }],
      } as unknown as Ordertype;
      expect(hasValidQuantities(invalidNegativeQty)).toBe(false);

      const exceedsMaxQty = {
        Orderproduct: [{ quantity: 10, maxqty: 5 }],
      } as unknown as Ordertype;
      expect(hasValidQuantities(exceedsMaxQty)).toBe(false);
    });

    it("validates order price totals (total must be >= subtotal and both > 0)", () => {
      expect(hasValidPrice({ price: { subtotal: 50, total: 60 } } as any)).toBe(true);
      expect(hasValidPrice({ price: { subtotal: 50, total: 50 } } as any)).toBe(true);

      // Total less than subtotal
      expect(hasValidPrice({ price: { subtotal: 50, total: 40 } } as any)).toBe(false);

      // Zero or negative
      expect(hasValidPrice({ price: { subtotal: 0, total: 0 } } as any)).toBe(false);
      expect(hasValidPrice({ price: { subtotal: -10, total: 10 } } as any)).toBe(false);
    });
  });
});
