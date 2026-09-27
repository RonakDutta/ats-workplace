import React from "react";
import Skeleton from "./Skeleton";
import { cn } from "../../lib/cn";

export function Th({ className, children }) {
  return (
    <th
      scope="col"
      className={cn("px-4 h-9 text-[12px] font-semibold text-muted whitespace-nowrap bg-sunken border-b border-line-soft", className)}
    >
      {children}
    </th>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="divide-y divide-line-soft">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-6 px-4 h-12">
          <Skeleton className="flex-1 max-w-64" />
          <Skeleton className="w-20 hidden sm:block" />
          <Skeleton className="w-10" />
          <Skeleton className="w-24 hidden md:block" />
        </div>
      ))}
    </div>
  );
}
