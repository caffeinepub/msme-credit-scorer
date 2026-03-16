import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ScanLine,
  Shield,
} from "lucide-react";
import { PageLayout } from "../components/PageLayout";

const flaggedTxns = [
  {
    date: "12 Mar 2026",
    amount: "₹84,000",
    type: "NEFT Transfer",
    status: "Flagged",
    reason: "Unusual spike",
  },
  {
    date: "08 Mar 2026",
    amount: "₹1,12,000",
    type: "UPI Payment",
    status: "Flagged",
    reason: "Off-hours transaction",
  },
  {
    date: "02 Mar 2026",
    amount: "₹23,500",
    type: "GST Payment",
    status: "Cleared",
    reason: "",
  },
];

const fraudSignals = [
  {
    signal: "Revenue spike >3x in single month",
    severity: "High",
    desc: "Oct 2025 revenue was 4.2x previous month",
  },
  {
    signal: "Off-hours UPI transaction (2:15 AM)",
    severity: "Medium",
    desc: "Unusual transaction time detected",
  },
  {
    signal: "New merchant not seen in 6 months",
    severity: "Low",
    desc: "First transaction with this vendor",
  },
];

const scanHistory = [
  {
    date: "15 Mar 2026 09:00",
    result: "2 anomalies detected",
    status: "amber",
  },
  { date: "01 Mar 2026 10:30", result: "All clear", status: "green" },
  { date: "15 Feb 2026 08:45", result: "All clear", status: "green" },
];

const detectionModules = [
  {
    title: "GST Verification",
    status: "Verified",
    icon: CheckCircle2,
    color: "emerald",
    detail: "GSTIN 24AABCT1332L1ZD — Active",
  },
  {
    title: "Duplicate Applications",
    status: "No Duplicates",
    icon: CheckCircle2,
    color: "emerald",
    detail: "No matching records found",
  },
  {
    title: "Transaction Anomalies",
    status: "2 Flagged",
    icon: AlertTriangle,
    color: "amber",
    detail: "2 unusual patterns detected",
  },
  {
    title: "Document Authenticity",
    status: "Authentic",
    icon: CheckCircle2,
    color: "emerald",
    detail: "All documents verified",
  },
];

export function AIFraudDetectionPage() {
  return (
    <PageLayout>
      <div className="space-y-6" data-ocid="fraud.page">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              AI Fraud Detection System
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time fraud monitoring and anomaly detection powered by AI
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-sm px-4 py-2">
            <Shield className="h-4 w-4 mr-1" />
            Low Risk
          </Badge>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">
                Overall Fraud Risk: Low
              </p>
              <p className="text-sm text-emerald-700">
                Your account passed 14/16 fraud checks. 2 minor anomalies
                flagged for review.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {detectionModules.map((mod) => (
            <Card key={mod.title} data-ocid="fraud.module.card">
              <CardContent className="pt-5 flex flex-col gap-2">
                <mod.icon className={`h-6 w-6 text-${mod.color}-600`} />
                <p className="text-xs text-muted-foreground">{mod.title}</p>
                <Badge
                  className={`text-xs w-fit bg-${mod.color}-100 text-${mod.color}-700 border-${mod.color}-300`}
                >
                  {mod.status}
                </Badge>
                <p className="text-xs text-muted-foreground">{mod.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Flagged Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table data-ocid="fraud.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedTxns.map((txn, i) => (
                  <TableRow
                    key={txn.date}
                    data-ocid={`fraud.table.row.${i + 1}`}
                  >
                    <TableCell className="text-xs">{txn.date}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {txn.amount}
                    </TableCell>
                    <TableCell className="text-xs">{txn.type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {txn.reason}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          txn.status === "Flagged"
                            ? "bg-amber-100 text-amber-700 border-amber-300 text-xs"
                            : "bg-emerald-100 text-emerald-700 text-xs"
                        }
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Fraud Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fraudSignals.map((sig, i) => (
                <div
                  key={sig.signal}
                  className="flex items-start gap-3 p-3 rounded-md border border-border"
                  data-ocid={`fraud.signal.item.${i + 1}`}
                >
                  <AlertTriangle
                    className={`h-4 w-4 shrink-0 mt-0.5 ${sig.severity === "High" ? "text-red-500" : sig.severity === "Medium" ? "text-amber-500" : "text-sky-500"}`}
                  />
                  <div>
                    <p className="text-xs font-medium">{sig.signal}</p>
                    <p className="text-xs text-muted-foreground">{sig.desc}</p>
                  </div>
                  <Badge
                    className={`text-xs shrink-0 ${sig.severity === "High" ? "bg-red-100 text-red-700" : sig.severity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}
                  >
                    {sig.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Recent Fraud Scan History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanHistory.map((scan, i) => (
                <div
                  key={scan.date}
                  className="flex items-center gap-3 p-3 rounded-md border border-border"
                  data-ocid={`fraud.scan.item.${i + 1}`}
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{scan.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {scan.result}
                    </p>
                  </div>
                  <ScanLine
                    className={`h-4 w-4 ${scan.status === "green" ? "text-emerald-500" : "text-amber-500"}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
