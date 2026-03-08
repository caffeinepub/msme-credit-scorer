import { cn } from "@/lib/utils";
import { getScoreBgClass } from "../lib/scoring";
import type { RiskTier } from "../lib/types";

interface ScoreGaugeProps {
  score: number;
  tier: RiskTier;
  size?: "sm" | "md" | "lg";
}

export function ScoreGauge({ score, tier, size = "md" }: ScoreGaugeProps) {
  const min = 300;
  const max = 900;
  const percent = ((score - min) / (max - min)) * 100;

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-36 h-36",
    lg: "w-44 h-44",
  };

  const textSizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  const radius = size === "lg" ? 75 : size === "md" ? 60 : 44;
  const strokeWidth = size === "lg" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  // Show only top 270 degrees (3/4 circle)
  const arc = circumference * 0.75;
  const offset = arc - (percent / 100) * arc;

  const tierColors: Record<RiskTier, string> = {
    Low: "oklch(0.55 0.15 145)",
    Medium: "oklch(0.72 0.18 75)",
    High: "oklch(0.58 0.22 25)",
  };

  const cx = size === "lg" ? 88 : size === "md" ? 72 : 52;
  const cy = cx;
  const viewBox = `0 0 ${cx * 2} ${cy * 2}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          viewBox={viewBox}
          className="w-full h-full -rotate-[135deg]"
          overflow="visible"
          role="img"
          aria-label={`Credit score gauge showing ${score} out of 900`}
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="oklch(0.88 0.01 85)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Score arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={tierColors[tier]}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc - offset} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-display font-bold leading-none",
              textSizes[size],
            )}
          >
            {score}
          </span>
          <span className="text-xs text-muted-foreground mt-1 font-medium">
            / 900
          </span>
        </div>
      </div>

      {/* Tier badge */}
      <span
        className={cn(
          "text-xs font-semibold px-3 py-1 rounded-full border",
          getScoreBgClass(tier),
        )}
      >
        {tier} Risk
      </span>
    </div>
  );
}
