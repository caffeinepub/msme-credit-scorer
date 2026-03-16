import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageLayout } from "../components/PageLayout";

const warningTrendData = [
  { month: "Jan", risk: 35 },
  { month: "Feb", risk: 42 },
  { month: "Mar (now)", risk: 38 },
];

const warningCards = [
  {
    label: "Cashflow Stress",
    level: "Low",
    score: 22,
    color: "emerald",
    desc: "Monthly cashflow is stable",
  },
  {
    label: "Revenue Volatility",
    level: "Medium",
    score: 54,
    color: "amber",
    desc: "Month-on-month variation 18%",
  },
  {
    label: "Debt Burden",
    level: "Low",
    score: 28,
    color: "emerald",
    desc: "Total obligations 31% of revenue",
  },
  {
    label: "Seasonal Risk",
    level: "Medium",
    score: 48,
    color: "amber",
    desc: "Q3 dip likely based on past data",
  },
];

const recommendedActions = [
  {
    id: "ra1",
    text: "Build 2-month emergency cashflow reserve",
    priority: "High",
  },
  {
    id: "ra2",
    text: "Avoid taking new credit in next 60 days",
    priority: "High",
  },
  {
    id: "ra3",
    text: "Negotiate 15-day extended payment terms with suppliers",
    priority: "Medium",
  },
  {
    id: "ra4",
    text: "Plan for seasonal demand in Q3 by reducing fixed costs",
    priority: "Medium",
  },
  {
    id: "ra5",
    text: "Automate EMI payments to avoid late fees",
    priority: "Low",
  },
];

export function RepaymentRiskMonitorPage() {
  const repaymentScore = 78;

  return (
    <PageLayout>
      <div className="space-y-6" data-ocid="risk-monitor.page">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Early Warning Repayment Risk Monitor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Predictive analytics to identify repayment risks before they occur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Repayment Probability Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative w-40 h-24 mx-auto overflow-hidden">
                <svg
                  viewBox="0 0 200 110"
                  className="w-full"
                  role="img"
                  aria-label={`Repayment score: ${repaymentScore}%`}
                >
                  <title>Repayment Probability Score Gauge</title>
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
                    stroke="#22c55e"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${(repaymentScore / 100) * 283} 283`}
                  />
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="bold"
                    className="fill-foreground"
                    fill="currentColor"
                  >
                    {repaymentScore}%
                  </text>
                </svg>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-sm px-4 py-1 mx-auto">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Moderate Risk
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                78% probability of on-time repayment based on current financial
                signals
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Early Warning Trend (Last 3 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={warningTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    name="Risk Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {warningCards.map((w, i) => (
            <Card
              key={w.label}
              data-ocid={`risk-monitor.warning.card.${i + 1}`}
            >
              <CardContent className="pt-5 space-y-2">
                <p className="text-xs text-muted-foreground">{w.label}</p>
                <Badge
                  className={`text-xs bg-${w.color}-100 text-${w.color}-700 border-${w.color}-300`}
                >
                  {w.level}
                </Badge>
                <Progress value={w.score} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{w.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Next EMI Prediction & Risk Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Next EMI Due</p>
                  <p className="font-semibold text-lg">₹41,800</p>
                  <p className="text-xs text-muted-foreground">Apr 5, 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Payment Risk</p>
                  <Badge className="bg-emerald-100 text-emerald-700">Low</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">
                    30-Day Cashflow Forecast
                  </p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <p className="font-semibold">₹1,04,000 surplus</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Risk Trend</p>
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">
                      Improving
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendedActions.map((action, i) => (
                <div
                  key={action.id}
                  className="flex items-center gap-3 p-2 rounded-md border border-border"
                  data-ocid={`risk-monitor.action.item.${i + 1}`}
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
      </div>
    </PageLayout>
  );
}
