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
    <div className="flex flex-col h-dvh w-full bg-canvas text-ink overflow-hidden">
      <TopBar onOpenNav={() => setMobileOpen(true)} />

      <div className="flex-1 min-h-0 flex">
        <aside
          className={cn(
            "hidden lg:block shrink-0 border-r border-line",
            collapsed ? "w-15" : "w-60",
          )}
        >
          <Sidebar variant="desktop" collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-90">
            <div className="absolute inset-0 bg-scrim" onClick={closeMobile} aria-hidden="true" />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line shadow-lg">
              <Sidebar variant="mobile" onClose={closeMobile} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
