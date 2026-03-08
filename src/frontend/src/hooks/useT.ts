import { translations } from "../lib/i18n";
import type { TranslationKey } from "../lib/i18n";
import { useAppContext } from "./useAppContext";

export function useT() {
  const { language } = useAppContext();
  return function t(key: TranslationKey): string {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  };
}
