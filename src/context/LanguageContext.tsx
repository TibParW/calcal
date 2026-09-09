"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Language, TranslationKey, translations } from "@/lib/i18n";
import { safeGetItem, safeSetItem } from "@/lib/storage";

const LANG_STORAGE_KEY = "CALCAL_APP_LANG_V1";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>("th");

  useEffect(() => {
    const saved = safeGetItem(LANG_STORAGE_KEY);
    if (saved === "th" || saved === "en") {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    safeSetItem(LANG_STORAGE_KEY, newLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "th" ? "en" : "th";
      safeSetItem(LANG_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = translations[lang] || translations.th;
      let text = (dict as any)[key] || (translations.th as any)[key] || key;

      if (params) {
        Object.entries(params).forEach(([pKey, pVal]) => {
          text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
        });
      }

      return text;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
