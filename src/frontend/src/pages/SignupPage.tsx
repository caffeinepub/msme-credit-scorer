import { Button } from "@/components/ui/button";
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
import { AnimatedSidePanel } from "../components/AnimatedSidePanel";
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
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F6FA" }}>
      {/* ── Left: Signup form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 min-h-screen">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/assets/generated/credvist-logo-transparent.dim_400x400.png"
            alt="CredVist logo"
            className="w-14 h-14 object-contain drop-shadow-md"
            style={{ animation: "pulseLogo 3s ease-in-out infinite" }}
          />
          <div className="text-center">
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "'Montserrat', 'Bricolage Grotesque', sans-serif",
                color: "#202124",
              }}
            >
              Cred<span style={{ color: "#1A73E8" }}>Vist</span>
            </h1>
            <p
              className="text-xs mt-1"
              style={{ color: "#6B7280", fontFamily: "'Roboto', sans-serif" }}
            >
              Build Your Financial Identity
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="w-full max-w-sm rounded-2xl p-8 shadow-lg"
          style={{ background: "#ffffff" }}
        >
          <h2
            className="text-xl font-bold mb-1"
            style={{
              fontFamily: "'Montserrat', 'Bricolage Grotesque', sans-serif",
              color: "#202124",
            }}
          >
            {t("signup")}
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "#6B7280", fontFamily: "'Roboto', sans-serif" }}
          >
            Create your CredVist account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: "#202124", fontFamily: "'Roboto', sans-serif" }}
              >
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                data-ocid="signup.email.input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                style={{ fontFamily: "'Roboto', sans-serif" }}
                className={`rounded-xl border shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#1A73E8]/40 focus-visible:border-[#1A73E8] ${
                  errors.email ? "border-[#EA4335]" : "border-gray-200"
                }`}
              />
              {errors.email && (
                <p
                  className="text-xs"
                  style={{
                    color: "#EA4335",
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: "#202124", fontFamily: "'Roboto', sans-serif" }}
              >
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                data-ocid="signup.password.input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                style={{ fontFamily: "'Roboto', sans-serif" }}
                className={`rounded-xl border shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#1A73E8]/40 focus-visible:border-[#1A73E8] ${
                  errors.password ? "border-[#EA4335]" : "border-gray-200"
                }`}
              />
              {errors.password && (
                <p
                  className="text-xs"
                  style={{
                    color: "#EA4335",
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                className="text-sm font-medium"
                style={{ color: "#202124", fontFamily: "'Roboto', sans-serif" }}
              >
                {t("role")}
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger
                  data-ocid="signup.role.select"
                  className="w-full rounded-xl border-gray-200 shadow-sm"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
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
                className="rounded-xl px-3 py-2 text-xs"
                style={{
                  background: "rgba(234,67,53,0.08)",
                  border: "1px solid rgba(234,67,53,0.2)",
                  color: "#EA4335",
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                {errors.form}
              </div>
            )}

            <Button
              type="submit"
              data-ocid="signup.submit_button"
              className="w-full rounded-xl font-semibold py-2.5 text-white shadow-md transition-all active:scale-95"
              disabled={isLoading}
              style={{
                background: isLoading
                  ? "#9CA3AF"
                  : "linear-gradient(90deg, #1A73E8 0%, #34A853 100%)",
                fontFamily: "'Roboto', sans-serif",
                border: "none",
              }}
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

          <div
            className="mt-4 text-center text-sm"
            style={{ color: "#6B7280", fontFamily: "'Roboto', sans-serif" }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium hover:underline"
              style={{ color: "#1A73E8" }}
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right: Animated Side Panel ──────────────────────── */}
      <div className="hidden md:block w-[45%] lg:w-1/2 min-h-screen">
        <AnimatedSidePanel />
      </div>
    </div>
  );
}
