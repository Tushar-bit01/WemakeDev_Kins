import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import { C, fmt, fmtL } from "./tokens";

function FooterStat({ label, value, color }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: "#6b9e85" }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

/**
 * LifetimeAnalysisChart — 25-year dual-axis line chart + summary footer.
 * Props: data (lifetimeChartData), hudData, isDark, card, border, text, sub
 */
export default function LifetimeAnalysisChart({ data, hudData, isDark, card, border, text, sub }) {
  return (
    <ChartCard
      title="25-Year Lifetime Analysis"
      subtitle="Generation degradation · escalated ₹ value"
      isDark={isDark} card={card} border={border} text={text} sub={sub}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1a2e20" : "#e5efe8"} />
          <XAxis dataKey="name" tick={{ fill: sub, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="kwh" tick={{ fill: sub, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="val" orientation="right" tick={{ fill: sub, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: isDark ? "#0e1812" : "#fff", border: `1px solid ${border}`, borderRadius: 10, color: text, fontSize: 12 }}
            formatter={(v, n) => n === "kWh" ? [`${fmt(v)} kWh`, "Generation"] : [`₹${fmt(v)}`, "Value (escalated)"]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: sub }} />
          <Line yAxisId="kwh" type="monotone" dataKey="kWh"   stroke={C.teal}   strokeWidth={2} dot={{ fill: C.teal,   r: 3 }} name="kWh" />
          <Line yAxisId="val" type="monotone" dataKey="value" stroke={C.yellow} strokeWidth={2} dot={{ fill: C.yellow, r: 3 }} name="₹ Value" />
        </LineChart>
      </ResponsiveContainer>

      {/* Footer stats row */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 px-1" style={{ borderTop: `1px solid ${border}` }}>
        <FooterStat label="Lifetime kWh"    value={`${fmt(hudData?.lifetimeKWh   || 0)} kWh`}    color={C.teal}    />
        <FooterStat label="Lifetime Savings" value={fmtL(hudData?.lifetimeSavings || 0)}           color={C.yellow}  />
        <FooterStat label="Yr 25 Output"    value={`${fmt(hudData?.year25Output  || 0)} kWh`}     color={sub}       />
        <FooterStat label="CO₂ Offset"      value={`${hudData?.co2OffsetTonnes   || 0} tonnes`}   color="#22c55e"   />
      </div>
    </ChartCard>
  );
}