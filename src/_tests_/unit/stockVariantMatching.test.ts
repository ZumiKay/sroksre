import { calculateAvailableQuantity } from "@/src/app/api/products/stock/available/helper";
import {
  getmaxqtybaseStockType,
  HasExactMatch,
  HasPartialOverlap,
} from "@/src/lib/utilities";
import { Stocktype, ProductState } from "@/src/types/product.type";

describe("Stock & Variant Matching Unit Tests", () => {
  describe("calculateAvailableQuantity", () => {
    const mockStockData: Stocktype[] = [
      {
        id: 1,
        qty: 25,
        Stockvalue: [
          {
            id: 101,
            qty: 5,
            variant_val: ["Blue", "M"],
          },
          {
            id: 102,
            qty: 12,
            variant_val: ["Red", "M"],
          },
          {
            id: 103,
            qty: 8,
            variant_val: ["Blue", "L"],
          },
        ],
      },
      {
        id: 2,
        qty: 20,
        Stockvalue: [
          {
            id: 201,
            qty: 20,
            variant_val: ["Green", "XL", "Cotton"],
          },
        ],
      },
    ];

    it("returns exact match quantity when all variant values match exactly", () => {
      const selected = [
        { variant_id: 1, value: "Blue" },
        { variant_id: 2, value: "M" },
      ];
      const qty = calculateAvailableQuantity(mockStockData, selected);
      expect(qty).toBe(5);
    });

    it("sums quantities for partial matches across matching items", () => {
      // Selected only "M": matches ["Blue", "M"] (qty 5) and ["Red", "M"] (qty 12)
      const selected = [{ variant_id: 2, value: "M" }];
      const qty = calculateAvailableQuantity(mockStockData, selected);
      expect(qty).toBe(17); // 5 + 12
    });

    it("sums partial matches for single attribute in 3-attribute variant", () => {
      const selected = [{ variant_id: 3, value: "Cotton" }];
      const qty = calculateAvailableQuantity(mockStockData, selected);
      expect(qty).toBe(20);
    });

    it("returns 0 when no stock matches the selected combination", () => {
      const selected = [
        { variant_id: 1, value: "Yellow" },
        { variant_id: 2, value: "M" },
      ];
      const qty = calculateAvailableQuantity(mockStockData, selected);
      expect(qty).toBe(0);
    });

    it("returns 0 when selected variants array is empty or values are blank", () => {
      expect(calculateAvailableQuantity(mockStockData, [])).toBe(0);
      expect(
        calculateAvailableQuantity(mockStockData, [
          { variant_id: 1, value: "" },
        ])
      ).toBe(0);
    });

    it("ignores 'null' string and empty values inside variant_val properly", () => {
      const dirtyStockData: Stocktype[] = [
        {
          id: 1,
          qty: 15,
          Stockvalue: [
            {
              id: 301,
              qty: 15,
              variant_val: ["Black", "null", ""],
            },
          ],
        },
      ];

      const selected = [{ variant_id: 1, value: "Black" }];
      const qty = calculateAvailableQuantity(dirtyStockData, selected);
      // ["Black", "null", ""] after filtering only has ["Black"], so exact match = 15
      expect(qty).toBe(15);
    });
  });

  describe("getmaxqtybaseStockType", () => {
    it("returns simple stock count when stocktype is 'stock'", () => {
      const product = {
        stocktype: "stock",
        stock: 42,
      } as ProductState;

      const qty = getmaxqtybaseStockType(product, ["anything"]);
      expect(qty).toBe(42);
    });

    it("finds matching variant quantity when stocktype is 'variant'", () => {
      const product = {
        stocktype: "variant",
        Stock: [
          {
            id: 1,
            product_id: 5,
            Stockvalue: [
              {
                id: 11,
                qty: 14,
                variant_val: ["Red", "Small"],
              },
              {
                id: 12,
                qty: 7,
                variant_val: ["Blue", "Small"],
              },
            ],
          },
        ],
      } as unknown as ProductState;

      expect(getmaxqtybaseStockType(product, ["Red", "Small"])).toBe(14);
      expect(getmaxqtybaseStockType(product, ["Blue", "Small"])).toBe(7);
      expect(getmaxqtybaseStockType(product, ["Green", "Large"])).toBe(0);
    });
  });

  describe("HasExactMatch and HasPartialOverlap", () => {
    it("HasExactMatch returns true for matching sets regardless of array order", () => {
      const arr1 = [["A", "B"], ["C", "D"]];
      const arr2 = [["C", "D"], ["A", "B"]];
      expect(HasExactMatch(arr1, arr2)).toBe(true);
    });

    it("HasExactMatch returns false when sizes differ or elements don't match", () => {
      const arr1 = [["A", "B"]];
      const arr2 = [["A", "B"], ["C", "D"]];
      expect(HasExactMatch(arr1, arr2)).toBe(false);

      const arr3 = [["A", "B"], ["E", "F"]];
      expect(HasExactMatch(arr1, arr3)).toBe(false);
    });

    it("HasPartialOverlap returns true if any combination is shared", () => {
      const arr1 = [["A", "B"], ["C", "D"]];
      const arr2 = [["X", "Y"], ["C", "D"]];
      expect(HasPartialOverlap(arr1, arr2)).toBe(true);
    });

    it("HasPartialOverlap returns false when combinations are completely disjoint", () => {
      const arr1 = [["A", "B"], ["C", "D"]];
      const arr2 = [["E", "F"], ["G", "H"]];
      expect(HasPartialOverlap(arr1, arr2)).toBe(false);
    });
  });
});
