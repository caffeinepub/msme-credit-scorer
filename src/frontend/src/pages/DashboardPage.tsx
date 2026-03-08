import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Calculator,
  FileText,
  HelpCircle,
  MapPin,
  Sliders,
  TrendingUp,
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
  formatCurrency,
  getTraditionalScoreLabel,
  getTraditionalScoreTier,
} from "../lib/scoring";
import {
  getCashflow,
  getCreditScore,
  getProfile,
  saveTraditionalScore,
} from "../lib/store";
import type { BusinessProfile, CashflowData, CreditScore } from "../lib/types";

export function DashboardPage() {
  const { user } = useAppContext();
  const t = useT();
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [cashflow, setCashflow] = useState<CashflowData | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [cibilInput, setCibilInput] = useState<string>("");
  const [cibilError, setCibilError] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    setCreditScore(getCreditScore(user.id));
    setCashflow(getCashflow(user.id));
    setProfile(getProfile(user.id));
  }, [user]);

  const tierLabel = creditScore
    ? t(creditScore.riskTier.toLowerCase() as "low" | "medium" | "high")
    : "—";

  function handleSaveCibil() {
    if (!user) return;
    const val = Number.parseInt(cibilInput, 10);
    if (Number.isNaN(val) || val < 300 || val > 900) {
      setCibilError("Please enter a valid score between 300 and 900");
      return;
    }
    setCibilError("");
    saveTraditionalScore(user.id, val);
    const updated = getCreditScore(user.id);
    setCreditScore(updated);
    setCibilInput("");
    toast.success("CIBIL score saved successfully");
  }

  const tradScore = creditScore?.traditionalScore ?? null;
  const altScore = creditScore?.altScore ?? null;
  const scoreDiff =
    tradScore != null && altScore != null ? altScore - tradScore : null;

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

          {/* Score cards — Alt Score + Traditional Score side by side */}
          {creditScore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        {t("traditionalScore")}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 opacity-70">
                        CIBIL Score (300–900)
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help group relative">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span className="hidden group-hover:block absolute right-0 top-5 w-48 bg-popover text-popover-foreground text-xs p-2 rounded shadow-md border border-border z-10">
                        CIBIL is India's traditional credit bureau score.
                        Combined with your Alt Score, it gives lenders a
                        complete picture.
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  {tradScore == null ? (
                    /* Enter CIBIL Score */
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {t("enterCibilScore")}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          data-ocid="dashboard.traditional_score.input"
                          type="number"
                          min={300}
                          max={900}
                          placeholder={t("cibilScoreRange")}
                          value={cibilInput}
                          onChange={(e) => {
                            setCibilInput(e.target.value);
                            setCibilError("");
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveCibil()
                          }
                          className="text-sm"
                        />
                        <Button
                          data-ocid="dashboard.traditional_score.save_button"
                          size="sm"
                          onClick={handleSaveCibil}
                        >
                          {t("save")}
                        </Button>
                      </div>
                      {cibilError && (
                        <p className="text-xs text-destructive">{cibilError}</p>
                      )}
                      <p className="text-xs text-muted-foreground opacity-60">
                        {t("whyTwoScores")} Alt score uses business data; CIBIL
                        uses repayment history. Banks check both.
                      </p>
                    </div>
                  ) : (
                    /* Display CIBIL Score */
                    <div className="space-y-3">
                      <div className="flex items-end gap-2">
                        <span className="font-display font-bold text-5xl leading-none">
                          {tradScore}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">
                          / 900
                        </span>
                      </div>
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
                              CIBIL is {Math.abs(scoreDiff)} pts higher — good
                              repayment history
                            </span>
                          ) : (
                            <span>Scores are equal — consistent profile</span>
                          )}
                        </p>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground h-auto p-0 hover:text-foreground"
                        onClick={() => {
                          if (!user) return;
                          saveTraditionalScore(user.id, 0);
                          const updated = getCreditScore(user.id);
                          // Reset to null effectively
                          if (updated)
                            setCreditScore({
                              ...updated,
                              traditionalScore: null,
                            });
                        }}
                      >
                        Update CIBIL score
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Risk + Stability row */}
          {creditScore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card data-ocid="dashboard.risk.card">
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    {t("riskTier")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3 pb-4">
                  <Badge
                    className={`text-base px-4 py-1.5 border font-semibold ${
                      creditScore.riskTier === "Low"
                        ? "score-low"
                        : creditScore.riskTier === "Medium"
                          ? "score-medium"
                          : "score-high"
                    }`}
                  >
                    {tierLabel}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {creditScore.riskTier === "Low" &&
                      "Excellent creditworthiness — bank-ready"}
                    {creditScore.riskTier === "Medium" &&
                      "Good standing — some improvement areas"}
                    {creditScore.riskTier === "High" &&
                      "Needs attention — focus on expenses & age"}
                  </div>
                </CardContent>
              </Card>

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
                  <Progress
                    value={creditScore.stabilityScore}
                    className="h-2"
                  />
                </CardContent>
              </Card>
            </div>
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

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                to: "/cashflow",
                icon: TrendingUp,
                label: "Cashflow Analysis",
                desc: "Track 3-month trends",
              },
              {
                to: "/documents",
                icon: FileText,
                label: "Documents",
                desc: "Upload KYC & financials",
              },
              {
                to: "/simulator",
                icon: Sliders,
                label: "Score Simulator",
                desc: "What-if scenarios",
              },
              {
                to: "/emi-calculator",
                icon: Calculator,
                label: t("emiCalculator"),
                desc: "Calculate loan repayments",
              },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to}>
                <Card className="p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group">
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
      </PageLayout>
    </ProtectedRoute>
  );
}
