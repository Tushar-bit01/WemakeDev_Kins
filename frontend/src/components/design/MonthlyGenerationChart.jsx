import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import { C } from "./tokens";

/**
 * MonthlyGenerationChart — Year 1 monthly kWh area chart.
 * Props: data (monthlyChartData array), isDark, card, border, text, sub
 */
export default function MonthlyGenerationChart({ data, isDark, card, border, text, sub }) {
  return (
    <ChartCard
      title="Monthly Generation"
      subtitle="Year 1 · kWh"
      isDark={isDark} card={card} border={border} text={text} sub={sub}
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.green} stopOpacity={0.3} />
              <stop offset="95%" stopColor={C.green} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1a2e20" : "#e5efe8"} />
          <XAxis dataKey="name" tick={{ fill: sub, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: sub, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: isDark ? "#0e1812" : "#fff", border: `1px solid ${border}`, borderRadius: 10, color: text, fontSize: 12 }}
            formatter={(v) => [`${v} kWh`, "Generation"]}
          />
          <Area type="monotone" dataKey="kWh" stroke={C.green} strokeWidth={2} fill="url(#areaGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}