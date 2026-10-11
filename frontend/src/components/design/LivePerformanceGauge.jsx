import React from "react";
import { C } from "./tokens";

/**
 * LivePerformanceGauge — arc gauge showing live output vs nameplate,
 * plus shading / clipping / cell-temp row.
 *
 * Props: hudData, gaugePercent, isDark, card, border, text, sub
 */
export default function LivePerformanceGauge({ hudData, gaugePercent, isDark, card, border, text, sub }) {
  const systemKW  = hudData?.systemKW || 0;
  const arcStroke = gaugePercent > 70 ? "#22c55e" : gaugePercent > 30 ? C.yellow : C.teal;
  const arcFill   = isDark ? "#1a2e20" : "#e5efe8";

  return (
    <div className="rounded-2xl p-5" style={{ background: card, border: `1.5px solid ${border}` }}>

      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: sub }}>
        Live Performance
      </p>

      {/* Arc gauge */}
      <div className="flex items-center justify-center my-2">
        <svg viewBox="0 0 140 80" className="w-36 h-20">
          {/* Background arc */}
          <path d="M10 75 A60 60 0 0 1 130 75" fill="none" stroke={arcFill} strokeWidth="10" strokeLinecap="round"/>
          {/* Value arc */}
          <path
            d="M10 75 A60 60 0 0 1 130 75"
            fill="none"
            stroke={arcStroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(gaugePercent / 100) * 188} 188`}
          />
          {/* Labels */}
          <text x="70" y="68" textAnchor="middle" fontSize="18" fontWeight="bold" fill={text}>
            {hudData?.isDay ? hudData.currentKW : "—"}
          </text>
          <text x="70" y="78" textAnchor="middle" fontSize="8" fill={sub}>
            kW of {systemKW} kWp
          </text>
        </svg>
      </div>

      {/* Row 1: Shaded / Clip / Temp */}
      <div className="flex justify-between text-xs mt-4 px-1">
        <span style={{ color: sub }}>
          Shaded:{" "}
          <strong style={{ color: (hudData?.shadedPanels || 0) > 0 ? "#ef4444" : "#22c55e" }}>
            {hudData?.shadedPanels || 0}
          </strong>
        </span>
        <span style={{ color: sub }}>
          Clip:{" "}
          <strong style={{ color: "#f59e0b" }}>
            {hudData?.clippingFactor < 0.99
              ? `${((1 - (hudData?.clippingFactor || 1)) * 100).toFixed(1)}%`
              : "—"}
          </strong>
        </span>
        <span style={{ color: sub }}>
          Temp:{" "}
          <strong style={{ color: "#f59e0b" }}>
            {hudData?.isDay ? `${hudData.cellTemp}°C` : "—"}
          </strong>
        </span>
      </div>

      {/* Row 2: POA Irradiance */}
      <div
        className="flex justify-between items-center mt-4 px-2 py-1.5 rounded-lg text-xs"
        style={{ background: isDark ? "#0a1610" : "#f7fbf8", border: `1px solid ${border}` }}
      >
        <span style={{ color: sub }}>POA Irradiance</span>
        <span style={{ fontWeight: 700, color: C.yellow }}>
          {hudData?.poaIrradiance ?? "—"} <span style={{ color: sub, fontWeight: 400 }}>W/m²</span>
        </span>
      </div>
    </div>
  );
}