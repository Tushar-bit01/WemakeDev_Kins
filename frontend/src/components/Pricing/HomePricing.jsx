// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HomePricing.jsx  —  homepage pricing teaser
//  Path: src/components/home/pricing/HomePricing.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { PLANS } from "./Pricingdata";
import BillingToggle from "./Billingtoggle";
import PlanCard from "./Plancard";

const EASE = [0.22, 1, 0.36, 1];

export default function HomePricing() {
  const { isDark } = useTheme();
  const [billed, setBilled] = useState("monthly");

  const savingsPct = useMemo(() => {
    const plan = PLANS.find(
      (p) => p.monthly && p.annually && p.monthly !== p.annually
    );
    return plan
      ? Math.round(((plan.monthly - plan.annually) / plan.monthly) * 100)
      : 20;
  }, []);

  const text = isDark ? "#E2E8F0" : "#1A2E25";
  const sub = isDark ? "#3d6b56" : "#8aaa96";
  const bg = isDark ? "#09100e" : "#f7f9f7";
  const divider = isDark ? "#1a2e20" : "#ddeae2";

  const ghostColor = isDark ? "#2d5a3d" : "#b8d4c4";

  return (
    <section
      className="home-pricing relative w-full overflow-hidden font-[font3] transition-colors duration-500 py-24"
      style={{ background: bg }}
    >
      {/* Top rule */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px origin-left"
        style={{ background: divider }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }}
      />

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 0%, #0F4C3A35 0%, transparent 70%)",
            opacity: isDark ? 1 : 0,
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 0%, #0F4C3A08 0%, transparent 70%)",
            opacity: isDark ? 0 : 1,
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">
        {/* ── Row 1: eyebrow left, toggle right ── */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "60px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#FACC15]" />
            <p className="font-[font3] text-[10px] font-bold tracking-[0.3em] uppercase text-[#FACC15]">
              Pricing
            </p>
          </div>
          <BillingToggle
            billed={billed}
            onChange={setBilled}
            savingsPct={savingsPct}
            isDark={isDark}
          />
        </motion.div>

        {/* ── Row 2: heading + sub copy ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "60px" }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.06 }}
          >
            {/* Line 1 */}
            <motion.h2
              className="font-[font5] m-0 mb-2"
              style={{
                fontSize: "clamp(36px,6.2vw,96px)",
                fontWeight: 300,
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                color: text,
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.05 }}
            >
              Simple,{" "}
              
                Transparent
              
            </motion.h2>

            {/* Line 2 */}
            <motion.h2
              className="font-[font5] m-0"
              style={{
                fontSize: "clamp(36px,6.2vw,96px)",
                fontWeight: 300,
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                color: text,
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.12 }}
            >
              Pricing.
            </motion.h2>
          </motion.div>

          <motion.p
            className="font-[font3] text-sm leading-relaxed lg:text-right lg:max-w-[220px] lg:pb-2"
            style={{ color: sub }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "60px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
          >
            No hidden fees. No setup costs.
            <br />
            Upgrade or cancel anytime.
          </motion.p>
        </div>

        {/* ── Cards ── */}
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.key}
              className="flex"
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "40px" }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.09 }}
            >
              <PlanCard plan={plan} billed={billed} isDark={isDark} />
            </motion.div>
          ))}
        </div>

        {/* ── Bottom row ── */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <p className="font-[font3] text-xs" style={{ color: sub }}>
            14-day paid trial on all plans · No credit card required · Cancel
            anytime
          </p>
          <Link
            to="/pricing"
            className="font-[font3] inline-flex items-center gap-2 text-xs font-semibold hover:opacity-60 transition-opacity duration-200"
            style={{ color: text, textDecoration: "none" }}
          >
            See full pricing details
            <span style={{ color: "#FACC15" }}>→</span>
          </Link>
        </motion.div>
      </div>

      {/* Bottom rule */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px origin-left"
        style={{ background: divider }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }}
      />
    </section>
  );
}
