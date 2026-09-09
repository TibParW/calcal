import React, { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Macronutrients } from "@/types";
import { getLocalTimeString, getUserSettings, recordApiScanAttempt, recordApiCooldown } from "@/lib/storage";
import { estimateNutritionFromText } from "@/lib/gemini";
import { useLanguage } from "@/context/LanguageContext";

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: {
    food_name: string;
    calories: number;
    macronutrients: Macronutrients;
    time: string;
  }) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { t, lang } = useLanguage();
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState<number | "">("");
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [time, setTime] = useState(getLocalTimeString());
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateHint, setEstimateHint] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAutoEstimate = async () => {
    const trimmed = foodName.trim();
    if (!trimmed || isEstimating) return;

    setIsEstimating(true);
    setEstimateError(null);
    setEstimateHint(null);

    try {
      const settings = getUserSettings();
      const apiKey = settings.gemini_api_key?.trim();

      const result = await estimateNutritionFromText(trimmed, apiKey);

      // Auto-fill values
      setCalories(result.calories);
      setProtein(result.macronutrients.protein_g);
      setCarbs(result.macronutrients.carbs_g);
      setFat(result.macronutrients.fat_g);

      if (result.source === "ai") {
        // Deduct from API quota and get updated remaining count
        const updatedQuota = recordApiScanAttempt();
        const rpmLeft = Math.max(0, updatedQuota.rpmLimit - updatedQuota.requestsThisMinute);
        setEstimateHint(
          lang === "en"
            ? `✨ AI Estimated: ${result.portion_description} (AI Quota left: ${rpmLeft}/15)`
            : `✨ คำนวณด้วย AI: ${result.portion_description} (โควตานาทีนี้เหลือ ${rpmLeft}/15 ครั้ง)`
        );
      } else {
        // Instant offline match (0 API quota used)
        setEstimateHint(
          lang === "en"
            ? `✨ Instant Offline: ${result.portion_description} (0 AI Quota used)`
            : `✨ ข้อมูลด่วนในเครื่อง: ${result.portion_description} (ไม่เปลืองโควตา AI)`
        );
      }
    } catch (err: any) {
      console.warn("Manual estimate failed:", err);
      const isRateLimit =
        err.message?.includes("429") ||
        err.message?.includes("QUOTA") ||
        err.message?.includes("exhausted");
      if (isRateLimit) {
        recordApiCooldown(60);
      }
      setEstimateError(
        err.message?.replace(/^MISSING_API_KEY:\s*/, "") || "ไม่สามารถคำนวณได้ กรุณากรอกด้วยตนเอง"
      );
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || calories === "" || Number(calories) < 0) return;

    onSave({
      food_name: foodName.trim(),
      calories: Math.round(Number(calories)),
      macronutrients: {
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
      },
      time: time || getLocalTimeString(),
    });

    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setEstimateHint(null);
    setEstimateError(null);
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
            {t("manual_title")}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              {t("manual_name")}
            </label>

            {/* Input Bar with Embedded Right-Side Calculate Button */}
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => {
                  setFoodName(e.target.value);
                  if (estimateError) setEstimateError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && foodName.trim() && calories === "") {
                    e.preventDefault();
                    handleAutoEstimate();
                  }
                }}
                placeholder={t("manual_name_placeholder")}
                className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-400"
              />

              {/* Action Button at the right end of the bar */}
              <button
                type="button"
                onClick={handleAutoEstimate}
                disabled={!foodName.trim() || isEstimating}
                title={t("manual_calc_tooltip")}
                className="absolute right-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer select-none"
              >
                {isEstimating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{t("manual_calculating")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{t("manual_calculate")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Subtle Portion Tip / Error Feedback */}
            {estimateHint && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 animate-in fade-in">
                <span>✨</span>
                <span>{estimateHint}</span>
              </p>
            )}
            {estimateError && (
              <p className="text-[11px] text-rose-500 mt-1.5 animate-in fade-in">
                {estimateError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                {t("manual_calories")}
              </label>
              <input
                type="number"
                step="any"
                required
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="300"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                {t("manual_time")}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1.5">
              {t("manual_macros_title")}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${t("macro_protein")} (${t("macro_g")})`}
                className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-xs text-center focus:outline-none focus:border-neutral-400"
              />
              <input
                type="number"
                step="any"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${t("macro_carbs")} (${t("macro_g")})`}
                className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-xs text-center focus:outline-none focus:border-neutral-400"
              />
              <input
                type="number"
                step="any"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${t("macro_fat")} (${t("macro_g")})`}
                className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-xs text-center focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition active:scale-95"
            >
              {t("manual_cancel")}
            </button>
            <button
              type="submit"
              disabled={!foodName.trim() || calories === ""}
              className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold tracking-tight transition active:scale-95 disabled:opacity-40"
            >
              {t("manual_save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
