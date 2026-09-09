import React from "react";

interface CalorieRingProps {
  consumed: number;
  goal: number;
}

export const CalorieRing: React.FC<CalorieRingProps> = ({ consumed, goal }) => {
  const safeGoal = Math.max(1, goal);
  const percentage = Math.min(Math.round((consumed / safeGoal) * 100), 100);
  const remaining = safeGoal - consumed;
  const isOver = remaining < 0;

  // Slender, modern ring geometry
  const size = 184;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (percentage / 100) * circumference;

  // Subtle status color
  let ringColor = "#10b981"; // Emerald
  if (isOver) {
    ringColor = "#f43f5e"; // Rose
  } else if (percentage >= 85) {
    ringColor = "#f59e0b"; // Amber
  }

  return (
    <div className="bg-white dark:bg-[#141417] rounded-3xl p-6 border border-neutral-200/60 dark:border-neutral-800/60 flex flex-col items-center justify-center transition-all">
      {/* SVG Minimal Ring */}
      <div className="relative w-[184px] h-[184px] flex items-center justify-center">
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Subtle Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-neutral-100 dark:text-neutral-800/80"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Minimal Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-[11px] font-medium tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-0.5">
            พลังงานที่กิน
          </span>

          <div className="flex items-baseline justify-center gap-1 my-0.5">
            <span className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              {consumed.toLocaleString()}
            </span>
          </div>

          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            / {goal.toLocaleString()} kcal
          </span>
        </div>
      </div>

      {/* Minimal Status Subtext */}
      <div className="mt-3 text-center">
        {isOver ? (
          <span className="text-xs font-medium text-rose-500">
            เกินเป้าหมาย {Math.abs(remaining).toLocaleString()} kcal
          </span>
        ) : (
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            เหลืออีก <span className="font-semibold text-neutral-800 dark:text-neutral-200">{remaining.toLocaleString()} kcal</span> ({percentage}%)
          </span>
        )}
      </div>
    </div>
  );
};
