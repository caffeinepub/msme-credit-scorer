export type Role = "borrower" | "admin";
export type RiskTier = "Low" | "Medium" | "High";
export type HealthStatus = "Strong" | "Moderate" | "Risky";
export type Industry =
  | "textile"
  | "retail"
  | "kirana"
  | "manufacturing"
  | "food_processing"
  | "handicrafts";

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  verified: boolean;
  createdAt: string;
}

export interface BusinessProfile {
  userId: string;
  businessName: string;
  gstNumber: string;
  businessAge: number;
  industry: Industry;
  location: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  updatedAt: string;
}

export interface CreditScore {
  userId: string;
  altScore: number;
  traditionalScore: number | null;
  trustScore: number; // 0–100 Business Trust Score
  riskTier: RiskTier;
  stabilityScore: number;
  fraudFlag: string | null;
  calculatedAt: string;
}

export interface CashflowData {
  userId: string;
  month1Revenue: number;
  month1Expense: number;
  month2Revenue: number;
  month2Expense: number;
  month3Revenue: number;
  month3Expense: number;
  predictedSurplus: number;
  emiRiskPercent: number;
  updatedAt: string;
}

export interface Document {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface AppSession {
  user: User;
  token: string;
}

export interface ScoreSnapshot {
  userId: string;
  date: string;
  altScore: number;
  trustScore: number;
  traditionalScore: number | null;
  riskTier: RiskTier;
}

export interface PeerBenchmark {
  industry: Industry;
  label: string;
  avgRevenue: number;
  avgExpenseRatio: number;
  avgAltScore: number;
  avgStabilityScore: number;
  avgTrustScore: number;
  sampleSize: number;
}

export interface ScoreFactor {
  factor: string;
  label: string;
  score: number;
  maxScore: number;
  description: string;
  status: "good" | "ok" | "poor";
}

export interface AIRecommendation {
  id: string;
  type: "warning" | "tip" | "positive";
  title: string;
  message: string;
  impact: string;
  priority: number;
}

export interface ImprovementStep {
  step: number;
  action: string;
  detail: string;
  estimatedGain: number;
  priority: "high" | "medium" | "low";
  timeframe: string;
}

export interface CashflowPrediction {
  month4Revenue: number;
  month4Expense: number;
  month4Surplus: number;
  trend: "improving" | "stable" | "declining";
  riskFlag: boolean;
  riskMessage: string;
}

// Business Health Score (0–100) + status
export interface BusinessHealthData {
  score: number; // 0–100
  status: HealthStatus;
  label: string;
  description: string;
  components: { label: string; value: number; maxValue: number }[];
}

// Lender Confidence Score (0–100)
export interface LenderConfidenceData {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D";
  label: string;
  description: string;
  factors: { name: string; contribution: number; positive: boolean }[];
}

// Loan eligibility product
export interface LoanProduct {
  id: string;
  lender: string;
  lenderType: "bank" | "nbfc" | "microfinance" | "government";
  productName: string;
  minScore: number;
  maxAmount: number;
  minAmount: number;
  interestRate: string;
  tenure: string;
  eligible: boolean;
  eligibilityNote: string;
  features: string[];
}

// Risk alert
export interface RiskAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "cashflow" | "expenses" | "revenue" | "fraud" | "score" | "age";
  title: string;
  description: string;
  recommendation: string;
  detectedAt: string;
}
