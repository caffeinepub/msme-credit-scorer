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
import { Link } from "@tanstack/react-router";
import { ArrowLeft, LineChart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { getScoreHistory } from "../lib/store";
import type { ScoreSnapshot } from "../lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

interface TooltipState {
  x: number;
  y: number;
  snap: ScoreSnapshot;
  visible: boolean;
}

function ScoreLineChart({ history }: { history: ScoreSnapshot[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0,
    y: 0,
    snap: history[0],
    visible: false,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 800;
  const H = 280;
  const PADDING = { top: 20, right: 30, bottom: 50, left: 60 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const minScore = 300;
  const maxScore = 900;
  const scoreRange = maxScore - minScore;

  // Scale trust score (0-100) to 300-900 range for visual alignment
  const scaleTrust = (v: number) => 300 + (v / 100) * 600;

  const xOf = (i: number) => PADDING.left + (i / (history.length - 1)) * chartW;
  const yOf = (score: number) =>
    PADDING.top + chartH - ((score - minScore) / scoreRange) * chartH;

  const makePolyline = (values: number[]) =>
    values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");

  const altPts = history.map((h) => h.altScore);
  const trustPts = history.map((h) => scaleTrust(h.trustScore));
  const tradPts = history
    .map((h) => h.traditionalScore)
    .filter((v): v is number => v !== null && v > 0);
  const hasTrad = tradPts.length > 0;

  const yTicks = [300, 450, 600, 750, 900];

  return (
    <div className="relative w-full" style={{ paddingBottom: "35%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        style={{ fontFamily: "inherit" }}
        aria-label="Score history line chart"
        role="img"
        onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
      >
        {/* Y-axis grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              y1={yOf(tick)}
              x2={PADDING.left + chartW}
              y2={yOf(tick)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={yOf(tick) + 4}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {history.map((h, i) => (
          <text
            key={h.date}
            x={xOf(i)}
            y={H - PADDING.bottom + 18}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            opacity={0.6}
          >
            {formatDate(h.date)}
          </text>
        ))}

        {/* Alt Score line */}
        <polyline
          points={makePolyline(altPts)}
          fill="none"
          stroke="oklch(0.55 0.2 260)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Trust Score line (scaled) */}
        <polyline
          points={makePolyline(trustPts)}
          fill="none"
          stroke="oklch(0.65 0.18 145)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5,3"
        />

        {/* Traditional score line */}
        {hasTrad && (
          <polyline
            points={history
              .filter(
                (h) => h.traditionalScore != null && h.traditionalScore > 0,
              )
              .map((h) => {
                const realIdx = history.findIndex((x) => x === h);
                return `${xOf(realIdx)},${yOf(h.traditionalScore!)}`;
              })
              .join(" ")}
            fill="none"
            stroke="oklch(0.72 0.18 75)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots + hover targets */}
        {history.map((snap, i) => (
          <g key={snap.date}>
            <circle
              cx={xOf(i)}
              cy={yOf(snap.altScore)}
              r={4}
              fill="oklch(0.55 0.2 260)"
              stroke="white"
              strokeWidth={1.5}
            />
            {snap.traditionalScore != null && snap.traditionalScore > 0 && (
              <circle
                cx={xOf(i)}
                cy={yOf(snap.traditionalScore)}
                r={4}
                fill="oklch(0.72 0.18 75)"
                stroke="white"
                strokeWidth={1.5}
              />
            )}
            <circle
              cx={xOf(i)}
              cy={yOf(scaleTrust(snap.trustScore))}
              r={3.5}
              fill="oklch(0.65 0.18 145)"
              stroke="white"
              strokeWidth={1.5}
            />
            {/* Invisible hover target */}
            <rect
              x={xOf(i) - 20}
              y={PADDING.top}
              width={40}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({
                  x: xOf(i),
                  y: yOf(snap.altScore),
                  snap,
                  visible: true,
                });
              }}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && tooltip.snap && (
        <div
          className="absolute z-10 pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-3 text-xs min-w-[140px]"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <p className="font-semibold mb-1.5">
            {formatDate(tooltip.snap.date)}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Alt Score</span>
              <span
                className="font-bold"
                style={{ color: "oklch(0.55 0.2 260)" }}
              >
                {tooltip.snap.altScore}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Trust</span>
              <span
                className="font-bold"
                style={{ color: "oklch(0.65 0.18 145)" }}
              >
                {tooltip.snap.trustScore}
              </span>
            </div>
            {tooltip.snap.traditionalScore != null &&
              tooltip.snap.traditionalScore > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">CIBIL</span>
                  <span
                    className="font-bold"
                    style={{ color: "oklch(0.72 0.18 75)" }}
                  >
                    {tooltip.snap.traditionalScore}
                  </span>
                </div>
              )}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Risk</span>
              <span className="font-bold">{tooltip.snap.riskTier}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 flex-wrap pb-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-0.5 rounded-full"
            style={{ background: "oklch(0.55 0.2 260)" }}
          />
          <span className="text-xs text-muted-foreground">Alt Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-0 border-t-2 rounded-full"
            style={{
              borderColor: "oklch(0.65 0.18 145)",
              borderStyle: "dashed",
            }}
          />
          <span className="text-xs text-muted-foreground">
            Trust Score (scaled)
          </span>
        </div>
        {hasTrad && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-0.5 rounded-full"
              style={{ background: "oklch(0.72 0.18 75)" }}
            />
            <span className="text-xs text-muted-foreground">CIBIL Score</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScoreHistoryPage() {
  const { user } = useAppContext();
  const t = useT();
  const [history, setHistory] = useState<ScoreSnapshot[]>([]);

  useEffect(() => {
    if (!user) return;
    setHistory(getScoreHistory(user.id));
  }, [user]);

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          {/* Back */}
          <Link to="/dashboard">
            <button
              data-ocid="scorehistory.back.button"
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
              <LineChart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                {t("scoreHistory")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track how your scores have changed over time
              </p>
            </div>
          </div>

          {/* Chart */}
          <Card data-ocid="scorehistory.chart.panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">
                Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              {history.length >= 2 ? (
                <ScoreLineChart history={history} />
              ) : (
                <div
                  data-ocid="scorehistory.empty_state"
                  className="py-12 text-center text-muted-foreground"
                >
                  <LineChart className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Not enough history yet</p>
                  <p className="text-xs mt-1">
                    Score history builds as you update your business profile.
                    Update your profile at least twice to see trends.
                  </p>
                  <Link to="/profile">
                    <button
                      data-ocid="scorehistory.profile.button"
                      className="mt-3 text-xs text-primary hover:underline"
                      type="button"
                    >
                      Update your profile →
                    </button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary table */}
          {history.length > 0 && (
            <Card data-ocid="scorehistory.table">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display">
                  Score History
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>Alt Score</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Traditional</TableHead>
                      <TableHead className="pr-6">Risk Tier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...history].reverse().map((snap, i) => (
                      <TableRow
                        key={`${snap.date}-${i}`}
                        data-ocid={`scorehistory.row.item.${i + 1}`}
                      >
                        <TableCell className="pl-6 text-sm">
                          {new Date(snap.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {snap.altScore}
                        </TableCell>
                        <TableCell>{snap.trustScore}</TableCell>
                        <TableCell>
                          {snap.traditionalScore != null &&
                          snap.traditionalScore > 0
                            ? snap.traditionalScore
                            : "—"}
                        </TableCell>
                        <TableCell className="pr-6">
                          <Badge
                            className={`text-xs px-2 py-0.5 border ${
                              snap.riskTier === "Low"
                                ? "score-low"
                                : snap.riskTier === "Medium"
                                  ? "score-medium"
                                  : "score-high"
                            }`}
                          >
                            {snap.riskTier}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
