import React, { useState, useEffect } from "react";
import { Gauge, Zap, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { getApiQuotaUsage } from "@/lib/storage";
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

  useEffect(() => {
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

        {/* Live Status */}
        {inCooldown ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1 animate-pulse">
            <Clock className="w-2.5 h-2.5" />
            <span>{t("quota_status_cooldown").replace("{sec}", String(cooldownSec))}</span>
          </span>
        ) : isHighRpm ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>{t("quota_rpm_limit_warn")}</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("quota_status_ready")}</span>
          </span>
        )}
      </div>

      {/* 1. RPM Progress Bar (1-minute sliding window) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            {t("quota_rpm_label")}
          </span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {inCooldown
              ? (lang === "en" ? "Wait 60s" : "พักรอบเวลา")
              : t("quota_rpm_remaining").replace("{n}", String(rpmRemaining))}
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
          <span>0</span>
          <span>{quota.requestsThisMinute} / {quota.rpmLimit} req/min</span>
          <span>15</span>
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
    </div>
  );
};
