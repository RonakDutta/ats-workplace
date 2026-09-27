import React from "react";
import { cn } from "../../lib/cn";

/** Static block that holds a layout's shape while data loads. */
export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("placeholder h-4", className)} />;
}
