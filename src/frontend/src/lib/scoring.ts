import type {
  AIRecommendation,
  BusinessHealthData,
  BusinessProfile,
  CashflowData,
  CashflowPrediction,
  CreditScore,
  HealthStatus,
  ImprovementStep,
  Industry,
  LenderConfidenceData,
  LoanProduct,
  PeerBenchmark,
  RiskAlert,
  RiskTier,
  ScoreFactor,
} from "./types";

// ── Alt Score (300–900) ──────────────────────────────────────
// Baseline 400. Average user (₹3-5L revenue, 2-5 yrs, 60-70% ratio)
// should land around 550-650.

export function calculateAltScore(data: {
  monthlyRevenue: number;
  businessAge: number;
  monthlyExpenses: number;
  industry: Industry | string;
}): number {
  // Baseline starting score
  let score = 400;

  // Revenue contribution (0–160): ₹1L → 16 pts, ₹5L → 80 pts, ₹10L+ → 160 pts
  const revenuePoints = Math.min(160, (data.monthlyRevenue / 100000) * 16);
  score += revenuePoints;

  // Business age (0–120): 1yr → 15 pts, 5yr → 75 pts, 8+ yr → 120 pts
  const agePoints = Math.min(120, data.businessAge * 15);
  score += agePoints;

  // Expense efficiency — reward good ratios, only penalise extreme cases
  const expenseRatio =
    data.monthlyRevenue > 0 ? data.monthlyExpenses / data.monthlyRevenue : 1;
  let expensePoints: number;
  if (expenseRatio <= 0.5) expensePoints = 90;
  else if (expenseRatio <= 0.6) expensePoints = 75;
  else if (expenseRatio <= 0.7) expensePoints = 55;
  else if (expenseRatio <= 0.8) expensePoints = 30;
  else if (expenseRatio <= 0.9) expensePoints = 10;
  else expensePoints = -30; // Only penalise near break-even
  score += expensePoints;

  // Industry bonus (35–60)
  const industryBonus: Record<string, number> = {
    kirana: 60,
    food_processing: 55,
    textile: 50,
    manufacturing: 48,
    retail: 45,
    handicrafts: 38,
  };
  score += industryBonus[data.industry] ?? 40;

  return Math.min(900, Math.max(300, Math.round(score)));
}

// ── Business Trust Score (0–100) ─────────────────────────────
// Baseline 15. Average user should land ~50-65.

export function calculateBusinessTrustScore(data: {
  businessAge: number;
  stabilityScore: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  industry: Industry | string;
}): number {
  // Baseline
  let score = 15;

  // Business age (0–25): 1yr → 4, 5yr → 15, 12+ yr → 25
  score += Math.min(25, data.businessAge * 2.5);

  // Stability / payment behaviour (0–25)
  score += Math.round((data.stabilityScore / 100) * 25);

  // Expense discipline (0–20): reward healthy ratios
  const expenseRatio =
    data.monthlyRevenue > 0 ? data.monthlyExpenses / data.monthlyRevenue : 1;
  const expensePoints = Math.max(0, Math.round((1 - expenseRatio) * 20));
  score += expensePoints;

  // Industry trust (8–15)
  const industryTrust: Record<string, number> = {
    kirana: 15,
    food_processing: 14,
    textile: 13,
    manufacturing: 12,
    retail: 11,
    handicrafts: 9,
  };
  score += industryTrust[data.industry] ?? 8;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── Business Health Score (0–100) ──────────────────────────

export function calculateBusinessHealth(
  profile: BusinessProfile,
  creditScore: CreditScore,
  cashflow?: CashflowData | null,
): BusinessHealthData {
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? profile.monthlyExpenses / profile.monthlyRevenue
      : 1;

  // Component 1: Alt Score component (0–25)
  const altComponent = Math.round(((creditScore.altScore - 300) / 600) * 25);

  // Component 2: Expense efficiency (0–25)
  const expenseComponent = Math.round(Math.max(0, (1 - expenseRatio) * 25));

  // Component 3: Business age (0–20)
  const ageComponent = Math.min(20, Math.round(profile.businessAge * 2));

  // Component 4: Stability / trust (0–15)
  const stabilityComponent = Math.round(
    (creditScore.stabilityScore / 100) * 15,
  );

  // Component 5: Cashflow health (0–15)
  let cashflowComponent = 10; // default moderate
  if (cashflow) {
    if (cashflow.emiRiskPercent > 40) cashflowComponent = 0;
    else if (cashflow.emiRiskPercent > 25) cashflowComponent = 5;
    else if (cashflow.emiRiskPercent < 10) cashflowComponent = 15;
    else cashflowComponent = 10;
  }

  const totalScore = Math.min(
    100,
    altComponent +
      expenseComponent +
      ageComponent +
      stabilityComponent +
      cashflowComponent,
  );

  let status: HealthStatus;
  let label: string;
  let description: string;
  if (totalScore >= 65) {
    status = "Strong";
    label = "Strong";
    description =
      "Your business is financially healthy and well-positioned for credit access.";
  } else if (totalScore >= 35) {
    status = "Moderate";
    label = "Moderate";
    description =
      "Solid foundation with room to improve. Focus on reducing expenses and growing revenue.";
  } else {
    status = "Risky";
    label = "Risky";
    description =
      "Financial health needs attention. Urgent action needed to reduce risk.";
  }

  return {
    score: totalScore,
    status,
    label,
    description,
    components: [
      { label: "Credit Score", value: altComponent, maxValue: 25 },
      { label: "Expense Efficiency", value: expenseComponent, maxValue: 25 },
      { label: "Business Age", value: ageComponent, maxValue: 20 },
      { label: "Financial Stability", value: stabilityComponent, maxValue: 15 },
      { label: "Cash Flow Health", value: cashflowComponent, maxValue: 15 },
    ],
  };
}

// ── Lender Confidence Score (0–100) ──────────────────────

export function calculateLenderConfidence(
  profile: BusinessProfile,
  creditScore: CreditScore,
  cashflow?: CashflowData | null,
): LenderConfidenceData {
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? profile.monthlyExpenses / profile.monthlyRevenue
      : 1;

  // Factor 1: Alt score strength (0–30)
  const altFactor = Math.round(((creditScore.altScore - 300) / 600) * 30);

  // Factor 2: Trust score (0–25)
  const trustFactor = Math.round((creditScore.trustScore / 100) * 25);

  // Factor 3: Low expense ratio = financial discipline (0–20)
  const expenseFactor = Math.round(Math.max(0, (1 - expenseRatio) * 20));

  // Factor 4: Business longevity (0–15)
  const ageFactor = Math.min(15, Math.round(profile.businessAge * 1.5));

  // Factor 5: Cash flow safety (0–10)
  let cashflowFactor = 7;
  if (cashflow) {
    if (cashflow.emiRiskPercent > 40) cashflowFactor = 0;
    else if (cashflow.emiRiskPercent > 25) cashflowFactor = 3;
    else if (cashflow.emiRiskPercent < 10) cashflowFactor = 10;
    else cashflowFactor = 6;
  }

  const total = Math.min(
    100,
    altFactor + trustFactor + expenseFactor + ageFactor + cashflowFactor,
  );

  type Grade = "A+" | "A" | "B" | "C" | "D";
  let grade: Grade;
  let label: string;
  let description: string;

  if (total >= 80) {
    grade = "A+";
    label = "Highly Reliable";
    description =
      "Excellent lender confidence. You are a priority borrower for most financial institutions.";
  } else if (total >= 65) {
    grade = "A";
    label = "Reliable";
    description =
      "Strong confidence. Banks and NBFCs will likely approve your loan applications.";
  } else if (total >= 50) {
    grade = "B";
    label = "Moderate Confidence";
    description =
      "Good standing. Microfinance and NBFC loans are accessible. Bank loans may require collateral.";
  } else if (total >= 35) {
    grade = "C";
    label = "Below Average";
    description =
      "Limited confidence. Focus on reducing expenses and improving your alt score.";
  } else {
    grade = "D";
    label = "Needs Improvement";
    description =
      "Low lender confidence. Work on financial stability before applying for credit.";
  }

  return {
    score: total,
    grade,
    label,
    description,
    factors: [
      {
        name: "Alt Credit Score",
        contribution: altFactor,
        positive: altFactor >= 15,
      },
      {
        name: "Business Trust",
        contribution: trustFactor,
        positive: trustFactor >= 12,
      },
      {
        name: "Expense Discipline",
        contribution: expenseFactor,
        positive: expenseFactor >= 10,
      },
      {
        name: "Business Longevity",
        contribution: ageFactor,
        positive: ageFactor >= 8,
      },
      {
        name: "Cash Flow Safety",
        contribution: cashflowFactor,
        positive: cashflowFactor >= 5,
      },
    ],
  };
}

// ── Loan Products ──────────────────────────────────────────

export function getLoanProducts(
  creditScore: CreditScore,
  profile: BusinessProfile,
): LoanProduct[] {
  const score = creditScore.altScore;
  const monthlyRevenue = profile.monthlyRevenue;
  const maxLoanMultiplier = score > 750 ? 18 : score > 600 ? 12 : 6;
  const estimatedMax =
    Math.round((monthlyRevenue * maxLoanMultiplier) / 100000) * 100000;

  const products: LoanProduct[] = [
    {
      id: "sidbi_mudra",
      lender: "SIDBI / Mudra Yojana",
      lenderType: "government",
      productName: "Pradhan Mantri Mudra Yojana",
      minScore: 300,
      maxAmount: 1000000,
      minAmount: 50000,
      interestRate: "8.5–10%",
      tenure: "12–60 months",
      eligible: score >= 300,
      eligibilityNote:
        score >= 300
          ? "You qualify for Mudra Shishu/Kishore loans"
          : "Minimum profile required",
      features: [
        "No collateral required",
        "Government-backed",
        "Tax benefits available",
        "Quick processing",
      ],
    },
    {
      id: "sbi_sme",
      lender: "State Bank of India",
      lenderType: "bank",
      productName: "SME Working Capital Loan",
      minScore: 600,
      maxAmount: Math.min(5000000, estimatedMax),
      minAmount: 200000,
      interestRate: "10.5–12.5%",
      tenure: "12–84 months",
      eligible: score >= 600,
      eligibilityNote:
        score >= 600
          ? `Eligible for up to ${formatCurrency(Math.min(5000000, estimatedMax))}`
          : `Need ${600 - score} more points to qualify`,
      features: [
        "Lowest bank rates",
        "Priority sector lending",
        "Flexible repayment",
        "GST registered businesses",
      ],
    },
    {
      id: "hdfc_bizgrow",
      lender: "HDFC Bank",
      lenderType: "bank",
      productName: "BizGrow Business Loan",
      minScore: 680,
      maxAmount: Math.min(7500000, estimatedMax * 1.2),
      minAmount: 500000,
      interestRate: "11–13%",
      tenure: "12–60 months",
      eligible: score >= 680,
      eligibilityNote:
        score >= 680
          ? `Pre-approved up to ${formatCurrency(Math.min(7500000, estimatedMax * 1.2))}`
          : `Need ${680 - score} more points to qualify`,
      features: [
        "Fast disbursement (48 hrs)",
        "Minimal documentation",
        "Digital process",
        "Doorstep service",
      ],
    },
    {
      id: "bajaj_sme",
      lender: "Bajaj Finserv",
      lenderType: "nbfc",
      productName: "Business Loan for SMEs",
      minScore: 520,
      maxAmount: Math.min(3000000, estimatedMax),
      minAmount: 100000,
      interestRate: "14–18%",
      tenure: "12–60 months",
      eligible: score >= 520,
      eligibilityNote:
        score >= 520
          ? `Eligible up to ${formatCurrency(Math.min(3000000, estimatedMax))}`
          : `Need ${520 - score} more points to qualify`,
      features: [
        "No collateral",
        "Online approval",
        "Flexible part-prepayment",
        "24/7 account management",
      ],
    },
    {
      id: "lendingkart",
      lender: "Lendingkart",
      lenderType: "nbfc",
      productName: "MSME Working Capital",
      minScore: 450,
      maxAmount: Math.min(2000000, estimatedMax),
      minAmount: 50000,
      interestRate: "15–22%",
      tenure: "1–36 months",
      eligible: score >= 450,
      eligibilityNote:
        score >= 450
          ? `Eligible up to ${formatCurrency(Math.min(2000000, estimatedMax))}`
          : `Need ${450 - score} more points to qualify`,
      features: [
        "100% digital",
        "No branch visit",
        "Instant in-principle approval",
        "Alternate data scoring",
      ],
    },
    {
      id: "ujjivan_mf",
      lender: "Ujjivan Small Finance Bank",
      lenderType: "microfinance",
      productName: "Micro Business Loan",
      minScore: 300,
      maxAmount: 500000,
      minAmount: 10000,
      interestRate: "18–24%",
      tenure: "6–24 months",
      eligible: true,
      eligibilityNote: "Always eligible — ideal for early-stage businesses",
      features: [
        "No credit history needed",
        "Group or individual",
        "Financial literacy support",
        "Door-to-door service",
      ],
    },
  ];

  return products;
}

// ── Risk Alerts ────────────────────────────────────────────

export function getRiskAlerts(
  profile: BusinessProfile,
  creditScore: CreditScore,
  cashflow?: CashflowData | null,
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? (profile.monthlyExpenses / profile.monthlyRevenue) * 100
      : 100;
  const now = new Date().toISOString();

  // Fraud flag
  if (creditScore.fraudFlag) {
    alerts.push({
      id: "fraud_flag",
      severity: "critical",
      category: "fraud",
      title: "Unusual Pattern Detected",
      description: creditScore.fraudFlag,
      recommendation:
        "Review your submitted data for accuracy. Provide supporting documents to verify your financial claims.",
      detectedAt: now,
    });
  }

  // Critical expense spike (only flag truly extreme cases)
  if (expenseRatio > 90) {
    alerts.push({
      id: "expense_critical",
      severity: "critical",
      category: "expenses",
      title: "Critical Expense Spike",
      description: `Expenses are ${expenseRatio.toFixed(0)}% of revenue. Your business is near break-even or loss-making.`,
      recommendation:
        "Immediately audit all expense categories. Identify and eliminate non-essential costs. Consider pausing expansion plans.",
      detectedAt: now,
    });
  } else if (expenseRatio > 80) {
    alerts.push({
      id: "expense_high",
      severity: "warning",
      category: "expenses",
      title: "High Expense Ratio",
      description: `Expenses consume ${expenseRatio.toFixed(0)}% of your revenue, leaving thin margins.`,
      recommendation:
        "Target bringing expenses below 70% of revenue. Review supplier contracts and overhead costs.",
      detectedAt: now,
    });
  }

  // Revenue instability detection
  if (cashflow) {
    const revenues = [
      cashflow.month1Revenue,
      cashflow.month2Revenue,
      cashflow.month3Revenue,
    ];
    const avgRev = revenues.reduce((a, b) => a + b, 0) / 3;
    const maxDev = Math.max(...revenues.map((r) => Math.abs(r - avgRev)));
    const volatility = avgRev > 0 ? (maxDev / avgRev) * 100 : 0;

    if (volatility > 40) {
      alerts.push({
        id: "revenue_volatile",
        severity: "critical",
        category: "revenue",
        title: "Highly Unstable Revenue",
        description: `Revenue fluctuates by ${volatility.toFixed(0)}% across months. This signals business instability to lenders.`,
        recommendation:
          "Diversify your customer base. Add recurring or subscription-based revenue. Build a 2-month cash reserve.",
        detectedAt: now,
      });
    } else if (volatility > 20) {
      alerts.push({
        id: "revenue_moderate_volatile",
        severity: "warning",
        category: "revenue",
        title: "Moderate Revenue Volatility",
        description: `Revenue varies by ${volatility.toFixed(0)}% month-to-month. Lenders prefer consistent income.`,
        recommendation:
          "Work on stabilising monthly income. Long-term contracts or retainer clients can help reduce volatility.",
        detectedAt: now,
      });
    }

    // EMI risk
    if (cashflow.emiRiskPercent > 40) {
      alerts.push({
        id: "emi_critical",
        severity: "critical",
        category: "cashflow",
        title: "Critical EMI Stress",
        description: `EMI risk level is ${cashflow.emiRiskPercent}%. Current cash flow cannot safely support loan repayments.`,
        recommendation:
          "Do not take on new debt. Build a ₹20,000 emergency buffer. Reduce expenses immediately.",
        detectedAt: now,
      });
    } else if (cashflow.emiRiskPercent > 25) {
      alerts.push({
        id: "emi_warning",
        severity: "warning",
        category: "cashflow",
        title: "Elevated EMI Risk",
        description: `EMI risk at ${cashflow.emiRiskPercent}%. Projected cash flow may struggle with new loan commitments.`,
        recommendation:
          "Build a ₹10,000 monthly buffer before adding EMI commitments. Reduce variable expenses by 15–20%.",
        detectedAt: now,
      });
    }

    // Declining trend
    const trend = revenues[2] - revenues[0];
    if (trend < -revenues[0] * 0.15) {
      alerts.push({
        id: "revenue_declining",
        severity: "warning",
        category: "revenue",
        title: "Revenue Declining Trend",
        description: `Revenue has dropped by ${Math.abs((trend / revenues[0]) * 100).toFixed(0)}% over the last 3 months.`,
        recommendation:
          "Investigate root causes — seasonal demand, competition, or product issues. Consider new sales channels or promotions.",
        detectedAt: now,
      });
    }
  }

  // Score alerts use updated thresholds aligned with new scoring
  if (creditScore.altScore < 450) {
    alerts.push({
      id: "score_low",
      severity: "critical",
      category: "score",
      title: "Credit Score Needs Attention",
      description: `Alt score of ${creditScore.altScore} is below 450. Focus on revenue growth and expense control to improve.`,
      recommendation:
        "Follow the Credit Improvement Plan. Focus on reducing expenses and building business tenure.",
      detectedAt: now,
    });
  } else if (creditScore.altScore < 550) {
    alerts.push({
      id: "score_moderate",
      severity: "warning",
      category: "score",
      title: "Score Below Bank Threshold",
      description: `Alt score of ${creditScore.altScore} limits access to formal bank loans. NBFCs and microfinance remain accessible.`,
      recommendation:
        "Target reaching 600+ to unlock SBI working capital loans. See the improvement plan for steps.",
      detectedAt: now,
    });
  }

  // New business risk
  if (profile.businessAge < 1) {
    alerts.push({
      id: "age_low",
      severity: "info",
      category: "age",
      title: "Early Stage Business",
      description:
        "Businesses under 1 year old face stricter lending criteria as they lack operating history.",
      recommendation:
        "Focus on building documented revenue history. File GST returns on time. Maintain a business bank account.",
      detectedAt: now,
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}

// ── Risk Tier ─────────────────────────────────────────────────
// Updated thresholds to match the new realistic score ranges.

export function getRiskTier(score: number): RiskTier {
  return score >= 700 ? "Low" : score >= 550 ? "Medium" : "High";
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

export function calculateTraditionalScore(data: {
  monthlyRevenue: number;
  businessAge: number;
  monthlyExpenses: number;
  industry: Industry | string;
  cashflowConsistency?: number | null;
  hasFraudFlag?: boolean;
}): number {
  let score = 400;

  // Revenue component (0–160)
  score += Math.min(160, (data.monthlyRevenue / 100000) * 16);

  // Business age (0–100)
  score += Math.min(100, data.businessAge * 12);

  // Expense efficiency
  const ratio =
    data.monthlyRevenue > 0 ? data.monthlyExpenses / data.monthlyRevenue : 1;
  if (ratio <= 0.5) score += 80;
  else if (ratio <= 0.6) score += 65;
  else if (ratio <= 0.7) score += 45;
  else if (ratio <= 0.8) score += 20;
  else if (ratio <= 0.9) score += 5;
  else score -= 40;

  // Cashflow consistency (0–80)
  if (data.cashflowConsistency != null) {
    score += Math.round((data.cashflowConsistency / 100) * 80);
  }

  // Fraud penalty
  if (data.hasFraudFlag) score -= 80;

  return Math.max(300, Math.min(900, Math.round(score)));
}

export function getStabilityScore(
  monthlyRevenue: number,
  monthlyExpenses: number,
): number {
  if (monthlyRevenue <= 0) return 0;
  const ratio = monthlyExpenses / monthlyRevenue;
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 100)));
}

// ── Score Breakdown ─────────────────────────────────────────
// Updated maxScore values to match the new scoring weights.

export function getScoreBreakdown(
  profile: BusinessProfile,
  creditScore: CreditScore,
): ScoreFactor[] {
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? (profile.monthlyExpenses / profile.monthlyRevenue) * 100
      : 100;

  const revenueContribution = Math.min(
    160,
    (profile.monthlyRevenue / 100000) * 16,
  );
  const ageContribution = Math.min(120, profile.businessAge * 15);

  let expenseContribution: number;
  const ratio = expenseRatio / 100;
  if (ratio <= 0.5) expenseContribution = 90;
  else if (ratio <= 0.6) expenseContribution = 75;
  else if (ratio <= 0.7) expenseContribution = 55;
  else if (ratio <= 0.8) expenseContribution = 30;
  else if (ratio <= 0.9) expenseContribution = 10;
  else expenseContribution = 0;

  const industryScore: Record<string, number> = {
    kirana: 60,
    food_processing: 55,
    textile: 50,
    manufacturing: 48,
    retail: 45,
    handicrafts: 38,
  };

  return [
    {
      factor: "revenue_stability",
      label: "Revenue Stability",
      score: Math.round(revenueContribution),
      maxScore: 160,
      description: `Monthly revenue of ₹${(profile.monthlyRevenue / 1000).toFixed(0)}K contributes ${Math.round(revenueContribution)} pts`,
      status:
        revenueContribution >= 100
          ? "good"
          : revenueContribution >= 50
            ? "ok"
            : "poor",
    },
    {
      factor: "business_age",
      label: "Business Age",
      score: Math.round(ageContribution),
      maxScore: 120,
      description: `${profile.businessAge} years in business — adds ${Math.round(ageContribution)} pts`,
      status:
        ageContribution >= 75 ? "good" : ageContribution >= 30 ? "ok" : "poor",
    },
    {
      factor: "expense_ratio",
      label: "Expense Efficiency",
      score: Math.round(expenseContribution),
      maxScore: 90,
      description: `Expense ratio is ${expenseRatio.toFixed(1)}% — ${expenseRatio < 60 ? "excellent" : expenseRatio < 75 ? "healthy" : expenseRatio < 85 ? "moderate" : "high"} spending`,
      status: expenseRatio < 65 ? "good" : expenseRatio < 80 ? "ok" : "poor",
    },
    {
      factor: "payment_behavior",
      label: "Payment Behavior",
      score: Math.round(creditScore.stabilityScore * 0.8),
      maxScore: 80,
      description: `Stability score of ${creditScore.stabilityScore}/100 reflects consistent payment patterns`,
      status:
        creditScore.stabilityScore >= 70
          ? "good"
          : creditScore.stabilityScore >= 40
            ? "ok"
            : "poor",
    },
    {
      factor: "industry_factor",
      label: "Industry Factor",
      score: industryScore[profile.industry] ?? 40,
      maxScore: 60,
      description: `${profile.industry.replace("_", " ")} sector risk profile`,
      status: (industryScore[profile.industry] ?? 40) >= 50 ? "good" : "ok",
    },
  ];
}

// ── AI Recommendations ───────────────────────────────────────

export function generateAIRecommendations(
  profile: BusinessProfile,
  creditScore: CreditScore,
  cashflow: CashflowData | null,
): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? (profile.monthlyExpenses / profile.monthlyRevenue) * 100
      : 100;
  const netProfit = profile.monthlyRevenue - profile.monthlyExpenses;
  const reductionNeeded =
    profile.monthlyExpenses - profile.monthlyRevenue * 0.65;

  let id = 1;

  if (expenseRatio > 80) {
    recs.push({
      id: `rec_${id++}`,
      type: "warning",
      title: "Critical: Expenses Too High",
      message: `Your expenses are ${expenseRatio.toFixed(0)}% of revenue. Reducing to 65% could free up ₹${Math.max(0, reductionNeeded / 1000).toFixed(0)}K/month.`,
      impact: "+45 to +60 pts potential",
      priority: 1,
    });
  } else if (expenseRatio > 70) {
    recs.push({
      id: `rec_${id++}`,
      type: "tip",
      title: "Reduce Expense Ratio",
      message: `Expense ratio is ${expenseRatio.toFixed(0)}%. Targeting below 65% by reducing variable costs could improve your creditworthiness.`,
      impact: "+20 to +35 pts potential",
      priority: 2,
    });
  }

  if (profile.monthlyRevenue < 500000) {
    recs.push({
      id: `rec_${id++}`,
      type: "tip",
      title: "Grow Monthly Revenue",
      message: `Current revenue of ₹${(profile.monthlyRevenue / 1000).toFixed(0)}K is below the ₹5L milestone that significantly boosts your credit score.`,
      impact: "+50 to +80 pts at ₹5L revenue",
      priority: 2,
    });
  }

  if (profile.businessAge < 3) {
    recs.push({
      id: `rec_${id++}`,
      type: "tip",
      title: "Build Track Record",
      message: `Your business is ${profile.businessAge < 1 ? "under 1 year" : `${profile.businessAge} years`} old. Each year of consistent operation adds 15 pts to your score.`,
      impact: "+15 pts per year",
      priority: 3,
    });
  }

  if (cashflow && cashflow.emiRiskPercent > 25) {
    recs.push({
      id: `rec_${id++}`,
      type: "warning",
      title: "Cash Flow Risk Detected",
      message: `EMI stress level is ${cashflow.emiRiskPercent}%. Build a buffer of at least ₹15,000 and avoid new loan commitments.`,
      impact: "Prevents score drop of −30 to −50 pts",
      priority: 1,
    });
  }

  if (expenseRatio < 55) {
    recs.push({
      id: `rec_${id++}`,
      type: "positive",
      title: "Excellent Cost Management",
      message: `Your expense ratio of ${expenseRatio.toFixed(0)}% is well below the 65% benchmark. Strong signal for lenders.`,
      impact: "Maintaining this adds +90 pts",
      priority: 4,
    });
  }

  if (profile.businessAge >= 8) {
    recs.push({
      id: `rec_${id++}`,
      type: "positive",
      title: "Strong Business Tenure",
      message: `${profile.businessAge} years of operation puts you in the top tier for business age scoring.`,
      impact: "Contributes +120 pts (near max)",
      priority: 4,
    });
  }

  if (creditScore.altScore >= 700) {
    recs.push({
      id: `rec_${id++}`,
      type: "positive",
      title: "Bank Loan Ready",
      message: `Your alt score of ${creditScore.altScore} qualifies you for formal bank credit. Consider applying for a working capital loan.`,
      impact: "Eligible for priority sector loans",
      priority: 3,
    });
  }

  if (netProfit > 0 && netProfit < profile.monthlyRevenue * 0.2) {
    recs.push({
      id: `rec_${id++}`,
      type: "tip",
      title: "Improve Profit Margins",
      message: `Net profit is ${((netProfit / profile.monthlyRevenue) * 100).toFixed(0)}% of revenue. Aim for 25%+ margins to strengthen lender confidence.`,
      impact: "+15 to +25 pts with improved margins",
      priority: 3,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

// ── Credit Improvement Plan ─────────────────────────────────

export function getCreditImprovementSteps(
  profile: BusinessProfile,
  creditScore: CreditScore,
): ImprovementStep[] {
  const steps: ImprovementStep[] = [];
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? (profile.monthlyExpenses / profile.monthlyRevenue) * 100
      : 100;

  let stepNum = 1;

  if (expenseRatio > 70) {
    steps.push({
      step: stepNum++,
      action: "Reduce Monthly Expenses",
      detail: `Cut expenses from ${expenseRatio.toFixed(0)}% to below 65% of revenue. Audit top 3 expense categories.`,
      estimatedGain: Math.round((expenseRatio - 65) * 0.8),
      priority: "high",
      timeframe: "1–2 months",
    });
  }

  if (profile.monthlyRevenue < 1000000) {
    steps.push({
      step: stepNum++,
      action: "Increase Monthly Revenue",
      detail:
        "Grow revenue to ₹10L/month through upselling, new product lines, or expanding delivery radius.",
      estimatedGain: Math.round(
        Math.min(96, (1000000 - profile.monthlyRevenue) / 100000) * 16,
      ),
      priority: profile.monthlyRevenue < 300000 ? "high" : "medium",
      timeframe: "3–6 months",
    });
  }

  if (profile.businessAge < 5) {
    steps.push({
      step: stepNum++,
      action: "Maintain Business Continuity",
      detail:
        "Continue consistent operation. File GST returns on time and maintain proper records.",
      estimatedGain: Math.round((5 - profile.businessAge) * 15),
      priority: "medium",
      timeframe: "Ongoing",
    });
  }

  if (creditScore.traditionalScore == null) {
    steps.push({
      step: stepNum++,
      action: "Improve Your Traditional Credit Score",
      detail:
        "Your system-estimated traditional score can be improved by increasing revenue, reducing expenses, and maintaining consistent cashflow.",
      estimatedGain: 0,
      priority: "medium",
      timeframe: "Immediate",
    });
  } else if (creditScore.traditionalScore < 700) {
    steps.push({
      step: stepNum++,
      action: "Improve CIBIL Score",
      detail: `CIBIL of ${creditScore.traditionalScore} can improve by paying dues on time and reducing credit utilisation below 30%.`,
      estimatedGain: 0,
      priority: "high",
      timeframe: "6–12 months",
    });
  }

  steps.push({
    step: stepNum++,
    action: "Upload Business Documents",
    detail:
      "Upload GST returns, bank statements, and registration docs. Verified documentation increases lender trust.",
    estimatedGain: 5,
    priority: "low",
    timeframe: "This week",
  });

  if (expenseRatio <= 70 && profile.businessAge >= 3) {
    steps.push({
      step: stepNum++,
      action: "Apply for a Small Working Capital Loan",
      detail: `With a score of ${creditScore.altScore}, you're eligible for MSME working capital loans. Taking and repaying builds history.`,
      estimatedGain: 15,
      priority: "medium",
      timeframe: "1–3 months",
    });
  }

  return steps;
}

// ── Cashflow Prediction ─────────────────────────────────────

export function getCashflowPrediction(
  cashflow: CashflowData,
): CashflowPrediction {
  const revenues = [
    cashflow.month1Revenue,
    cashflow.month2Revenue,
    cashflow.month3Revenue,
  ];
  const expenses = [
    cashflow.month1Expense,
    cashflow.month2Expense,
    cashflow.month3Expense,
  ];

  const revTrend = revenues[2] - revenues[0];
  const expTrend = expenses[2] - expenses[0];

  const month4Revenue = Math.max(0, revenues[2] + revTrend * 0.5);
  const month4Expense = Math.max(0, expenses[2] + expTrend * 0.5);
  const month4Surplus = month4Revenue - month4Expense;

  const avgRevenue = revenues.reduce((a, b) => a + b, 0) / 3;
  const revenueChange = (month4Revenue - avgRevenue) / avgRevenue;

  let trend: "improving" | "stable" | "declining";
  if (revenueChange > 0.05) trend = "improving";
  else if (revenueChange < -0.05) trend = "declining";
  else trend = "stable";

  const riskFlag = month4Surplus < 0 || month4Surplus < month4Revenue * 0.05;
  let riskMessage = "";
  if (month4Surplus < 0) {
    riskMessage = `Projected deficit of ₹${Math.abs(month4Surplus / 1000).toFixed(0)}K in Month 4. Immediate cost reduction advised.`;
  } else if (riskFlag) {
    riskMessage = `Thin surplus of ₹${(month4Surplus / 1000).toFixed(0)}K projected. Build a ₹20K buffer.`;
  } else {
    riskMessage = `Projected surplus of ₹${(month4Surplus / 1000).toFixed(0)}K — healthy cashflow trend.`;
  }

  return {
    month4Revenue,
    month4Expense,
    month4Surplus,
    trend,
    riskFlag,
    riskMessage,
  };
}

// ── Peer Benchmarks ────────────────────────────────────────

export function getPeerBenchmark(industry: Industry): PeerBenchmark {
  const benchmarks: Record<Industry, PeerBenchmark> = {
    textile: {
      industry: "textile",
      label: "Textile",
      avgRevenue: 720000,
      avgExpenseRatio: 62,
      avgAltScore: 650,
      avgStabilityScore: 58,
      avgTrustScore: 62,
      sampleSize: 342,
    },
    retail: {
      industry: "retail",
      label: "Retail",
      avgRevenue: 480000,
      avgExpenseRatio: 68,
      avgAltScore: 610,
      avgStabilityScore: 52,
      avgTrustScore: 55,
      sampleSize: 518,
    },
    kirana: {
      industry: "kirana",
      label: "Kirana",
      avgRevenue: 280000,
      avgExpenseRatio: 58,
      avgAltScore: 660,
      avgStabilityScore: 62,
      avgTrustScore: 68,
      sampleSize: 892,
    },
    manufacturing: {
      industry: "manufacturing",
      label: "Manufacturing",
      avgRevenue: 950000,
      avgExpenseRatio: 65,
      avgAltScore: 635,
      avgStabilityScore: 55,
      avgTrustScore: 60,
      sampleSize: 215,
    },
    food_processing: {
      industry: "food_processing",
      label: "Food Processing",
      avgRevenue: 620000,
      avgExpenseRatio: 61,
      avgAltScore: 645,
      avgStabilityScore: 60,
      avgTrustScore: 65,
      sampleSize: 178,
    },
    handicrafts: {
      industry: "handicrafts",
      label: "Handicrafts",
      avgRevenue: 190000,
      avgExpenseRatio: 72,
      avgAltScore: 565,
      avgStabilityScore: 45,
      avgTrustScore: 50,
      sampleSize: 124,
    },
  };
  return benchmarks[industry];
}

// ── EMI Predictor ─────────────────────────────────────────

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

// ── Fraud detection ────────────────────────────────────────

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

// ── Color / style helpers ─────────────────────────────────

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

// ── Invisible Credit Score ─────────────────────────────────

export interface InvisibleScoreFactor {
  label: string;
  score: number;
  maxScore: number;
  description: string;
  status: "good" | "ok" | "poor";
}

export interface InvisibleCreditScoreResult {
  score: number;
  factors: InvisibleScoreFactor[];
}

export function calculateInvisibleCreditScore(profile: {
  businessAge: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  industry: string;
}): InvisibleCreditScoreResult {
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? profile.monthlyExpenses / profile.monthlyRevenue
      : 1;

  // GST Compliance (0–150): reward age-based compliance
  const gstScore =
    profile.businessAge >= 3
      ? 150
      : profile.businessAge >= 2
        ? 120
        : profile.businessAge >= 1
          ? 80
          : 40;

  // Digital Transactions (0–130): scaled so ₹3L = ~60pts, ₹8L = ~130pts
  const digitalScore = Math.min(130, (profile.monthlyRevenue / 100000) * 16);

  // Expense Discipline (0–130): reward healthy ratios
  const expenseScore = Math.max(0, (1 - expenseRatio) * 130);

  // Industry Stability (0–100)
  const industryMap: Record<string, number> = {
    kirana: 100,
    food_processing: 100,
    textile: 85,
    manufacturing: 85,
    retail: 75,
    handicrafts: 65,
  };
  const industryScore = industryMap[profile.industry] ?? 70;

  // Business Continuity (0–140): 1yr=18, 5yr=90, 9.3yr=140
  const continuityScore = Math.min(140, profile.businessAge * 18);

  const rawTotal =
    400 +
    gstScore +
    digitalScore +
    expenseScore +
    industryScore +
    continuityScore;

  const total = Math.min(900, Math.max(300, Math.round(rawTotal)));

  const factors: InvisibleScoreFactor[] = [
    {
      label: "GST Compliance",
      score: Math.round(gstScore),
      maxScore: 150,
      description:
        gstScore >= 150
          ? "Business registered 3+ years, strong GST history"
          : gstScore >= 120
            ? "Business 2–3 years old, developing GST track record"
            : gstScore >= 80
              ? "Business 1–2 years old, building compliance"
              : "Business under 1 year, limited GST history",
      status: gstScore >= 120 ? "good" : gstScore >= 80 ? "ok" : "poor",
    },
    {
      label: "Digital Transactions",
      score: Math.round(digitalScore),
      maxScore: 130,
      description: `Monthly revenue ₹${(profile.monthlyRevenue / 1000).toFixed(0)}K indicates digital payment activity`,
      status: digitalScore >= 96 ? "good" : digitalScore >= 48 ? "ok" : "poor",
    },
    {
      label: "Expense Discipline",
      score: Math.round(expenseScore),
      maxScore: 130,
      description: `Expense ratio ${(expenseRatio * 100).toFixed(0)}% — ${expenseRatio < 0.5 ? "excellent cost control" : expenseRatio < 0.7 ? "healthy cost control" : expenseRatio < 0.85 ? "moderate expenses" : "high expenses"}`,
      status: expenseScore >= 90 ? "good" : expenseScore >= 50 ? "ok" : "poor",
    },
    {
      label: "Industry Stability",
      score: Math.round(industryScore),
      maxScore: 100,
      description: `${profile.industry.replace("_", " ")} industry stability rating`,
      status:
        industryScore >= 90 ? "good" : industryScore >= 75 ? "ok" : "poor",
    },
    {
      label: "Business Continuity",
      score: Math.round(continuityScore),
      maxScore: 140,
      description: `${profile.businessAge} years in operation`,
      status:
        continuityScore >= 90 ? "good" : continuityScore >= 36 ? "ok" : "poor",
    },
  ];

  return { score: total, factors };
}

// ── Loan Approval Predictor ─────────────────────────────────

export interface LoanApprovalResult {
  lenderId: string;
  lenderName: string;
  lenderType: "bank" | "nbfc" | "microfinance" | "government";
  probability: number;
  tier: "High" | "Medium" | "Low";
  reasons: string[];
  maxAmount: number;
}

export function calculateLoanApprovalProbabilities(
  profile: {
    businessAge: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    industry: string;
  },
  creditScore: { altScore: number; trustScore: number },
  cashflow?: { emiRiskPercent: number } | null,
): LoanApprovalResult[] {
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? profile.monthlyExpenses / profile.monthlyRevenue
      : 1;

  // Updated to use new score range (300-900 → 0-40)
  const altScoreFactor = ((creditScore.altScore - 300) / 600) * 40;
  const trustFactor = (creditScore.trustScore / 100) * 20;
  const expenseFactor = Math.max(0, (1 - expenseRatio) * 20);
  const ageFactor = Math.min(10, profile.businessAge * 2);
  let cashflowFactor = 5;
  if (cashflow) {
    if (cashflow.emiRiskPercent > 40) cashflowFactor = -20;
    else if (cashflow.emiRiskPercent > 25) cashflowFactor = -10;
    else cashflowFactor = 10;
  }

  const baseProbability = Math.round(
    altScoreFactor + trustFactor + expenseFactor + ageFactor + cashflowFactor,
  );

  const lenders: {
    id: string;
    name: string;
    type: "bank" | "nbfc" | "microfinance" | "government";
    minScore: number;
    maxAmount: number;
  }[] = [
    {
      id: "mudra",
      name: "Mudra",
      type: "government",
      minScore: 300,
      maxAmount: 1000000,
    },
    {
      id: "ujjivan",
      name: "Ujjivan",
      type: "microfinance",
      minScore: 300,
      maxAmount: 500000,
    },
    {
      id: "lendingkart",
      name: "Lendingkart",
      type: "nbfc",
      minScore: 450,
      maxAmount: 2000000,
    },
    {
      id: "bajaj",
      name: "Bajaj Finserv",
      type: "nbfc",
      minScore: 520,
      maxAmount: 3000000,
    },
    {
      id: "sbi",
      name: "SBI",
      type: "bank",
      minScore: 600,
      maxAmount: 5000000,
    },
    {
      id: "hdfc",
      name: "HDFC Bank",
      type: "bank",
      minScore: 680,
      maxAmount: 7500000,
    },
  ];

  return lenders
    .map((lender) => {
      let prob =
        creditScore.altScore < lender.minScore
          ? Math.max(5, Math.round(baseProbability * 0.3))
          : Math.max(10, baseProbability);

      prob = Math.min(95, prob);

      const tier: "High" | "Medium" | "Low" =
        prob >= 70 ? "High" : prob >= 40 ? "Medium" : "Low";

      const reasons: string[] = [];
      if (creditScore.altScore >= lender.minScore) {
        reasons.push("Alt score meets minimum threshold");
      } else {
        reasons.push(`Alt score below ${lender.minScore} minimum threshold`);
      }
      if (expenseRatio < 0.65) reasons.push("Expense ratio is favorable");
      else reasons.push("High expense ratio affects eligibility");
      if (profile.businessAge >= 2)
        reasons.push("Business age strengthens application");
      else if (profile.businessAge >= 1)
        reasons.push("Growing business shows potential");
      else reasons.push("Young business is higher risk for lenders");

      return {
        lenderId: lender.id,
        lenderName: lender.name,
        lenderType: lender.type,
        probability: prob,
        tier,
        reasons: reasons.slice(0, 3),
        maxAmount: lender.maxAmount,
      };
    })
    .sort((a, b) => b.probability - a.probability);
}

// ── Business Survival Score ─────────────────────────────────

export interface BusinessSurvivalResult {
  survival6Month: number;
  survival12Month: number;
  riskTier: "Low" | "Medium" | "High";
  keyRisks: string[];
  recommendations: string[];
  score: number;
}

export function calculateBusinessSurvivalScore(
  profile: {
    businessAge: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    industry: string;
  },
  creditScore: { altScore: number; trustScore: number },
  cashflow?: { emiRiskPercent: number } | null,
): BusinessSurvivalResult {
  const expenseRatio =
    profile.monthlyRevenue > 0
      ? profile.monthlyExpenses / profile.monthlyRevenue
      : 1;

  // Updated base to account for new score ranges
  let base = 55;
  base += ((creditScore.altScore - 300) / 600) * 25;
  base += Math.min(15, profile.businessAge * 3);
  base += Math.max(0, (1 - expenseRatio) * 15);
  base += (creditScore.trustScore / 100) * 10;

  let cashflowBonus = 5;
  if (cashflow) {
    if (cashflow.emiRiskPercent > 40) cashflowBonus = -20;
    else if (cashflow.emiRiskPercent > 25) cashflowBonus = -10;
    else cashflowBonus = 8;
  }
  base += cashflowBonus;

  const survival6Month = Math.min(98, Math.max(20, Math.round(base)));
  const survival12Month = Math.min(
    95,
    Math.max(15, Math.round(survival6Month * 0.92)),
  );
  const score = survival6Month;

  const riskTier: "Low" | "Medium" | "High" =
    survival6Month >= 70 ? "Low" : survival6Month >= 45 ? "Medium" : "High";

  const keyRisks: string[] = [];
  if (expenseRatio > 0.8)
    keyRisks.push("High expense ratio limits cash buffer");
  if (creditScore.altScore < 450)
    keyRisks.push("Low credit score increases default risk");
  if (profile.businessAge < 1)
    keyRisks.push("Young business lacks financial track record");
  if (cashflow && cashflow.emiRiskPercent > 30)
    keyRisks.push("Volatile cash flow detected");
  if (creditScore.trustScore < 40)
    keyRisks.push("Low business trust score signals instability");
  if (keyRisks.length === 0) keyRisks.push("Business fundamentals are healthy");

  const recommendations: string[] = [];
  if (expenseRatio > 0.65)
    recommendations.push(
      "Reduce operating expenses by 10–15% to improve cash runway",
    );
  if (creditScore.altScore < 600)
    recommendations.push(
      "Increase monthly revenue through new customer acquisition channels",
    );
  recommendations.push(
    "Build a 3-month emergency fund to buffer seasonal downturns",
  );
  if (recommendations.length < 3)
    recommendations.push("File GST returns consistently to build lender trust");

  return {
    survival6Month,
    survival12Month,
    riskTier,
    keyRisks,
    recommendations: recommendations.slice(0, 3),
    score,
  };
}
