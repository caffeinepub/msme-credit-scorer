import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  IndianRupee,
  Info,
} from "lucide-react";
import { useState } from "react";
import { PageLayout } from "../components/PageLayout";

const DOCUMENTS = [
  { id: "pan", label: "PAN Card" },
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "salary_slip", label: "Salary Slip" },
  { id: "bank_statement", label: "Bank Statement" },
];

function getInterestRate(
  creditScore: number,
  employmentType: string,
  docs: string[],
): number {
  let base = 12;
  if (creditScore >= 750) base = 9;
  else if (creditScore >= 700) base = 10.5;
  else if (creditScore >= 650) base = 11.5;
  else if (creditScore >= 600) base = 13;
  else base = 15;

  if (employmentType === "self-employed") base += 1;
  if (docs.includes("bank_statement") && docs.includes("salary_slip"))
    base -= 0.5;

  return Math.max(8, Math.min(18, base));
}

function calcMaxLoan(
  maxEMI: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (maxEMI <= 0 || tenureMonths <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return maxEMI * tenureMonths;
  return (maxEMI * (1 - (1 + r) ** -tenureMonths)) / r;
}

function calcEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  return (
    (principal * r * (1 + r) ** tenureMonths) / ((1 + r) ** tenureMonths - 1)
  );
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

interface Result {
  eligible: boolean;
  requestedAmount: number;
  maxEligibleLoan: number;
  suggestedLoan: number;
  estimatedEMI: number;
  interestRate: number;
  maxEMI: number;
}

export function LoanEligibilityPage() {
  const [requestedLoan, setRequestedLoan] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [employmentType, setEmploymentType] = useState("salaried");
  const [existingEMI, setExistingEMI] = useState("");
  const [tenure, setTenure] = useState("36");
  const [docs, setDocs] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleDoc(id: string) {
    setDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!requestedLoan || Number(requestedLoan) <= 0)
      e.requestedLoan = "Enter a valid loan amount";
    if (!monthlyIncome || Number(monthlyIncome) <= 0)
      e.monthlyIncome = "Enter a valid monthly income";
    if (!creditScore || Number(creditScore) < 300 || Number(creditScore) > 900)
      e.creditScore = "CIBIL score must be between 300 and 900";
    if (!existingEMI && existingEMI !== "0")
      e.existingEMI = "Enter existing EMIs (0 if none)";
    return e;
  }

  function handleCheck() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const income = Number(monthlyIncome);
    const emi = Number(existingEMI);
    const score = Number(creditScore);
    const requested = Number(requestedLoan);
    const tenureMonths = Number(tenure);

    const maxEMI = income * 0.45 - emi;
    const rate = getInterestRate(score, employmentType, docs);
    const maxLoan = calcMaxLoan(maxEMI, rate, tenureMonths);
    const suggestedLoan = Math.min(requested, maxLoan);
    const estimatedEMI = calcEMI(suggestedLoan, rate, tenureMonths);

    setResult({
      eligible: requested <= maxLoan,
      requestedAmount: requested,
      maxEligibleLoan: maxLoan,
      suggestedLoan,
      estimatedEMI,
      interestRate: rate,
      maxEMI,
    });
  }

  function handleReset() {
    setResult(null);
    setErrors({});
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Loan Eligibility Check
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your financial details to find out the maximum loan you
            qualify for.
          </p>
        </div>

        {/* Form */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                Financial Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="requested-loan">
                    Required Loan Amount (₹)
                  </Label>
                  <Input
                    id="requested-loan"
                    type="number"
                    placeholder="e.g. 500000"
                    value={requestedLoan}
                    onChange={(e) => setRequestedLoan(e.target.value)}
                    data-ocid="loan_eligibility.requested_loan.input"
                    className={errors.requestedLoan ? "border-destructive" : ""}
                  />
                  {errors.requestedLoan && (
                    <p className="text-xs text-destructive">
                      {errors.requestedLoan}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monthly-income">Monthly Income (₹)</Label>
                  <Input
                    id="monthly-income"
                    type="number"
                    placeholder="e.g. 50000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    data-ocid="loan_eligibility.monthly_income.input"
                    className={errors.monthlyIncome ? "border-destructive" : ""}
                  />
                  {errors.monthlyIncome && (
                    <p className="text-xs text-destructive">
                      {errors.monthlyIncome}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="credit-score">Credit Score (CIBIL)</Label>
                  <Input
                    id="credit-score"
                    type="number"
                    placeholder="300 – 900"
                    value={creditScore}
                    onChange={(e) => setCreditScore(e.target.value)}
                    data-ocid="loan_eligibility.credit_score.input"
                    className={errors.creditScore ? "border-destructive" : ""}
                  />
                  {errors.creditScore && (
                    <p className="text-xs text-destructive">
                      {errors.creditScore}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Employment Type</Label>
                  <Select
                    value={employmentType}
                    onValueChange={setEmploymentType}
                  >
                    <SelectTrigger data-ocid="loan_eligibility.employment_type.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaried">Salaried</SelectItem>
                      <SelectItem value="self-employed">
                        Self-Employed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="existing-emi">
                    Existing Monthly EMIs (₹)
                  </Label>
                  <Input
                    id="existing-emi"
                    type="number"
                    placeholder="0 if none"
                    value={existingEMI}
                    onChange={(e) => setExistingEMI(e.target.value)}
                    data-ocid="loan_eligibility.existing_emi.input"
                    className={errors.existingEMI ? "border-destructive" : ""}
                  />
                  {errors.existingEMI && (
                    <p className="text-xs text-destructive">
                      {errors.existingEMI}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Loan Tenure</Label>
                  <Select value={tenure} onValueChange={setTenure}>
                    <SelectTrigger data-ocid="loan_eligibility.tenure.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[12, 24, 36, 48, 60, 84, 120, 180, 240].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m >= 12
                            ? `${m / 12} Year${m > 12 ? "s" : ""}`
                            : `${m} Months`}{" "}
                          ({m} mo)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  Available Documents
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DOCUMENTS.map((doc) => (
                    <label
                      key={doc.id}
                      htmlFor={`doc-${doc.id}`}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        id={`doc-${doc.id}`}
                        checked={docs.includes(doc.id)}
                        onCheckedChange={() => toggleDoc(doc.id)}
                        data-ocid={`loan_eligibility.doc_${doc.id}.checkbox`}
                      />
                      <span className="text-xs font-medium select-none">
                        {doc.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheck}
                data-ocid="loan_eligibility.check.submit_button"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Check Eligibility
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Status Banner */}
            <div
              className={`rounded-xl border p-4 flex items-start gap-3 ${
                result.eligible
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
              }`}
            >
              {result.eligible ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p
                  className={`font-semibold text-sm ${
                    result.eligible ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {result.eligible
                    ? "Approved Range"
                    : "Amount Exceeds Eligibility"}
                </p>
                <p className="text-sm mt-0.5 text-foreground/80">
                  {result.eligible
                    ? `Great news! Your requested ${formatINR(result.requestedAmount)} is within your eligible range.`
                    : `You requested ${formatINR(result.requestedAmount)}, but based on your financial profile we can offer a maximum loan of ${formatINR(result.maxEligibleLoan)}.`}
                </p>
              </div>
            </div>

            {/* Result Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  Eligibility Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Requested Loan */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Requested Loan Amount
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatINR(result.requestedAmount)}
                    </p>
                  </div>

                  {/* Max Eligible */}
                  <div
                    className={`rounded-lg border p-4 space-y-1 ${
                      result.eligible
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                        : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Maximum Eligible Loan
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        result.eligible ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {formatINR(result.maxEligibleLoan)}
                    </p>
                  </div>

                  {/* Suggested Loan */}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Suggested Loan
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {formatINR(result.suggestedLoan)}
                    </p>
                  </div>

                  {/* Estimated EMI */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Estimated EMI
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatINR(result.estimatedEMI)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        /month
                      </span>
                    </p>
                  </div>
                </div>

                {/* Additional details */}
                <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Interest Rate</span>
                    <p className="font-semibold">
                      {result.interestRate.toFixed(1)}% p.a.
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tenure</span>
                    <p className="font-semibold">{Number(tenure)} months</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Max Allowed EMI
                    </span>
                    <p className="font-semibold">
                      {formatINR(result.maxEMI)}/mo
                    </p>
                  </div>
                </div>

                {/* Approval Status Badge */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Approval Status:
                  </span>
                  <Badge
                    className={`text-xs font-semibold ${
                      result.eligible
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-amber-100 text-amber-700 border-amber-300"
                    }`}
                    variant="outline"
                    data-ocid="loan_eligibility.approval_status.panel"
                  >
                    {result.eligible
                      ? "Approved Range"
                      : "Adjusted — Below Request"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Formula Note */}
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground/70">
                How we calculated this
              </p>
              <p>
                Max EMI = (Monthly Income × 0.45) − Existing EMIs ={" "}
                <span className="font-semibold text-foreground">
                  {formatINR(result.maxEMI)}/mo
                </span>
              </p>
              <p>
                Interest rate of{" "}
                <span className="font-semibold text-foreground">
                  {result.interestRate.toFixed(1)}%
                </span>{" "}
                was applied based on your CIBIL score and employment type.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleReset}
              data-ocid="loan_eligibility.recalculate.button"
            >
              Recalculate
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
