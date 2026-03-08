import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppContext } from "./hooks/useAppContext";
import type { Language } from "./lib/i18n";
import { getLanguage, getSession, seedIfEmpty } from "./lib/store";
import type { User } from "./lib/types";

import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { CashflowPage } from "./pages/CashflowPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { EMICalculatorPage } from "./pages/EMICalculatorPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SignupPage } from "./pages/SignupPage";
import { SimulatorPage } from "./pages/SimulatorPage";

// ── Root layout ──────────────────────────────────────────────
function RootLayout() {
  return <Outlet />;
}

// ── Route tree ───────────────────────────────────────────────
const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/login" />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const cashflowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cashflow",
  component: CashflowPage,
});

const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documents",
  component: DocumentsPage,
});

const simulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/simulator",
  component: SimulatorPage,
});

const emiCalculatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/emi-calculator",
  component: EMICalculatorPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboardPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/users",
  component: AdminUsersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  dashboardRoute,
  profileRoute,
  cashflowRoute,
  documentsRoute,
  simulatorRoute,
  emiCalculatorRoute,
  adminRoute,
  adminUsersRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── App root with context ─────────────────────────────────────
export default function App() {
  useEffect(() => {
    seedIfEmpty();
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    const session = getSession();
    return session?.user ?? null;
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (getLanguage() as Language) || "en";
  });

  return (
    <AppContext.Provider value={{ user, setUser, language, setLanguage }}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AppContext.Provider>
  );
}
