import React from "react";
import { C, fmt } from "./tokens";

/**
 * SystemStatCards — 2-column grid of 6 live metric pills.
 * Props: hudData, isDark, border, sub
 */
export default function SystemStatCards({ hudData, isDark, border, sub }) {
  if (!hudData) return null;

  const bg = isDark ? "#0a1610" : "#f7fbf8";

  const stats = [
    { label: "Solar Panels",   value: `${hudData.panelCount}`,                 unit: hudData.orientation, color: C.teal    },
    { label: "System Size",    value: `${hudData.systemKW}`,                    unit: "kWp",               color: C.green   },
    { label: "Live Output",    value: hudData.isDay ? `${hudData.currentKW}` : "—", unit: "kW",            color: "#22c55e" },
    { label: "Cell Temp",      value: hudData.isDay ? `${hudData.cellTemp}`  : "—", unit: "°C",            color: "#f59e0b" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full content-start">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl p-3"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          <p className="text-[9px] font-bold tracking-wider uppercase" style={{ color: sub }}>{s.label}</p>
          <p className="text-base font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[9px]" style={{ color: sub }}>{s.unit}</p>
        </div>
      ))}
    </div>
  );
}