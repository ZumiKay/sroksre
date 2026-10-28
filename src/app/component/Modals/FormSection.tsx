import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type Accent =
  | "blue"
  | "purple"
  | "orange"
  | "green"
  | "teal"
  | "amber"
  | "indigo"
  | "rose"
  | "slate";

// Full class names so Tailwind can find them at build time.
export const ACCENTS: Record<
  Accent,
  { tile: string; selected: string; text: string; soft: string }
> = {
  blue: {
    tile: "bg-blue-100 text-blue-600",
    selected: "border-blue-500 bg-blue-50 ring-1 ring-blue-500",
    text: "text-blue-700",
    soft: "bg-blue-50 border-blue-200 text-blue-700",
  },
  purple: {
    tile: "bg-purple-100 text-purple-600",
    selected: "border-purple-500 bg-purple-50 ring-1 ring-purple-500",
    text: "text-purple-700",
    soft: "bg-purple-50 border-purple-200 text-purple-700",
  },
  orange: {
    tile: "bg-orange-100 text-orange-600",
    selected: "border-orange-500 bg-orange-50 ring-1 ring-orange-500",
    text: "text-orange-700",
    soft: "bg-orange-50 border-orange-200 text-orange-700",
  },
  green: {
    tile: "bg-green-100 text-green-600",
    selected: "border-green-500 bg-green-50 ring-1 ring-green-500",
    text: "text-green-700",
    soft: "bg-green-50 border-green-200 text-green-700",
  },
  teal: {
    tile: "bg-teal-100 text-teal-600",
    selected: "border-teal-500 bg-teal-50 ring-1 ring-teal-500",
    text: "text-teal-700",
    soft: "bg-teal-50 border-teal-200 text-teal-700",
  },
  amber: {
    tile: "bg-amber-100 text-amber-600",
    selected: "border-amber-500 bg-amber-50 ring-1 ring-amber-500",
    text: "text-amber-700",
    soft: "bg-amber-50 border-amber-200 text-amber-800",
  },
  indigo: {
    tile: "bg-indigo-100 text-indigo-600",
    selected: "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500",
    text: "text-indigo-700",
    soft: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  rose: {
    tile: "bg-rose-100 text-rose-600",
    selected: "border-rose-500 bg-rose-50 ring-1 ring-rose-500",
    text: "text-rose-700",
    soft: "bg-rose-50 border-rose-200 text-rose-700",
  },
  slate: {
    tile: "bg-slate-100 text-slate-600",
    selected: "border-slate-500 bg-slate-50 ring-1 ring-slate-500",
    text: "text-slate-700",
    soft: "bg-slate-50 border-slate-200 text-slate-700",
  },
};

export function IconTile({
  icon,
  accent,
  size = "md",
}: {
  icon: IconDefinition;
  accent: Accent;
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

/** Modal title row with a colored icon. */
export function ModalTitle({
  icon,
  accent,
  title,
  subtitle,
}: {
  icon: IconDefinition;
  accent: Accent;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
      <IconTile icon={icon} accent={accent} size="lg" />
      <div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/** White card with a colored icon heading. */
export function SectionCard({
  icon,
  accent,
  title,
  hint,
  children,
}: {
  icon: IconDefinition;
  accent: Accent;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-y-4">
      <div className="flex items-start gap-3">
        <IconTile icon={icon} accent={accent} size="sm" />
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
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
  accent: Accent;
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
      <span className="text-sm font-medium text-gray-700">{label}</span>
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
          const colors = ACCENTS[option.accent];
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-3 text-left rounded-lg border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
                selected
                  ? colors.selected
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <IconTile icon={option.icon} accent={option.accent} size="sm" />
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    selected ? colors.text : "text-gray-900"
                  }`}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {option.description}
                  </span>
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
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
