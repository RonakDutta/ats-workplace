import React from "react";
import { cn } from "../../lib/cn";

/** Determinate only: every step shown is a request that actually finished. */
export default function ProgressBar({ done, total, label, className }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-4 mb-1.5">
        <p className="t-sm text-muted truncate">{label}</p>
        <p className="t-sm text-faint tnum shrink-0">
          {done} of {total}
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Analysis progress"
        className="h-2 bg-fill overflow-hidden rounded-full"
      >
        <div className="h-full bg-accent rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
