import { useTheme } from "../../../context/ThemeContext";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedinIn, faWhatsapp, faXTwitter } from "@fortawesome/free-brands-svg-icons";

const links = {
  engine: [
    { label: "3D Audit",           href: "#" },
    { label: "Shadow Analysis",    href: "#" },
    { label: "Subsidy Guard",      href: "#" },
    { label: "P50 Yield Model",    href: "#" },
  ],
  standards: [
    { label: "NASA PSH Data",       href: "https://power.larc.nasa.gov", external: true },
    { label: "CEA 2023 Report",     href: "#" },
    { label: "PM Surya Ghar",       href: "https://pmsuryaghar.gov.in", external: true },
    { label: "DERC 2024-25 Tariff", href: "#" },
  ],
  social: [
    { label: "LinkedIn",  href: "#", icon: faLinkedinIn },
    { label: "Twitter",   href: "#", icon: faXTwitter   },
    { label: "WhatsApp",  href: "#", icon: faWhatsapp   },
  ],
  demo: { label: "Request a Team Demo", href: "#" },
};

// ── Variants ──────────────────────────────────────────────────
const colStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const gridStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const slideUp = {
  hidden: { y: "100%", opacity: 0 },
  show:   { y: "0%",   opacity: 1, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y:  0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Footer() {
  const { isDark } = useTheme();

  const headRef   = useRef(null);
  const gridRef   = useRef(null);
  const bottomRef = useRef(null);

  const headInView   = useInView(headRef,   { once: true, margin: "-60px" });
  const gridInView   = useInView(gridRef,   { once: true, margin: "-60px" });
  const bottomInView = useInView(bottomRef, { once: true, margin: "-40px" });

  const text    = isDark ? "#E2E8F0" : "#1A2E25";
  const sub     = isDark ? "#3d6b56" : "#8aaa96";
  const divider = isDark ? "#1a2e20" : "#ddeae2";
  const bg      = isDark ? "#09100e" : "#f7f9f7";

  return (
    <footer
      className="w-full font-[font3] transition-colors duration-500"
      style={{ background: bg, color: text }}
    >
      {/* ── Animated top rule — draws left to right ── */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: "1px", background: divider, transformOrigin: "left" }}
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">

        {/* ══════════════════════════════
            MASSIVE HEADING
        ══════════════════════════════ */}
        <div ref={headRef} className="py-12 md:py-16 lg:py-20 overflow-hidden">
          <motion.h1
            initial={{ y: "105%", opacity: 0 }}
            animate={headInView ? { y: "0%", opacity: 1 } : {}}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="leading-none select-none text-center lg:text-left"
            style={{
              fontSize: "clamp(64px, 8vw, 140px)",
              fontWeight: 200,
              color: text,
              letterSpacing: "-0.04em",
            }}
          >
            Kins
          </motion.h1>
        </div>

        {/* ══════════════════════════════
            4-COLUMN GRID
        ══════════════════════════════ */}
        <motion.div
          ref={gridRef}
          initial="hidden"
          animate={gridInView ? "show" : "hidden"}
          variants={gridStagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 text-center sm:text-left"
        >

          {/* Col 1 — Mission */}
          <motion.div variants={fadeUp} className="lg:col-span-1">
            <p className="text-sm leading-relaxed mx-auto lg:mx-0" style={{ color: text, maxWidth: 260 }}>
              Kins uses AI-driven 3D roof analysis to deliver precise solar
              placement audits.
            </p>
            <p className="text-sm leading-relaxed mt-3 mx-auto lg:mx-0" style={{ color: sub, maxWidth: 260 }}>
              Every shadow, every subsidy, every rupee  calculated before a
              single panel is installed.
            </p>
          </motion.div>

          {/* Col 2 — Core Engine */}
          <motion.div variants={fadeUp}>
            <AnimatedFooterCol
              heading="Core Engine"
              links={links.engine}
              sub={sub} text={text} divider={divider}
            />
          </motion.div>

          {/* Col 3 — Standards */}
          <motion.div variants={fadeUp}>
            <AnimatedFooterCol
              heading="Standards"
              links={links.standards}
              sub={sub} text={text} divider={divider}
            />
          </motion.div>

          {/* Col 4 — Connect */}
          <motion.div variants={fadeUp}>
            <p
              className="text-[10px] font-bold tracking-[0.22em] uppercase mb-5 text-center sm:text-left"
              style={{ color: sub }}
            >
              Connect
            </p>

            {/* ── Request Demo CTA pill ── */}
            <motion.a
              href={links.demo.href}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-[12px] font-semibold mx-auto sm:mx-0"
              style={{ background: "#FACC15", color: "#0F4C3A", textDecoration: "none", letterSpacing: "0.02em" }}
              whileHover={{ backgroundColor: "#D97706", color: "#ffffff" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {links.demo.label} <span>→</span>
            </motion.a>

            <motion.ul
              variants={colStagger}
              initial="hidden"
              animate={gridInView ? "show" : "hidden"}
              className="space-y-3 flex flex-col items-center sm:items-start"
            >
              {links.social.map((l) => (
                <motion.li key={l.label} variants={fadeUp}>
                  <a
                    href={l.href}
                    className="group inline-flex items-center gap-3 transition-opacity duration-200 mx-auto sm:mx-0"
                    style={{ color: text, textDecoration: "none" }}
                  >
                    <motion.span
                      className="flex items-center justify-center size-7 rounded-full"
                      style={{ border: `1px solid ${divider}`, color: sub }}
                      whileHover={{ scale: 1.15, borderColor: text }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <FontAwesomeIcon icon={l.icon} style={{ fontSize: 12 }} />
                    </motion.span>
                    <span
                      className="text-sm transition-opacity duration-200 group-hover:opacity-50"
                      style={{ color: text }}
                    >
                      {l.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </motion.div>

        {/* ══════════════════════════════
            BOTTOM BAR
        ══════════════════════════════ */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: "1px", background: divider, transformOrigin: "left" }}
        />

        <motion.div
          ref={bottomRef}
          initial="hidden"
          animate={bottomInView ? "show" : "hidden"}
          variants={colStagger}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6"
        >
          {/* Left — copyright + legal links */}
          <motion.div variants={fadeIn} className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <p className="text-[11px]" style={{ color: sub }}>
              © {new Date().getFullYear()} Kins. All rights reserved.
            </p>
            <span style={{ color: divider }}>·</span>
            <a href="#" className="text-[11px] transition-opacity duration-200 hover:opacity-100" style={{ color: sub, opacity: 0.6, textDecoration: "none" }}>Privacy Policy</a>
            <span style={{ color: divider }}>·</span>
            <a href="#" className="text-[11px] transition-opacity duration-200 hover:opacity-100" style={{ color: sub, opacity: 0.6, textDecoration: "none" }}>Terms of Service</a>
          </motion.div>

          {/* Right — disclaimer */}
          <motion.p
            variants={fadeIn}
            className="text-[10px] leading-relaxed text-center sm:text-right max-w-sm"
            style={{ color: sub, opacity: 0.6 }}
          >
            Simulation Disclaimer: All yield, savings, and financial figures are
            estimates based on NASA POWER data, MNRE benchmarks, and DERC
            2024-25 tariffs. Actual results may vary. Not financial advice.
          </motion.p>
        </motion.div>

      </div>
    </footer>
  );
}

// ── Animated column — heading draws in, links stagger up ─────
function AnimatedFooterCol({ heading, links, sub, text, divider }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref}>
      <div className="overflow-hidden mb-5">
        <motion.p
          initial={{ y: "100%" }}
          animate={inView ? { y: "0%" } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-[10px] font-bold tracking-[0.22em] uppercase text-center sm:text-left"
          style={{ color: sub }}
        >
          {heading}
        </motion.p>
      </div>

      <motion.ul
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={colStagger}
        className="space-y-3"
      >
        {links.map((l) => (
          <motion.li key={l.label} variants={slideUp} style={{ overflow: "hidden" }}>
            <a
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              className="text-sm transition-opacity duration-200 hover:opacity-50 inline-block mx-auto sm:mx-0"
              style={{ color: text, textDecoration: "none" }}
            >
              {l.label}
              {l.external && (
                <span className="ml-1 text-[10px]" style={{ color: sub }}>↗</span>
              )}
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}