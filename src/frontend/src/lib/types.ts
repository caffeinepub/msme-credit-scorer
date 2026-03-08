export type Role = "borrower" | "admin";
export type RiskTier = "Low" | "Medium" | "High";
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
  password: string; // hashed-ish (just stored as-is for demo)
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
