import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { generateAIRecommendations } from "../lib/scoring";
import { getCashflow, getCreditScore, getProfile } from "../lib/store";
import type {
  AIRecommendation,
  BusinessProfile,
  CashflowData,
  CreditScore,
} from "../lib/types";

function RecommendationCard({ rec }: { rec: AIRecommendation }) {
  if (rec.type === "warning") {
    return (
      <Card
        data-ocid="aicopilot.warning.card"
        className="border-destructive/30 bg-destructive/5"
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="font-semibold text-sm text-foreground">
                {rec.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rec.message}
              </p>
              {rec.impact && (
                <Badge className="score-high text-xs px-2 py-0.5 border mt-1">
                  {rec.impact}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rec.type === "tip") {
    return (
      <Card
        data-ocid="aicopilot.tip.card"
        className="border-blue-500/30 bg-blue-500/5"
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="font-semibold text-sm text-foreground">
                {rec.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rec.message}
              </p>
              {rec.impact && (
                <Badge className="text-xs px-2 py-0.5 border border-blue-500/30 bg-blue-500/10 text-blue-600 mt-1">
                  {rec.impact}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // positive
  return (
    <Card
      data-ocid="aicopilot.positive.card"
      className="border-score-low/30 bg-score-low-bg"
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-score-low/10 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="h-4 w-4 text-score-low" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-semibold text-sm text-foreground">{rec.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {rec.message}
            </p>
            {rec.impact && (
              <Badge className="score-low text-xs px-2 py-0.5 border mt-1">
                {rec.impact}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AICoPilotPage() {
  const { user } = useAppContext();
  const t = useT();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [cashflow, setCashflow] = useState<CashflowData | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfile(getProfile(user.id));
    setCreditScore(getCreditScore(user.id));
    setCashflow(getCashflow(user.id));
  }, [user]);

  const recommendations: AIRecommendation[] =
    profile && creditScore
      ? generateAIRecommendations(profile, creditScore, cashflow)
      : [];

  const trustTier =
    creditScore?.trustScore != null
      ? creditScore.trustScore >= 70
        ? "Low"
        : creditScore.trustScore >= 40
          ? "Medium"
          : "High"
      : null;

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
          {/* Back */}
          <Link to="/dashboard">
            <button
              data-ocid="aicopilot.back.button"
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
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                {t("aiCopilot")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Personalized insights based on your financial data
              </p>
            </div>
          </div>

          {/* No profile CTA */}
          {!profile && (
            <Card
              data-ocid="aicopilot.empty_state"
              className="border-dashed border-2"
            >
              <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
                <Bot className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    Complete your profile to get AI insights
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The AI Co-Pilot analyzes your financial data to provide
                    personalized recommendations
                  </p>
                </div>
                <Link to="/profile">
                  <button
                    data-ocid="aicopilot.profile.button"
                    className="text-sm text-primary hover:underline"
                    type="button"
                  >
                    Set up your profile →
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Summary card */}
          {creditScore && (
            <Card data-ocid="aicopilot.summary.card" className="bg-muted/40">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Your Current Standing
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-display font-bold">
                      {creditScore.altScore}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Alt Score
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">
                      {creditScore.trustScore}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Trust Score
                    </p>
                  </div>
                  <div>
                    <Badge
                      className={`text-sm px-3 py-1.5 border font-bold ${
                        creditScore.riskTier === "Low"
                          ? "score-low"
                          : creditScore.riskTier === "Medium"
                            ? "score-medium"
                            : "score-high"
                      }`}
                    >
                      {creditScore.riskTier} Risk
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Risk Tier
                    </p>
                  </div>
                </div>
                {trustTier && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Trust Score:{" "}
                    <span
                      className={
                        trustTier === "Low"
                          ? "text-score-low font-semibold"
                          : trustTier === "Medium"
                            ? "text-score-medium font-semibold"
                            : "text-score-high font-semibold"
                      }
                    >
                      {trustTier === "Low"
                        ? "High Trust"
                        : trustTier === "Medium"
                          ? "Moderate Trust"
                          : "Low Trust"}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations feed */}
          {recommendations.length > 0 && (
            <div
              className="space-y-3"
              data-ocid="aicopilot.recommendations.list"
            >
              <p className="text-sm font-semibold">
                {recommendations.length} Insight
                {recommendations.length !== 1 ? "s" : ""} for You
              </p>
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          )}

          {recommendations.length === 0 && profile && (
            <Card>
              <CardContent className="py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-score-low mx-auto mb-3" />
                <p className="font-semibold text-foreground">
                  Great job! No critical issues found.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your financial profile looks healthy. Keep maintaining your
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
