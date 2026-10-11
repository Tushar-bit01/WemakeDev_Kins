import React from "react";
import { fmtL, fmt } from "./tokens";

/**
 * FinancialKPICards — row of 6 financial KPI cards.
 * Props: hudData, isDark, card, border, text, sub
 */
export default function FinancialKPICards({ hudData, isDark, card, border, text, sub }) {
  if (!hudData) return null;

  const cards = [
    { label: "Monthly Savings",   value: fmtL(hudData.monthlySavings),   sub: `₹${hudData.unitRate}/unit slab`       },
    { label: "Year 1 Generation", value: `${fmt(hudData.annualKWh)} kWh`, sub: "Delhi NASA POWER data"                },
    { label: "PM Subsidy",        value: fmtL(hudData.subsidy),           sub: "PM Surya Ghar 2024"                   },
    { label: "Payback Period",    value: `${hudData.paybackYears} yrs`,   sub: "Net of subsidy"                       },
    { label: "Lifetime Savings",  value: fmtL(hudData.lifetimeSavings),   sub: "25 yr · 5% tariff escalation"        },
    { label: "CO₂ Offset",        value: `${hudData.co2OffsetTonnes} T`,  sub: "CEA 2023 · 0.708 kg/kWh"             },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((f) => (
        <div
          key={f.label}
          className="rounded-2xl p-4 flex flex-col gap-1 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: card,
            border: `1.5px solid ${border}`,
            boxShadow: isDark ? "0 2px 16px #00000030" : "0 2px 12px #0F4C3A06",
          }}
        >
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: sub }}>{f.label}</p>
          <p className="text-xl font-bold leading-tight" style={{ color: text }}>{f.value}</p>
          <p className="text-[9px]" style={{ color: sub }}>{f.sub}</p>
        </div>
      ))}
    </div>
  );
}