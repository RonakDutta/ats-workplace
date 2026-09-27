import React from "react";
import { cn } from "../../lib/cn";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("px-5 py-14 text-center", className)}>
      {Icon && (
        <div className="size-10 mx-auto mb-4 rounded-xl bg-recessed border border-line-soft flex items-center justify-center">
          <Icon className="size-5 text-faint" />
        </div>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && (
        <p className="t-sm text-faint mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
