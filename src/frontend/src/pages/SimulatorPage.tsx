import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowDown, ArrowUp, Sliders } from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ScoreGauge } from "../components/ScoreGauge";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import {
  calculateAltScore,
  formatCurrency,
  getRiskTier,
  getStabilityScore,
  getTraditionalScoreLabel,
} from "../lib/scoring";
import { getProfile } from "../lib/store";
import type { Industry } from "../lib/types";

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "textile", label: "Textile" },
  { value: "retail", label: "Retail" },
  { value: "kirana", label: "Kirana" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "food_processing", label: "Food Processing" },
  { value: "handicrafts", label: "Handicrafts" },
];

export function SimulatorPage() {
  const { user } = useAppContext();
  const t = useT();

  const [monthlyRevenue, setMonthlyRevenue] = useState(500000);
  const [businessAge, setBusinessAge] = useState(5);
  const [monthlyExpenses, setMonthlyExpenses] = useState(300000);
  const [industry, setIndustry] = useState<Industry>("textile");
  const [baseScore, setBaseScore] = useState<number | null>(null);
  const [cibilScore, setCibilScore] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const profile = getProfile(user.id);
    if (profile) {
      setMonthlyRevenue(profile.monthlyRevenue);
      setBusinessAge(profile.businessAge);
      setMonthlyExpenses(profile.monthlyExpenses);
      setIndustry(profile.industry);
      setBaseScore(
        calculateAltScore({
          monthlyRevenue: profile.monthlyRevenue,
          businessAge: profile.businessAge,
          monthlyExpenses: profile.monthlyExpenses,
          industry: profile.industry,
        }),
      );
    }
  }, [user]);

  const score = calculateAltScore({
    monthlyRevenue,
    businessAge,
    monthlyExpenses,
    industry,
  });
  const tier = getRiskTier(score);
  const stability = getStabilityScore(monthlyRevenue, monthlyExpenses);
  const diff = baseScore != null ? score - baseScore : null;

  const expenseRatio =
    monthlyRevenue > 0 ? (monthlyExpenses / monthlyRevenue) * 100 : 0;
  const netMargin =
    monthlyRevenue > 0
      ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100
      : 0;

  const parsedCibil = cibilScore ? Number.parseInt(cibilScore, 10) : Number.NaN;
  const validCibil =
    !Number.isNaN(parsedCibil) && parsedCibil >= 300 && parsedCibil <= 900;
  const cibilDiff = validCibil ? score - parsedCibil : null;

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {t("simulatorTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("simulatorDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Controls */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  Adjust Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-7 pb-6">
                {/* Monthly Revenue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t("monthlyRevenue")}</Label>
                    <span className="text-sm font-semibold font-ui text-primary">
                      {formatCurrency(monthlyRevenue)}
                    </span>
                  </div>
                  <Slider
                    data-ocid="simulator.revenue.input"
                    value={[monthlyRevenue]}
                    onValueChange={([v]) => setMonthlyRevenue(v)}
                    min={10000}
                    max={5000000}
                    step={10000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹10K</span>
                    <span>₹50L</span>
                  </div>
                </div>

                {/* Business Age */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t("businessAge")}</Label>
                    <span className="text-sm font-semibold font-ui text-primary">
                      {businessAge} {businessAge === 1 ? "year" : "years"}
                    </span>
                  </div>
                  <Slider
                    data-ocid="simulator.age.input"
                    value={[businessAge]}
                    onValueChange={([v]) => setBusinessAge(v)}
                    min={0}
                    max={30}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>New</span>
                    <span>30 yrs</span>
                  </div>
                </div>

                {/* Monthly Expenses */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t("monthlyExpenses")}</Label>
                    <span className="text-sm font-semibold font-ui text-primary">
                      {formatCurrency(monthlyExpenses)}
                    </span>
                  </div>
                  <Slider
                    data-ocid="simulator.expenses.input"
                    value={[monthlyExpenses]}
                    onValueChange={([v]) => setMonthlyExpenses(v)}
                    min={0}
                    max={Math.max(monthlyRevenue * 1.1, 500000)}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹0</span>
                    <span>
                      {formatCurrency(Math.max(monthlyRevenue * 1.1, 500000))}
                    </span>
                  </div>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label className="text-sm">{t("industry")}</Label>
                  <Select
                    value={industry}
                    onValueChange={(v) => setIndustry(v as Industry)}
                  >
                    <SelectTrigger data-ocid="simulator.industry.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CIBIL Score (optional) */}
                <div className="space-y-2">
                  <Label className="text-sm">
                    {t("cibilScoreRange")}{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    data-ocid="simulator.cibil.input"
                    type="number"
                    min={300}
                    max={900}
                    placeholder="e.g. 720"
                    value={cibilScore}
                    onChange={(e) => setCibilScore(e.target.value)}
                    className="text-sm"
                  />
                  {cibilScore && !validCibil && (
                    <p className="text-xs text-destructive">
                      Enter a value between 300 and 900
                    </p>
                  )}
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    {
                      label: "Expense Ratio",
                      value: `${expenseRatio.toFixed(1)}%`,
                      ok: expenseRatio < 70,
                    },
                    {
                      label: "Net Margin",
                      value: `${netMargin.toFixed(1)}%`,
                      ok: netMargin > 20,
                    },
                  ].map(({ label, value, ok }) => (
                    <div
                      key={label}
                      className={`rounded-lg p-3 ${ok ? "bg-score-low-bg" : "bg-score-high-bg"}`}
                    >
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p
                        className={`text-lg font-display font-bold ${ok ? "text-score-low" : "text-score-high"}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Score display */}
            <div className="lg:col-span-2 space-y-4">
              <Card data-ocid="simulator.score.card">
                <CardContent className="pt-6 pb-5 flex flex-col items-center gap-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Simulated Score
                  </p>
                  <ScoreGauge score={score} tier={tier} size="lg" />

                  {diff != null && (
                    <div
                      className={`flex items-center gap-1.5 text-sm font-semibold ${
                        diff > 0
                          ? "text-score-low"
                          : diff < 0
                            ? "text-score-high"
                            : "text-muted-foreground"
                      }`}
                    >
                      {diff > 0 ? (
                        <>
                          <ArrowUp className="h-4 w-4" /> +{diff} from your
                          current score
                        </>
                      ) : diff < 0 ? (
                        <>
                          <ArrowDown className="h-4 w-4" /> {diff} from your
                          current score
                        </>
                      ) : (
                        "Same as current score"
                      )}
                    </div>
                  )}

                  {/* CIBIL comparison */}
                  {validCibil && cibilDiff != null && (
                    <div className="w-full rounded-lg bg-muted/50 p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-center">
                        {t("scoreComparison")}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-muted-foreground">Alt Score</p>
                          <p className="font-bold font-display text-base">
                            {score}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CIBIL</p>
                          <p className="font-bold font-display text-base">
                            {parsedCibil}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {getTraditionalScoreLabel(parsedCibil)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Difference</p>
                          <p
                            className={`font-bold font-display text-base ${
                              cibilDiff > 0
                                ? "text-score-low"
                                : cibilDiff < 0
                                  ? "text-score-high"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {cibilDiff > 0 ? "+" : ""}
                            {cibilDiff}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Stability
                      </span>
                      <span className="text-xs font-semibold">
                        {stability}/100
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${stability}%`,
                          background:
                            stability >= 70
                              ? "oklch(0.55 0.15 145)"
                              : stability >= 40
                                ? "oklch(0.72 0.18 75)"
                                : "oklch(0.58 0.22 25)",
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-muted/40">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold mb-3">
                    Score Improvement Tips
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {[
                      score < 750 &&
                        monthlyRevenue < 2000000 &&
                        "↑ Increase revenue to above ₹20L to gain +200 pts",
                      score < 750 &&
                        businessAge < 10 &&
                        "⏳ Each additional year adds up to +1.5 pts",
                      expenseRatio > 60 &&
                        "↓ Reduce expense ratio below 60% for +40 pts",
                      tier !== "Low" &&
                        industry === "handicrafts" &&
                        "🏭 Consider expanding to food processing (+20 pts)",
                    ]
                      .filter((tip): tip is string => typeof tip === "string")
                      .map((tip) => (
                        <li key={tip} className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    {score >= 750 && (
                      <li className="text-score-low font-medium">
                        ✓ Excellent score! You qualify for bank financing.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Range reference */}
              <Card className="bg-muted/40">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold mb-3">Score Reference</p>
                  <div className="space-y-2">
                    {[
                      { range: "751–900", label: "Low Risk", cls: "score-low" },
                      {
                        range: "601–750",
                        label: "Medium Risk",
                        cls: "score-medium",
                      },
                      {
                        range: "300–600",
                        label: "High Risk",
                        cls: "score-high",
                      },
                    ].map(({ range, label, cls }) => (
                      <div key={range} className="flex items-center gap-2">
                        <Badge className={`text-xs ${cls}`}>{label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {range}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
