import React from "react";
import { cn } from "../lib/cn";

export default function PageHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="t-display text-ink text-balance">{title}</h1>
        {description && (
          <p className="t-body text-muted mt-2 max-w-prose">{description}</p>
        )}
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function Page({ className, children }) {
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 py-8 sm:py-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
