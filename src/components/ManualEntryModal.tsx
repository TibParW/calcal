import React, { useState } from "react";
import { X } from "lucide-react";
import { Macronutrients } from "@/types";
import { getLocalTimeString } from "@/lib/storage";
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
  const { t } = useLanguage();
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState<number | "">("");
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [time, setTime] = useState(getLocalTimeString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || calories === "" || Number(calories) < 0) return;

    onSave({
      food_name: foodName.trim(),
      calories: Number(calories),
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col border border-neutral-200/60 dark:border-neutral-800/60">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {t("manual_title")}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition"
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
            <input
              type="text"
              required
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder={t("manual_name_placeholder")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                {t("manual_calories")}
              </label>
              <input
                type="number"
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
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${t("macro_protein")} (${t("macro_g")})`}
                className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-xs text-center focus:outline-none focus:border-neutral-400"
              />
              <input
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${t("macro_carbs")} (${t("macro_g")})`}
                className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-xs text-center focus:outline-none focus:border-neutral-400"
              />
              <input
                type="number"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${t("macro_fat")} (${t("macro_g")})`}
                className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-xs text-center focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!foodName.trim() || calories === ""}
              className="w-full py-3 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold tracking-tight transition active:scale-95 disabled:opacity-40"
            >
              {t("manual_save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
