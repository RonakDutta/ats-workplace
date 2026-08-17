import React from "react";
import { cn } from "../../lib/cn";

/**
 * Underlined tabs. Arrow keys move between them, matching the tab pattern, so
 * the whole strip is one stop in the tab order.
 */
export default function Tabs({ value, onChange, items, className }) {
  const handleKeyDown = (event) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    const next = items[(index + step + items.length) % items.length];
    onChange(next.value);
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn("flex items-center gap-6 border-b border-line", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative -mb-px flex items-center gap-2 h-10 text-[13.5px] font-medium",
              "border-b-2 transition-colors duration-150 ease-out-soft",
              active
                ? "border-ink text-ink"
                : "border-transparent text-faint hover:text-muted",
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-xs tnum text-[11.5px]",
                  active ? "bg-sunken text-muted" : "bg-sunken/70 text-ghost",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
