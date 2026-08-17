import React from "react";
import { cn } from "../../lib/cn";

// Resting state is a soft fill rather than an outlined box, so a form reads as
// a set of surfaces. The border only asserts itself on focus and on error.
const CONTROL =
  "w-full bg-sunken text-ink placeholder:text-ghost border rounded-md " +
  "transition-[border-color,box-shadow,background-color] duration-150 ease-out-soft " +
  "focus:outline-none focus-visible:outline-none focus:bg-surface " +
  "disabled:opacity-55 disabled:cursor-not-allowed";

function stateRing(invalid) {
  return invalid
    ? "border-bad-line bg-bad-soft focus:border-bad focus:shadow-[0_0_0_3px_var(--bad-soft)]"
    : "border-transparent hover:border-line focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]";
}

export const Input = React.forwardRef(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        stateRing(invalid),
        "h-11 px-3.5 text-[14.5px]",
        className,
      )}
      {...props}
    />
  );
});

/**
 * `bare` drops the chrome so the field reads as the page it sits on rather
 * than as a control placed onto it. Used for the job description, which is the
 * document, not a form input.
 */
export const Textarea = React.forwardRef(function Textarea(
  { className, invalid, bare, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full text-ink placeholder:text-ghost resize-none custom-scrollbar",
        "focus:outline-none focus-visible:outline-none disabled:opacity-55 disabled:cursor-not-allowed",
        bare
          ? "bg-transparent border-none p-0 t-body"
          : cn(
              CONTROL,
              stateRing(invalid),
              "px-4 py-3.5 text-sm leading-[1.7]",
            ),
        className,
      )}
      {...props}
    />
  );
});

export function Field({ label, hint, error, htmlFor, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block t-sm font-medium text-muted">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="t-xs text-bad">{error}</p>
      ) : hint ? (
        <p className="t-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
