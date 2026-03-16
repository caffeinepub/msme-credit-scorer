import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CheckCircle2,
  Info,
  Landmark,
  RefreshCw,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { PageLayout } from "../components/PageLayout";

// ─── Bank Dataset ────────────────────────────────────────────────────────────
interface BankRule {
  id: string;
  name: string;
  shortName: string;
  minCreditScore: number;
  minIncome: number; // monthly ₹
  maxDTI: number; // %
  interestRate: number; // % p.a.
  maxLoanAmount: number; // ₹
  color: string;
  bgColor: string;
  borderColor: string;
}

const BANKS: BankRule[] = [
  {
    id: "hdfc",
    name: "HDFC Bank",
    shortName: "HDFC",
    minCreditScore: 700,
    minIncome: 25000,
    maxDTI: 45,
    interestRate: 11.5,
    maxLoanAmount: 2000000,
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "icici",
    name: "ICICI Bank",
    shortName: "ICICI",
    minCreditScore: 680,
    minIncome: 20000,
    maxDTI: 50,
    interestRate: 12,
    maxLoanAmount: 1500000,
    color: "text-orange-700",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    id: "axis",
    name: "Axis Bank",
    shortName: "AXIS",
    minCreditScore: 650,
    minIncome: 18000,
    maxDTI: 50,
    interestRate: 13,
    maxLoanAmount: 1000000,
    color: "text-rose-700",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
  {
    id: "bajaj",
    name: "Bajaj Finserv",
    shortName: "BAJAJ",
    minCreditScore: 600,
    minIncome: 15000,
    maxDTI: 55,
    interestRate: 15,
    maxLoanAmount: 800000,
    color: "text-purple-700",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
const DOCUMENTS = [
  { id: "pan", label: "PAN Card" },
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "salary_slip", label: "Salary Slip" },
  { id: "bank_statement", label: "Bank Statement" },
  { id: "gst", label: "GST Certificate" },
  { id: "itr", label: "ITR" },
];

type ApprovalStatus = "eligible" | "possible" | "low";

interface BankResult extends BankRule {
  approvalChance: number;
  status: ApprovalStatus;
  offeredLoan: number;
}

// ─── Matching Logic ────────────────────────────────────────────────────────────
function matchBank(
  bank: BankRule,
  creditScore: number,
  monthlyIncome: number,
  requestedLoan: number,
  existingEMI: number,
  docs: string[],
): BankResult {
  const totalIncome = monthlyIncome;
  const dti = (existingEMI / totalIncome) * 100;

  // Score each criterion out of 100
  const scorePoints: number[] = [];

  // 1. Credit score
  const scoreRatio = creditScore / bank.minCreditScore;
  scorePoints.push(Math.min(100, scoreRatio * 100));

  // 2. Income
  const incomeRatio = monthlyIncome / bank.minIncome;
  scorePoints.push(Math.min(100, incomeRatio * 100));

  // 3. DTI
  const dtiScore =
    dti <= bank.maxDTI ? 100 : Math.max(0, 100 - (dti - bank.maxDTI) * 5);
  scorePoints.push(dtiScore);

  // 4. Loan amount vs bank max
  const loanRatio = requestedLoan / bank.maxLoanAmount;
  const loanScore =
    loanRatio <= 1 ? 100 : Math.max(0, 100 - (loanRatio - 1) * 80);
  scorePoints.push(loanScore);

  // 5. Document bonus
  const docBonus = docs.length >= 3 ? 10 : docs.length >= 2 ? 5 : 0;

  const avgScore = scorePoints.reduce((a, b) => a + b, 0) / scorePoints.length;
  const approvalChance = Math.min(
    95,
    Math.max(5, Math.round(avgScore * 0.85 + docBonus)),
  );

  // Status classification
  const meetsScore = creditScore >= bank.minCreditScore;
  const meetsIncome = monthlyIncome >= bank.minIncome;
  const meetsDTI = dti <= bank.maxDTI;

  let status: ApprovalStatus;
  if (meetsScore && meetsIncome && meetsDTI) {
    status = "eligible";
  } else if (
    (meetsScore || creditScore >= bank.minCreditScore * 0.9) &&
    (meetsIncome || monthlyIncome >= bank.minIncome * 0.9)
  ) {
    status = "possible";
  } else {
    status = "low";
  }

  // Offered loan: min of requested and bank max, adjusted by score
  const scoreFactor = approvalChance / 100;
  const offeredLoan = Math.min(
    requestedLoan * scoreFactor * 1.2,
    bank.maxLoanAmount,
    requestedLoan + bank.maxLoanAmount * 0.1,
  );

  return {
    ...bank,
    approvalChance,
    status,
    offeredLoan: Math.round(offeredLoan),
  };
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  eligible: {
    label: "Eligible",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  },
  possible: {
    label: "Possible Approval",
    badge: "bg-amber-100 text-amber-700 border-amber-300",
    icon: <TrendingUp className="h-4 w-4 text-amber-600" />,
  },
  low: {
    label: "Low Approval Chance",
    badge: "bg-red-100 text-red-700 border-red-300",
    icon: <XCircle className="h-4 w-4 text-red-500" />,
  },
};

// ─── Bank Logo Placeholder ─────────────────────────────────────────────────────
function BankAvatar({
  shortName,
  color,
  bgColor,
}: { shortName: string; color: string; bgColor: string }) {
  return (
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
        bgColor
      } ${color}`}
    >
      {shortName}
    </div>
  );
}

// ─── Bank Card ────────────────────────────────────────────────────────────────
function BankCard({
  result,
  isBest,
  requestedLoan,
}: {
  result: BankResult;
  isBest: boolean;
  requestedLoan: number;
}) {
  const statusCfg = STATUS_CONFIG[result.status];
  const canOffer = result.offeredLoan >= requestedLoan * 0.8;

  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all ${
        isBest
          ? "border-primary shadow-md bg-primary/5"
          : `${result.borderColor} bg-card hover:shadow-sm`
      }`}
      data-ocid={`bank_recommendation.bank_${result.id}.card`}
    >
      {isBest && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-primary text-primary-foreground text-xs gap-1 shadow-sm">
            <Star className="h-3 w-3 fill-current" /> Best Offer
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <BankAvatar
            shortName={result.shortName}
            color={result.color}
            bgColor={result.bgColor}
          />
          <div>
            <h3 className="font-bold text-base text-foreground">
              {result.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {statusCfg.icon}
              <Badge
                variant="outline"
                className={`text-xs font-medium ${statusCfg.badge}`}
                data-ocid={`bank_recommendation.bank_${result.id}.status`}
              >
                {statusCfg.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-foreground">
            {result.approvalChance}%
          </p>
          <p className="text-xs text-muted-foreground">Approval Chance</p>
        </div>
      </div>

      {/* Approval Progress */}
      <div className="mb-4">
        <Progress
          value={result.approvalChance}
          className="h-2"
          data-ocid={`bank_recommendation.bank_${result.id}.chart_point`}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">
            Max Loan Offered
          </p>
          <p
            className={`font-bold text-sm ${
              canOffer ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {formatINR(result.offeredLoan)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Interest Rate</p>
          <p className="font-bold text-sm text-foreground">
            {result.interestRate}% p.a.
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">
            Min Credit Score
          </p>
          <p className="font-bold text-sm text-foreground">
            {result.minCreditScore}
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">
            Max DTI Allowed
          </p>
          <p className="font-bold text-sm text-foreground">{result.maxDTI}%</p>
        </div>
      </div>

      <Button
        className="w-full"
        variant={isBest ? "default" : "outline"}
        size="sm"
        data-ocid={`bank_recommendation.bank_${result.id}.primary_button`}
      >
        Apply Now
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function BankLoanRecommendationPage() {
  const [loanAmount, setLoanAmount] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [employmentType, setEmploymentType] = useState("salaried");
  const [existingEMI, setExistingEMI] = useState("");
  const [businessAge, setBusinessAge] = useState("");
  const [tenure, setTenure] = useState("36");
  const [docs, setDocs] = useState<string[]>([]);
  const [results, setResults] = useState<BankResult[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleDoc(id: string) {
    setDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!loanAmount || Number(loanAmount) <= 0)
      e.loanAmount = "Enter a valid loan amount";
    if (!monthlyIncome || Number(monthlyIncome) <= 0)
      e.monthlyIncome = "Enter a valid monthly income";
    if (!creditScore || Number(creditScore) < 300 || Number(creditScore) > 900)
      e.creditScore = "Credit score must be 300–900";
    if (existingEMI === "") e.existingEMI = "Enter existing EMIs (0 if none)";
    return e;
  }

  function handleAnalyze() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const loan = Number(loanAmount);
    const income = Number(monthlyIncome);
    const score = Number(creditScore);
    const emi = Number(existingEMI);

    const bankResults = BANKS.map((bank) =>
      matchBank(bank, score, income, loan, emi, docs),
    ).sort((a, b) => b.approvalChance - a.approvalChance);

    setResults(bankResults);
  }

  function handleReset() {
    setResults(null);
    setErrors({});
  }

  const eligibleResults = results?.filter((r) => r.status !== "low") ?? [];
  const lowResults = results?.filter((r) => r.status === "low") ?? [];
  const bestBank = eligibleResults[0] ?? null;

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Bank Loan Recommendation Engine
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your financial profile to discover which banks are most likely
            to approve your loan.
          </p>
        </div>

        {/* Form */}
        {!results && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Your Financial Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="blr-loan">Required Loan Amount (₹)</Label>
                  <Input
                    id="blr-loan"
                    type="number"
                    placeholder="e.g. 500000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    data-ocid="bank_recommendation.loan_amount.input"
                    className={errors.loanAmount ? "border-destructive" : ""}
                  />
                  {errors.loanAmount && (
                    <p className="text-xs text-destructive">
                      {errors.loanAmount}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="blr-income">Monthly Income (₹)</Label>
                  <Input
                    id="blr-income"
                    type="number"
                    placeholder="e.g. 50000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    data-ocid="bank_recommendation.monthly_income.input"
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
                  <Label htmlFor="blr-score">
                    Credit Score (CIBIL / Estimated)
                  </Label>
                  <Input
                    id="blr-score"
                    type="number"
                    placeholder="300 – 900"
                    value={creditScore}
                    onChange={(e) => setCreditScore(e.target.value)}
                    data-ocid="bank_recommendation.credit_score.input"
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
                    <SelectTrigger data-ocid="bank_recommendation.employment_type.select">
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
                  <Label htmlFor="blr-emi">Existing Monthly EMIs (₹)</Label>
                  <Input
                    id="blr-emi"
                    type="number"
                    placeholder="0 if none"
                    value={existingEMI}
                    onChange={(e) => setExistingEMI(e.target.value)}
                    data-ocid="bank_recommendation.existing_emi.input"
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
                    <SelectTrigger data-ocid="bank_recommendation.tenure.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[12, 24, 36, 48, 60, 84, 120].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m / 12 >= 1
                            ? `${m / 12} Year${m > 12 ? "s" : ""}`
                            : `${m} Months`}{" "}
                          ({m} mo)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Business Age (self-employed) */}
              {employmentType === "self-employed" && (
                <div className="space-y-1.5">
                  <Label htmlFor="blr-biz-age">Business Age (Years)</Label>
                  <Input
                    id="blr-biz-age"
                    type="number"
                    placeholder="e.g. 3"
                    value={businessAge}
                    onChange={(e) => setBusinessAge(e.target.value)}
                    data-ocid="bank_recommendation.business_age.input"
                  />
                </div>
              )}

              {/* Documents */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  Available Documents
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DOCUMENTS.map((doc) => (
                    <label
                      key={doc.id}
                      htmlFor={`blr-doc-${doc.id}`}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        id={`blr-doc-${doc.id}`}
                        checked={docs.includes(doc.id)}
                        onCheckedChange={() => toggleDoc(doc.id)}
                        data-ocid={`bank_recommendation.doc_${doc.id}.checkbox`}
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
                onClick={handleAnalyze}
                data-ocid="bank_recommendation.analyze.submit_button"
              >
                <Landmark className="h-4 w-4 mr-2" />
                Find Best Banks for Me
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary banner */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Requested Loan</p>
                <p className="text-xl font-black text-primary">
                  {formatINR(Number(loanAmount))}
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Eligible Banks</p>
                <p className="text-xl font-black text-emerald-600">
                  {
                    eligibleResults.filter((r) => r.status === "eligible")
                      .length
                  }
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Possible Approval
                </p>
                <p className="text-xl font-black text-amber-600">
                  {
                    eligibleResults.filter((r) => r.status === "possible")
                      .length
                  }
                </p>
              </div>
              {bestBank && (
                <>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Best Rate</p>
                    <p className="text-xl font-black text-foreground">
                      {bestBank.interestRate}% p.a.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Eligible / Possible Banks */}
            {eligibleResults.length > 0 && (
              <div
                className="space-y-3"
                data-ocid="bank_recommendation.eligible.section"
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Banks Likely to Approve Your Loan
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eligibleResults.map((result, i) => (
                    <BankCard
                      key={result.id}
                      result={result}
                      isBest={i === 0}
                      requestedLoan={Number(loanAmount)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Low chance banks */}
            {lowResults.length > 0 && (
              <div
                className="space-y-3"
                data-ocid="bank_recommendation.low_chance.section"
              >
                <h2 className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Low Approval Chance
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lowResults.map((result) => (
                    <BankCard
                      key={result.id}
                      result={result}
                      isBest={false}
                      requestedLoan={Number(loanAmount)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {eligibleResults.length === 0 && lowResults.length === 0 && (
              <div
                className="rounded-xl border border-border bg-muted/20 p-8 text-center"
                data-ocid="bank_recommendation.results.empty_state"
              >
                <XCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">
                  No matching banks found
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try improving your credit score or reducing existing EMIs.
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground/70 mb-1">Disclaimer</p>
              <p>
                Approval chances are estimated based on publicly available bank
                criteria and your financial profile. Actual bank decisions may
                vary. Always consult the lender directly before applying.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleReset}
              data-ocid="bank_recommendation.recalculate.button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
