import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LogOut, PanelLeft, Settings } from "lucide-react";
import Menu, { MenuItem, MenuSeparator } from "./ui/Menu";
import Tooltip from "./ui/Tooltip";
import { ThemeMenu } from "./ui/ThemeToggle";
import { useConfirm } from "./ui/confirm-context";
import { clearSession, getUser, initials } from "../lib/session";

const SECTIONS = [
  { match: (path) => path === "/", label: "Overview" },
  { match: (path) => path === "/new", label: "New role" },
  { match: (path) => path.startsWith("/role/"), label: "Role" },
  { match: (path) => path.startsWith("/candidates"), label: "Talent pool" },
  { match: (path) => path.startsWith("/metrics"), label: "Insights" },
  { match: (path) => path.startsWith("/settings"), label: "Settings" },
];

export default function TopBar({ onOpenNav }) {
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const user = getUser();

  const section = SECTIONS.find((item) => item.match(location.pathname));

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out of ATS Workplace?",
      description: "You will need your credentials to get back in.",
      confirmLabel: "Sign out",
    });
    if (!ok) return;
    clearSession();
    navigate("/auth");
    toast.success("Signed out");
  };

  return (
    // Sits above the page level sticky bars so its menus are never painted over.
    <header className="relative z-50 h-14 shrink-0 flex items-center gap-3 px-4 sm:px-6 border-b border-line bg-surface">
      <Tooltip label="Navigation" className="lg:hidden">
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="size-8 -ml-1 rounded-sm flex items-center justify-center text-muted hover:text-ink hover:bg-sunken transition-colors"
        >
          <PanelLeft className="size-4.5" />
        </button>
      </Tooltip>

      <p className="t-sm font-medium text-muted truncate">
        {section?.label ?? "Workplace"}
      </p>

      <div className="ml-auto flex items-center gap-1">
        <ThemeMenu />

        <Menu
          width={232}
          trigger={(props) => (
            <Tooltip label="Account">
              <button
                {...props}
                aria-label="Account menu"
                className="size-8 rounded-full bg-sunken border border-line text-[11.5px] font-semibold text-muted hover:text-ink hover:border-line-strong transition-colors"
              >
                {initials(user?.name)}
              </button>
            </Tooltip>
          )}
        >
          <div className="px-2.5 py-2">
            <p className="t-sm font-medium text-ink truncate">
              {user?.name || "Signed in"}
            </p>
            {user?.email && (
              <p className="t-xs text-faint truncate mt-0.5">
                {user.email}
              </p>
            )}
          </div>

          <MenuSeparator />

          <MenuItem icon={Settings} onClick={() => navigate("/settings")}>
            Settings
          </MenuItem>
          <MenuItem icon={LogOut} danger onClick={handleLogout}>
            Sign out
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
}
