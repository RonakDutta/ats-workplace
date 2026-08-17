import React from "react";
import { cn } from "../../lib/cn";

/**
 * Content now sits on a white sheet, so grouping is tonal: a card is a step
 * down in surface, not a white box with a line drawn round it.
 */
export function Card({ className, children, ...props }) {
  return (
    <div className={cn("bg-sunken rounded-lg", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-6 sm:px-7 pt-5 pb-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="t-heading text-ink">{title}</h2>
        {description && (
          <p className="t-sm text-faint mt-1.5 max-w-prose">{description}</p>
        )}
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("px-6 sm:px-7 pb-6", className)}>{children}</div>;
}
