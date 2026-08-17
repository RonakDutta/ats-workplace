import React from "react";
import { cn } from "../lib/cn";

export function LogoMark({ className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center size-7 rounded-sm",
        "bg-ink text-canvas shrink-0",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" fill="none" className="size-3.5">
        <path
          d="M4 6.5h9M4 10h12M4 13.5h7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function Logo({ showWordmark = true, className }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="text-[15.5px] font-semibold text-ink tracking-[-0.02em]">
          ATS Workplace
        </span>
      )}
    </span>
  );
}
