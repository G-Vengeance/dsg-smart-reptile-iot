/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
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

  const fanRunning = climate.fanSpeed > 0;
  // Rotation speed
  let spinSpeedClass = 'animate-[spin_4s_linear_infinite]';
  if (climate.fanSpeed === 0) {
    spinSpeedClass = '';
  } else if (climate.fanSpeed < 30) {
    spinSpeedClass = 'animate-[spin_6s_linear_infinite]';
  } else if (climate.fanSpeed < 75) {
    spinSpeedClass = 'animate-[spin_3.5s_linear_infinite]';
  } else {
    spinSpeedClass = 'animate-[spin_1.5s_linear_infinite]';
  }

  return (
    <div
      id="actuator-control-center"
      className="col-span-2 lg:col-span-1 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-4 sm:p-6 shadow-[var(--shadow-card)] flex flex-col justify-between min-h-[300px] sm:min-h-[365px] md:min-h-[410px] h-full w-full text-[var(--text-primary)] transition-all duration-300"
    >
      {/* Controller Header with Segmented Toggler */}
      <div className="flex flex-col gap-2.5 border-b border-[var(--border-card)] pb-2.5 sm:pb-3 w-full">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wide font-sans truncate">
              {t.controlTitle}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-sans font-bold tracking-wider truncate uppercase">
              {t.modeSelector}
            </p>
          </div>
        </div>

        {/* Pill Shaped Toggle Switch */}
        <div id="mode-switcher-container" className="relative p-1 bg-[var(--bg-app)] border border-[var(--border-card)] rounded-full flex w-full select-none h-8 sm:h-9 mt-0.5 shadow-inner">
          <button
            id="btn-toggle-auto"
            onClick={() => onModeToggle('AUTOMATIC')}
            className={`flex-1 relative z-10 text-[9px] sm:text-[10px] font-bold font-sans tracking-wide transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-full ${
              climate.mode === 'AUTOMATIC' ? 'text-white font-extrabold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span
              id="auto-dot-indicator"
              className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${
                climate.mode === 'AUTOMATIC' ? 'bg-white' : 'bg-[var(--accent-primary)]'
              }`}
            />
            {t.autoMode}
          </button>

          <button
            id="btn-toggle-manual"
            onClick={() => onModeToggle('MANUAL')}
            className={`flex-1 relative z-10 text-[9px] sm:text-[10px] font-bold font-sans tracking-wide transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-full ${
              climate.mode === 'MANUAL' ? 'text-white font-extrabold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span
              id="manual-dot-indicator"
              className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${
                climate.mode === 'MANUAL' ? 'bg-white' : 'bg-[var(--accent-secondary)]'
              }`}
            />
            {t.manualMode}
          </button>

          {/* Sliding backdrop */}
          <motion.div
            id="mode-sliding-pill-indicator"
            className="absolute top-1 bottom-1 rounded-full bg-[#2b5c2a] dark:bg-[#203c25] shadow-sm"
            style={{
              width: 'calc(50% - 4px)',
              left: climate.mode === 'AUTOMATIC' ? '4px' : 'calc(50%)',
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          />
        </div>
      </div>

      {/* Actuator Cards */}
      <div className="flex flex-col gap-3 py-2 sm:py-3 flex-grow justify-between items-stretch w-full">
        
        {/* A. Ventilation Fan Control */}
        <div
          id="cooling-fan-card"
          className="flex flex-col justify-between p-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] hover:bg-[var(--border-card)] transition-all duration-200 h-auto sm:h-[105px] min-h-[85px] w-full gap-1.5"
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded bg-[var(--border-card)] text-[var(--accent-primary)] shrink-0">
                <Fan className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${spinSpeedClass}`} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide font-sans truncate">
                {t.fanTitle}
              </span>
            </div>
            {/* Fan Status */}
            <span
              id="fan-status-label"
              className={`text-[8px] sm:text-[9px] uppercase font-sans px-2 py-0.5 rounded border transition-all duration-300 tracking-wider font-bold shrink-0 ${
                fanRunning
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/20'
                  : 'bg-zinc-100 dark:bg-zinc-800/50 text-[var(--text-secondary)] border-zinc-200/50 dark:border-zinc-700/50'
              }`}
            >
              {fanRunning ? t.fanStatusActive : t.fanStatusIdle}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span id="fan-speed-value" className="text-[10px] sm:text-xs font-sans font-medium text-[var(--text-secondary)] truncate mr-2">
              {t.fanSpeedLabel} <span className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)]">{fanRunning ? '100%' : '0%'}</span>
            </span>

            {/* Slider Switch */}
            <button
              id="cooling-fan-toggle"
              disabled={isAuto}
              onClick={() => {
                onFanSpeedChange(fanRunning ? 0 : 100);
              }}
              className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-300 outline-none flex items-center shrink-0 ${
                isAuto
                  ? 'bg-zinc-200 dark:bg-zinc-800 cursor-not-allowed opacity-40'
                  : fanRunning
                  ? 'bg-[#2b5c2a] dark:bg-[#4ade80] shadow-sm'
                  : 'bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
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

          <div className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] leading-none truncate font-semibold">
            {isAuto ? (
              <span className="text-[var(--accent-primary)]">{t.fanAutoTip.replace('%max%', String(humMaxAlarm))}</span>
            ) : (
              <span className="text-[var(--accent-secondary)]">{t.fanManualTip}</span>
            )}
          </div>
        </div>

        {/* B. Misting System Control */}
        <div
          id="misting-system-card"
          className="flex flex-col justify-between p-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] hover:bg-[var(--border-card)] transition-all duration-200 h-auto sm:h-[105px] min-h-[85px] w-full gap-1.5"
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded bg-[var(--border-card)] text-blue-600 dark:text-blue-400 shrink-0">
                <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide font-sans truncate">
                {t.mistTitle}
              </span>
            </div>
            {/* Misting Status */}
            <span
              id="misting-status-label"
              className={`text-[8px] sm:text-[9px] uppercase font-sans px-2 py-0.5 rounded border shrink-0 transition-all duration-300 font-bold ${
                climate.isMisting
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-300/40 dark:border-blue-800/40 animate-pulse'
                  : 'bg-zinc-100 dark:bg-zinc-800/50 text-[var(--text-secondary)] border-zinc-200/50 dark:border-zinc-700/50'
              }`}
            >
              {climate.isMisting ? `${climate.mistingCountdown}${language === 'en' ? 's' : 'dt'}` : t.mistStatusIdle}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Duration Selector dropdown */}
            <div className="flex items-center gap-1 bg-[var(--bg-card)] px-2 py-0.5 rounded-lg border border-[var(--border-card)] shrink-0 shadow-sm">
              <span className="text-[8px] sm:text-[9px] uppercase text-[var(--text-secondary)] font-bold font-sans shrink-0">
                {t.mistSeconds}
              </span>
              <select
                id="duration-select"
                value={climate.mistingDuration}
                onChange={(e) => onMistingDurationChange(Number(e.target.value))}
                disabled={isAuto || climate.isMisting}
                className={`py-0.5 px-1.5 text-[9px] sm:text-[10px] font-bold font-sans bg-transparent border-none text-[var(--text-primary)] outline-none focus:ring-0 ${
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

            {/* Spray Now Button */}
            <button
              id="btn-spray-now"
              onClick={onTriggerMist}
              disabled={isAuto || climate.isMisting}
              className={`flex-1 py-1 sm:py-1.5 px-3 rounded-lg border border-blue-500/20 dark:border-blue-500/30 bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 text-[9px] sm:text-[10px] font-bold font-sans tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden truncate active:scale-95`}
            >
              {climate.isMisting && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-blue-500/20 z-0"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: climate.mistingCountdown, ease: 'linear' }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5 w-full">
                {climate.isMisting ? (
                  <>
                    <span className="animate-ping w-1.5 h-1.5 rounded-full bg-blue-500 mr-0.5 shrink-0" />
                    {t.mistStatusActive} ({climate.mistingCountdown}s)
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current shrink-0" />
                    {t.mistBtnSpray}
                  </>
                )}
              </span>
            </button>
          </div>

          <div className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] leading-none truncate font-semibold">
            {isAuto ? (
              <span className="text-blue-600 dark:text-blue-400">{t.mistAutoTip.replace('%min%', String(humMinAlarm))}</span>
            ) : (
              <span className="text-[var(--accent-secondary)]">{t.mistManualTip}</span>
            )}
          </div>
        </div>
      </div>

      {/* Safety notice info */}
      <p className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-bold text-center flex items-center justify-center gap-1 leading-none mt-1 sm:mt-2 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse mr-0.5" />
        {t.safetyFeatureActive}
      </p>
    </div>
  );
}

