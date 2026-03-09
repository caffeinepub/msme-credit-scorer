import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Lightbulb, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import {
  type BusinessSurvivalResult,
  calculateBusinessSurvivalScore,
} from "../lib/scoring";
import { getCashflow, getCreditScore, getProfile } from "../lib/store";

export function BusinessSurvivalScorePage() {
  const { user } = useAppContext();
  const [result, setResult] = useState<BusinessSurvivalResult | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.id);
    const s = getCreditScore(user.id);
    const c = getCashflow(user.id);
    if (p && s) {
      setHasProfile(true);
      setResult(calculateBusinessSurvivalScore(p, s, c));
    }
  }, [user]);

  const survivalColor = (pct: number) => {
    if (pct >= 70) return "text-emerald-600";
    if (pct >= 45) return "text-yellow-600";
    return "text-red-500";
  };

  const survivalBg = (pct: number) => {
    if (pct >= 70) return "from-emerald-50 to-emerald-50/30";
    if (pct >= 45) return "from-yellow-50 to-yellow-50/30";
    return "from-red-50 to-red-50/30";
  };

  const tierBadge = (tier: "Low" | "Medium" | "High") => {
    if (tier === "Low")
      return (
        <Badge className="bg-emerald-500 text-white border-0">Low Risk</Badge>
      );
    if (tier === "Medium")
      return (
        <Badge className="bg-yellow-500 text-white border-0">Medium Risk</Badge>
      );
    return <Badge className="bg-red-500 text-white border-0">High Risk</Badge>;
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <div
          data-ocid="survival_score.page"
          className="max-w-3xl mx-auto space-y-6 p-4"
        >
          {/* Hero */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Business Survival Score
              </h1>
              <p className="text-sm text-muted-foreground">
                6 and 12-month business viability forecast based on your
                financial signals
              </p>
            </div>
          </div>

          {!hasProfile ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Complete your business profile to generate survival predictions.
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
              {/* Survival stat cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card
                  data-ocid="survival_score.6month.card"
                  className="overflow-hidden"
                >
                  <div
                    className={`bg-gradient-to-br ${survivalBg(result.survival6Month)} p-5`}
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      6-Month Survival
                    </p>
                    <p
                      className={`text-5xl font-bold mt-1 ${survivalColor(result.survival6Month)}`}
                    >
                      {result.survival6Month}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      probability of staying operational
                    </p>
                  </div>
                </Card>

                <Card
                  data-ocid="survival_score.12month.card"
                  className="overflow-hidden"
                >
                  <div
                    className={`bg-gradient-to-br ${survivalBg(result.survival12Month)} p-5`}
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      12-Month Survival
                    </p>
                    <p
                      className={`text-5xl font-bold mt-1 ${survivalColor(result.survival12Month)}`}
                    >
                      {result.survival12Month}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      probability of staying operational
                    </p>
                  </div>
                </Card>
              </div>

              {/* Risk tier */}
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Overall Risk Classification:
                </span>
                {tierBadge(result.riskTier)}
              </div>

              {/* Key risks */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <CardTitle className="text-base">
                      Key Risk Signals
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    data-ocid="survival_score.risks.list"
                    className="space-y-2"
                  >
                    {result.keyRisks.map((risk) => (
                      <div
                        key={risk}
                        className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-orange-800">{risk}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    data-ocid="survival_score.recommendations.list"
                    className="space-y-3"
                  >
                    {result.recommendations.map((rec, i) => (
                      <div key={rec} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-foreground pt-0.5">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
