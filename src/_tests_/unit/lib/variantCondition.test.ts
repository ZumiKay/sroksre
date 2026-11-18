import {
  allowedTriggerTitles,
  clearInactiveSelections,
  describeCondition,
  isVariantActive,
  parseCondition,
  removeConditionsOn,
  updateConditionsAfterEdit,
} from "@/src/lib/variantCondition";
import type { VariantCondition } from "@/src/types/product.type";

type TestVariant = {
  id: number;
  option_title: string;
  option_value: Array<string | { val: string; name?: string }>;
  condition?: VariantCondition | null;
};

const size: TestVariant = {
  id: 1,
  option_title: "Size",
  option_value: ["S", "L"],
};
const frame: TestVariant = {
  id: 2,
  option_title: "Frame",
  option_value: [
    { val: "#000000", name: "Black" },
    { val: "#ffffff", name: "White" },
  ],
  condition: { variant: "Size", values: ["L"] },
};
const engraving: TestVariant = {
  id: 3,
  option_title: "Engraving",
  option_value: ["Yes"],
  condition: { variant: "Frame", values: ["#000000"] },
};
const variants = [size, frame, engraving];

describe("variantCondition", () => {
  it("parses only valid conditions", () => {
    expect(parseCondition(null)).toBeNull();
    expect(parseCondition({ variant: "Size", values: [] })).toBeNull();
    expect(parseCondition({ variant: "", values: ["L"] })).toBeNull();
    expect(parseCondition({ variant: "Size", values: ["L"] })).toEqual({
      variant: "Size",
      values: ["L"],
    });
  });

  it("is active only while a trigger value is selected", () => {
    expect(isVariantActive(size, variants, [])).toBe(true);
    expect(isVariantActive(frame, variants, [])).toBe(false);
    expect(
      isVariantActive(frame, variants, [{ variant_id: 1, value: "S" }]),
    ).toBe(false);
    expect(
      isVariantActive(frame, variants, [{ variant_id: 1, value: "L" }]),
    ).toBe(true);
  });

  it("requires the whole chain of triggers to be active", () => {
    // Frame is selected but its own trigger (Size L) is not
    expect(
      isVariantActive(engraving, variants, [
        { variant_id: 1, value: "S" },
        { variant_id: 2, value: "#000000" },
      ]),
    ).toBe(false);
    expect(
      isVariantActive(engraving, variants, [
        { variant_id: 1, value: "L" },
        { variant_id: 2, value: "#000000" },
      ]),
    ).toBe(true);
  });

  it("ignores a condition whose trigger no longer exists", () => {
    expect(isVariantActive(frame, [frame], [])).toBe(true);
  });

  it("clears add-on selections down the chain when a trigger changes", () => {
    const details = [
      { variant_id: 1, value: "S" },
      { variant_id: 2, value: "#000000" },
      { variant_id: 3, value: "Yes" },
    ];
    expect(clearInactiveSelections(details, variants)).toEqual([
      { variant_id: 1, value: "S" },
      { variant_id: 0, value: "" },
      { variant_id: 0, value: "" },
    ]);
  });

  it("describes a condition with option names", () => {
    expect(describeCondition(engraving.condition!, variants)).toBe(
      "Frame is Black",
    );
  });

  it("does not offer triggers that would create a cycle", () => {
    expect(allowedTriggerTitles("Size", variants)).toEqual([]);
    expect(allowedTriggerTitles("Engraving", variants)).toEqual([
      "Size",
      "Frame",
    ]);
  });

  it("follows a trigger rename and value edits", () => {
    const { variants: next, changed } = updateConditionsAfterEdit(
      variants,
      { title: "Frame", values: ["#000000", "#ffffff"] },
      { title: "Frame color", values: ["#111111", "#ffffff"] },
    );
    expect(changed).toHaveLength(1);
    expect(next[2].condition).toEqual({
      variant: "Frame color",
      values: ["#111111"],
    });
  });

  it("drops a condition when all its values are removed", () => {
    const { variants: next } = updateConditionsAfterEdit(
      variants,
      { title: "Size", values: ["S", "L"] },
      { title: "Size", values: ["S"] },
    );
    expect(next[1].condition).toBeNull();
  });

  it("removes conditions on deleted variants", () => {
    const { variants: next, changed } = removeConditionsOn(variants, [
      "Frame",
    ]);
    expect(changed.map((v) => v.id)).toEqual([3]);
    expect(next[2].condition).toBeNull();
    expect(next[1].condition).toEqual(frame.condition);
  });
});
