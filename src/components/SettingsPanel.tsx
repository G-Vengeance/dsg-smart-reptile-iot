/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  SlidersHorizontal,
  Flame,
  Sun,
  ShieldAlert,
  Wrench,
  RotateCcw,
  Cpu,
  Terminal,
  Activity,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';
import { SettingsState, TelemetryLog } from '../types';
import { translations } from '../utils/i18n';

interface SettingsPanelProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState | ((prev: SettingsState) => SettingsState)) => void;
  onResetConfig: () => void;
  onFeedSnake: () => void;
  onAdvanceShed: () => void;
  onClearTerminalLogs: () => void;
  logsCount: number;
  historyCount: number;
  logs: TelemetryLog[];
  tempUnit?: 'C' | 'F';
}

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onResetConfig,
  onFeedSnake,
  onAdvanceShed,
  onClearTerminalLogs,
  logsCount,
  historyCount,
  logs = [],
  tempUnit = 'C',
}: SettingsPanelProps) {
  const [isLocked, setIsLocked] = React.useState(false);
  const lockTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const language = settings.language || 'en';
  const t = translations[language];

  React.useEffect(() => {
    const handleActivity = () => {
      setIsLocked(currentLocked => {
        if (currentLocked) return true;
        
        if (lockTimerRef.current) {
          clearTimeout(lockTimerRef.current);
        }
        lockTimerRef.current = setTimeout(() => {
          setIsLocked(true);
        }, 5 * 60 * 1000); // 5 mins
        
        return false;
      });
    };

    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, 5 * 60 * 1000);

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      events.forEach(ev => window.removeEventListener(ev, handleActivity));
    };
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, 5 * 60 * 1000);
  };
  
  const handleRangeChange = (key: keyof SettingsState, value: any) => {
    onSettingsChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const celsiusToUnit = (c: number) => {
    return tempUnit === 'F' ? (c * 1.8) + 32 : c;
  };

  return (
    <div
      id="executive-settings-grid"
      className="w-full flex flex-col gap-6 text-[var(--text-primary)] transition-all duration-300"
    >
      {/* 1. Language preference bar */}
      <div 
        id="general-preferences-bar" 
        className="w-full rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-4 sm:p-5 shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-app)] text-[var(--accent-primary)]">
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
              {t.languageChoice}
            </h3>
            <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-sans mt-0.5 font-medium">
              {t.languageDesc}
            </p>
          </div>
        </div>

        {/* Sliding Pill Selector */}
        <div id="language-switcher-pills" className="relative p-1 bg-[var(--bg-app)] border border-[var(--border-card)] rounded-full flex w-full sm:w-52 select-none h-8 sm:h-9 shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => handleRangeChange('language', 'en')}
            className={`flex-1 relative z-10 text-[10px] sm:text-xs font-bold font-sans tracking-wide transition-all duration-300 flex items-center justify-center cursor-pointer rounded-full ${
              language === 'en' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleRangeChange('language', 'id')}
            className={`flex-1 relative z-10 text-[10px] sm:text-xs font-bold font-sans tracking-wide transition-all duration-300 flex items-center justify-center cursor-pointer rounded-full ${
              language === 'id' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Bahasa
          </button>
          <motion.div
            id="language-pills-backdrop"
            className="absolute top-1 bottom-1 rounded-full bg-[#2b5c2a] dark:bg-[#203c25]"
            style={{
              width: 'calc(50% - 4px)',
              left: language === 'en' ? '4px' : 'calc(50%)',
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          />
        </div>
      </div>

      {/* Settings Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLocked ? (
          <div
            id="settings-locked-screen"
            className="lg:col-span-2 rounded-3xl border border-dashed border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/5 backdrop-blur-md p-8 shadow-sm flex flex-col items-center justify-center text-center py-16 gap-5 transition-all duration-300"
          >
            <div className="relative">
              <div className="p-4 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                <Lock className="w-7 h-7" />
              </div>
            </div>
            <div className="max-w-md flex flex-col gap-1">
              <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
                {t.settingsLocked}
              </h3>
              <p className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider font-sans">
                {t.settingsLockedInactivity}
              </p>
              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed mt-2 font-medium">
                {t.settingsLockedDesc}
              </p>
            </div>
            <button
              id="btn-unlock-settings"
              onClick={handleUnlock}
              type="button"
              className="mt-2 px-5 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:text-white transition-all font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
            >
              <Unlock className="w-4 h-4" />
              {t.unlockBtn}
            </button>
          </div>
        ) : (
          <>
            {/* Card 1: Threshold Warnings Settings */}
            <div
              id="parameter-bounds-card"
              className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-6 shadow-[var(--shadow-card)] flex flex-col gap-5 transition-all duration-300"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border-card)] pb-4">
                <div className="p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
                    {t.autoRangeTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans font-medium mt-0.5">
                    {t.autoRangeDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Temp Min */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] font-sans font-bold">
                    <span>{t.tempMinLabel}</span>
                    <span className="text-amber-700 dark:text-amber-400">{celsiusToUnit(settings.tempMinAlarm).toFixed(1)}°{tempUnit}</span>
                  </div>
                  <input
                    id="input-range-temp-min"
                    type="range"
                    min="16"
                    max="26"
                    step="0.5"
                    value={settings.tempMinAlarm}
                    onChange={(e) => handleRangeChange('tempMinAlarm', parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 bg-[var(--bg-app)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-card)]"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {t.tempMinDesc.replace('%def%', celsiusToUnit(22).toFixed(1) + '°' + tempUnit)}
                  </span>
                </div>

                {/* Temp Max */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] font-sans font-bold">
                    <span>{t.tempMaxLabel}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{celsiusToUnit(settings.tempMaxAlarm).toFixed(1)}°{tempUnit}</span>
                  </div>
                  <input
                    id="input-range-temp-max"
                    type="range"
                    min="28"
                    max="36"
                    step="0.5"
                    value={settings.tempMaxAlarm}
                    onChange={(e) => handleRangeChange('tempMaxAlarm', parseFloat(e.target.value))}
                    className="w-full accent-rose-600 dark:accent-rose-500 bg-[var(--bg-app)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-card)]"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {t.tempMaxDesc.replace('%def%', celsiusToUnit(31).toFixed(1) + '°' + tempUnit)}
                  </span>
                </div>

                {/* Humid Min */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] font-sans font-bold">
                    <span>{t.humidMinLabel}</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{settings.humMinAlarm}%</span>
                  </div>
                  <input
                    id="input-range-hum-min"
                    type="range"
                    min="40"
                    max="70"
                    step="5"
                    value={settings.humMinAlarm}
                    onChange={(e) => handleRangeChange('humMinAlarm', parseInt(e.target.value))}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 bg-[var(--bg-app)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-card)]"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {t.humidMinDesc.replace('%def%', '60%')}
                  </span>
                </div>

                {/* Humid Max */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] font-sans font-bold">
                    <span>{t.humidMaxLabel}</span>
                    <span className="text-teal-700 dark:text-teal-400 font-bold">{settings.humMaxAlarm}%</span>
                  </div>
                  <input
                    id="input-range-hum-max"
                    type="range"
                    min="75"
                    max="95"
                    step="5"
                    value={settings.humMaxAlarm}
                    onChange={(e) => handleRangeChange('humMaxAlarm', parseInt(e.target.value))}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 bg-[var(--bg-app)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-card)]"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {t.humidMaxDesc.replace('%def%', '85%')}
                  </span>
                </div>

                {/* Mute alerts */}
                <div className="flex items-center justify-between bg-[var(--bg-app)] p-3.5 rounded-2xl border border-[var(--border-card)] mt-2 transition-all">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold font-sans text-[var(--text-primary)]">{t.muteAlertTitle}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-sans font-medium">{t.muteAlertDesc}</span>
                  </div>
                  <button
                    id="toggle-mute-alerts"
                    type="button"
                    onClick={() => onSettingsChange(prev => ({ ...prev, muteAlerts: !prev.muteAlerts }))}
                    className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.muteAlerts ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.muteAlerts ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Night Mode */}
                <div className="flex items-center justify-between bg-[var(--bg-app)] p-3.5 rounded-2xl border border-[var(--border-card)] mt-2 pb-3.5 transition-all">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold font-sans text-[var(--text-primary)]">{t.darkModeTitle}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-sans font-medium">{t.darkModeDesc}</span>
                  </div>
                  <button
                    id="toggle-dark-mode"
                    type="button"
                    onClick={() => onSettingsChange(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                    className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.darkMode ? 'bg-[#2b5c2a] dark:bg-[#4ade80]' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.darkMode ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Environment Modifiers */}
            <div
              id="actuator-coefficients-card"
              className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-6 shadow-[var(--shadow-card)] flex flex-col gap-5 transition-all duration-300"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border-card)] pb-4">
                <div className="p-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-app)] text-[var(--accent-primary)]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
                    {t.modifierTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans font-medium mt-0.5">
                    {t.modifierDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* Sampling Interval */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] font-sans font-bold">
                    <span>{t.intervalTitle}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{settings.sensorInterval} {language === 'en' ? 's' : 'detik'}</span>
                  </div>
                  <input
                    id="input-range-sensor-interval"
                    type="range"
                    min="10"
                    max="120"
                    step="10"
                    value={settings.sensorInterval}
                    onChange={(e) => handleRangeChange('sensorInterval', parseInt(e.target.value))}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 bg-[var(--bg-app)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-card)]"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium">
                    {t.intervalDesc.replace('%def%', '120')}
                  </p>
                </div>

                {/* Heatpad Intensity */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] font-sans font-bold">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {t.heatStrengthTitle}
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-bold">{settings.heaterIntensity}%</span>
                  </div>
                  <input
                    id="input-range-heater-intensity"
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={settings.heaterIntensity}
                    onChange={(e) => handleRangeChange('heaterIntensity', parseInt(e.target.value))}
                    className="w-full accent-amber-600 dark:accent-amber-500 bg-[var(--bg-app)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-card)]"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {t.heatStrengthDesc.replace('%def%', '75%')}
                  </p>
                </div>

                {/* LED Brightness */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] font-sans font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-yellow-500" />
                      {t.ledStrengthTitle}
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">{settings.ledIntensity}%</span>
                  </div>
                  <input
                    id="input-range-led-intensity"
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={settings.ledIntensity}
                    onChange={(e) => handleRangeChange('ledIntensity', parseInt(e.target.value))}
                    className="w-full accent-yellow-600 dark:accent-yellow-500 bg-[var(--bg-app)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-card)]"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {t.ledStrengthDesc.replace('%def%', '50%')}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Row 2 settings modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overrides widget */}
        {isLocked ? (
          <div
            id="biometric-override-commands-card-locked"
            className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[280px]"
          >
            <div className="p-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] text-[var(--text-secondary)]">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold font-sans">
                {language === 'en' ? 'Snake Overrides Closed' : 'Tombol Ular Terkunci'}
              </span>
              <p className="text-[10px] text-[var(--text-secondary)] font-sans max-w-xs leading-normal mt-1 font-bold">
                {language === 'en' ? 'Unlock settings above to manual-feed or force shedding.' : 'Buka kunci pengaman di atas untuk memicu pintasan memberi makan atau ganti kulit ular.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            id="biometric-override-commands-card"
            className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-all duration-300"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-[var(--border-card)] pb-4">
                <div className="p-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-app)] text-[var(--accent-primary)]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
                    {t.shortCutTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans font-medium mt-0.5">
                    {t.shortCutDesc}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed font-medium">
                {language === 'en' ? 'Direct physical injectors for testing snake bio-condition states instantly.' : 'Pintasan praktis demi langsung mengubah kondisi fisik ular: mempercepat pergantian kulit atau mensimulasikan pemberian makan instan.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                id="settings-btn-feed"
                onClick={onFeedSnake}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-all font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t.feedBtn}
              </button>
              <button
                id="settings-btn-shed"
                onClick={onAdvanceShed}
                className="w-full py-2.5 px-4 rounded-xl border border-purple-500/25 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition-all font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              >
                <Activity className="w-4 h-4" />
                {t.shedBtn}
              </button>
            </div>
          </div>
        )}

        {/* Board specs info */}
        <div
          id="mcu-specs-card"
          className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-all duration-300"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-[var(--border-card)] pb-4">
              <div className="p-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-app)] text-[var(--accent-primary)]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
                  {t.specTitle}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-sans font-medium mt-0.5">
                  {t.specDesc}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 font-sans text-[10.5px] leading-relaxed text-[var(--text-secondary)] font-bold">
              <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-1">
                <span>{t.modelLabel}</span>
                <span className="text-[var(--text-primary)]">MIDAS-VIPER-IV</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-1">
                <span>{t.procLabel}</span>
                <span className="text-[var(--text-primary)]">ARM Cortex-M7</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-1">
                <span>{t.flashLabel}</span>
                <span className="text-[var(--text-primary)]">512KB EEPROM</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-1">
                <span>{t.protoLabel}</span>
                <span className="text-[var(--text-primary)]">RS-485 Modbus RTU</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t.sensorCodeLabel}</span>
                <span className="text-[var(--accent-primary)]">DHT22, HR-IR, SGP40</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-app)] rounded-2xl px-4 py-2 border border-[var(--border-card)] mt-5 text-[9px] font-sans font-bold tracking-wide">
            <span className="text-[var(--text-secondary)] block">{t.integrityLabel}</span>
            <span className="text-[var(--accent-primary)]">● ACTIVE_STABILITY_MONITOR_NOMINAL</span>
          </div>
        </div>

        {/* Diagnostics purging widget */}
        {isLocked ? (
          <div
            id="diagnostic-utils-card-locked"
            className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[280px]"
          >
            <div className="p-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] text-[var(--text-secondary)]">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold font-sans">
                {language === 'en' ? 'Diagnostics Locked' : 'Diagnostik & Reset Terkunci'}
              </span>
              <p className="text-[10px] text-[var(--text-secondary)] font-sans max-w-xs leading-normal mt-1 font-bold">
                {language === 'en' ? 'Unlock settings above to purge logging vault or wipe system configurations.' : 'Buka kunci pengaman di atas untuk menghapus catatan aktivitas atau mereset semua pengaturan.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            id="diagnostic-utils-card"
            className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-all duration-300"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-[var(--border-card)] pb-4">
                <div className="p-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
                    {t.diagTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans font-medium mt-0.5">
                    {t.diagDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-sans text-xs mt-1 font-bold text-[var(--text-secondary)]">
                <div className="flex justify-between items-center">
                  <span>{t.logsCountLabel}</span>
                  <span className="text-[var(--text-primary)]">{logsCount} {language === 'en' ? t.linesAbbr : 'baris'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t.queueCountLabel}</span>
                  <span className="text-[var(--text-primary)]">{historyCount} {language === 'en' ? t.datasetAbbr : 'data'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                id="settings-btn-clear-logs"
                onClick={onClearTerminalLogs}
                className="w-full py-2 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-[var(--bg-app)] hover:bg-[var(--border-card)] transition-all font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <Terminal className="w-3.5 h-3.5" />
                {t.clearLogsBtn}
              </button>
              <button
                id="settings-btn-reset-all"
                onClick={onResetConfig}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-500/20 bg-rose-500/10 dark:bg-rose-950/20 hover:bg-rose-500/15 text-rose-700 dark:text-rose-300 transition-all font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.resetBtn}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Warning Alert triages */}
      <div
        id="critical-alerts-triage-panel"
        className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] flex flex-col gap-4 w-full transition-all duration-300"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight font-sans">
                {t.activeAlarmsTitle}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans font-medium mt-0.5">
                {t.activeAlarmsDesc}
              </p>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            {t.totalAlarms.replace('%count%', String(logs.filter((log) => log.type === 'warn' || log.type === 'error').length))}
          </span>
        </div>

        {logs.filter((log) => log.type === 'warn' || log.type === 'error').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {[...logs]
              .filter((log) => log.type === 'warn' || log.type === 'error')
              .reverse()
              .slice(0, 10)
              .map((log, idx) => {
                const isError = log.type === 'error';
                return (
                  <div
                    key={`${log.id}-${idx}`}
                    className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all ${
                      isError
                        ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                        : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] uppercase font-sans font-bold px-1.5 py-0.5 rounded ${
                          isError
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {log.type === 'error' ? t.dangerWord : t.warningWord}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-sans tracking-tight font-bold">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-primary)] font-sans leading-relaxed truncate-2-lines flex-1">
                      {log.message}
                    </p>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-[var(--bg-app)] border border-[var(--border-card)] rounded-2xl">
            <p className="text-xs font-bold text-[var(--accent-primary)] font-sans uppercase tracking-wide">
              {t.noAlarmsText}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] font-sans mt-1 font-semibold">
              {t.noAlarmsDesc}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
