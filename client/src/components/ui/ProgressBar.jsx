import React from "react";
import { cn } from "../../lib/cn";

/**
 * Determinate only. Every value shown here comes from a request that actually
 * finished, so the bar never invents progress or parks at 99 percent.
 */
export default function ProgressBar({ done, total, label, className }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <p className="t-xs text-muted truncate">
          {label ?? "Working"}
        </p>
        <p className="t-xs text-faint tnum shrink-0">
          {done} of {total}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Analysis progress"
        className="h-1.5 rounded-full bg-line overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out-soft"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
