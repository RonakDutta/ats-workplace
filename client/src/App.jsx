import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import RoleEditor from "./components/RoleEditor";
import CandidatesView from "./pages/CandidatesView";
import SettingsView from "./pages/SettingsView";
import MetricsView from "./pages/MetricsView";
import AuthView from "./pages/AuthView";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("ats_token");
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#18181b", // zinc-900
            color: "#fff",
            fontSize: "14px",
            borderRadius: "8px",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <Routes>
        <Route path="/auth" element={<AuthView />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleEditor />} />
          <Route path="new" element={<RoleEditor />} />
          <Route path="role/:roleId" element={<RoleEditor />} />
          <Route path="candidates" element={<CandidatesView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="metrics" element={<MetricsView />} />
          <Route
            path="*"
            element={<div className="p-12">404 - Not Found</div>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
