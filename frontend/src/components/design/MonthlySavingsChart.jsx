import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import { C, fmt } from "./tokens";

/**
 * MonthlySavingsChart — Year 1 monthly savings bar chart.
 * Props: data (monthlyChartData array), isDark, card, border, text, sub
 */
export default function MonthlySavingsChart({ data, isDark, card, border, text, sub }) {
  return (
    <ChartCard
      title="Monthly Savings"
      subtitle="Year 1 · ₹"
      isDark={isDark} card={card} border={border} text={text} sub={sub}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1a2e20" : "#e5efe8"} />
          <XAxis dataKey="name" tick={{ fill: sub, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: sub, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: isDark ? "#0e1812" : "#fff", border: `1px solid ${border}`, borderRadius: 10, color: text, fontSize: 12 }}
            formatter={(v) => [`₹${fmt(v)}`, "Savings"]}
          />
          <Bar dataKey="savings" fill={C.yellow} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}