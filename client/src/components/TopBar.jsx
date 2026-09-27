import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu as MenuIcon, Plus, Settings } from "lucide-react";
import Logo from "./Logo";
import Button from "./ui/Button";
import Menu, { MenuItem, MenuSeparator } from "./ui/Menu";
import Tooltip from "./ui/Tooltip";
import { ThemeMenu } from "./ui/ThemeToggle";
import { getUser, initials } from "../lib/session";
import useSignOut from "../lib/useSignOut";

export default function TopBar({ onOpenNav }) {
  const navigate = useNavigate();
  const handleLogout = useSignOut();
  const user = getUser();
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    // Sits above page level sticky bars so its menus are never painted over.
    <header className="relative z-50 h-14 shrink-0 flex items-center gap-2 px-3 sm:px-4 border-b border-line bg-surface">
      <button
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="lg:hidden size-8.5 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-hover"
      >
        <MenuIcon className="size-4.5" />
      </button>

      <Link to="/" className="rounded-lg" aria-label="ATS Workplace home">
        <Logo />
      </Link>

      {firstName && (
        <div className="hidden sm:flex items-center gap-2 min-w-0 ml-1">
          <span className="h-5 w-px bg-line-strong" aria-hidden="true" />
          <span className="ml-1 inline-flex items-center h-7 px-2.5 rounded-full bg-recessed border border-line-soft text-[13px] font-medium text-muted truncate">
            {firstName}'s workplace
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden sm:block mr-1.5">
          <Button size="sm" variant="primary" onClick={() => navigate("/new")}>
            <Plus className="size-3.5" />
            New role
          </Button>
        </div>

        <ThemeMenu />

        <Menu
          width={240}
          trigger={(props) => (
            <Tooltip label="Account">
              <button
                {...props}
                aria-label="Account menu"
                className="size-8.5 rounded-full bg-fill text-[12px] font-semibold text-muted hover:text-ink hover:ring-2 hover:ring-line"
              >
                {initials(user?.name)}
              </button>
            </Tooltip>
          )}
        >
          <div className="px-2 py-2">
            <p className="t-sm font-medium text-ink truncate">
              {user?.name || "Signed in"}
            </p>
            {user?.email && (
              <p className="t-xs text-faint truncate mt-0.5">{user.email}</p>
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
