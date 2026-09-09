"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FoodLogItem,
  FoodAnalysisResult,
  MultiFoodAnalysisResponse,
  UserSettings,
  Macronutrients,
} from "@/types";
import {
  getLocalDateString,
  getLocalTimeString,
  getLogsByDate,
  getDailySummary,
  getUserSettings,
  saveUserSettings,
  addFoodLog,
  deleteFoodLog,
  recordApiScanAttempt,
  recordApiCooldown,
} from "@/lib/storage";
import { compressImageForAnalysis, createThumbnail } from "@/lib/imageUtils";

import { Navbar } from "@/components/Navbar";
import { DateNavigator } from "@/components/DateNavigator";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { CameraAction } from "@/components/CameraAction";
import { FoodList } from "@/components/FoodList";
import { AnalysisModal } from "@/components/AnalysisModal";
import { ManualEntryModal } from "@/components/ManualEntryModal";
import { SettingsModal } from "@/components/SettingsModal";
import { HistoryModal } from "@/components/HistoryModal";
import { TdeeModal } from "@/components/TdeeModal";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { lang, t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    daily_goal: 2000,
    protein_goal_g: 100,
    carbs_goal_g: 250,
    fat_goal_g: 65,
    storage_mode: "ultra_light",
  });

  // Modal states
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTdeeModalOpen, setIsTdeeModalOpen] = useState(false);

  // AI Analysis states
  const [scanMode, setScanMode] = useState<"food" | "nutrition_label">("food");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedThumbnail, setCompressedThumbnail] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentNote, setCurrentNote] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState<MultiFoodAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Load data for selected date
  const refreshData = useCallback(() => {
    const dayLogs = getLogsByDate(selectedDate);
    setLogs(dayLogs);
    setSettings(getUserSettings());
  }, [selectedDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Check for midnight rollover (00:00) and re-sync settings when page stays open or gains focus/visibility
  useEffect(() => {
    const handleWakeOrFocus = () => {
      const today = getLocalDateString();
      if (selectedDate !== today && selectedDate < today) {
        setSelectedDate(today);
      }
      refreshData();
    };

    window.addEventListener("focus", handleWakeOrFocus);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleWakeOrFocus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(handleWakeOrFocus, 60000); // check every minute
    return () => {
      window.removeEventListener("focus", handleWakeOrFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [selectedDate, refreshData]);

  // Process food photo with Gemini AI
  const processImageAnalysis = async (
    file: File,
    mode: "food" | "nutrition_label" = "food",
    note?: string
  ) => {
    setCurrentFile(file);
    setScanMode(mode);
    setCurrentNote(note || "");
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResponse(null);
    setIsAnalysisModalOpen(true);

    try {
      // 1. Compress image for fast upload and AI processing
      const { base64, mimeType } = await compressImageForAnalysis(file, 1024, 0.8);
      setImagePreview(base64);

      // 2. Create ultra-lightweight thumbnail (~2-3KB) for LocalStorage
      const thumb = await createThumbnail(base64, 80, 0.45);
      setCompressedThumbnail(thumb);

      // 3. Call server API /api/analyze
      const currentSettings = getUserSettings();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (currentSettings.gemini_api_key && currentSettings.gemini_api_key.trim()) {
        headers["x-gemini-api-key"] = currentSettings.gemini_api_key.trim();
      }

      recordApiScanAttempt();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          image: base64,
          mimeType,
          note,
          scanMode: mode,
        }),
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        // Handle non-JSON server responses (e.g. 504 Gateway Timeout or 502/500 from Vercel)
        if (response.status === 504 || response.status === 408) {
          throw new Error(
            lang === "en"
              ? "Analysis timed out on server. Please tap 'Try Again' or use a smaller image."
              : "การวิเคราะห์ใช้เวลานานเกินไป (Server Timeout) กรุณากดปุ่ม 'ลองใหม่อีกครั้ง' ครับ"
          );
        }
        if (response.status === 413) {
          throw new Error(
            lang === "en"
              ? "Image file is too large. Please select a smaller photo."
              : "ไฟล์รูปภาพมีขนาดใหญ่เกินไป กรุณาลดขนาดภาพหรือถ่ายใหม่ครับ"
          );
        }
        throw new Error(
          lang === "en"
            ? `Server error (${response.status}). Please tap 'Try Again'.`
            : `เซิร์ฟเวอร์ขัดข้องชั่วคราว (${response.status}) กรุณากดปุ่ม 'ลองใหม่อีกครั้ง' ครับ`
        );
      }

      if (!response.ok) {
        const isDaily = data?.error?.includes("DAILY_QUOTA_EXCEEDED") || data?.error?.includes("รายวัน");
        if (!isDaily && (response.status === 429 || data?.error?.includes("429") || data?.error?.includes("โควตา"))) {
          recordApiCooldown(60);
        }
        throw new Error(data?.error || (lang === "en" ? "Error analyzing food image" : "เกิดข้อผิดพลาดในการวิเคราะห์อาหาร"));
      }

      setAnalysisResponse(data);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      const isDaily = err?.message?.includes("DAILY_QUOTA_EXCEEDED") || err?.message?.includes("รายวัน");
      if (!isDaily && (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("โควตา"))) {
        recordApiCooldown(60);
      }
      setAnalysisError(err.message || (lang === "en" ? "Cannot connect to AI service. Please try again." : "ไม่สามารถติดต่อระบบ AI ได้ กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // User confirmed AI analysis result (supports multi-dish batch saving)
  const handleSaveAiBatchResult = (
    itemsToSave: Array<{
      food_name: string;
      food_name_en?: string;
      calories: number;
      macronutrients: Macronutrients;
      portion_multiplier: number;
      portion_label: string;
      ingredients?: any[];
      health_tip?: string;
      confidence_level?: "high" | "medium" | "low";
      confidence_reason?: string;
      user_note?: string;
    }>
  ) => {
    // Ultra-light mode does not store images to guarantee minimum file size (~0.2 KB/meal)
    const shouldSaveThumbnail = settings.storage_mode === "micro_thumbnail";

    itemsToSave.forEach((item, index) => {
      addFoodLog({
        date: selectedDate,
        time: getLocalTimeString(),
        food_name: item.food_name,
        food_name_en: item.food_name_en,
        calories: item.calories,
        macronutrients: item.macronutrients,
        portion_multiplier: item.portion_multiplier,
        portion_label: item.portion_label,
        ingredients: item.ingredients,
        health_tip: item.health_tip,
        confidence_level: item.confidence_level,
        confidence_reason: item.confidence_reason,
        user_note: item.user_note,
        // Save thumbnail only on first item if multiple dishes detected to save storage, or all if 1
        thumbnail: shouldSaveThumbnail ? compressedThumbnail || undefined : undefined,
      });
    });

    setIsAnalysisModalOpen(false);
    setImagePreview(null);
    setCompressedThumbnail(null);
    setAnalysisResponse(null);
    setCurrentNote("");
    refreshData();
  };

  // Manual meal save
  const handleSaveManualEntry = (entry: {
    food_name: string;
    calories: number;
    macronutrients: Macronutrients;
    time: string;
  }) => {
    addFoodLog({
      date: selectedDate,
      time: entry.time,
      food_name: entry.food_name,
      calories: entry.calories,
      macronutrients: entry.macronutrients,
      portion_multiplier: 1.0,
      portion_label: lang === "en" ? "Manual" : "บันทึกเอง",
    });

    refreshData();
  };

  // Delete an item
  const handleDeleteLog = (id: string) => {
    deleteFoodLog(id);
    refreshData();
  };

  // Calculate daily summary
  const summary = getDailySummary(selectedDate);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-sm sm:max-w-md mx-auto px-4 py-3 flex flex-col gap-3.5">
        {/* Date Navigator */}
        <DateNavigator
          currentDate={selectedDate}
          onSelectDate={(newDate) => setSelectedDate(newDate)}
        />

        {/* Calorie Ring summary */}
        <CalorieRing
          consumed={summary.totalCalories}
          goal={settings.daily_goal || 2000}
        />

        {/* Macronutrients Progress */}
        <MacroBar
          protein={summary.totalProtein}
          carbs={summary.totalCarbs}
          fat={summary.totalFat}
          settings={settings}
        />

        {/* Camera & Quick Action Buttons */}
        <CameraAction
          onImageSelected={(file, mode) => processImageAnalysis(file, mode)}
          onOpenManualEntry={() => setIsManualModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          disabled={isAnalyzing}
        />

        {/* List of meals logged today */}
        <div className="pt-1">
          <FoodList
            items={logs}
            onDeleteItem={handleDeleteLog}
            selectedDate={selectedDate}
          />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-sm sm:max-w-md mx-auto px-4 py-6 text-center text-[11px] text-neutral-400">
        <p>{t("tagline")}</p>
      </footer>

      {/* AI Analysis Modal */}
      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => {
          setIsAnalysisModalOpen(false);
          setIsAnalyzing(false);
        }}
        imagePreview={imagePreview}
        isLoading={isAnalyzing}
        response={analysisResponse}
        error={analysisError}
        initialNote={currentNote}
        scanMode={scanMode}
        hasSavedApiKey={Boolean(settings.gemini_api_key && settings.gemini_api_key.trim())}
        savedApiKeyMasked={
          settings.gemini_api_key && settings.gemini_api_key.trim().length > 8
            ? `${settings.gemini_api_key.trim().slice(0, 6)}••••••••${settings.gemini_api_key.trim().slice(-4)}`
            : Boolean(settings.gemini_api_key)
            ? "••••••••••••"
            : undefined
        }
        onSave={handleSaveAiBatchResult}
        onRetry={() => {
          if (currentFile) {
            processImageAnalysis(currentFile, scanMode, currentNote);
          }
        }}
        onReAnalyzeWithNote={(note) => {
          if (currentFile) {
            processImageAnalysis(currentFile, scanMode, note);
          }
        }}
        onSaveApiKey={(key) => {
          const updated = saveUserSettings({ gemini_api_key: key.trim() });
          setSettings(updated);
        }}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleSaveManualEntry}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          const updated = saveUserSettings(newSettings);
          setSettings(updated);
        }}
        onDataReset={refreshData}
        onOpenTdeeModal={() => setIsTdeeModalOpen(true)}
      />

      {/* Log History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectDate={(newDate) => setSelectedDate(newDate)}
        settings={settings}
      />

      {/* Personal BMR / TDEE Calculator Modal */}
      <TdeeModal
        isOpen={isTdeeModalOpen}
        onClose={() => setIsTdeeModalOpen(false)}
        onApplyGoals={(newGoals) => {
          const updated = saveUserSettings(newGoals);
          setSettings(updated);
          refreshData();
        }}
      />
    </div>
  );
}
