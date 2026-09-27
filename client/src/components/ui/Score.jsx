import React from "react";
import { TONE_CLASSES, tierFor } from "../../lib/score";
import { cn } from "../../lib/cn";

/** Verdict label. The colour sits on a bordered tag and the word carries it. */
export function VerdictTag({ score, long, className }) {
  const tier = tierFor(score);
  return (
    <span
      className={cn(
        "inline-flex items-center h-5.5 px-1.5 rounded-xs border text-[12px] font-medium whitespace-nowrap",
        TONE_CLASSES[tier.tone].tag,
        className,
      )}
    >
      {long ? tier.label : tier.short}
    </span>
  );
}

/** Score as a number beside a short horizontal meter. */
export function ScoreMeter({ score, width = "w-16", className }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const tier = tierFor(value);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="font-mono text-[13px] font-medium tnum w-7 text-right">
        {value}
      </span>
      <span
        className={cn("h-1.5 bg-line-soft rounded-xs overflow-hidden", width)}
        role="img"
        aria-label={`${value} percent, ${tier.label}`}
      >
        <span
          className={cn("block h-full", TONE_CLASSES[tier.tone].bar)}
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}

/** Plain skill tag used in tables and candidate details. */
export function SkillTag({ missing, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-6 px-2 rounded-xs border text-[12px]",
        missing
          ? "border-dashed border-line-strong text-faint"
          : "border-line bg-sunken text-muted",
      )}
    >
      {children}
    </span>
  );
}
