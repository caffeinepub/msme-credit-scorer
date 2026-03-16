import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { PageLayout } from "../components/PageLayout";

const PRINT_STYLE =
  "@media print { .no-print { display: none !important; } #preapproval-results { padding: 20px; } }";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LoanFormData {
  fullName: string;
  dob: string;
  pan: string;
  aadhaar: string;
  mobile: string;
  email: string;
  address: string;
  employmentType: string;
  employerName: string;
  monthlyIncome: number;
  businessAge: number;
  annualTurnover: number;
  monthlyExpenses: number;
  existingLoansCount: number;
  existingLoansOutstanding: number;
  creditCardDues: number;
  monthlyEMI: number;
  otherLiabilities: number;
  requestedLoan: number;
  tenure: number;
  loanPurpose: string;
  creditScore: number;
  docPAN: boolean;
  docAadhaar: boolean;
  docSalarySlip: boolean;
  docBankStatement: boolean;
  docITR: boolean;
  docAddressProof: boolean;
}

interface BankResult {
  name: string;
  minScore: number;
  minIncome: number;
  rate: number;
  maxLoan: number;
  approvalProb: number;
  offeredLoan: number;
  status: "Eligible" | "Possible" | "Low Chance";
}

interface AnalysisResult {
  riskScore: number;
  maxEligibleLoan: number;
  safeEMI: number;
  grade: string;
  dti: number;
  netCashFlow: number;
  banks: BankResult[];
  suggestions: string[];
  docs: { label: string; uploaded: boolean }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BANK_DATA = [
  { name: "SBI", minScore: 650, minIncome: 15000, rate: 10, maxLoan: 2500000 },
  {
    name: "HDFC Bank",
    minScore: 700,
    minIncome: 25000,
    rate: 10.5,
    maxLoan: 2000000,
  },
  {
    name: "ICICI Bank",
    minScore: 680,
    minIncome: 20000,
    rate: 12,
    maxLoan: 1500000,
  },
  {
    name: "Axis Bank",
    minScore: 650,
    minIncome: 18000,
    rate: 13,
    maxLoan: 1000000,
  },
  {
    name: "Bajaj Finserv",
    minScore: 600,
    minIncome: 15000,
    rate: 15,
    maxLoan: 800000,
  },
];

const STEPS = [
  "Personal Info",
  "Employment & Income",
  "Obligations",
  "Loan Details",
  "Documents",
];

const INITIAL_FORM: LoanFormData = {
  fullName: "",
  dob: "",
  pan: "",
  aadhaar: "",
  mobile: "",
  email: "",
  address: "",
  employmentType: "salaried",
  employerName: "",
  monthlyIncome: 0,
  businessAge: 0,
  annualTurnover: 0,
  monthlyExpenses: 0,
  existingLoansCount: 0,
  existingLoansOutstanding: 0,
  creditCardDues: 0,
  monthlyEMI: 0,
  otherLiabilities: 0,
  requestedLoan: 500000,
  tenure: 36,
  loanPurpose: "",
  creditScore: 650,
  docPAN: false,
  docAadhaar: false,
  docSalarySlip: false,
  docBankStatement: false,
  docITR: false,
  docAddressProof: false,
};

// ─── Scoring ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function analyze(f: LoanFormData): AnalysisResult {
  const dti = (f.monthlyEMI + f.creditCardDues / 12) / (f.monthlyIncome || 1);
  const uploaded = [
    f.docPAN,
    f.docAadhaar,
    f.docSalarySlip,
    f.docBankStatement,
    f.docITR,
    f.docAddressProof,
  ].filter(Boolean).length;
  const docScore = (uploaded / 6) * 20;
  const creditComp = clamp(((f.creditScore - 300) / 600) * 30, 0, 30);
  const incomeComp = clamp((f.monthlyIncome / 100000) * 20, 0, 20);
  const dtiPenalty = dti > 0.5 ? -15 : dti > 0.35 ? -8 : 0;
  const riskScore = Math.round(
    clamp(30 + creditComp + incomeComp + docScore + dtiPenalty, 0, 100),
  );

  const maxEMI = f.monthlyIncome * 0.45 - f.monthlyEMI;
  const maxEligibleLoan = Math.round(
    Math.max(0, (maxEMI * f.tenure) / (1 + 0.01 * 12)),
  );
  const safeEMI = Math.round(maxEMI * 0.85);
  const grade =
    riskScore >= 80 ? "A" : riskScore >= 65 ? "B" : riskScore >= 50 ? "C" : "D";

  const banks: BankResult[] = BANK_DATA.map((b) => {
    const meetsScore = f.creditScore >= b.minScore;
    const meetsIncome = f.monthlyIncome >= b.minIncome;
    const base = meetsScore && meetsIncome ? 70 : 40;
    const bonus = (riskScore - 50) * 0.5;
    const dtiBonus = dti < 0.3 ? 10 : dti < 0.4 ? 5 : -10;
    const approvalProb = Math.round(clamp(base + bonus + dtiBonus, 20, 95));
    const offeredLoan = Math.min(maxEligibleLoan, b.maxLoan);
    const status: BankResult["status"] =
      meetsScore && meetsIncome
        ? "Eligible"
        : approvalProb >= 55
          ? "Possible"
          : "Low Chance";
    return { ...b, approvalProb, offeredLoan, status };
  }).sort((a, b) => b.approvalProb - a.approvalProb);

  const suggestions: string[] = [];
  if (dti > 0.45)
    suggestions.push(
      "Reduce existing EMI burden before applying — your DTI exceeds safe threshold of 45%.",
    );
  if (!f.docSalarySlip)
    suggestions.push("Upload salary slip to increase approval chance by ~15%.");
  if (f.requestedLoan > maxEligibleLoan && maxEligibleLoan > 0)
    suggestions.push(
      `Consider applying for ₹${maxEligibleLoan.toLocaleString("en-IN")} instead of ₹${f.requestedLoan.toLocaleString("en-IN")} based on your income profile.`,
    );
  if (f.creditScore < 700)
    suggestions.push(
      "Improving credit score by 50 points could unlock HDFC Bank's premium rates.",
    );
  if (f.creditCardDues > 50000)
    suggestions.push(
      "Paying down credit card dues will improve your DTI ratio and approval odds.",
    );
  if (!f.docBankStatement)
    suggestions.push(
      "Bank statements are critical — upload last 6–12 months for better assessment.",
    );
  if (suggestions.length === 0)
    suggestions.push(
      "Your profile looks strong. Proceed with the application for best results.",
    );

  const docs = [
    { label: "PAN Card", uploaded: f.docPAN },
    { label: "Aadhaar Card", uploaded: f.docAadhaar },
    { label: "Salary Slip", uploaded: f.docSalarySlip },
    { label: "Bank Statement", uploaded: f.docBankStatement },
    { label: "ITR / GST Returns", uploaded: f.docITR },
    { label: "Proof of Address", uploaded: f.docAddressProof },
  ];

  return {
    riskScore,
    maxEligibleLoan,
    safeEMI,
    grade,
    dti,
    netCashFlow: f.monthlyIncome - f.monthlyExpenses - f.monthlyEMI,
    banks,
    suggestions,
    docs,
  };
}

// ─── Shared field wrapper ─────────────────────────────────────────────────────
function Field({
  label,
  children,
  required,
}: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── Risk Gauge ───────────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-500"
      : score >= 50
        ? "text-amber-500"
        : "text-red-500";
  const ringColor =
    score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const statusLabel =
    score >= 70 ? "Low Risk" : score >= 50 ? "Moderate Risk" : "High Risk";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 120 120"
          role="img"
          aria-label={`Risk score ${score} out of 100`}
        >
          <title>Risk Score Gauge</title>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/30"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`${color} border-current font-semibold`}
      >
        {statusLabel}
      </Badge>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({
  f,
  set,
}: {
  f: LoanFormData;
  set: (k: keyof LoanFormData, v: string | number | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full Name" required>
        <Input
          data-ocid="preapproval.name.input"
          value={f.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Rajesh Kumar"
        />
      </Field>
      <Field label="Date of Birth" required>
        <Input
          data-ocid="preapproval.dob.input"
          type="date"
          value={f.dob}
          onChange={(e) => set("dob", e.target.value)}
        />
      </Field>
      <Field label="PAN Number" required>
        <Input
          data-ocid="preapproval.pan.input"
          value={f.pan}
          onChange={(e) => set("pan", e.target.value.toUpperCase())}
          placeholder="ABCDE1234F"
          maxLength={10}
        />
      </Field>
      <Field label="Aadhaar Number" required>
        <Input
          data-ocid="preapproval.aadhaar.input"
          value={f.aadhaar}
          onChange={(e) => set("aadhaar", e.target.value)}
          placeholder="XXXX XXXX XXXX"
          maxLength={14}
        />
      </Field>
      <Field label="Mobile Number" required>
        <Input
          data-ocid="preapproval.mobile.input"
          type="tel"
          value={f.mobile}
          onChange={(e) => set("mobile", e.target.value)}
          placeholder="+91 98765 43210"
        />
      </Field>
      <Field label="Email Address">
        <Input
          data-ocid="preapproval.email.input"
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="rajesh@example.com"
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Residential Address" required>
          <Input
            data-ocid="preapproval.address.input"
            value={f.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="123, MG Road, Ahmedabad, Gujarat 380001"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({
  f,
  set,
}: {
  f: LoanFormData;
  set: (k: keyof LoanFormData, v: string | number | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Employment Type" required>
        <Select
          value={f.employmentType}
          onValueChange={(v) => set("employmentType", v)}
        >
          <SelectTrigger data-ocid="preapproval.employment_type.select">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="salaried">Salaried</SelectItem>
            <SelectItem value="self-employed">Self-Employed</SelectItem>
            <SelectItem value="business">Business Owner</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Employer / Business Name" required>
        <Input
          data-ocid="preapproval.employer.input"
          value={f.employerName}
          onChange={(e) => set("employerName", e.target.value)}
          placeholder="TechCorp Pvt. Ltd."
        />
      </Field>
      <Field label="Monthly Income (₹)" required>
        <Input
          data-ocid="preapproval.income.input"
          type="number"
          value={f.monthlyIncome || ""}
          onChange={(e) => set("monthlyIncome", Number(e.target.value))}
          placeholder="50000"
        />
      </Field>
      <Field label="Monthly Expenses (₹)" required>
        <Input
          data-ocid="preapproval.expenses.input"
          type="number"
          value={f.monthlyExpenses || ""}
          onChange={(e) => set("monthlyExpenses", Number(e.target.value))}
          placeholder="25000"
        />
      </Field>
      {(f.employmentType === "self-employed" ||
        f.employmentType === "business") && (
        <>
          <Field label="Business Age (years)">
            <Input
              data-ocid="preapproval.business_age.input"
              type="number"
              value={f.businessAge || ""}
              onChange={(e) => set("businessAge", Number(e.target.value))}
              placeholder="3"
            />
          </Field>
          <Field label="Annual Turnover (₹)">
            <Input
              data-ocid="preapproval.turnover.input"
              type="number"
              value={f.annualTurnover || ""}
              onChange={(e) => set("annualTurnover", Number(e.target.value))}
              placeholder="1200000"
            />
          </Field>
        </>
      )}
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({
  f,
  set,
}: {
  f: LoanFormData;
  set: (k: keyof LoanFormData, v: string | number | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Existing Loans (count)">
        <Input
          data-ocid="preapproval.loans_count.input"
          type="number"
          value={f.existingLoansCount || ""}
          onChange={(e) => set("existingLoansCount", Number(e.target.value))}
          placeholder="2"
        />
      </Field>
      <Field label="Total Outstanding Loan Amount (₹)">
        <Input
          data-ocid="preapproval.loans_outstanding.input"
          type="number"
          value={f.existingLoansOutstanding || ""}
          onChange={(e) =>
            set("existingLoansOutstanding", Number(e.target.value))
          }
          placeholder="150000"
        />
      </Field>
      <Field label="Credit Card Dues (₹)">
        <Input
          data-ocid="preapproval.cc_dues.input"
          type="number"
          value={f.creditCardDues || ""}
          onChange={(e) => set("creditCardDues", Number(e.target.value))}
          placeholder="25000"
        />
      </Field>
      <Field label="Monthly EMI Obligations (₹)">
        <Input
          data-ocid="preapproval.monthly_emi.input"
          type="number"
          value={f.monthlyEMI || ""}
          onChange={(e) => set("monthlyEMI", Number(e.target.value))}
          placeholder="8000"
        />
      </Field>
      <Field label="Other Liabilities (₹)">
        <Input
          data-ocid="preapproval.other_liabilities.input"
          type="number"
          value={f.otherLiabilities || ""}
          onChange={(e) => set("otherLiabilities", Number(e.target.value))}
          placeholder="5000"
        />
      </Field>
    </div>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────
function Step4({
  f,
  set,
}: {
  f: LoanFormData;
  set: (k: keyof LoanFormData, v: string | number | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Requested Loan Amount (₹)" required>
        <Input
          data-ocid="preapproval.loan_amount.input"
          type="number"
          value={f.requestedLoan || ""}
          onChange={(e) => set("requestedLoan", Number(e.target.value))}
          placeholder="500000"
        />
      </Field>
      <Field label="Loan Tenure (months)" required>
        <Input
          data-ocid="preapproval.tenure.input"
          type="number"
          value={f.tenure || ""}
          onChange={(e) => set("tenure", Number(e.target.value))}
          placeholder="36"
          min={6}
          max={360}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Loan Purpose" required>
          <Select
            value={f.loanPurpose}
            onValueChange={(v) => set("loanPurpose", v)}
          >
            <SelectTrigger data-ocid="preapproval.loan_purpose.select">
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home-renovation">Home Renovation</SelectItem>
              <SelectItem value="business-expansion">
                Business Expansion
              </SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label={`Estimated Credit Score: ${f.creditScore}`} required>
          <div className="pt-2 px-1">
            <Slider
              data-ocid="preapproval.credit_score.input"
              min={300}
              max={900}
              step={10}
              value={[f.creditScore]}
              onValueChange={([v]) => set("creditScore", v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>300 (Poor)</span>
              <span>600 (Fair)</span>
              <span>750 (Good)</span>
              <span>900 (Excellent)</span>
            </div>
          </div>
        </Field>
      </div>
    </div>
  );
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────
const DOC_ITEMS: { key: keyof LoanFormData; label: string; desc: string }[] = [
  { key: "docPAN", label: "PAN Card", desc: "Identity verification" },
  { key: "docAadhaar", label: "Aadhaar Card", desc: "Address + identity" },
  {
    key: "docSalarySlip",
    label: "Salary Slip (last 3 months)",
    desc: "Income verification",
  },
  {
    key: "docBankStatement",
    label: "Bank Statement (6–12 months)",
    desc: "Cash flow analysis",
  },
  { key: "docITR", label: "ITR / GST Returns", desc: "Tax compliance" },
  {
    key: "docAddressProof",
    label: "Proof of Address",
    desc: "Residential verification",
  },
];

function Step5({
  f,
  set,
}: {
  f: LoanFormData;
  set: (k: keyof LoanFormData, v: string | number | boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Toggle each document to mark it as uploaded. All 6 documents are
        recommended for best approval chances.
      </p>
      {DOC_ITEMS.map(({ key, label, desc }) => (
        <div
          key={key}
          className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            f[key]
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${f[key] ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}
            >
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
          <Switch
            data-ocid={`preapproval.${key}.switch`}
            checked={f[key] as boolean}
            onCheckedChange={(v) => set(key, v)}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
function Results({
  result,
  form,
  onReset,
}: { result: AnalysisResult; form: LoanFormData; onReset: () => void }) {
  const gradeColor =
    result.grade === "A"
      ? "text-emerald-500"
      : result.grade === "B"
        ? "text-blue-500"
        : result.grade === "C"
          ? "text-amber-500"
          : "text-red-500";

  return (
    <div className="space-y-6" id="preapproval-results">
      <style>{PRINT_STYLE}</style>

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Pre-Approval Analysis
          </h2>
          <p className="text-muted-foreground text-sm">
            Bank-grade assessment for {form.fullName || "Applicant"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            data-ocid="preapproval.reset.button"
            onClick={onReset}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> New Application
          </Button>
          <Button
            size="sm"
            data-ocid="preapproval.export.button"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Hero row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="md:col-span-1 flex flex-col items-center justify-center p-6"
          data-ocid="preapproval.risk_score.card"
        >
          <RiskGauge score={result.riskScore} />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Bank-Grade Risk Score
          </p>
        </Card>
        <Card data-ocid="preapproval.max_loan.card">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                Max Eligible Loan
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ₹{result.maxEligibleLoan.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on income & obligations
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="preapproval.safe_emi.card">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                Safe Monthly EMI
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ₹{result.safeEMI.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Comfortable repayment range
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="preapproval.grade.card">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                Approval Grade
              </span>
            </div>
            <p className={`text-6xl font-bold ${gradeColor}`}>{result.grade}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Creditworthiness rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Recommendations */}
      <Card data-ocid="preapproval.banks.card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" /> Bank Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.banks.map((bank, i) => (
            <div
              key={bank.name}
              data-ocid={`preapproval.bank.item.${i + 1}`}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center gap-3 ${
                i === 0
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2.5 rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">
                      {bank.name}
                    </p>
                    {i === 0 && (
                      <Badge className="text-xs bg-primary text-primary-foreground">
                        Best Match
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        bank.status === "Eligible"
                          ? "text-emerald-600 border-emerald-500/40"
                          : bank.status === "Possible"
                            ? "text-amber-600 border-amber-500/40"
                            : "text-red-500 border-red-500/40"
                      }`}
                    >
                      {bank.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max ₹{bank.offeredLoan.toLocaleString("en-IN")} ·{" "}
                    {bank.rate}% p.a.
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Approval Probability</span>
                  <span className="font-semibold text-foreground">
                    {bank.approvalProb}%
                  </span>
                </div>
                <Progress value={bank.approvalProb} className="h-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documents + Cashflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-ocid="preapproval.documents.card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> Document Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.docs.map((doc, i) => (
                <div
                  key={doc.label}
                  data-ocid={`preapproval.doc.item.${i + 1}`}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                    doc.uploaded
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  {doc.uploaded ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {doc.label}
                    </p>
                    {!doc.uploaded && (
                      <p className="text-xs text-red-500">Upload Required</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-ocid="preapproval.cashflow.card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Cash Flow Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {[
                  {
                    label: "Monthly Income",
                    value: `₹${form.monthlyIncome.toLocaleString("en-IN")}`,
                    cls: "",
                  },
                  {
                    label: "Monthly Expenses",
                    value: `₹${form.monthlyExpenses.toLocaleString("en-IN")}`,
                    cls: "",
                  },
                  {
                    label: "Existing EMI",
                    value: `₹${form.monthlyEMI.toLocaleString("en-IN")}`,
                    cls: "",
                  },
                  {
                    label: "Net Cash Flow",
                    value: `₹${result.netCashFlow.toLocaleString("en-IN")}`,
                    cls:
                      result.netCashFlow >= 0
                        ? "text-emerald-600 font-bold"
                        : "text-red-500 font-bold",
                  },
                  {
                    label: "DTI Ratio",
                    value: `${(result.dti * 100).toFixed(1)}%${result.dti > 0.45 ? " (⚠ High)" : ""}`,
                    cls:
                      result.dti > 0.45
                        ? "text-red-500"
                        : result.dti > 0.35
                          ? "text-amber-500"
                          : "text-emerald-600",
                  },
                ].map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.label}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold text-sm ${row.cls}`}
                    >
                      {row.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Card data-ocid="preapproval.suggestions.card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Pre-Loan Optimization
            Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.suggestions.map((s) => (
            <div
              key={s}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">{s}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8 no-print">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-xs hidden md:block font-medium ${i === current ? "text-primary" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 transition-colors ${i < current ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function LoanPreApprovalPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<LoanFormData>(INITIAL_FORM);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function setField(key: keyof LoanFormData, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    setResult(analyze(form));
  }

  function handleReset() {
    setResult(null);
    setStep(0);
    setForm(INITIAL_FORM);
  }

  const stepProps = { f: form, set: setField };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!result && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Loan Pre-Approval Engine
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bank-grade analysis · Verified applicant scoring · AI-powered
                  insights
                </p>
              </div>
            </div>
          </div>
        )}

        {result ? (
          <Results result={result} form={form} onReset={handleReset} />
        ) : (
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              <Stepper current={step} />
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">
                  {STEPS[step]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Step {step + 1} of {STEPS.length}
                </p>
              </div>
              <div className="min-h-[320px]">
                {step === 0 && <Step1 {...stepProps} />}
                {step === 1 && <Step2 {...stepProps} />}
                {step === 2 && <Step3 {...stepProps} />}
                {step === 3 && <Step4 {...stepProps} />}
                {step === 4 && <Step5 {...stepProps} />}
              </div>
              <div className="flex justify-between mt-8 pt-4 border-t border-border no-print">
                <Button
                  variant="outline"
                  data-ocid="preapproval.prev.button"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={step === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button
                    data-ocid="preapproval.next.button"
                    onClick={() => setStep((s) => s + 1)}
                    className="gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    data-ocid="preapproval.submit.button"
                    onClick={handleSubmit}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Sparkles className="h-4 w-4" /> Generate Analysis
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </PageLayout>
  );
}
