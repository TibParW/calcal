import React from "react";
import { WeeklyOverviewData } from "@/lib/storage";

interface WeeklyChartProps {
  data: WeeklyOverviewData;
  onSelectDate?: (date: string) => void;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
  data,
  onSelectDate,
}) => {
  const { days, weeklyAverage, daysWithinGoal, activeDaysCount } = data;

  // Find max value to scale chart appropriately (minimum 2500)
  const maxCalories = Math.max(
    2400,
    ...days.map((d) => Math.max(d.totalCalories, d.goal))
  );

  return (
    <div className="bg-white dark:bg-[#141417] rounded-3xl p-4 border border-neutral-200/60 dark:border-neutral-800/60 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            สรุป 7 วันล่าสุด
          </span>
          <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            เฉลี่ย {weeklyAverage.toLocaleString()} <span className="text-xs font-normal text-neutral-400">kcal/วัน</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-neutral-400 block">
            คุมตามเป้า
          </span>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {daysWithinGoal} จาก {activeDaysCount} วันที่บันทึก
          </span>
        </div>
      </div>

      {/* Bars Chart */}
      <div className="h-32 pt-4 flex items-end justify-between gap-2 select-none">
        {days.map((day) => {
          const heightPercent = Math.min(
            100,
            Math.max(4, Math.round((day.totalCalories / maxCalories) * 100))
          );
          const isOver = day.totalCalories > day.goal;
          const hasLogged = day.totalCalories > 0;

          let barColor = "bg-neutral-200 dark:bg-neutral-800";
          if (hasLogged) {
            barColor = isOver
              ? "bg-rose-400 dark:bg-rose-500"
              : "bg-emerald-500 dark:bg-emerald-400";
          }

          return (
            <div
              key={day.date}
              onClick={() => onSelectDate && onSelectDate(day.date)}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition text-[9px] font-medium text-neutral-500 dark:text-neutral-400 mb-1 pointer-events-none">
                {hasLogged ? `${day.totalCalories}` : "-"}
              </div>

              {/* Bar Container */}
              <div className="w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-lg h-24 flex items-end p-0.5 overflow-hidden">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${barColor}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Day Label */}
              <div className="mt-1.5 text-center">
                <span
                  className={`text-[10px] font-medium block leading-none ${
                    day.isToday
                      ? "text-neutral-900 dark:text-white font-bold"
                      : "text-neutral-400"
                  }`}
                >
                  {day.dayLabel}
                </span>
                <span className="text-[8px] text-neutral-300 dark:text-neutral-600 block mt-0.5 leading-none">
                  {day.formattedDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
