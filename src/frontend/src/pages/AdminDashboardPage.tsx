import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useT } from "../hooks/useT";
import {
  getAllProfiles,
  getAllScores,
  getAllUsers,
  getFraudAlerts,
} from "../lib/store";
import type { RiskTier } from "../lib/types";

interface AdminStats {
  totalUsers: number;
  borrowers: number;
  byTier: Record<RiskTier, number>;
  fraudCount: number;
  profileCount: number;
}

export function AdminDashboardPage() {
  const t = useT();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    borrowers: 0,
    byTier: { Low: 0, Medium: 0, High: 0 },
    fraudCount: 0,
    profileCount: 0,
  });
  const [fraudAlerts, setFraudAlerts] = useState<
    ReturnType<typeof getFraudAlerts>
  >([]);

  useEffect(() => {
    const users = getAllUsers();
    const scores = getAllScores();
    const alerts = getFraudAlerts();
    const profiles = getAllProfiles();

    const byTier: Record<RiskTier, number> = { Low: 0, Medium: 0, High: 0 };
    for (const s of scores) {
      byTier[s.riskTier] = (byTier[s.riskTier] ?? 0) + 1;
    }

    setStats({
      totalUsers: users.length,
      borrowers: users.filter((u) => u.role === "borrower").length,
      byTier,
      fraudCount: alerts.length,
      profileCount: profiles.length,
    });
    setFraudAlerts(alerts);
  }, []);

  return (
    <ProtectedRoute adminOnly>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">
                {t("admin")} Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Platform overview and risk management
              </p>
            </div>
            <Button asChild size="sm" data-ocid="admin.users.link">
              <Link to="/admin/users">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                View All Users
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div
            data-ocid="admin.stats.panel"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              {
                icon: Users,
                label: "Total Users",
                value: stats.totalUsers,
                sub: `${stats.borrowers} borrowers`,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: Building2,
                label: "Profiles",
                value: stats.profileCount,
                sub: "business profiles",
                color: "text-score-low",
                bg: "bg-score-low-bg",
              },
              {
                icon: TrendingUp,
                label: "Scored Users",
                value:
                  stats.byTier.Low + stats.byTier.Medium + stats.byTier.High,
                sub: "with credit score",
                color: "text-score-medium",
                bg: "bg-score-medium-bg",
              },
              {
                icon: ShieldAlert,
                label: "Fraud Alerts",
                value: stats.fraudCount,
                sub: "flagged users",
                color: "text-score-high",
                bg: "bg-score-high-bg",
              },
            ].map(({ icon: Icon, label, value, sub, color, bg }) => (
              <Card key={label}>
                <CardContent className="pt-5 pb-5">
                  <div
                    className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${color}`} />
                  </div>
                  <p className="text-2xl font-display font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Risk Tier breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("byRiskTier")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                {(
                  [
                    ["Low", "score-low"],
                    ["Medium", "score-medium"],
                    ["High", "score-high"],
                  ] as const
                ).map(([tier, cls]) => {
                  const count = stats.byTier[tier];
                  const total =
                    stats.byTier.Low + stats.byTier.Medium + stats.byTier.High;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${cls}`}>{tier}</Badge>
                          <span className="text-sm">{count} users</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${cls}`}
                          style={{ width: `${pct}%`, opacity: 1 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-5">
                {[
                  {
                    label: "Credit Scoring Engine",
                    status: "Operational",
                    ok: true,
                  },
                  {
                    label: "Document Storage",
                    status: "Operational",
                    ok: true,
                  },
                  {
                    label: "Fraud Detection",
                    status:
                      stats.fraudCount > 0
                        ? `${stats.fraudCount} flags`
                        : "Clean",
                    ok: stats.fraudCount === 0,
                  },
                  {
                    label: "Profile Completion",
                    status: `${stats.profileCount}/${stats.borrowers} borrowers`,
                    ok: stats.profileCount === stats.borrowers,
                  },
                ].map(({ label, status, ok }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm">{label}</span>
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium ${ok ? "text-score-low" : "text-score-medium"}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {status}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Fraud Alerts */}
          <Card data-ocid="admin.fraud.panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                {t("fraudAlerts")}
                {fraudAlerts.length > 0 && (
                  <Badge className="score-high text-xs">
                    {fraudAlerts.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fraudAlerts.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-score-low mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("noFraudAlerts")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fraudAlerts.map((alert, idx) => (
                    <div
                      key={alert.userId}
                      data-ocid={`admin.fraud.item.${idx + 1}`}
                      className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {alert.businessName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.email}
                        </p>
                        <p className="text-xs text-destructive mt-1">
                          {alert.reason}
                        </p>
                      </div>
                      <Badge className="score-high text-xs shrink-0">
                        Flagged
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
