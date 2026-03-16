import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageLayout } from "../components/PageLayout";

const trendData = [
  { month: "Oct", revenue: 210000, expense: 128000 },
  { month: "Nov", revenue: 195000, expense: 118000 },
  { month: "Dec", revenue: 245000, expense: 142000 },
  { month: "Jan", revenue: 228000, expense: 135000 },
  { month: "Feb", revenue: 262000, expense: 148000 },
  { month: "Mar", revenue: 240000, expense: 139000 },
];

const expenseBreakdown = [
  { name: "Salaries", value: 42, color: "#0ea5e9" },
  { name: "Raw Material", value: 28, color: "#8b5cf6" },
  { name: "Rent", value: 16, color: "#f59e0b" },
  { name: "Other", value: 14, color: "#94a3b8" },
];

const kpiItems = [
  { label: "Monthly Revenue", value: "₹2,40,000", change: "+8.4%", up: true },
  { label: "Monthly Expenses", value: "₹1,39,000", change: "-3.2%", up: false },
  { label: "Net Profit", value: "₹1,01,000", change: "+14.3%", up: true },
  { label: "Growth Rate", value: "14.3%", change: "+2.1pp", up: true },
];

const benchmarks = [
  { metric: "Revenue Growth", yours: "14.3%", industry: "8.5%" },
  { metric: "Expense Ratio", yours: "58%", industry: "62%" },
  { metric: "Net Profit Margin", yours: "42%", industry: "38%" },
  { metric: "Loan Repayment Rate", yours: "94%", industry: "88%" },
  { metric: "Credit Utilisation", yours: "48%", industry: "55%" },
];

export function MSMEHealthAnalyticsPage() {
  return (
    <PageLayout>
      <div className="space-y-6" data-ocid="health.page">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              MSME Business Health Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Comprehensive financial health overview and growth analytics
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-sm px-4 py-2">
            Eligible up to ₹15L
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiItems.map((kpi, i) => (
            <Card key={kpi.label} data-ocid={`health.kpi.card.${i + 1}`}>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {kpi.value}
                </p>
                <p
                  className={`text-xs mt-1 font-medium ${kpi.up ? "text-emerald-600" : "text-red-500"}`}
                >
                  {kpi.change} vs last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Revenue vs Expense Trend (6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Expense"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {expenseBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {expenseBreakdown.map((e) => (
                  <div
                    key={e.name}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: e.color }}
                    />
                    <span className="text-muted-foreground">
                      {e.name} {e.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Business Growth Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-foreground">
                78
                <span className="text-base font-normal text-muted-foreground">
                  /100
                </span>
              </span>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                Strong Growth
              </Badge>
            </div>
            <Progress value={78} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Your business is growing above industry average. Keep maintaining
              consistent revenue and controlled expenses.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Industry Benchmark Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table data-ocid="health.benchmark.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Your Business</TableHead>
                  <TableHead>Industry Avg</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.map((b, i) => (
                  <TableRow
                    key={b.metric}
                    data-ocid={`health.benchmark.row.${i + 1}`}
                  >
                    <TableCell className="text-xs font-medium">
                      {b.metric}
                    </TableCell>
                    <TableCell className="text-xs">{b.yours}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.industry}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        Above Avg
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
