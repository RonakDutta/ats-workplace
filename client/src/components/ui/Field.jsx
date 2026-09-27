import React from "react";
import { cn } from "../../lib/cn";

const CONTROL =
  "w-full bg-surface text-ink placeholder:text-ghost border rounded-lg shadow-xs " +
  "transition-[border-color,box-shadow] duration-150 " +
  "focus:outline-none focus-visible:outline-none " +
  "disabled:bg-sunken disabled:text-faint disabled:shadow-none disabled:cursor-not-allowed";

function stateRing(invalid) {
  return invalid
    ? "border-bad-mark focus:shadow-[0_0_0_1.5px_var(--bad-line)]"
    : "border-line hover:border-line-strong focus:border-transparent focus:shadow-[0_0_0_1.5px_var(--focus)]";
}

export const Input = React.forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, stateRing(invalid), "h-9 px-3 text-[14px]", className)}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        stateRing(invalid),
        "px-3 py-2.5 text-[14px] leading-[1.65] resize-y custom-scrollbar",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(CONTROL, stateRing(false), "h-9 pl-3 pr-8 text-[14px]", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({ label, hint, error, htmlFor, optional, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[14px] font-medium text-ink">
          {label}
          {optional && <span className="font-normal text-faint"> (optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="t-sm text-bad">{error}</p>
      ) : hint ? (
        <p className="t-sm text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
