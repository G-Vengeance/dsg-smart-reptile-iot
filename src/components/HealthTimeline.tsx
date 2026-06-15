/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  History,
  MonitorPlay,
  Thermometer, 
  Droplets, 
  Wind 
} from 'lucide-react';
import { HistoricalRecord, SettingsState } from '../types';
import { translations } from '../utils/i18n';

interface HealthTimelineProps {
  history: HistoricalRecord[];
  settings: SettingsState;
  tempUnit: 'C' | 'F';
  celsiusToUnit: (c: number) => number;
  language?: 'en' | 'id';
}

export default function HealthTimeline({
  history,
  settings,
  tempUnit,
  celsiusToUnit,
  language = 'en',
}: HealthTimelineProps) {
  const t = translations[language];

  const timelinePoints = useMemo(() => {
    return history.slice(-30);
  }, [history]);

  // Compute health score dynamically
  const calculateScore = (rec: HistoricalRecord) => {
    let score = 100;

    // Check Temperature alarms
    if (rec.temperature > settings.tempMaxAlarm) {
      const dev = rec.temperature - settings.tempMaxAlarm;
      score -= Math.min(30, dev * 15);
    } else if (rec.temperature < settings.tempMinAlarm) {
      const dev = settings.tempMinAlarm - rec.temperature;
      score -= Math.min(30, dev * 15);
    }

    // Check Humidity alarms
    if (rec.humidity > settings.humMaxAlarm) {
      const dev = rec.humidity - settings.humMaxAlarm;
      score -= Math.min(25, dev * 2.5);
    } else if (rec.humidity < settings.humMinAlarm) {
      const dev = settings.humMinAlarm - rec.humidity;
      score -= Math.min(25, dev * 2.5);
    }

    // Actuators
    if (rec.fanSpeed > 85) {
      score -= 5;
    }
    if (rec.isMisting) {
      score -= 5;
    }

    return Math.max(12, Math.round(score));
  };

  const pointsWithScores = useMemo(() => {
    return timelinePoints.map((pt, idx) => ({
      ...pt,
      score: calculateScore(pt),
      originalIndex: idx,
    }));
  }, [timelinePoints, settings]);

  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  const activeRecord = useMemo(() => {
    if (pointsWithScores.length === 0) return null;
    if (scrubIndex !== null && scrubIndex >= 0 && scrubIndex < pointsWithScores.length) {
      return pointsWithScores[scrubIndex];
    }
    return pointsWithScores[pointsWithScores.length - 1];
  }, [pointsWithScores, scrubIndex]);

  const activeIsLive = scrubIndex === null || scrubIndex === pointsWithScores.length - 1;

  // Visual helper for health score theme colors - organic themed
  const getScoreTheme = (score: number) => {
    if (score >= 90) return {
      borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-600 dark:bg-emerald-500',
      dotColor: 'bg-emerald-500 dark:bg-emerald-400',
      glowShadow: 'shadow-sm',
      bgGlow: 'bg-emerald-500/5 dark:bg-emerald-950/20',
      textLabel: t.nominalPerformance
    };
    if (score >= 75) return {
      borderColor: 'border-amber-500/20 dark:border-amber-500/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-600 dark:bg-amber-500',
      dotColor: 'bg-amber-500 dark:bg-amber-400',
      glowShadow: 'shadow-sm',
      bgGlow: 'bg-amber-500/5 dark:bg-amber-950/25',
      textLabel: t.stabilizingGradient
    };
    return {
      borderColor: 'border-red-500/20 dark:border-red-500/30',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-600 dark:bg-red-500',
      dotColor: 'bg-red-500 dark:bg-red-400',
      glowShadow: 'shadow-sm',
      bgGlow: 'bg-red-500/5 dark:bg-red-950/30',
      textLabel: t.climateAnomaly
    };
  };

  const activeTheme = activeRecord ? getScoreTheme(activeRecord.score) : null;

  return (
    <div 
      id="system-health-timeline-widget"
      className="w-full rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-4 sm:p-5 shadow-[var(--shadow-card)] flex flex-col gap-3 sm:gap-4 mt-2 text-[var(--text-primary)] transition-all duration-300"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-card)] pb-2.5 sm:pb-3 gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight font-sans truncate">
              {t.healthHistoryTitle}
            </h3>
            <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-sans font-bold mt-0.5 truncate border-none outline-none">
              {t.healthHistorySubtitle}
            </p>
          </div>
        </div>

        {/* State Indicators */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {activeIsLive ? (
              <motion.div 
                key="live-badge"
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[9px] sm:text-[10px] font-sans text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                {t.liveIndicator}
              </motion.div>
            ) : (
              <motion.button 
                key="archive-badge"
                onClick={() => setScrubIndex(null)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[9px] sm:text-[10px] font-sans text-emerald-700 dark:text-emerald-350 font-bold uppercase tracking-wide cursor-pointer transition-all active:scale-95 shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span>{t.chartHistoryTab}</span>
                <span className="text-[8px] sm:text-[9px] bg-emerald-500/25 px-1 py-0.2 rounded border border-emerald-500/25 ml-1 font-sans font-bold">
                  {language === 'en' ? 'ACTIVE' : 'AKTIF'}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scrubbing Track */}
      <div className="relative flex flex-col gap-1.5 sm:gap-2 select-none">
        
        {/* Horizontal bar metrics track */}
        <div 
          id="historical-health-bars-track"
          className="flex items-end justify-between gap-[3px] sm:gap-2 h-10 sm:h-12 bg-[var(--bg-app)] rounded-2xl p-2 sm:p-2.5 border border-[var(--border-card)] relative overflow-hidden transition-all duration-300"
        >
          {pointsWithScores.map((pt, i) => {
            const isSelected = scrubIndex === i || (scrubIndex === null && i === pointsWithScores.length - 1);
            let barColor = 'bg-emerald-500/15 hover:bg-emerald-500/35';
            let activeBarColor = 'bg-emerald-600 dark:bg-emerald-400 shadow-sm';
            
            if (pt.score < 75) {
              barColor = 'bg-red-500/15 hover:bg-red-500/35';
              activeBarColor = 'bg-red-600 dark:bg-red-400 shadow-sm';
            } else if (pt.score < 90) {
              barColor = 'bg-amber-500/15 hover:bg-amber-500/35';
              activeBarColor = 'bg-amber-600 dark:bg-amber-400 shadow-sm';
            }

            const htPercent = Math.max(30, pt.score);

            return (
              <div
                key={`${pt.timestamp}-${i}`}
                onClick={() => setScrubIndex(i)}
                onMouseEnter={() => setScrubIndex(i)}
                className="flex-1 h-full flex items-end cursor-pointer group"
                id={`health-bar-segment-${i}`}
              >
                <div 
                  className={`w-full rounded-[2px] transition-all duration-150 ${
                    isSelected ? activeBarColor : barColor
                  }`}
                  style={{ height: `${htPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Timestamps Tick bar */}
        <div className="flex justify-between text-[8px] sm:text-[9px] font-sans text-[var(--text-secondary)] px-1 mt-0.5 font-bold">
          <span>{pointsWithScores[0]?.displayTime || (language === 'en' ? 'Just Now' : 'Baru Saja')}</span>
          <span className="font-sans font-medium uppercase text-[8px] tracking-widest">{t.timelineLegend}</span>
          <span>{pointsWithScores[pointsWithScores.length - 1]?.displayTime || (language === 'en' ? 'NOW' : 'SEKARANG')}</span>
        </div>
      </div>

      {/* Details displaying widget */}
      {activeRecord && activeTheme && (
        <motion.div
          id="scrubbed-details-display-card"
          className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border ${activeTheme.borderColor} ${activeTheme.bgGlow} transition-all duration-300 shadow-sm`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Health score badge */}
          <div className="flex items-center gap-2.5 justify-start min-w-0">
            <div className={`p-2.5 rounded-2xl shrink-0 ${activeTheme.glowShadow} ${activeTheme.bgColor}/10 border border-white/5`}>
              <Heart className={`w-3.5 sm:w-4.5 h-3.5 sm:h-4.5 ${activeTheme.textColor}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-sans uppercase tracking-wider font-extrabold truncate">
                {language === 'en' ? 'Health Condition' : 'Tingkat Kesehatan'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-sm sm:text-lg font-bold ${activeTheme.textColor}`}>
                  {activeRecord.score}%
                </span>
                <span className="text-[7px] text-[var(--text-secondary)] font-sans font-bold hidden sm:inline">
                  {activeIsLive ? (language === 'en' ? 'LIVE' : 'LANGSUNG') : (language === 'en' ? 'HISTORY' : 'RIWAYAT')}
                </span>
              </div>
            </div>
          </div>

          {/* Temperature state */}
          <div className="flex items-center gap-2.5 justify-start border-l border-[var(--border-card)] pl-3.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-white/5 shrink-0">
              <Thermometer className="w-3.5 sm:w-4.5 h-3.5 sm:h-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-sans uppercase tracking-wider font-extrabold truncate">
                {t.tempTitle}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                {celsiusToUnit(activeRecord.temperature).toFixed(1)}°{tempUnit}
              </span>
            </div>
          </div>

          {/* Humidity State */}
          <div className="flex items-center gap-2.5 justify-start border-t border-[var(--border-card)] pt-2 md:border-t-0 md:border-l md:pt-0 md:pl-3.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-white/5 shrink-0">
              <Droplets className="w-3.5 sm:w-4.5 h-3.5 sm:h-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-sans uppercase tracking-wider font-extrabold truncate">
                {t.humidTitle}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                {activeRecord.humidity.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Actuator activity states */}
          <div className="flex items-center gap-2.5 justify-start border-t border-l border-[var(--border-card)] pt-2 pl-3.5 md:border-t-0 md:pt-0 md:pl-3.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-white/5 shrink-0">
              <Wind className="w-3.5 sm:w-4.5 h-3.5 sm:h-4.5" />
            </div>
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-sans uppercase tracking-wider font-extrabold flex items-center truncate">
                <span>{t.actuatorsLabel}</span>
              </span>
              <div className="flex gap-1.5 items-center flex-wrap select-none mt-1">
                <span className={`text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded font-bold border transition-all ${
                  activeRecord.fanSpeed > 0 
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-350 border-teal-300/40 dark:border-teal-800/40 font-bold' 
                     : 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 border-zinc-200/50 dark:border-zinc-800/20'
                }`}>
                  {language === 'en' ? 'Fan' : 'Kipas'}:{activeRecord.fanSpeed}%
                </span>
                <span className={`text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded font-bold border transition-all ${
                  activeRecord.isMisting 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-350 border-blue-300/40 dark:border-blue-800/40 font-bold animate-pulse' 
                    : 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 border-zinc-200/50 dark:border-zinc-800/20'
                }`}>
                  {language === 'en' ? 'Mist' : 'Kabut'}:{activeRecord.isMisting ? (language === 'en' ? 'ACTIVE' : 'AKTIF') : (language === 'en' ? 'OFF' : 'MATI')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
