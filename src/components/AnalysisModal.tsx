import React, { useState, useEffect } from "react";
import { FoodAnalysisResult, MultiFoodAnalysisResponse } from "@/types";
import {
  X,
  RotateCcw,
  Flame,
  Key,
  Tag,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  Trash2,
  Clock,
} from "lucide-react";
import { getApiQuotaUsage, clearApiCooldown } from "@/lib/storage";

interface EditableFoodItem extends FoodAnalysisResult {
  isSelected: boolean;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePreview: string | null;
  isLoading: boolean;
  response: MultiFoodAnalysisResponse | null;
  error: string | null;
  initialNote?: string;
  scanMode?: "food" | "nutrition_label";
  hasSavedApiKey?: boolean;
  savedApiKeyMasked?: string;
  onSave: (itemsToSave: Array<{
    food_name: string;
    food_name_en?: string;
    calories: number;
    macronutrients: { protein_g: number; carbs_g: number; fat_g: number };
    portion_multiplier: number;
    portion_label: string;
    ingredients?: any[];
    health_tip?: string;
    confidence_level?: "high" | "medium" | "low";
    confidence_reason?: string;
    user_note?: string;
  }>) => void;
  onRetry: () => void;
  onReAnalyzeWithNote?: (note: string) => void;
  onSaveApiKey?: (apiKey: string) => void;
  onOpenManualEntry?: (foodName?: string) => void;
}

import { useLanguage } from "@/context/LanguageContext";

const QUICK_TAGS_TH = [
  "ไม่ใส่น้ำมัน",
  "ไม่เอาหนัง",
  "หวานน้อย",
  "ข้าวน้อย",
  "ไข่ดาวน้ำ",
  "ไม่ใส่กระเทียมเจียว",
];

const QUICK_TAGS_EN = [
  "No oil",
  "No skin",
  "Less sweet",
  "Less rice",
  "Poached egg",
  "No fried garlic",
];

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  imagePreview,
  isLoading,
  response,
  error,
  initialNote = "",
  scanMode = "food",
  hasSavedApiKey = false,
  savedApiKeyMasked,
  onSave,
  onRetry,
  onReAnalyzeWithNote,
  onSaveApiKey,
  onOpenManualEntry,
}) => {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<EditableFoodItem[]>([]);
  const [userNote, setUserNote] = useState<string>(initialNote);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [cooldownSec, setCooldownSec] = useState<number>(0);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Animate loading step stages so the user sees continuous progress
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Monitor live cooldown countdown if rate-limited (HTTP 429)
  useEffect(() => {
    if (!isOpen || !error) {
      setCooldownSec(0);
      return;
    }

    const isQuota =
      error.includes("429") ||
      error.includes("RESOURCE_EXHAUSTED") ||
      error.includes("โควตา") ||
      error.includes("Quota");

    if (!isQuota) return;

    const checkCooldown = () => {
      const q = getApiQuotaUsage();
      if (q.cooldownUntil && q.cooldownUntil > Date.now()) {
        const remaining = Math.max(0, Math.ceil((q.cooldownUntil - Date.now()) / 1000));
        setCooldownSec(remaining);
      } else {
        setCooldownSec(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isOpen, error]);

  const quickTags = lang === "en" ? QUICK_TAGS_EN : QUICK_TAGS_TH;

  // Sync response foods to editable items
  useEffect(() => {
    if (response?.foods && response.foods.length > 0) {
      const initialItems: EditableFoodItem[] = response.foods.map((food, idx) => ({
        ...food,
        id: food.id || `item_${idx}`,
        isSelected: true,
        baseCalories: food.estimated_calories || 0,
        baseProtein: food.macronutrients?.protein_g || 0,
        baseCarbs: food.macronutrients?.carbs_g || 0,
        baseFat: food.macronutrients?.fat_g || 0,
        portion_multiplier: 1.0,
        portion_label: lang === "en" ? "Regular (1.0x)" : "ปกติ (x1.0)",
      }));
      setItems(initialItems);
    } else {
      setItems([]);
    }
  }, [response]);

  useEffect(() => {
    if (isOpen) {
      setUserNote(initialNote || "");
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleToggleSelect = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePortionSelect = (index: number, mult: number, label: string) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          portion_multiplier: mult,
          portion_label: label,
          estimated_calories: Math.round(item.baseCalories * mult),
          macronutrients: {
            protein_g: Math.round(item.baseProtein * mult),
            carbs_g: Math.round(item.baseCarbs * mult),
            fat_g: Math.round(item.baseFat * mult),
          },
        };
      })
    );
  };

  const handleUpdateItem = (
    index: number,
    updates: Partial<EditableFoodItem>
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleToggleTag = (tag: string) => {
    const trimmed = userNote.trim();
    if (trimmed.includes(tag)) {
      const updated = trimmed
        .replace(tag, "")
        .replace(/,\s*,/g, ",")
        .replace(/^,\s*|,\s*$/g, "")
        .trim();
      setUserNote(updated);
    } else {
      const updated = trimmed ? `${trimmed}, ${tag}` : tag;
      setUserNote(updated);
    }
  };

  const selectedItems = items.filter((it) => it.isSelected);
  const totalCalories = selectedItems.reduce(
    (sum, it) => sum + (it.estimated_calories || 0),
    0
  );

  const handleSaveConfirm = () => {
    if (selectedItems.length === 0) return;

    const dataToSave = selectedItems.map((item) => ({
      food_name: item.food_name.trim() || "อาหาร",
      food_name_en: item.food_name_en,
      calories: Math.max(0, item.estimated_calories),
      macronutrients: item.macronutrients,
      portion_multiplier: item.portion_multiplier || 1.0,
      portion_label: item.portion_label || "ปกติ (x1.0)",
      ingredients: item.ingredients_detected,
      health_tip: item.health_tip,
      confidence_level: item.confidence_level,
      confidence_reason: item.confidence_reason,
      user_note: userNote.trim() || undefined,
    }));

    onSave(dataToSave);
  };

  const handleReAnalyze = () => {
    if (onReAnalyzeWithNote) {
      onReAnalyzeWithNote(userNote.trim());
    }
  };

  const handleSaveCustomKey = () => {
    if (customApiKey.trim() && onSaveApiKey) {
      clearApiCooldown();
      setCooldownSec(0);
      onSaveApiKey(customApiKey.trim());
      setShowKeyInput(false);
      onRetry();
    }
  };

  const isNutritionMode = scanMode === "nutrition_label";

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
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              {isLoading
                ? (lang === "en" ? "Analyzing..." : "กำลังวิเคราะห์...")
                : error
                ? (lang === "en" ? "Analysis Failed" : "ไม่สามารถวิเคราะห์ได้")
                : isNutritionMode
                ? t("modal_title_label")
                : items.length > 1
                ? (lang === "en" ? `Detected ${items.length} items in photo` : `ตรวจพบ ${items.length} รายการในรูป`)
                : t("modal_title_food")}
            </span>
            {isNutritionMode && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                OCR 100%
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          {/* Photo Preview with subtle scan line */}
          {imagePreview && (
            <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
              <img
                src={imagePreview}
                alt="Food"
                className="w-full h-full object-cover"
              />

              {isLoading && (
                <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center">
                  <div className="absolute w-full h-0.5 bg-white shadow-lg animate-scanner" />
                  <div className="bg-neutral-900/85 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span className="transition-all duration-300">
                      {isNutritionMode
                        ? (loadingStep === 0
                            ? (lang === "en" ? "Reading nutrition facts table..." : "กำลังอ่านตารางโภชนาการ...")
                            : loadingStep === 1
                            ? (lang === "en" ? "Extracting calories & macros..." : "กำลังถอดรหัสสารอาหาร...")
                            : (lang === "en" ? "Verifying values..." : "กำลังตรวจสอบความถูกต้อง..."))
                        : (loadingStep === 0
                            ? (lang === "en" ? "AI detecting food items..." : "AI กำลังแยกแยะเมนูอาหาร...")
                            : loadingStep === 1
                            ? (lang === "en" ? "Estimating portion sizes..." : "กำลังประเมินขนาดจานและสัดส่วน...")
                            : (lang === "en" ? "Calculating calories & macros..." : "กำลังคำนวณแคลอรีและสารอาหาร..."))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Tags & Meal Note Section (For food mode) */}
          {!isNutritionMode && (
            <div className="space-y-2 p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-neutral-400" />
                  {t("modal_quick_notes_title")}
                </span>
                {items.length > 0 && !isLoading && onReAnalyzeWithNote && userNote.trim() && (
                  <button
                    type="button"
                    onClick={handleReAnalyze}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>{t("modal_recalculate")}</span>
                  </button>
                )}
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => {
                  const isSelected = userNote.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                        isSelected
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                          : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-100"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Custom input */}
              <input
                type="text"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder={t("modal_note_placeholder")}
                className="w-full text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          )}

          {/* Error Message */}
          {error && !isLoading && (() => {
            const isDailyQuota =
              error.includes("DAILY_QUOTA_EXCEEDED") ||
              error.includes("โควตารายวัน") ||
              error.includes("Daily Limit");

            const isKeyError =
              error.includes("MISSING_API_KEY") ||
              error.includes("API_KEY_INVALID") ||
              error.includes("ไม่พบ Gemini API Key") ||
              isDailyQuota;

            const isQuotaError =
              error.includes("429") ||
              error.includes("RESOURCE_EXHAUSTED") ||
              error.includes("โควตา") ||
              error.includes("Quota");

            return (
              <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-700 dark:text-neutral-300 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="font-semibold text-rose-500 leading-snug">
                    {error.replace(/^(?:MISSING_API_KEY|API_KEY_INVALID|DAILY_QUOTA_EXCEEDED):\s*/, "")}
                  </p>
                </div>

                {/* Food Name / Dish Hint Helper when Analysis Fails or Times out */}
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {lang === "en" ? "Help AI recognize this meal" : "ระบุชื่อเมนูอาหารเพื่อช่วย AI"}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {lang === "en" ? "Fast & accurate ⚡" : "คิดเร็วขึ้น & ไม่หมดเวลา ⚡"}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-neutral-600 dark:text-neutral-400 leading-normal">
                    {lang === "en"
                      ? "If AI took too long or was unsure, type what dish is in the photo:"
                      : "หากภาพวิเคราะห์ช้าหรือเมนูซับซ้อน พิมพ์ชื่ออาหารในภาพแล้วกดสแกนใหม่ AI จะคำนวณแคลอรีจากชื่อนี้ทันที:"}
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && userNote.trim()) {
                          e.preventDefault();
                          if (onReAnalyzeWithNote) {
                            onReAnalyzeWithNote(userNote.trim());
                          } else {
                            onRetry();
                          }
                        }
                      }}
                      placeholder={
                        lang === "en"
                          ? "e.g. Mille-feuille, Crispy pancake, Basil pork..."
                          : "เช่น มิลเฟย, ขนมเบื้อง, กะเพราหมู..."
                      }
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#18181c] border border-emerald-300/80 dark:border-emerald-700/80 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      disabled={!userNote.trim()}
                      onClick={() => {
                        if (userNote.trim() && onReAnalyzeWithNote) {
                          onReAnalyzeWithNote(userNote.trim());
                        } else {
                          onRetry();
                        }
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0 transition active:scale-95 disabled:opacity-40 shadow-sm flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === "en" ? "Analyze" : "วิเคราะห์ใหม่"}</span>
                    </button>
                  </div>

                  {onOpenManualEntry && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onOpenManualEntry(userNote.trim())}
                        className="text-[10.5px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white underline flex items-center gap-0.5 transition"
                      >
                        <span>{lang === "en" ? "Or switch to manual entry →" : "หรือเปลี่ยนไปบันทึกข้อมูลเอง (แมนนวล) →"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Cooldown Progress Bar when Rate-Limited (Only if not daily quota) */}
                {!isDailyQuota && (isQuotaError || cooldownSec > 0) && (
                  <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin text-amber-500" />
                        <span>
                          {t("quota_cooldown_msg").replace("{sec}", String(cooldownSec > 0 ? cooldownSec : 60))}
                        </span>
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-300">
                        {cooldownSec > 0 ? cooldownSec : 60}s
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.max(5, Math.min(100, ((cooldownSec > 0 ? cooldownSec : 60) / 60) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {(isKeyError || isQuotaError || showKeyInput) && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    {hasSavedApiKey && !showKeyInput ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Key className="w-3 h-3 text-neutral-400" />
                            {lang === "en" ? "Saved Key in Settings:" : "Key ที่บันทึกไว้ในระบบ:"}
                          </span>
                          <span className="font-mono text-neutral-700 dark:text-neutral-300">
                            {savedApiKeyMasked || "••••••••••••"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowKeyInput(true)}
                          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          {lang === "en" ? "Change or update API Key" : "ต้องการเปลี่ยนหรือใส่ Key ใหม่"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <Key className="w-3 h-3 text-neutral-400" />
                          {t("modal_api_key_prompt")}
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#1c1c20] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                          />
                          <button
                            onClick={handleSaveCustomKey}
                            className="px-3 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold shrink-0"
                          >
                            {t("modal_api_key_btn")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Multi-Dish / Detected Items List */}
          {!isLoading && !error && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, index) => {
                const isHighConfidence = item.confidence_level === "high";
                const displayItemName = lang === "en" ? (item.food_name_en || item.food_name) : item.food_name;
                const subItemName = lang === "en" ? item.food_name : item.food_name_en;

                return (
                  <div
                    key={item.id || index}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      item.isSelected
                        ? "bg-white dark:bg-[#18181c] border-neutral-300/80 dark:border-neutral-700 shadow-sm"
                        : "bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-200/50 dark:border-neutral-800 opacity-60"
                    }`}
                  >
                    {/* Item Top Row: Select Checkbox, Name, and Delete */}
                    <div className="flex items-start gap-2.5 justify-between">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(index)}
                          className="mt-0.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                        >
                          {item.isSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-neutral-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={displayItemName}
                            onChange={(e) =>
                              handleUpdateItem(index, { food_name: e.target.value })
                            }
                            className="font-bold text-sm sm:text-base w-full bg-transparent text-neutral-900 dark:text-white focus:outline-none border-b border-transparent focus:border-neutral-400"
                          />
                          {subItemName && (
                            <span className="text-[11px] text-neutral-400 block truncate">
                              {subItemName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Item Card */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          aria-label="Remove item"
                          className="p-1 text-neutral-300 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Confidence Tag & Reason */}
                    <div className="flex items-start gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isHighConfidence
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {isHighConfidence ? t("modal_confidence_high") : t("modal_confidence_medium")}
                      </span>

                      {item.confidence_reason && (
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 italic leading-tight">
                          ({item.confidence_reason})
                        </span>
                      )}
                    </div>

                    {/* Portion Multiplier */}
                    {!isNutritionMode && (
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl">
                        <button
                          type="button"
                          onClick={() =>
                            handlePortionSelect(index, 0.8, lang === "en" ? "Small (0.8x)" : "จานเล็ก (x0.8)")
                          }
                          className={`py-1 rounded-lg text-[11px] font-medium transition ${
                            item.portion_multiplier === 0.8
                              ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          {lang === "en" ? "Small 0.8x" : "เล็ก 0.8x"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handlePortionSelect(index, 1.0, lang === "en" ? "Regular (1.0x)" : "ปกติ (x1.0)")
                          }
                          className={`py-1 rounded-lg text-[11px] font-medium transition ${
                            item.portion_multiplier === 1.0
                              ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          {lang === "en" ? "Regular 1.0x" : "ปกติ 1.0x"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handlePortionSelect(index, 1.3, lang === "en" ? "Large (1.3x)" : "พิเศษ (x1.3)")
                          }
                          className={`py-1 rounded-lg text-[11px] font-medium transition ${
                            item.portion_multiplier === 1.3
                              ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          {lang === "en" ? "Large 1.3x" : "พิเศษ 1.3x"}
                        </button>
                      </div>
                    )}

                    {/* Calories & Macros Row */}
                    <div className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
                      <div className="flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300 font-semibold">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{lang === "en" ? "Calories:" : "พลังงาน:"}</span>
                        <input
                          type="number"
                          value={item.estimated_calories}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              estimated_calories: Number(e.target.value),
                            })
                          }
                          className="w-16 font-extrabold text-sm bg-transparent border-b border-neutral-300 dark:border-neutral-600 text-right focus:outline-none"
                        />
                        <span className="text-[10px] text-neutral-400">{t("ring_kcal")}</span>
                      </div>

                      {/* Macros in 1 compact line */}
                      <div className="text-[10px] text-neutral-500 font-medium">
                        P: {item.macronutrients.protein_g}g · C: {item.macronutrients.carbs_g}g · F: {item.macronutrients.fat_g}g
                      </div>
                    </div>

                    {/* Ingredients list if any */}
                    {item.ingredients_detected && item.ingredients_detected.length > 0 && (
                      <div className="text-[10px] space-y-0.5 text-neutral-500 dark:text-neutral-400">
                        {item.ingredients_detected.map((ing, ingIdx) => (
                          <div key={ingIdx} className="flex justify-between">
                            <span>• {ing.name} ({ing.portion})</span>
                            <span className="text-neutral-400">~{Math.round(ing.calories * (item.portion_multiplier || 1))} {t("ring_kcal")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 shrink-0">
          {error && !isLoading ? (
            <>
              <button
                type="button"
                disabled={cooldownSec > 0}
                onClick={onRetry}
                className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${cooldownSec > 0 ? "animate-spin" : ""}`} />
                <span>
                  {cooldownSec > 0
                    ? t("quota_retry_in").replace("{sec}", String(cooldownSec))
                    : t("modal_retry")}
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 text-neutral-500 text-xs font-medium hover:text-neutral-900 dark:hover:text-white"
              >
                {lang === "en" ? "Close" : "ปิด"}
              </button>
            </>
          ) : items.length > 0 && !isLoading ? (
            <>
              <button
                type="button"
                onClick={onRetry}
                className="py-3 px-3 rounded-2xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-medium transition"
              >
                {lang === "en" ? "Retake" : "ถ่ายใหม่"}
              </button>
              <button
                type="button"
                disabled={selectedItems.length === 0}
                onClick={handleSaveConfirm}
                className="flex-1 py-3 px-4 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold tracking-tight transition active:scale-95 shadow-sm disabled:opacity-40"
              >
                {t("modal_save_btn", { count: selectedItems.length, cals: totalCalories.toLocaleString() })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-xs font-medium transition"
            >
              {t("manual_cancel")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
