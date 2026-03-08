import { AlertTriangle } from "lucide-react";
import { useT } from "../hooks/useT";

interface EMIAlertBannerProps {
  emiRiskPercent: number;
  advice?: string;
}

export function EMIAlertBanner({
  emiRiskPercent,
  advice,
}: EMIAlertBannerProps) {
  const t = useT();

  if (emiRiskPercent <= 25) return null;

  return (
    <div
      data-ocid="dashboard.emi.panel"
      className="animate-slide-in w-full bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3 animate-pulse-ring"
    >
      <div className="bg-destructive/20 rounded-full p-1.5 shrink-0 mt-0.5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-destructive">
          {t("emiWarning")} — {emiRiskPercent}% risk detected
        </p>
        {advice && (
          <p className="text-xs text-destructive/80 mt-0.5">{advice}</p>
        )}
      </div>
    </div>
  );
}
