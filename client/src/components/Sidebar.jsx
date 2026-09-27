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
import Menu, { MenuItem } from "./ui/Menu";
import Skeleton from "./ui/Skeleton";
import { useConfirm } from "./ui/confirm-context";
import { deleteRoleById, getAllRoles } from "../services/api";
import { ROLES_CHANGED } from "../lib/session";
import { cn } from "../lib/cn";

const WORKPLACE = [
  { to: "/candidates", label: "Talent pool", icon: Users },
  { to: "/metrics", label: "Insights", icon: BarChart3 },
];

function navClasses({ isActive }, rail) {
  return cn(
    "flex items-center min-h-8.5 rounded-lg text-[14px] font-medium transition-colors duration-150",
    rail ? "justify-center w-9 mx-auto" : "gap-2.5 px-3",
    isActive
      ? "bg-recessed text-ink ring-1 ring-line-soft"
      : "text-faint hover:bg-hover hover:text-ink",
  );
}

function NavItem({ to, label, icon: Icon, end, rail, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={rail ? label : undefined}
      className={(state) => navClasses(state, rail)}
    >
      <Icon className="size-4 shrink-0" />
      {!rail && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function GroupLabel({ children, action }) {
  return (
    <div className="flex items-center justify-between h-7 px-3 mt-5 mb-1">
      <p className="text-[13px] font-medium text-faint">{children}</p>
      {action}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggleCollapsed, onClose, variant }) {
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const rail = collapsed && variant === "desktop";
  const onNavigate = variant === "mobile" ? onClose : undefined;

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

  return (
    <div className="flex flex-col h-full bg-surface">
      {variant === "mobile" && (
        <div className="flex items-center justify-between h-14 px-4 border-b border-line shrink-0">
          <span className="t-sm font-semibold">Navigation</span>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="size-8.5 rounded-lg flex items-center justify-center text-faint hover:text-ink hover:bg-hover"
          >
            <X className="size-4.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
        <nav className="flex flex-col gap-1">
          <NavItem to="/" end label="Overview" icon={Home} rail={rail} onNavigate={onNavigate} />
          {variant === "mobile" && (
            <NavItem to="/new" label="New role" icon={Plus} onNavigate={onNavigate} />
          )}
        </nav>

        {rail ? (
          <div className="h-px bg-line-soft my-3 mx-2" />
        ) : (
          <GroupLabel
            action={
              <NavLink
                to="/new"
                onClick={onNavigate}
                title="New role"
                aria-label="New role"
                className="size-6 -mr-1.5 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-hover"
              >
                <Plus className="size-3.5" />
              </NavLink>
            }
          >
            Roles
          </GroupLabel>
        )}

        <nav className="flex flex-col gap-1">
          {loadingRoles ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className={cn("h-8.5 rounded-lg", rail && "w-9 mx-auto")} />
            ))
          ) : roles.length === 0 ? (
            !rail && (
              <p className="px-3 py-1.5 t-sm text-ghost">No roles yet.</p>
            )
          ) : (
            roles.map((role) => (
              <div key={role.id} className="relative group">
                <NavLink
                  to={`/role/${role.id}`}
                  onClick={onNavigate}
                  title={rail ? role.title : undefined}
                  className={(state) => navClasses(state, rail)}
                >
                  <FileText className="size-4 shrink-0" />
                  {!rail && <span className="truncate pr-6">{role.title}</span>}
                </NavLink>

                {!rail && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    <Menu
                      width={176}
                      trigger={(props) => (
                        <button
                          {...props}
                          aria-label={`Options for ${role.title}`}
                          className="size-6.5 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-fill"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      )}
                    >
                      <MenuItem icon={Trash2} danger onClick={() => handleDeleteRole(role)}>
                        Delete role
                      </MenuItem>
                    </Menu>
                  </div>
                )}
              </div>
            ))
          )}
        </nav>

        {rail ? (
          <div className="h-px bg-line-soft my-3 mx-2" />
        ) : (
          <GroupLabel>Workplace</GroupLabel>
        )}

        <nav className="flex flex-col gap-1">
          {WORKPLACE.map((item) => (
            <NavItem key={item.to} {...item} rail={rail} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-line px-2 py-2 flex flex-col gap-1">
        <NavItem to="/settings" label="Settings" icon={Settings} rail={rail} onNavigate={onNavigate} />
        {variant === "desktop" && (
          <button
            onClick={onToggleCollapsed}
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            title={rail ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex items-center min-h-8.5 rounded-lg text-[14px] font-medium text-faint hover:bg-hover hover:text-ink",
              rail ? "justify-center w-9 mx-auto" : "gap-2.5 px-3",
            )}
          >
            {rail ? (
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
