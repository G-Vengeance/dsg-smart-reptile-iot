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
import CommentSection from './components/CommentSection';


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

  // Keep Clock updated in custom banner
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
  // Trigger intervals every 2 seconds to simulate ambient basking, air evaporation, and automated thresholds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setClimate((prevClim) => {
        let nextTemp = prevClim.temperature;
        let nextHum = prevClim.humidity;
        let nextFanSpeed = prevClim.fanSpeed;
        let nextIsMisting = prevClim.isMisting;
        let nextCountdown = prevClim.mistingCountdown;

        const generatedLogs: { message: string; type: TelemetryLog['type'] }[] = [];

        // Fan speed calculations
        if (nextFanSpeed > 0) {
          const speedFactor = nextFanSpeed / 100;
          // Force temperature down: -0.03 to -0.05°C per tick
          nextTemp -= (0.03 + Math.random() * 0.02) * speedFactor;
          // Evaporator moisture drop: -0.08% to -0.13% per tick
          nextHum -= (0.08 + Math.random() * 0.05) * speedFactor;

          if (prevClim.mode === 'AUTOMATIC') {
            if (fanCountdownRef.current > 0) {
              fanCountdownRef.current = Math.max(0, fanCountdownRef.current - 2);
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
          const intensityRatio = settingsRef.current.heaterIntensity / 75;
          nextTemp += (0.01 + Math.random() * 0.01) * intensityRatio;
          // De-moisturize naturellement: -0.02% to -0.04%
          nextHum -= 0.02 + Math.random() * 0.02;
        }

        // Safe boundaries clip
        nextTemp = Math.min(38, Math.max(18, nextTemp));
        nextHum = Math.min(98, Math.max(30, nextHum));

        // C. Automation overrides (AUTOMATIC MODE ENFORCEMENT)
        if (prevClim.mode === 'AUTOMATIC') {
          // Logika untuk FAN: If humidity > humMaxAlarm (90%) and Fan is not running
          if (nextHum > settingsRef.current.humMaxAlarm) {
            if (nextFanSpeed === 0) {
              nextFanSpeed = 100;
              fanCountdownRef.current = 30; // 30 seconds run time
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
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // 3a. Real-time 1-second countdown timer for misting actuator
  useEffect(() => {
    if (!climate.isMisting) return;

    const timer = setInterval(() => {
      setClimate((prev) => {
        if (!prev.isMisting) return prev;
        const nextCountdown = prev.mistingCountdown - 1;
        
        // Spike moisture up +0.8% to +1.5% per second
        let nextHum = Math.min(98, prev.humidity + 0.8 + Math.random() * 0.7);
        // Evaporative cooling -0.04°C to -0.06°C per second
        let nextTemp = Math.max(18, prev.temperature - 0.04 - Math.random() * 0.02);

        if (nextCountdown <= 0) {
          setTimeout(() => {
            addLogEntry(
              settingsRef.current.language === 'en'
                ? 'Misting system AUTOMATIC OFF (Finished spraying).'
                : 'Penyemprot air otomatis MATI (Selesai menyemprot).',
              'actuator'
            );
          }, 0);

          return {
            ...prev,
            isMisting: false,
            mistingCountdown: 0,
            humidity: nextHum,
            temperature: nextTemp,
          };
        }

        return {
          ...prev,
          mistingCountdown: nextCountdown,
          humidity: nextHum,
          temperature: nextTemp,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [climate.isMisting]);

  // 3b. Telemetry database logger (runs periodically based on sensorInterval settings)
  useEffect(() => {
    const loggerInterval = setInterval(() => {
      setClimate((curr) => {
        setHistory((prevH) => {
          const timeObj = new Date();
          const record: HistoricalRecord = {
            timestamp: timeObj.toISOString(),
            displayTime: timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temperature: curr.temperature,
            humidity: curr.humidity,
            fanSpeed: curr.fanSpeed,
            isMisting: curr.isMisting,
            activityIndex: Math.floor(Math.random() * 30) + 40,
          };
          return [...prevH, record].slice(-300);
        });
        return curr;
      });
    }, settings.sensorInterval * 1000);

    return () => clearInterval(loggerInterval);
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
            const indonesanLevel = nextLevel === 'Resting' ? 'Istirahat' : nextLevel === 'Foraging' ? 'Aktif' : 'Berburu';
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
      { id: 'reset1', timestamp: new Date().toLocaleTimeString(), message: settings.language === 'en' ? 'System configuration successfully restored back to defaults.' : 'Sistem berhasil di-reset kembali ke pengaturan awal.', type: 'warn' },
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
      className={`min-h-screen md:h-screen md:overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col md:flex-row relative font-sans select-none transition-all duration-500 ${settings.darkMode ? 'dark' : ''}`}
    >
      {/* Soft natural lighting gradients representation of sunlight filtering through jungle canopy */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-amber-500/5 dark:bg-amber-500/2 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* A. STICKY DESKTOP SIDEBAR PANEL */}
      <aside
        id="desktop-sidebar-pane"
        className="hidden md:flex flex-col w-72 bg-[var(--bg-card)] border-r border-[var(--border-card)] p-6 h-screen sticky top-0 z-20 justify-between select-none shrink-0 transition-all duration-300 shadow-sm"
      >
        <div className="flex flex-col gap-8">
          {/* Terrarium branding area */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] flex items-center justify-center shadow-inner">
              <Heart className="w-4.5 h-4.5 text-[var(--accent-primary)] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-wider text-[var(--accent-primary)] font-extrabold uppercase font-sans">
                  {t.systemActive}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
              </div>
              <h1 className="text-sm font-black tracking-tight uppercase font-sans mt-0.5">
                {t.titleTerrarium}
              </h1>
            </div>
          </div>

          {/* Navigation link elements with organic design */}
          <nav className="flex flex-col gap-2.5">
            <span className="text-[10px] text-[var(--text-secondary)] font-sans font-extrabold tracking-wider uppercase mb-1 block">
              {t.menuMain}
            </span>
            
            <button
              id="sidebar-nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-4.5 py-3.5 rounded-2xl font-sans text-xs font-bold transition-all border cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[var(--accent-primary)]/10 border-[var(--border-card)] text-[var(--accent-primary)] font-extrabold shadow-sm'
                  : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)]'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 text-[var(--accent-primary)] shrink-0" />
              <span>{t.dashboard}</span>
            </button>

            <button
              id="sidebar-nav-chart"
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-3 px-4.5 py-3.5 rounded-2xl font-sans text-xs font-bold transition-all border cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-[var(--accent-primary)]/10 border-[var(--border-card)] text-[var(--accent-primary)] font-extrabold shadow-sm'
                  : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)]'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5 text-[var(--accent-primary)] shrink-0" />
              <span>{t.analysis}</span>
            </button>

            <button
              id="sidebar-nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4.5 py-3.5 rounded-2xl font-sans text-xs font-bold transition-all border cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[var(--accent-primary)]/10 border-[var(--border-card)] text-[var(--accent-primary)] font-extrabold shadow-sm'
                  : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)]'
              }`}
            >
              <Settings className="w-4.5 h-4.5 text-[var(--accent-primary)] shrink-0" />
              <span>{t.settings}</span>
            </button>
          </nav>
        </div>

        {/* Read only info block */}
        <div className="flex flex-col gap-4 border-t border-[var(--border-card)] pt-5 text-xs">
          <div className="text-[var(--text-secondary)] leading-relaxed font-sans text-[11px] font-medium">
            {t.connectedStatus}
          </div>
          <div className="flex items-center justify-between text-[var(--text-secondary)] bg-[var(--bg-app)] px-3.5 py-2.5 rounded-2xl border border-[var(--border-card)]">
            <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider font-extrabold">{t.operatedBy}</span>
            <span className="font-extrabold text-[9px] text-[var(--text-primary)] uppercase">{t.teamName}</span>
          </div>
        </div>
      </aside>

      {/* B. MAIN CONTENT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:h-screen md:overflow-y-auto scroll-smooth relative pb-24 md:pb-8">
        
        {/* Universal Sticky Top Executive Banner */}
        <header
          id="common-executive-header"
          className="relative z-10 w-full px-3.5 sm:px-6 pt-4 sm:pt-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 select-none"
        >
          <div className="flex items-center gap-3">
            {/* Mobile Logo */}
            <div className="md:hidden p-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-center shadow-inner shrink-0">
              <Heart className="w-4.5 h-4.5 text-[var(--accent-primary)] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-wider text-[var(--accent-primary)] font-extrabold uppercase font-sans bg-[var(--bg-card)] px-2.5 py-0.5 rounded border border-[var(--border-card)]">
                  {activeTab === 'dashboard' ? t.primaryTelemetry : activeTab === 'chart' ? t.dataScienceHub : t.hardwarePanel}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
              </div>
              <h2 className="text-lg font-black tracking-tight font-sans mt-0.5">
                {activeTab === 'dashboard' && (language === 'en' ? 'Main Control Dashboard' : 'Dasbor Pengendali Utama')}
                {activeTab === 'chart' && (language === 'en' ? 'Sensor Historical Analytics' : 'Grafik Riwayat Analisis Sensor')}
                {activeTab === 'settings' && (language === 'en' ? 'Smart Settings & Autopilot' : 'Pengaturan Kandang Pintar')}
              </h2>
            </div>
          </div>

          {/* Banner readout cards */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Health Score Badge */}
            <div
              id="aggregate-system-health-badge"
              className={`flex items-center gap-2 border px-3 py-1.5 rounded-2xl shadow-sm transition-all duration-300 font-bold ${
                systemHealthScore >= 90
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : systemHealthScore >= 75
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                  : `bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400`
              }`}
            >
              <Heart className="w-3.5 h-3.5 shrink-0 fill-current" />
              <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider font-sans font-bold">{t.systemHealth}</span>
              <span className="font-extrabold text-[12px]">
                {systemHealthScore}%
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="font-sans font-bold uppercase text-[9px] tracking-wide">
                {systemHealthScore >= 90 ? t.statusNominal : systemHealthScore >= 75 ? t.statusStabilizing : t.statusAnomaly}
              </span>
            </div>

            {/* Subject Descriptor Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-card)] px-4 py-2 rounded-2xl shadow-sm">
              <span className="text-[var(--text-secondary)] font-bold font-sans">{t.speciesLabel}</span>
              <span className="font-bold text-[var(--accent-primary)] italic">Tropidolaemus subannulatus</span>
            </div>

            {/* Timer Clock */}
            <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-card)] px-4 py-2 rounded-2xl shadow-sm">
              <Clock className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <span id="banner-clock-readout" className="font-sans text-[var(--text-primary)] tracking-wider font-bold">
                {currentTime || 'Syncing...'}
              </span>
            </div>

            {/* Celsius / Fahrenheit Switcher */}
            <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-card)] p-1 rounded-2xl shadow-sm select-none">
              <button
                id="toggle-unit-c"
                onClick={() => setTempUnit('C')}
                className={`px-3 py-1 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                  tempUnit === 'C'
                    ? 'text-white bg-[#2b5c2a] dark:bg-[#203c25] shadow-sm border border-[var(--border-card)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                °C
              </button>
              <button
                id="toggle-unit-f"
                onClick={() => setTempUnit('F')}
                className={`px-3 py-1 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                  tempUnit === 'F'
                    ? 'text-white bg-[#2b5c2a] dark:bg-[#203c25] shadow-sm border border-[var(--border-card)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic tabs render content container */}
        <main className={`relative z-10 w-full px-3.5 sm:px-6 pt-3 sm:pt-4 flex-grow flex flex-col justify-start transition-all duration-700`}>
          <AnimatePresence mode="wait">
            
            {/* 1st Tab: Dashboard */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                id="view-tab-dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-6"
              >
                {/* Mobile Sub tabs nav */}
                <div id="mobile-sub-navigation-pills" className="md:hidden flex items-center p-1 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl w-full select-none shadow-sm">
                  <button
                    id="sub-tab-control"
                    onClick={() => setMobileSubTab('control')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      mobileSubTab === 'control'
                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    {t.mobileSubControl}
                  </button>
                  <button
                    id="sub-tab-timeline"
                    onClick={() => setMobileSubTab('timeline')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      mobileSubTab === 'timeline'
                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    {t.mobileSubTimeline}
                  </button>
                  <button
                    id="sub-tab-gallery"
                    onClick={() => setMobileSubTab('gallery')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      mobileSubTab === 'gallery'
                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    {t.mobileSubGallery}
                  </button>
                </div>

                {/* Enclosure timeline logs scrub histogram */}
                <div className={mobileSubTab === 'timeline' ? 'block' : 'hidden md:block'}>
                  <HealthTimeline
                    history={history}
                    settings={settings}
                    tempUnit={tempUnit}
                    celsiusToUnit={celsiusToUnit}
                    language={language}
                  />
                </div>

                {/* Primary Bento modules layout */}
                <div className={mobileSubTab === 'control' ? 'block' : 'hidden md:block'}>
                  <div id="dashboard-upper-bento" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch w-full min-h-0">
                    {/* Gauge 1: Temp */}
                    <GlassCircularGauge
                      value={celsiusToUnit(climate.temperature)}
                      min={celsiusToUnit(15)}
                      max={celsiusToUnit(38)}
                      title={language === 'en' ? 'Enclosure Temperature' : 'Suhu Kandang'}
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

                    {/* Gauge 2: Humid */}
                    <GlassCircularGauge
                      value={climate.humidity}
                      min={30}
                      max={98}
                      title={language === 'en' ? 'Humidity Moisture' : 'Kelembapan Kandang'}
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

                    {/* Biometrics Override Module */}
                    <BiometricsModule
                      biometrics={biometrics}
                      onFeedSnake={handleFeedSnake}
                      onAdvanceShed={handleAdvanceShed}
                      language={language}
                    />

                    {/* Actuators Control Cockpit */}
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

                {/* Friendly Activity Logs feed display */}
                <div className={mobileSubTab === 'timeline' ? 'block' : 'hidden md:block'}>
                  <div
                    id="log-event-viewer-terminal"
                    className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-[var(--shadow-card)] flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300"
                  >
                    <div className="flex-grow flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                          <span className="text-xs uppercase tracking-wider font-sans font-extrabold text-[var(--text-primary)]">
                            {t.eventLogTitle}
                          </span>
                        </div>
                        <button
                          id="btn-clear-terminal-logs"
                          onClick={handleClearTerminalLogs}
                          className="px-3 py-1 text-[10px] font-sans font-bold rounded-lg border border-[var(--border-card)] bg-[var(--bg-app)] hover:bg-[var(--border-card)] text-[var(--text-primary)] transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          {t.flushTerminal}
                        </button>
                      </div>

                      {/* Friendly list feed */}
                      <div
                        id="terminal-output-feed"
                        className="h-28 overflow-y-auto bg-[var(--bg-app)] rounded-2xl p-3 border border-[var(--border-card)] font-sans text-xs leading-relaxed flex flex-col gap-1.5 shadow-inner scrollbar-thin select-text transition-all duration-300 text-left"
                      >
                        {[...logs].reverse().map((entry, index) => {
                          let colorClass = 'text-[var(--text-primary)]';
                          let iconColor = 'bg-emerald-500';
                          if (entry.type === 'error') {
                            colorClass = 'text-rose-700 dark:text-rose-400 font-bold';
                            iconColor = 'bg-rose-500';
                          } else if (entry.type === 'success') {
                            colorClass = 'text-[var(--accent-primary)] font-bold';
                            iconColor = 'bg-[var(--accent-primary)]';
                          } else if (entry.type === 'warn') {
                            colorClass = 'text-amber-700 dark:text-amber-400 font-bold';
                            iconColor = 'bg-amber-500';
                          } else if (entry.type === 'actuator') {
                            colorClass = 'text-teal-700 dark:text-teal-400 font-semibold';
                            iconColor = 'bg-teal-500';
                          }

                          return (
                            <motion.div
                              key={`${entry.id}-${index}`}
                              className="flex gap-2.5 items-center"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <span className="text-[10px] text-[var(--text-secondary)] font-sans font-bold shrink-0 select-none">
                                [{entry.timestamp}]
                              </span>
                              <span className="flex items-center gap-2 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${iconColor}`} />
                                <span className={`${colorClass} truncate font-medium`}>{entry.message}</span>
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ledger triggers */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch gap-2 md:w-[220px]">
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-sans font-extrabold text-center md:text-left select-none">
                        {t.systemLedgerTitle}
                      </span>
                      <button
                        id="btn-trigger-ledger-modal"
                        onClick={() => setIsLedgerOpen(true)}
                        className="py-2.5 sm:py-3 px-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] hover:bg-[var(--bg-app)] text-[var(--text-primary)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 font-sans text-xs font-bold shadow-sm active:scale-95"
                      >
                        <Database className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                        {t.analyzeLedgerBtn}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CCTV photos stream category display */}
                <div className={mobileSubTab === 'gallery' ? 'block' : 'hidden md:block'}>
                  <ObservationGallery tempUnit={tempUnit} language={language} />
                </div>

                {/* Guestbook logs section */}
                <div className={mobileSubTab === 'gallery' ? 'block' : 'hidden md:block'}>
                  <CommentSection />
                </div>
              </motion.div>
            )}

            {/* 2nd Tab: Sensing analytics chart */}
            {activeTab === 'chart' && (
              <motion.div
                key="chart"
                id="view-tab-chart"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="w-full flex-grow flex flex-col"
              >
                <div id="charts-visualization-row" className="w-full h-full flex-grow">
                  <ThermodynamicChart history={chartHistory} tempUnit={tempUnit} language={language} />
                </div>
              </motion.div>
            )}

            {/* 3rd Tab: Smart Settings configurations */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                id="view-tab-settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
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

        {/* C. MOBILE DOCK SYSTEM NAVIGATION (Floating bar at the bottom) */}
        <nav
          id="mobile-navigation-dock"
          className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] rounded-2xl z-30 flex items-center justify-around px-2 shadow-[var(--shadow-card)] transition-all duration-300"
        >
          <button
            id="mobile-dock-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-bold tracking-wide font-sans">{t.tabDashboard}</span>
          </button>

          <button
            id="mobile-dock-chart"
            onClick={() => setActiveTab('chart')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all cursor-pointer ${
              activeTab === 'chart' ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <TrendingUp className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-bold tracking-wide font-sans">{t.tabAnalysis}</span>
          </button>

          <button
            id="mobile-dock-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-bold tracking-wide font-sans">{t.tabSettings}</span>
          </button>
        </nav>

      </div>

      {/* Database ledger archive modal dialog */}
      <AnimatePresence>
        {isLedgerOpen && (
          <div
            id="system-ledger-modal-wrapper"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
          >
            <div className="absolute inset-0" onClick={() => setIsLedgerOpen(false)} />

            <motion.div
              id="system-ledger-modal-container"
              className="relative w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-none pointer-events-auto text-[var(--text-primary)] transition-all duration-300"
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
                <div className="flex items-center gap-2">
                  <Database className="text-[var(--accent-primary)] w-5 h-5 shrink-0" />
                  <div className="text-left">
                    <h3 className="text-base font-bold tracking-tight font-sans">
                      {t.systemLedgerTitle}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] font-sans font-medium mt-0.5">
                      {language === 'en' ? 'Archived activity log collection • Clamped to last 100 rows' : 'Arsip riwayat deteksi sensor terintegrasi • Dibatasi hingga 100 baris terakhir'}
                    </p>
                  </div>
                </div>

                <button
                  id="close-ledger-modal"
                  onClick={() => setIsLedgerOpen(false)}
                  className="p-1.5 rounded-xl border border-[var(--border-card)] hover:border-[var(--accent-primary)]/20 bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer hover:shadow-sm"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Filtering Search input */}
              <div className="flex flex-col sm:flex-row gap-3 py-4 border-b border-[var(--border-card)]">
                <div className="flex-grow">
                  <input
                    id="ledger-search-input"
                    type="text"
                    placeholder={language === 'en' ? 'Search entries (e.g., warning, fan, feed)...' : 'Cari catatan riwayat (misal: peringatan, kipas, makan)...'}
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-emerald-500/40 font-sans transition-all duration-300"
                  />
                </div>
                {ledgerSearch && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setLedgerSearch('')}
                    className="px-4 bg-[var(--bg-app)] border border-[var(--border-card)] text-xs font-sans font-bold text-[var(--text-secondary)] rounded-xl hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {language === 'en' ? 'Clear Filter' : 'Hapus Pencarian'}
                  </button>
                )}
              </div>

              {/* Ledger list */}
              <div className="flex-grow overflow-y-auto py-4 flex flex-col gap-2 h-96 scrollbar-thin text-left">
                {filteredLedger.length === 0 ? (
                  <div className="text-center text-[var(--text-secondary)] py-12 font-sans text-xs italic font-medium">
                    {language === 'en' ? 'No records found matching current filter query.' : 'Tidak ada catatan yang cocok dengan pencarian Anda.'}
                  </div>
                ) : (
                  filteredLedger.map((item, index) => {
                    let badgeColor = 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200/50 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400';
                    if (item.type === 'error') badgeColor = 'bg-rose-100 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30 text-rose-800 dark:text-rose-300';
                    else if (item.type === 'warn') badgeColor = 'bg-amber-100 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30 text-amber-800 dark:text-amber-300';
                    else if (item.type === 'success') badgeColor = 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300';
                    else if (item.type === 'actuator') badgeColor = 'bg-teal-100 dark:bg-teal-950/30 border-teal-200/50 dark:border-teal-800/30 text-teal-800 dark:text-teal-350';

                    return (
                      <div
                        key={`${item.id}-${index}`}
                        id={`ledger-row-${item.id}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] hover:bg-[var(--border-card)] transition-all duration-300 text-xs select-text font-sans font-medium"
                      >
                        <div className="flex items-center gap-3 shrink-0 select-none">
                          <span className="text-[var(--text-secondary)] font-sans font-bold">
                            {item.timestamp}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase w-16 text-center shrink-0 ${badgeColor}`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[var(--text-primary)] tracking-wide break-words flex-1 min-w-0 font-sans font-semibold">
                          {item.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer summary */}
              <div className="border-t border-[var(--border-card)] pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-secondary)] font-sans font-bold gap-4 select-none">
                <span>
                  {language === 'en' ? `Showing ${filteredLedger.length} of ${logs.length} logged records` : `Menampilkan ${filteredLedger.length} dari ${logs.length} catatan aktivitas`}
                </span>
                <span className="text-[10px] italic font-medium">
                  {language === 'en' ? 'Click backdrop or close button to leave logs session' : 'Klik latar belakang atau tombol tutup untuk menutup arsip'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
