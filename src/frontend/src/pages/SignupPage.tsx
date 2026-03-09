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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { login, signUp } from "../lib/store";
import type { Role } from "../lib/types";

export function SignupPage() {
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
    if (!password || password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    await new Promise((r) => setTimeout(r, 400));

    const result = signUp(email, password, role);
    if (!result.success) {
      setIsLoading(false);
      setErrors({ form: result.error ?? "Signup failed" });
      return;
    }

    // Auto-login after signup
    const loginResult = login(email, password);
    setIsLoading(false);

    if (!loginResult.success || !loginResult.user) {
      setErrors({
        form: "Account created but login failed. Please log in manually.",
      });
      return;
    }

    setUser(loginResult.user);
    toast.success("Account created! Welcome to CredVist.");

    if (loginResult.user.role === "admin") {
      navigate({ to: "/admin" });
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <img
          src="/assets/generated/credvist-logo-transparent.dim_400x400.png"
          alt="CredVist logo"
          className="w-16 h-16 object-contain drop-shadow-lg"
        />
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Cred<span className="text-primary">Vist</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build Your Financial Identity
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm shadow-md border-border">
        <CardHeader className="pb-2 pt-6 px-6">
          <h2 className="font-display text-xl font-bold">{t("signup")}</h2>
          <p className="text-sm text-muted-foreground">
            Create your CredVist account
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
                data-ocid="signup.email.input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className={errors.email ? "border-destructive" : ""}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                data-ocid="signup.password.input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={errors.password ? "border-destructive" : ""}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("role")}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger
                  data-ocid="signup.role.select"
                  className="w-full"
                >
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
                data-ocid="signup.error_state"
                className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive"
              >
                {errors.form}
              </div>
            )}

            <Button
              type="submit"
              data-ocid="signup.submit_button"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating
                  account...
                </>
              ) : (
                t("signup")
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              {t("login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
