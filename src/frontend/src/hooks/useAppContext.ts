import { createContext, useContext } from "react";
import type { Language } from "../lib/i18n";
import type { User } from "../lib/types";

export interface AppContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const AppContext = createContext<AppContextValue>({
  user: null,
  setUser: () => {},
  language: "en",
  setLanguage: () => {},
});

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}
