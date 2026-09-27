import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Page title block. `crumbs` renders a breadcrumb trail above the title, the
 * way a documentation page shows where it sits in the tree.
 */
export default function PageHeader({ crumbs, title, description, actions, className }) {
  return (
    <div className={cn("pb-5", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1 t-sm text-faint min-w-0">
            {crumbs.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-1 min-w-0">
                {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-ghost" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-accent hover:underline truncate">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          {typeof title === "string" ? (
            <h1 className="t-display text-ink text-balance">{title}</h1>
          ) : (
            title
          )}
          {description && (
            <p className="t-body text-muted mt-1.5 max-w-prose">{description}</p>
          )}
        </div>
        {actions && (
          <div className="shrink-0 flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function Page({ className, children }) {
  return (
    <div className={cn("mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8", className)}>
      {children}
    </div>
  );
}
