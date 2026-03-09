import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import { Eye, Info, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import {
  type InvisibleCreditScoreResult,
  calculateInvisibleCreditScore,
} from "../lib/scoring";
import { getCreditScore, getProfile } from "../lib/store";
import type { BusinessProfile, CreditScore } from "../lib/types";

export function InvisibleCreditScorePage() {
  const { user } = useAppContext();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [result, setResult] = useState<InvisibleCreditScoreResult | null>(null);

  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.id);
    const s = getCreditScore(user.id);
    setProfile(p);
    setCreditScore(s);
    if (p) setResult(calculateInvisibleCreditScore(p));
  }, [user]);

  const getScoreTier = (score: number) => {
    if (score >= 750)
      return {
        label: "Excellent",
        color: "bg-emerald-500",
        text: "text-emerald-600",
      };
    if (score >= 650)
      return { label: "Good", color: "bg-blue-500", text: "text-blue-600" };
    if (score >= 550)
      return { label: "Fair", color: "bg-yellow-500", text: "text-yellow-600" };
    return { label: "Poor", color: "bg-red-500", text: "text-red-600" };
  };

  const getStatusColor = (status: "good" | "ok" | "poor") => {
    if (status === "good") return "text-emerald-600";
    if (status === "ok") return "text-yellow-600";
    return "text-red-500";
  };

  const getProgressColor = (status: "good" | "ok" | "poor") => {
    if (status === "good") return "[&>div]:bg-emerald-500";
    if (status === "ok") return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <div
          data-ocid="invisible_score.page"
          className="max-w-3xl mx-auto space-y-6 p-4"
        >
          {/* Hero */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Invisible Credit Score
              </h1>
              <p className="text-sm text-muted-foreground">
                Alternative scoring for businesses without CIBIL history
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              This score uses 5 alternative signals — GST compliance, digital
              transactions, expense discipline, industry stability, and business
              continuity — to evaluate creditworthiness without requiring a
              traditional CIBIL score.
            </p>
          </div>

          {!profile ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Complete your business profile to generate your Invisible Credit
                Score.
              </p>
              <Link to="/profile">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Complete Profile
                </button>
              </Link>
            </Card>
          ) : result ? (
            <>
              {/* Score card */}
              <Card
                data-ocid="invisible_score.score.card"
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Your Invisible Credit Score
                      </p>
                      <div className="flex items-end gap-3 mt-1">
                        <span
                          className={`text-6xl font-bold ${getScoreTier(result.score).text}`}
                        >
                          {result.score}
                        </span>
                        <span className="text-muted-foreground text-sm mb-2">
                          / 900
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`${getScoreTier(result.score).color} text-white border-0 text-sm px-3 py-1`}
                    >
                      {getScoreTier(result.score).label}
                    </Badge>
                  </div>
                  {/* Score bar */}
                  <div className="mt-4">
                    <Progress
                      value={((result.score - 300) / 600) * 100}
                      className="h-3 [&>div]:bg-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>300</span>
                      <span>600</span>
                      <span>900</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Factor breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Score Factor Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    data-ocid="invisible_score.factors.list"
                    className="space-y-5"
                  >
                    {result.factors.map((factor, i) => (
                      <div
                        key={factor.label}
                        data-ocid={`invisible_score.factor.item.${i + 1}`}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {factor.label}
                          </span>
                          <span
                            className={`text-sm font-semibold ${getStatusColor(factor.status)}`}
                          >
                            {Math.round(factor.score)} / {factor.maxScore}
                          </span>
                        </div>
                        <Progress
                          value={(factor.score / factor.maxScore) * 100}
                          className={`h-2 ${getProgressColor(factor.status)}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {factor.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* What this means */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base">
                      What This Means for Lenders
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      result.score >= 750
                        ? {
                            label: "Government Schemes",
                            desc: "Eligible for Mudra Yojana, CGTMSE, and state-level schemes with favorable terms",
                          }
                        : {
                            label: "Government Schemes",
                            desc: "Eligible for Mudra Pradhan Mantri loans up to ₹10L",
                          },
                      result.score >= 650
                        ? {
                            label: "NBFC & Microfinance",
                            desc: "Strong eligibility for Lendingkart, Bajaj Finserv digital business loans",
                          }
                        : {
                            label: "NBFC & Microfinance",
                            desc: "Ujjivan and microfinance lenders can consider your application",
                          },
                      result.score >= 750
                        ? {
                            label: "Banks",
                            desc: "May qualify for SBI or HDFC small business loans with reduced documentation",
                          }
                        : {
                            label: "Banks",
                            desc: "Build score above 750 to improve bank loan eligibility",
                          },
                    ].map(({ label, desc }) => (
                      <div
                        key={label}
                        className="flex gap-3 p-3 bg-muted/40 rounded-lg"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {creditScore && (
                <div className="text-xs text-muted-foreground text-center">
                  Traditional Alt Score: {creditScore.altScore} · Business
                  Trust: {creditScore.trustScore}/100
                </div>
              )}
            </>
          ) : null}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
