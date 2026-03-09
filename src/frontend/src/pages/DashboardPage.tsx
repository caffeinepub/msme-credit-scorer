import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Banknote,
  BarChart2,
  Bot,
  Building2,
  Calculator,
  CheckCircle2,
  Eye,
  FileText,
  HelpCircle,
  LineChart,
  MapPin,
  Radar,
  Shield,
  Sliders,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EMIAlertBanner } from "../components/EMIAlertBanner";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ScoreGauge } from "../components/ScoreGauge";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import {
  calculateBusinessHealth,
  calculateLenderConfidence,
  formatCurrency,
  getTraditionalScoreLabel,
  getTraditionalScoreTier,
} from "../lib/scoring";
import { getCashflow, getCreditScore, getProfile } from "../lib/store";
import type {
  BusinessHealthData,
  BusinessProfile,
  CashflowData,
  CreditScore,
  LenderConfidenceData,
} from "../lib/types";

export function DashboardPage() {
  const { user } = useAppContext();
  const t = useT();
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [cashflow, setCashflow] = useState<CashflowData | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [health, setHealth] = useState<BusinessHealthData | null>(null);
  const [confidence, setConfidence] = useState<LenderConfidenceData | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.id);
    const s = getCreditScore(user.id);
    const c = getCashflow(user.id);
    setCreditScore(s);
    setCashflow(c);
    setProfile(p);
    if (p && s) {
      setHealth(calculateBusinessHealth(p, s, c));
      setConfidence(calculateLenderConfidence(p, s, c));
    }
  }, [user]);

  const tierLabel = creditScore
    ? t(creditScore.riskTier.toLowerCase() as "low" | "medium" | "high")
    : "—";

  const tradScore = creditScore?.traditionalScore ?? null;
  const altScore = creditScore?.altScore ?? null;
  const scoreDiff =
    tradScore != null && altScore != null ? altScore - tradScore : null;

  const trustScore = creditScore?.trustScore ?? null;
  const trustTier =
    trustScore != null
      ? trustScore >= 70
        ? "Low"
        : trustScore >= 40
          ? "Medium"
          : "High"
      : null;

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {t("dashboard")}
              </h1>
              {profile && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{profile.businessName}</span>
                  <span className="text-border">·</span>
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
            {!profile && (
              <Button asChild size="sm" variant="outline">
                <Link to="/profile">
                  Complete Profile <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            )}
          </div>

          {/* EMI Risk Banner */}
          {cashflow && cashflow.emiRiskPercent > 25 && (
            <EMIAlertBanner
              emiRiskPercent={cashflow.emiRiskPercent}
              advice="Reduce expenses by 20% and avoid new EMI commitments."
            />
          )}

          {/* No profile CTA */}
          {!profile && !creditScore && (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="py-10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    Complete your business profile
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your business details to get your credit score
                  </p>
                </div>
                <Button asChild>
                  <Link to="/profile">Set Up Profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Score cards — 3-column: Alt Score + Traditional + Trust Score */}
          {creditScore && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Alt Score */}
              <Card
                data-ocid="dashboard.score.card"
                className="flex flex-col items-center pt-6 pb-4"
              >
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    {t("creditScore")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 opacity-70">
                    Alt Score (300–900)
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ScoreGauge
                    score={creditScore.altScore}
                    tier={creditScore.riskTier}
                    size="md"
                  />
                </CardContent>
              </Card>

              {/* Traditional Score */}
              <Card
                data-ocid="dashboard.traditional_score.card"
                className="flex flex-col pt-6 pb-4"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm text-muted-foreground font-medium">
                        Traditional Credit Score
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 opacity-70">
                        System Estimated (300–900)
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help group relative">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span className="hidden group-hover:block absolute right-0 top-5 w-48 bg-popover text-popover-foreground text-xs p-2 rounded shadow-md border border-border z-10">
                        Your traditional credit score is automatically estimated
                        by the system based on your revenue, expenses, business
                        age, and cashflow consistency.
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  {tradScore == null ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Complete your profile to generate your score.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-end gap-2">
                        <span
                          data-ocid="dashboard.traditional_score.score"
                          className="font-display font-bold text-5xl leading-none"
                        >
                          {tradScore}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">
                          / 900
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium w-fit"
                      >
                        System Estimated
                      </Badge>
                      <Badge
                        className={`text-xs font-semibold px-2 py-0.5 border ${
                          getTraditionalScoreTier(tradScore) === "Low"
                            ? "score-low"
                            : getTraditionalScoreTier(tradScore) === "Medium"
                              ? "score-medium"
                              : "score-high"
                        }`}
                      >
                        {getTraditionalScoreLabel(tradScore)}
                      </Badge>
                      {scoreDiff != null && (
                        <p className="text-xs text-muted-foreground">
                          {scoreDiff > 0 ? (
                            <span className="text-score-low">
                              Alt score is {Math.abs(scoreDiff)} pts higher —
                              strong for bank lending
                            </span>
                          ) : scoreDiff < 0 ? (
                            <span className="text-score-medium">
                              Traditional score is {Math.abs(scoreDiff)} pts
                              higher — good repayment history
                            </span>
                          ) : (
                            <span>Scores are equal — consistent profile</span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Trust Score */}
              <Card
                data-ocid="dashboard.trust_score.card"
                className="flex flex-col pt-6 pb-4"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    {t("trustScore")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 opacity-70">
                    Trust Score (0–100)
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {trustScore != null ? (
                    <>
                      <div className="flex items-end gap-2">
                        <span className="font-display font-bold text-5xl leading-none">
                          {trustScore}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">
                          / 100
                        </span>
                      </div>
                      {trustTier && (
                        <Badge
                          className={`text-xs font-semibold px-2 py-0.5 border w-fit ${
                            trustTier === "Low"
                              ? "score-low"
                              : trustTier === "Medium"
                                ? "score-medium"
                                : "score-high"
                          }`}
                        >
                          {trustTier === "Low"
                            ? "High Trust"
                            : trustTier === "Medium"
                              ? "Moderate Trust"
                              : "Low Trust"}
                        </Badge>
                      )}
                      <Progress value={trustScore} className="h-2 mt-1" />
                      <p className="text-xs text-muted-foreground">
                        Based on business age, stability, and expense efficiency
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Complete your profile to calculate trust score
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Business Health Meter + Lender Confidence — side by side */}
          {creditScore && profile && health && confidence && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Health Meter */}
              <Card data-ocid="dashboard.health.card">
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm text-muted-foreground font-medium">
                        {t("businessHealth")}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground opacity-70">
                        Live Financial Health Meter
                      </p>
                    </div>
                    <Badge
                      className={`text-xs px-2.5 py-1 border font-bold ${
                        health.status === "Strong"
                          ? "score-low"
                          : health.status === "Moderate"
                            ? "score-medium"
                            : "score-high"
                      }`}
                    >
                      {health.status === "Strong"
                        ? t("healthStrong")
                        : health.status === "Moderate"
                          ? t("healthModerate")
                          : t("healthRisky")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-5 space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="font-display font-bold text-4xl">
                      {health.score}
                    </span>
                    <span className="text-sm text-muted-foreground mb-1">
                      / 100
                    </span>
                  </div>
                  {/* Segmented meter */}
                  <div className="flex gap-1 h-3">
                    {["Risky", "Moderate", "Strong"].map((seg, i) => (
                      <div
                        key={seg}
                        className={`flex-1 rounded-full transition-all ${
                          health.status === "Strong" ||
                          (health.status === "Moderate" && i <= 1) ||
                          (health.status === "Risky" && i === 0)
                            ? health.status === "Strong"
                              ? "bg-score-low"
                              : health.status === "Moderate"
                                ? "bg-score-medium"
                                : "bg-score-high"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {health.description}
                  </p>
                  <div className="space-y-1.5">
                    {health.components.map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-32 shrink-0">
                          {c.label}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{
                              width: `${Math.round((c.value / c.maxValue) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                          {c.value}/{c.maxValue}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lender Confidence Score */}
              <Card data-ocid="dashboard.confidence.card">
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm text-muted-foreground font-medium">
                        {t("lenderConfidence")}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground opacity-70">
                        How lenders see your business
                      </p>
                    </div>
                    <span
                      className={`font-display font-bold text-2xl ${
                        confidence.score >= 65
                          ? "text-score-low"
                          : confidence.score >= 50
                            ? "text-score-medium"
                            : "text-score-high"
                      }`}
                    >
                      Grade {confidence.grade}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-5 space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="font-display font-bold text-4xl">
                      {confidence.score}
                    </span>
                    <span className="text-sm text-muted-foreground mb-1">
                      / 100
                    </span>
                    <Badge
                      className={`mb-1 text-xs px-2 py-0.5 border ml-1 ${
                        confidence.score >= 65
                          ? "score-low"
                          : confidence.score >= 50
                            ? "score-medium"
                            : "score-high"
                      }`}
                    >
                      {confidence.label}
                    </Badge>
                  </div>
                  <Progress value={confidence.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {confidence.description}
                  </p>
                  <div className="space-y-1.5">
                    {confidence.factors.map((f) => (
                      <div key={f.name} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-36 shrink-0">
                          {f.name}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              f.positive ? "bg-score-low" : "bg-score-medium"
                            }`}
                            style={{
                              width: `${Math.round((f.contribution / 30) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                          {f.contribution}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Risk Level Indicator */}
          {creditScore && (
            <div
              data-ocid="dashboard.risk.card"
              className={`rounded-xl p-4 flex items-center gap-4 border ${
                creditScore.riskTier === "Low"
                  ? "bg-score-low-bg border-score-low/30"
                  : creditScore.riskTier === "Medium"
                    ? "bg-score-medium-bg border-score-medium/30"
                    : "bg-score-high-bg border-score-high/30"
              }`}
            >
              {creditScore.riskTier === "Low" ? (
                <CheckCircle2 className="h-6 w-6 text-score-low shrink-0" />
              ) : creditScore.riskTier === "Medium" ? (
                <Shield className="h-6 w-6 text-score-medium shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-score-high shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">Risk Level:</span>
                  <Badge
                    className={`text-sm px-3 py-1 border font-bold ${
                      creditScore.riskTier === "Low"
                        ? "score-low"
                        : creditScore.riskTier === "Medium"
                          ? "score-medium"
                          : "score-high"
                    }`}
                  >
                    {tierLabel} Risk
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {creditScore.riskTier === "Low" &&
                    "Excellent creditworthiness — you're bank-ready for MSME loans"}
                  {creditScore.riskTier === "Medium" &&
                    "Good standing — a few improvements will move you to Low Risk"}
                  {creditScore.riskTier === "High" &&
                    "Needs attention — focus on reducing expenses and building business age"}
                </p>
              </div>
              <Link to="/score-breakdown">
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="dashboard.risk.button"
                  className="shrink-0 text-xs"
                >
                  View Breakdown
                </Button>
              </Link>
            </div>
          )}

          {/* Stability row */}
          {creditScore && (
            <Card data-ocid="dashboard.stability.card">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-sm text-muted-foreground font-medium">
                  {t("stabilityScore")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-display font-bold">
                    {creditScore.stabilityScore}
                    <span className="text-sm text-muted-foreground font-normal ml-1">
                      / 100
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {creditScore.stabilityScore >= 70
                      ? "Stable"
                      : creditScore.stabilityScore >= 40
                        ? "Moderate"
                        : "Unstable"}
                  </span>
                </div>
                <Progress value={creditScore.stabilityScore} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Profile summary */}
          {profile && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Monthly Revenue",
                  value: formatCurrency(profile.monthlyRevenue),
                },
                {
                  label: "Monthly Expenses",
                  value: formatCurrency(profile.monthlyExpenses),
                },
                {
                  label: "Net Margin",
                  value: `${Math.round(((profile.monthlyRevenue - profile.monthlyExpenses) / profile.monthlyRevenue) * 100)}%`,
                },
                { label: "Business Age", value: `${profile.businessAge} yrs` },
              ].map(({ label, value }) => (
                <Card key={label} className="p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-display font-bold text-lg mt-1">{value}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Quick actions grid */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tools &amp; Insights
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  to: "/cashflow",
                  icon: TrendingUp,
                  label: "Cashflow Analysis",
                  desc: "Track 3-month trends",
                  ocid: "dashboard.cashflow.link",
                },
                {
                  to: "/documents",
                  icon: FileText,
                  label: "Documents",
                  desc: "Upload KYC & financials",
                  ocid: "dashboard.documents.link",
                },
                {
                  to: "/simulator",
                  icon: Sliders,
                  label: "Score Simulator",
                  desc: "What-if scenarios",
                  ocid: "dashboard.simulator.link",
                },
                {
                  to: "/emi-calculator",
                  icon: Calculator,
                  label: t("emiCalculator"),
                  desc: "Calculate loan repayments",
                  ocid: "dashboard.emi.link",
                },
                {
                  to: "/score-breakdown",
                  icon: BarChart2,
                  label: t("scoreBreakdown"),
                  desc: "See what drives your score",
                  ocid: "dashboard.scorebreakdown.link",
                },
                {
                  to: "/ai-copilot",
                  icon: Bot,
                  label: t("aiCopilot"),
                  desc: "Personalized financial insights",
                  ocid: "dashboard.aicopilot.link",
                },
                {
                  to: "/peer-comparison",
                  icon: Users,
                  label: t("peerComparison"),
                  desc: "Compare with your industry",
                  ocid: "dashboard.peercomparison.link",
                },
                {
                  to: "/score-history",
                  icon: LineChart,
                  label: t("scoreHistory"),
                  desc: "Track score over time",
                  ocid: "dashboard.scorehistory.link",
                },
                {
                  to: "/credit-passport",
                  icon: Award,
                  label: t("creditPassport"),
                  desc: "Your digital credit identity",
                  ocid: "dashboard.creditpassport.link",
                },
                {
                  to: "/loan-marketplace",
                  icon: Banknote,
                  label: t("loanMarketplace"),
                  desc: "Find eligible loan products",
                  ocid: "dashboard.loanmarketplace.link",
                },
                {
                  to: "/risk-intelligence",
                  icon: Radar,
                  label: t("riskIntelligence"),
                  desc: "Detect financial risk patterns",
                  ocid: "dashboard.riskintelligence.link",
                },
                {
                  to: "/invisible-score",
                  icon: Eye,
                  label: "Invisible Credit Score",
                  desc: "Score without CIBIL history",
                  ocid: "dashboard.invisible_score.link",
                },
                {
                  to: "/loan-predictor",
                  icon: Target,
                  label: "Loan Approval Predictor",
                  desc: "AI approval probability per lender",
                  ocid: "dashboard.loan_predictor.link",
                },
                {
                  to: "/survival-score",
                  icon: Activity,
                  label: "Business Survival Score",
                  desc: "6-12 month survival forecast",
                  ocid: "dashboard.survival_score.link",
                },
              ].map(({ to, icon: Icon, label, desc, ocid }) => (
                <Link key={to} to={to}>
                  <Card
                    data-ocid={ocid}
                    className="p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {desc}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
