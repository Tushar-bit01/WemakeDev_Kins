import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

// ── Price animation — simple fade only, no layout shift ──────
const priceAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0, transition: { duration: 0.1 } },
};

function PlanCard({ plan, billed, isDark }) {
  const { title, tagline, monthly, annually, cta, isBestValue, features, extras } = plan;

  const price      = billed === "monthly" ? monthly : annually;
  const isCustom   = price === null;
  const annualTotal = !isCustom && price !== null ? price * 12 : null;

  // ── Memoize entire color token object so it's not rebuilt every render ──
  const T = useMemo(() => ({
    cardBg: isBestValue
      ? isDark ? "#0d3d2a" : "#0F4C3A"
      : isDark ? "#0f1a14"  : "#ffffff",

    cardBorder: isBestValue
      ? isDark ? "#1a5c3a" : "#0a3828"
      : isDark ? "#1a2e20" : "#ddeae2",

    cardShadow: isBestValue
      ? isDark
        ? "0 32px 80px #000000a0, 0 8px 32px #0F4C3A50, inset 0 1px 0 #2a7a4a20"
        : "0 24px 64px #0F4C3A45, 0 4px 24px #0F4C3A28"
      : isDark
        ? "0 4px 24px #00000060, inset 0 1px 0 #ffffff06"
        : "0 2px 20px #0F4C3A08, 0 1px 4px #0F4C3A06",

    ribbon:      { bg: "#FACC15", text: "#1A2E25" },
    title:       isBestValue ? "#f0faf5"  : isDark ? "#e8f5ee"  : "#1A2E25",
    tagline:     isBestValue ? "#5a9e74"  : isDark ? "#2d5a42"  : "#8aaa96",
    priceSym:    isBestValue ? "#5a9e74"  : isDark ? "#2d5a42"  : "#8aaa96",
    priceNum:    isBestValue ? "#ffffff"  : isDark ? "#e8f5ee"  : "#1A2E25",
    priceSub:    isBestValue ? "#5a9e74"  : isDark ? "#2d5a42"  : "#9ab8a8",
    ctaBg:       isBestValue ? "#FACC15"  : isDark ? "#162a1e"  : "#0F4C3A",
    ctaText:     isBestValue ? "#1A2E25"  : isDark ? "#6ee7b7"  : "#ffffff",
    ctaBorder:   isBestValue ? "none"     : isDark ? "1px solid #1e3d28" : "none",
    ctaShadow:   isBestValue ? "0 6px 24px #FACC1540" : isDark ? "none" : "0 4px 16px #0F4C3A28",
    divider:     isBestValue ? "#ffffff12": isDark ? "#1a2e20"  : "#e5efe8",
    label:       isBestValue ? "#5a9e74"  : isDark ? "#1e3d28"  : "#9ab8a8",
    checkBg:     isBestValue ? "#ffffff14": isDark ? "#0F4C3A20" : "#0F4C3A0e",
    checkIcon:   isBestValue ? "#FACC15"  : isDark ? "#6ee7b7"  : "#0F4C3A",
    featureText: isBestValue ? "#c8e8d4"  : isDark ? "#7aaa8e"  : "#3a5a4a",
    extrasDivider: isBestValue ? "#ffffff0a": isDark ? "#141f18" : "#edf4ef",
    extrasDot:   "#0E7490",
    extrasText:  isBestValue ? "#5a9e74"  : isDark ? "#1e3d28"  : "#8aaa96",
  }), [isBestValue, isDark]); // only recompute when theme or card type changes

  return (
    // ── Use CSS transform via style, not Tailwind hover class ──
    // This avoids layout recalc; will-change hints the GPU upfront
    <div
      className="relative flex flex-col w-full rounded-[1.6rem] overflow-hidden transition-transform duration-300 hover:-translate-y-2"
      style={{
        background: T.cardBg,
        border: `1.5px solid ${T.cardBorder}`,
        boxShadow: T.cardShadow,
        willChange: "transform",
      }}
    >
      {/* ── Popular ribbon ── */}
      {isBestValue && (
        <div
          className="text-center text-[10px] font-black tracking-[0.2em] uppercase py-2"
          style={{ background: T.ribbon.bg, color: T.ribbon.text }}
        >
          ✦ &nbsp;Most Popular&nbsp; ✦
        </div>
      )}

      <div className="flex flex-col flex-1 p-7">

        {/* Title */}
        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight mb-0.5" style={{ color: T.title }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: T.tagline }}>{tagline}</p>
        </div>

        {/* Price — AnimatePresence only on the number, not the whole block ── */}
        <div className="mb-7 min-h-[64px] flex flex-col justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${plan.key}-${billed}`}
              {...priceAnim}
            >
              {isCustom ? (
                <span className="text-3xl font-bold tracking-tight" style={{ color: T.priceNum }}>
                  Let's talk
                </span>
              ) : (
                <div className="flex items-end gap-0.5">
                  <span className="text-base font-semibold mb-1" style={{ color: T.priceSym }}>₹</span>
                  <span className="text-5xl font-bold leading-none tracking-tight" style={{ color: T.priceNum }}>
                    {price}
                  </span>
                  <span className="text-sm mb-1 ml-1" style={{ color: T.priceSym }}>/ mo</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {!isCustom && billed === "annually" && annualTotal !== null && (
            <p className="text-xs mt-1" style={{ color: T.priceSub }}>₹{annualTotal} billed annually</p>
          )}
          {!isCustom && billed === "monthly" && (
            <p className="text-xs mt-1" style={{ color: T.priceSub }}>billed monthly</p>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          className="w-full py-3 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.025] hover:brightness-110 active:scale-[0.975] mb-8"
          style={{ background: T.ctaBg, color: T.ctaText, border: T.ctaBorder, boxShadow: T.ctaShadow }}
        >
          {cta}
        </button>

        {/* Divider */}
        <div className="h-px mb-6" style={{ background: T.divider }} />

        {/* Features label */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: T.label }}>
          Included
        </p>

        {/* Features */}
        <ul className="space-y-3 mb-6 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span
                className="flex-shrink-0 mt-0.5 size-[18px] rounded-full flex items-center justify-center"
                style={{ background: T.checkBg }}
              >
                <Check size={10} strokeWidth={3.5} style={{ color: T.checkIcon }} />
              </span>
              <span className="text-sm leading-snug" style={{ color: T.featureText }}>{f}</span>
            </li>
          ))}
        </ul>

        {/* Extras */}
        {extras && extras.length > 0 && (
          <>
            <div className="h-px mb-4" style={{ background: T.extrasDivider }} />
            <ul className="space-y-2">
              {extras.map((e) => (
                <li key={e} className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: T.extrasDot }} />
                  <span className="text-xs" style={{ color: T.extrasText }}>{e}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// memo as the default export so every consumer benefits automatically
export default memo(PlanCard);