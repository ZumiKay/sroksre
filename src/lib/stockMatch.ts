/**
 * Variant stock matching, shared by the product page availability check,
 * the cart quantity limit and the checkout stock hold so all three agree.
 *
 * A stock entry (Stockvalue) is a list of variant values with a quantity.
 * For the customer's selected values:
 * - Exact match: an entry whose values are exactly the selection is used on
 *   its own.
 * - Otherwise every entry containing all selected values is pooled.
 *
 * Example: A [a, b] qty 2, B [c, d] qty 4, C [a, e] qty 3.
 * Selecting "a" (b and e belong to optional variants) → A + C = 5.
 */

export interface StockEntry {
  id?: number;
  qty: number;
  variant_val: string[];
}

export interface StockAllocation {
  id: number;
  qty: number;
}

type DetailLike = { variant_id: number; value: string } | null | undefined;
type VariantLike = { id?: number; optional?: boolean | null };

const cleanValues = (values: unknown): string[] =>
  (Array.isArray(values) ? values : []).filter(
    (v): v is string => typeof v === "string" && v.length > 0 && v !== "null",
  );

/** Entries usable for the selection: the exact one, or all supersets. */
export const matchStockEntries = <T extends StockEntry>(
  entries: T[],
  selectedValues: string[],
): T[] => {
  const selected = new Set(cleanValues(selectedValues));
  if (selected.size === 0) return [];

  const matches: T[] = [];
  for (const entry of entries) {
    const values = new Set(cleanValues(entry.variant_val));
    if (values.size < selected.size) continue;
    if (![...selected].every((v) => values.has(v))) continue;
    if (values.size === selected.size) return [entry];
    matches.push(entry);
  }
  return matches;
};

export const availableStockQuantity = (
  entries: StockEntry[],
  selectedValues: string[],
): number =>
  matchStockEntries(entries, selectedValues).reduce(
    (total, entry) => total + Math.max(0, entry.qty),
    0,
  );

/**
 * Splits the selection into the values that decide stock (required variants)
 * and the optional ones, which only steer which entry is used first.
 */
export const splitSelectedValues = (
  details: DetailLike[] | unknown,
  variants: VariantLike[],
): { required: string[]; optional: string[] } => {
  const required: string[] = [];
  const optional: string[] = [];
  for (const d of Array.isArray(details) ? (details as DetailLike[]) : []) {
    if (!d || !d.value) continue;
    const variant = variants.find((v) => v.id === d.variant_id);
    if (!variant) continue;
    (variant.optional ? optional : required).push(d.value);
  }
  return { required, optional };
};

/**
 * Decides which entries to take `quantity` from. Entries that also contain
 * the customer's optional picks go first, then entries in id order.
 * Returns null when the matching entries don't have enough stock.
 */
export const allocateStock = (
  entries: Array<StockEntry & { id: number }>,
  selectedValues: string[],
  quantity: number,
  preferredValues: string[] = [],
): StockAllocation[] | null => {
  if (quantity <= 0) return [];
  const preferred = new Set(cleanValues(preferredValues));
  const score = (e: StockEntry) =>
    cleanValues(e.variant_val).filter((v) => preferred.has(v)).length;

  const pool = matchStockEntries(entries, selectedValues)
    .filter((e) => e.qty > 0)
    .sort((a, b) => score(b) - score(a) || a.id - b.id);

  const allocation: StockAllocation[] = [];
  let remaining = quantity;
  for (const entry of pool) {
    if (remaining === 0) break;
    const take = Math.min(remaining, entry.qty);
    allocation.push({ id: entry.id, qty: take });
    remaining -= take;
  }
  return remaining === 0 ? allocation : null;
};

/** Reads a saved allocation from a DB Json value; null if missing/invalid. */
export const parseStockAllocation = (raw: unknown): StockAllocation[] | null => {
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (a): a is StockAllocation =>
      !!a &&
      typeof a === "object" &&
      Number.isInteger((a as StockAllocation).id) &&
      Number.isInteger((a as StockAllocation).qty) &&
      (a as StockAllocation).qty > 0,
  );
};
