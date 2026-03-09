import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Target, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import {
  type LoanApprovalResult,
  calculateLoanApprovalProbabilities,
  formatCurrency,
} from "../lib/scoring";
import { getCashflow, getCreditScore, getProfile } from "../lib/store";
import type { BusinessProfile, CashflowData, CreditScore } from "../lib/types";

export function LoanApprovalPredictorPage() {
  const { user } = useAppContext();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [results, setResults] = useState<LoanApprovalResult[]>([]);

  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.id);
    const s = getCreditScore(user.id);
    const c = getCashflow(user.id);
    setProfile(p);
    if (p && s) {
      setResults(calculateLoanApprovalProbabilities(p, s, c));
    }
  }, [user]);

  const highCount = results.filter((r) => r.tier === "High").length;
  const medCount = results.filter((r) => r.tier === "Medium").length;

  const tierBadge = (tier: "High" | "Medium" | "Low") => {
    if (tier === "High")
      return (
        <Badge className="bg-emerald-500 text-white border-0">
          High Chance
        </Badge>
      );
    if (tier === "Medium")
      return (
        <Badge className="bg-yellow-500 text-white border-0">
          Medium Chance
        </Badge>
      );
    return <Badge className="bg-red-500 text-white border-0">Low Chance</Badge>;
  };

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      bank: "bg-blue-100 text-blue-700",
      nbfc: "bg-purple-100 text-purple-700",
      microfinance: "bg-teal-100 text-teal-700",
      government: "bg-orange-100 text-orange-700",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[type] ?? "bg-muted text-muted-foreground"}`}
      >
        {type.toUpperCase()}
      </span>
    );
  };

  const probColor = (prob: number) => {
    if (prob >= 70) return "[&>div]:bg-emerald-500";
    if (prob >= 40) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <div
          data-ocid="loan_predictor.page"
          className="max-w-3xl mx-auto space-y-6 p-4"
        >
          {/* Hero */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                AI Loan Approval Predictor
              </h1>
              <p className="text-sm text-muted-foreground">
                Approval probability for each lender based on your financial
                profile
              </p>
            </div>
          </div>

          {!profile ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Complete your business profile to see loan approval predictions.
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
          ) : (
            <>
              {/* Summary */}
              <Card data-ocid="loan_predictor.summary.card">
                <CardContent className="pt-5">
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-600">
                        {highCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        High Probability
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-600">
                        {medCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Medium Probability
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-500">
                        {results.length - highCount - medCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Low Probability
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm text-muted-foreground">
                        Best match
                      </p>
                      {results[0] && (
                        <p className="font-semibold text-foreground">
                          {results[0].lenderName} ({results[0].probability}%)
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lender cards */}
              <div className="space-y-3">
                {results.map((r, i) => (
                  <Card
                    key={r.lenderId}
                    data-ocid={`loan_predictor.lender.item.${i + 1}`}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {r.lenderName}
                          </span>
                          {typeBadge(r.lenderType)}
                        </div>
                        {tierBadge(r.tier)}
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`text-3xl font-bold ${
                            r.tier === "High"
                              ? "text-emerald-600"
                              : r.tier === "Medium"
                                ? "text-yellow-600"
                                : "text-red-500"
                          }`}
                        >
                          {r.probability}%
                        </span>
                        <div className="flex-1">
                          <Progress
                            value={r.probability}
                            className={`h-2.5 ${probColor(r.probability)}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Reasons
                          </p>
                          <ul className="space-y-1">
                            {r.reasons.map((reason) => (
                              <li
                                key={reason}
                                className="flex items-start gap-1.5"
                              >
                                {r.tier === "High" ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {reason}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">
                            Max Loan Amount
                          </p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatCurrency(r.maxAmount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
