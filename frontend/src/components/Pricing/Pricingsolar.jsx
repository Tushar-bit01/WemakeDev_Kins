// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PricingSolar.jsx  —  main entry
//  Imports: BillingToggle · PlanCard · pricingData
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { PLANS } from "./Pricingdata";
import BillingToggle from "./Billingtoggle";
import PlanCard from "./Plancard";

export default function PricingSolar() {
  const { isDark } = useTheme();
  const [billed, setBilled] = useState("monthly");

  const savingsPlan = PLANS.find(
    (p) => p.monthly && p.annually && p.monthly !== p.annually
  );
  const savingsPct = savingsPlan
    ? Math.round(((savingsPlan.monthly - savingsPlan.annually) / savingsPlan.monthly) * 100)
    : 20;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center py-24 px-4 overflow-hidden font-[font3] transition-colors duration-500"
      style={{
        background: isDark
          ? "#09100e"
          : "#f7f9f7",
      }}
    >
      {/* ── Noise texture overlay ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")"
            : "none",
          opacity: 1,
        }}
      />

      {/* ── Background glow ── */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 60% 40% at 50% 0%, #0F4C3A40 0%, transparent 70%), radial-gradient(ellipse 35% 25% at 85% 100%, #0E749018 0%, transparent 60%)"
            : "radial-gradient(ellipse 60% 40% at 50% 0%, #0F4C3A10 0%, transparent 70%), radial-gradient(ellipse 35% 25% at 85% 100%, #0E749008 0%, transparent 60%)",
        }}
      />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center mb-12 max-w-xl"
      >
        <div
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase px-4 py-1.5 rounded-full mb-6 transition-colors duration-300"
          style={{
            background: isDark ? "#ffffff08" : "#0F4C3A0c",
            color: isDark ? "#6ee7b7" : "#0F4C3A",
            border: `1px solid ${isDark ? "#ffffff12" : "#0F4C3A1a"}`,
          }}
        >
          <Star size={10} fill={isDark ? "#6ee7b7" : "#0F4C3A"} />
          Pricing
        </div>

        <h1
          className="text-[3.25rem] font-bold leading-[1.1] tracking-[-0.03em] mb-4 transition-colors duration-300"
          style={{ color: isDark ? "#f0faf4" : "#1A2E25" }}
        >
          One plan for
          <br />
          <span
            style={{
              background: isDark
                ? "linear-gradient(135deg, #6ee7b7 0%, #5eead4 100%)"
                : "linear-gradient(135deg, #0F4C3A 30%, #0E7490 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            every stage
          </span>
        </h1>

        <p
          className="text-base leading-relaxed transition-colors duration-300"
          style={{ color: isDark ? "#6b9e85" : "#5a7a69" }}
        >
          Transparent pricing with no surprises.
          <br />
          Upgrade or cancel whenever you need.
        </p>
      </motion.div>

      {/* ── Billing toggle ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 mb-14"
      >
        <BillingToggle billed={billed} onChange={setBilled} savingsPct={savingsPct} isDark={isDark} />
      </motion.div>

      {/* ── Cards grid ── */}
      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.key}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex"
          >
            <PlanCard plan={plan} billed={billed} isDark={isDark} />
          </motion.div>
        ))}
      </div>

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="relative z-10 mt-12 text-xs text-center transition-colors duration-300"
        style={{ color: isDark ? "#2d5a42" : "#9ab8a8" }}
      >
        14-day free trial on all plans · No credit card required · Cancel anytime
      </motion.p>
    </div>
  );
}