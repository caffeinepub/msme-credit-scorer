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
import { AnimatedBackground } from "./AnimatedBackground";
import { AppContext } from "./hooks/useAppContext";
import type { Language } from "./lib/i18n";
import { getLanguage, getSession, seedIfEmpty } from "./lib/store";
import type { User } from "./lib/types";

import { AICoPilotPage } from "./pages/AICoPilotPage";
import { AIFraudDetectionPage } from "./pages/AIFraudDetectionPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { BankLoanRecommendationPage } from "./pages/BankLoanRecommendationPage";
import { BusinessSurvivalScorePage } from "./pages/BusinessSurvivalScorePage";
import { CashflowPage } from "./pages/CashflowPage";
import { CreditPassportPage } from "./pages/CreditPassportPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { EMICalculatorPage } from "./pages/EMICalculatorPage";
import { InvisibleCreditScorePage } from "./pages/InvisibleCreditScorePage";
import { LoanApprovalPredictorPage } from "./pages/LoanApprovalPredictorPage";
import { LoanEligibilityPage } from "./pages/LoanEligibilityPage";
import { LoanMarketplacePage } from "./pages/LoanMarketplacePage";
import { LoanPreApprovalPage } from "./pages/LoanPreApprovalPage";
import { LoginPage } from "./pages/LoginPage";
import { MSMEHealthAnalyticsPage } from "./pages/MSMEHealthAnalyticsPage";
import { PeerComparisonPage } from "./pages/PeerComparisonPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RepaymentRiskMonitorPage } from "./pages/RepaymentRiskMonitorPage";
import { RiskIntelligencePage } from "./pages/RiskIntelligencePage";
import { ScoreBreakdownPage } from "./pages/ScoreBreakdownPage";
import { ScoreHistoryPage } from "./pages/ScoreHistoryPage";
import { SignupPage } from "./pages/SignupPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { SmartLoanRecommendationPage } from "./pages/SmartLoanRecommendationPage";
import { UPICreditScorePage } from "./pages/UPICreditScorePage";

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

const upiCreditScoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upi-credit-score",
  component: UPICreditScorePage,
});

const aiFraudDetectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-fraud-detection",
  component: AIFraudDetectionPage,
});

const smartLoanRecommendationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/smart-loan-recommendation",
  component: SmartLoanRecommendationPage,
});

const msmeHealthAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/msme-health-analytics",
  component: MSMEHealthAnalyticsPage,
});

const repaymentRiskMonitorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/repayment-risk-monitor",
  component: RepaymentRiskMonitorPage,
});

const loanEligibilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/loan-eligibility",
  component: LoanEligibilityPage,
});

const bankLoanRecommendationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bank-loan-recommendation",
  component: BankLoanRecommendationPage,
});

const loanPreApprovalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/loan-preapproval",
  component: LoanPreApprovalPage,
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
  upiCreditScoreRoute,
  aiFraudDetectionRoute,
  smartLoanRecommendationRoute,
  msmeHealthAnalyticsRoute,
  repaymentRiskMonitorRoute,
  loanEligibilityRoute,
  bankLoanRecommendationRoute,
  loanPreApprovalRoute,
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
      {/* Premium animated background — fixed layer behind all content */}
      <AnimatedBackground />
      {/* App content rendered above the animation */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </div>
    </AppContext.Provider>
  );
}
