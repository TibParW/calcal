import React, { useState } from "react";
import { X, Sparkles, Check, Calculator } from "lucide-react";
import { calculateTdee, UserBodyProfile } from "@/lib/tdee";
import { UserSettings } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface TdeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGoals: (newGoals: {
    daily_goal: number;
    protein_goal_g: number;
    carbs_goal_g: number;
    fat_goal_g: number;
  }) => void;
}

export const TdeeModal: React.FC<TdeeModalProps> = ({
  isOpen,
  onClose,
  onApplyGoals,
}) => {
  const { lang, t } = useLanguage();
  const [profile, setProfile] = useState<UserBodyProfile>({
    gender: "male",
    age: 26,
    weightKg: 68,
    heightCm: 172,
    activityLevel: "light",
    goal: "lose",
  });

  if (!isOpen) return null;

  const result = calculateTdee(profile);

  const handleApply = () => {
    onApplyGoals({
      daily_goal: result.targetCalories,
      protein_goal_g: result.targetProteinG,
      carbs_goal_g: result.targetCarbsG,
      fat_goal_g: result.targetFatG,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-neutral-200/60 dark:border-neutral-800/60">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              {t("tdee_title")}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1 text-xs">
          {/* Gender */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              {t("tdee_gender")}
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: "male" })}
                className={`py-1.5 rounded-lg text-xs font-medium transition ${
                  profile.gender === "male"
                    ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {t("tdee_male")}
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: "female" })}
                className={`py-1.5 rounded-lg text-xs font-medium transition ${
                  profile.gender === "female"
                    ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {t("tdee_female")}
              </button>
            </div>
          </div>

          {/* Age, Weight, Height */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                {t("tdee_age")}
              </label>
              <input
                type="number"
                min="12"
                max="100"
                value={profile.age}
                onChange={(e) =>
                  setProfile({ ...profile, age: Math.max(1, Number(e.target.value)) })
                }
                className="w-full px-3 py-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-semibold text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                {t("tdee_weight")}
              </label>
              <input
                type="number"
                min="20"
                max="250"
                step="0.5"
                value={profile.weightKg}
                onChange={(e) =>
                  setProfile({ ...profile, weightKg: Math.max(1, Number(e.target.value)) })
                }
                className="w-full px-3 py-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-semibold text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                {t("tdee_height")}
              </label>
              <input
                type="number"
                min="100"
                max="250"
                value={profile.heightCm}
                onChange={(e) =>
                  setProfile({ ...profile, heightCm: Math.max(1, Number(e.target.value)) })
                }
                className="w-full px-3 py-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-semibold text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              {t("tdee_activity")}
            </label>
            <select
              value={profile.activityLevel}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  activityLevel: e.target.value as UserBodyProfile["activityLevel"],
                })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 font-medium text-neutral-900 dark:text-white text-xs focus:outline-none"
            >
              <option value="sedentary">{t("tdee_act_sedentary")}</option>
              <option value="light">{t("tdee_act_light")}</option>
              <option value="moderate">{t("tdee_act_moderate")}</option>
              <option value="heavy">{t("tdee_act_active")}</option>
            </select>
          </div>

          {/* Goal Selection */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              {t("tdee_goal")}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, goal: "lose" })}
                className={`py-2 px-1 rounded-lg text-[11px] font-medium transition ${
                  profile.goal === "lose"
                    ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {t("tdee_goal_loss")}
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, goal: "maintain" })}
                className={`py-2 px-1 rounded-lg text-[11px] font-medium transition ${
                  profile.goal === "maintain"
                    ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {t("tdee_goal_maintain")}
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, goal: "gain" })}
                className={`py-2 px-1 rounded-lg text-[11px] font-medium transition ${
                  profile.goal === "gain"
                    ? "bg-white dark:bg-[#1e1e24] text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {t("tdee_goal_gain")}
              </button>
            </div>
          </div>

          {/* Calculation Result Card */}
          <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">
                {t("tdee_bmr_label")}:
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {result.bmr.toLocaleString()} {t("ring_kcal")}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">
                {t("tdee_tdee_label")}:
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {result.tdee.toLocaleString()} {t("ring_kcal")}
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  {t("tdee_target_label")}
                </span>
                <span className="text-2xl font-black text-neutral-900 dark:text-white">
                  {result.targetCalories.toLocaleString()}
                  <span className="text-xs font-normal text-neutral-400 ml-1">{t("ring_kcal")}</span>
                </span>
              </div>

              {/* Recommended Macros */}
              <div className="text-right text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="block font-medium">
                  P: <strong className="text-neutral-800 dark:text-neutral-200">{result.targetProteinG}{t("macro_g")}</strong>
                </span>
                <span className="block font-medium">
                  C: <strong className="text-neutral-800 dark:text-neutral-200">{result.targetCarbsG}{t("macro_g")}</strong> · F: <strong className="text-neutral-800 dark:text-neutral-200">{result.targetFatG}{t("macro_g")}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold tracking-tight transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{t("tdee_apply_btn")} ({result.targetCalories} {t("ring_kcal")})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
