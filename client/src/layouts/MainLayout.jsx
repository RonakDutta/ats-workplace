import React, { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { cn } from "../lib/cn";

const COLLAPSED_KEY = "ats_sidebar_collapsed";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Preference is cosmetic; ignore storage failures.
      }
      return next;
    });
  };

  return (
    <div className="flex h-dvh w-full bg-canvas text-ink overflow-hidden">
      {/* Navigation sits directly on the canvas. */}
      <aside
        className={cn(
          "hidden lg:block shrink-0 transition-[width] duration-200 ease-out-soft",
          collapsed ? "w-16" : "w-62",
        )}
      >
        <Sidebar
          variant="desktop"
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
      </aside>

      <div
        className={cn(
          "lg:hidden fixed inset-0 z-90 transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
          onClick={closeMobile}
          aria-hidden="true"
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-70 bg-canvas border-r border-line shadow-lg",
            "transition-transform duration-240 ease-out-soft",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar variant="mobile" onClose={closeMobile} />
        </aside>
      </div>

      {/* Content is a sheet lifted off the canvas, so the app reads as a
          document surface with navigation beside it rather than one flat plane. */}
      <div className="flex-1 min-w-0 flex flex-col p-0 lg:py-2.5 lg:pr-2.5">
        <div className="flex-1 min-h-0 flex flex-col bg-surface lg:border lg:border-line lg:rounded-xl overflow-hidden">
          <TopBar onOpenNav={() => setMobileOpen(true)} />
          <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
