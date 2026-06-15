/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Eye, Shield, Activity, RefreshCw } from 'lucide-react';
import { BiometricState } from '../types';
import { translations } from '../utils/i18n';

interface BiometricsModuleProps {
  biometrics: BiometricState;
  onFeedSnake: () => void;
  onAdvanceShed: () => void;
  language?: 'en' | 'id';
}

export default function BiometricsModule({
  biometrics,
  onFeedSnake,
  onAdvanceShed,
  language = 'en',
}: BiometricsModuleProps) {
  const t = translations[language];

  // Determine active segments (0 to 5 filled cells)
  const batteryLevel = Math.round(biometrics.digestionPhase / 20);

  // Soft eye-friendly indicator colors (avoiding bright saturated neon)
  let activityColor = 'bg-emerald-600 dark:bg-emerald-500';
  let activityText = 'text-emerald-700 dark:text-emerald-400';
  let activityBg = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/20';

  if (biometrics.activityLevel === 'Hunting') {
    activityColor = 'bg-amber-600 dark:bg-amber-500';
    activityText = 'text-amber-700 dark:text-amber-400';
    activityBg = 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800/20';
  } else if (biometrics.activityLevel === 'Foraging') {
    activityColor = 'bg-amber-600 dark:bg-amber-500';
    activityText = 'text-amber-700 dark:text-amber-400';
    activityBg = 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800/20';
  }

  return (
    <div
      id="biometric-analytics-panel"
      className="col-span-2 lg:col-span-1 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-[var(--shadow-card)] flex flex-col justify-between min-h-[300px] sm:min-h-[365px] md:min-h-[410px] h-full w-full text-[var(--text-primary)] transition-all duration-300"
    >
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2.5 sm:pb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold tracking-wide font-sans truncate">
              {t.biometricsTitle}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-sans tracking-wider truncate uppercase font-semibold">
              {t.cameraActive}
            </p>
          </div>
        </div>
      </div>

      {/* Widgets */}
      <div className="flex flex-col gap-3.5 py-2 sm:py-3 flex-grow justify-between items-stretch w-full">
        
        {/* 1. Digestion Phase */}
        <div
          id="digestion-widget"
          className="flex flex-col justify-center bg-[var(--bg-app)] p-3 rounded-2xl border border-[var(--border-card)] min-h-[58px] sm:min-h-[74px] h-auto w-full gap-2 transition-all duration-300"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block truncate">
              {t.digestionTitle}
            </span>
            <button
              id="trigger-feed-button"
              onClick={onFeedSnake}
              className="py-1 px-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
            >
              <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {t.feedBtn}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[var(--border-card)] pt-2">
            <div className="relative flex items-center p-0.5 sm:p-1 w-16 sm:w-20 h-4 border border-[var(--border-card)] rounded bg-[var(--bg-card)] shrink-0 shadow-inner">
              <div className="grid grid-cols-5 gap-0.5 w-full h-full">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    id={`battery-cell-${idx}`}
                    className={`rounded-[2px] h-full transition-all duration-300 ${
                      idx < batteryLevel
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                    animate={{
                      opacity: idx < batteryLevel ? [0.85, 1, 0.85] : 1,
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: idx * 0.12,
                    }}
                  />
                ))}
              </div>
              <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-[var(--border-card)] border-r border-t border-b rounded-r-[1px]" />
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-xs font-bold font-mono">{biometrics.digestionPhase}%</span>
              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">{t.completeWord}</span>
            </div>
          </div>
        </div>

        {/* 2. Shedding Predictor */}
        <div
          id="shedding-widget"
          className="flex items-center justify-between bg-[var(--bg-app)] p-3 rounded-2xl border border-[var(--border-card)] h-auto sm:h-[68px] min-h-[50px] w-full gap-2 transition-all duration-300"
        >
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex justify-between items-center gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] truncate">
                {t.shedTitle}
              </span>
              <span className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-300 font-bold shrink-0 font-mono">
                {biometrics.sheddingPredictor}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
              <motion.div
                id="shedding-progress-bar"
                className="h-full bg-gradient-to-r from-purple-600 to-[#a855f7] dark:from-purple-500 dark:to-[#d8b4fe] rounded-full"
                animate={{ width: `${biometrics.sheddingPredictor}%` }}
                transition={{ type: 'spring', stiffness: 45, damping: 10 }}
              />
            </div>
            <p className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-medium truncate leading-none">
              {biometrics.sheddingPredictor >= 80 ? t.shedWarning : t.shedNormal}
            </p>
          </div>
          <button
            id="trigger-shed-increment"
            onClick={onAdvanceShed}
            className="py-1.5 px-2.5 rounded-lg border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 text-[9px] sm:text-[10px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 animate-none"
          >
            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {t.shedBtn}
          </button>
        </div>

        {/* 3. Activity Level Equalizer */}
        <div
          id="activity-widget"
          className="flex items-center justify-between bg-[var(--bg-app)] p-3 rounded-2xl border border-[var(--border-card)] h-auto sm:h-[68px] min-h-[50px] w-full gap-2 transition-all duration-300"
        >
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block truncate">
              {t.activityTitle}
            </span>
            <div
              id="active-behavior-badge"
              className={`text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded border transition-all duration-300 font-bold uppercase inline-block text-center w-fit truncate ${activityBg} ${activityText}`}
            >
              • {biometrics.activityLevel === 'Resting' ? t.behaviorResting : biometrics.activityLevel === 'Hunting' ? t.behaviorHunting : t.behaviorForaging}
            </div>
          </div>

          <div className="flex items-end justify-between px-2 h-7 sm:h-9 bg-[var(--bg-card)] rounded-lg border border-[var(--border-card)] py-1.5 overflow-hidden gap-[3px] w-16 sm:w-24 shrink-0 shadow-inner">
            {biometrics.activityIndex.map((val, idx) => (
              <div key={idx} className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-[2px] h-full flex flex-col justify-end">
                <motion.div
                  id={`eq-bar-${idx}`}
                  className={`w-full rounded-[2px] ${activityColor} transition-all duration-350`}
                  animate={{
                    height: `${Math.max(15, val)}%`,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 12,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Snake Info Footer */}
      <div className="border-t border-[var(--border-card)] pt-2 flex items-center justify-between text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-sans gap-1 select-none font-bold">
        <div className="truncate">
          ID: <strong className="text-[var(--text-primary)]">Midas</strong>
        </div>
        <div className="truncate text-right">
          Spec: <span className="italic font-bold">Tropidolaemus subannulatus</span>
        </div>
      </div>
    </div>
  );
}
