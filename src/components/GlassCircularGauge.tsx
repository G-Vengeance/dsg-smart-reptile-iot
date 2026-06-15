/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

// Custom hook to animate numbers cleanly with an easing-out quadratic curve
function useAnimatedNumber(targetValue: number, durationMs: number = 600) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    let animationFrameId: number;

    const updateValue = (time: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = time;
      }
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Easing out quad
      const easeProgress = progress * (2 - progress);

      const nextValue = startValueRef.current + (targetValue - startValueRef.current) * easeProgress;
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateValue);
      }
    };

    animationFrameId = requestAnimationFrame(updateValue);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, durationMs]);

  return displayValue;
}

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  title: string;
  unit: string;
  type: 'temperature' | 'humidity';
  sparklineData: number[];
  statusMessage: string;
  language?: 'en' | 'id';
}

export default function GlassCircularGauge({
  value,
  min,
  max,
  title,
  unit,
  type,
  sparklineData,
  statusMessage,
  language = 'en',
}: GaugeProps) {
  // Use custom count up/down animation hook
  const animatedValue = useAnimatedNumber(value, 600);

  // Map value to percentage between min and max (for circular stroke-dashoffset)
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  );

  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Revert circular gauge colors to match the dynamic design in original codebase
  let gradientId = `gauge-gradient-${type}`;
  let haloColorClass = 'from-cyan-500/30 to-blue-500/30';
  let badgeColorClass = 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30';
  let gradientStop1 = '#4FACFE';
  let gradientStop2 = '#00F2FE';

  if (type === 'temperature') {
    const isFahrenheit = unit.includes('F');
    const overLimit = isFahrenheit ? 86 : 30;
    const underLimit = isFahrenheit ? 75.2 : 24;

    if (value > overLimit) {
      gradientStop1 = '#FF416C';
      gradientStop2 = '#FF4B2B';
      haloColorClass = 'from-red-500/30 to-orange-500/30';
      badgeColorClass = 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20';
    } else if (value < underLimit) {
      gradientStop1 = '#465A7A';
      gradientStop2 = '#1D2A44';
      haloColorClass = 'from-slate-600/30 to-indigo-900/30';
      badgeColorClass = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    } else {
      gradientStop1 = '#4FACFE';
      gradientStop2 = '#00F2FE';
      haloColorClass = 'from-cyan-500/20 to-blue-500/20';
      badgeColorClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    }
  } else {
    // Humidity color:
    if (value < 60) {
      gradientStop1 = '#F39C12';
      gradientStop2 = '#D35400';
      haloColorClass = 'from-amber-500/25 to-orange-500/25';
      badgeColorClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    } else if (value >= 70 && value <= 85) {
      gradientStop1 = '#00B09B';
      gradientStop2 = '#96C93D';
      haloColorClass = 'from-emerald-500/20 to-lime-500/20';
      badgeColorClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    } else if (value > 85) {
      gradientStop1 = '#7F00FF';
      gradientStop2 = '#E100FF';
      haloColorClass = 'from-purple-500/20 to-pink-500/20';
      badgeColorClass = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
    } else {
      // 60% - 70% transition
      gradientStop1 = '#13E0B5';
      gradientStop2 = '#00B09B';
      haloColorClass = 'from-teal-500/20 to-cyan-500/20';
      badgeColorClass = 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20';
    }
  }

  // Draw sparkline coordinates
  const width = 120;
  const height = 18;
  const padding = 2;
  const sparklinePoints = React.useMemo(() => {
    if (!sparklineData || sparklineData.length < 2) return '';
    const minVal = Math.min(...sparklineData);
    const maxVal = Math.max(...sparklineData);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    return sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * (width - padding * 2) + padding;
        const y =
          height -
          ((val - minVal) / range) * (height - padding * 2) -
          padding;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [sparklineData]);

  return (
    <div
      id={`gauge-card-${type}`}
      className="relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] text-[var(--text-primary)] transition-all duration-300 min-h-[300px] sm:min-h-[365px] md:min-h-[410px] h-full w-full overflow-hidden"
    >
      {/* 1. Original Breathing Halo Backing Glow */}
      <motion.div
        id={`gauge-halo-${type}`}
        className={`absolute top-6 sm:top-10 left-1/2 -translate-x-1/2 w-28 sm:w-44 h-28 sm:h-44 rounded-full bg-gradient-to-tr ${haloColorClass} filter blur-2xl sm:blur-3xl opacity-40 z-0 pointer-events-none`}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: type === 'temperature' ? 4 : 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Header Info */}
      <div className="z-10 text-center w-full">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-secondary)] font-sans font-bold truncate max-w-full">
          {title}
        </h3>
      </div>

      {/* 2. Original Interactive Circular Gauge */}
      <div className="relative flex items-center justify-center w-24 h-24 sm:w-36 sm:h-36 z-10 my-0.5 sm:my-1">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStop1} />
              <stop offset="100%" stopColor={gradientStop2} />
            </linearGradient>
            <filter id={`drop-shadow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={gradientStop2} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Underlayer track circle */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="transparent"
            stroke="rgba(120, 120, 120, 0.08)"
            strokeWidth="8"
          />

          {/* Active progress circle */}
          <motion.circle
            cx="65"
            cy="65"
            r={radius}
            fill="transparent"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            strokeLinecap="round"
            filter={`url(#drop-shadow-${type})`}
          />
        </svg>

        {/* 3. Frosted Glass Lens Overlay */}
        <div
          id={`frosted-lens-${type}`}
          className="absolute inset-[10px] sm:inset-[15px] rounded-full border border-zinc-200/50 dark:border-white/15 bg-zinc-50/20 dark:bg-white/5 backdrop-blur-md shadow-inner flex flex-col items-center justify-center select-none"
        >
          <motion.span
            id={`gauge-numeric-value-${type}`}
            className="text-xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tighter tabular-nums font-sans"
            animate={{ scale: [0.98, 1, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {animatedValue.toFixed(1)}
          </motion.span>
          <span className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-semibold tracking-wide">
            {unit}
          </span>
        </div>
      </div>

      {/* Footer Sparkline & Status */}
      <div className="z-10 w-full flex flex-col items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
        {/* State Badge */}
        <span
          id={`gauge-status-badge-${type}`}
          className={`text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full border font-bold text-center truncate max-w-full ${badgeColorClass}`}
        >
          {statusMessage}
        </span>

        {/* Extended Mini-Trend Sparkline (24H Area) */}
        <div className="w-[100px] h-[14px] sm:w-[120px] sm:h-[18px] mt-0.5 sm:mt-1 relative flex items-center justify-center">
          {sparklinePoints ? (
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id={`sparkline-grad-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={gradientStop2} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={gradientStop2} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Fill under sparkline */}
              <path
                d={`M ${padding},${height} L ${sparklinePoints} L ${width - padding},${height} Z`}
                fill={`url(#sparkline-grad-${type})`}
                stroke="none"
              />
              {/* Sparkline curve stroke */}
              <polyline
                fill="none"
                stroke={gradientStop2}
                strokeWidth="1.5"
                points={sparklinePoints}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90"
              />
            </svg>
          ) : (
            <div className="text-[9px] text-[var(--text-secondary)] font-mono">{language === 'en' ? 'No Trend' : 'Tidak Ada Tren'}</div>
          )}
        </div>
        <div className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] tracking-wider uppercase font-sans font-bold">
          {language === 'en' ? '24-Hour Trend' : 'Tren Riwayat 24 Jam'}
        </div>
      </div>
    </div>
  );
}
