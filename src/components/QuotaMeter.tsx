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
        model: data.model,
        isRateLimit: data.isRateLimit,
        isDaily: data.isDaily,
        isHighDemand: data.isHighDemand,
        isKeyInvalid: data.isKeyInvalid,
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

  const rpmRemaining = Math.max(0, quota.rpmLimit - quota.requestsThisMinute);
  const rpmPercent = Math.min(100, Math.round((rpmRemaining / quota.rpmLimit) * 100));
  const dailyPercent = Math.min(100, Math.max(1, Math.round((quota.requestsToday / quota.rpdLimit) * 100)));

  // Determine RPM bar color based on remaining quota
  const isLowQuota = rpmRemaining <= 3;
  const isMaxRpm = rpmRemaining === 0;
  const inCooldown = cooldownSec > 0;

  const getRpmBarColor = () => {
    if (inCooldown || isMaxRpm) return "bg-rose-500";
    if (isLowQuota) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="p-3.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 space-y-3">
      {/* Header with Title & Action / Live Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Gauge className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
            {t("quota_title")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Prominent Check API Button */}
          <button
            type="button"
            disabled={isProbing}
            onClick={handleProbeApi}
            className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
            title="กดเพื่อส่งคำขอเช็คกับเซิร์ฟเวอร์ Google AI จริงแบบเรียลไทม์"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isProbing ? "animate-spin" : ""}`} />
            <span>{isProbing ? (lang === "en" ? "Checking..." : "กำลังเช็ค...") : (lang === "en" ? "⚡ Check API" : "⚡ เช็ค API")}</span>
          </button>

          {/* Live Status Badge (Clickable to re-test) */}
          <button
            type="button"
            disabled={isProbing}
            onClick={handleProbeApi}
            title="คลิกเพื่อยิงทดสอบสถานะ Google AI"
            className="cursor-pointer transition hover:opacity-80 active:scale-95"
          >
            {inCooldown ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1 animate-pulse">
                <Clock className="w-2.5 h-2.5" />
                <span>{t("quota_status_cooldown").replace("{sec}", String(cooldownSec))}</span>
              </span>
            ) : liveStatus?.ok === false ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
                <XCircle className="w-2.5 h-2.5" />
                <span>{liveStatus.isDaily ? "โควตารายวันเต็ม" : liveStatus.isHighDemand ? "เซิร์ฟเวอร์หนาแน่น" : liveStatus.isRateLimit ? "โควตา 15 RPM เต็ม" : liveStatus.isKeyInvalid ? "คีย์ไม่ถูกต้อง" : "Google มีปัญหา"}</span>
              </span>
            ) : isLowQuota ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>{t("quota_rpm_limit_warn")}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{liveStatus?.ok ? `พร้อม (${liveStatus.latencyMs || 0}ms)` : t("quota_status_ready")}</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Google API Live Feedback Card */}
      {liveStatus ? (
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#151518] border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="text-[10.5px] leading-relaxed flex items-start gap-2">
            {liveStatus.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className={`font-semibold ${liveStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {liveStatus.ok
                    ? (lang === "en" ? "Google AI is Ready" : "Google AI พร้อมใช้งานจริง")
                    : (lang === "en" ? "Google AI Notice" : "Google AI แจ้งสถานะ")}
                </p>
                {liveStatus.latencyMs !== undefined && (
                  <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    Ping {liveStatus.latencyMs} ms
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-snug">
                {liveStatus.message}
              </p>
              <div className="flex items-center justify-between text-[9.5px] text-neutral-400 dark:text-neutral-500 mt-1">
                <span>{lang === "en" ? "Tested at:" : "ทดสอบสดเมื่อ:"} {liveStatus.testedAt || "-"}</span>
                <button
                  type="button"
                  disabled={isProbing}
                  onClick={handleProbeApi}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <RefreshCw className={`w-2 h-2 ${isProbing ? "animate-spin" : ""}`} />
                  <span>{lang === "en" ? "Test again" : "ทดสอบซ้ำ"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#151518]/70 border border-dashed border-neutral-300 dark:border-neutral-700/80 flex items-center justify-between gap-2 text-[10.5px]">
          <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            {lang === "en" ? "Click 'Check API' to probe Google AI live" : "กดปุ่ม '⚡ เช็ค API' ด้านบนเพื่อเช็คกับ Google AI สดๆ"}
          </span>
          <button
            type="button"
            disabled={isProbing}
            onClick={handleProbeApi}
            className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0"
          >
            {lang === "en" ? "Test now" : "ทดสอบเลย"}
          </button>
        </div>
      )}

      {/* 1. RPM Progress Bar (Remaining scans countdown) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            {lang === "en" ? "Quota Remaining This Minute" : "โควตานาทีนี้ (นับถอยหลัง)"}
          </span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {inCooldown
              ? (lang === "en" ? `Wait ${cooldownSec}s` : `พักรอบ ${cooldownSec} วิ`)
              : (lang === "en" ? `Remaining ${rpmRemaining} / 15` : `เหลืออีก ${rpmRemaining} / 15 ครั้ง`)}
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
          <span>0 (หมด)</span>
          <span>สถิติในเครื่องรอบ 60 วิ</span>
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
