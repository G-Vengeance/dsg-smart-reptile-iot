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

  // DRAG TO ZOOM STATE MANAGERS
  const [zoomIndices, setZoomIndices] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragCurrentX, setDragCurrentX] = useState<number | null>(null);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);

  // Filter history records corresponding to the chosen scope
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

  // Derived Zoom level subset
  const finalHistory = useMemo(() => {
    if (!zoomIndices) return filteredHistory;
    const start = Math.max(0, Math.min(zoomIndices.start, zoomIndices.end));
    const end = Math.min(filteredHistory.length - 1, Math.max(zoomIndices.start, zoomIndices.end));
    return filteredHistory.slice(start, end + 1);
  }, [filteredHistory, zoomIndices]);

  // Compute peaks inside finalHistory for diagnostic insights and guidelines
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

  // SVG parameters
  const viewWidth = 900;
  const viewHeight = 280;
  const paddingX = 45;
  const paddingY = 30;

  // Compute boundaries over the active rendered subset (finalHistory)
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

    // Padding bounds for aesthetic breathing room
    const isFahrenheit = tempUnit === 'F';
    const floorLimit = isFahrenheit ? 50 : 10;
    const ceilLimit = isFahrenheit ? 115 : 45;

    return {
      minT: Math.max(floorLimit, Math.floor(minT - 1.5)),
      maxT: Math.min(ceilLimit, Math.ceil(maxT + 1.5)),
      minH: Math.max(20, Math.floor(minH - 3)),
      maxH: Math.min(100, Math.ceil(maxH + 3)),
    };
  }, [finalHistory]);

  // Map peaks to SVG vertical coordinate spaces
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

  // Map database coordinates into the SVG viewport
  const points = useMemo(() => {
    const listLen = finalHistory.length;
    if (listLen === 0) return { tempPts: [], humPts: [] };

    const { minT, maxT, minH, maxH } = bounds;

    const tRange = maxT - minT === 0 ? 1 : maxT - minT;
    const hRange = maxH - minH === 0 ? 1 : maxH - minH;

    const tempPts: { x: number; y: number }[] = [];
    const humPts: { x: number; y: number }[] = [];

    finalHistory.forEach((record, index) => {
      // Calculate Horizontal X placement
      const x =
        listLen === 1
          ? viewWidth / 2
          : paddingX + (index / (listLen - 1)) * (viewWidth - paddingX * 2);

      // Calculate Vertical Y placement (Flipped because SVG 0,0 is top-left)
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

  // Construct Cubic-Bezier spline path for natural curves
  const getSplinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];

      // Smooth horizontal handles
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

  // Generates Area fills matching the curves
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

  // Drag and Drop Zoom Core Handlers
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

    // If dragged more than 8 pixels, apply zoom slice relative to filteredHistory
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

  // 4. FUNCTIONAL EXPORT PIPELINE (CSV & XML)
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
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col gap-5 w-full overflow-hidden"
    >
      {/* Platform Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <AreaChart className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-sans">
              Thermodynamic Data Science Ledger
            </h2>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-widest">
              Bi-variable micro-climate plotting engine
            </p>
          </div>
        </div>

        {/* Filters and Reset Zoom triggers */}
        <div className="flex items-center gap-3">
          {zoomIndices && (
            <button
              id="btn-reset-zoom"
              onClick={() => {
                setZoomIndices(null);
                setHoveredIdx(null);
              }}
              className="px-3 py-1.5 text-[11px] font-bold font-mono tracking-wider rounded border border-rose-500/30 bg-rose-950/35 text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.15)] flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              Reset Zoom
            </button>
          )}

          <div id="scope-filters" className="flex items-center gap-1.5 p-1 bg-black/20 border border-white/5 rounded-lg select-none">
            {(['1H', '6H', '24H', '7D', '30D'] as TimeScope[]).map((sc) => (
              <button
                key={sc}
                id={`scope-${sc}`}
                onClick={() => {
                  setScope(sc);
                  setZoomIndices(null);
                  setHoveredIdx(null);
                }}
                className={`px-3 py-1 text-[11px] font-bold font-mono tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  scope === sc
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Diagnostic Peak Summary Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Peak Temp Summary Card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-cyan-500/10 bg-cyan-950/15 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Peak Canopy Temp (Scope)</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {peaks.maxTemp > -Infinity ? `${peaks.maxTemp.toFixed(2)} °${tempUnit}` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Occurred At</span>
            <span className="text-[10px] text-slate-300 font-mono font-bold">
              {peaks.maxTempTime || 'N/A'}
            </span>
          </div>
        </div>

        {/* Peak Humid Summary Card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-500/10 bg-emerald-950/15 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Peak Terrarium Humidity (Scope)</span>
              <span className="text-sm font-bold text-emerald-300 font-mono">
                {peaks.maxHum > -Infinity ? `${peaks.maxHum.toFixed(1)} %` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Occurred At</span>
            <span className="text-[10px] text-slate-300 font-mono font-bold">
              {peaks.maxHumTime || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary SVG Chart Visualization Row */}
      <div className="relative w-full overflow-x-auto select-none pointer-events-auto bg-black/10 border border-white/5 p-4 rounded-2xl shadow-inner">
        {finalHistory.length === 0 ? (
          <div className="w-full h-72 flex flex-col items-center justify-center text-slate-400 font-mono text-sm">
            <Layers className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
            Awaiting Environment Initialization...
          </div>
        ) : (
          <div className="min-w-[800px] w-full">
            <p className="text-[10px] text-slate-500 font-mono mb-2 text-right tracking-tight">
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
                {/* Temp gradient */}
                <linearGradient id="chart-temp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
                {/* Humid gradient */}
                <linearGradient id="chart-hum-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>

                <filter id="glow-filter-cyan">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.6" />
                </filter>
                <filter id="glow-filter-emerald">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Gridlines of custom microscale */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingY + ratio * (viewHeight - paddingY * 2);
                const tempVal = bounds.maxT - ratio * (bounds.maxT - bounds.minT);
                const humVal = bounds.maxH - ratio * (bounds.maxH - bounds.minH);

                return (
                  <g key={index} className="opacity-40">
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={viewWidth - paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    {/* Left text: Temp */}
                    <text
                      x={paddingX - 8}
                      y={y + 4}
                      fill="#22d3ee"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                      className="font-semibold fill-cyan-400"
                    >
                      {tempVal.toFixed(1)}°
                    </text>
                    {/* Right text: Humid */}
                    <text
                      x={viewWidth - paddingX + 8}
                      y={y + 4}
                      fill="#10b981"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="start"
                      className="font-semibold fill-emerald-400"
                    >
                      {humVal.toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* Spline Area Gradients under */}
              {tempAreaPath && <path d={tempAreaPath} fill="url(#chart-temp-grad)" stroke="none" />}
              {humAreaPath && <path d={humAreaPath} fill="url(#chart-hum-grad)" stroke="none" />}

              {/* Lines segment curves */}
              {tempPath && (
                <path
                  d={tempPath}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#glow-filter-cyan)"
                  className="transition-all duration-300 opacity-90"
                />
              )}
              {humPath && (
                <path
                  d={humPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#glow-filter-emerald)"
                  className="transition-all duration-300 opacity-90"
                />
              )}

              {/* Dynamic Guidelines for peak values inside visual window */}
              {peaksSvgCoords && peaks.maxTemp > -Infinity && !isDragging && (
                <g className="opacity-40 transition-all duration-300">
                  <line
                    x1={paddingX}
                    y1={peaksSvgCoords.yMaxTemp}
                    x2={viewWidth - paddingX}
                    y2={peaksSvgCoords.yMaxTemp}
                    stroke="rgba(34, 211, 238, 0.5)"
                    strokeWidth="1.2"
                    strokeDasharray="2,3"
                  />
                  <text
                    x={paddingX + 6}
                    y={peaksSvgCoords.yMaxTemp - 5}
                    fill="#22d3ee"
                    fontSize="8"
                    fontFamily="monospace"
                    className="font-bold fill-cyan-400"
                  >
                    {language === 'en' ? 'MAX TEMP' : 'SUHU TERTINGGI'}: {peaks.maxTemp.toFixed(1)}°{tempUnit}
                  </text>
                </g>
              )}

              {peaksSvgCoords && peaks.maxHum > -Infinity && !isDragging && (
                <g className="opacity-40 transition-all duration-300">
                  <line
                    x1={paddingX}
                    y1={peaksSvgCoords.yMaxHum}
                    x2={viewWidth - paddingX}
                    y2={peaksSvgCoords.yMaxHum}
                    stroke="rgba(16, 185, 129, 0.5)"
                    strokeWidth="1.2"
                    strokeDasharray="2,3"
                  />
                  <text
                    x={viewWidth - paddingX - 6}
                    y={peaksSvgCoords.yMaxHum - 5}
                    fill="#10b981"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="end"
                    className="font-bold fill-emerald-400"
                  >
                    {language === 'en' ? 'MAX HUMIDITY' : 'KELEMBAPAN TERTINGGI'}: {peaks.maxHum.toFixed(0)}%
                  </text>
                </g>
              )}

              {/* X Timeline label dates */}
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
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="opacity-70 font-semibold"
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
                  fill="rgba(6, 182, 212, 0.15)"
                  stroke="rgba(6, 182, 212, 0.5)"
                  strokeWidth="1.5"
                  pointerEvents="none"
                />
              )}

              {/* Reactive hover crosshairs and tooltips */}
              {hoveredIdx !== null && points.tempPts[hoveredIdx] && points.humPts[hoveredIdx] && !isDragging && (
                <g>
                  {/* Vertical Tracking crosshair line */}
                  <line
                    x1={points.tempPts[hoveredIdx].x}
                    y1={paddingY}
                    x2={points.tempPts[hoveredIdx].x}
                    y2={viewHeight - paddingY}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />

                  {/* Temp beacon intersection circle */}
                  <circle
                    cx={points.tempPts[hoveredIdx].x}
                    cy={points.tempPts[hoveredIdx].y}
                    r="5"
                    fill="#000"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    filter="url(#glow-filter-cyan)"
                  />

                  {/* Humidity beacon intersection circle */}
                  <circle
                    cx={points.humPts[hoveredIdx].x}
                    cy={points.humPts[hoveredIdx].y}
                    r="5"
                    fill="#000"
                    stroke="#10b981"
                    strokeWidth="2"
                    filter="url(#glow-filter-emerald)"
                  />
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Dynamic Hover Tooltip row + Action details */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-black/10 border border-white/5 p-4 rounded-2xl">
        <div id="crosshair-tracker-panel" className="flex-grow flex items-center">
          {hoveredIdx !== null && finalHistory[hoveredIdx] ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">{language === 'en' ? 'Time' : 'Waktu'}</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {finalHistory[hoveredIdx].displayTime || finalHistory[hoveredIdx].timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">{t.tempTitle}</span>
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    {finalHistory[hoveredIdx].temperature.toFixed(2)}°{tempUnit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">{t.humidTitle}</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {finalHistory[hoveredIdx].humidity.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-mono">{language === 'en' ? 'Actuators' : 'Status Alat'}</span>
                <span className="text-xs font-semibold text-slate-300 font-mono">
                  {language === 'en' ? 'Fan' : 'Kipas'}: {finalHistory[hoveredIdx].fanSpeed}% | {language === 'en' ? 'Mist' : 'Kabut'}:{' '}
                  {finalHistory[hoveredIdx].isMisting ? (language === 'en' ? 'ACTIVE' : 'AKTIF') : (language === 'en' ? 'OFF' : 'MATI')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              {language === 'en' ? 'Hover over the chart nodes to analyze exact thermodynamic readings.' : 'Arahkan kursor ke grafik untuk melihat detail angka suhu dan kelembapan.'}
            </div>
          )}
        </div>

        {/* 4. EXPORT PIPELINE CONTROL BAR */}
        <div className="flex gap-2 min-w-max">
          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold font-mono tracking-wide transition-all cursor-pointer"
            title={language === 'en' ? 'Download whole history as CSV' : 'Unduh seluruh data dalam format CSV'}
          >
            <Download className="w-3.5 h-3.5" />
            {language === 'en' ? 'Save CSV' : 'Simpan CSV'}
          </button>
          <button
            id="btn-export-xml"
            onClick={exportXML}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-500/10 text-emerald-300 text-xs font-bold font-mono tracking-wide transition-all cursor-pointer"
            title={language === 'en' ? 'Download whole history as XML' : 'Unduh seluruh data dalam format XML'}
          >
            <FileJson className="w-3.5 h-3.5" />
            {language === 'en' ? 'Save XML' : 'Simpan XML'}
          </button>
        </div>
      </div>
    </div>
  );
}
