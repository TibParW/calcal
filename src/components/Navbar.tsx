import React from "react";
import { Settings, History, Sun, Moon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenHistory }) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-[#fafaf9]/85 dark:bg-[#0c0c0e]/85 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/60 transition-colors">
      <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
            calCal
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Minimal Action Icons & Language Selector */}
        <div className="flex items-center gap-2">
          {/* Direct Press Language Selector (No slider) */}
          <div className="flex items-center text-[11px] font-medium rounded-md border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-100/80 dark:bg-neutral-900/80">
            <button
              type="button"
              onClick={() => setLang("th")}
              className={`px-1.5 py-0.5 rounded transition active:scale-95 ${
                lang === "th"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold"
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
              title="ภาษาไทย"
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-1.5 py-0.5 rounded transition active:scale-95 ${
                lang === "en"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold"
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("theme_toggle")}
            title={theme === "dark" ? t("theme_light") : t("theme_dark")}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px] stroke-[1.8] text-amber-400" />
            ) : (
              <Moon className="w-[18px] h-[18px] stroke-[1.8] text-neutral-600 dark:text-neutral-300" />
            )}
          </button>

          <button
            onClick={onOpenHistory}
            aria-label={t("nav_history")}
            title={t("nav_history")}
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition active:scale-95"
          >
            <History className="w-[18px] h-[18px] stroke-[1.8]" />
          </button>

          <button
            onClick={onOpenSettings}
            aria-label={t("nav_settings")}
            title={t("nav_settings")}
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition active:scale-95"
          >
            <Settings className="w-[18px] h-[18px] stroke-[1.8]" />
          </button>
        </div>
      </div>
    </header>
  );
};
