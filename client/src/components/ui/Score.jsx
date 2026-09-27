import React from "react";
import { TONE_CLASSES, tierFor } from "../../lib/score";
import { cn } from "../../lib/cn";

/** Verdict as a tinted pill badge. The word carries the meaning. */
export function VerdictTag({ score, long, className }) {
  const tier = tierFor(score);
  return (
    <span
      className={cn(
        "inline-flex items-center h-5.5 px-2 rounded-full text-[12px] font-medium whitespace-nowrap",
        TONE_CLASSES[tier.tone].tag,
        className,
      )}
    >
      {long ? tier.label : tier.short}
    </span>
  );
}

/** Score as a number beside a short rounded meter. */
export function ScoreMeter({ score, width = "w-16", className }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const tier = tierFor(value);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="text-[14px] font-medium tnum w-6 text-right">{value}</span>
      <span
        className={cn("h-1.5 bg-fill rounded-full overflow-hidden", width)}
        role="img"
        aria-label={`${value} percent, ${tier.label}`}
      >
        <span
          className={cn("block h-full rounded-full", TONE_CLASSES[tier.tone].bar)}
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}

/** Skill pill used in tables and candidate details. */
export function SkillTag({ missing, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium",
        missing
          ? "border border-dashed border-line-strong text-faint"
          : "bg-fill text-muted",
      )}
    >
      {children}
    </span>
  );
}
