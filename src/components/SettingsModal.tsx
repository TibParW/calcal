import React, { useState, useEffect } from "react";
import { UserSettings, StorageUsageInfo } from "@/types";
import {
  X,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  clearAllData,
  getStorageUsageInfo,
  stripOldThumbnails,
} from "@/lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onDataReset: () => void;
  onOpenTdeeModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onDataReset,
  onOpenTdeeModal,
}) => {
  const [dailyGoal, setDailyGoal] = useState(settings.daily_goal || 2000);
  const [proteinGoal, setProteinGoal] = useState(settings.protein_goal_g || 100);
  const [carbsGoal, setCarbsGoal] = useState(settings.carbs_goal_g || 250);
  const [fatGoal, setFatGoal] = useState(settings.fat_goal_g || 65);
  const [apiKey, setApiKey] = useState(settings.gemini_api_key || "");
  const [storageMode, setStorageMode] = useState<'ultra_light' | 'micro_thumbnail'>(
    settings.storage_mode || "ultra_light"
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageUsageInfo>({
    totalBytes: 0,
    totalKb: 0,
    totalMeals: 0,
    totalDays: 0,
    thumbnailCount: 0,
    thumbnailBytes: 0,
  });

  const refreshStorage = () => {
    setStorageInfo(getStorageUsageInfo());
  };

  useEffect(() => {
    if (isOpen) {
      setDailyGoal(settings.daily_goal || 2000);
      setProteinGoal(settings.protein_goal_g || 100);
      setCarbsGoal(settings.carbs_goal_g || 250);
      setFatGoal(settings.fat_goal_g || 65);
      setApiKey(settings.gemini_api_key || "");
      setStorageMode(settings.storage_mode || "ultra_light");
      refreshStorage();
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({
      daily_goal: Number(dailyGoal) || 2000,
      protein_goal_g: Number(proteinGoal) || 100,
      carbs_goal_g: Number(carbsGoal) || 250,
      fat_goal_g: Number(fatGoal) || 65,
      gemini_api_key: apiKey.trim(),
      storage_mode: storageMode,
    });
    onClose();
  };

  const handleStripThumbnails = () => {
    const { prunedCount, savedKb } = stripOldThumbnails(0);
    alert(`ลบรูปภาพย่อเรียบร้อยแล้ว (${prunedCount} รูป) ประหยัดพื้นที่ได้ ${savedKb} KB โดยข้อมูลอาหารยังอยู่ครบ`);
    refreshStorage();
    onDataReset();
  };

  const handleClear = () => {
    clearAllData();
    setConfirmClear(false);
    refreshStorage();
    onDataReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-neutral-200/60 dark:border-neutral-800/60">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            ตั้งค่า
          </span>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1 text-xs">
          {/* Calorie Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                เป้าหมายแคลอรีต่อวัน
              </span>
              {onOpenTdeeModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTdeeModal();
                  }}
                  className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  คำนวณจากร่างกาย (BMR / TDEE)
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="500"
                max="8000"
                step="50"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-neutral-400"
              />
              <span className="text-neutral-400 font-medium">kcal</span>
            </div>

            {/* Macros target */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">โปรตีน (g)</span>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">คาร์บ (g)</span>
                <input
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">ไขมัน (g)</span>
                <input
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-center font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Storage Mode */}
          <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                การเก็บข้อมูลในเครื่อง
              </span>
              <span className="text-[11px] font-medium text-neutral-500">
                ใช้ไป {storageInfo.totalKb} KB
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStorageMode("ultra_light")}
                className={`p-3 rounded-2xl border text-left transition ${
                  storageMode === "ultra_light"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <span className="font-semibold block text-xs">เบาพิเศษ (Ultra-Light)</span>
                <span className="text-[10px] opacity-70 block mt-0.5">
                  ไม่เก็บรูปภาพ (~0.2 KB/มื้อ)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStorageMode("micro_thumbnail")}
                className={`p-3 rounded-2xl border text-left transition ${
                  storageMode === "micro_thumbnail"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm"
                    : "bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/50 dark:border-neutral-700/50"
                }`}
              >
                <span className="font-semibold block text-xs">รูปจิ๋ว (Thumbnail)</span>
                <span className="text-[10px] opacity-70 block mt-0.5">
                  ย่อรูป 80px (~3 KB/มื้อ)
                </span>
              </button>
            </div>

            {storageInfo.thumbnailCount > 0 && (
              <button
                type="button"
                onClick={handleStripThumbnails}
                className="text-[11px] text-neutral-500 hover:text-rose-500 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>ลบเฉพาะรูปภาพทั้งหมด ({storageInfo.thumbnailCount} รูป)</span>
              </button>
            )}
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Gemini API Key (เฉพาะเครื่องนี้)
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:border-neutral-400"
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:underline pt-0.5"
            >
              <span>ขอรับ API Key ฟรีที่ Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Reset All Data */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {confirmClear ? (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-xs text-rose-500 font-medium">ยืนยันล้างข้อมูลทั้งหมด?</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-xs font-medium"
                  >
                    ล้าง
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1 text-neutral-500 text-xs font-medium"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs text-neutral-400 hover:text-rose-500 transition"
              >
                ล้างข้อมูลและประวัติทั้งหมดในเครื่อง
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-2xl text-xs font-semibold tracking-tight transition active:scale-95 shadow-sm"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
