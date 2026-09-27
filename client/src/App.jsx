import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import OverviewView from "./pages/OverviewView";
import NewRoleView from "./pages/NewRoleView";
import RoleWorkspace from "./pages/RoleWorkspace";
import CandidatesView from "./pages/CandidatesView";
import SettingsView from "./pages/SettingsView";
import MetricsView from "./pages/MetricsView";
import AuthView from "./pages/AuthView";
import { ConfirmProvider } from "./components/ui/ConfirmProvider";
import PageHeader, { Page } from "./components/PageHeader";
import { Card } from "./components/ui/Card";
import EmptyState from "./components/ui/EmptyState";
import Button from "./components/ui/Button";
import { getToken } from "./lib/session";

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/auth" replace />;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <Page>
      <PageHeader crumbs={[{ label: "Overview", to: "/" }, { label: "Not found" }]} title="Page not found" />
      <Card>
        <EmptyState
          title="This page does not exist"
          description="The link may be out of date, or the role it pointed to was deleted."
          action={
            <Button variant="primary" onClick={() => navigate("/")}>
              Back to overview
            </Button>
          }
        />
      </Card>
    </Page>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <Toaster
          position="bottom-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--overlay)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow-lg)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 12px",
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
