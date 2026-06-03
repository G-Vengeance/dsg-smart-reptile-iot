/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Fan, Droplets, Cpu, Play } from 'lucide-react';
import { ClimateState, ControlMode } from '../types';
import { translations } from '../utils/i18n';

interface ControlPanelProps {
  climate: ClimateState;
  onModeToggle: (mode: ControlMode) => void;
  onFanSpeedChange: (speed: number) => void;
  onMistingDurationChange: (duration: number) => void;
  onTriggerMist: () => void;
  humMinAlarm: number;
  humMaxAlarm: number;
  language?: 'en' | 'id';
}

export default function ControlPanel({
  climate,
  onModeToggle,
  onFanSpeedChange,
  onMistingDurationChange,
  onTriggerMist,
  humMinAlarm,
  humMaxAlarm,
  language = 'en',
}: ControlPanelProps) {
  const isAuto = climate.mode === 'AUTOMATIC';
  const t = translations[language];

  // State calculations
  const fanRunning = climate.fanSpeed > 0;
  // Rotation animation class matching the speed value
  let spinSpeedClass = 'animate-[spin_4s_linear_infinite]';
  if (climate.fanSpeed === 0) {
    spinSpeedClass = '';
  } else if (climate.fanSpeed < 30) {
    spinSpeedClass = 'animate-[spin_6s_linear_infinite]';
  } else if (climate.fanSpeed < 75) {
    spinSpeedClass = 'animate-[spin_3.5s_linear_infinite]';
  } else {
    // 75% to 100%
    spinSpeedClass = 'animate-[spin_1s_linear_infinite]';
  }

  return (
    <div
      id="actuator-control-center"
      className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between min-h-[300px] sm:min-h-[365px] md:min-h-[410px] h-full w-full"
    >
      {/* 1. Controller Header with Segmented Switcher stacked vertically */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-2 sm:pb-3 w-full">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide font-sans truncate">
              {t.controlTitle}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              {t.modeSelector}
            </p>
          </div>
        </div>

        {/* Pill Shaped Toggle Switch */}
        <div id="mode-switcher-container" className="relative p-0.5 sm:p-1 bg-black/20 border border-white/5 rounded-full flex w-full select-none h-8 sm:h-10 mt-0.5">
          {/* Sizing box automatic */}
          <button
            id="btn-toggle-auto"
            onClick={() => onModeToggle('AUTOMATIC')}
            className={`flex-1 relative z-10 text-[8px] sm:text-[10px] font-semibold font-mono tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-full ${
              climate.mode === 'AUTOMATIC' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              id="auto-dot-indicator"
              className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${
                climate.mode === 'AUTOMATIC' ? 'bg-emerald-800' : 'bg-emerald-500'
              } shadow-[0_0_6px_rgba(16,185,129,0.5)]`}
            />
            {t.autoMode}
          </button>

          {/* Sizing box manual */}
          <button
            id="btn-toggle-manual"
            onClick={() => onModeToggle('MANUAL')}
            className={`flex-1 relative z-10 text-[8px] sm:text-[10px] font-semibold font-mono tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-full ${
              climate.mode === 'MANUAL' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              id="manual-dot-indicator"
              className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${
                climate.mode === 'MANUAL' ? 'bg-amber-800' : 'bg-amber-500'
              } shadow-[0_0_6px_rgba(245,158,11,0.5)]`}
            />
            {t.manualMode}
          </button>

          {/* Sliding pills backdrop slider */}
          <motion.div
            id="mode-sliding-pill-indicator"
            className={`absolute top-0.5 bottom-0.5 rounded-full ${
              climate.mode === 'AUTOMATIC' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{
              width: 'calc(50% - 2px)',
              left: climate.mode === 'AUTOMATIC' ? '2px' : 'calc(50%)',
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          />
        </div>
      </div>

      {/* Stacking both Mini Actuators Cards vertically with tight grid height */}
      <div className="flex flex-col gap-2.5 py-1.5 sm:py-2.5 flex-grow justify-between items-stretch w-full">
        {/* A. Cool Fan Center */}
        <div
          id="cooling-fan-card"
          className="flex flex-col justify-between p-2 sm:p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-250 h-auto sm:h-[105px] min-h-[85px] w-full gap-1 sm:gap-1.5"
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 shrink-0">
                <Fan className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${spinSpeedClass}`} />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wide font-mono truncate">
                {t.fanTitle}
              </span>
            </div>
            {/* Realtime status */}
            <span
              id="fan-status-label"
              className={`text-[8px] sm:text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                fanRunning
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
              } tracking-wider font-semibold shrink-0`}
            >
              {fanRunning ? t.fanStatusActive : t.fanStatusIdle}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span id="fan-speed-value" className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 truncate mr-2">
              {t.fanSpeedLabel} <span className="text-white font-sans font-extrabold text-xs sm:text-sm">{fanRunning ? '100%' : '0%'}</span>
            </span>

            {/* Toggle switch with motion animation */}
            <button
              id="cooling-fan-toggle"
              disabled={isAuto}
              onClick={() => {
                onFanSpeedChange(fanRunning ? 0 : 100);
              }}
              className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-300 outline-none flex items-center shrink-0 ${
                isAuto
                  ? 'bg-slate-800 cursor-not-allowed opacity-40'
                  : fanRunning
                  ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              <motion.div
                id="fan-toggle-marker"
                className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md"
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                animate={{ x: fanRunning ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 16 : 20) : 0 }}
              />
            </button>
          </div>

          <div className="text-[7px] sm:text-[8px] text-slate-500 leading-none truncate">
            {isAuto ? (
              <span className="text-teal-400/80 font-mono">{t.fanAutoTip.replace('%max%', String(humMaxAlarm))}</span>
            ) : (
              <span className="text-amber-400/85 font-mono">{t.fanManualTip}</span>
            )}
          </div>
        </div>

        {/* B. Misting Center */}
        <div
          id="misting-system-card"
          className="flex flex-col justify-between p-2 sm:p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-250 h-auto sm:h-[105px] min-h-[85px] w-full gap-1 sm:gap-1.5"
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-blue-500/10 border border-blue-5500/20 text-blue-300 shrink-0">
                <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wide font-mono truncate">
                {t.mistTitle}
              </span>
            </div>
            <span
              id="misting-status-label"
              className={`text-[8px] sm:text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                climate.isMisting
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 animate-pulse'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
              } tracking-wider font-semibold`}
            >
              {climate.isMisting ? `${climate.mistingCountdown} ${language === 'en' ? 's' : 'dt'}` : t.mistStatusIdle}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Duration Selector dropdown */}
            <div className="flex items-center gap-1 bg-black/25 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-white/5 shrink-0">
              <span className="text-[7px] sm:text-[8px] uppercase text-zinc-500 tracking-wider font-mono shrink-0">
                {t.mistSeconds}
              </span>
              <select
                id="duration-select"
                value={climate.mistingDuration}
                onChange={(e) => onMistingDurationChange(Number(e.target.value))}
                disabled={isAuto || climate.isMisting}
                className={`py-0 px-0.5 text-[9px] sm:text-[10px] font-semibold font-mono bg-transparent border-none text-white outline-none focus:ring-0 ${
                  isAuto || climate.isMisting ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                }`}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                <option value="5">5s</option>
                <option value="10">10s</option>
                <option value="15">15s</option>
                <option value="20">20s</option>
                <option value="30">30s</option>
              </select>
            </div>

            {/* Spray Now direct action button */}
            <button
              id="btn-spray-now"
              onClick={onTriggerMist}
              disabled={isAuto || climate.isMisting}
              className={`flex-1 py-1 sm:py-1.5 px-1.5 sm:px-3 rounded-lg border border-blue-500/30 bg-blue-600/20 hover:bg-blue-500/30 text-blue-300 text-[9px] sm:text-[10px] font-semibold font-mono tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden truncate`}
            >
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-450 fill-blue-450 shrink-0" />
              {climate.isMisting ? t.mistStatusActive : t.mistBtnSpray}
            </button>
          </div>

          <div className="text-[7px] sm:text-[8px] text-slate-500 leading-none truncate">
            {isAuto ? (
              <span className="text-blue-400/80 font-mono">{t.mistAutoTip.replace('%min%', String(humMinAlarm))}</span>
            ) : (
              <span className="text-amber-400/85 font-mono">{t.mistManualTip}</span>
            )}
          </div>
        </div>
      </div>

      {/* Safety notice info */}
      <p className="text-[8px] sm:text-[10px] text-slate-400/80 font-mono text-center flex items-center justify-center gap-1 leading-none mt-1 sm:mt-2 select-none">
        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping mr-1" />
        {t.safetyFeatureActive}
      </p>
    </div>
  );
}
