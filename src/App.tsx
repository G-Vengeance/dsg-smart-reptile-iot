/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Thermometer,
  Percent,
  Cpu,
  Terminal,
  Clock,
  Database,
  X,
  BookOpen,
  Trash2,
  Activity,
  Heart,
  Droplets,
  Wind,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  TrendingUp,
  Settings,
  SlidersHorizontal
} from 'lucide-react';
import { ClimateState, BiometricState, TelemetryLog, HistoricalRecord, ControlMode, SettingsState } from './types';
import { translations } from './utils/i18n';
import GlassCircularGauge from './components/GlassCircularGauge';
import BiometricsModule from './components/BiometricsModule';
import ControlPanel from './components/ControlPanel';
import ThermodynamicChart from './components/ThermodynamicChart';
import SettingsPanel from './components/SettingsPanel';
import ObservationGallery from './components/ObservationGallery';
import HealthTimeline from './components/HealthTimeline';


// Helpers to seed 60 elements for beautiful initial data science line charts
function generateBootstrappedHistory(): HistoricalRecord[] {
  const dataset: HistoricalRecord[] = [];
  const now = new Date();

  // Create points representing interval ticks over the previous 4 hours
  for (let i = 59; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - i * 4 * 60 * 1000); // 4 hours divided into 60 segments
    const displayTime = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Generate normal natural fluctuations in optimal snake parameters
    const randomTempOscillation = Math.sin(i / 5) * 1.2;
    const randomHumOscillation = Math.cos(i / 4) * 3;

    dataset.push({
      timestamp: pointTime.toISOString(),
      displayTime,
      temperature: parseFloat((27.2 + randomTempOscillation + Math.random() * 0.3).toFixed(2)),
      humidity: parseFloat((75.5 + randomHumOscillation + Math.random() * 0.8).toFixed(1)),
      fanSpeed: i % 15 === 0 ? 30 : 0,
      isMisting: i % 20 === 0,
      activityIndex: Math.floor(Math.random() * 30) + 40,
    });
  }
  return dataset;
}

const BOOTSTRAP_LOGS: TelemetryLog[] = [
  { id: 'b1', timestamp: '10:00:12', message: 'Sistem pemantau kandang menyala secara normal.', type: 'info' },
  { id: 'b2', timestamp: '10:00:15', message: 'Kamera pengawas aktif. Ular terdeteksi di dalam kandang.', type: 'success' },
  { id: 'b3', timestamp: '10:00:18', message: 'Memulai proses perekaman data suhu dan kelembapan.', type: 'info' },
  { id: 'b4', timestamp: '10:01:05', message: 'Lampu penghangat atas menyala dengan hangat.', type: 'success' },
  { id: 'b5', timestamp: '10:01:10', message: 'Sistem otomatisasi kandang siap dijalankan.', type: 'actuator' },
];

export default function App() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chart' | 'settings'>('dashboard');
  const [mobileSubTab, setMobileSubTab] = useState<'control' | 'timeline' | 'gallery'>('control');
  const [isLedgerOpen, setIsLedgerOpen] = useState<boolean>(false);
  const [ledgerSearch, setLedgerSearch] = useState<string>('');

  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(() => {
    const cached = localStorage.getItem('midas_temp_unit');
    return cached === 'F' ? 'F' : 'C';
  });

  useEffect(() => {
    localStorage.setItem('midas_temp_unit', tempUnit);
  }, [tempUnit]);

  const celsiusToUnit = (c: number) => {
    return tempUnit === 'F' ? (c * 1.8) + 32 : c;
  };

  const [settings, setSettings] = useState<SettingsState>(() => {
    const cached = localStorage.getItem('midas_terrarium_settings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (typeof parsed.sensorInterval !== 'number' || parsed.sensorInterval < 10 || parsed.sensorInterval > 120 || parsed.sensorInterval % 10 !== 0) {
          parsed.sensorInterval = 120;
        }
        if (typeof parsed.muteAlerts !== 'boolean') {
          parsed.muteAlerts = false;
        }
        if (typeof parsed.darkMode !== 'boolean') {
          parsed.darkMode = false;
        }
        if (parsed.language !== 'en' && parsed.language !== 'id') {
          parsed.language = 'en';
        }
        return parsed;
      } catch (e) {
        // ignore
      }
    }
    return {
      tempMinAlarm: 24.0,
      tempMaxAlarm: 30.0,
      humMinAlarm: 65,
      humMaxAlarm: 90,
      sensorInterval: 120,
      heaterIntensity: 75,
      ledIntensity: 50,
      muteAlerts: false,
      darkMode: false,
      language: 'en'
    };
  });

  const settingsRef = useRef<SettingsState>(settings);
  const fanCountdownRef = useRef<number>(0);
  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem('midas_terrarium_settings', JSON.stringify(settings));
  }, [settings]);


  // 1. STATE INITIALIZATION WITH CACHE FALLBACKS
  const [climate, setClimate] = useState<ClimateState>(() => {
    const cached = localStorage.getItem('midas_climate_state');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return {
      temperature: 27.5,
      humidity: 74.5,
      mode: 'MANUAL',
      fanSpeed: 0,
      mistingCountdown: 0,
      mistingDuration: 10,
      isMisting: false,
    };
  });

  const [biometrics, setBiometrics] = useState<BiometricState>(() => {
    const cached = localStorage.getItem('midas_biometric_state');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return {
      digestionPhase: 80.0, // Absorb rate
      sheddingPredictor: 45.0, // Shed cycle progress
      activityLevel: 'Resting',
      activityIndex: [15, 25, 18, 30, 22, 14, 28, 16], // Eq cells
    };
  });

  const [logs, setLogs] = useState<TelemetryLog[]>(() => {
    const cached = localStorage.getItem('midas_telemetry_logs');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return BOOTSTRAP_LOGS;
  });

  const [history, setHistory] = useState<HistoricalRecord[]>(() => {
    const cached = localStorage.getItem('midas_history_database');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return generateBootstrappedHistory();
  });

  const chartHistory = useMemo(() => {
    if (tempUnit === 'F') {
      return history.map((rec) => ({
        ...rec,
        temperature: (rec.temperature * 1.8) + 32,
      }));
    }
    return history;
  }, [history, tempUnit]);

  // Keep Clock updated in custom cyber-banner
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. SAVING STATES TO LOCALSTORAGE ON REVENUE CHANGES
  useEffect(() => {
    localStorage.setItem('midas_climate_state', JSON.stringify(climate));
  }, [climate]);

  useEffect(() => {
    localStorage.setItem('midas_biometric_state', JSON.stringify(biometrics));
  }, [biometrics]);

  useEffect(() => {
    localStorage.setItem('midas_telemetry_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('midas_history_database', JSON.stringify(history));
  }, [history]);

  // Global aggregate system health score logic based on sensors and actuator stress levels
  const systemHealthScore = useMemo(() => {
    let score = 100;

    // Check Temperature alarms
    if (climate.temperature > settings.tempMaxAlarm) {
      const dev = climate.temperature - settings.tempMaxAlarm;
      score -= Math.min(30, dev * 15);
    } else if (climate.temperature < settings.tempMinAlarm) {
      const dev = settings.tempMinAlarm - climate.temperature;
      score -= Math.min(30, dev * 15);
    }

    // Check Humidity alarms
    if (climate.humidity > settings.humMaxAlarm) {
      const dev = climate.humidity - settings.humMaxAlarm;
      score -= Math.min(25, dev * 2.5);
    } else if (climate.humidity < settings.humMinAlarm) {
      const dev = settings.humMinAlarm - climate.humidity;
      score -= Math.min(25, dev * 2.5);
    }

    // Actuator load / continuous effort checks
    if (climate.fanSpeed > 85) {
      score -= 5;
    }
    if (climate.isMisting) {
      score -= 5;
    }

    return Math.max(12, Math.round(score));
  }, [climate.temperature, climate.humidity, climate.fanSpeed, climate.isMisting, settings]);

  // Helper inside timers to cleanly log events
  const addLogEntry = (message: string, type: TelemetryLog['type']) => {
    const newLog: TelemetryLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setLogs((prev) => [...prev, newLog].slice(-100)); // clamp to last 100 on quick view
  };

  // 3. CLOSED-LOOP CLOSED PHYSICAL CYCLE SIMULATION TICKER
  // Trigger intervals every 1.5 seconds to simulate ambient basking, air evaporation, and automated thresholds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setClimate((prevClim) => {
        let nextTemp = prevClim.temperature;
        let nextHum = prevClim.humidity;
        let nextFanSpeed = prevClim.fanSpeed;
        let nextIsMisting = prevClim.isMisting;
        let nextCountdown = prevClim.mistingCountdown;

        const generatedLogs: { message: string; type: TelemetryLog['type'] }[] = [];

        // A. Actuator state calculation
        if (nextIsMisting) {
          // Spike moisture up +1.2% to +2.0%
          nextHum += 1.2 + Math.random() * 0.8;
          // Apply slight evaporative cooling -0.06°C to -0.1°C
          nextTemp -= 0.06 + Math.random() * 0.04;

          if (nextCountdown > 0) {
            nextCountdown = Math.max(0, nextCountdown - settingsRef.current.sensorInterval);
          }

          if (nextCountdown === 0) {
            nextIsMisting = false;
            generatedLogs.push({
              message: 'Penyemprot air otomatis MATI (Selesai menyemprot).',
              type: 'actuator',
            });
          }
        }

        if (nextFanSpeed > 0) {
          const speedFactor = nextFanSpeed / 100;
          // Force temperature down: -0.2 to -0.35°C
          nextTemp -= (0.2 + Math.random() * 0.15) * speedFactor;
          // Evaporator moisture drop and depletion: -0.3% to -0.5%
          nextHum -= (0.3 + Math.random() * 0.2) * speedFactor;

          if (prevClim.mode === 'AUTOMATIC') {
            if (fanCountdownRef.current > 0) {
              fanCountdownRef.current = Math.max(0, fanCountdownRef.current - settingsRef.current.sensorInterval);
            }
            if (fanCountdownRef.current === 0) {
              nextFanSpeed = 0;
              generatedLogs.push({
                message: 'Kipas otomatis MATI (Selesai membuang udara lembap).',
                type: 'actuator',
              });
            }
          }
        }

        // B. Passive State - Lamp basking heating
        if (!nextIsMisting && nextFanSpeed === 0) {
          // Crawl temperature up scaled by settings heater intensity ratio
          const intensityRatio = settingsRef.current.heaterIntensity / 75; // 75 is default intensity
          nextTemp += (0.08 + Math.random() * 0.08) * intensityRatio;
          // De-moisturize naturellement: -0.12% to -0.22%
          nextHum -= 0.12 + Math.random() * 0.1;
        }

        // Safe boundaries clip
        nextTemp = Math.min(38, Math.max(18, nextTemp));
        nextHum = Math.min(98, Math.max(30, nextHum));

        // C. Automation overrides (AUTOMATIC MODE ENFORCEMENT - ALIGNED WITH ESP8266 FIRMWARE)
        if (prevClim.mode === 'AUTOMATIC') {
          // Logika untuk FAN: If humidity > humMaxAlarm (90%) and Fan is not running
          if (nextHum > settingsRef.current.humMaxAlarm) {
            if (nextFanSpeed === 0) {
              nextFanSpeed = 100;
              fanCountdownRef.current = 300; // 5 minutes run time
              generatedLogs.push({
                message: `[OTOMATIS] Kipas otomatis NYALA karena kelembapan tinggi (${nextHum.toFixed(1)}%).`,
                type: 'warn',
              });
            }
          }

          // Logika untuk PUMP: If humidity < humMinAlarm (65%) and Pump/Misting is not running
          if (nextHum < settingsRef.current.humMinAlarm) {
            if (!nextIsMisting) {
              nextIsMisting = true;
              nextCountdown = 10; // 10 seconds run time
              generatedLogs.push({
                message: `[OTOMATIS] Penyemprot air otomatis NYALA karena kelembapan rendah (${nextHum.toFixed(1)}%).`,
                type: 'warn',
              });
            }
          }
        }

        // D. General Alarm Threshold logger (Triggered regardless of mode)
        if (nextTemp > settingsRef.current.tempMaxAlarm && prevClim.temperature <= settingsRef.current.tempMaxAlarm) {
          generatedLogs.push({
            message: `[PERINGATAN]: Suhu kandang terlalu PANAS (${nextTemp.toFixed(1)}°C)! Batas aman: ${settingsRef.current.tempMaxAlarm.toFixed(1)}°C.`,
            type: 'warn',
          });
        } else if (nextTemp < settingsRef.current.tempMinAlarm && prevClim.temperature >= settingsRef.current.tempMinAlarm) {
          generatedLogs.push({
            message: `[PERINGATAN]: Suhu kandang terlalu DINGIN (${nextTemp.toFixed(1)}°C)! Batas aman: ${settingsRef.current.tempMinAlarm.toFixed(1)}°C.`,
            type: 'warn',
          });
        }

        // Apply secondary state updates inside safe timeout frame
        setTimeout(() => {
          // Append logs
          if (generatedLogs.length > 0) {
            setLogs((prevL) => {
              const formatted = generatedLogs.map((g) => ({
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                message: g.message,
                type: g.type,
              }));
              return [...prevL, ...formatted].slice(-100);
            });
          }

          // Append history record
          setHistory((prevH) => {
            const timeObj = new Date();
            const record: HistoricalRecord = {
              timestamp: timeObj.toISOString(),
              displayTime: timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              temperature: nextTemp,
              humidity: nextHum,
              fanSpeed: nextFanSpeed,
              isMisting: nextIsMisting,
              activityIndex: Math.floor(Math.random() * 30) + 40,
            };
            return [...prevH, record].slice(-300); // cache historical limit
          });
        }, 0);

        return {
          ...prevClim,
          temperature: nextTemp,
          humidity: nextHum,
          fanSpeed: nextFanSpeed,
          isMisting: nextIsMisting,
          mistingCountdown: nextCountdown,
        };
      });
    }, settings.sensorInterval * 1000);

    return () => clearInterval(intervalId);
  }, [settings.sensorInterval]);

  // 4. BIOMETRIC ADAPTIVE ACTIVITY INDEX TICKER
  // Every 1.5 seconds, dance the equalizer and calculate slow progress decays/advancements
  useEffect(() => {
    const bioInterval = setInterval(() => {
      setBiometrics((curr) => {
        // Dance the bars based on active behavior label bounds
        const nextIndex = curr.activityIndex.map((val) => {
          const delta = Math.random() * 8 - 4; // Shift range +/- 4
          let base = val + delta;
          if (curr.activityLevel === 'Resting') {
            return Math.max(10, Math.min(42, base));
          } else if (curr.activityLevel === 'Foraging') {
            return Math.max(38, Math.min(74, base));
          } else {
            // Hunting
            return Math.max(68, Math.min(97, base));
          }
        });

        // 8% chance to transition classified state label
        let nextLevel = curr.activityLevel;
        let finalIndex = [...nextIndex];

        if (Math.random() < 0.08) {
          const stateRoll = Math.random();
          if (stateRoll < 0.65) {
            nextLevel = 'Resting';
            finalIndex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 18) + 12);
          } else if (stateRoll < 0.88) {
            nextLevel = 'Foraging';
            finalIndex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 25) + 40);
          } else {
            nextLevel = 'Hunting';
            finalIndex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 22) + 70);
          }

          // Append dynamic biometrics alert
          setTimeout(() => {
            const indonesanLevel = nextLevel === 'Resting' ? 'Istirahat' : nextLevel === 'Active' ? 'Aktif' : 'Berburu';
            const newLog: TelemetryLog = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: new Date().toLocaleTimeString(),
              message: `Aktivitas ular terdeteksi sebagai "${indonesanLevel}".`,
              type: 'info',
            };
            setLogs((prev) => [...prev, newLog].slice(-100));
          }, 0);
        }

        // Slowly decay digestion Phase progress (-0.08% per tick)
        const nextDigestion = Math.max(0, parseFloat((curr.digestionPhase - 0.08).toFixed(2)));

        // Slowly advance shedding predictor (+0.04% per tick)
        const nextShedding = Math.min(100, parseFloat((curr.sheddingPredictor + 0.04).toFixed(2)));

        return {
          activityLevel: nextLevel,
          activityIndex: finalIndex,
          digestionPhase: nextDigestion,
          sheddingPredictor: nextShedding,
        };
      });
    }, settings.sensorInterval * 1000);

    return () => clearInterval(bioInterval);
  }, [settings.sensorInterval]);

  // 5. INTERACTIFS MANUAL TRIGGER ACTION EVENTS
  const handleModeToggle = (mode: ControlMode) => {
    setClimate((prev) => ({ ...prev, mode }));
    addLogEntry(`Mode kontrol kandang diubah ke "${mode === 'AUTOMATIC' ? 'Otomatis' : 'Manual'}".`, 'info');
  };

  const handleFanSpeedChange = (speed: number) => {
    setClimate((prev) => ({ ...prev, fanSpeed: speed }));
    if (speed === 0) {
      addLogEntry(`Kipas angin dimatikan secara manual.`, 'actuator');
    } else {
      addLogEntry(`Kecepatan kipas angin diubah manual menjadi ${speed}%.`, 'actuator');
    }
  };

  const handleMistingDurationChange = (duration: number) => {
    setClimate((prev) => ({ ...prev, mistingDuration: duration }));
    addLogEntry(`Waktu penyemprotan air diatur selama ${duration} detik.`, 'info');
  };

  const handleTriggerMist = () => {
    if (climate.isMisting || climate.mode === 'AUTOMATIC') return;
    setClimate((prev) => ({
      ...prev,
      isMisting: true,
      mistingCountdown: prev.mistingDuration,
    }));
    addLogEntry(`Penyemprot air dinyalakan manual selama ${climate.mistingDuration} detik.`, 'actuator');
  };

  const handleFeedSnake = () => {
    setBiometrics((curr) => ({ ...curr, digestionPhase: 100.0 }));
    addLogEntry(`Ular selesai diberi makan. Proses pencernaan dimulai (100%).`, 'success');
  };

  const handleAdvanceShed = () => {
    setBiometrics((curr) => {
      let nextShed = curr.sheddingPredictor + 15.0;
      if (nextShed >= 100.0) {
        nextShed = 0;
        setTimeout(() => {
          addLogEntry(`Ular selesai mengganti kulit dengan sukses!`, 'success');
        }, 0);
      } else {
        setTimeout(() => {
          addLogEntry(`Proses ganti kulit ular meningkat menjadi ${nextShed.toFixed(1)}%.`, 'info');
        }, 0);
      }
      return { ...curr, sheddingPredictor: nextShed };
    });
  };

  const handleClearTerminalLogs = () => {
    setLogs([
      { id: 'c1', timestamp: new Date().toLocaleTimeString(), message: 'Catatan riwayat dibersihkan.', type: 'warn' },
    ]);
  };

  const handleResetConfig = () => {
    // 1. Reset settings
    const defaultSettings: SettingsState = {
      tempMinAlarm: 24.0,
      tempMaxAlarm: 30.0,
      humMinAlarm: 65,
      humMaxAlarm: 90,
      sensorInterval: 120,
      heaterIntensity: 75,
      ledIntensity: 50,
      muteAlerts: false,
      darkMode: false,
      language: settings.language || 'en'
    };
    setSettings(defaultSettings);

    // 2. Reset climate state
    setClimate({
      temperature: 27.5,
      humidity: 74.5,
      mode: 'MANUAL',
      fanSpeed: 0,
      mistingCountdown: 0,
      mistingDuration: 10,
      isMisting: false
    });

    // 3. Reset biometrics
    setBiometrics({
      digestionPhase: 80.0,
      sheddingPredictor: 45.0,
      activityLevel: 'Resting',
      activityIndex: [15, 25, 18, 30, 22, 14, 28, 16]
    });

    // 4. Initialize bootstrap logs
    setLogs([
      { id: 'reset1', timestamp: new Date().toLocaleTimeString(), message: settings.language === 'en' ? 'System configuration successfully restored back to factory defaults.' : 'Sistem berhasil di-reset kembali ke pengaturan awal.', type: 'warn' },
      ...BOOTSTRAP_LOGS
    ]);

    // 5. Reset history to a bootstrapped set
    setHistory(generateBootstrappedHistory());
  };

  // Filter LEDGER events inside Search Modal
  const filteredLedger = logs.filter((l) =>
    l.message.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    l.timestamp.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    l.type.toLowerCase().includes(ledgerSearch.toLowerCase())
  );

  const language = settings.language || 'en';
  const t = translations[language];

  return (
    <div
      id="main-applet-canvas"
      className="min-h-screen md:h-screen md:overflow-hidden bg-[#05080c] text-slate-100 flex flex-col md:flex-row relative font-sans select-none"
    >
      {/* Ambient background blur blobs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none z-0 transition-opacity duration-700 ${settings.darkMode ? 'opacity-30' : 'opacity-100'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/8 blur-[130px] rounded-full pointer-events-none z-0 transition-opacity duration-700 ${settings.darkMode ? 'opacity-30' : 'opacity-100'}`} />

      {/* Cyber Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none z-0" />

      {/* A. STICKY DESKTOP SIDEBAR PANEL (Always on for PC) */}
      <aside
        id="desktop-sidebar-pane"
        className="hidden md:flex flex-col w-72 bg-slate-950/40 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0 z-20 justify-between select-none shrink-0"
      >
        <div className="flex flex-col gap-8">
          {/* Terrarium branding area */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center">
              <Heart className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase font-mono">
                  {t.systemActive}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h1 className="text-sm font-bold text-white tracking-tight uppercase font-sans mt-0.5">
                {t.titleTerrarium}
              </h1>
            </div>
          </div>

          {/* Navigation link elements with glowing borders */}
          <nav className="flex flex-col gap-3">
            <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-widest uppercase mb-1 block">
              {t.menuMain}
            </span>
            
            <motion.button
              id="sidebar-nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-sans text-xs font-bold transition-all border cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.1)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 text-emerald-400" />
              <span>{t.dashboard}</span>
            </motion.button>

            <motion.button
              id="sidebar-nav-chart"
              onClick={() => setActiveTab('chart')}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-sans text-xs font-bold transition-all border cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-[0_4px_16px_rgba(6,182,212,0.1)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5 text-cyan-400" />
              <span>{t.analysis}</span>
            </motion.button>

            <motion.button
              id="sidebar-nav-settings"
              onClick={() => setActiveTab('settings')}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-sans text-xs font-bold transition-all border cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_4px_16px_rgba(99,102,241,0.1)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Settings className="w-4.5 h-4.5 text-indigo-400" />
              <span>{t.settings}</span>
            </motion.button>
          </nav>
        </div>

        {/* Read only info block */}
        <div className="flex flex-col gap-4 border-t border-white/5 pt-5 text-xs font-mono">
          <div className="text-zinc-500 leading-relaxed font-sans text-[11px]">
            {t.connectedStatus}
          </div>
          <div className="flex items-center justify-between text-zinc-400 bg-black/20 px-3.5 py-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t.operatedBy}</span>
            <span className="font-bold text-[10px] text-slate-300">{t.teamName}</span>
          </div>
        </div>
      </aside>

      {/* B. MAIN INTERACTIVE CONTENT COLUMN (Takes full remainder space) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:h-screen md:overflow-y-auto scroll-smooth relative pb-24 md:pb-8">
        
        {/* Universal Sticky Top Executive Banner */}
        <header
          id="common-executive-header"
          className="relative z-10 w-full px-3.5 sm:px-6 pt-4 sm:pt-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 select-none"
        >
          <div className="flex items-center gap-3">
            {/* Logo visible only on mobile screens where sidebar is hidden */}
            <div className="md:hidden p-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  {activeTab === 'dashboard' ? t.primaryTelemetry : activeTab === 'chart' ? t.dataScienceHub : t.hardwarePanel}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight font-sans mt-0.5">
                {activeTab === 'dashboard' && (language === 'en' ? 'Main Control System' : 'Sistem Kendali Utama')}
                {activeTab === 'chart' && (language === 'en' ? 'Temperature & Humidity Graph' : 'Grafik Suhu & Kelembapan')}
                {activeTab === 'settings' && (language === 'en' ? 'Automatic Settings' : 'Pengaturan Otomatis')}
              </h2>
            </div>
          </div>

          {/* System parameters Clock & Subject descriptors */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Aggregate System Health Score */}
            <div
              id="aggregate-system-health-badge"
              className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-md transition-all duration-300 ${
                systemHealthScore >= 90
                  ? 'bg-emerald-950/40 border-emerald-500/25 text-emerald-400'
                  : systemHealthScore >= 75
                  ? 'bg-amber-950/45 border-amber-500/25 text-amber-400 font-bold'
                  : `bg-red-950/50 border-red-500/30 text-red-400 font-bold ${!settings.muteAlerts ? 'animate-pulse' : ''}`
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${systemHealthScore < 75 && !settings.muteAlerts ? 'animate-bounce text-red-500' : systemHealthScore < 75 ? 'text-red-500' : systemHealthScore < 90 ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">{t.systemHealth}</span>
              <span className="font-sans font-extrabold text-white text-[13px]">
                {systemHealthScore}%
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="font-mono font-bold uppercase text-[9px] tracking-wide">
                {systemHealthScore >= 90 ? t.statusNominal : systemHealthScore >= 75 ? t.statusStabilizing : t.statusAnomaly}
              </span>
            </div>

            {/* Subject Tag */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <span className="text-slate-400">{t.speciesLabel}</span>
              <span className="font-bold text-cyan-300 font-sans italic">Tropidolaemus subannulatus</span>
            </div>

            {/* Sync Clock */}
            <div className="flex items-center gap-2 bg-slate-900/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm shadow-md">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span id="banner-clock-readout" className="font-mono text-white tracking-widest font-bold">
                {currentTime || 'Syncing...'}
              </span>
            </div>

            {/* Temperature Unit Toggle Switch */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-sm shadow-md select-none">
              <button
                id="toggle-unit-c"
                onClick={() => setTempUnit('C')}
                className={`px-3 py-1 text-[11px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                  tempUnit === 'C'
                    ? 'text-white bg-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.35)] border border-cyan-500/35'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                °C
              </button>
              <button
                id="toggle-unit-f"
                onClick={() => setTempUnit('F')}
                className={`px-3 py-1 text-[11px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                  tempUnit === 'F'
                    ? 'text-white bg-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.35)] border border-cyan-500/35'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic transition layout views */}
        <main className={`relative z-10 w-full px-3.5 sm:px-6 pt-3 sm:pt-4 flex-grow flex flex-col justify-start transition-all duration-700 ${settings.darkMode ? 'brightness-[0.80] saturate-[0.85]' : ''}`}>
          <AnimatePresence mode="wait">
            
            {/* 1st Tab: Dashboard */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                id="view-tab-dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-6"
              >
                {/* Mobile Sub-Navigation Segment Tabs (Only visible on screens under md) */}
                <div id="mobile-sub-navigation-pills" className="md:hidden flex items-center p-1 bg-black/40 border border-white/5 rounded-2xl w-full select-none selection:none">
                  <button
                    id="sub-tab-control"
                    onClick={() => setMobileSubTab('control')}
                    className={`flex-1 py-2 text-xs font-bold font-sans rounded-xl transition-all cursor-pointer ${
                      mobileSubTab === 'control'
                        ? 'bg-emerald-500/10 text-emerald-300 shadow-[0_2px_8px_rgba(16,185,129,0.15)] border border-emerald-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {t.mobileSubControl}
                  </button>
                  <button
                    id="sub-tab-timeline"
                    onClick={() => setMobileSubTab('timeline')}
                    className={`flex-1 py-2 text-xs font-bold font-sans rounded-xl transition-all cursor-pointer ${
                      mobileSubTab === 'timeline'
                        ? 'bg-indigo-500/10 text-indigo-300 shadow-[0_2px_8px_rgba(99,102,241,0.15)] border border-indigo-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {t.mobileSubTimeline}
                  </button>
                  <button
                    id="sub-tab-gallery"
                    onClick={() => setMobileSubTab('gallery')}
                    className={`flex-1 py-2 text-xs font-bold font-sans rounded-xl transition-all cursor-pointer ${
                      mobileSubTab === 'gallery'
                        ? 'bg-cyan-500/10 text-cyan-300 shadow-[0_2px_8px_rgba(6,182,212,0.15)] border border-cyan-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {t.mobileSubGallery}
                  </button>
                </div>

                {/* Visual Intersect Timeline Track */}
                <div className={mobileSubTab === 'timeline' ? 'block' : 'hidden md:block'}>
                  <HealthTimeline
                    history={history}
                    settings={settings}
                    tempUnit={tempUnit}
                    celsiusToUnit={celsiusToUnit}
                    language={language}
                  />
                </div>

                {/* UPPER BENTO GRID - Highly responsive column spanning with aligned heights */}
                <div className={mobileSubTab === 'control' ? 'block' : 'hidden md:block'}>
                  <div id="dashboard-upper-bento" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 items-stretch w-full min-h-0">
                    {/* Col 1: Temperature Gauge */}
                    <GlassCircularGauge
                      value={celsiusToUnit(climate.temperature)}
                      min={celsiusToUnit(15)}
                      max={celsiusToUnit(38)}
                      title={language === 'en' ? 'Enclosure Temp' : 'Suhu Kandang'}
                      unit={tempUnit === 'F' ? '°F' : '°C'}
                      type="temperature"
                      sparklineData={history.slice(-15).map((h) => celsiusToUnit(h.temperature))}
                      statusMessage={
                        climate.temperature > settings.tempMaxAlarm
                          ? (language === 'en' ? 'OVERHEAT WARNING' : 'SUHU TERLALU TINGGI')
                          : climate.temperature < settings.tempMinAlarm
                          ? (language === 'en' ? 'UNDERHEAT ALERT' : 'SUHU TERLALU RENDAH')
                          : (language === 'en' ? 'NORMAL TEMP' : 'SUHU NORMAL')
                      }
                      language={language}
                    />

                    {/* Col 2: Humidity Gauge */}
                    <GlassCircularGauge
                      value={climate.humidity}
                      min={30}
                      max={98}
                      title={language === 'en' ? 'Humidity' : 'Kelembapan'}
                      unit="%"
                      type="humidity"
                      sparklineData={history.slice(-15).map((h) => h.humidity)}
                      statusMessage={
                        climate.humidity < settings.humMinAlarm
                          ? (language === 'en' ? 'CRITICAL DEHYDRATION' : 'KONDISI TERLALU KERING')
                          : climate.humidity >= settings.humMinAlarm && climate.humidity <= settings.humMaxAlarm
                          ? (language === 'en' ? 'NORMAL HUMIDITY' : 'KELEMBAPAN NORMAL')
                          : (language === 'en' ? 'MAXIMUM CONDENSATION' : 'KELEMBAPAN TINGGI')
                      }
                      language={language}
                    />

                    {/* Col 3: AI Biometrics Modules */}
                    <BiometricsModule
                      biometrics={biometrics}
                      onFeedSnake={handleFeedSnake}
                      onAdvanceShed={handleAdvanceShed}
                      language={language}
                    />

                    {/* Col 4: Actuators controls cockpit */}
                    <ControlPanel
                      climate={climate}
                      onModeToggle={handleModeToggle}
                      onFanSpeedChange={handleFanSpeedChange}
                      onMistingDurationChange={handleMistingDurationChange}
                      onTriggerMist={handleTriggerMist}
                      humMinAlarm={settings.humMinAlarm}
                      humMaxAlarm={settings.humMaxAlarm}
                      language={language}
                    />
                  </div>
                </div>

                {/* LOWER GRID: Monospace Terminal Event logs logger */}
                <div className={mobileSubTab === 'timeline' ? 'block' : 'hidden md:block'}>
                  <div
                    id="log-event-viewer-terminal"
                    className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
                  >
                    <div className="flex-grow flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs uppercase tracking-widest text-slate-300 font-mono font-bold">
                            {t.eventLogTitle}
                          </span>
                        </div>
                        <button
                          id="btn-clear-terminal-logs"
                          onClick={handleClearTerminalLogs}
                          className="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {t.flushTerminal}
                        </button>
                      </div>

                      <div
                        id="terminal-output-feed"
                        className="h-24 sm:h-28 overflow-y-auto bg-slate-950/80 rounded-lg p-2.5 sm:p-3 border border-white/5 font-mono text-[10px] sm:text-[11px] leading-relaxed flex flex-col gap-1 shadow-inner scrollbar-thin select-text"
                      >
                        {[...logs].reverse().map((entry, index) => {
                          let colorClass = 'text-cyan-400';
                          if (entry.type === 'error') colorClass = 'text-red-400 font-semibold';
                          else if (entry.type === 'success') colorClass = 'text-emerald-400';
                          else if (entry.type === 'warn') colorClass = 'text-amber-400';
                          else if (entry.type === 'actuator') colorClass = 'text-teal-400';

                          return (
                            <motion.div
                              key={`${entry.id}-${index}`}
                              className="flex gap-2 items-start text-left"
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                            >
                              <span className="text-slate-500 min-w-[55px] sm:min-w-[65px] flex-shrink-0 select-none">
                                [{entry.timestamp}]
                              </span>
                              <span className="flex items-center gap-1.5 min-w-0">
                                {(entry.type === 'warn' || entry.type === 'error') && (
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    entry.type === 'error' ? 'bg-red-400' : 'bg-amber-400'
                                  } ${!settings.muteAlerts ? 'animate-ping' : ''}`} />
                                )}
                                <span className={colorClass}>{entry.message}</span>
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Trigger button for Ledger Popup Database overview */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch gap-2.5 md:w-[240px]">
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-mono text-center md:text-left select-none">
                        {t.systemLedgerTitle}
                      </span>
                      <button
                        id="btn-trigger-ledger-modal"
                        onClick={() => setIsLedgerOpen(true)}
                        className="py-2.5 sm:py-3 px-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.1)] active:scale-98"
                      >
                        <Database className="w-4 h-4" />
                        {t.analyzeLedgerBtn}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Heuristic Bio-Observation CCTV Gallery */}
                <div className={mobileSubTab === 'gallery' ? 'block' : 'hidden md:block'}>
                  <ObservationGallery tempUnit={tempUnit} language={language} />
                </div>
              </motion.div>
            )}

            {/* 2nd Tab: Analysis Chart */}
            {activeTab === 'chart' && (
              <motion.div
                key="chart"
                id="view-tab-chart"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="w-full flex-grow flex flex-col"
              >
                <div id="charts-visualization-row" className="w-full h-full flex-grow">
                  <ThermodynamicChart history={chartHistory} tempUnit={tempUnit} language={language} />
                </div>
              </motion.div>
            )}

            {/* 3rd Tab: Settings configurations */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                id="view-tab-settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="w-full flex-grow"
              >
                <SettingsPanel
                  settings={settings}
                  onSettingsChange={setSettings}
                  onResetConfig={handleResetConfig}
                  onFeedSnake={handleFeedSnake}
                  onAdvanceShed={handleAdvanceShed}
                  onClearTerminalLogs={handleClearTerminalLogs}
                  logsCount={logs.length}
                  historyCount={history.length}
                  logs={logs}
                  tempUnit={tempUnit}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* C. MOBILE DOCK SYSTEM (Thumb-friendly tab nav floating on screens under md) */}
        <nav
          id="mobile-navigation-dock"
          className="md:hidden fixed bottom-6 left-6 right-6 h-18 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl z-30 flex items-center justify-around px-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] "
        >
          <button
            id="mobile-dock-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight font-sans">{t.tabDashboard}</span>
          </button>

          <button
            id="mobile-dock-chart"
            onClick={() => setActiveTab('chart')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'chart' ? 'text-cyan-400 bg-cyan-500/5' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight font-sans">{t.tabAnalysis}</span>
          </button>

          <button
            id="mobile-dock-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400'
            }`}
          >
            <Settings className="w-5.5 h-5.5" />
            <span className="text-[9px] font-bold tracking-tight font-sans">{t.tabSettings}</span>
          </button>
        </nav>

      </div>

      {/* Expandable glassmorphic ledger modal popup dialog */}
      <AnimatePresence>
        {isLedgerOpen && (
          <div
            id="system-ledger-modal-wrapper"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg bg-slate-950/60"
          >
            {/* Modal Glass backdrop screen click away */}
            <div className="absolute inset-0" onClick={() => setIsLedgerOpen(false)} />

            <motion.div
              id="system-ledger-modal-container"
              className="relative w-full max-w-3xl bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-none pointer-events-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Modal header with close */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="text-cyan-400 w-5 h-5" />
                  <div>
                    <h3 className="text-base font-bold text-white font-sans">
                      {language === 'en' ? 'Chronological Enclosure Telemetry Ledger' : 'Arsip Riwayat Telemetri Kandang'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {language === 'en' ? 'Secure cached transaction database entries • Clamped to last 100 entries' : 'Arsip transaksi basis data aman terenkripsi • Dibatasi hingga 100 baris terakhir'}
                    </p>
                  </div>
                </div>

                <button
                  id="close-ledger-modal"
                  onClick={() => setIsLedgerOpen(false)}
                  className="p-1 rounded-lg border border-white/5 hover:border-white/20 bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filtering Controls Row */}
              <div className="flex flex-col sm:flex-row gap-3 py-4 border-b border-white/5 bg-slate-950/20">
                <div className="flex-grow">
                  <input
                    id="ledger-search-input"
                    type="text"
                    placeholder={language === 'en' ? 'Search ledger entries (e.g., alert, fan, autofocus)...' : 'Cari catatan aktivitas (misal: bahaya, kipas, otomatis)...'}
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                {ledgerSearch && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setLedgerSearch('')}
                    className="px-3 bg-slate-800 text-xs font-mono text-slate-400 rounded-lg hover:text-white"
                  >
                    {language === 'en' ? 'Clear Filter' : 'Hapus Pencarian'}
                  </button>
                )}
              </div>

              {/* Scrollable ledger sequence */}
              <div className="flex-grow overflow-y-auto py-4 flex flex-col gap-2 h-96 scrollbar-thin">
                {filteredLedger.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 font-mono text-sm">
                    {language === 'en' ? 'No records found matching current query boundaries.' : 'Tidak ada catatan yang cocok dengan pencarian Anda.'}
                  </div>
                ) : (
                  filteredLedger.map((item, index) => {
                    let badgeColor = 'bg-slate-900 border-slate-800 text-slate-400';
                    if (item.type === 'error') badgeColor = 'bg-red-950/40 border-red-500/20 text-red-300';
                    else if (item.type === 'warn') badgeColor = 'bg-amber-950/40 border-amber-500/20 text-amber-300';
                    else if (item.type === 'success') badgeColor = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300';
                    else if (item.type === 'actuator') badgeColor = 'bg-teal-950/40 border-teal-500/20 text-teal-300';

                    return (
                      <div
                        key={`${item.id}-${index}`}
                        id={`ledger-row-${item.id}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-white/5 bg-slate-950/60 hover:bg-slate-900/20 transition-all font-mono text-xs select-text"
                      >
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-500 select-none font-bold">
                            {item.timestamp}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold select-none ${badgeColor} capitalize w-16 text-center shrink-0`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-slate-200 font-sans tracking-wide break-words flex-1 min-w-0">
                          {item.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal footer summary information */}
              <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-4 select-none">
                <span>
                  {language === 'en' ? `Showing ${filteredLedger.length} of ${logs.length} logged data transactions` : `Menampilkan ${filteredLedger.length} dari ${logs.length} catatan aktivitas`}
                </span>
                <span className="text-[10px] text-slate-500 italic">
                  {language === 'en' ? 'Press ESC or click backdrop to close ledger session' : 'Tekan ESC atau klik latar belakang untuk menutup arsip'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
