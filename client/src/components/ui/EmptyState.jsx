import React from "react";
import { cn } from "../../lib/cn";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-14",
        className,
      )}
    >
      {Icon && (
        <div className="size-11 rounded-lg bg-sunken border border-line-soft flex items-center justify-center mb-4">
          <Icon className="size-5 text-faint" />
        </div>
      )}
      <p className="t-body font-medium text-ink">{title}</p>
      {description && (
        <p className="t-sm text-faint mt-2 max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
