/**
 * Add-on (conditional) variants.
 *
 * A variant with a `condition` can only be selected when its trigger variant
 * (matched by option_title) has one of the listed values selected. While the
 * condition is not met the variant is disabled, never required, and any
 * selection it had is cleared.
 *
 * Pure functions: shared by the admin editor, the product page and the
 * server (stock check, add to cart).
 */
import type {
  VariantCondition,
  VariantValueObjType,
} from "@/src/types/product.type";

type ConditionalVariant = {
  id?: number;
  option_title: string;
  option_value: Array<string | VariantValueObjType>;
  condition?: VariantCondition | null | unknown;
};

type SelectedDetail = { variant_id: number; value: string };

export const optionValue = (opt: string | VariantValueObjType): string =>
  typeof opt === "string" ? opt : opt.val;

/** Reads a condition from a DB Json value or client state; null if invalid. */
export const parseCondition = (raw: unknown): VariantCondition | null => {
  if (!raw || typeof raw !== "object") return null;
  const { variant, values } = raw as Partial<VariantCondition>;
  if (typeof variant !== "string" || !variant) return null;
  if (!Array.isArray(values) || values.length === 0) return null;
  return {
    variant,
    values: values.filter((v): v is string => typeof v === "string"),
  };
};

/**
 * Whether a variant can be selected given the current selections.
 * A condition whose trigger variant no longer exists is ignored.
 */
export const isVariantActive = (
  variant: ConditionalVariant,
  variants: ConditionalVariant[],
  details: SelectedDetail[] | undefined,
  depth = 0,
): boolean => {
  const condition = parseCondition(variant.condition);
  if (!condition) return true;
  // Guard against a cycle that slipped past the editor
  if (depth > variants.length) return false;

  const trigger = variants.find((v) => v.option_title === condition.variant);
  if (!trigger || trigger === variant) return true;
  if (!isVariantActive(trigger, variants, details, depth + 1)) return false;

  const selected = details?.find(
    (d) => d && d.variant_id === trigger.id && d.value,
  )?.value;
  return !!selected && condition.values.includes(selected);
};

/**
 * Clears selections of variants whose condition is not met. Cleared entries
 * use the same empty shape the product page uses for "unselected".
 */
export const clearInactiveSelections = <T extends SelectedDetail>(
  details: T[],
  variants: ConditionalVariant[],
): T[] => {
  let result = details;
  // Repeat so a cleared trigger also clears the add-ons that depend on it
  for (let pass = 0; pass <= variants.length; pass++) {
    let changed = false;
    result = result.map((d) => {
      if (!d || !d.value) return d;
      const variant = variants.find((v) => v.id === d.variant_id);
      if (!variant || isVariantActive(variant, variants, result)) return d;
      changed = true;
      return { ...d, variant_id: 0, value: "" };
    });
    if (!changed) break;
  }
  return result;
};

/** Short description for hints, e.g. "Size is Large or X-Large". */
export const describeCondition = (
  condition: VariantCondition,
  variants: ConditionalVariant[],
): string => {
  const trigger = variants.find((v) => v.option_title === condition.variant);
  const labels = condition.values.map((val) => {
    const opt = trigger?.option_value.find((o) => optionValue(o) === val);
    return opt && typeof opt !== "string" && opt.name ? opt.name : val;
  });
  return `${condition.variant} is ${labels.join(" or ")}`;
};

/**
 * Titles a variant may depend on: every other variant except ones that
 * (directly or through a chain) already depend on it, which would be a cycle.
 */
export const allowedTriggerTitles = (
  title: string,
  variants: ConditionalVariant[],
): string[] => {
  const dependsOn = (v: ConditionalVariant, seen = new Set<string>()): boolean => {
    const c = parseCondition(v.condition);
    if (!c || seen.has(v.option_title)) return false;
    if (c.variant === title) return true;
    seen.add(v.option_title);
    const next = variants.find((x) => x.option_title === c.variant);
    return !!next && dependsOn(next, seen);
  };
  return variants
    .filter((v) => v.option_title !== title && !dependsOn(v))
    .map((v) => v.option_title);
};

/**
 * Keeps other variants' conditions pointing at a variant after it is edited:
 * follows a rename, maps changed option values (same position), and drops
 * values that were removed. A condition left with no values is removed.
 * Returns the updated list and the variants whose condition changed.
 */
export const updateConditionsAfterEdit = <V extends ConditionalVariant>(
  variants: V[],
  before: { title: string; values: string[] },
  after: { title: string; values: string[] },
): { variants: V[]; changed: V[] } => {
  const changed: V[] = [];
  const sameLength = before.values.length === after.values.length;

  const updated = variants.map((v) => {
    const c = parseCondition(v.condition);
    if (!c || c.variant !== before.title) return v;

    const values = c.values
      .map((val) => {
        if (after.values.includes(val)) return val;
        const idx = before.values.indexOf(val);
        return sameLength && idx !== -1 ? after.values[idx] : null;
      })
      .filter((val): val is string => !!val);

    const next: VariantCondition | null = values.length
      ? { variant: after.title, values: Array.from(new Set(values)) }
      : null;

    if (JSON.stringify(next) === JSON.stringify(c)) return v;
    const nv = { ...v, condition: next };
    changed.push(nv);
    return nv;
  });

  return { variants: updated, changed };
};

/** Removes conditions that point at deleted variants. */
export const removeConditionsOn = <V extends ConditionalVariant>(
  variants: V[],
  deletedTitles: string[],
): { variants: V[]; changed: V[] } => {
  const changed: V[] = [];
  const updated = variants.map((v) => {
    const c = parseCondition(v.condition);
    if (!c || !deletedTitles.includes(c.variant)) return v;
    const nv = { ...v, condition: null };
    changed.push(nv);
    return nv;
  });
  return { variants: updated, changed };
};

/**
 * Display order: each add-on right after the variant that unlocks it (when
 * both are in the list), otherwise the original order is kept.
 */
export const orderWithAddons = <V extends ConditionalVariant>(
  variants: V[],
): V[] => {
  const byTrigger = new Map<string, V[]>();
  const roots: V[] = [];
  for (const v of variants) {
    const c = parseCondition(v.condition);
    const triggerInList =
      c && variants.some((t) => t !== v && t.option_title === c.variant);
    if (c && triggerInList) {
      byTrigger.set(c.variant, [...(byTrigger.get(c.variant) ?? []), v]);
    } else {
      roots.push(v);
    }
  }

  const ordered: V[] = [];
  const visit = (v: V) => {
    if (ordered.includes(v)) return;
    ordered.push(v);
    for (const child of byTrigger.get(v.option_title) ?? []) visit(child);
  };
  roots.forEach(visit);
  // Anything left (e.g. a cycle) keeps its original position at the end
  for (const v of variants) {
    if (!ordered.includes(v)) ordered.push(v);
  }
  return ordered;
};
