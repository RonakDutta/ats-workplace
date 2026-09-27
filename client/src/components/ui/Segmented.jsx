import React from "react";
import { cn } from "../../lib/cn";

/**
 * Kumo's segmented control: a recessed pill track with the selected option
 * raised on a white chip.
 */
export default function Segmented({ label, value, onChange, options, className }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-recessed border border-line-soft", className)}
    >
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon, title }) => {
        const active = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            title={title}
            onClick={() => onChange(optionValue)}
            className={cn(
              "inline-flex items-center gap-1.5 h-7.5 px-3 rounded-md text-[13px] transition-colors duration-150",
              active
                ? "bg-surface text-ink font-medium shadow-sm ring-1 ring-line"
                : "text-faint hover:text-ink",
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
