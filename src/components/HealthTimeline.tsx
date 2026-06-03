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

  // Take last 30 entries of the history to present in a dense, highly scannable bar grid
  const timelinePoints = useMemo(() => {
    return history.slice(-30);
  }, [history]);

  // Compute health score dynamically for any record based on setting limits
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

  // Selected index for scrubbing. If null, we default to the latest current live tick
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  // Active point being examined (either selected via scrub or default to latest)
  const activeRecord = useMemo(() => {
    if (pointsWithScores.length === 0) return null;
    if (scrubIndex !== null && scrubIndex >= 0 && scrubIndex < pointsWithScores.length) {
      return pointsWithScores[scrubIndex];
    }
    return pointsWithScores[pointsWithScores.length - 1]; // standard default to latest
  }, [pointsWithScores, scrubIndex]);

  const activeIsLive = scrubIndex === null || scrubIndex === pointsWithScores.length - 1;

  // Visual helper for health score theme colors
  const getScoreTheme = (score: number) => {
    if (score >= 90) return {
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500',
      dotColor: 'bg-emerald-400',
      glowShadow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      bgGlow: 'bg-emerald-950/20',
      textLabel: t.nominalPerformance
    };
    if (score >= 75) return {
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500',
      dotColor: 'bg-amber-400',
      glowShadow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      bgGlow: 'bg-amber-950/25',
      textLabel: t.stabilizingGradient
    };
    return {
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500',
      dotColor: 'bg-red-400',
      glowShadow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
      bgGlow: 'bg-red-950/30',
      textLabel: t.climateAnomaly
    };
  };

  const activeTheme = activeRecord ? getScoreTheme(activeRecord.score) : null;

  return (
    <div 
      id="system-health-timeline-widget"
      className="w-full rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-3 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col gap-3 sm:gap-4 mt-2"
    >
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 sm:pb-3.5 gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shrink-0">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight font-sans truncate">
              {t.healthHistoryTitle}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5 truncate border-none outline-none">
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
                className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[8px] sm:text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <MonitorPlay className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400" />
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.liveIndicator}
              </motion.div>
            ) : (
              <motion.button 
                key="archive-badge"
                onClick={() => setScrubIndex(null)}
                className="flex items-center gap-1 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-[8px] sm:text-[10px] font-mono text-indigo-300 font-extrabold uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <History className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-400 shrink-0" />
                <span>{t.chartHistoryTab}</span>
                <span className="text-[7px] sm:text-[9px] bg-indigo-500/20 px-1 py-0.2 rounded border border-indigo-400/25 ml-1 font-mono">
                  {language === 'en' ? 'ACTIVE' : 'AKTIF'}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scrubbing track */}
      <div className="relative flex flex-col gap-1.5 sm:gap-2 select-none">
        
        {/* Horizontal bar metrics track */}
        <div 
          id="historical-health-bars-track"
          className="flex items-end justify-between gap-[3px] sm:gap-1.5 h-10 sm:h-14 bg-black/35 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/5 relative overflow-hidden"
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />

          {pointsWithScores.map((pt, i) => {
            const isSelected = scrubIndex === i || (scrubIndex === null && i === pointsWithScores.length - 1);
            let barColor = 'bg-emerald-500/30 hover:bg-emerald-400';
            let activeBarColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
            
            if (pt.score < 75) {
              barColor = 'bg-red-500/30 hover:bg-red-400';
              activeBarColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
            } else if (pt.score < 90) {
              barColor = 'bg-amber-500/30 hover:bg-amber-400';
              activeBarColor = 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
            }

            // Height is proportional to the health score (40% min height to make sure bars are clickable)
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
                  className={`w-full rounded-sm sm:rounded-md transition-all duration-150 ${
                    isSelected ? activeBarColor : barColor
                  }`}
                  style={{ height: `${htPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Timestamps Tick bar */}
        <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 px-1 mt-0.5">
          <span>{pointsWithScores[0]?.displayTime || (language === 'en' ? 'Just Now' : 'Baru Saja')}</span>
          <span>{t.timelineLegend}</span>
          <span>{pointsWithScores[pointsWithScores.length - 1]?.displayTime || (language === 'en' ? 'NOW' : 'SEKARANG')}</span>
        </div>
      </div>

      {/* active details block - styled like high-tech telemetry dashboard overlay */}
      {activeRecord && activeTheme && (
        <motion.div
          id="scrubbed-details-display-card"
          className={`grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border ${activeTheme.borderColor} ${activeTheme.bgGlow} transition-all duration-300 shadow-lg`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Health score badge */}
          <div className="flex items-center gap-2 sm:gap-3 justify-start min-w-0">
            <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-2xl shrink-0 ${activeTheme.glowShadow} ${activeTheme.bgColor}/20 border border-white/5`}>
              <Heart className={`w-3.5 sm:w-5 h-3.5 sm:h-5 ${activeTheme.textColor}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-bold truncate">
                {language === 'en' ? 'Health Condition' : 'Tingkat Kesehatan'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-sm sm:text-xl font-sans font-black ${activeTheme.textColor}`}>
                  {activeRecord.score}%
                </span>
                <span className="text-[7px] text-slate-400 font-mono hidden sm:inline">
                  {activeIsLive ? (language === 'en' ? 'LIVE' : 'LANGSUNG') : (language === 'en' ? 'HISTORY' : 'RIWAYAT')}
                </span>
              </div>
            </div>
          </div>

          {/* Temperature state */}
          <div className="flex items-center gap-2 sm:gap-3 justify-start border-l border-white/5 pl-2 sm:pl-4 min-w-0">
            <div className="p-1.5 sm:p-3 rounded-lg sm:rounded-2xl bg-cyan-500/10 text-cyan-400 border border-white/5 shrink-0">
              <Thermometer className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-cyan-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-bold truncate">
                {t.tempTitle}
              </span>
              <span className="text-xs sm:text-sm font-sans font-extrabold text-white">
                {celsiusToUnit(activeRecord.temperature).toFixed(1)}°{tempUnit}
              </span>
            </div>
          </div>

          {/* Humidity State */}
          <div className="flex items-center gap-2 sm:gap-3 justify-start border-t border-white/5 pt-2 md:border-t-0 md:border-l md:pt-0 md:pl-4 min-w-0">
            <div className="p-1.5 sm:p-3 rounded-lg sm:rounded-2xl bg-sky-500/10 text-sky-400 border border-white/5 shrink-0">
              <Droplets className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-sky-450" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-bold truncate">
                {t.humidTitle}
              </span>
              <span className="text-xs sm:text-sm font-sans font-extrabold text-white">
                {activeRecord.humidity.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Actuator activity states */}
          <div className="flex items-center gap-2 sm:gap-3 justify-start border-t border-l border-white/5 pt-2 pl-2 md:border-t-0 md:pt-0 md:pl-4 min-w-0">
            <div className="p-1.5 sm:p-3 rounded-lg sm:rounded-2xl bg-teal-500/10 text-teal-400 border border-white/5 shrink-0">
              <Wind className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-teal-400" />
            </div>
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-[8px] sm:text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-bold flex items-center truncate">
                <span>{t.actuatorsLabel}</span>
              </span>
              <div className="flex gap-1.5 items-center flex-wrap select-none mt-0.5">
                <span className={`text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded font-mono font-bold border ${
                  activeRecord.fanSpeed > 0 
                     ? 'bg-teal-500/20 text-teal-300 border-teal-500/20' 
                    : 'bg-black/30 text-slate-500 border-white/5'
                }`}>
                  {language === 'en' ? 'Fan' : 'Kipas'}:{activeRecord.fanSpeed}%
                </span>
                <span className={`text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded font-mono font-bold border ${
                  activeRecord.isMisting 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/20' 
                    : 'bg-black/30 text-slate-500 border-white/5'
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
