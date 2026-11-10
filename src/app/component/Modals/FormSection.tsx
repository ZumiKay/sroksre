import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/** Slate for everything; red only for destructive actions. */
export type Accent = "neutral" | "danger";

// Full class names so Tailwind can find them at build time.
export const ACCENTS: Record<
  Accent,
  { tile: string; selected: string; text: string; soft: string }
> = {
  neutral: {
    tile: "bg-slate-100 text-slate-600",
    selected: "border-slate-900 bg-slate-50 ring-1 ring-slate-900",
    text: "text-slate-900",
    soft: "bg-white border-slate-300 text-slate-700 hover:bg-slate-50",
  },
  danger: {
    tile: "bg-red-50 text-red-600",
    selected: "border-red-600 bg-red-50 ring-1 ring-red-600",
    text: "text-red-700",
    soft: "bg-white border-red-200 text-red-600 hover:bg-red-50",
  },
};

export function IconTile({
  icon,
  accent = "neutral",
  size = "md",
}: {
  icon: IconDefinition;
  accent?: Accent;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg"
      ? "w-11 h-11 rounded-xl text-lg"
      : size === "sm"
        ? "w-8 h-8 rounded-lg text-sm"
        : "w-9 h-9 rounded-lg text-base";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 ${box} ${ACCENTS[accent].tile}`}
    >
      <FontAwesomeIcon icon={icon} />
    </span>
  );
}

/** Modal title and one-line explanation. */
export function ModalTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pb-4 border-b border-slate-200">
      <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

/** Bordered section with a small icon heading. */
export function SectionCard({
  icon,
  title,
  hint,
  children,
}: {
  icon: IconDefinition;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-y-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={icon} className="text-xs text-slate-400" aria-hidden="true" />
          {title}
        </h4>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export type Option = {
  value: string;
  label: string;
  description?: string;
  icon: IconDefinition;
};

export function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className={`grid gap-2 max-small_phone:grid-cols-1 ${
          options.length >= 4
            ? "grid-cols-2 md:grid-cols-4"
            : options.length === 3
              ? "grid-cols-3"
              : "grid-cols-2"
        }`}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-3 text-left rounded-lg border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
                selected
                  ? ACCENTS.neutral.selected
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg text-sm transition-colors ${
                  selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                <FontAwesomeIcon icon={option.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                {option.description && (
                  <span className="block text-xs text-slate-500 mt-0.5">{option.description}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
