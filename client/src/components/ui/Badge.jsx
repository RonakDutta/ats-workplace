import React from "react";
import { cn } from "../../lib/cn";
import { TONE_CLASSES } from "../../lib/score";

/**
 * A neutral chip carrying a coloured dot. The tinted pill it replaced put a
 * washed red, amber or green block on the page for every row, which fought the
 * rest of the interface. Keeping the surface neutral means the colour appears
 * once, at dot size, and the label still says what the state is.
 */
export default function Badge({
  tone = "neutral",
  icon: Icon,
  className,
  children,
}) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2 rounded-xs border border-line-soft bg-sunken",
        "text-[12px] font-medium text-muted whitespace-nowrap",
        className,
      )}
    >
      {Icon ? (
        <Icon className="size-3.5 shrink-0 text-faint" />
      ) : toneClasses ? (
        <span
          className={cn("size-1.5 rounded-full shrink-0", toneClasses.dot)}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
