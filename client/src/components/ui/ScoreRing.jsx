import React from "react";
import { TONE_CLASSES, tierFor } from "../../lib/score";
import { cn } from "../../lib/cn";

/**
 * Score as an arc plus the number. The track is a lighter step of the same
 * colour so the state reads across the whole ring, not just the filled part.
 */
export default function ScoreRing({ score, size = 44, className }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const tier = tierFor(value);
  const stroke = size >= 44 ? 3.5 : 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} percent match, ${tier.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="var(--line)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={TONE_CLASSES[tier.tone].ring}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out-soft)" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-ink font-semibold tnum"
        style={{ fontSize: size >= 44 ? 13 : 11 }}
      >
        {value}
      </span>
    </div>
  );
}
