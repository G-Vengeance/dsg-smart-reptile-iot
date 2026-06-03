/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ControlMode = 'AUTOMATIC' | 'MANUAL';

export interface ClimateState {
  temperature: number; // in Celsius
  humidity: number; // in Percentage
  mode: ControlMode;
  fanSpeed: number; // 0 to 100
  mistingCountdown: number; // seconds remaining for active spray
  mistingDuration: number; // configured spray duration in seconds (5 - 30)
  isMisting: boolean;
}

export type LogType = 'info' | 'success' | 'warn' | 'error' | 'actuator';

export interface TelemetryLog {
  id: string;
  timestamp: string; // HH:MM:SS
  message: string;
  type: LogType;
}

export interface HistoricalRecord {
  timestamp: string; // ISO string
  displayTime: string; // Format for charts (e.g., "14:25")
  temperature: number;
  humidity: number;
  fanSpeed: number;
  isMisting: boolean;
  activityIndex: number;
}

export interface BiometricState {
  digestionPhase: number; // 0 to 100 (5 battery segments)
  sheddingPredictor: number; // percentage progress towards shedding
  activityLevel: 'Resting' | 'Foraging' | 'Hunting';
  activityIndex: number[]; // 8 elements for interactive equalizer [0-100]
}

export interface SettingsState {
  tempMinAlarm: number;
  tempMaxAlarm: number;
  humMinAlarm: number;
  humMaxAlarm: number;
  sensorInterval: number; // seconds
  heaterIntensity: number; // %
  ledIntensity: number; // %
  muteAlerts: boolean;
  darkMode: boolean;
  language: 'en' | 'id';
}

