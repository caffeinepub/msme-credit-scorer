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

import { AICoPilotPage } from "./pages/AICoPilotPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { BusinessSurvivalScorePage } from "./pages/BusinessSurvivalScorePage";
import { CashflowPage } from "./pages/CashflowPage";
import { CreditPassportPage } from "./pages/CreditPassportPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { EMICalculatorPage } from "./pages/EMICalculatorPage";
import { InvisibleCreditScorePage } from "./pages/InvisibleCreditScorePage";
import { LoanApprovalPredictorPage } from "./pages/LoanApprovalPredictorPage";
import { LoanMarketplacePage } from "./pages/LoanMarketplacePage";
import { LoginPage } from "./pages/LoginPage";
import { PeerComparisonPage } from "./pages/PeerComparisonPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RiskIntelligencePage } from "./pages/RiskIntelligencePage";
import { ScoreBreakdownPage } from "./pages/ScoreBreakdownPage";
import { ScoreHistoryPage } from "./pages/ScoreHistoryPage";
import { SignupPage } from "./pages/SignupPage";
import { SimulatorPage } from "./pages/SimulatorPage";

function RootLayout() {
  return <Outlet />;
}

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

const scoreBreakdownRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/score-breakdown",
  component: ScoreBreakdownPage,
});

const aiCopilotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-copilot",
  component: AICoPilotPage,
});

const peerComparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/peer-comparison",
  component: PeerComparisonPage,
});

const scoreHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/score-history",
  component: ScoreHistoryPage,
});

const creditPassportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/credit-passport",
  component: CreditPassportPage,
});

const loanMarketplaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/loan-marketplace",
  component: LoanMarketplacePage,
});

const riskIntelligenceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/risk-intelligence",
  component: RiskIntelligencePage,
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

const invisibleScoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invisible-score",
  component: InvisibleCreditScorePage,
});

const loanPredictorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/loan-predictor",
  component: LoanApprovalPredictorPage,
});

const survivalScoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/survival-score",
  component: BusinessSurvivalScorePage,
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
  scoreBreakdownRoute,
  aiCopilotRoute,
  peerComparisonRoute,
  scoreHistoryRoute,
  creditPassportRoute,
  loanMarketplaceRoute,
  riskIntelligenceRoute,
  adminRoute,
  adminUsersRoute,
  invisibleScoreRoute,
  loanPredictorRoute,
  survivalScoreRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

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
