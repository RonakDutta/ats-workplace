import React from "react";
import { cn } from "../lib/cn";

export function LogoMark({ className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center size-6.5 rounded-xs bg-ink text-surface shrink-0",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" fill="none" className="size-3.5" aria-hidden="true">
        <path
          d="M4 6h9M4 10h12M4 14h7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
    </span>
  );
}

export default function Logo({ className }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[14.5px] font-semibold text-ink tracking-[-0.01em]">
        ATS Workplace
      </span>
    </span>
  );
}
