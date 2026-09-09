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
  const isHighRpm = quota.requestsThisMinute >= 12;
  const isMaxRpm = quota.requestsThisMinute >= quota.rpmLimit;
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

      {/* Live AI Quota Progress Bar */}
      <div
        onClick={onOpenSettings}
        role="button"
        tabIndex={0}
        title={lang === "en" ? "Click to view full API Quota in Settings" : "แตะเพื่อดูรายละเอียดโควตาในหน้าตั้งค่า"}
        className="p-2.5 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 transition hover:border-neutral-300 dark:hover:border-neutral-700 active:scale-[0.99] space-y-1.5 cursor-pointer shadow-xs"
      >
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Zap className={`w-3.5 h-3.5 ${inCooldown ? "text-rose-500 animate-spin" : isHighRpm ? "text-amber-500" : "text-emerald-500"}`} />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {inCooldown
                ? (lang === "en" ? `Quota resetting in ${cooldownSec}s...` : `รีเซ็ตโควตาใน ${cooldownSec} วินาที...`)
                : (lang === "en" ? "AI Scans Remaining" : "โควตาสแกน AI")}
            </span>
          </div>

          <span className="font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100">
            {inCooldown
              ? `${cooldownSec}s`
              : `${rpmRemaining}/15 ${lang === "en" ? "left" : "ครั้ง"}`}
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              inCooldown ? "bg-rose-500" : isHighRpm ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{
              width: inCooldown
                ? `${Math.max(4, Math.min(100, (cooldownSec / 60) * 100))}%`
                : `${Math.max(4, Math.min(100, (rpmRemaining / 15) * 100))}%`,
            }}
          />
        </div>

        {/* Sub-label */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
          <span>{lang === "en" ? "15 req/min limit" : "ความถี่ 15 ครั้ง/นาที"}</span>
          <span>{lang === "en" ? `Today: ${quota.requestsToday} scans` : `วันนี้สแกนไป: ${quota.requestsToday} ครั้ง`}</span>
        </div>
      </div>

      {/* Primary Scan Buttons (Food & Nutrition Label) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Food & Multi-dish camera */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="bg-neutral-900 hover:bg-black text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 font-medium py-3.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition active:scale-[0.98] disabled:opacity-40 shadow-sm"
        >
          <Camera className="w-5 h-5 stroke-[2]" />
          <span className="text-xs font-semibold tracking-tight">{t("cam_scan_food")}</span>
          <span className="text-[10px] opacity-70">{t("cam_scan_food_sub")}</span>
        </button>

        {/* Nutrition Facts Label camera */}
        <button
          onClick={() => labelCameraInputRef.current?.click()}
          disabled={disabled}
          className="bg-white dark:bg-[#141417] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 font-medium py-3.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition active:scale-[0.98] disabled:opacity-40 border border-neutral-200/70 dark:border-neutral-800/70 shadow-sm"
        >
          <FileText className="w-5 h-5 stroke-[2] text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold tracking-tight">{t("cam_scan_label")}</span>
          <span className="text-[10px] text-neutral-400">{t("cam_scan_label_sub")}</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleGalleryClick}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium text-xs transition active:scale-95 disabled:opacity-40"
        >
          <ImageIcon className="w-3.5 h-3.5 stroke-[2] text-neutral-400" />
          <span>{t("cam_gallery")}</span>
        </button>

        <button
          onClick={onOpenManualEntry}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-medium text-xs transition active:scale-95 disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2] text-neutral-400" />
          <span>{t("cam_manual")}</span>
        </button>
      </div>
    </div>
  );
};
