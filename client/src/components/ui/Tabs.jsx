import React from "react";
import { cn } from "../../lib/cn";

/** Underlined tabs. Arrow keys move between them, per the tab pattern. */
export default function Tabs({ value, onChange, items, className }) {
  const handleKeyDown = (event) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    onChange(items[(index + step + items.length) % items.length].value);
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn("flex items-center gap-5 border-b border-line", className)}
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
              "-mb-px flex items-center gap-1.5 h-10 text-[13.5px] font-medium border-b-2",
              active
                ? "border-accent text-ink"
                : "border-transparent text-faint hover:text-ink",
            )}
          >
            {item.label}
            {item.count != null && (
              <span className="text-faint font-normal tnum">({item.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
