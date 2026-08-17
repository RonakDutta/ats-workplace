import React from "react";
import { cn } from "../../lib/cn";

/**
 * Hover and focus hint for icon-only controls. Purely CSS so it costs nothing,
 * but that means it cannot escape a clipping ancestor: use it on toolbars and
 * headers, and fall back to `title` inside scrolling panes.
 */
export default function Tooltip({ label, side = "bottom", className, children }) {
  return (
    <span className={cn("tip-root relative inline-flex group/tip", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 z-70 whitespace-nowrap",
          "px-2 h-6 flex items-center rounded-xs text-[11.5px] font-medium",
          "bg-ink text-canvas shadow-md",
          "opacity-0 translate-y-0.5 transition-[opacity,transform] duration-120 ease-out-soft",
          "group-hover/tip:opacity-100 group-hover/tip:translate-y-0",
          "group-focus-within/tip:opacity-100 group-focus-within/tip:translate-y-0",
          side === "bottom" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]",
        )}
      >
        {label}
      </span>
    </span>
  );
}
