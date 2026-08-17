import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Home,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Logo, { LogoMark } from "./Logo";
import Menu, { MenuItem } from "./ui/Menu";
import Skeleton from "./ui/Skeleton";
import { useConfirm } from "./ui/confirm-context";
import { deleteRoleById, getAllRoles } from "../services/api";
import { ROLES_CHANGED } from "../lib/session";
import { cn } from "../lib/cn";

const PRIMARY = [{ to: "/", label: "Overview", icon: Home, end: true }];

const WORKPLACE = [
  { to: "/candidates", label: "Talent pool", icon: Users },
  { to: "/metrics", label: "Insights", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

// Navigation lives on the canvas, so the selected item is a raised white chip
// rather than a darker fill: it reads as the sheet the content sits on.
function navClasses({ isActive }, rail) {
  return cn(
    "group/link relative flex items-center h-9 rounded-sm text-[13.5px] font-medium",
    "transition-colors duration-120 ease-out-soft",
    rail ? "justify-center px-0 w-9 mx-auto" : "gap-2.5 px-2.5",
    isActive
      ? "bg-surface text-ink shadow-xs"
      : "text-muted hover:bg-surface/70 hover:text-ink",
  );
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  onClose,
  variant,
}) {
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const isRail = collapsed && variant === "desktop";
  const closeOnNav = variant === "mobile" ? onClose : undefined;

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await getAllRoles());
    } catch (error) {
      console.error("Failed to fetch roles for sidebar", error);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    window.addEventListener(ROLES_CHANGED, loadRoles);
    return () => window.removeEventListener(ROLES_CHANGED, loadRoles);
  }, [loadRoles]);

  const handleDeleteRole = async (role) => {
    const ok = await confirm({
      title: `Delete "${role.title}"?`,
      description:
        "This removes the role and every candidate analysed against it. It cannot be undone.",
      confirmLabel: "Delete role",
      destructive: true,
    });
    if (!ok) return;

    const toastId = toast.loading("Deleting role");
    try {
      await deleteRoleById(role.id);
      setRoles((prev) => prev.filter((item) => item.id !== role.id));
      if (location.pathname === `/role/${role.id}`) navigate("/");
      toast.success("Role deleted", { id: toastId });
    } catch {
      toast.error("Could not delete the role", { id: toastId });
    }
  };

  const pad = isRail ? "px-3" : "px-3.5";

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "flex items-center h-15 shrink-0",
          isRail ? "justify-center px-0" : cn("justify-between", pad),
        )}
      >
        {isRail ? <LogoMark /> : <Logo />}
        {variant === "mobile" && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="size-8 rounded-xs flex items-center justify-center text-faint hover:text-ink hover:bg-surface transition-colors"
          >
            <X className="size-4.5" />
          </button>
        )}
      </div>

      <div className={cn("pb-3", pad)}>
        <NavLink
          to="/new"
          onClick={closeOnNav}
          title={isRail ? "New role" : undefined}
          className={cn(
            "flex items-center h-9.5 rounded-md bg-accent text-on-accent shadow-xs",
            "text-[13.5px] font-medium transition-[background-color,transform] duration-150 ease-out-soft",
            "hover:bg-accent-hover active:scale-[0.985]",
            isRail ? "justify-center w-9 mx-auto" : "gap-2 px-3",
          )}
        >
          <Plus className="size-4 shrink-0" />
          {!isRail && "New role"}
        </NavLink>
      </div>

      <nav className={cn("flex flex-col gap-px pb-4", pad)}>
        {PRIMARY.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={closeOnNav}
            title={isRail ? label : undefined}
            className={(state) => navClasses(state, isRail)}
          >
            <Icon className="size-4 shrink-0 text-faint" />
            {!isRail && label}
          </NavLink>
        ))}
      </nav>

      <div className={cn("flex-1 overflow-y-auto custom-scrollbar pb-4", pad)}>
        {!isRail && (
          <p className="px-2.5 pb-2 text-[11.5px] font-medium text-faint tracking-[0.04em]">
            Roles
          </p>
        )}

        <nav className="flex flex-col gap-px">
          {loadingRoles ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className={cn("h-9 rounded-sm", isRail && "w-9 mx-auto")}
              />
            ))
          ) : roles.length === 0 ? (
            !isRail && (
              <p className="px-2.5 py-2 t-xs text-ghost">
                Roles you create appear here.
              </p>
            )
          ) : (
            roles.map((role) => (
              <div key={role.id} className="relative group">
                <NavLink
                  to={`/role/${role.id}`}
                  onClick={closeOnNav}
                  title={isRail ? role.title : undefined}
                  className={(state) => navClasses(state, isRail)}
                >
                  <FileText className="size-4 shrink-0 text-faint" />
                  {!isRail && (
                    <span className="truncate pr-5">{role.title}</span>
                  )}
                </NavLink>

                {!isRail && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Menu
                      width={176}
                      trigger={(props) => (
                        <button
                          {...props}
                          aria-label={`Options for ${role.title}`}
                          className="size-6.5 rounded-xs flex items-center justify-center text-faint hover:text-ink hover:bg-line transition-colors"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      )}
                    >
                      <MenuItem
                        icon={Trash2}
                        danger
                        onClick={() => handleDeleteRole(role)}
                      >
                        Delete role
                      </MenuItem>
                    </Menu>
                  </div>
                )}
              </div>
            ))
          )}
        </nav>
      </div>

      <div className={cn("shrink-0 pt-2 pb-3", pad)}>
        <nav className="flex flex-col gap-px">
          {WORKPLACE.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeOnNav}
              title={isRail ? label : undefined}
              className={(state) => navClasses(state, isRail)}
            >
              <Icon className="size-4 shrink-0 text-faint" />
              {!isRail && label}
            </NavLink>
          ))}
        </nav>

        {variant === "desktop" && (
          <button
            onClick={onToggleCollapsed}
            aria-label={isRail ? "Expand sidebar" : "Collapse sidebar"}
            title={isRail ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-px flex items-center h-9 rounded-sm text-[13.5px] font-medium",
              "text-faint hover:bg-surface/70 hover:text-ink transition-colors duration-120",
              isRail ? "justify-center w-9 mx-auto" : "gap-2.5 px-2.5 w-full",
            )}
          >
            {isRail ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" />
                Collapse
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
