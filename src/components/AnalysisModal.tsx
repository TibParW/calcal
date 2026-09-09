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
} from "lucide-react";

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
  onSave,
  onRetry,
  onReAnalyzeWithNote,
  onSaveApiKey,
}) => {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<EditableFoodItem[]>([]);
  const [userNote, setUserNote] = useState<string>(initialNote);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

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
      onSaveApiKey(customApiKey.trim());
      setShowKeyInput(false);
      onRetry();
    }
  };

  const isNutritionMode = scanMode === "nutrition_label";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-neutral-200/60 dark:border-neutral-800/60">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
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
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition"
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
                    <span>
                      {isNutritionMode
                        ? (lang === "en" ? "Reading nutrition facts table..." : "กำลังอ่านตารางโภชนาการ...")
                        : (lang === "en" ? "AI detecting food items..." : "AI กำลังแยกแยะเมนูอาหาร...")}
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
          {error && !isLoading && (
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-700 dark:text-neutral-300 space-y-3">
              <p className="font-semibold text-rose-500">{error}</p>

              {(error.includes("API Key") || showKeyInput) && (
                <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                    <Key className="w-3 h-3 text-neutral-400" />
                    {t("modal_api_key_prompt")}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#1c1c20] border border-neutral-200 dark:border-neutral-700"
                    />
                    <button
                      onClick={handleSaveCustomKey}
                      className="px-3 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
                    >
                      {t("modal_api_key_btn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
          {error && !isLoading ? (
            <>
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("modal_retry")}</span>
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
