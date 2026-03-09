import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { getCreditImprovementSteps, getScoreBreakdown } from "../lib/scoring";
import { getCreditScore, getProfile } from "../lib/store";
import type {
  BusinessProfile,
  CreditScore,
  ImprovementStep,
  ScoreFactor,
} from "../lib/types";

function StatusBadge({ status }: { status: ScoreFactor["status"] }) {
  if (status === "good") {
    return <Badge className="score-low text-xs px-2 py-0.5 border">Good</Badge>;
  }
  if (status === "ok") {
    return (
      <Badge className="score-medium text-xs px-2 py-0.5 border">Fair</Badge>
    );
  }
  return <Badge className="score-high text-xs px-2 py-0.5 border">Poor</Badge>;
}

function PriorityBadge({
  priority,
}: { priority: ImprovementStep["priority"] }) {
  if (priority === "high") {
    return (
      <Badge className="score-high text-xs px-2 py-0.5 border">
        High Priority
      </Badge>
    );
  }
  if (priority === "medium") {
    return (
      <Badge className="score-medium text-xs px-2 py-0.5 border">
        Medium Priority
      </Badge>
    );
  }
  return (
    <Badge className="score-low text-xs px-2 py-0.5 border">Low Priority</Badge>
  );
}

export function ScoreBreakdownPage() {
  const { user } = useAppContext();
  const t = useT();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);

  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.id);
    const s = getCreditScore(user.id);
    setProfile(p);
    setCreditScore(s);
  }, [user]);

  const factors: ScoreFactor[] =
    profile && creditScore ? getScoreBreakdown(profile, creditScore) : [];
  const steps: ImprovementStep[] =
    profile && creditScore
      ? getCreditImprovementSteps(profile, creditScore)
      : [];

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <button
                data-ocid="scorebreakdown.back.button"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                {t("scoreBreakdown")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Understand the factors driving your credit score
              </p>
            </div>
          </div>

          {/* No profile empty state */}
          {!profile && (
            <Card
              data-ocid="scorebreakdown.empty_state"
              className="border-dashed border-2"
            >
              <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
                <BarChart2 className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    No profile data
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your business profile to see your score breakdown
                  </p>
                </div>
                <Link to="/profile">
                  <button
                    data-ocid="scorebreakdown.profile.button"
                    className="text-sm text-primary hover:underline"
                    type="button"
                  >
                    Set up your profile →
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Section 1: Score Factors */}
          {factors.length > 0 && (
            <Card data-ocid="scorebreakdown.factors.panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Score Factors
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These components make up your alt credit score
                </p>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {factors.map((factor, i) => {
                  const pct = Math.round(
                    (factor.score / factor.maxScore) * 100,
                  );
                  return (
                    <div
                      key={factor.factor}
                      data-ocid={`scorebreakdown.factor.item.${i + 1}`}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {factor.label}
                          </span>
                          <StatusBadge status={factor.status} />
                        </div>
                        <span className="text-sm font-semibold font-display text-muted-foreground shrink-0">
                          {factor.score} / {factor.maxScore} pts
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background:
                              factor.status === "good"
                                ? "oklch(0.55 0.15 145)"
                                : factor.status === "ok"
                                  ? "oklch(0.72 0.18 75)"
                                  : "oklch(0.58 0.22 25)",
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {factor.description}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Section 2: Improvement Plan */}
          {steps.length > 0 && (
            <Card data-ocid="scorebreakdown.improvement.panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  {t("improvementPlan")}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Actionable steps to improve your credit score
                </p>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {steps.map((step, i) => (
                  <div
                    key={step.step}
                    data-ocid={`scorebreakdown.step.item.${i + 1}`}
                    className="flex gap-4"
                  >
                    {/* Step number circle */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{step.action}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {step.timeframe}
                          </div>
                          <PriorityBadge priority={step.priority} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.detail}
                      </p>
                      {step.estimatedGain > 0 && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-score-low" />
                          <span className="text-xs text-score-low font-semibold">
                            +{step.estimatedGain} pts estimated gain
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
