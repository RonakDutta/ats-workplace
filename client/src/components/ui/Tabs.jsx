import React from "react";
import { cn } from "../../lib/cn";

/** Underlined page tabs. Arrow keys move between them, per the tab pattern. */
export default function Tabs({ value, onChange, items, className }) {
  const handleKeyDown = (event) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    onChange(items[(index + step + items.length) % items.length].value);
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn("flex items-center gap-1 border-b border-line-soft", className)}
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
              "relative flex items-center gap-2 h-10 px-3 text-[14px]",
              active ? "text-ink font-medium" : "text-faint hover:text-ink",
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "inline-flex items-center h-5 min-w-5 justify-center px-1.5 rounded-full text-[12px] font-medium tnum",
                  active ? "bg-fill text-ink" : "bg-recessed text-faint",
                )}
              >
                {item.count}
              </span>
            )}
            {active && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
