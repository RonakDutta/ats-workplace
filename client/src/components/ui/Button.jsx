import React from "react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  primary:
    "bg-accent text-on-accent border-accent hover:bg-accent-hover hover:border-accent-hover " +
    "disabled:bg-sunken disabled:text-ghost disabled:border-line",
  secondary:
    "bg-surface text-ink border-line-strong hover:bg-hover disabled:text-ghost disabled:border-line",
  ghost:
    "bg-transparent text-muted border-transparent hover:bg-hover hover:text-ink disabled:text-ghost",
  danger:
    "bg-surface text-bad border-bad-line hover:bg-bad-soft disabled:text-ghost disabled:border-line",
  solidDanger:
    "bg-bad text-white border-bad hover:opacity-90 disabled:opacity-50",
};

const SIZES = {
  sm: "h-7.5 px-2.5 text-[12.5px] gap-1.5",
  md: "h-8.5 px-3.5 text-[13px] gap-2",
  lg: "h-10 px-4.5 text-[14px] gap-2",
  icon: "h-8.5 w-8.5 justify-center",
};

/**
 * `loading` only disables the button. The label passed in is expected to say
 * what is happening ("Saving", "Analysing 2 of 5"), which is more useful than
 * an animated indicator.
 */
const Button = React.forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center font-medium whitespace-nowrap select-none border rounded-sm",
        "transition-colors duration-100",
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
