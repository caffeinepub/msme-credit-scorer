import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Radar,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { formatCurrency, getRiskAlerts } from "../lib/scoring";
import { getCashflow, getCreditScore, getProfile } from "../lib/store";
import type {
  BusinessProfile,
  CashflowData,
  CreditScore,
  RiskAlert,
} from "../lib/types";

const severityConfig = {
  critical: {
    icon: AlertCircle,
    label: "Critical",
    cardClass: "border-score-high/30 bg-score-high-bg",
    iconClass: "text-score-high",
    badgeClass: "score-high",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    cardClass: "border-score-medium/30 bg-score-medium-bg",
    iconClass: "text-score-medium",
    badgeClass: "score-medium",
  },
  info: {
    icon: Info,
    label: "Info",
    cardClass: "border-blue-500/20 bg-blue-500/5",
    iconClass: "text-blue-500",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
};

function AlertCard({ alert, index }: { alert: RiskAlert; index: number }) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <Card
      data-ocid={`riskintelligence.alert.item.${index + 1}`}
      className={`${config.cardClass} border`}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div
            className={
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-background/60"
            }
          >
            <Icon className={`h-4 w-4 ${config.iconClass}`} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="font-semibold text-sm">{alert.title}</p>
              <Badge
                className={`text-xs px-2 py-0.5 border shrink-0 ${config.badgeClass}`}
              >
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {alert.description}
            </p>
            <div className="rounded-lg bg-background/50 border border-border/50 p-2.5">
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Recommendation
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {alert.recommendation}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskIntelligencePage() {
  const { user } = useAppContext();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [cashflow, setCashflow] = useState<CashflowData | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);

  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.id);
    const s = getCreditScore(user.id);
    const c = getCashflow(user.id);
    setProfile(p);
    setCreditScore(s);
    setCashflow(c);
    if (p && s) {
      setAlerts(getRiskAlerts(p, s, c));
    }
  }, [user]);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const infoCount = alerts.filter((a) => a.severity === "info").length;

  const expenseRatio =
    profile && profile.monthlyRevenue > 0
      ? (profile.monthlyExpenses / profile.monthlyRevenue) * 100
      : null;

  const cashflowTrend = cashflow
    ? cashflow.month3Revenue > cashflow.month1Revenue
      ? "improving"
      : cashflow.month3Revenue < cashflow.month1Revenue
        ? "declining"
        : "stable"
    : null;

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up max-w-3xl mx-auto">
          {/* Back */}
          <Link to="/dashboard">
            <button
              data-ocid="riskintelligence.back.button"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Radar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Risk Intelligence
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Detected patterns and risk alerts for your business
              </p>
            </div>
          </div>

          {/* Empty state */}
          {!profile && (
            <Card
              data-ocid="riskintelligence.empty_state"
              className="border-dashed border-2"
            >
              <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
                <Radar className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold">No data to analyze</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your profile and cashflow data to see risk alerts
                  </p>
                </div>
                <Link to="/profile">
                  <button
                    data-ocid="riskintelligence.profile.button"
                    className="text-sm text-primary hover:underline"
                    type="button"
                  >
                    Set up your profile →
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Summary cards */}
          {profile && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card
                data-ocid="riskintelligence.critical.card"
                className={criticalCount > 0 ? "border-score-high/30" : ""}
              >
                <CardContent className="pt-4 pb-4 text-center">
                  <p
                    className={`font-display font-bold text-3xl ${
                      criticalCount > 0 ? "text-score-high" : "text-foreground"
                    }`}
                  >
                    {criticalCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Critical
                  </p>
                </CardContent>
              </Card>
              <Card data-ocid="riskintelligence.warning.card">
                <CardContent className="pt-4 pb-4 text-center">
                  <p
                    className={`font-display font-bold text-3xl ${
                      warningCount > 0 ? "text-score-medium" : "text-foreground"
                    }`}
                  >
                    {warningCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Warnings
                  </p>
                </CardContent>
              </Card>
              <Card data-ocid="riskintelligence.info.card">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="font-display font-bold text-3xl">{infoCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Info</p>
                </CardContent>
              </Card>
              <Card data-ocid="riskintelligence.status.card">
                <CardContent className="pt-4 pb-4 text-center">
                  <p
                    className={`font-display font-bold text-lg ${
                      criticalCount === 0 && warningCount === 0
                        ? "text-score-low"
                        : criticalCount > 0
                          ? "text-score-high"
                          : "text-score-medium"
                    }`}
                  >
                    {criticalCount === 0 && warningCount === 0
                      ? "Clean"
                      : criticalCount > 0
                        ? "At Risk"
                        : "Caution"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Overall
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pattern Analysis */}
          {profile && creditScore && (
            <Card data-ocid="riskintelligence.patterns.panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">
                  Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5 space-y-3">
                {[
                  {
                    label: "Expense Ratio",
                    value:
                      expenseRatio != null
                        ? `${expenseRatio.toFixed(1)}%`
                        : "—",
                    status:
                      expenseRatio == null
                        ? "ok"
                        : expenseRatio < 65
                          ? "good"
                          : expenseRatio < 80
                            ? "warning"
                            : "critical",
                    note:
                      expenseRatio == null
                        ? ""
                        : expenseRatio < 65
                          ? "Healthy spending pattern"
                          : expenseRatio < 80
                            ? "Elevated — reduce to below 65%"
                            : "Critical — immediate action needed",
                  },
                  {
                    label: "Revenue Trend (3 months)",
                    value: cashflowTrend
                      ? cashflowTrend.charAt(0).toUpperCase() +
                        cashflowTrend.slice(1)
                      : "No data",
                    status:
                      cashflowTrend === "improving"
                        ? "good"
                        : cashflowTrend === "declining"
                          ? "warning"
                          : "ok",
                    note:
                      cashflowTrend === "improving"
                        ? "Positive momentum"
                        : cashflowTrend === "declining"
                          ? "Revenue falling — investigate causes"
                          : "Stable revenue pattern",
                  },
                  {
                    label: "Alt Credit Score",
                    value: String(creditScore.altScore),
                    status:
                      creditScore.altScore >= 650
                        ? "good"
                        : creditScore.altScore >= 500
                          ? "warning"
                          : "critical",
                    note:
                      creditScore.altScore >= 650
                        ? "Bank loan eligible"
                        : creditScore.altScore >= 500
                          ? "NBFC eligible only"
                          : "Below minimum threshold",
                  },
                  {
                    label: "EMI Stress Level",
                    value: cashflow ? `${cashflow.emiRiskPercent}%` : "No data",
                    status: !cashflow
                      ? "ok"
                      : cashflow.emiRiskPercent < 15
                        ? "good"
                        : cashflow.emiRiskPercent < 30
                          ? "warning"
                          : "critical",
                    note: !cashflow
                      ? "Add cashflow data"
                      : cashflow.emiRiskPercent < 15
                        ? "Safe for loan EMI"
                        : cashflow.emiRiskPercent < 30
                          ? "Monitor closely"
                          : "Not safe for new EMI",
                  },
                ].map(({ label, value, status, note }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {status === "good" ? (
                        <TrendingUp className="h-4 w-4 text-score-low shrink-0" />
                      ) : status === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-score-medium shrink-0" />
                      ) : status === "critical" ? (
                        <AlertCircle className="h-4 w-4 text-score-high shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{note}</p>
                      </div>
                    </div>
                    <span
                      className={`font-display font-bold text-sm shrink-0 ${
                        status === "good"
                          ? "text-score-low"
                          : status === "critical"
                            ? "text-score-high"
                            : status === "warning"
                              ? "text-score-medium"
                              : "text-muted-foreground"
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Alerts */}
          {alerts.length > 0 && (
            <div data-ocid="riskintelligence.alerts.list" className="space-y-3">
              <p className="text-sm font-semibold">
                {alerts.length} Active Alert
                {alerts.length !== 1 ? "s" : ""}
              </p>
              {alerts.map((alert, i) => (
                <AlertCard key={alert.id} alert={alert} index={i} />
              ))}
            </div>
          )}

          {/* All clear */}
          {alerts.length === 0 && profile && (
            <Card data-ocid="riskintelligence.success_state">
              <CardContent className="py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-score-low mx-auto mb-3" />
                <p className="font-semibold text-foreground">
                  No risk alerts detected
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your business profile looks healthy. Keep maintaining your
                  current performance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
