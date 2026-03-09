import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building,
  CheckCircle2,
  Clock,
  Lock,
  Percent,
  Store,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { formatCurrency, getLoanProducts } from "../lib/scoring";
import { getCreditScore, getProfile } from "../lib/store";
import type { BusinessProfile, CreditScore, LoanProduct } from "../lib/types";

const lenderTypeIcon: Record<LoanProduct["lenderType"], React.ReactNode> = {
  bank: <Building className="h-4 w-4" />,
  nbfc: <TrendingUp className="h-4 w-4" />,
  microfinance: <Store className="h-4 w-4" />,
  government: <Banknote className="h-4 w-4" />,
};

const lenderTypeLabel: Record<LoanProduct["lenderType"], string> = {
  bank: "Bank",
  nbfc: "NBFC",
  microfinance: "Microfinance",
  government: "Government Scheme",
};

const lenderTypeColor: Record<LoanProduct["lenderType"], string> = {
  bank: "border-blue-500/30 bg-blue-500/5 text-blue-600",
  nbfc: "border-purple-500/30 bg-purple-500/5 text-purple-600",
  microfinance: "border-orange-500/30 bg-orange-500/5 text-orange-600",
  government: "border-score-low/30 bg-score-low-bg text-score-low",
};

function LoanCard({ product, index }: { product: LoanProduct; index: number }) {
  return (
    <Card
      data-ocid={`loanmarketplace.loan.item.${index + 1}`}
      className={`transition-all ${
        product.eligible
          ? "border-primary/20 hover:border-primary/40 hover:shadow-sm"
          : "opacity-60"
      }`}
    >
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${
                  lenderTypeColor[product.lenderType]
                }`}
              >
                {lenderTypeIcon[product.lenderType]}
                {lenderTypeLabel[product.lenderType]}
              </span>
            </div>
            <CardTitle className="text-base font-display">
              {product.lender}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {product.productName}
            </p>
          </div>
          <Badge
            className={`shrink-0 text-xs px-2.5 py-1 border font-semibold ${
              product.eligible ? "score-low" : "score-high"
            }`}
          >
            {product.eligible ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Eligible
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-5 space-y-4">
        {/* Loan stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" />
              <span className="text-xs">Max Amount</span>
            </div>
            <p className="font-display font-bold text-sm">
              {formatCurrency(product.maxAmount)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Percent className="h-3.5 w-3.5" />
              <span className="text-xs">Rate</span>
            </div>
            <p className="font-display font-bold text-sm">
              {product.interestRate}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Tenure</span>
            </div>
            <p className="font-display font-bold text-sm">{product.tenure}</p>
          </div>
        </div>

        {/* Eligibility note */}
        <div
          className={`rounded-lg p-3 text-xs ${
            product.eligible
              ? "bg-score-low-bg border border-score-low/20 text-score-low"
              : "bg-score-high-bg border border-score-high/20 text-score-high"
          }`}
        >
          {product.eligibilityNote}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5">
          {product.features.map((f) => (
            <span
              key={f}
              className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LoanMarketplacePage() {
  const { user } = useAppContext();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [filter, setFilter] = useState<"all" | "eligible">("eligible");

  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.id);
    const s = getCreditScore(user.id);
    setProfile(p);
    setCreditScore(s);
    if (p && s) {
      setProducts(getLoanProducts(s, p));
    }
  }, [user]);

  const eligibleCount = products.filter((p) => p.eligible).length;
  const displayed =
    filter === "eligible" ? products.filter((p) => p.eligible) : products;

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up max-w-3xl mx-auto">
          {/* Back */}
          <Link to="/dashboard">
            <button
              data-ocid="loanmarketplace.back.button"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Loan Marketplace
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Funding opportunities based on your credit profile
              </p>
            </div>
          </div>

          {/* Empty state */}
          {!profile && (
            <Card
              data-ocid="loanmarketplace.empty_state"
              className="border-dashed border-2"
            >
              <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
                <Banknote className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Complete your profile first</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your credit profile determines loan eligibility
                  </p>
                </div>
                <Link to="/profile">
                  <button
                    data-ocid="loanmarketplace.profile.button"
                    className="text-sm text-primary hover:underline"
                    type="button"
                  >
                    Set up your profile →
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Summary bar */}
          {creditScore && (
            <Card
              data-ocid="loanmarketplace.summary.card"
              className="bg-muted/40"
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Your Alt Score
                      </p>
                      <p className="font-display font-bold text-2xl">
                        {creditScore.altScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Eligible Products
                      </p>
                      <p className="font-display font-bold text-2xl text-score-low">
                        {eligibleCount} / {products.length}
                      </p>
                    </div>
                    {creditScore.riskTier === "Low" && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Max Estimated Loan
                        </p>
                        <p className="font-display font-bold text-2xl">
                          {profile
                            ? formatCurrency(profile.monthlyRevenue * 18)
                            : "—"}
                        </p>
                      </div>
                    )}
                  </div>
                  {creditScore.altScore < 650 && (
                    <Link to="/score-breakdown">
                      <button
                        data-ocid="loanmarketplace.improve.button"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                        type="button"
                      >
                        Improve score for more options{" "}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter tabs */}
          {products.length > 0 && (
            <div data-ocid="loanmarketplace.filter.tab" className="flex gap-2">
              {(["eligible", "all"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {f === "eligible"
                    ? `Eligible (${eligibleCount})`
                    : `All Products (${products.length})`}
                </button>
              ))}
            </div>
          )}

          {/* Loan cards */}
          {displayed.length > 0 && (
            <div data-ocid="loanmarketplace.loans.list" className="space-y-4">
              {displayed.map((product, i) => (
                <LoanCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}

          {displayed.length === 0 && products.length > 0 && (
            <Card data-ocid="loanmarketplace.eligible.empty_state">
              <CardContent className="py-10 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">No eligible products yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Improve your alt score to unlock loan products
                </p>
                <Link to="/score-breakdown">
                  <button
                    data-ocid="loanmarketplace.improve2.button"
                    className="mt-3 text-sm text-primary hover:underline"
                    type="button"
                  >
                    View Credit Improvement Plan →
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center pb-2">
            Loan amounts and rates are indicative. Actual approval subject to
            lender verification.
          </p>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
