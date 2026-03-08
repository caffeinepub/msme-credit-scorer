import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CheckCircle2, Search, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useT } from "../hooks/useT";
import { getAllProfiles, getAllScores, getAllUsers } from "../lib/store";
import type { BusinessProfile, CreditScore, User } from "../lib/types";

interface UserRow {
  user: User;
  profile: BusinessProfile | null;
  score: CreditScore | null;
}

export function AdminUsersPage() {
  const t = useT();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const users = getAllUsers();
    const profiles = getAllProfiles();
    const scores = getAllScores();

    const userRows: UserRow[] = users
      .filter((u) => u.role === "borrower")
      .map((user) => ({
        user,
        profile: profiles.find((p) => p.userId === user.id) ?? null,
        score: scores.find((s) => s.userId === user.id) ?? null,
      }));

    setRows(userRows);
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.user.email.toLowerCase().includes(q) ||
      r.profile?.businessName.toLowerCase().includes(q) ||
      r.profile?.location.toLowerCase().includes(q) ||
      r.score?.riskTier.toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute adminOnly>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">
                <Users className="h-6 w-6 inline mr-2 text-primary" />
                All Borrowers
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {rows.length} registered borrowers
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">User Registry</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-ocid="adminusers.search_input"
                  placeholder="Search by email, business, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-ocid="adminusers.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Business</TableHead>
                      <TableHead className="text-xs">Industry</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Risk</TableHead>
                      <TableHead className="text-xs">Stability</TableHead>
                      <TableHead className="text-xs">Verified</TableHead>
                      <TableHead className="text-xs">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground text-sm"
                        >
                          {search
                            ? "No users match your search"
                            : "No borrowers found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((row, idx) => (
                        <TableRow
                          key={row.user.id}
                          data-ocid={`adminusers.row.${idx + 1}`}
                          className="hover:bg-muted/30"
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {row.user.email}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.profile ? (
                              <div>
                                <p className="font-medium">
                                  {row.profile.businessName}
                                </p>
                                <p className="text-muted-foreground">
                                  {row.profile.location}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">
                                No profile
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.profile ? (
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {row.profile.industry.replace("_", " ")}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-display font-bold">
                            {row.score ? row.score.altScore : "—"}
                          </TableCell>
                          <TableCell>
                            {row.score ? (
                              <Badge
                                className={cn(
                                  "text-xs",
                                  row.score.riskTier === "Low"
                                    ? "score-low"
                                    : row.score.riskTier === "Medium"
                                      ? "score-medium"
                                      : "score-high",
                                )}
                              >
                                {row.score.riskTier}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.score ? (
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full"
                                    style={{
                                      width: `${row.score.stabilityScore}%`,
                                      background:
                                        row.score.stabilityScore >= 70
                                          ? "oklch(0.55 0.15 145)"
                                          : row.score.stabilityScore >= 40
                                            ? "oklch(0.72 0.18 75)"
                                            : "oklch(0.58 0.22 25)",
                                    }}
                                  />
                                </div>
                                <span>{row.score.stabilityScore}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {row.user.verified ? (
                              <div className="flex items-center gap-1 text-score-low text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t("verified")}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <XCircle className="h-3.5 w-3.5" />
                                {t("unverified")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(row.user.createdAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
