import {
  calculateAltScore,
  calculateBusinessTrustScore,
  calculateTraditionalScore,
  detectFraud,
  getRiskTier,
  getStabilityScore,
} from "./scoring";
import type {
  AppSession,
  BusinessProfile,
  CashflowData,
  CreditScore,
  Document,
  Industry,
  ScoreSnapshot,
  User,
} from "./types";

const KEYS = {
  USERS: "msme_users",
  PROFILES: "msme_profiles",
  SCORES: "msme_scores",
  CASHFLOW: "msme_cashflow",
  DOCUMENTS: "msme_documents",
  SESSION: "msme_session",
  LANGUAGE: "msme_language",
  SCORE_HISTORY: "msme_score_history",
};

// ── Helpers ──────────────────────────────────────────────────
function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function upsertById<T extends { userId: string }>(key: string, item: T): void {
  const list = load<T>(key);
  const idx = list.findIndex((x) => x.userId === item.userId);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  save(key, list);
}

// ── Score History ─────────────────────────────────────────────
export function appendScoreHistory(snapshot: ScoreSnapshot): void {
  const history = load<ScoreSnapshot>(KEYS.SCORE_HISTORY);
  history.push(snapshot);
  // Keep max 50 snapshots per user
  const userHistory = history.filter((h) => h.userId === snapshot.userId);
  const otherHistory = history.filter((h) => h.userId !== snapshot.userId);
  const trimmed = userHistory.slice(-50);
  save(KEYS.SCORE_HISTORY, [...otherHistory, ...trimmed]);
}

export function getScoreHistory(userId: string): ScoreSnapshot[] {
  return load<ScoreSnapshot>(KEYS.SCORE_HISTORY)
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ── Seed data ────────────────────────────────────────────────
export function seedIfEmpty(): void {
  const users = load<User>(KEYS.USERS);
  if (users.length > 0) return;

  const mockUsers: User[] = [
    {
      id: "user_1",
      email: "borrower1@msme.com",
      password: "password123",
      role: "borrower",
      verified: true,
      createdAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "user_2",
      email: "ramesh.patel@msme.com",
      password: "password123",
      role: "borrower",
      verified: true,
      createdAt: "2025-02-20T10:00:00Z",
    },
    {
      id: "user_3",
      email: "priya.shah@msme.com",
      password: "password123",
      role: "borrower",
      verified: false,
      createdAt: "2025-03-10T10:00:00Z",
    },
    {
      id: "user_4",
      email: "admin@msme.com",
      password: "admin123",
      role: "admin",
      verified: true,
      createdAt: "2024-12-01T10:00:00Z",
    },
  ];
  save(KEYS.USERS, mockUsers);

  const mockProfiles: BusinessProfile[] = [
    {
      userId: "user_1",
      businessName: "Sunrise Textiles",
      gstNumber: "24AAACS7072B1Z6",
      businessAge: 8,
      industry: "textile" as Industry,
      location: "Surat, Gujarat",
      monthlyRevenue: 850000,
      monthlyExpenses: 510000,
      updatedAt: "2025-06-01T10:00:00Z",
    },
    {
      userId: "user_2",
      businessName: "Patel Kirana Store",
      gstNumber: "24BBBCS1234C1Z5",
      businessAge: 12,
      industry: "kirana" as Industry,
      location: "Ahmedabad, Gujarat",
      monthlyRevenue: 320000,
      monthlyExpenses: 180000,
      updatedAt: "2025-06-15T10:00:00Z",
    },
    {
      userId: "user_3",
      businessName: "Shah Handicrafts",
      gstNumber: "24CCCCS5678D1Z4",
      businessAge: 3,
      industry: "handicrafts" as Industry,
      location: "Rajkot, Gujarat",
      monthlyRevenue: 180000,
      monthlyExpenses: 155000,
      updatedAt: "2025-05-20T10:00:00Z",
    },
  ];
  save(KEYS.PROFILES, mockProfiles);

  // Calculate and save scores + history for each profile
  const historyDates = [
    "2025-01-01T00:00:00Z",
    "2025-02-01T00:00:00Z",
    "2025-03-01T00:00:00Z",
    "2025-04-01T00:00:00Z",
    "2025-05-01T00:00:00Z",
    "2025-06-01T00:00:00Z",
  ];

  for (const profile of mockProfiles) {
    const altScore = calculateAltScore({
      monthlyRevenue: profile.monthlyRevenue,
      businessAge: profile.businessAge,
      monthlyExpenses: profile.monthlyExpenses,
      industry: profile.industry,
    });
    const stability = getStabilityScore(
      profile.monthlyRevenue,
      profile.monthlyExpenses,
    );
    const trustScore = calculateBusinessTrustScore({
      businessAge: profile.businessAge,
      stabilityScore: stability,
      monthlyRevenue: profile.monthlyRevenue,
      monthlyExpenses: profile.monthlyExpenses,
      industry: profile.industry,
    });

    const creditScore: CreditScore = {
      userId: profile.userId,
      altScore,
      traditionalScore: null,
      trustScore,
      riskTier: getRiskTier(altScore),
      stabilityScore: stability,
      fraudFlag: detectFraud({
        monthlyRevenue: profile.monthlyRevenue,
        businessAge: profile.businessAge,
        gstNumber: profile.gstNumber,
      }),
      calculatedAt: new Date().toISOString(),
    };
    upsertById(KEYS.SCORES, creditScore);

    // Seed historical snapshots with slight variation
    const variations = [-30, -20, -15, -5, 5, 0];
    for (let i = 0; i < historyDates.length; i++) {
      const variance = variations[i] ?? 0;
      const snap: ScoreSnapshot = {
        userId: profile.userId,
        date: historyDates[i],
        altScore: Math.min(900, Math.max(300, altScore + variance)),
        trustScore: Math.min(
          100,
          Math.max(0, trustScore + Math.round(variance / 10)),
        ),
        traditionalScore: null,
        riskTier: getRiskTier(
          Math.min(900, Math.max(300, altScore + variance)),
        ),
      };
      appendScoreHistory(snap);
    }
  }

  const mockCashflow: CashflowData[] = [
    {
      userId: "user_1",
      month1Revenue: 800000,
      month1Expense: 480000,
      month2Revenue: 870000,
      month2Expense: 530000,
      month3Revenue: 850000,
      month3Expense: 510000,
      predictedSurplus: 330000,
      emiRiskPercent: 0,
      updatedAt: "2025-06-01T10:00:00Z",
    },
    {
      userId: "user_3",
      month1Revenue: 220000,
      month1Expense: 200000,
      month2Revenue: 175000,
      month2Expense: 160000,
      month3Revenue: 180000,
      month3Expense: 155000,
      predictedSurplus: 26667,
      emiRiskPercent: 35,
      updatedAt: "2025-05-20T10:00:00Z",
    },
  ];
  save(KEYS.CASHFLOW, mockCashflow);
}

// ── Auth ─────────────────────────────────────────────────────
export function signUp(
  email: string,
  password: string,
  role: "borrower" | "admin",
): { success: boolean; error?: string; user?: User } {
  const users = load<User>(KEYS.USERS);
  if (users.find((u) => u.email === email)) {
    return { success: false, error: "Email already registered" };
  }
  const user: User = {
    id: `user_${Date.now()}`,
    email,
    password,
    role,
    verified: false,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  save(KEYS.USERS, users);
  return { success: true, user };
}

export function login(
  email: string,
  password: string,
): { success: boolean; error?: string; user?: User } {
  const users = load<User>(KEYS.USERS);
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }
  const session: AppSession = {
    user,
    token: `jwt_mock_${Date.now()}`,
  };
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  return { success: true, user };
}

export function logout(): void {
  localStorage.removeItem(KEYS.SESSION);
}

export function getSession(): AppSession | null {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SESSION) ?? "null");
  } catch {
    return null;
  }
}

// ── Business Profile ─────────────────────────────────────────
export function getProfile(userId: string): BusinessProfile | null {
  return (
    load<BusinessProfile>(KEYS.PROFILES).find((p) => p.userId === userId) ??
    null
  );
}

export function saveProfile(profile: BusinessProfile): void {
  upsertById(KEYS.PROFILES, profile);

  const altScore = calculateAltScore({
    monthlyRevenue: profile.monthlyRevenue,
    businessAge: profile.businessAge,
    monthlyExpenses: profile.monthlyExpenses,
    industry: profile.industry,
  });
  const stability = getStabilityScore(
    profile.monthlyRevenue,
    profile.monthlyExpenses,
  );
  const trustScore = calculateBusinessTrustScore({
    businessAge: profile.businessAge,
    stabilityScore: stability,
    monthlyRevenue: profile.monthlyRevenue,
    monthlyExpenses: profile.monthlyExpenses,
    industry: profile.industry,
  });

  const cashflow = getCashflow(profile.userId);
  const cashflowConsistency = cashflow
    ? (() => {
        const revenues = [
          cashflow.month1Revenue,
          cashflow.month2Revenue,
          cashflow.month3Revenue,
        ];
        const avg = revenues.reduce((a, b) => a + b, 0) / 3;
        if (avg <= 0) return 50;
        const variance =
          revenues.reduce((sum, r) => sum + (r - avg) ** 2, 0) / 3;
        const cv = Math.sqrt(variance) / avg;
        return Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
      })()
    : null;

  const fraudResult = detectFraud({
    monthlyRevenue: profile.monthlyRevenue,
    businessAge: profile.businessAge,
    gstNumber: profile.gstNumber,
  });

  const traditionalScore = calculateTraditionalScore({
    monthlyRevenue: profile.monthlyRevenue,
    businessAge: profile.businessAge,
    monthlyExpenses: profile.monthlyExpenses,
    industry: profile.industry,
    cashflowConsistency,
    hasFraudFlag: !!fraudResult,
  });

  const creditScore: CreditScore = {
    userId: profile.userId,
    altScore,
    traditionalScore,
    trustScore,
    riskTier: getRiskTier(altScore),
    stabilityScore: stability,
    fraudFlag: fraudResult,
    calculatedAt: new Date().toISOString(),
  };
  upsertById(KEYS.SCORES, creditScore);

  // Append to score history
  appendScoreHistory({
    userId: profile.userId,
    date: new Date().toISOString(),
    altScore,
    trustScore,
    traditionalScore,
    riskTier: getRiskTier(altScore),
  });
}

export function saveTraditionalScore(userId: string, score: number): void {
  const existing = getCreditScore(userId);
  if (!existing) return;
  const updated: CreditScore = { ...existing, traditionalScore: score };
  upsertById(KEYS.SCORES, updated);

  // Append to history when traditional score changes
  appendScoreHistory({
    userId,
    date: new Date().toISOString(),
    altScore: existing.altScore,
    trustScore: existing.trustScore,
    traditionalScore: score,
    riskTier: existing.riskTier,
  });
}

// ── Credit Score ─────────────────────────────────────────────
export function getCreditScore(userId: string): CreditScore | null {
  return (
    load<CreditScore>(KEYS.SCORES).find((s) => s.userId === userId) ?? null
  );
}

// ── Cashflow ─────────────────────────────────────────────────
export function getCashflow(userId: string): CashflowData | null {
  return (
    load<CashflowData>(KEYS.CASHFLOW).find((c) => c.userId === userId) ?? null
  );
}

export function saveCashflow(data: CashflowData): void {
  upsertById(KEYS.CASHFLOW, data);
}

// ── Documents ────────────────────────────────────────────────
export function getDocuments(userId: string): Document[] {
  return load<Document>(KEYS.DOCUMENTS).filter((d) => d.userId === userId);
}

export function addDocument(doc: Document): void {
  const docs = load<Document>(KEYS.DOCUMENTS);
  docs.push(doc);
  save(KEYS.DOCUMENTS, docs);
}

export function deleteDocument(id: string): void {
  const docs = load<Document>(KEYS.DOCUMENTS).filter((d) => d.id !== id);
  save(KEYS.DOCUMENTS, docs);
}

// ── Admin ─────────────────────────────────────────────────────
export function getAllUsers(): User[] {
  return load<User>(KEYS.USERS);
}

export function getAllProfiles(): BusinessProfile[] {
  return load<BusinessProfile>(KEYS.PROFILES);
}

export function getAllScores(): CreditScore[] {
  return load<CreditScore>(KEYS.SCORES);
}

export function getFraudAlerts(): Array<{
  userId: string;
  email: string;
  businessName: string;
  reason: string;
}> {
  const scores = getAllScores().filter((s) => s.fraudFlag != null);
  const users = getAllUsers();
  const profiles = getAllProfiles();

  return scores.map((s) => ({
    userId: s.userId,
    email: users.find((u) => u.id === s.userId)?.email ?? "Unknown",
    businessName:
      profiles.find((p) => p.userId === s.userId)?.businessName ?? "Unknown",
    reason: s.fraudFlag!,
  }));
}

export function getLanguage(): string {
  return localStorage.getItem(KEYS.LANGUAGE) ?? "en";
}

export function setLanguage(lang: string): void {
  localStorage.setItem(KEYS.LANGUAGE, lang);
}
