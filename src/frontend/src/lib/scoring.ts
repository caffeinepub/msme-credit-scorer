import type { Industry, RiskTier } from "./types";

export function calculateAltScore(data: {
  monthlyRevenue: number;
  businessAge: number;
  monthlyExpenses: number;
  industry: Industry | string;
}): number {
  let score = 300;

  // Revenue Stability (0-200): scale for MSME range (₹1K-₹20L monthly)
  score += Math.min(200, data.monthlyRevenue / 50000);

  // Business Age (0-150)
  score += Math.min(150, data.businessAge * 1.5);

  // Expense Ratio Penalty (0-100)
  const expenseRatio =
    data.monthlyRevenue > 0 ? data.monthlyExpenses / data.monthlyRevenue : 1;
  score -= Math.min(100, expenseRatio * 100);

  // Industry Risk Bonus (0-90)
  const industryBonus: Record<string, number> = {
    textile: 80,
    retail: 70,
    kirana: 90,
    manufacturing: 75,
    food_processing: 85,
    handicrafts: 65,
  };
  score += industryBonus[data.industry] ?? 50;

  return Math.min(900, Math.max(300, Math.round(score)));
}

export function getRiskTier(score: number): RiskTier {
  return score > 750 ? "Low" : score > 600 ? "Medium" : "High";
}

export function getTraditionalScoreLabel(score: number): string {
  if (score >= 750) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 600) return "Fair";
  return "Poor";
}

export function getTraditionalScoreTier(score: number): RiskTier {
  if (score >= 750) return "Low";
  if (score >= 600) return "Medium";
  return "High";
}

export function getStabilityScore(
  monthlyRevenue: number,
  monthlyExpenses: number,
): number {
  if (monthlyRevenue <= 0) return 0;
  const ratio = monthlyExpenses / monthlyRevenue;
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 100)));
}

export function predictEMIRisk(cashflow: {
  month1Revenue: number;
  month2Revenue: number;
  month3Revenue: number;
  month1Expense: number;
  month2Expense: number;
  month3Expense: number;
}): { predictedSurplus: number; emiRiskPercent: number; advice: string } {
  const avgRevenue =
    (cashflow.month1Revenue + cashflow.month2Revenue + cashflow.month3Revenue) /
    3;
  const avgExpense =
    (cashflow.month1Expense + cashflow.month2Expense + cashflow.month3Expense) /
    3;
  const predictedSurplus = avgRevenue - avgExpense;
  const currentProfit = cashflow.month3Revenue - cashflow.month3Expense;

  let emiRiskPercent = 0;
  let advice = "Stable — continue current pattern.";

  if (currentProfit > 0 && avgRevenue < cashflow.month3Revenue * 0.7) {
    emiRiskPercent = 35;
    advice =
      "Build ₹10,000 buffer, reduce expenses by 20%, avoid new purchases this month.";
  } else if (predictedSurplus < 0) {
    emiRiskPercent = 60;
    advice =
      "Expenses exceed revenue trend. Immediate cost reduction required before EMI commitment.";
  } else if (predictedSurplus < avgRevenue * 0.1) {
    emiRiskPercent = 18;
    advice = "Thin margins. Increase revenue or reduce discretionary expenses.";
  }

  return { predictedSurplus, emiRiskPercent, advice };
}

export function detectFraud(data: {
  monthlyRevenue: number;
  businessAge: number;
  gstNumber?: string;
}): string | null {
  if (data.monthlyRevenue > 10_000_000) {
    return "Revenue unusually high for MSME classification (>₹1 Crore/month)";
  }
  if (data.businessAge < 1 && data.monthlyRevenue > 1_000_000) {
    return "High revenue claim for a business under 1 year old";
  }
  if (data.businessAge < 0.5 && data.monthlyRevenue > 500_000) {
    return "Revenue too high for business age — possible data misrepresentation";
  }
  return null;
}

export function getScoreColor(tier: RiskTier): string {
  const map: Record<RiskTier, string> = {
    Low: "text-score-low",
    Medium: "text-score-medium",
    High: "text-score-high",
  };
  return map[tier];
}

export function getScoreBgClass(tier: RiskTier): string {
  const map: Record<RiskTier, string> = {
    Low: "score-low",
    Medium: "score-medium",
    High: "score-high",
  };
  return map[tier];
}

export function formatCurrency(amount: number): string {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  }
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)} L`;
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}
