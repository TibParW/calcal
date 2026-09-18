import React, { useRef, useState, useEffect } from "react";
import { Camera, FileText, Image as ImageIcon, Plus, Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getApiQuotaUsage } from "@/lib/storage";
import { ApiQuotaUsage } from "@/types";

interface CameraActionProps {
  onImageSelected: (file: File, scanMode: "food" | "nutrition_label") => void;
  onOpenManualEntry: () => void;
  onOpenSettings?: () => void;
  disabled?: boolean;
}

export const CameraAction: React.FC<CameraActionProps> = ({
  onImageSelected,
  onOpenManualEntry,
  onOpenSettings,
  disabled = false,
}) => {
  const { t, lang } = useLanguage();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const labelCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingScanMode, setPendingScanMode] = useState<"food" | "nutrition_label">("food");

  const [quota, setQuota] = useState<ApiQuotaUsage>({
    requestsThisMinute: 0,
    rpmLimit: 15,
    requestsToday: 0,
    rpdLimit: 1500,
    cooldownUntil: null,
  });
  const [cooldownSec, setCooldownSec] = useState<number>(0);

  useEffect(() => {
    const checkQuota = () => {
      const q = getApiQuotaUsage();
      setQuota(q);
      if (q.cooldownUntil && q.cooldownUntil > Date.now()) {
        setCooldownSec(Math.max(0, Math.ceil((q.cooldownUntil - Date.now()) / 1000)));
      } else {
        setCooldownSec(0);
      }
    };

    checkQuota();
    const interval = setInterval(checkQuota, 1000);
    return () => clearInterval(interval);
  }, []);

  const rpmRemaining = Math.max(0, quota.rpmLimit - quota.requestsThisMinute);
  const isLowQuota = rpmRemaining <= 3;
  const isMaxRpm = rpmRemaining === 0;
  const inCooldown = cooldownSec > 0;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "food" | "nutrition_label"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file, mode);
    }
    e.target.value = "";
  };

  const handleGalleryClick = () => {
    setPendingScanMode("food");
    galleryInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, "food")}
        disabled={disabled}
      />
      <input
        ref={labelCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, "nutrition_label")}
        disabled={disabled}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, pendingScanMode)}
        disabled={disabled}
      />

      {/* Ultra-Minimalist Live AI Quota Indicator */}
      <button
        type="button"
        onClick={onOpenSettings}
        title={
          lang === "en"
            ? `AI Quota: ${rpmRemaining}/15 remaining`
            : `โควตาสแกน AI: เหลืออีก ${rpmRemaining}/15 ครั้ง`
        }
        className="w-full flex items-center justify-between px-1 py-0.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer select-none group"
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              inCooldown ? "bg-rose-500 animate-ping" : isLowQuota ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          <span className="text-[11px] font-medium tracking-tight">
            {inCooldown
              ? (lang === "en" ? `Resetting in ${cooldownSec}s` : `รีเซ็ตใน ${cooldownSec} วิ`)
              : (lang === "en" ? `AI Quota (remaining ${rpmRemaining}/15)` : `โควตา AI (เหลือ ${rpmRemaining}/15)`)}
          </span>
        </div>

        {/* Slender Micro Bar */}
        <div className="flex items-center gap-2">
          <div className="w-20 sm:w-24 h-1 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                inCooldown ? "bg-rose-500" : isLowQuota ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{
                width: inCooldown
                  ? `${Math.max(6, Math.min(100, (cooldownSec / 60) * 100))}%`
                  : `${Math.min(100, (rpmRemaining / 15) * 100)}%`,
              }}
            />
          </div>
          <span className="font-mono text-[10px] font-medium text-neutral-500 dark:text-neutral-400 min-w-[32px] text-right">
            {inCooldown ? `${cooldownSec}s` : `${rpmRemaining}/15`}
          </span>
        </div>
      </button>

      {/* Hero Primary Action: Camera Scan */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={disabled}
        className="w-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 font-semibold py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-40 shadow-sm hover:shadow-md group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold block leading-tight">{t("cam_scan_food")}</span>
            <span className="text-[11px] opacity-70 block mt-0.5">{t("cam_scan_food_sub")}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium bg-white/15 dark:bg-black/10 px-2.5 py-1 rounded-full shrink-0">
          <span>AI 2s</span>
          <span>⚡</span>
        </div>
      </button>

      {/* Secondary Compact Actions (3 columns: Label OCR, Manual Text, Gallery) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => labelCameraInputRef.current?.click()}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium text-xs transition active:scale-95 disabled:opacity-40"
        >
          <FileText className="w-4 h-4 stroke-[2] text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-medium tracking-tight truncate max-w-full">{t("cam_scan_label")}</span>
        </button>

        <button
          onClick={onOpenManualEntry}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium text-xs transition active:scale-95 disabled:opacity-40"
        >
          <Plus className="w-4 h-4 stroke-[2] text-neutral-400" />
          <span className="text-[11px] font-medium tracking-tight truncate max-w-full">{t("cam_manual")}</span>
        </button>

        <button
          onClick={handleGalleryClick}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium text-xs transition active:scale-95 disabled:opacity-40"
        >
          <ImageIcon className="w-4 h-4 stroke-[2] text-neutral-400" />
          <span className="text-[11px] font-medium tracking-tight truncate max-w-full">{t("cam_gallery")}</span>
        </button>
      </div>
    </div>
  );
};
