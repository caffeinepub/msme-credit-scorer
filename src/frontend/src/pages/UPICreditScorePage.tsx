import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageLayout } from "../components/PageLayout";

const monthlyData = [
  { month: "Oct", txns: 38 },
  { month: "Nov", txns: 42 },
  { month: "Dec", txns: 51 },
  { month: "Jan", txns: 47 },
  { month: "Feb", txns: 55 },
  { month: "Mar", txns: 63 },
];

const merchantCategories = [
  { name: "Utilities", share: 28, color: "#0ea5e9" },
  { name: "Grocery", share: 24, color: "#22c55e" },
  { name: "Fuel", share: 18, color: "#f59e0b" },
  { name: "Wholesale", share: 16, color: "#8b5cf6" },
  { name: "Restaurant", share: 14, color: "#ef4444" },
];

const riskFactors = [
  {
    label: "Payment Regularity",
    status: "green",
    text: "Consistent payments last 6 months",
  },
  {
    label: "Merchant Diversity",
    status: "amber",
    text: "Moderate category diversity",
  },
  {
    label: "Avg Transaction Value",
    status: "green",
    text: "Healthy range ₹1,200–₹8,500",
  },
  {
    label: "Failed Transactions",
    status: "green",
    text: "Only 1.2% failure rate",
  },
  {
    label: "Refund Rate",
    status: "amber",
    text: "3.4% refund rate — slightly elevated",
  },
];

const statusColor: Record<string, string> = {
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
  amber: "text-amber-600 bg-amber-50 border-amber-200",
  red: "text-red-600 bg-red-50 border-red-200",
};

export function UPICreditScorePage() {
  const upiScore = 72;
  const arc = (upiScore / 100) * 180;

  return (
    <PageLayout>
      <div className="space-y-6" data-ocid="upi.page">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            UPI Credit Scoring
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-powered creditworthiness analysis based on your UPI transaction
            history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                UPI Credit Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-28 overflow-hidden">
                <svg
                  viewBox="0 0 200 110"
                  className="w-full"
                  role="img"
                  aria-label={`UPI Credit Score: ${upiScore} out of 100`}
                >
                  <title>UPI Credit Score Gauge</title>
                  <path
                    d="M 10 100 A 90 90 0 0 1 190 100"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 100 A 90 90 0 0 1 190 100"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${(arc / 180) * 283} 283`}
                  />
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="bold"
                    fill="currentColor"
                    className="fill-foreground"
                  >
                    {upiScore}
                  </text>
                  <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#94a3b8"
                  >
                    /100
                  </text>
                </svg>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-sm px-4 py-1">
                ✓ Good Creditworthiness
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                Based on 296 UPI transactions across 6 months
              </p>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              {
                label: "Payment Consistency",
                value: "85%",
                sub: "Payments on schedule",
                color: "emerald",
              },
              {
                label: "Merchant Diversity",
                value: "64%",
                sub: "Category spread",
                color: "sky",
              },
              {
                label: "Avg Monthly Txns",
                value: "47",
                sub: "Transactions/month",
                color: "violet",
              },
              {
                label: "On-time Payments",
                value: "92%",
                sub: "Success rate",
                color: "emerald",
              },
            ].map((kpi) => (
              <Card key={kpi.label} data-ocid="upi.kpi.card">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p
                    className={`text-3xl font-bold mt-1 text-${kpi.color}-600`}
                  >
                    {kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpi.sub}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Monthly UPI Transaction Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="txns" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell
                      key={entry.month}
                      fill={
                        i === monthlyData.length - 1 ? "#0ea5e9" : "#bae6fd"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Top Merchant Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {merchantCategories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.share}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.share}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Risk Factor Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {riskFactors.map((rf) => (
                <div
                  key={rf.label}
                  className={`flex items-start gap-3 p-2 rounded-md border text-xs ${statusColor[rf.status]}`}
                  data-ocid="upi.risk.item"
                >
                  <span className="font-semibold shrink-0">{rf.label}</span>
                  <span className="text-right flex-1">{rf.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
