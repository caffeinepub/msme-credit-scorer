import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { formatCurrency, getPeerBenchmark } from "../lib/scoring";
import { getCreditScore, getProfile } from "../lib/store";
import type { BusinessProfile, CreditScore, PeerBenchmark } from "../lib/types";

interface ComparisonCardProps {
  label: string;
  userValue: string;
  peerAvg: string;
  userRaw: number;
  peerRaw: number;
  lowerIsBetter?: boolean;
  ocid: string;
}

function ComparisonCard({
  label,
  userValue,
  peerAvg,
  userRaw,
  peerRaw,
  lowerIsBetter = false,
  ocid,
}: ComparisonCardProps) {
  const diff = peerRaw > 0 ? ((userRaw - peerRaw) / peerRaw) * 100 : 0;
  const isAbove = lowerIsBetter ? userRaw < peerRaw : userRaw > peerRaw;
  const label2 = Math.abs(diff).toFixed(1);
  const direction = diff > 0 ? "above" : "below";

  // Bar width calculation: normalize user and peer on a shared scale
  const maxVal = Math.max(userRaw, peerRaw, 1);
  const userBarWidth = Math.round((userRaw / maxVal) * 100);
  const peerBarWidth = Math.round((peerRaw / maxVal) * 100);

  return (
    <Card data-ocid={ocid} className="flex flex-col">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5 space-y-3 flex-1">
        <div>
          <p className="text-3xl font-display font-bold">{userValue}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your value</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Industry avg:{" "}
          <span className="font-semibold text-foreground">{peerAvg}</span>
        </p>

        {/* Comparison bars */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              You
            </span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${userBarWidth}%`,
                  background: isAbove
                    ? "oklch(0.55 0.15 145)"
                    : "oklch(0.58 0.22 25)",
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              Peers
            </span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-border transition-all duration-700"
                style={{ width: `${peerBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Above/below label */}
        <p
          className={`text-xs font-semibold ${
            isAbove ? "text-score-low" : "text-score-high"
          }`}
        >
          {isAbove ? "▲" : "▼"} {label2}% {direction} average
        </p>
      </CardContent>
    </Card>
  );
}

export function PeerComparisonPage() {
  const { user } = useAppContext();
  const t = useT();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfile(getProfile(user.id));
    setCreditScore(getCreditScore(user.id));
  }, [user]);

  const benchmark: PeerBenchmark | null = profile
    ? getPeerBenchmark(profile.industry)
    : null;

  const expenseRatio =
    profile && profile.monthlyRevenue > 0
      ? (profile.monthlyExpenses / profile.monthlyRevenue) * 100
      : 0;

  // Overall comparison score
  const overallPoints = (() => {
    if (!benchmark || !profile || !creditScore) return null;
    let wins = 0;
    let total = 0;
    if (profile.monthlyRevenue > benchmark.avgRevenue) wins++;
    total++;
    if (expenseRatio < benchmark.avgExpenseRatio) wins++;
    total++;
    if (creditScore.altScore > benchmark.avgAltScore) wins++;
    total++;
    if (creditScore.trustScore > benchmark.avgTrustScore) wins++;
    total++;
    return { wins, total };
  })();

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
          {/* Back */}
          <Link to="/dashboard">
            <button
              data-ocid="peercomparison.back.button"
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
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                {t("peerComparison")}
              </h1>
              {benchmark ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Comparing with{" "}
                  <span className="font-semibold text-foreground">
                    {benchmark.label}
                  </span>{" "}
                  businesses · {benchmark.sampleSize} similar businesses
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Compare your business metrics with industry peers
                </p>
              )}
            </div>
          </div>

          {/* No profile empty state */}
          {!profile && (
            <Card
              data-ocid="peercomparison.empty_state"
              className="border-dashed border-2"
            >
              <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    No profile data
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your business profile to compare with industry
                    peers
                  </p>
                </div>
                <Link to="/profile">
                  <button
                    data-ocid="peercomparison.profile.button"
                    className="text-sm text-primary hover:underline"
                    type="button"
                  >
                    Set up your profile →
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 4 comparison cards */}
          {benchmark && profile && creditScore && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ComparisonCard
                  ocid="peercomparison.revenue.card"
                  label="Monthly Revenue"
                  userValue={formatCurrency(profile.monthlyRevenue)}
                  peerAvg={formatCurrency(benchmark.avgRevenue)}
                  userRaw={profile.monthlyRevenue}
                  peerRaw={benchmark.avgRevenue}
                />
                <ComparisonCard
                  ocid="peercomparison.expense.card"
                  label="Expense Ratio"
                  userValue={`${expenseRatio.toFixed(1)}%`}
                  peerAvg={`${benchmark.avgExpenseRatio}%`}
                  userRaw={expenseRatio}
                  peerRaw={benchmark.avgExpenseRatio}
                  lowerIsBetter
                />
                <ComparisonCard
                  ocid="peercomparison.altscore.card"
                  label="Alt Credit Score"
                  userValue={String(creditScore.altScore)}
                  peerAvg={String(benchmark.avgAltScore)}
                  userRaw={creditScore.altScore}
                  peerRaw={benchmark.avgAltScore}
                />
                <ComparisonCard
                  ocid="peercomparison.trustscore.card"
                  label="Trust Score"
                  userValue={String(creditScore.trustScore)}
                  peerAvg={String(benchmark.avgTrustScore)}
                  userRaw={creditScore.trustScore}
                  peerRaw={benchmark.avgTrustScore}
                />
              </div>

              {/* Overall summary */}
              {overallPoints && (
                <Card
                  data-ocid="peercomparison.summary.card"
                  className="bg-muted/40"
                >
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm font-semibold mb-2">
                      How you compare overall
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You outperform your industry peers in{" "}
                      <span className="font-bold text-foreground">
                        {overallPoints.wins} out of {overallPoints.total}
                      </span>{" "}
                      key metrics.{" "}
                      {overallPoints.wins === overallPoints.total
                        ? "Excellent — you are among the top performers in your industry!"
                        : overallPoints.wins >= overallPoints.total / 2
                          ? `Strong performance. Improving ${overallPoints.total - overallPoints.wins} more metric(s) will put you ahead of most peers.`
                          : "There is room to grow. Focus on reducing your expense ratio and growing revenue to move above average."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
