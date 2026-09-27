import React from "react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  // A faint top highlight gives the primary button the same pressed-glass
  // finish as the Kumo emphasis button.
  primary:
    "bg-accent text-on-accent border-transparent hover:bg-accent-hover " +
    "shadow-[inset_0_1px_0_0_oklch(100%_0_0/0.18),0_1px_2px_0_oklch(0%_0_0/0.12)] " +
    "disabled:opacity-50 disabled:hover:bg-accent",
  secondary:
    "bg-surface text-ink border-line shadow-xs hover:bg-hover disabled:opacity-60 disabled:hover:bg-surface",
  ghost:
    "bg-transparent text-muted border-transparent hover:bg-hover hover:text-ink disabled:opacity-50",
  danger:
    "bg-surface text-bad border-line shadow-xs hover:border-bad-line hover:bg-bad-soft disabled:opacity-60",
  solidDanger:
    "bg-bad-mark text-white border-transparent hover:opacity-90 shadow-xs disabled:opacity-50",
};

const SIZES = {
  sm: "h-7.5 px-2.5 text-[13px] gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-[14px] gap-2 rounded-lg",
  lg: "h-10 px-4 text-[14px] gap-2 rounded-lg",
  icon: "h-9 w-9 justify-center rounded-lg",
};

/**
 * `loading` only disables the button. The label passed in says what is
 * happening ("Saving", "Analysing 2 of 5").
 */
const Button = React.forwardRef(function Button(
  { variant = "secondary", size = "md", loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap select-none border",
        "transition-colors duration-150",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
