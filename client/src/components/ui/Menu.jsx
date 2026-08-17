import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

const GAP = 6;
const EDGE = 8;

/**
 * Dropdown rendered into a portal. Anchoring to the trigger through the DOM
 * tree meant any ancestor with overflow or its own stacking context could clip
 * the panel or paint over it, which is what put the account menu behind the
 * role title bar and cut off the role row menu inside the scrolling sidebar.
 */
export default function Menu({ trigger, align = "end", width = 224, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  const place = useCallback(() => {
    const anchor = triggerRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    const roomBelow = window.innerHeight - rect.bottom;
    const flipUp =
      panelHeight > 0 &&
      roomBelow < panelHeight + GAP + EDGE &&
      rect.top > panelHeight + GAP + EDGE;

    const rawLeft = align === "end" ? rect.right - width : rect.left;

    setPos({
      top: flipUp ? rect.top - panelHeight - GAP : rect.bottom + GAP,
      left: Math.min(
        Math.max(EDGE, rawLeft),
        Math.max(EDGE, window.innerWidth - width - EDGE),
      ),
    });
  }, [align, width]);

  // Measuring happens in a ref callback rather than an effect: it runs after
  // the panel is in the DOM but before paint, so the first frame is already
  // positioned and there is nothing to flash.
  const attachPanel = useCallback(
    (node) => {
      panelRef.current = node;
      if (node) place();
    },
    [place],
  );

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (
        panelRef.current?.contains(event.target) ||
        triggerRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // Capture phase so the panel follows any scrolling ancestor, not just the page.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((value) => !value),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? id : undefined,
      })}

      {open &&
        createPortal(
          <div
            ref={attachPanel}
            id={id}
            role="menu"
            style={{
              position: "fixed",
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width,
              visibility: pos ? "visible" : "hidden",
            }}
            className={cn(
              // Above the mobile drawer, below the confirm dialog.
              "z-95 p-1.5 bg-overlay border border-line rounded-md shadow-lg",
              "animate-scale-in origin-top",
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

export function MenuItem({
  icon: Icon,
  danger,
  selected,
  trailing,
  className,
  children,
  ...props
}) {
  return (
    <button
      role="menuitem"
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-xs text-[13.5px] font-medium text-left",
        "transition-colors duration-100",
        danger
          ? "text-bad hover:bg-bad-soft"
          : selected
            ? "bg-sunken text-ink"
            : "text-muted hover:bg-sunken hover:text-ink",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="truncate flex-1">{children}</span>
      {trailing}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1.5 h-px bg-line-soft" />;
}
