import { FoodLogItem, UserSettings, DailySummary, StorageUsageInfo, ApiQuotaUsage } from "@/types";

const LOGS_STORAGE_KEY = "CALCAL_FOOD_LOGS_V1";
const SETTINGS_STORAGE_KEY = "CALCAL_USER_SETTINGS_V1";

export const DEFAULT_SETTINGS: UserSettings = {
  daily_goal: 2000,
  protein_goal_g: 100,
  carbs_goal_g: 250,
  fat_goal_g: 65,
  storage_mode: "ultra_light", // Default to ultra-light for minimum file size
  auto_prune_days: 30,
};

/**
 * Returns today's date in local YYYY-MM-DD format (avoids UTC timezone shift)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted time HH:mm
 */
export function getLocalTimeString(d: Date = new Date()): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Friendly Thai date formatter
 */
export function formatThaiDate(dateStr: string): string {
  const today = getLocalDateString();
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowDate);

  if (dateStr === today) {
    return "วันนี้";
  } else if (dateStr === yesterdayStr) {
    return "เมื่อวานนี้";
  } else if (dateStr === tomorrowStr) {
    return "พรุ่งนี้";
  }

  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  return `${day} ${thaiMonths[month - 1]} ${year + 543}`;
}

export function shiftDate(dateStr: string, daysOffset: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysOffset);
  return getLocalDateString(date);
}

/**
 * Safe wrapper for localStorage.getItem to handle SSR and iOS Safari Private Browsing
 */
export function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[storage] Failed to get item for key "${key}":`, e);
    return null;
  }
}

/**
 * Safe wrapper for localStorage.setItem to handle QuotaExceededError and iOS Safari Private Mode
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`[storage] Storage quota exceeded or private mode active for key "${key}":`, e);
    // If quota is exceeded when saving logs, try auto-pruning thumbnails to recover space
    if (key === LOGS_STORAGE_KEY) {
      try {
        console.info("[storage] Attempting auto-recovery by stripping old thumbnails...");
        stripOldThumbnails(7);
        localStorage.setItem(key, value);
        return true;
      } catch (innerErr) {
        console.warn("[storage] Recovery by stripping thumbnails failed:", innerErr);
      }
    }
    return false;
  }
}

/**
 * Safe wrapper for localStorage.removeItem
 */
export function safeRemoveItem(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`[storage] Failed to remove item for key "${key}":`, e);
    return false;
  }
}

export function getFoodLogs(): FoodLogItem[] {
  try {
    const raw = safeGetItem(LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load food logs from storage", err);
    return [];
  }
}

export function saveFoodLogs(logs: FoodLogItem[]): boolean {
  try {
    return safeSetItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error("Failed to save food logs to storage", err);
    return false;
  }
}

export function getLogsByDate(dateStr: string): FoodLogItem[] {
  const all = getFoodLogs();
  return all
    .filter((item) => item.date === dateStr)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getDailySummary(dateStr: string): DailySummary {
  const items = getLogsByDate(dateStr);
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const item of items) {
    totalCalories += item.calories || 0;
    if (item.macronutrients) {
      totalProtein += item.macronutrients.protein_g || 0;
      totalCarbs += item.macronutrients.carbs_g || 0;
      totalFat += item.macronutrients.fat_g || 0;
    }
  }

  return {
    date: dateStr,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein),
    totalCarbs: Math.round(totalCarbs),
    totalFat: Math.round(totalFat),
    itemsCount: items.length,
  };
}

export function addFoodLog(item: Omit<FoodLogItem, "id" | "createdAt">): FoodLogItem {
  const all = getFoodLogs();
  const newItem: FoodLogItem = {
    ...item,
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    createdAt: Date.now(),
  };
  all.push(newItem);
  saveFoodLogs(all);
  return newItem;
}

export function deleteFoodLog(id: string): void {
  const all = getFoodLogs();
  const filtered = all.filter((item) => item.id !== id);
  saveFoodLogs(filtered);
}

export function getUserSettings(): UserSettings {
  try {
    const raw = safeGetItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Failed to load user settings", err);
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  try {
    const current = getUserSettings();
    const updated = { ...current, ...settings };
    safeSetItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to save user settings", err);
    return DEFAULT_SETTINGS;
  }
}

export function clearAllData(): void {
  safeRemoveItem(LOGS_STORAGE_KEY);
}

export function exportDataAsJson(): string {
  const logs = getFoodLogs();
  const settings = getUserSettings();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      settings,
      logs,
    },
    null,
    2
  );
}

export function importDataFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed.logs)) {
      saveFoodLogs(parsed.logs);
    }
    if (parsed.settings && typeof parsed.settings === "object") {
      saveUserSettings(parsed.settings);
    }
    return true;
  } catch (err) {
    console.error("Failed to import data", err);
    return false;
  }
}

/**
 * Calculates current device storage footprint in bytes & KB
 */
export function getStorageUsageInfo(): StorageUsageInfo {
  if (typeof window === "undefined") {
    return {
      totalBytes: 0,
      totalKb: 0,
      totalMeals: 0,
      totalDays: 0,
      thumbnailCount: 0,
      thumbnailBytes: 0,
    };
  }

  const logs = getFoodLogs();
  const settings = getUserSettings();

  const logsString = JSON.stringify(logs);
  const settingsString = JSON.stringify(settings);

  // Each character in JS string is 2 bytes (UTF-16) or 1 byte in UTF-8
  const logsBytes = new Blob([logsString]).size;
  const settingsBytes = new Blob([settingsString]).size;
  const totalBytes = logsBytes + settingsBytes;

  let thumbnailCount = 0;
  let thumbnailBytes = 0;
  const datesSet = new Set<string>();

  for (const item of logs) {
    datesSet.add(item.date);
    if (item.thumbnail) {
      thumbnailCount++;
      thumbnailBytes += new Blob([item.thumbnail]).size;
    }
  }

  return {
    totalBytes,
    totalKb: Number((totalBytes / 1024).toFixed(1)),
    totalMeals: logs.length,
    totalDays: datesSet.size,
    thumbnailCount,
    thumbnailBytes: Number((thumbnailBytes / 1024).toFixed(1)),
  };
}

/**
 * Prunes thumbnail image data from logs older than daysThreshold to reclaim storage space.
 * If daysThreshold is 0, removes all thumbnails while keeping 100% of the food text logs.
 */
export function stripOldThumbnails(daysThreshold: number = 30): {
  prunedCount: number;
  savedKb: number;
} {
  const all = getFoodLogs();
  const cutoff = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;
  let prunedCount = 0;
  let beforeBytes = new Blob([JSON.stringify(all)]).size;

  const updated = all.map((item) => {
    if (item.thumbnail && (daysThreshold === 0 || item.createdAt < cutoff)) {
      prunedCount++;
      const { thumbnail, ...rest } = item;
      return rest as FoodLogItem;
    }
    return item;
  });

  saveFoodLogs(updated);
  let afterBytes = new Blob([JSON.stringify(updated)]).size;
  let savedKb = Number(((beforeBytes - afterBytes) / 1024).toFixed(1));

  return { prunedCount, savedKb };
}

/**
 * Exports logs as a clean UTF-8 CSV with BOM for Microsoft Excel / Sheets compatibility.
 */
export function exportLogsAsCsv(): string {
  const logs = getFoodLogs();
  // Sort oldest to newest for chronological spreadsheet
  const sorted = [...logs].sort((a, b) => a.createdAt - b.createdAt);

  const headers = [
    "วันที่",
    "เวลา",
    "ชื่ออาหาร",
    "ชื่ออาหาร (EN)",
    "แคลอรี (kcal)",
    "โปรตีน (g)",
    "คาร์โบไฮเดรต (g)",
    "ไขมัน (g)",
    "ขนาดจาน",
  ];

  const rows = sorted.map((item) => [
    `"${item.date}"`,
    `"${item.time}"`,
    `"${(item.food_name || "").replace(/"/g, '""')}"`,
    `"${(item.food_name_en || "").replace(/"/g, '""')}"`,
    item.calories || 0,
    item.macronutrients?.protein_g || 0,
    item.macronutrients?.carbs_g || 0,
    item.macronutrients?.fat_g || 0,
    `"${item.portion_label || "ปกติ"}"`,
  ]);

  // \uFEFF ensures UTF-8 BOM so Excel opens Thai characters without garbled text
  const csvContent =
    "\uFEFF" +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  return csvContent;
}

export interface DaySummaryItem {
  date: string;
  dayLabel: string;
  formattedDate: string;
  totalCalories: number;
  goal: number;
  isToday: boolean;
}

export interface WeeklyOverviewData {
  days: DaySummaryItem[];
  weeklyAverage: number;
  totalWeeklyCalories: number;
  activeDaysCount: number;
  daysWithinGoal: number;
}

export function getPast7DaysSummary(): WeeklyOverviewData {
  const settings = getUserSettings();
  const goal = settings.daily_goal || 2000;
  const today = getLocalDateString();
  const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  const days: DaySummaryItem[] = [];
  let totalWeeklyCalories = 0;
  let activeDaysCount = 0;
  let daysWithinGoal = 0;

  for (let i = 6; i >= 0; i--) {
    const targetDateStr = shiftDate(today, -i);
    const summary = getDailySummary(targetDateStr);
    const [y, m, d] = targetDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayLabel = dayNames[dateObj.getDay()];

    const isToday = targetDateStr === today;
    const totalCalories = summary.totalCalories;

    totalWeeklyCalories += totalCalories;
    if (totalCalories > 0) {
      activeDaysCount++;
      if (totalCalories <= goal) {
        daysWithinGoal++;
      }
    }

    days.push({
      date: targetDateStr,
      dayLabel,
      formattedDate: `${d}/${m}`,
      totalCalories,
      goal,
      isToday,
    });
  }

  const weeklyAverage = activeDaysCount > 0 ? Math.round(totalWeeklyCalories / activeDaysCount) : 0;

  return {
    days,
    weeklyAverage,
    totalWeeklyCalories,
    activeDaysCount,
    daysWithinGoal,
  };
}

/* =========================================================================
 * API Quota & Rate Limit Tracking (Client-Side Sliding Window)
 * ========================================================================= */

const QUOTA_STORAGE_KEY = "CALCAL_API_QUOTA_V1";
const RPM_LIMIT = 15;
const RPD_LIMIT = 1500;

interface StoredQuotaState {
  timestamps: number[];
  dailyDate: string;
  dailyCount: number;
  cooldownUntil: number | null;
}

export function getApiQuotaUsage(): ApiQuotaUsage {
  try {
    const raw = safeGetItem(QUOTA_STORAGE_KEY);
    const now = Date.now();
    const today = getLocalDateString();

    if (!raw) {
      return {
        requestsThisMinute: 0,
        rpmLimit: RPM_LIMIT,
        requestsToday: 0,
        rpdLimit: RPD_LIMIT,
        cooldownUntil: null,
      };
    }

    const state: StoredQuotaState = JSON.parse(raw);
    const validTimestamps = (state.timestamps || []).filter((ts) => now - ts < 60000);
    const dailyCount = state.dailyDate === today ? (state.dailyCount || 0) : 0;
    const cooldownUntil = state.cooldownUntil && state.cooldownUntil > now ? state.cooldownUntil : null;

    return {
      requestsThisMinute: validTimestamps.length,
      rpmLimit: RPM_LIMIT,
      requestsToday: dailyCount,
      rpdLimit: RPD_LIMIT,
      cooldownUntil,
    };
  } catch {
    return {
      requestsThisMinute: 0,
      rpmLimit: RPM_LIMIT,
      requestsToday: 0,
      rpdLimit: RPD_LIMIT,
      cooldownUntil: null,
    };
  }
}

export function recordApiScanAttempt(): ApiQuotaUsage {
  try {
    const now = Date.now();
    const today = getLocalDateString();
    const raw = safeGetItem(QUOTA_STORAGE_KEY);
    let state: StoredQuotaState = {
      timestamps: [],
      dailyDate: today,
      dailyCount: 0,
      cooldownUntil: null,
    };

    if (raw) {
      try {
        state = JSON.parse(raw);
      } catch {}
    }

    // Filter timestamps within last 60s and add current
    const validTimestamps = (state.timestamps || []).filter((ts) => now - ts < 60000);
    validTimestamps.push(now);

    const dailyCount = state.dailyDate === today ? (state.dailyCount || 0) + 1 : 1;
    const cooldownUntil = state.cooldownUntil && state.cooldownUntil > now ? state.cooldownUntil : null;

    const newState: StoredQuotaState = {
      timestamps: validTimestamps,
      dailyDate: today,
      dailyCount,
      cooldownUntil,
    };

    safeSetItem(QUOTA_STORAGE_KEY, JSON.stringify(newState));

    return {
      requestsThisMinute: validTimestamps.length,
      rpmLimit: RPM_LIMIT,
      requestsToday: dailyCount,
      rpdLimit: RPD_LIMIT,
      cooldownUntil,
    };
  } catch {
    return getApiQuotaUsage();
  }
}

export function recordApiCooldown(seconds: number = 60): void {
  try {
    const now = Date.now();
    const today = getLocalDateString();
    const raw = safeGetItem(QUOTA_STORAGE_KEY);
    let state: StoredQuotaState = {
      timestamps: [],
      dailyDate: today,
      dailyCount: 0,
      cooldownUntil: null,
    };

    if (raw) {
      try {
        state = JSON.parse(raw);
      } catch {}
    }

    state.cooldownUntil = now + seconds * 1000;
    safeSetItem(QUOTA_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to record quota cooldown", e);
  }
}

export function clearApiCooldown(): void {
  try {
    const raw = safeGetItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      state.cooldownUntil = null;
      safeSetItem(QUOTA_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {}
}
