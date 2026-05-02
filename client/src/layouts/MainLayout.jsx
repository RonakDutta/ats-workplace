import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  return (
    <div className="flex h-screen w-full bg-white text-zinc-900 font-sans overflow-hidden">
      <Sidebar />

      {/* The main content area where pages will render */}
      <main className="flex-1 overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
