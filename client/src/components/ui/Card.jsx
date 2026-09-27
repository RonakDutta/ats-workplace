import React from "react";
import { cn } from "../../lib/cn";

/** White panel with a translucent ring and a soft shadow. */
export function Card({ className, children, ...props }) {
  return (
    <section
      className={cn("bg-surface border border-line rounded-lg shadow-xs", className)}
      {...props}
    >
      {children}
    </section>
  );
}

/**
 * Kumo's layered card: a grey shell with a label strip on top and a white
 * card nested inside it. Used for data sections such as tables and charts.
 */
export function LayerCard({ title, actions, className, bodyClassName, children }) {
  return (
    <section className={cn("bg-sunken border border-line-soft rounded-xl p-1", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 min-h-11 pl-3 pr-1.5 py-1">
        <h2 className="text-[14px] font-medium text-muted">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div
        className={cn(
          "bg-surface border border-line rounded-lg shadow-xs overflow-hidden",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function CardHeader({ title, description, actions, divided, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-5 pt-5",
        divided ? "pb-4 border-b border-line-soft" : "pb-1",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="t-heading text-ink">{title}</h2>
        {description && <p className="t-sm text-faint mt-1 max-w-prose">{description}</p>}
      </div>
      {actions && <div className="shrink-0 flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

/** Strip along the bottom of a card for help text and the card's action. */
export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between",
        "px-5 py-3 bg-sunken border-t border-line-soft rounded-b-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Two column settings row: what it is on the left, the control on the right. */
export function SettingRow({ title, description, children, className }) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10 px-5 py-5",
        className,
      )}
    >
      <div>
        <h2 className="t-heading">{title}</h2>
        {description && <p className="t-sm text-faint mt-1">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
