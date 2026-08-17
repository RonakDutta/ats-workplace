import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  // Disabled primary drops the accent entirely rather than fading it, so an
  // unavailable action never reads as a slightly washed available one.
  primary:
    "bg-accent text-on-accent border border-transparent hover:bg-accent-hover shadow-xs " +
    "disabled:opacity-100 disabled:bg-sunken disabled:text-ghost disabled:border-line disabled:shadow-none",
  secondary:
    "bg-surface text-ink border border-line hover:bg-sunken hover:border-line-strong shadow-xs",
  ghost: "bg-transparent text-muted border border-transparent hover:bg-sunken hover:text-ink",
  danger:
    "bg-transparent text-bad border border-transparent hover:bg-bad-soft",
  solidDanger:
    "bg-bad text-white border border-transparent hover:opacity-90 shadow-xs",
};

const SIZES = {
  sm: "h-8.5 px-3 text-[13px] gap-1.5 rounded-sm",
  md: "h-10 px-4 text-[14px] gap-2 rounded-md",
  lg: "h-11.5 px-5 text-[14.5px] gap-2 rounded-md",
  icon: "h-9 w-9 rounded-sm justify-center",
  iconSm: "h-7.5 w-7.5 rounded-xs justify-center",
};

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
      className={cn(
        "inline-flex items-center font-medium whitespace-nowrap select-none",
        "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out-soft",
        "active:scale-[0.985] disabled:opacity-45 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
});

export default Button;
