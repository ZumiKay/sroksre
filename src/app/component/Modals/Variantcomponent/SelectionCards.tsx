import React from "react";
import Image, { StaticImageData } from "next/image";

type Accent = "blue" | "purple" | "green";

// Full class names so Tailwind can find them at build time.
const ACCENTS: Record<
  Accent,
  { tile: string; badge: string; hoverBorder: string; ring: string }
> = {
  blue: {
    tile: "bg-blue-600",
    badge: "bg-blue-50 text-blue-700",
    hoverBorder: "hover:border-blue-400",
    ring: "focus-visible:ring-blue-200",
  },
  purple: {
    tile: "bg-purple-600",
    badge: "bg-purple-50 text-purple-700",
    hoverBorder: "hover:border-purple-400",
    ring: "focus-visible:ring-purple-200",
  },
  green: {
    tile: "bg-green-600",
    badge: "bg-green-50 text-green-700",
    hoverBorder: "hover:border-green-400",
    ring: "focus-visible:ring-green-200",
  },
};

interface SelectionCardProps {
  title: string;
  description: string;
  image: StaticImageData;
  count?: number;
  countLabel?: string;
  disabled?: boolean;
  /** Shown instead of the description when the card is disabled. */
  disabledHint?: string;
  onClick: () => void;
  accent: Accent;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  description,
  image,
  count,
  countLabel,
  disabled,
  disabledHint,
  onClick,
  accent,
}) => {
  const colors = ACCENTS[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={disabled}
      className={`group w-full flex items-center gap-4 p-4 text-left bg-white border-2 rounded-xl transition-all duration-150 outline-none focus-visible:ring-4 ${colors.ring} ${
        disabled
          ? "border-gray-200 cursor-not-allowed"
          : `border-gray-200 ${colors.hoverBorder} hover:shadow-md active:scale-[0.99]`
      }`}
    >
      <div
        className={`w-14 h-14 shrink-0 rounded-xl grid place-content-center ${
          disabled ? "bg-gray-300" : colors.tile
        }`}
      >
        <Image
          src={image}
          alt=""
          className="w-8 h-8 object-contain brightness-0 invert"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className={`text-base font-semibold ${
            disabled ? "text-gray-400" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-sm mt-0.5 ${
            disabled ? "text-amber-600" : "text-gray-500"
          }`}
        >
          {disabled && disabledHint ? disabledHint : description}
        </p>
      </div>

      {count !== undefined && count > 0 && (
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badge}`}
        >
          {count}
          {countLabel ? ` ${countLabel}` : ""}
        </span>
      )}

      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className={`w-5 h-5 shrink-0 transition-transform duration-150 ${
          disabled
            ? "text-gray-300"
            : "text-gray-400 group-hover:translate-x-0.5 group-hover:text-gray-600"
        }`}
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};
