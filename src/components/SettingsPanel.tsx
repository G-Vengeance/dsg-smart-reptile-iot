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
        if (currentLocked) return true; // keep locked if already locked
        
        if (lockTimerRef.current) {
          clearTimeout(lockTimerRef.current);
        }
        lockTimerRef.current = setTimeout(() => {
          setIsLocked(true);
        }, 5 * 60 * 1000); // 5 minutes inactivity
        
        return false;
      });
    };

    // Setup initial 5 minute timer
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
      className="w-full flex flex-col gap-6"
    >
      {/* 1. Dedicated Language Toggle Switch Bar (Always interactive, even if alarms are locked) */}
      <div 
        id="general-preferences-bar" 
        className="w-full rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight font-sans">
              {t.languageChoice}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 font-sans mt-0.5">
              {t.languageDesc}
            </p>
          </div>
        </div>

        {/* Sliding Pill Selector */}
        <div id="language-switcher-pills" className="relative p-1 bg-black/20 border border-white/5 rounded-full flex w-full sm:w-56 select-none h-8 sm:h-10 shrink-0">
          <button
            type="button"
            onClick={() => handleRangeChange('language', 'en')}
            className={`flex-1 relative z-10 text-[9px] sm:text-xs font-semibold font-mono tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-full ${
              language === 'en' ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleRangeChange('language', 'id')}
            className={`flex-1 relative z-10 text-[9px] sm:text-xs font-semibold font-mono tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer rounded-full ${
              language === 'id' ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Bahasa
          </button>
          <motion.div
            id="language-pills-backdrop"
            className="absolute top-1 bottom-1 rounded-full bg-cyan-400"
            style={{
              width: 'calc(50% - 4px)',
              left: language === 'en' ? '4px' : 'calc(50%)',
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          />
        </div>
      </div>

      {/* Upper Double Column Panel: Alarms & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLocked ? (
          <div
            id="settings-locked-screen"
            className="lg:col-span-2 rounded-3xl border border-dashed border-red-500/25 bg-red-950/5 backdrop-blur-xl p-8 shadow-[0_8px_32px_0_rgba(239,68,68,0.06)] flex flex-col items-center justify-center text-center py-16 gap-5 animate-none"
          >
            <div className="relative">
              <div className="p-4.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div className="max-w-md flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-white tracking-tight font-sans">
                {t.settingsLocked}
              </h3>
              <p className="text-[10px] text-red-500 font-mono uppercase tracking-wider">
                {t.settingsLockedInactivity}
              </p>
              <p className="text-xs text-slate-400 font-sans leading-relaxed mt-2.5">
                {t.settingsLockedDesc}
              </p>
            </div>
            <button
              id="btn-unlock-settings"
              onClick={handleUnlock}
              type="button"
              className="mt-2 px-5 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-500/20 text-emerald-300 hover:text-white transition-all font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
            >
              <Unlock className="w-4 h-4 text-emerald-400" />
              {t.unlockBtn}
            </button>
          </div>
        ) : (
          <>
            {/* Card 1: Threshold Warnings Settings */}
            <div
              id="parameter-bounds-card"
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col gap-5"
            >
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight font-sans">
                    {t.autoRangeTitle}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {t.autoRangeDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Temperature Minimum Alarm */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>{t.tempMinLabel}</span>
                    <span className="text-amber-400 font-bold">{celsiusToUnit(settings.tempMinAlarm).toFixed(1)}°{tempUnit}</span>
                  </div>
                  <input
                    id="input-range-temp-min"
                    type="range"
                    min="16"
                    max="26"
                    step="0.5"
                    value={settings.tempMinAlarm}
                    onChange={(e) => handleRangeChange('tempMinAlarm', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <span className="text-[10px] text-zinc-500">
                    {t.tempMinDesc.replace('%def%', celsiusToUnit(22).toFixed(1) + '°' + tempUnit)}
                  </span>
                </div>

                {/* Temperature Maximum Alarm */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>{t.tempMaxLabel}</span>
                    <span className="text-red-400 font-bold">{celsiusToUnit(settings.tempMaxAlarm).toFixed(1)}°{tempUnit}</span>
                  </div>
                  <input
                    id="input-range-temp-max"
                    type="range"
                    min="28"
                    max="36"
                    step="0.5"
                    value={settings.tempMaxAlarm}
                    onChange={(e) => handleRangeChange('tempMaxAlarm', parseFloat(e.target.value))}
                    className="w-full accent-red-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <span className="text-[10px] text-zinc-500">
                    {t.tempMaxDesc.replace('%def%', celsiusToUnit(31).toFixed(1) + '°' + tempUnit)}
                  </span>
                </div>

                {/* Humidity Minimum Alarm */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>{t.humidMinLabel}</span>
                    <span className="text-cyan-400 font-bold">{settings.humMinAlarm}%</span>
                  </div>
                  <input
                    id="input-range-hum-min"
                    type="range"
                    min="40"
                    max="70"
                    step="5"
                    value={settings.humMinAlarm}
                    onChange={(e) => handleRangeChange('humMinAlarm', parseInt(e.target.value))}
                    className="w-full accent-cyan-400 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <span className="text-[10px] text-zinc-500">
                    {t.humidMinDesc.replace('%def%', '60%')}
                  </span>
                </div>

                {/* Humidity Maximum Alarm */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>{t.humidMaxLabel}</span>
                    <span className="text-teal-400 font-bold">{settings.humMaxAlarm}%</span>
                  </div>
                  <input
                    id="input-range-hum-max"
                    type="range"
                    min="75"
                    max="95"
                    step="5"
                    value={settings.humMaxAlarm}
                    onChange={(e) => handleRangeChange('humMaxAlarm', parseInt(e.target.value))}
                    className="w-full accent-teal-400 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <span className="text-[10px] text-zinc-500">
                    {t.humidMaxDesc.replace('%def%', '85%')}
                  </span>
                </div>

                {/* Mute Alerts Toggle */}
                <div className="flex items-center justify-between bg-black/30 p-3.5 rounded-2xl border border-white/5 mt-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold font-sans text-slate-200">{t.muteAlertTitle}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.muteAlertDesc}</span>
                  </div>
                  <button
                    id="toggle-mute-alerts"
                    type="button"
                    onClick={() => onSettingsChange(prev => ({ ...prev, muteAlerts: !prev.muteAlerts }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.muteAlerts ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.muteAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between bg-black/30 p-3.5 rounded-2xl border border-white/5 mt-2 pb-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold font-sans text-slate-200">{t.darkModeTitle}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.darkModeDesc}</span>
                  </div>
                  <button
                    id="toggle-dark-mode"
                    type="button"
                    onClick={() => onSettingsChange(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.darkMode ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.darkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Environment Modifiers / Actuator Coefficients */}
            <div
              id="actuator-coefficients-card"
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col gap-5"
            >
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight font-sans">
                    {t.modifierTitle}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {t.modifierDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* Simulation Interval Speed (sensor refresh rate) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>{t.intervalTitle}</span>
                    <span className="text-indigo-400 font-bold">{settings.sensorInterval} {language === 'en' ? 's' : 'detik'}</span>
                  </div>
                  <input
                    id="input-range-sensor-interval"
                    type="range"
                    min="10"
                    max="120"
                    step="10"
                    value={settings.sensorInterval}
                    onChange={(e) => handleRangeChange('sensorInterval', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    {t.intervalDesc.replace('%def%', '120')}
                  </p>
                </div>

                {/* Radiant Heat Pad Intensity */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {t.heatStrengthTitle}
                    </span>
                    <span className="text-amber-500 font-bold">{settings.heaterIntensity}%</span>
                  </div>
                  <input
                    id="input-range-heater-intensity"
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={settings.heaterIntensity}
                    onChange={(e) => handleRangeChange('heaterIntensity', parseInt(e.target.value))}
                    className="w-full accent-amber-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <p className="text-[10px] text-zinc-500">
                    {t.heatStrengthDesc.replace('%def%', '75%')}
                  </p>
                </div>

                {/* LED Growth Spectrum Strength */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-yellow-400" />
                      {t.ledStrengthTitle}
                    </span>
                    <span className="text-yellow-400 font-bold">{settings.ledIntensity}%</span>
                  </div>
                  <input
                    id="input-range-led-intensity"
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={settings.ledIntensity}
                    onChange={(e) => handleRangeChange('ledIntensity', parseInt(e.target.value))}
                    className="w-full accent-yellow-400 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                  />
                  <p className="text-[10px] text-zinc-500">
                    {t.ledStrengthDesc.replace('%def%', '50%')}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Center Column Panel: Biometric Tools & System Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 3: Biometric Override Commands */}
        {isLocked ? (
          <div
            id="biometric-override-commands-card-locked"
            className="rounded-3xl border border-white/5 bg-slate-900/10 p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[300px] h-full"
          >
            <div className="p-3 rounded-2xl border border-white/5 bg-slate-950/40 text-slate-500">
              <Lock className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 font-sans">
                {language === 'en' ? 'Snake Overrides Closed' : 'Tombol Ular Terkunci'}
              </span>
              <p className="text-[10px] text-slate-500 font-mono max-w-xs leading-normal mt-1">
                {language === 'en' ? 'Unlock hardware controls above to manually feed or induce shedding.' : 'Buka kunci pengaman di atas terlebih dahulu untuk memicu pintasan memberi makan atau ganti kulit ular.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            id="biometric-override-commands-card"
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2.5 rounded-xl border border-pink-500/20 bg-pink-500/10 text-pink-400">
                  <Activity className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight font-sans">
                    {t.shortCutTitle}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {t.shortCutDesc}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {language === 'en' ? 'Direct physical injectors for testing snake bio-condition states instantly.' : 'Pintasan praktis demi langsung mengubah kondisi fisik ular: mempercepat pergantian kulit atau mensimulasikan pemberian makan instan.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                id="settings-btn-feed"
                onClick={onFeedSnake}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-500/20 text-emerald-300 transition-all font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t.feedBtn}
              </button>
              <button
                id="settings-btn-shed"
                onClick={onAdvanceShed}
                className="w-full py-2.5 px-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-500/20 text-purple-300 transition-all font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Activity className="w-4 h-4 text-purple-400" />
                {t.shedBtn}
              </button>
            </div>
          </div>
        )}

        {/* Card 4: Hardware Specs */}
        <div
          id="mcu-specs-card"
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight font-sans">
                  {t.specTitle}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {t.specDesc}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[11px] leading-relaxed text-slate-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-500">{t.modelLabel}</span>
                <span className="text-slate-200">MIDAS-VIPER-IV</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-500">{t.procLabel}</span>
                <span className="text-slate-200">ARM Cortex-M7</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-500">{t.flashLabel}</span>
                <span className="text-slate-200">512KB EEPROM</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-500">{t.protoLabel}</span>
                <span className="text-slate-200">RS-485 Modbus RTU</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t.sensorCodeLabel}</span>
                <span className="text-emerald-400">DHT22, HR-IR, SGP40</span>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl px-4 py-2 border border-white/5 mt-5">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">{t.integrityLabel}</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">● BIOS_INTEGRITY_VERIFIED_SECURE</span>
          </div>
        </div>

        {/* Card 5: Diagnostic Utilities and Clears */}
        {isLocked ? (
          <div
            id="diagnostic-utils-card-locked"
            className="rounded-3xl border border-white/5 bg-slate-900/10 p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[300px] h-full"
          >
            <div className="p-3 rounded-2xl border border-white/5 bg-slate-950/40 text-slate-500">
              <Lock className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 font-sans">
                {language === 'en' ? 'Diagnostics Locked' : 'Diagnostik & Reset Terkunci'}
              </span>
              <p className="text-[10px] text-slate-500 font-mono max-w-xs leading-normal mt-1">
                {language === 'en' ? 'Unlock hardware controls to purge logging vault or wipe system configurations.' : 'Buka kunci pengaman di atas terlebih dahulu untuk menghapus catatan aktivitas atau mereset semua pengaturan.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            id="diagnostic-utils-card"
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <Wrench className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight font-sans">
                    {t.diagTitle}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {t.diagDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs mt-1">
                <div className="flex justify-between items-center text-slate-400">
                  <span>{t.logsCountLabel}</span>
                  <span className="text-white font-bold">{logsCount} {language === 'en' ? t.linesAbbr : 'baris'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{t.queueCountLabel}</span>
                  <span className="text-white font-bold">{historyCount} {language === 'en' ? t.datasetAbbr : 'data'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                id="settings-btn-clear-logs"
                onClick={onClearTerminalLogs}
                className="w-full py-2 px-4 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-300 bg-zinc-950/20 hover:bg-zinc-900/30 transition-all font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                {t.clearLogsBtn}
              </button>
              <button
                id="settings-btn-reset-all"
                onClick={onResetConfig}
                className="w-full py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-500/30 text-red-300 transition-all font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.resetBtn}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3rd Row Panel: Critical & Warning Alert Logs Triage */}
      <div
        id="critical-alerts-triage-panel"
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col gap-4 w-full"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight font-sans">
                {t.activeAlarmsTitle}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t.activeAlarmsDesc}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-2.5 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/20">
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
                        ? 'bg-red-950/15 border-red-500/20 hover:bg-red-950/25'
                        : 'bg-amber-950/15 border-amber-500/20 hover:bg-amber-950/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded ${
                          isError
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {log.type === 'error' ? t.dangerWord : t.warningWord}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-tight font-medium">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed truncate-2-lines flex-1">
                      {log.message}
                    </p>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-black/15 border border-white/5 rounded-2xl">
            <p className="text-sm font-semibold text-emerald-400 font-mono">
              {t.noAlarmsText}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              {t.noAlarmsDesc}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
