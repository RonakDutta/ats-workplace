import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Compass } from "lucide-react";
import MainLayout from "./layouts/MainLayout";
import OverviewView from "./pages/OverviewView";
import NewRoleView from "./pages/NewRoleView";
import RoleWorkspace from "./pages/RoleWorkspace";
import CandidatesView from "./pages/CandidatesView";
import SettingsView from "./pages/SettingsView";
import MetricsView from "./pages/MetricsView";
import AuthView from "./pages/AuthView";
import { ConfirmProvider } from "./components/ui/ConfirmProvider";
import EmptyState from "./components/ui/EmptyState";
import Button from "./components/ui/Button";
import { getToken } from "./lib/session";

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/auth" replace />;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState
      className="min-h-[70vh]"
      icon={Compass}
      title="This page does not exist"
      description="The link may be out of date, or the role it pointed to was deleted."
      action={
        <Button variant="primary" onClick={() => navigate("/")}>
          Back to overview
        </Button>
      }
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <Toaster
          position="bottom-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--overlay)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow-lg)",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 500,
              padding: "10px 14px",
              maxWidth: "360px",
            },
            success: { iconTheme: { primary: "var(--good)", secondary: "var(--surface)" } },
            error: { iconTheme: { primary: "var(--bad)", secondary: "var(--surface)" } },
            loading: { iconTheme: { primary: "var(--faint)", secondary: "var(--surface)" } },
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
            <Route index element={<OverviewView />} />
            <Route path="new" element={<NewRoleView />} />
            <Route path="role/:roleId" element={<RoleWorkspace />} />
            <Route path="candidates" element={<CandidatesView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="metrics" element={<MetricsView />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
