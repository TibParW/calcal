"use client";

import React, { useState, useEffect } from "react";
import { Share, Download, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const InstallPrompt: React.FC = () => {
  const { lang, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if app is already installed / opened in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if previously dismissed within the last 7 days
    const dismissed = localStorage.getItem("calcal_install_dismissed_at");
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        return;
      }
    }

    // Check iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;

    if (isIosDevice) {
      setIsIOS(true);
      // Show iOS guide after a polite 2.5s delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem("calcal_install_dismissed_at", Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Install prompt error:", err);
    }
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label={t("install_title")}
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 dark:bg-[#16161a]/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 shadow-xl rounded-2xl p-3.5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        {/* App Icon */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <img
            src="/icon-192.png"
            alt="calCal Icon"
            className="w-8 h-8 rounded-lg object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Info & Instructions */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {t("install_title")}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition p-0.5 -mr-1"
              aria-label={t("install_dismiss")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
            {t("install_desc")}
          </p>

          {/* Platform-specific Action */}
          {isIOS ? (
            <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
              <p className="text-[10.5px] text-neutral-600 dark:text-neutral-300 flex items-center flex-wrap gap-1 leading-relaxed">
                <span>{lang === "th" ? "แตะที่ปุ่มแชร์" : "Tap the Share button"}</span>
                <span className="inline-flex items-center justify-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                  <Share className="w-3 h-3 text-blue-500" />
                </span>
                <span>
                  {lang === "th"
                    ? "ด้านล่าง แล้วเลือก 'เพิ่มไปยังหน้าจอโฮม'"
                    : "below, then select 'Add to Home Screen'"}
                </span>
              </p>
            </div>
          ) : deferredPrompt ? (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("install_btn")}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 px-2 py-1 transition"
              >
                {t("install_dismiss")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
};
