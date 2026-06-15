/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { AreaChart, Download, FileJson, Layers, Calendar, Thermometer, Droplet, RotateCcw } from 'lucide-react';
import { HistoricalRecord } from '../types';
import { translations } from '../utils/i18n';

interface ThermodynamicChartProps {
  history: HistoricalRecord[];
  tempUnit: 'C' | 'F';
  language?: 'en' | 'id';
}

type TimeScope = '1H' | '6H' | '24H' | '7D' | '30D';

export default function ThermodynamicChart({ history, tempUnit, language = 'en' }: ThermodynamicChartProps) {
  const t = translations[language];
  const [scope, setScope] = useState<TimeScope>('24H');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoomIndices, setZoomIndices] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragCurrentX, setDragCurrentX] = useState<number | null>(null);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);

  const filteredHistory = useMemo(() => {
    if (history.length === 0) return [];

    let limit = history.length;
    switch (scope) {
      case '1H':
        limit = 6;
        break;
      case '6H':
        limit = 15;
        break;
      case '24H':
        limit = 48;
        break;
      case '7D':
        limit = 150;
        break;
      case '30D':
        limit = history.length;
        break;
    }

    return history.slice(-limit);
  }, [history, scope]);

  const finalHistory = useMemo(() => {
    if (!zoomIndices) return filteredHistory;
    const start = Math.max(0, Math.min(zoomIndices.start, zoomIndices.end));
    const end = Math.min(filteredHistory.length - 1, Math.max(zoomIndices.start, zoomIndices.end));
    return filteredHistory.slice(start, end + 1);
  }, [filteredHistory, zoomIndices]);

  const peaks = useMemo(() => {
    if (finalHistory.length === 0) {
      return { maxTemp: -Infinity, minTemp: Infinity, maxHum: -Infinity, minHum: Infinity, maxTempTime: '', maxHumTime: '' };
    }

    let maxTemp = -Infinity;
    let minTemp = Infinity;
    let maxHum = -Infinity;
    let maxHumTime = '';
    let maxTempTime = '';

    finalHistory.forEach((rec) => {
      if (rec.temperature > maxTemp) {
        maxTemp = rec.temperature;
        maxTempTime = rec.displayTime;
      }
      if (rec.temperature < minTemp) {
        minTemp = rec.temperature;
      }
      if (rec.humidity > maxHum) {
        maxHum = rec.humidity;
        maxHumTime = rec.displayTime;
      }
    });

    return { maxTemp, minTemp, maxHum, maxHumTime, maxTempTime };
  }, [finalHistory]);

  const viewWidth = 900;
  const viewHeight = 280;
  const paddingX = 45;
  const paddingY = 30;

  const bounds = useMemo(() => {
    if (finalHistory.length === 0) {
      const isF = tempUnit === 'F';
      return { minT: isF ? 59 : 15, maxT: isF ? 95 : 35, minH: 30, maxH: 100 };
    }

    const temperatures = finalHistory.map((h) => h.temperature);
    const humidities = finalHistory.map((h) => h.humidity);

    const minT = Math.min(...temperatures);
    const maxT = Math.max(...temperatures);
    const minH = Math.min(...humidities);
    const maxH = Math.max(...humidities);

    const isFahrenheit = tempUnit === 'F';
    const floorLimit = isFahrenheit ? 50 : 10;
    const ceilLimit = isFahrenheit ? 115 : 45;

    return {
      minT: Math.max(floorLimit, Math.floor(minT - 1.5)),
      maxT: Math.min(ceilLimit, Math.ceil(maxT + 1.5)),
      minH: Math.max(20, Math.floor(minH - 3)),
      maxH: Math.min(100, Math.ceil(maxH + 3)),
    };
  }, [finalHistory, tempUnit]);

  const peaksSvgCoords = useMemo(() => {
    if (finalHistory.length === 0) return null;
    const { minT, maxT, minH, maxH } = bounds;
    const tRange = maxT - minT === 0 ? 1 : maxT - minT;
    const hRange = maxH - minH === 0 ? 1 : maxH - minH;

    const yMaxTemp =
      viewHeight -
      paddingY -
      ((peaks.maxTemp - minT) / tRange) * (viewHeight - paddingY * 2);

    const yMaxHum =
      viewHeight -
      paddingY -
      ((peaks.maxHum - minH) / hRange) * (viewHeight - paddingY * 2);

    return { yMaxTemp, yMaxHum };
  }, [bounds, peaks, finalHistory]);

  const points = useMemo(() => {
    const listLen = finalHistory.length;
    if (listLen === 0) return { tempPts: [], humPts: [] };

    const { minT, maxT, minH, maxH } = bounds;

    const tRange = maxT - minT === 0 ? 1 : maxT - minT;
    const hRange = maxH - minH === 0 ? 1 : maxH - minH;

    const tempPts: { x: number; y: number }[] = [];
    const humPts: { x: number; y: number }[] = [];

    finalHistory.forEach((record, index) => {
      const x =
        listLen === 1
          ? viewWidth / 2
          : paddingX + (index / (listLen - 1)) * (viewWidth - paddingX * 2);

      const yTemp =
        viewHeight -
        paddingY -
        ((record.temperature - minT) / tRange) * (viewHeight - paddingY * 2);

      const yHum =
        viewHeight -
        paddingY -
        ((record.humidity - minH) / hRange) * (viewHeight - paddingY * 2);

      tempPts.push({ x, y: yTemp });
      humPts.push({ x, y: yHum });
    });

    return { tempPts, humPts };
  }, [finalHistory, bounds]);

  const getSplinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];

      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
      const cp2y = next.y;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
        1
      )} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    }
    return path;
  };

  const tempPath = useMemo(() => getSplinePath(points.tempPts), [points.tempPts]);
  const humPath = useMemo(() => getSplinePath(points.humPts), [points.humPts]);

  const tempAreaPath = useMemo(() => {
    if (points.tempPts.length < 2) return '';
    const firstX = points.tempPts[0].x;
    const lastX = points.tempPts[points.tempPts.length - 1].x;
    return `${tempPath} L ${lastX.toFixed(1)} ${(viewHeight - paddingY).toFixed(
      1
    )} L ${firstX.toFixed(1)} ${(viewHeight - paddingY).toFixed(1)} Z`;
  }, [points.tempPts, tempPath]);

  const humAreaPath = useMemo(() => {
    if (points.humPts.length < 2) return '';
    const firstX = points.humPts[0].x;
    const lastX = points.humPts[points.humPts.length - 1].x;
    return `${humPath} L ${lastX.toFixed(1)} ${(viewHeight - paddingY).toFixed(
      1
    )} L ${firstX.toFixed(1)} ${(viewHeight - paddingY).toFixed(1)} Z`;
  }, [points.humPts, humPath]);

  const getClosestIndex = (cursorX: number, pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return -1;
    let closestIdx = 0;
    let minDistance = Infinity;

    pts.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - cursorX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    return closestIdx;
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (points.tempPts.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = ((e.clientX - rect.left) / rect.width) * viewWidth;

    const closestIdx = getClosestIndex(cursorX, points.tempPts);
    if (closestIdx !== -1) {
      setIsDragging(true);
      setDragStartX(cursorX);
      setDragCurrentX(cursorX);
      setDragStartIdx(closestIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (points.tempPts.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = ((e.clientX - rect.left) / rect.width) * viewWidth;

    const closestIdx = getClosestIndex(cursorX, points.tempPts);

    if (isDragging) {
      setDragCurrentX(cursorX);
    } else {
      if (closestIdx !== -1) {
        setHoveredIdx(closestIdx);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging || dragStartIdx === null || dragStartX === null || dragCurrentX === null) {
      setIsDragging(false);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = ((e.clientX - rect.left) / rect.width) * viewWidth;
    const closestIdx = getClosestIndex(cursorX, points.tempPts);

    if (Math.abs(dragCurrentX - dragStartX) > 8 && closestIdx !== -1 && closestIdx !== dragStartIdx) {
      const indexA = filteredHistory.indexOf(finalHistory[dragStartIdx]);
      const indexB = filteredHistory.indexOf(finalHistory[closestIdx]);

      if (indexA !== -1 && indexB !== -1) {
        setZoomIndices({
          start: Math.min(indexA, indexB),
          end: Math.max(indexA, indexB),
        });
      }
    }

    setIsDragging(false);
    setDragStartX(null);
    setDragCurrentX(null);
    setDragStartIdx(null);
  };

  const exportCSV = () => {
    if (finalHistory.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,Temperature_C,Humidity_Percent,FanSpeed_Percent,Misting_Active,BiometricActivityIndex\n';

    finalHistory.forEach((record) => {
      const row = `${record.timestamp},${record.temperature.toFixed(2)},${record.humidity.toFixed(1)},${record.fanSpeed},${record.isMisting},${record.activityIndex}`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `midas_telemetry_${scope}_zoom_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportXML = () => {
    if (finalHistory.length === 0) return;
    let xmlContent = 'data:text/xml;charset=utf-8,';
    xmlContent += '<?xml version="1.0" encoding="UTF-8"?>\n<telemetry_platform>\n';
    xmlContent += '  <meta>\n';
    xmlContent += `    <client>Tropidolaemus subannulatus ("Midas")</client>\n`;
    xmlContent += `    <exported_at>${new Date().toISOString()}</exported_at>\n`;
    xmlContent += `    <scope>${scope}</scope>\n`;
    xmlContent += `    <is_zoomed>${zoomIndices !== null}</is_zoomed>\n`;
    xmlContent += '  </meta>\n';
    xmlContent += '  <records>\n';

    finalHistory.forEach((record) => {
      xmlContent += '    <record>\n';
      xmlContent += `      <timestamp>${record.timestamp}</timestamp>\n`;
      xmlContent += `      <temperature>${record.temperature.toFixed(2)}</temperature>\n`;
      xmlContent += `      <humidity>${record.humidity.toFixed(1)}</humidity>\n`;
      xmlContent += `      <fan_speed>${record.fanSpeed}</fan_speed>\n`;
      xmlContent += `      <misting_active>${record.isMisting}</misting_active>\n`;
      xmlContent += `      <biometric_activity_score>${record.activityIndex}</biometric_activity_score>\n`;
      xmlContent += '    </record>\n';
    });

    xmlContent += '  </records>\n</telemetry_platform>';

    const encodedUri = encodeURI(xmlContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `midas_telemetry_${scope}_zoom_export.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="executive-data-science-platform"
      ref={containerRef}
      className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-5 sm:p-6 shadow-[var(--shadow-card)] flex flex-col gap-5 w-full overflow-hidden text-[var(--text-primary)] transition-all duration-300"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
        <div className="flex items-center gap-2">
          <AreaChart className="w-5 h-5 text-[var(--accent-primary)]" />
          <div>
            <h2 className="text-base font-bold tracking-wide font-sans">
              {t.chartTitle}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] uppercase font-sans tracking-wider font-extrabold">
              {language === 'en' ? 'Bivariable organic climate metrics' : 'Metrik Iklim Organik Dwivariabel'}
            </p>
          </div>
        </div>

        {/* Scope selector */}
        <div className="flex items-center gap-3">
          {zoomIndices && (
            <button
              id="btn-reset-zoom"
              onClick={() => {
                setZoomIndices(null);
                setHoveredIdx(null);
              }}
              className="px-3 py-1.5 text-[11px] font-bold font-sans rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Zoom
            </button>
          )}

          <div id="scope-filters" className="flex items-center gap-1 p-1 bg-[var(--bg-app)] border border-[var(--border-card)] rounded-xl select-none">
            {(['1H', '6H', '24H', '7D', '30D'] as TimeScope[]).map((sc) => (
              <button
                key={sc}
                id={`scope-${sc}`}
                onClick={() => {
                  setScope(sc);
                  setZoomIndices(null);
                  setHoveredIdx(null);
                }}
                className={`px-3 py-1 text-[11px] font-bold font-sans rounded-lg transition-all duration-200 cursor-pointer ${
                  scope === sc
                    ? 'bg-[#2b5c2a] dark:bg-[#203c25] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Peak info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Canopy Temp Peak */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] font-sans font-bold uppercase tracking-wider block">{t.peakTemp}</span>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400 font-sans">
                {peaks.maxTemp > -Infinity ? `${peaks.maxTemp.toFixed(2)} °${tempUnit}` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-[var(--text-secondary)] font-sans uppercase tracking-wider block font-bold">Occurred At</span>
            <span className="text-[10px] text-[var(--text-primary)] font-sans font-extrabold">
              {peaks.maxTempTime || 'N/A'}
            </span>
          </div>
        </div>

        {/* Canopy Humidity Peak */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] font-sans font-bold uppercase tracking-wider block">{t.peakHumid}</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-sans">
                {peaks.maxHum > -Infinity ? `${peaks.maxHum.toFixed(1)} %` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-[var(--text-secondary)] font-sans uppercase tracking-wider block font-bold">Occurred At</span>
            <span className="text-[10px] text-[var(--text-primary)] font-sans font-extrabold">
              {peaks.maxHumTime || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto select-none pointer-events-auto bg-[var(--bg-app)] border border-[var(--border-card)] p-4 rounded-3xl shadow-inner transition-all duration-300">
        {finalHistory.length === 0 ? (
          <div className="w-full h-72 flex flex-col items-center justify-center text-[var(--text-secondary)] font-sans text-sm font-bold">
            <Layers className="w-8 h-8 text-[var(--text-secondary)] mb-2 animate-bounce" />
            Awaiting Environment Initialization...
          </div>
        ) : (
          <div className="min-w-[800px] w-full">
            <p className="text-[10px] text-[var(--text-secondary)] font-sans mb-2 text-right tracking-tight font-extrabold uppercase">
              🔍 Drag horizontally over the curves to ZOOM selected range
            </p>
            <svg
              className="w-full h-auto overflow-visible cursor-crosshair select-none"
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setIsDragging(false);
                setDragStartX(null);
                setDragCurrentX(null);
                setDragStartIdx(null);
                setHoveredIdx(null);
              }}
            >
              <defs>
                {/* Custom organic gradient fills */}
                <linearGradient id="chart-temp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gauge-warning)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--gauge-warning)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="chart-hum-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gauge-optimal)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--gauge-optimal)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingY + ratio * (viewHeight - paddingY * 2);
                const tempVal = bounds.maxT - ratio * (bounds.maxT - bounds.minT);
                const humVal = bounds.maxH - ratio * (bounds.maxH - bounds.minH);

                return (
                  <g key={index} className="opacity-70">
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={viewWidth - paddingX}
                      y2={y}
                      stroke="var(--border-card)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="var(--text-secondary)"
                      fontSize="9"
                      fontFamily="var(--font-sans)"
                      textAnchor="end"
                      className="font-bold"
                    >
                      {tempVal.toFixed(1)}°
                    </text>
                    <text
                      x={viewWidth - paddingX + 8}
                      y={y + 3}
                      fill="var(--text-secondary)"
                      fontSize="9"
                      fontFamily="var(--font-sans)"
                      textAnchor="start"
                      className="font-bold"
                    >
                      {humVal.toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* Fills */}
              {tempAreaPath && <path d={tempAreaPath} fill="url(#chart-temp-grad)" stroke="none" />}
              {humAreaPath && <path d={humAreaPath} fill="url(#chart-hum-grad)" stroke="none" />}

              {/* Lines */}
              {tempPath && (
                <path
                  d={tempPath}
                  fill="none"
                  stroke="var(--gauge-warning)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="opacity-90"
                />
              )}
              {humPath && (
                <path
                  d={humPath}
                  fill="none"
                  stroke="var(--gauge-optimal)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="opacity-90"
                />
              )}

              {/* X Timeline Labels */}
              {finalHistory.map((rec, idx) => {
                const listLen = finalHistory.length;
                const showLabel =
                  listLen < 8
                    ? true
                    : listLen < 20
                    ? idx % 3 === 0
                    : listLen < 60
                    ? idx % 8 === 0
                    : idx % 20 === 0;

                if (!showLabel) return null;

                const x =
                  listLen === 1
                    ? viewWidth / 2
                    : paddingX + (idx / (listLen - 1)) * (viewWidth - paddingX * 2);

                return (
                  <text
                    key={idx}
                    x={x}
                    y={viewHeight - paddingY + 16}
                    fill="var(--text-secondary)"
                    fontSize="9"
                    fontFamily="var(--font-sans)"
                    textAnchor="middle"
                    className="opacity-80 font-bold"
                  >
                    {rec.displayTime}
                  </text>
                );
              })}

              {/* Drag selection translucent overlay window */}
              {isDragging && dragStartX !== null && dragCurrentX !== null && (
                <rect
                  x={Math.min(dragStartX, dragCurrentX)}
                  y={paddingY}
                  width={Math.max(1, Math.abs(dragCurrentX - dragStartX))}
                  height={viewHeight - paddingY * 2}
                  fill="var(--accent-glow)"
                  stroke="var(--accent-primary)"
                  strokeWidth="1.2"
                  pointerEvents="none"
                />
              )}

              {/* Hover crosshair indicators */}
              {hoveredIdx !== null && points.tempPts[hoveredIdx] && points.humPts[hoveredIdx] && !isDragging && (
                <g>
                  <line
                    x1={points.tempPts[hoveredIdx].x}
                    y1={paddingY}
                    x2={points.tempPts[hoveredIdx].x}
                    y2={viewHeight - paddingY}
                    stroke="var(--border-card)"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                  <circle
                    cx={points.tempPts[hoveredIdx].x}
                    cy={points.tempPts[hoveredIdx].y}
                    r="4.5"
                    fill="var(--bg-card)"
                    stroke="var(--gauge-warning)"
                    strokeWidth="2"
                  />
                  <circle
                    cx={points.humPts[hoveredIdx].x}
                    cy={points.humPts[hoveredIdx].y}
                    r="4.5"
                    fill="var(--bg-card)"
                    stroke="var(--gauge-optimal)"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Tracker & Export panel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bg-app)] border border-[var(--border-card)] p-4 rounded-2xl">
        <div id="crosshair-tracker-panel" className="flex-grow flex items-center">
          {hoveredIdx !== null && finalHistory[hoveredIdx] ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase font-sans font-bold">{language === 'en' ? 'Time' : 'Waktu'}</span>
                  <span className="text-xs font-bold font-sans">
                    {finalHistory[hoveredIdx].displayTime || finalHistory[hoveredIdx].timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase font-sans font-bold">{t.tempTitle}</span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 font-sans">
                    {finalHistory[hoveredIdx].temperature.toFixed(2)}°{tempUnit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase font-sans font-bold">{t.humidTitle}</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-sans">
                    {finalHistory[hoveredIdx].humidity.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase font-sans font-bold">{language === 'en' ? 'Actuators' : 'Status Alat'}</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)] font-sans">
                  {language === 'en' ? 'Fan' : 'Kipas'}: {finalHistory[hoveredIdx].fanSpeed}% | {language === 'en' ? 'Mist' : 'Kabut'}:{' '}
                  {finalHistory[hoveredIdx].isMisting ? (language === 'en' ? 'ACTIVE' : 'AKTIF') : (language === 'en' ? 'OFF' : 'MATI')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[var(--text-secondary)] font-sans flex items-center gap-2 font-medium">
              <Layers className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {t.hoverTip}
            </div>
          )}
        </div>

        {/* Download actions */}
        <div className="flex gap-2 min-w-max">
          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] hover:bg-[var(--bg-app)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title={t.csvTooltip}
          >
            <Download className="w-3.5 h-3.5" />
            {t.saveCsv}
          </button>
          <button
            id="btn-export-xml"
            onClick={exportXML}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] hover:bg-[var(--bg-app)] text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title={t.xmlTooltip}
          >
            <FileJson className="w-3.5 h-3.5" />
            {t.saveXml}
          </button>
        </div>
      </div>
    </div>
  );
}
