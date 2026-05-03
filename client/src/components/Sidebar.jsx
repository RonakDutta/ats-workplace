import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  FileText,
  Users,
  Settings,
  Database,
  Trash2,
  LogOut,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { getAllRoles, deleteRoleById } from "../services/api";

const Sidebar = () => {
  const [savedRoles, setSavedRoles] = useState([]);
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const savedUser = localStorage.getItem("ats_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const fetchRoles = async () => {
      try {
        const response = await getAllRoles();
        setSavedRoles(response);
      } catch (error) {
        console.error("Failed to fetch roles for sidebar", error);
      }
    };
    fetchRoles();
  }, [location]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("ats_token");
      localStorage.removeItem("ats_user");
      navigate("/auth");
      toast.success("Logged out successfully");
    }
  };

  const handleDeleteRole = async (e, roleId) => {
    e.preventDefault();
    if (
      window.confirm("Delete this role and all its candidates permanently?")
    ) {
      const toastId = toast.loading("Deleting workspace...");
      try {
        await deleteRoleById(roleId);
        setSavedRoles((prev) => prev.filter((role) => role.id !== roleId));
        if (location.pathname === `/role/${roleId}`) navigate("/new");
        toast.success("Workspace deleted", { id: toastId });
      } catch (error) {
        toast.error("Failed to delete role", { id: toastId });
      }
    }
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${
      isActive
        ? "bg-zinc-200/60 text-zinc-900 font-semibold"
        : "text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900 font-medium"
    }`;

  // Shared inner content
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-1 mb-6">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
          <Layers className="w-4 h-4" />
        </div>
        <span className="font-bold text-zinc-900 text-lg tracking-tight">
          ATS Workspace
        </span>
      </div>

      {/* User card */}
      <div className="flex items-center justify-between p-2 mb-6 bg-white border border-zinc-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-zinc-700 truncate max-w-25">
              {user?.name || "User"}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* New role */}
      <div className="mb-6">
        <NavLink
          to="/new"
          className="flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Role Profile
        </NavLink>
      </div>

      {/* Roles list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        <div className="mb-8">
          <h3 className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Active Roles
          </h3>
          <nav className="flex flex-col gap-0.5">
            {savedRoles.length === 0 ? (
              <p className="px-3 text-xs text-zinc-400 italic mt-1">
                No saved drafts yet.
              </p>
            ) : (
              savedRoles.map((role) => (
                <div key={role.id} className="relative group">
                  <NavLink to={`/role/${role.id}`} className={navLinkClasses}>
                    <FileText className="w-4 h-4 shrink-0 text-zinc-400" />
                    <span className="truncate pr-6">{role.title}</span>
                  </NavLink>
                  <button
                    onClick={(e) => handleDeleteRole(e, role.id)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-white rounded-md transition-all border border-transparent hover:border-zinc-200
                      opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    title="Delete Role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>
        </div>

        <div>
          <h3 className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Database
          </h3>
          <nav className="flex flex-col gap-0.5">
            <NavLink to="/candidates" className={navLinkClasses}>
              <Users className="w-4 h-4 text-zinc-400" />
              All Candidates
            </NavLink>
            <NavLink to="/metrics" className={navLinkClasses}>
              <Database className="w-4 h-4 text-zinc-400" />
              System Metrics
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-auto pt-4 border-t border-zinc-200">
        <NavLink to="/settings" className={navLinkClasses}>
          <Settings className="w-4 h-4 text-zinc-400" />
          Settings & API
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 h-screen bg-[#F9FAFB] border-r border-zinc-200 flex-col pt-6 pb-6 px-4 shrink-0 font-sans">
        <SidebarContent />
      </aside>

      {/* Mobile  */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden opacity-90 fixed top-4 left-4 z-50 p-2 bg-white border border-zinc-200 rounded-lg shadow-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#F9FAFB] border-r border-zinc-200 flex flex-col pt-6 pb-6 px-4 font-sans transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
