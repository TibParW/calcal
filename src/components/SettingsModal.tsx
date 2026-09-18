import React, { useState, useEffect } from "react";
import { UserSettings, StorageUsageInfo } from "@/types";
import {
  X,
  Trash2,
  ExternalLink,
  Sun,
  Moon,
  Cloud,
  LogOut,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  clearAllData,
  getStorageUsageInfo,
  stripOldThumbnails,
} from "@/lib/storage";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { QuotaMeter } from "./QuotaMeter";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onDataReset: () => void;
  onOpenTdeeModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onDataReset,
  onOpenTdeeModal,
}) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, loading, isSyncing, lastSyncTime, loginWithGoogle, logout, syncNow } = useAuth();
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(settings.daily_goal || 2000);
  const [proteinGoal, setProteinGoal] = useState(settings.protein_goal_g || 100);
  const [carbsGoal, setCarbsGoal] = useState(settings.carbs_goal_g || 250);
  const [fatGoal, setFatGoal] = useState(settings.fat_goal_g || 65);
  const [apiKey, setApiKey] = useState(settings.gemini_api_key || "");
  const [storageMode, setStorageMode] = useState<'ultra_light' | 'micro_thumbnail'>(
    settings.storage_mode || "ultra_light"
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageUsageInfo>({
    totalBytes: 0,
    totalKb: 0,
    totalMeals: 0,
    totalDays: 0,
    thumbnailCount: 0,
    thumbnailBytes: 0,
  });

  const refreshStorage = () => {
    setStorageInfo(getStorageUsageInfo());
  };

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      setIsInAppBrowser(/Line|FBAN|FBAV|Instagram|Messenger/i.test(ua));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDailyGoal(settings.daily_goal || 2000);
      setProteinGoal(settings.protein_goal_g || 100);
      setCarbsGoal(settings.carbs_goal_g || 250);
      setFatGoal(settings.fat_goal_g || 65);
      setApiKey(settings.gemini_api_key || "");
      setStorageMode(settings.storage_mode || "ultra_light");
      refreshStorage();
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({
      daily_goal: Number(dailyGoal) || 2000,
      protein_goal_g: Number(proteinGoal) || 100,
      carbs_goal_g: Number(carbsGoal) || 250,
      fat_goal_g: Number(fatGoal) || 65,
      gemini_api_key: apiKey.trim(),
      storage_mode: storageMode,
    });
    onClose();
  };

  const handleStripThumbnails = () => {
    const { prunedCount, savedKb } = stripOldThumbnails(0);
    alert(
      lang === "en"
        ? `Thumbnails cleared (${prunedCount} images). Reclaimed ${savedKb} KB. Log data is intact.`
        : `ลบรูปภาพย่อเรียบร้อยแล้ว (${prunedCount} รูป) ประหยัดพื้นที่ได้ ${savedKb} KB โดยข้อมูลอาหารยังอยู่ครบ`
    );
    refreshStorage();
    onDataReset();
  };

  const handleClear = () => {
    clearAllData();
    setConfirmClear(false);
    refreshStorage();
    onDataReset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 pt-14 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100dvh-4rem)] sm:max-h-[85vh] border border-neutral-200/60 dark:border-neutral-800/60">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {t("settings_title")}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1 text-xs">
          {/* Account & Cloud Sync */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                {t("cloud_sync_title")}
              </span>
              {user ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {t("cloud_synced_badge")}
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400">
                  {t("cloud_guest_badge")}
                </span>
              )}
            </div>

            {user ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 font-bold text-xs">
                        {user.displayName?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-xs text-neutral-900 dark:text-white block">
                        {user.displayName || "Google User"}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate max-w-[180px]">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-neutral-500 hover:text-rose-500 dark:text-neutral-400 dark:hover:text-rose-400 transition"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{t("cloud_logout_btn")}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-400 border-t border-neutral-200/50 dark:border-neutral-800/60">
                  <span>
                    {lastSyncTime
                      ? `${t("cloud_last_synced")} ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : "Firebase Firestore"}
                  </span>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={syncNow}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>{isSyncing ? t("cloud_syncing") : t("cloud_sync_now")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {isInAppBrowser && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 text-[11px] space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-100">
                      <span>💡 กำลังเปิดในแอปแชท (LINE / Messenger)</span>
                    </div>
                    <p className="text-[10px] leading-relaxed opacity-90">
                      Google ไม่อนุญาตให้ล็อกอินในแอปแชท แนะนำให้เปิดด้วย Safari หรือ Chrome เพื่อเข้าสู่ระบบครับ
                    </p>
                    <a
                      href="https://calcal-lime.vercel.app/?openExternalBrowser=1"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิดใน Safari / Chrome ทันที</span>
                    </a>
                  </div>
                )}

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {t("cloud_sync_desc")}
                </p>
                <button
                  type="button"
                  disabled={loading || isSyncing}
                  onClick={loginWithGoogle}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400 dark:text-emerald-600" />
                  ) : (
                    <Cloud className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  )}
                  <span>{loading ? (lang === "en" ? "Connecting..." : "กำลังเชื่อมต่อ...") : t("cloud_sync_btn")}</span>
                </button>
              </div>
            )}
          </div>

          {/* Calorie Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {t("settings_daily_goal")}
              </span>
              {onOpenTdeeModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTdeeModal();
                  }}
                  className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t("settings_bmr_btn")}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="500"
                max="8000"
                step="50"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-neutral-400"
              />
              <span className="text-neutral-400 font-medium">{t("ring_kcal")}</span>
            </div>

            {/* Macros target */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">{t("macro_protein")} ({t("macro_g")})</span>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">{t("macro_carbs")} ({t("macro_g")})</span>
                <input
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">{t("macro_fat")} ({t("macro_g")})</span>
                <input
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Language Selector (Direct Press, No Slider) */}
          <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              {t("settings_lang_title")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLang("th")}
                className={`p-2.5 rounded-2xl border flex items-center justify-center gap-1.5 transition active:scale-95 ${
                  lang === "th"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs font-semibold"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <span className="text-xs font-medium">🇹🇭 ภาษาไทย (TH)</span>
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`p-2.5 rounded-2xl border flex items-center justify-center gap-1.5 transition active:scale-95 ${
                  lang === "en"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs font-semibold"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <span className="text-xs font-medium">🇬🇧 English (EN)</span>
              </button>
            </div>
          </div>

          {/* Theme / Appearance */}
          <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              {t("theme_title")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 transition ${
                  theme === "light"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs font-semibold"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs">{t("theme_light")}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 transition ${
                  theme === "dark"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs font-semibold"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">{t("theme_dark")}</span>
              </button>
            </div>
          </div>

          {/* Storage Mode */}
          <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {t("settings_storage_title")}
              </span>
              <span className="text-[11px] font-medium text-neutral-500">
                {lang === "en" ? `Used ${storageInfo.totalKb} KB` : `ใช้ไป ${storageInfo.totalKb} KB`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStorageMode("ultra_light")}
                className={`p-3 rounded-2xl border text-left transition ${
                  storageMode === "ultra_light"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <span className="font-semibold block text-xs">{t("settings_storage_ultra")}</span>
                <span className="text-[10px] opacity-70 block mt-0.5">
                  {t("settings_storage_ultra_desc")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStorageMode("micro_thumbnail")}
                className={`p-3 rounded-2xl border text-left transition ${
                  storageMode === "micro_thumbnail"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <span className="font-semibold block text-xs">{t("settings_storage_thumb")}</span>
                <span className="text-[10px] opacity-70 block mt-0.5">
                  {t("settings_storage_thumb_desc")}
                </span>
              </button>
            </div>

            {storageInfo.thumbnailCount > 0 && (
              <button
                type="button"
                onClick={handleStripThumbnails}
                className="text-[11px] text-neutral-500 hover:text-rose-500 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>
                  {lang === "en"
                    ? `Delete all images (${storageInfo.thumbnailCount} photos)`
                    : `ลบเฉพาะรูปภาพทั้งหมด (${storageInfo.thumbnailCount} รูป)`}
                </span>
              </button>
            )}
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              {t("settings_api_key_title")}
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:border-neutral-400"
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:underline pt-0.5"
            >
              <span>{t("settings_api_key_link")}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Quota Progress Bar */}
            <div className="pt-2">
              <QuotaMeter />
            </div>
          </div>

          {/* Reset All Data */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {confirmClear ? (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-xs text-rose-500 font-medium">
                  {t("settings_clear_confirm_prompt")}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-xs font-medium"
                  >
                    {t("settings_clear_action")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1 text-neutral-500 text-xs font-medium"
                  >
                    {t("settings_cancel_action")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs text-neutral-400 hover:text-rose-500 transition"
              >
                {t("settings_clear_btn")}
              </button>
            )}
          </div>

          {/* App Version Info */}
          <div className="pt-3 pb-1 text-center text-neutral-400 dark:text-neutral-500 text-[11px] border-t border-neutral-100 dark:border-neutral-800">
            <span className="font-medium">calCal v1.1.0</span>
            <span className="mx-1.5">•</span>
            <span>Next.js & Firebase Cloud</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition active:scale-95"
          >
            {lang === "en" ? "Close" : "ปิด"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold tracking-tight transition active:scale-95 shadow-sm"
          >
            {t("settings_save_btn")}
          </button>
        </div>
      </div>
    </div>
  );
};
