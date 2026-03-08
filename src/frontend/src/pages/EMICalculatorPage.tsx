import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calculator, IndianRupee, Percent, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { formatCurrency } from "../lib/scoring";
import { getProfile } from "../lib/store";
import type { BusinessProfile } from "../lib/types";

function calculateEMI(principal: number, annualRate: number, months: number) {
  if (months === 0 || annualRate === 0) {
    return {
      emi: principal / months || 0,
      totalPayable: principal,
      totalInterest: 0,
    };
  }
  const r = annualRate / 12 / 100;
  const n = months;
  const emi = (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const totalPayable = emi * n;
  const totalInterest = totalPayable - principal;
  return { emi, totalPayable, totalInterest };
}

function buildAmortization(
  principal: number,
  annualRate: number,
  months: number,
  emi: number,
) {
  const r = annualRate / 12 / 100;
  const rows: Array<{
    month: number;
    principal: number;
    interest: number;
    balance: number;
  }> = [];
  let balance = principal;
  for (let m = 1; m <= Math.min(months, 12); m++) {
    const interestPart = balance * r;
    const principalPart = emi - interestPart;
    balance = Math.max(0, balance - principalPart);
    rows.push({
      month: m,
      principal: principalPart,
      interest: interestPart,
      balance,
    });
  }
  return rows;
}

export function EMICalculatorPage() {
  const { user } = useAppContext();
  const t = useT();

  const [loanAmount, setLoanAmount] = useState(1_000_000);
  const [interestRate, setInterestRate] = useState(12);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfile(getProfile(user.id));
  }, [user]);

  const { emi, totalPayable, totalInterest } = useMemo(
    () => calculateEMI(loanAmount, interestRate, tenureMonths),
    [loanAmount, interestRate, tenureMonths],
  );

  const amortization = useMemo(
    () => buildAmortization(loanAmount, interestRate, tenureMonths, emi),
    [loanAmount, interestRate, tenureMonths, emi],
  );

  const principalPercent =
    totalPayable > 0 ? (loanAmount / totalPayable) * 100 : 100;
  const interestPercent = 100 - principalPercent;

  const emiToIncome =
    profile && profile.monthlyRevenue > 0
      ? (emi / profile.monthlyRevenue) * 100
      : null;

  const affordabilityLabel =
    emiToIncome == null
      ? null
      : emiToIncome < 30
        ? { label: "Affordable", cls: "score-low" }
        : emiToIncome <= 50
          ? { label: "Manageable", cls: "score-medium" }
          : { label: "High Risk", cls: "score-high" };

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          {/* Header */}
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              {t("emiCalculator")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Calculate your monthly EMI and repayment schedule instantly
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Controls */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Loan Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-7 pb-6">
                {/* Loan Amount */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t("loanAmount")}</Label>
                    <span className="text-sm font-semibold font-ui text-primary">
                      {formatCurrency(loanAmount)}
                    </span>
                  </div>
                  <Slider
                    data-ocid="emi.loan_amount.input"
                    value={[loanAmount]}
                    onValueChange={([v]) => setLoanAmount(v)}
                    min={50_000}
                    max={5_000_000}
                    step={50_000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹50K</span>
                    <span>₹50L</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t("interestRate")}</Label>
                    <span className="text-sm font-semibold font-ui text-primary flex items-center gap-0.5">
                      {interestRate.toFixed(1)}
                      <Percent className="h-3 w-3" />
                    </span>
                  </div>
                  <Slider
                    data-ocid="emi.interest_rate.input"
                    value={[interestRate]}
                    onValueChange={([v]) => setInterestRate(v)}
                    min={6}
                    max={36}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6%</span>
                    <span>36%</span>
                  </div>
                </div>

                {/* Tenure */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t("tenureMonths")}</Label>
                    <span className="text-sm font-semibold font-ui text-primary">
                      {tenureMonths} months
                    </span>
                  </div>
                  <Slider
                    data-ocid="emi.tenure.input"
                    value={[tenureMonths]}
                    onValueChange={([v]) => setTenureMonths(v)}
                    min={6}
                    max={84}
                    step={6}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6 mo</span>
                    <span>84 mo (7 yr)</span>
                  </div>
                </div>

                {/* Principal vs Interest visual */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold">Payment Breakdown</p>
                  <div className="h-4 rounded-full overflow-hidden flex">
                    <div
                      className="bg-primary h-full transition-all duration-700"
                      style={{ width: `${principalPercent}%` }}
                    />
                    <div
                      className="bg-score-high-bg h-full flex-1 transition-all duration-700"
                      style={{ background: "oklch(0.58 0.22 25 / 0.4)" }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
                      Principal {principalPercent.toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-sm inline-block"
                        style={{ background: "oklch(0.58 0.22 25 / 0.7)" }}
                      />
                      Interest {interestPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Output summary */}
            <div className="lg:col-span-2 space-y-4">
              {/* Monthly EMI — hero card */}
              <Card
                data-ocid="emi.monthly_emi.card"
                className="bg-primary text-primary-foreground"
              >
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs font-medium opacity-80">
                    {t("monthlyEmi")}
                  </p>
                  <p className="font-display font-bold text-4xl mt-1 leading-none">
                    {formatCurrency(Math.round(emi))}
                  </p>
                  <p className="text-xs opacity-70 mt-2">
                    per month for {tenureMonths} months
                  </p>
                </CardContent>
              </Card>

              {/* Total Interest */}
              <Card data-ocid="emi.total_interest.card">
                <CardContent className="pt-4 pb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("totalInterest")}
                    </p>
                    <p className="font-display font-bold text-xl mt-0.5 text-score-high">
                      {formatCurrency(Math.round(totalInterest))}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-score-high opacity-30" />
                </CardContent>
              </Card>

              {/* Total Payable */}
              <Card data-ocid="emi.total_payable.card">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    {t("totalPayable")}
                  </p>
                  <p className="font-display font-bold text-xl mt-0.5">
                    {formatCurrency(Math.round(totalPayable))}
                  </p>
                </CardContent>
              </Card>

              {/* Affordability — only if profile exists */}
              {emiToIncome != null && affordabilityLabel && (
                <Card data-ocid="emi.affordability.card">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm text-muted-foreground font-medium">
                      {t("affordability")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("emiToIncome")}
                      </span>
                      <Badge
                        className={`text-xs font-semibold px-2 py-0.5 border ${affordabilityLabel.cls}`}
                      >
                        {affordabilityLabel.label}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>{emiToIncome.toFixed(1)}%</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          of monthly revenue
                        </span>
                      </div>
                      <Progress
                        value={Math.min(emiToIncome, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Safe &lt;30%</span>
                        <span>Caution 30–50%</span>
                        <span>Risk &gt;50%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Amortization table */}
          <Card data-ocid="emi.amortization.table">
            <CardHeader>
              <CardTitle className="text-base">{t("amortization")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                First {Math.min(tenureMonths, 12)} months shown
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Month</TableHead>
                      <TableHead className="text-xs text-right">
                        Principal (₹)
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        Interest (₹)
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        Balance (₹)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {amortization.map((row, i) => (
                      <TableRow
                        key={row.month}
                        data-ocid={`emi.amortization.row.${i + 1}`}
                      >
                        <TableCell className="text-xs font-medium">
                          {row.month}
                        </TableCell>
                        <TableCell className="text-xs text-right text-score-low font-medium">
                          {formatCurrency(Math.round(row.principal))}
                        </TableCell>
                        <TableCell className="text-xs text-right text-score-high">
                          {formatCurrency(Math.round(row.interest))}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold">
                          {formatCurrency(Math.round(row.balance))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
