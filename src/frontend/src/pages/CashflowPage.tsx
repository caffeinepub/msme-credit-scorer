import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { formatCurrency, predictEMIRisk } from "../lib/scoring";
import { getCashflow, saveCashflow } from "../lib/store";

interface MonthData {
  revenue: string;
  expense: string;
}

export function CashflowPage() {
  const { user } = useAppContext();
  const t = useT();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    predictedSurplus: number;
    emiRiskPercent: number;
    advice: string;
  } | null>(null);

  const [months, setMonths] = useState<[MonthData, MonthData, MonthData]>([
    { revenue: "", expense: "" },
    { revenue: "", expense: "" },
    { revenue: "", expense: "" },
  ]);

  useEffect(() => {
    if (!user) return;
    const data = getCashflow(user.id);
    if (data) {
      setMonths([
        {
          revenue: String(data.month1Revenue),
          expense: String(data.month1Expense),
        },
        {
          revenue: String(data.month2Revenue),
          expense: String(data.month2Expense),
        },
        {
          revenue: String(data.month3Revenue),
          expense: String(data.month3Expense),
        },
      ]);
      setResult({
        predictedSurplus: data.predictedSurplus,
        emiRiskPercent: data.emiRiskPercent,
        advice: "Loaded from saved data.",
      });
    }
  }, [user]);

  function updateMonth(
    i: 0 | 1 | 2,
    field: "revenue" | "expense",
    val: string,
  ) {
    setMonths((prev) => {
      const next = [...prev] as typeof months;
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const parsed = months.map((m) => ({
      revenue: Number.parseFloat(m.revenue) || 0,
      expense: Number.parseFloat(m.expense) || 0,
    }));

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const cashflowInput = {
      month1Revenue: parsed[0].revenue,
      month1Expense: parsed[0].expense,
      month2Revenue: parsed[1].revenue,
      month2Expense: parsed[1].expense,
      month3Revenue: parsed[2].revenue,
      month3Expense: parsed[2].expense,
    };

    const { predictedSurplus, emiRiskPercent, advice } =
      predictEMIRisk(cashflowInput);

    saveCashflow({
      userId: user.id,
      ...cashflowInput,
      predictedSurplus,
      emiRiskPercent,
      updatedAt: new Date().toISOString(),
    });

    setResult({ predictedSurplus, emiRiskPercent, advice });
    setIsLoading(false);
    toast.success("Cashflow analysis updated!");
  }

  const monthLabels = [t("month1"), t("month2"), t("month3")];

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("cashflow")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter 3 months of data to predict EMI risk and cash surplus
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {months.map((m, i) => (
                    <div key={`month-${i + 1}`}>
                      <p className="text-sm font-semibold mb-3 text-foreground">
                        {monthLabels[i]}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("revenue")} (₹)</Label>
                          <Input
                            type="number"
                            data-ocid={`cashflow.m${i + 1}revenue.input`}
                            value={m.revenue}
                            onChange={(e) =>
                              updateMonth(
                                i as 0 | 1 | 2,
                                "revenue",
                                e.target.value,
                              )
                            }
                            placeholder="500000"
                            min="0"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("expenses")} (₹)</Label>
                          <Input
                            type="number"
                            data-ocid={`cashflow.m${i + 1}expense.input`}
                            value={m.expense}
                            onChange={(e) =>
                              updateMonth(
                                i as 0 | 1 | 2,
                                "expense",
                                e.target.value,
                              )
                            }
                            placeholder="300000"
                            min="0"
                          />
                        </div>
                        {/* Mini surplus preview */}
                        {m.revenue && m.expense && (
                          <div className="col-span-2">
                            {(() => {
                              const surplus =
                                Number.parseFloat(m.revenue) -
                                Number.parseFloat(m.expense);
                              return (
                                <div
                                  className={cn(
                                    "text-xs flex items-center gap-1.5 px-2 py-1 rounded",
                                    surplus >= 0
                                      ? "text-score-low bg-score-low-bg"
                                      : "text-score-high bg-score-high-bg",
                                  )}
                                >
                                  {surplus >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  Surplus: {formatCurrency(Math.abs(surplus))}{" "}
                                  {surplus < 0 ? "(deficit)" : ""}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="submit"
                    data-ocid="cashflow.submit_button"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                        Analysing...
                      </>
                    ) : (
                      t("calculate")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results panel */}
            <div className="lg:col-span-2 space-y-4">
              {result ? (
                <Card
                  data-ocid="cashflow.result.panel"
                  className="animate-fade-up"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-display">
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-5">
                    {/* Predicted Surplus */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t("predictedSurplus")}
                      </p>
                      <p
                        className={cn(
                          "text-2xl font-display font-bold",
                          result.predictedSurplus >= 0
                            ? "text-score-low"
                            : "text-score-high",
                        )}
                      >
                        {result.predictedSurplus >= 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(result.predictedSurplus))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        per month avg
                      </p>
                    </div>

                    {/* EMI Risk */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs text-muted-foreground">
                          {t("emiRisk")}
                        </p>
                        <Badge
                          className={cn(
                            "text-xs",
                            result.emiRiskPercent > 25
                              ? "score-high"
                              : result.emiRiskPercent > 0
                                ? "score-medium"
                                : "score-low",
                          )}
                        >
                          {result.emiRiskPercent}%
                        </Badge>
                      </div>
                      <Progress value={result.emiRiskPercent} className="h-2" />
                    </div>

                    {/* Advice */}
                    <div
                      className={cn(
                        "rounded-lg p-3 text-xs",
                        result.emiRiskPercent > 25
                          ? "bg-destructive/10 border border-destructive/20 text-destructive"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {result.emiRiskPercent > 25 ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-score-low" />
                        )}
                        <p className="font-medium">{t("emiAdvice")}</p>
                      </div>
                      <p className="mt-1 ml-5">{result.advice}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Enter data and click "{t("calculate")}" to see analysis
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Guide */}
              <Card className="bg-muted/40">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold mb-2">How it works</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>• Month 3 is your most recent month</li>
                    <li>
                      • If avg revenue drops below 70% of latest month, EMI risk
                      triggers
                    </li>
                    <li>• Surplus below 10% of revenue = moderate risk</li>
                    <li>• Negative surplus = high risk — avoid new loans</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
