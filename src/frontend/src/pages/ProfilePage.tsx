import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ScoreGauge } from "../components/ScoreGauge";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { getCreditScore, getProfile, saveProfile } from "../lib/store";
import type { Industry } from "../lib/types";
import type { CreditScore } from "../lib/types";
import { validateBusinessForm } from "../lib/validation";
import type { BusinessFormData, BusinessFormErrors } from "../lib/validation";

const INDUSTRIES: { value: Industry; labelKey: string }[] = [
  { value: "textile", labelKey: "textileIndustry" },
  { value: "retail", labelKey: "retailIndustry" },
  { value: "kirana", labelKey: "kiranaIndustry" },
  { value: "manufacturing", labelKey: "manufacturingIndustry" },
  { value: "food_processing", labelKey: "foodProcessingIndustry" },
  { value: "handicrafts", labelKey: "handicraftsIndustry" },
];

type FieldErrors = BusinessFormErrors;

export function ProfilePage() {
  const { user } = useAppContext();
  const t = useT();
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);

  const [form, setForm] = useState<{
    businessName: string;
    gstNumber: string;
    businessAge: string;
    industry: Industry;
    location: string;
    monthlyRevenue: string;
    monthlyExpenses: string;
  }>({
    businessName: "",
    gstNumber: "",
    businessAge: "",
    industry: "textile",
    location: "",
    monthlyRevenue: "",
    monthlyExpenses: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!user) return;
    const profile = getProfile(user.id);
    if (profile) {
      setForm({
        businessName: profile.businessName,
        gstNumber: profile.gstNumber,
        businessAge: String(profile.businessAge),
        industry: profile.industry,
        location: profile.location,
        monthlyRevenue: String(profile.monthlyRevenue),
        monthlyExpenses: String(profile.monthlyExpenses),
      });
    }
    setCreditScore(getCreditScore(user.id));
  }, [user]);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const data = {
      businessName: form.businessName,
      gstNumber: form.gstNumber,
      businessAge: Number.parseFloat(form.businessAge),
      industry: form.industry,
      location: form.location,
      monthlyRevenue: Number.parseFloat(form.monthlyRevenue),
      monthlyExpenses: Number.parseFloat(form.monthlyExpenses),
    };

    const validationErrors = validateBusinessForm(data as BusinessFormData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    saveProfile({
      userId: user.id,
      businessName: data.businessName,
      gstNumber: data.gstNumber,
      businessAge: data.businessAge,
      industry: data.industry,
      location: data.location,
      monthlyRevenue: data.monthlyRevenue,
      monthlyExpenses: data.monthlyExpenses,
      updatedAt: new Date().toISOString(),
    });

    const newScore = getCreditScore(user.id);
    setCreditScore(newScore);
    setIsLoading(false);
    setSaved(true);
    toast.success("Business profile saved & credit score updated!");
  }

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("profile")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your business information determines your credit score
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="businessName">{t("businessName")}</Label>
                      <Input
                        id="businessName"
                        data-ocid="profile.businessname.input"
                        value={form.businessName}
                        onChange={(e) => update("businessName", e.target.value)}
                        placeholder="Sunrise Textiles"
                        className={
                          errors.businessName ? "border-destructive" : ""
                        }
                      />
                      {errors.businessName && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{" "}
                          {errors.businessName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="gstNumber">{t("gstNumber")}</Label>
                      <Input
                        id="gstNumber"
                        data-ocid="profile.gst.input"
                        value={form.gstNumber}
                        onChange={(e) =>
                          update("gstNumber", e.target.value.toUpperCase())
                        }
                        placeholder="24AAACS7072B1Z6"
                        className={errors.gstNumber ? "border-destructive" : ""}
                        maxLength={15}
                      />
                      {errors.gstNumber && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.gstNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="businessAge">{t("businessAge")}</Label>
                      <Input
                        id="businessAge"
                        type="number"
                        data-ocid="profile.age.input"
                        value={form.businessAge}
                        onChange={(e) => update("businessAge", e.target.value)}
                        placeholder="5"
                        min="0"
                        max="100"
                        step="0.5"
                        className={
                          errors.businessAge ? "border-destructive" : ""
                        }
                      />
                      {errors.businessAge && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{" "}
                          {errors.businessAge}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t("industry")}</Label>
                      <Select
                        value={form.industry}
                        onValueChange={(v) => update("industry", v)}
                      >
                        <SelectTrigger data-ocid="profile.industry.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(({ value, labelKey }) => (
                            <SelectItem key={value} value={value}>
                              {t(labelKey as Parameters<typeof t>[0])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && (
                        <p className="text-xs text-destructive">
                          {errors.industry}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="location">{t("location")}</Label>
                      <Input
                        id="location"
                        data-ocid="profile.location.input"
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="Surat, Gujarat"
                        className={errors.location ? "border-destructive" : ""}
                      />
                      {errors.location && (
                        <p className="text-xs text-destructive">
                          {errors.location}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="monthlyRevenue">
                        {t("monthlyRevenue")}
                      </Label>
                      <Input
                        id="monthlyRevenue"
                        type="number"
                        data-ocid="profile.revenue.input"
                        value={form.monthlyRevenue}
                        onChange={(e) =>
                          update("monthlyRevenue", e.target.value)
                        }
                        placeholder="500000"
                        min="1000"
                        className={
                          errors.monthlyRevenue ? "border-destructive" : ""
                        }
                      />
                      {errors.monthlyRevenue && (
                        <p className="text-xs text-destructive">
                          {errors.monthlyRevenue}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="monthlyExpenses">
                        {t("monthlyExpenses")}
                      </Label>
                      <Input
                        id="monthlyExpenses"
                        type="number"
                        data-ocid="profile.expenses.input"
                        value={form.monthlyExpenses}
                        onChange={(e) =>
                          update("monthlyExpenses", e.target.value)
                        }
                        placeholder="300000"
                        min="0"
                        className={
                          errors.monthlyExpenses ? "border-destructive" : ""
                        }
                      />
                      {errors.monthlyExpenses && (
                        <p className="text-xs text-destructive">
                          {errors.monthlyExpenses}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    data-ocid="profile.submit_button"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Saved
                      </>
                    ) : (
                      t("save")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Score preview */}
            <div className="space-y-4">
              {creditScore && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground font-medium">
                      Current Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-3 pb-5">
                    <ScoreGauge
                      score={creditScore.altScore}
                      tier={creditScore.riskTier}
                      size="md"
                    />
                    {creditScore.fraudFlag && (
                      <div className="w-full rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{creditScore.fraudFlag}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-muted/40">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold mb-3 text-foreground">
                    Score Factors
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 shrink-0"
                      >
                        +
                      </Badge>
                      <span>Higher monthly revenue boosts score</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 shrink-0"
                      >
                        +
                      </Badge>
                      <span>Older businesses score higher</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 shrink-0"
                      >
                        −
                      </Badge>
                      <span>High expense ratio reduces score</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 shrink-0"
                      >
                        +
                      </Badge>
                      <span>Kirana & food processing get bonus points</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
