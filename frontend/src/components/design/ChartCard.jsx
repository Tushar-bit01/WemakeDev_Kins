import React from "react";

/**
 * ChartCard — shared card wrapper used by all chart components.
 * Props: title, subtitle, isDark, card, border, text, sub, children
 */
export default function ChartCard({ title, subtitle, isDark, card, border, text, sub, children }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: card,
        border: `1.5px solid ${border}`,
        boxShadow: isDark ? "0 2px 16px #00000030" : "0 2px 12px #0F4C3A06",
      }}
    >
      <div className="flex items-baseline gap-3 mb-4">
        <h3 className="font-bold text-sm tracking-tight" style={{ color: text }}>{title}</h3>
        <span className="text-[10px]" style={{ color: sub }}>{subtitle}</span>
      </div>
      {children}
    </div>
  );
}