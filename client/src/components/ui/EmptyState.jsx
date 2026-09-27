import React from "react";
import { cn } from "../../lib/cn";

export default function EmptyState({ title, description, action, className }) {
  return (
    <div className={cn("px-5 py-12 text-center", className)}>
      <p className="t-body font-medium text-ink">{title}</p>
      {description && (
        <p className="t-sm text-faint mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
