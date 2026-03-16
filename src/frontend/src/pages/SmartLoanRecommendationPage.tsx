import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, Sparkles } from "lucide-react";
import { PageLayout } from "../components/PageLayout";

const loanOffers = [
  {
    bank: "SBI MSME Loan",
    amount: "₹12,50,000",
    rate: "11.5% p.a.",
    tenure: "36 months",
    emi: "₹41,200",
    match: 96,
    recommended: true,
  },
  {
    bank: "HDFC Business Loan",
    amount: "₹10,00,000",
    rate: "13.0% p.a.",
    tenure: "24 months",
    emi: "₹47,500",
    match: 82,
    recommended: false,
  },
  {
    bank: "Bajaj Finserv MSME",
    amount: "₹15,00,000",
    rate: "14.5% p.a.",
    tenure: "48 months",
    emi: "₹41,900",
    match: 74,
    recommended: false,
  },
];

const actionSteps = [
  {
    id: "s1",
    step: "1",
    text: "Complete GST filing for last 3 quarters",
    priority: "High",
  },
  {
    id: "s2",
    step: "2",
    text: "Upload 6-month bank statement",
    priority: "High",
  },
  {
    id: "s3",
    step: "3",
    text: "Reduce existing credit utilisation below 40%",
    priority: "Medium",
  },
  {
    id: "s4",
    step: "4",
    text: "Maintain consistent monthly revenue above ₹2L",
    priority: "Medium",
  },
  {
    id: "s5",
    step: "5",
    text: "Submit business registration certificate",
    priority: "Low",
  },
];

export function SmartLoanRecommendationPage() {
  return (
    <PageLayout>
      <div className="space-y-6" data-ocid="loan-rec.page">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Smart Loan Recommendation Engine
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-curated loan options based on your business financial profile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Recommended Loan Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">₹12,50,000</p>
              <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
                AI Confidence: 96%
              </Badge>
              <p className="text-xs text-muted-foreground mt-3">
                Based on your revenue ₹2.4L/mo, expense ratio 58%, and credit
                score 672
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Best EMI Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  ₹41,800
                  <span className="text-base font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  36 months @ 12.5% p.a.
                </p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total Repayment</span>
                  <span className="font-medium">₹15,04,800</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Interest</span>
                  <span className="font-medium">₹2,54,800</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee</span>
                  <span className="font-medium">₹12,500</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Repayment Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>EMI to Income Ratio</span>
                  <span className="font-medium text-emerald-600">17.4%</span>
                </div>
                <Progress value={17} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Ideal range: 15–30% — You are well within safe limits
                </p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Business Repayment Score</span>
                  <span className="font-medium text-emerald-600">84/100</span>
                </div>
                <Progress value={84} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Curated Loan Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loanOffers.map((offer, i) => (
              <Card
                key={offer.bank}
                className={
                  offer.recommended
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : ""
                }
                data-ocid={`loan-rec.offer.card.${i + 1}`}
              >
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold">
                        {offer.bank}
                      </span>
                    </div>
                    {offer.recommended && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        Best Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{offer.amount}</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <p className="text-muted-foreground">Rate</p>
                      <p className="font-medium">{offer.rate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tenure</p>
                      <p className="font-medium">{offer.tenure}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">EMI</p>
                      <p className="font-medium">{offer.emi}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Match</p>
                      <p className="font-medium text-emerald-600">
                        {offer.match}%
                      </p>
                    </div>
                  </div>
                  <Progress value={offer.match} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recommended Action Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {actionSteps.map((action, i) => (
              <div
                key={action.id}
                className="flex items-center gap-3 p-3 rounded-md border border-border"
                data-ocid={`loan-rec.action.item.${i + 1}`}
              >
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {action.step}
                </div>
                <p className="text-xs flex-1">{action.text}</p>
                <Badge
                  className={`text-xs shrink-0 ${action.priority === "High" ? "bg-red-100 text-red-700" : action.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}
                >
                  {action.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
