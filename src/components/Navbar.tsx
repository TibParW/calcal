import React from "react";
import { Settings, History, Cloud, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenHistory }) => {
  const { t, lang } = useLanguage();
  const { user, loading, isSyncing, loginWithGoogle } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#fafaf9]/85 dark:bg-[#0c0c0e]/85 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/60 transition-colors">
      <div className="max-w-md mx-auto px-4 sm:px-5 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <img
            src="/icon.png"
            alt="calCal"
            className="w-5 h-5 object-contain select-none"
          />
          <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
            calCal
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Minimal Action Icons */}
        <div className="flex items-center gap-1.5">
          {/* Cloud Sync & Auth Status */}
          {user ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium transition active:scale-95"
              title={`${t("cloud_synced_badge")}: ${user.email || user.displayName}`}
            >
              {isSyncing ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User"
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
              <span className="max-w-[70px] sm:max-w-[90px] truncate text-[11px]">
                {user.displayName?.split(" ")[0] || "Synced"}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-700/80 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300 text-[11px] font-medium transition active:scale-95 shadow-2xs disabled:opacity-50"
              title={t("cloud_sync_desc")}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span>{loading ? "..." : (lang === "en" ? "Backup" : "สำรอง Cloud")}</span>
            </button>
          )}

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

