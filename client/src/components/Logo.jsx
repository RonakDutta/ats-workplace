import React from "react";
import { cn } from "../lib/cn";

export function LogoMark({ className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center size-7 rounded-lg bg-accent text-white shrink-0 shadow-[inset_0_1px_0_0_oklch(100%_0_0/0.2)]",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" fill="none" className="size-3.5" aria-hidden="true">
        <path
          d="M4 6h9M4 10h12M4 14h7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function Logo({ className }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold text-ink tracking-[-0.015em]">
        ATS Workplace
      </span>
    </span>
  );
}
