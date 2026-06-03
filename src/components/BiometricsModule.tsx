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
  // Use translations dict
  const t = translations[language];

  // Determine how many segments of the 5-level battery are active
  // absorption percentage: 0% to 100% -> maps to 0 to 5 filled cells
  const batteryLevel = Math.round(biometrics.digestionPhase / 20);

  // Equalizer color based on activity state
  let activityColor = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
  let activityText = 'text-cyan-400';
  let activityBg = 'bg-cyan-950/40 border-cyan-500/30';

  if (biometrics.activityLevel === 'Hunting') {
    activityColor = 'bg-red-500 shadow-[0_0_10px_#ef4444]';
    activityText = 'text-red-400';
    activityBg = 'bg-red-950/40 border-red-500/30';
  } else if (biometrics.activityLevel === 'Foraging') {
    activityColor = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
    activityText = 'text-amber-400';
    activityBg = 'bg-amber-950/40 border-amber-500/30';
  } else {
    // Resting
    activityColor = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
    activityText = 'text-emerald-400';
    activityBg = 'bg-emerald-950/40 border-emerald-500/30';
  }

  return (
    <div
      id="biometric-analytics-panel"
      className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5 sm:p-6 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between min-h-[300px] sm:min-h-[365px] md:min-h-[410px] h-full w-full"
    >
      {/* Module Title with Scanning Banner */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 sm:pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Eye className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide font-sans truncate">
              {t.biometricsTitle}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              {t.cameraActive}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 py-1.5 sm:py-2.5 flex-grow justify-between items-stretch w-full">
        {/* 1. Digestion Phase (Battery widget inside a horizontal card) */}
        <div
          id="digestion-widget"
          className="flex flex-col justify-center bg-black/25 p-2 sm:p-3 rounded-2xl border border-white/5 min-h-[58px] sm:min-h-[74px] h-auto w-full gap-1.5 sm:gap-2.5"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-slate-400 block truncate">
              {t.digestionTitle}
            </span>
            <button
              id="trigger-feed-button"
              onClick={onFeedSnake}
              className="py-1 px-1.5 sm:px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/25 hover:bg-emerald-500/40 text-emerald-300 text-[8px] sm:text-[10px] font-bold font-mono tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
            >
              <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
              {t.feedBtn}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1 sm:pt-1.5">
            {/* Battery Container */}
            <div className="relative flex items-center p-0.5 sm:p-1 w-14 sm:w-20 h-3.5 sm:h-[18px] border border-white/10 rounded bg-black/30 shadow-inner shrink-0">
              <div className="grid grid-cols-5 gap-0.5 w-full h-full">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    id={`battery-cell-${idx}`}
                    className={`rounded-[1px] h-full transition-all duration-300 ${
                      idx < batteryLevel
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.3)]'
                        : 'bg-slate-800'
                    }`}
                    animate={{
                      opacity: idx < batteryLevel ? [0.8, 1, 0.8] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: idx * 0.1,
                    }}
                  />
                ))}
              </div>
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-white/15 border-r border-t border-b border-white/10 rounded-r-[1px]" />
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-[10px] sm:text-xs font-bold text-white font-mono">{biometrics.digestionPhase}%</span>
              <span className="text-[7px] sm:text-[8px] font-mono text-slate-400 font-bold uppercase tracking-widest">{t.completeWord}</span>
            </div>
          </div>
        </div>

        {/* 2. Shedding Predictor (Linear progress widget inside a horizontal card) */}
        <div
          id="shedding-widget"
          className="flex items-center justify-between bg-black/25 p-2 sm:p-3 rounded-2xl border border-white/5 h-auto sm:h-[68px] min-h-[50px] w-full gap-2"
        >
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex justify-between items-center gap-1">
              <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-slate-400 truncate">
                {t.shedTitle}
              </span>
              <span className="text-[9px] sm:text-[10px] text-purple-300 font-mono font-bold shrink-0">
                {biometrics.sheddingPredictor}%
              </span>
            </div>
            {/* Linear Progress bar */}
            <div className="w-full h-1 sm:h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/5 relative p-[0.5px]">
              <motion.div
                id="shedding-progress-bar"
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                animate={{ width: `${biometrics.sheddingPredictor}%` }}
                transition={{ type: 'spring', stiffness: 45, damping: 10 }}
              />
            </div>
            <p className="text-[7px] sm:text-[8px] text-slate-500 italic truncate leading-none">
              {biometrics.sheddingPredictor >= 80 ? t.shedWarning : t.shedNormal}
            </p>
          </div>
          <button
            id="trigger-shed-increment"
            onClick={onAdvanceShed}
            className="py-1 px-1.5 sm:py-1.5 sm:px-3 rounded-lg border border-purple-500/30 bg-purple-950/20 hover:bg-purple-500/30 text-purple-300 text-[8px] sm:text-[10px] font-semibold font-mono tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
          >
            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 animate-spin-slow" />
            {t.shedBtn}
          </button>
        </div>

        {/* 3. Activity Index & Dancing Equalizer (Horizontal split) */}
        <div
          id="activity-widget"
          className="flex items-center justify-between bg-black/25 p-2 sm:p-3 rounded-2xl border border-white/5 h-auto sm:h-[68px] min-h-[50px] w-full gap-2"
        >
          <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-slate-400 block truncate">
              {t.activityTitle}
            </span>
            <div
              id="active-behavior-badge"
              className={`text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded border ${activityBg} transition-all duration-300 font-bold uppercase inline-block text-center w-fit truncate`}
            >
              • {biometrics.activityLevel === 'Resting' ? t.behaviorResting : biometrics.activityLevel === 'Hunting' ? t.behaviorHunting : t.behaviorForaging}
            </div>
            <span className="text-[7px] sm:text-[8px] text-slate-500 font-mono block leading-none">{t.activityUpdate}</span>
          </div>

          {/* Mini Equalizer on the right */}
          <div className="flex items-end justify-between px-1.5 h-7 sm:h-9 bg-black/30 rounded-lg border border-white/5 py-1 sm:py-1.5 overflow-hidden gap-[2px] w-16 sm:w-24 shrink-0">
            {biometrics.activityIndex.map((val, idx) => (
              <div key={idx} className="flex-1 bg-slate-800 rounded-[1px] h-full flex flex-col justify-end">
                <motion.div
                  id={`eq-bar-${idx}`}
                  className={`w-full rounded-[1px] ${activityColor} transition-all duration-300`}
                  animate={{
                    height: `${Math.max(15, val)}%`,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 15,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Snake Info Footer */}
      <div className="border-t border-white/5 pt-1.5 sm:pt-2 flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400 font-mono gap-1 select-none">
        <div className="truncate">
          ID: <strong className="text-white">Midas</strong>
        </div>
        <div className="truncate text-right">
          Spec: <span className="italic text-slate-300">T. subannulatus</span>
        </div>
      </div>
    </div>
  );
}

