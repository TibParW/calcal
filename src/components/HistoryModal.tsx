import React, { useState, useEffect } from "react";
import {
  X,
  FileSpreadsheet,
  Download,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  getFoodLogs,
  getStorageUsageInfo,
  stripOldThumbnails,
  exportLogsAsCsv,
  exportDataAsJson,
  getLocalDateString,
  getPast7DaysSummary,
  WeeklyOverviewData,
} from "@/lib/storage";
import { formatLocalizedDate } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";
import { FoodLogItem, StorageUsageInfo, UserSettings } from "@/types";
import { WeeklyChart } from "@/components/WeeklyChart";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  settings: UserSettings;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  settings,
}) => {
  const { lang, t } = useLanguage();
  const [storageInfo, setStorageInfo] = useState<StorageUsageInfo>({
    totalBytes: 0,
    totalKb: 0,
    totalMeals: 0,
    totalDays: 0,
    thumbnailCount: 0,
    thumbnailBytes: 0,
  });
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyOverviewData>({
    days: [],
    weeklyAverage: 0,
    totalWeeklyCalories: 0,
    activeDaysCount: 0,
    daysWithinGoal: 0,
  });

  const loadData = () => {
    setStorageInfo(getStorageUsageInfo());
    setLogs(getFoodLogs());
    setWeeklyData(getPast7DaysSummary());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Group logs by date
  const groupedByDate: { [date: string]: FoodLogItem[] } = {};
  for (const item of logs) {
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = [];
    }
    groupedByDate[item.date].push(item);
  }

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const handleExportCsv = () => {
    const csv = exportLogsAsCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calCal_logs_${getLocalDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const json = exportDataAsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calCal_backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStripThumbnails = () => {
    if (window.confirm(t("settings_strip_confirm"))) {
      stripOldThumbnails(0);
      loadData();
    }
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
          <div>
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 block">
              {t("hist_title")}
            </span>
            <span className="text-[11px] text-neutral-400">
              {lang === "en"
                ? `Storage ${storageInfo.totalKb} KB (${storageInfo.totalMeals} meals)`
                : `ขนาดในเครื่อง ${storageInfo.totalKb} KB (${storageInfo.totalMeals} มื้อ)`}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1c20] border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1c20] border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>JSON</span>
            </button>
          </div>

          {storageInfo.thumbnailCount > 0 && (
            <button
              onClick={handleStripThumbnails}
              className="text-[11px] text-neutral-400 hover:text-rose-500 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>{lang === "en" ? "Clear Images" : "ลบรูปเก่า"}</span>
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {/* Weekly 7-Day Chart */}
          <WeeklyChart
            data={weeklyData}
            onSelectDate={(targetDate) => {
              onSelectDate(targetDate);
              onClose();
            }}
          />

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              {t("hist_logs_title")}
            </span>
          </div>

          {sortedDates.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              {t("hist_empty")}
            </div>
          ) : (
            sortedDates.map((dateStr) => {
              const dayItems = groupedByDate[dateStr];
              const dayTotalCal = dayItems.reduce((sum, it) => sum + it.calories, 0);
              const goal = settings.daily_goal || 2000;
              const isOver = dayTotalCal > goal;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    onSelectDate(dateStr);
                    onClose();
                  }}
                  className="bg-white dark:bg-[#18181c] rounded-2xl p-3 border border-neutral-200/50 dark:border-neutral-800/50 hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {formatLocalizedDate(dateStr, lang)}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        ({dateStr})
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[200px]">
                      {dayItems.length} {t("hist_meals")}: {dayItems.map((it) => (lang === "en" ? (it.food_name_en || it.food_name) : (it.food_name || it.food_name_en))).join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span
                        className={`font-bold text-sm block ${
                          isOver ? "text-rose-500" : "text-neutral-900 dark:text-neutral-100"
                        }`}
                      >
                        {dayTotalCal.toLocaleString()} <span className="text-[10px] font-normal text-neutral-400">{t("ring_kcal")}</span>
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {Math.round((dayTotalCal / goal) * 100)}%
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-600 dark:text-neutral-600 dark:group-hover:text-neutral-300 transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
