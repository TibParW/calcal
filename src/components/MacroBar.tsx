import React from "react";
import { UserSettings } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
  settings: UserSettings;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  protein,
  carbs,
  fat,
  settings,
}) => {
  const { t } = useLanguage();
  const pGoal = settings.protein_goal_g || 100;
  const cGoal = settings.carbs_goal_g || 250;
  const fGoal = settings.fat_goal_g || 65;

  const pPercent = Math.min(Math.round((protein / pGoal) * 100), 100);
  const cPercent = Math.min(Math.round((carbs / cGoal) * 100), 100);
  const fPercent = Math.min(Math.round((fat / fGoal) * 100), 100);

  return (
    <div className="bg-white dark:bg-[#141417] rounded-3xl p-4 border border-neutral-200/60 dark:border-neutral-800/60">
      <div className="grid grid-cols-3 gap-3">
        {/* Protein */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-neutral-500 dark:text-neutral-400 text-[11px]">
              {t("macro_protein")}
            </span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
              {protein}{t("macro_g")}
            </span>
          </div>
          <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${pPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400">
            {t("ring_goal")} {pGoal}{t("macro_g")}
          </span>
        </div>

        {/* Carbs */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-neutral-500 dark:text-neutral-400 text-[11px]">
              {t("macro_carbs")}
            </span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
              {carbs}{t("macro_g")}
            </span>
          </div>
          <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${cPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400">
            {t("ring_goal")} {cGoal}{t("macro_g")}
          </span>
        </div>

        {/* Fat */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-neutral-500 dark:text-neutral-400 text-[11px]">
              {t("macro_fat")}
            </span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
              {fat}{t("macro_g")}
            </span>
          </div>
          <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-400 rounded-full transition-all duration-500"
              style={{ width: `${fPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400">
            {t("ring_goal")} {fGoal}{t("macro_g")}
          </span>
        </div>
      </div>
    </div>
  );
};
