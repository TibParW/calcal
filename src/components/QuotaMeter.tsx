import React, { useState, useEffect } from "react";
import { Gauge, Zap, Clock, ShieldCheck, AlertTriangle, RefreshCw, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { getApiQuotaUsage, getLastApiStatus, saveLastApiStatus, getUserSettings, LastApiStatus } from "@/lib/storage";
import { ApiQuotaUsage } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export const QuotaMeter: React.FC = () => {
  const { t, lang } = useLanguage();
  const [quota, setQuota] = useState<ApiQuotaUsage>({
    requestsThisMinute: 0,
    rpmLimit: 15,
    requestsToday: 0,
    rpdLimit: 1500,
    cooldownUntil: null,
  });
  const [cooldownSec, setCooldownSec] = useState<number>(0);
  const [liveStatus, setLiveStatus] = useState<LastApiStatus | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    setLiveStatus(getLastApiStatus());

    const update = () => {
      const current = getApiQuotaUsage();
      setQuota(current);

      if (current.cooldownUntil && current.cooldownUntil > Date.now()) {
        const remaining = Math.max(0, Math.ceil((current.cooldownUntil - Date.now()) / 1000));
        setCooldownSec(remaining);
      } else {
        setCooldownSec(0);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleProbeApi = async () => {
    if (isProbing) return;
    setIsProbing(true);

    try {
      const settings = getUserSettings();
      const apiKey = settings.gemini_api_key?.trim();
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers["x-gemini-api-key"] = apiKey;
      }

      const res = await fetch("/api/check-quota", {
        method: "POST",
        headers,
      });

      const data = await res.json();
      const result: LastApiStatus = {
        ok: data.ok,
        status: data.status,
        message: data.message,
        testedAt: data.testedAt || new Date().toLocaleTimeString("th-TH"),
        isRateLimit: data.isRateLimit,
        isDaily: data.isDaily,
        isHighDemand: data.isHighDemand,
        latencyMs: data.latencyMs,
      };

      setLiveStatus(result);
      saveLastApiStatus(result);
    } catch (e: any) {
      const errResult: LastApiStatus = {
        ok: false,
        status: 0,
        message: "ไม่สามารถส่งคำขอทดสอบได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
        testedAt: new Date().toLocaleTimeString("th-TH"),
      };
      setLiveStatus(errResult);
      saveLastApiStatus(errResult);
    } finally {
      setIsProbing(false);
    }
  };

  const rpmPercent = Math.min(100, Math.round((quota.requestsThisMinute / quota.rpmLimit) * 100));
  const rpmRemaining = Math.max(0, quota.rpmLimit - quota.requestsThisMinute);
  const dailyPercent = Math.min(100, Math.max(1, Math.round((quota.requestsToday / quota.rpdLimit) * 100)));

  // Determine RPM bar color
  const isHighRpm = quota.requestsThisMinute >= 12;
  const isMaxRpm = quota.requestsThisMinute >= quota.rpmLimit;
  const inCooldown = cooldownSec > 0;

  const getRpmBarColor = () => {
    if (inCooldown || isMaxRpm) return "bg-rose-500";
    if (isHighRpm) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="p-3.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 space-y-3">
      {/* Header with Title & Live Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {t("quota_title")}
          </span>
        </div>

        {/* Live Status Badge */}
        {inCooldown ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1 animate-pulse">
            <Clock className="w-2.5 h-2.5" />
            <span>{t("quota_status_cooldown").replace("{sec}", String(cooldownSec))}</span>
          </span>
        ) : liveStatus?.ok === false ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" />
            <span>{liveStatus.isDaily ? "โควตารายวันเต็ม" : liveStatus.isHighDemand ? "เซิร์ฟเวอร์หนาแน่น" : "Google บล็อก 429"}</span>
          </span>
        ) : isHighRpm ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>{t("quota_rpm_limit_warn")}</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{liveStatus?.ok ? `พร้อมใช้งาน (${liveStatus.latencyMs || 0}ms)` : t("quota_status_ready")}</span>
          </span>
        )}
      </div>

      {/* Real-time Google API Probe Button & Live Feedback */}
      <div className="p-2.5 rounded-xl bg-white dark:bg-[#151518] border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            {lang === "en" ? "Check Real API Status" : "ตรวจสอบสถานะกับ Google AI จริง"}
          </span>
          <button
            type="button"
            disabled={isProbing}
            onClick={handleProbeApi}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-black transition active:scale-95 disabled:opacity-40 flex items-center gap-1 shadow-2xs"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isProbing ? "animate-spin" : ""}`} />
            <span>{isProbing ? (lang === "en" ? "Testing..." : "กำลังเช็ค...") : (lang === "en" ? "Test Now" : "ยิงทดสอบสด")}</span>
          </button>
        </div>

        {liveStatus ? (
          <div className="text-[10.5px] leading-relaxed flex items-start gap-1.5 pt-0.5">
            {liveStatus.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${liveStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {liveStatus.message}
              </p>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                <span>ทดสอบเมื่อ: {liveStatus.testedAt || "-"}</span>
                {liveStatus.latencyMs !== undefined && <span>ความเร็ว: {liveStatus.latencyMs} ms</span>}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {lang === "en"
              ? "Press 'Test Now' to send an actual live ping to Google Gemini API."
              : "กด 'ยิงทดสอบสด' เพื่อส่งคำขอเช็คกับเซิร์ฟเวอร์ Google AI โดยตรงแบบเรียลไทม์"}
          </p>
        )}
      </div>

      {/* 1. RPM Progress Bar (Local 1-minute sliding window) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            {lang === "en" ? "Local Scans This Minute (15 RPM Max)" : "สถิติในเครื่องรอบ 1 นาทีล่าสุด (สูงสุด 15)"}
          </span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {inCooldown
              ? (lang === "en" ? `Wait ${cooldownSec}s` : `พักรอบ ${cooldownSec} วิ`)
              : `ใช้ไป ${quota.requestsThisMinute} / 15`}
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2 rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${getRpmBarColor()}`}
            style={{ width: `${Math.max(4, rpmPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
          <span>0 (ว่าง)</span>
          <span>เหลือโควตารอบนี้ ~{rpmRemaining} ครั้ง</span>
          <span>15 (เต็ม)</span>
        </div>
      </div>

      {/* 2. Daily Scans Progress Bar */}
      <div className="space-y-1.5 pt-1.5 border-t border-neutral-200/50 dark:border-neutral-700/40">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            {t("quota_daily_label")}
          </span>
          <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
            {t("quota_daily_count")
              .replace("{n}", String(quota.requestsToday))
              .replace("{max}", String(quota.rpdLimit))}
          </span>
        </div>

        {/* Daily Track */}
        <div className="w-full h-1.5 rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 overflow-hidden">
          <div
            className="h-full bg-emerald-500/80 rounded-full transition-all duration-500"
            style={{ width: `${dailyPercent}%` }}
          />
        </div>
      </div>

      {/* Direct link to Google AI Studio Official Quota Dashboard */}
      <div className="pt-1 flex justify-end">
        <a
          href="https://aistudio.google.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline flex items-center gap-1 transition"
        >
          <span>{lang === "en" ? "View official quota dashboard on Google AI Studio" : "เปิดดูแดชบอร์ดโควตาจริงบน Google AI Studio"}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
