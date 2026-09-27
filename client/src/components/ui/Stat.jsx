import React from "react";
import Skeleton from "./Skeleton";
import { cn } from "../../lib/cn";

/** Figure card: label, value and an optional unit. `value` null shows a placeholder. */
export default function Stat({ label, value, unit, icon: Icon, className }) {
  return (
    <div className={cn("bg-surface border border-line rounded-lg shadow-xs px-4 py-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="t-sm font-medium text-faint truncate">{label}</p>
        {Icon && <Icon className="size-4 text-ghost shrink-0" />}
      </div>
      {value == null ? (
        <Skeleton className="h-7 w-14 mt-2" />
      ) : (
        <p className="text-[26px] font-semibold leading-tight mt-1 tracking-[-0.02em]">
          {value}
          {unit && (
            <span className="text-[14px] text-faint font-medium ml-1 tracking-normal">{unit}</span>
          )}
        </p>
      )}
    </div>
  );
}
