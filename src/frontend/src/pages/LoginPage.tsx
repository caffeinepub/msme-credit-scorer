import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { login } from "../lib/store";
import type { Role } from "../lib/types";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("borrower");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});

  const { setUser } = useAppContext();
  const t = useT();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    // Simulate async delay
    await new Promise((r) => setTimeout(r, 400));

    const result = login(email, password);
    setIsLoading(false);

    if (!result.success || !result.user) {
      setErrors({ form: result.error ?? "Login failed" });
      return;
    }

    // Check role match
    if (result.user.role !== role) {
      setErrors({
        form: `This account is registered as "${result.user.role}", not "${role}".`,
      });
      return;
    }

    setUser(result.user);
    toast.success(`Welcome back, ${result.user.email.split("@")[0]}!`);

    if (result.user.role === "admin") {
      navigate({ to: "/admin" });
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center shadow-lg">
          <TrendingUp className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            MSME <span className="text-primary">Credit Scorer</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Empowering Gujarat Businesses
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm shadow-md border-border">
        <CardHeader className="pb-2 pt-6 px-6">
          <h2 className="font-display text-xl font-bold">{t("login")}</h2>
          <p className="text-sm text-muted-foreground">
            Sign in to your MSME account
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                data-ocid="login.email.input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className={errors.email ? "border-destructive" : ""}
                autoComplete="email"
              />
              {errors.email && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="login.email.error"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                data-ocid="login.password.input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={errors.password ? "border-destructive" : ""}
                autoComplete="current-password"
              />
              {errors.password && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="login.password.error"
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("role")}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger data-ocid="login.role.select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrower">{t("borrower")}</SelectItem>
                  <SelectItem value="admin">{t("adminRole")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {errors.form && (
              <div
                data-ocid="login.error_state"
                className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive"
              >
                {errors.form}
              </div>
            )}

            <Button
              type="submit"
              data-ocid="login.submit_button"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing
                  in...
                </>
              ) : (
                t("login")
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary hover:underline font-medium"
            >
              {t("signup")}
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 rounded-lg bg-muted/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                Demo Credentials
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-mono bg-background px-1 rounded">
                  borrower1@msme.com
                </span>{" "}
                /{" "}
                <span className="font-mono bg-background px-1 rounded">
                  password123
                </span>{" "}
                (Borrower)
              </p>
              <p>
                <span className="font-mono bg-background px-1 rounded">
                  admin@msme.com
                </span>{" "}
                /{" "}
                <span className="font-mono bg-background px-1 rounded">
                  admin123
                </span>{" "}
                (Admin)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
