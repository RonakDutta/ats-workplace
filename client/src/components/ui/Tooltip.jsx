import React from "react";
import { cn } from "../../lib/cn";

/**
 * Hover and focus hint for icon-only controls. Pure CSS, so it cannot escape a
 * clipping ancestor: use it in the top bar, and `title` inside scrolling panes.
 * It is right aligned to its control so it never runs past the viewport edge.
 */
export default function Tooltip({ label, className, children }) {
  return (
    <span className={cn("tip-root relative inline-flex group/tip", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute right-0 top-[calc(100%+6px)] z-70 whitespace-nowrap",
          "px-2 h-6 flex items-center rounded-md text-[12px] font-medium bg-ink text-surface shadow-sm",
          "opacity-0 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100",
        )}
      >
        {label}
      </span>
    </span>
  );
}
