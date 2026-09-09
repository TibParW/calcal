import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatThaiDate, getLocalDateString, shiftDate } from "@/lib/storage";

interface DateNavigatorProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onSelectDate,
}) => {
  const today = getLocalDateString();
  const isToday = currentDate === today;

  const handlePrev = () => {
    onSelectDate(shiftDate(currentDate, -1));
  };

  const handleNext = () => {
    onSelectDate(shiftDate(currentDate, 1));
  };

  const handleJumpToday = () => {
    onSelectDate(today);
  };

  return (
    <div className="flex items-center justify-between py-1 px-1">
      <button
        onClick={handlePrev}
        aria-label="วันก่อนหน้า"
        className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition active:scale-90"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2]" />
      </button>

      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm tracking-tight text-neutral-800 dark:text-neutral-200">
          {formatThaiDate(currentDate)}
        </span>
        <span className="text-xs text-neutral-400 font-normal">
          ({currentDate})
        </span>

        {!isToday && (
          <button
            onClick={handleJumpToday}
            className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline ml-1 transition"
          >
            กลับวันนี้
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        aria-label="วันถัดไป"
        className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition active:scale-90"
      >
        <ChevronRight className="w-4 h-4 stroke-[2]" />
      </button>
    </div>
  );
};
