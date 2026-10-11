import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "motion/react";
import { useTheme } from "../../../context/ThemeContext";

const EASE = [0.22, 1, 0.36, 1];

// Dynamic color tokens — only for values that can't be expressed as Tailwind classes
function tk(d) {
  return {
    tx: d ? "#E2E8F0" : "#1A2E25",
    su: d ? "#3d6b56" : "#8aaa96",
    dv: d ? "#1a2e20" : "#ddeae2",
    br: d ? "rgba(255,255,255,0.06)" : "rgba(15,76,58,0.10)",
    bg: d ? "#09100e" : "#f7f9f7",
    oldBg: d ? "rgba(255,255,255,0.012)" : "rgba(15,76,58,0.018)",
    newBg: d ? "rgba(15,76,58,0.18)" : "rgba(14,116,144,0.055)",
  };
}
const ac = (d) => (d ? "#FACC15" : "#0E7490");

// ─── Data ────────────────────────────────────────────────────
const ROWS = [
  {
    num: "01",
    topic: "Roof measurement",
    old: {
      head: "Tape measure and guesswork.",
      sub: "Technician drives to site. Rough sketch on WhatsApp. Two days before you even know if it's viable.",
    },
    kins: {
      head: "Satellite map in 90 seconds.",
      sub: "Roof polygon traced automatically. Every obstacle flagged with its height. Usable area calculated before anyone leaves their desk.",
    },
  },
  {
    num: "02",
    topic: "Panel layout",
    old: {
      head: "Excel sheet, trial and error.",
      sub: "Manual placement. Often undersells — vendors place fewer panels than actually fit because they can't model shadow gaps.",
    },
    kins: {
      head: "AI places the maximum output.",
      sub: "Every orientation and offset tested automatically. Shadow gaps enforced. Obstacle buffers applied. Zero guesswork.",
    },
  },
  {
    num: "03",
    topic: "Customer confidence",
    old: {
      head: "A PDF they don't understand.",
      sub: 'Numbers on a page. No visual. No context. "Let me think about it" — and the lead goes cold.',
    },
    kins: {
      head: "Their house. Live. In 3D.",
      sub: "Customer sees their actual roof with panels placed. Drags them around. Watches savings update live. They confirm before you call.",
    },
  },
  {
    num: "04",
    topic: "Lead qualification",
    old: {
      head: "Call, visit, manually note.",
      sub: "Hours of back and forth before you know if the lead is worth pursuing. Most die in the pipeline.",
    },
    kins: {
      head: "Full profile before you say a word.",
      sub: "One WhatsApp link. Customer fills their address, load, and bill. Your dashboard gets a complete lead — no calls needed.",
    },
  },
  {
    num: "05",
    topic: "Closing the deal",
    old: {
      head: "Multiple visits. Weeks of friction.",
      sub: "Revised quotes, rescheduled calls, lost momentum. Most leads that should close don't.",
    },
    kins: {
      head: "Customer confirms. PDF auto-generates.",
      sub: "They approve the design online. You get notified, download the proposal, and call to book the install. Done.",
    },
  },
];

// ─── Rotating Sun ────────────────────────────────────────────
function SunIcon({ size = 36, isDark, glowing, rotation = 0 }) {
  const A = ac(isDark);
  const glowFill = isDark ? "rgba(250,204,21,0.1)" : "rgba(14,116,144,0.09)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className="block flex-shrink-0 overflow-visible"
    >
      {/* Pulsing glow — fixed, does not rotate */}
      <motion.circle
        cx="18"
        cy="18"
        r="15"
        fill={glowing ? glowFill : "none"}
        animate={
          glowing ? { r: [13, 16, 13], opacity: [0.6, 1, 0.6] } : { r: 13 }
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Rays — rotate with scroll */}
      <motion.g
        style={{ transformOrigin: "18px 18px" }}
        animate={{ rotate: rotation }}
        transition={{ duration: 0 }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={18 + Math.cos(rad) * 10.5}
              y1={18 + Math.sin(rad) * 10.5}
              x2={18 + Math.cos(rad) * 14.5}
              y2={18 + Math.sin(rad) * 14.5}
              stroke={A}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </motion.g>
      {/* Core — always on top */}
      <circle cx="18" cy="18" r="7" fill={A} />
    </svg>
  );
}

// ─── Panel texture (KINS side bg) ────────────────────────────
function PanelTexture({ isDark, active }) {
  const borderCol = isDark ? "rgba(250,204,21,0.07)" : "rgba(14,116,144,0.08)";
  const bgCol = isDark ? "rgba(250,204,21,0.03)" : "rgba(14,116,144,0.03)";
  return (
    <div className="absolute inset-0 overflow-hidden grid grid-cols-8 grid-rows-5 gap-1.5 p-4 pointer-events-none">
      {Array.from({ length: 40 }, (_, i) => (
        <motion.div
          key={i}
          className="rounded-sm"
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.6, delay: (i % 8) * 0.04, ease: EASE }}
          style={{ border: `1px solid ${borderCol}`, background: bgCol }}
        />
      ))}
    </div>
  );
}

// ─── Single comparison band ───────────────────────────────────
function Band({ row, isDark }) {
  const c = tk(isDark);
  const A = ac(isDark);
  const ref = useRef(null);
  const active = useInView(ref, { once: false, margin: "-18% 0px -18% 0px" });

  // ── MOBILE: two stacked cards ─────────────────────────────
  const MobileView = (
    <div className="flex flex-col gap-3 sm:hidden">
      {/* Topic + row number row */}
      <div className="flex items-center justify-between">
        <span
          className="font-[font3] text-[9px] font-bold tracking-[0.22em] uppercase"
          style={{ color: c.su }}
        >
          {row.topic}
        </span>
        <span
          className="font-[font5] text-[11px] select-none"
          style={{ color: c.dv, letterSpacing: "-0.02em" }}
        >
          {row.num}
        </span>
      </div>

      {/* Old way card */}
      <motion.div
        className="rounded-xl p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,76,58,0.04)",
          border: `1px solid ${c.dv}`,
        }}
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          {/* ✕ icon */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(15,76,58,0.08)",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <line
                x1="1.5"
                y1="1.5"
                x2="6.5"
                y2="6.5"
                stroke={c.su}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="6.5"
                y1="1.5"
                x2="1.5"
                y2="6.5"
                stroke={c.su}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            className="font-[font3] text-[9px] font-bold tracking-[0.2em] uppercase"
            style={{ color: c.su }}
          >
            Before
          </span>
        </div>
        <h3
          className="font-[font5] mb-2"
          style={{
            fontSize: 18,
            fontWeight: 300,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            color: c.su,
            margin: 0,
          }}
        >
          {row.old.head}
        </h3>
        <p
          className="font-[font3] leading-relaxed"
          style={{ fontSize: 13, color: c.su, margin: 0, opacity: 0.75 }}
        >
          {row.old.sub}
        </p>
      </motion.div>

      {/* Arrow between cards */}
      <div className="flex justify-center">
        <div
          className="flex flex-col items-center gap-0.5"
          style={{ color: A }}
        >
          <div className="w-px h-4" style={{ background: A, opacity: 0.4 }} />
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path
              d="M7 10 L1 2 L4.5 2 L4.5 0 L9.5 0 L9.5 2 L13 2 Z"
              fill={A}
              opacity="0.7"
            />
          </svg>
        </div>
      </div>

      {/* KINS way card */}
      <motion.div
        className="rounded-xl p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4, delay: 0.12, ease: EASE }}
        style={{
          background: isDark ? "rgba(15,76,58,0.2)" : "rgba(14,116,144,0.07)",
          border: `1px solid ${
            isDark ? "rgba(15,76,58,0.5)" : "rgba(14,116,144,0.2)"
          }`,
        }}
      >
        <PanelTexture isDark={isDark} active={active} />
        <div className="relative z-[1]">
          {/* Label */}
          <div className="flex items-center gap-2 mb-3">
            {/* ✓ icon */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: A }}
            >
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path
                  d="M1 3.5L3.5 6L8 1"
                  stroke={isDark ? "#1A2E25" : "#ffffff"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              className="font-[font3] text-[9px] font-bold tracking-[0.2em] uppercase"
              style={{ color: A }}
            >
              KINS way
            </span>
          </div>
          <h3
            className="font-[font5] mb-2"
            style={{
              fontSize: 18,
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              color: c.tx,
              margin: 0,
            }}
          >
            {row.kins.head}
          </h3>
          <p
            className="font-[font3] leading-relaxed"
            style={{
              fontSize: 13,
              color: isDark ? "#94a3b8" : "#374151",
              margin: 0,
            }}
          >
            {row.kins.sub}
          </p>
        </div>
      </motion.div>
    </div>
  );

  // ── DESKTOP/TABLET: side-by-side table row ─────────────────
  const TableView = (
    <div className="relative hidden sm:block">
      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-b origin-top z-10"
        animate={{ scaleY: active ? 1 : 0, opacity: active ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ background: A }}
      />

      <div className="grid grid-cols-[1fr_1px_1fr] lg:grid-cols-[clamp(52px,7vw,96px)_1fr_1px_1fr]">
        {/* Row number — desktop only */}
        <div
          className="hidden lg:flex items-center justify-center py-10"
          style={{ borderRight: `1px solid ${c.dv}` }}
        >
          <motion.span
            className="font-[font5] select-none"
            animate={{
              WebkitTextStroke: active
                ? `1px ${
                    isDark ? "rgba(250,204,21,0.22)" : "rgba(14,116,144,0.22)"
                  }`
                : `1px ${c.dv}`,
            }}
            transition={{ duration: 0.5 }}
            style={{
              fontSize: "clamp(72px,10vw,120px)",
              fontWeight: 300,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "transparent",
              userSelect: "none",
            }}
          >
            {row.num}
          </motion.span>
        </div>

        {/* Old way */}
        <motion.div
          className="relative px-8 py-9 lg:px-12 lg:py-12"
          animate={{ opacity: active ? 1 : 0.5 }}
          transition={{ duration: 0.5 }}
          style={{
            borderRight: `1px solid ${c.dv}`,
            background: active ? c.oldBg : "transparent",
            transition: "background 0.5s ease",
          }}
        >
          <p
            className="font-[font3] text-[9px] font-bold tracking-[0.2em] uppercase mb-4"
            style={{ color: c.su }}
          >
            {row.topic}
          </p>
          <motion.h3
            className="font-[font5] mb-4"
            initial={{ opacity: 0, y: 12 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
            style={{
              fontSize: "clamp(20px,2.2vw,28px)",
              fontWeight: 300,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              color: c.su,
              margin: 0,
            }}
          >
            {row.old.head}
          </motion.h3>
          <motion.p
            className="font-[font3] leading-relaxed"
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0.55 }}
            transition={{ duration: 0.45, delay: 0.14 }}
            style={{
              fontSize: "clamp(13.5px,1.3vw,15px)",
              color: c.su,
              margin: 0,
              maxWidth: 420,
            }}
          >
            {row.old.sub}
          </motion.p>
        </motion.div>

        {/* Divider */}
        <div style={{ background: c.dv }} />

        {/* KINS way */}
        <div className="relative overflow-hidden">
          <PanelTexture isDark={isDark} active={active} />
          <motion.div
            className="relative z-[1] h-full px-8 py-9 lg:px-12 lg:py-12"
            animate={{ background: active ? c.newBg : "transparent" }}
            transition={{ duration: 0.55 }}
          >
            <p
              className="font-[font3] text-[9px] font-bold tracking-[0.2em] uppercase mb-4"
              style={{ color: A }}
            >
              {row.topic}
            </p>
            <motion.h3
              className="font-[font5] mb-4"
              initial={{ opacity: 0, x: 14 }}
              animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 14 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
              style={{
                fontSize: "clamp(20px,2.2vw,28px)",
                fontWeight: 300,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
                color: c.tx,
                margin: 0,
              }}
            >
              {row.kins.head}
            </motion.h3>
            <motion.p
              className="font-[font3] leading-relaxed max-w-[420px]"
              initial={{ opacity: 0, x: 10 }}
              animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              style={{
                fontSize: "clamp(13.5px,1.3vw,15px)",
                color: isDark ? "#94a3b8" : "#374151",
                margin: 0,
              }}
            >
              {row.kins.sub}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className="relative"
      style={{ borderBottom: `1px solid ${c.dv}` }}
    >
      {/* Mobile: padding around the cards */}
      <div className="sm:hidden px-4 py-6">{MobileView}</div>
      {/* Tablet + Desktop: table row */}
      {TableView}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function OldVsNew() {
  const { isDark } = useTheme();
  const c = tk(isDark);
  const A = ac(isDark);

  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const [sunRot, setSunRot] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 55, damping: 22 });

  // Sun Y — travels from 0% to 100% of the bands container
  const sunY = useTransform(smooth, [0.06, 0.9], ["0%", "100%"]);

  // Sun rotation — 0° to 360° over the scroll range
  const sunRotation = useTransform(smooth, [0.06, 0.9], [0, 360]);
  useEffect(() => sunRotation.on("change", (v) => setSunRot(v)), [sunRotation]);

  return (
    <section
      ref={sectionRef}
      className={`relative w-full overflow-hidden font-[font3] transition-colors duration-500 ${
        isDark ? "bg-[#09100e]" : "bg-[#f7f9f7]"
      }`}
      style={{
        paddingTop: "clamp(80px,10vw,140px)",
        paddingBottom: "clamp(60px,8vw,120px)",
      }}
    >
      {/* Top rule */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px origin-left"
        style={{ background: c.dv }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${
            isDark ? "rgba(255,255,255,0.016)" : "rgba(15,76,58,0.038)"
          } 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, #0F4C3A18 0%, transparent 70%)",
            opacity: isDark ? 1 : 0.5,
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 lg:mb-24">
          <div>
            {/* Eyebrow */}
            <motion.div
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <div className="w-5 h-px" style={{ background: A }} />
              <span
                className="font-[font3] text-[10px] font-bold tracking-[0.28em] uppercase"
                style={{ color: A }}
              >
                The Shift
              </span>
            </motion.div>

            {/* Heading line 1 */}
            <motion.h2
              className="font-[font5] font-light leading-none tracking-[-0.04em] m-0 mb-2"
              style={{ fontSize: "clamp(36px,5.8vw,88px)", color: c.tx }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.04 }}
            >
              How solar used to sell.
            </motion.h2>

            {/* Heading line 2 */}
            <motion.h2
              className="font-[font5] font-light leading-none tracking-[-0.04em] m-0"
              style={{ fontSize: "clamp(36px,5.8vw,88px)", color: c.tx }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
            >
              How it sells now.
            </motion.h2>
          </div>

          {/* Right descriptor + col labels */}
          <motion.div
            className="flex flex-col gap-2 lg:items-end lg:text-right lg:pb-2"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.2 }}
          >
            <p
              className="font-[font3] text-sm leading-relaxed max-w-[300px]"
              style={{ color: c.su }}
            >
              Five things that slowed every solar sale down — and what replaced
              each one.
            </p>
            <div className="flex items-center gap-4 mt-1">
              <span
                className="font-[font3] text-[9px] font-bold tracking-[0.18em] uppercase"
                style={{ color: c.su }}
              >
                Old way
              </span>
              <span style={{ color: c.dv }}>·</span>
              <span
                className="font-[font3] text-[9px] font-bold tracking-[0.18em] uppercase"
                style={{ color: A }}
              >
                KINS way
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Column header row ── */}
        <div
          className="hidden sm:grid grid-cols-2 lg:grid-cols-[clamp(52px,7vw,96px)_1fr_1fr]"
          style={{ borderTop: `1px solid ${c.dv}` }}
        >
          {/* Num col spacer — desktop only */}
          <div
            className="hidden lg:block"
            style={{ borderRight: `1px solid ${c.dv}` }}
          />

          {/* Old way header — muted, no bg */}
          <div
            className="flex flex-col justify-center gap-2 py-5 px-5 sm:px-8 lg:px-12"
            style={{
              borderRight: `1px solid ${c.dv}`,
              borderBottom: `1px solid ${c.dv}`,
            }}
          >
            {/* Label pill */}
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full opacity-50"
                style={{ background: c.su }}
              />
              <span
                className="font-[font3] text-[9px] font-bold tracking-[0.22em] uppercase"
                style={{ color: c.su }}
              >
                Before
              </span>
            </div>
            {/* Big heading */}
            <div
              className="font-[font5] font-light leading-none tracking-[-0.03em]"
              style={{ fontSize: "clamp(26px,3.2vw,44px)", color: c.su }}
            >
              Old way
            </div>
          </div>

          {/* KINS way header — accent, tinted bg */}
          <div
            className="flex flex-col justify-center gap-2 py-5 px-5 sm:px-8 lg:px-12"
            style={{
              borderBottom: `1px solid ${c.dv}`,
              background: isDark
                ? "rgba(15,76,58,0.14)"
                : "rgba(14,116,144,0.045)",
            }}
          >
            {/* Label pill */}
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: A }}
              />
              <span
                className="font-[font3] text-[9px] font-bold tracking-[0.22em] uppercase"
                style={{ color: A }}
              >
                Now
              </span>
            </div>
            {/* Big heading */}
            <div
              className="font-[font5] font-light leading-none tracking-[-0.03em]"
              style={{ fontSize: "clamp(26px,3.2vw,44px)", color: A }}
            >
              KINS way
            </div>
          </div>
        </div>

        {/* ── Bands + Sun track ── */}
        <div className="relative">
          {/* Sun track — desktop only, sits on center divider */}
          <div
            className="hidden lg:block absolute top-0 bottom-0 z-10 pointer-events-none"
            style={{
              left: "calc(clamp(52px,7vw,96px) + (100% - clamp(52px,7vw,96px)) / 2)",
            }}
          >
            <motion.div
              className="absolute"
              style={{ top: sunY, transform: "translate(-50%, -50%)" }}
            >
              <SunIcon size={38} isDark={isDark} glowing rotation={sunRot} />
            </motion.div>
          </div>

          {/* All 5 bands */}
          <div ref={contentRef}>
            {ROWS.map((row, i) => (
              <Band key={row.num} row={row} index={i} isDark={isDark} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px origin-left"
        style={{ background: c.dv }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }}
      />
    </section>
  );
}
