import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Calculator,
  FileText,
  LayoutDashboard,
  LogOut,
  Shield,
  Sliders,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import type { Language } from "../lib/i18n";
import { logout } from "../lib/store";
import { setLanguage as persistLanguage } from "../lib/store";

const LANGUAGES: Language[] = ["en", "gu", "hi"];
const LANG_LABELS: Record<Language, string> = { en: "EN", gu: "GU", hi: "HI" };

export function NavBar() {
  const { user, setUser, language, setLanguage } = useAppContext();
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    setUser(null);
    navigate({ to: "/login" });
  }

  function handleLanguage(lang: Language) {
    setLanguage(lang);
    persistLanguage(lang);
  }

  if (!user) return null;

  const navLinks =
    user.role === "admin"
      ? [
          {
            to: "/admin",
            label: t("admin"),
            icon: Shield,
            ocid: "nav.admin.link",
          },
          {
            to: "/admin/users",
            label: t("users"),
            icon: Users,
            ocid: "nav.users.link",
          },
        ]
      : [
          {
            to: "/dashboard",
            label: t("dashboard"),
            icon: LayoutDashboard,
            ocid: "nav.dashboard.link",
          },
          {
            to: "/profile",
            label: t("profile"),
            icon: User,
            ocid: "nav.profile.link",
          },
          {
            to: "/cashflow",
            label: t("cashflow"),
            icon: TrendingUp,
            ocid: "nav.cashflow.link",
          },
          {
            to: "/documents",
            label: t("documents"),
            icon: FileText,
            ocid: "nav.documents.link",
          },
          {
            to: "/simulator",
            label: t("simulator"),
            icon: Sliders,
            ocid: "nav.simulator.link",
          },
          {
            to: "/emi-calculator",
            label: t("emiCalculator"),
            icon: Calculator,
            ocid: "nav.emi_calculator.link",
          },
        ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm shadow-xs">
      <div className="max-w-7xl mx-auto px-4 flex h-14 items-center gap-4">
        {/* Logo */}
        <Link
          to={user.role === "admin" ? "/admin" : "/dashboard"}
          data-ocid="nav.logo.link"
          className="flex items-center gap-2 mr-4 shrink-0"
        >
          <img
            src="/assets/generated/credvist-logo-transparent.dim_400x400.png"
            alt="CredVist logo"
            className="h-8 w-8 object-contain rounded-md"
          />
          <span className="font-display font-bold text-sm hidden sm:block text-foreground">
            Cred<span className="text-primary">Vist</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {navLinks.map(({ to, label, icon: Icon, ocid }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                data-ocid={ocid}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language toggle */}
          <div
            data-ocid="nav.language.toggle"
            className="flex items-center rounded-md border border-border overflow-hidden text-xs"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguage(lang)}
                className={cn(
                  "px-2 py-1 transition-colors font-medium",
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>

          {/* Role badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-xs hidden sm:flex",
              user.role === "admin"
                ? "border-amber-400 text-amber-600"
                : "border-primary/30 text-primary",
            )}
          >
            {user.role}
          </Badge>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            data-ocid="nav.logout.button"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive gap-1.5 px-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:block text-xs">{t("logout")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
