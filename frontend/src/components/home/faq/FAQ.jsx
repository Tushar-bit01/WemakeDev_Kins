import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { useTheme } from "../../../context/ThemeContext";

const EASE = [0.22, 1, 0.36, 1];

const FAQS = [
  {
    id: "01",
    q: "How does Kins replace a physical site survey?",
    a: "Kins understands the rooftop layout, usable space, and obstacles digitally and builds a precise 3D view, so you know everything before visiting the site.",
  },
  {
    id: "02",
    q: "How accurate is the analysis? Can I rely on it?",
    a: "Yes, it is built using real Indian rooftop data, so the insights are reliable enough for both customers and vendors to make confident decisions.",
  },
  {
    id: "03",
    q: "What does the customer actually see?",
    a: "Customers get a complete picture of their rooftop, solar placement, expected savings, subsidy details, payback time, and long term returns within seconds.",
  },
  {
    id: "04",
    q: "How does this help vendors increase conversions?",
    a: "Vendors only deal with customers who already understand the value and are ready to move forward, which means less time wasted and more deals closed.",
  },
  
  {
    id: "05",
    q: "Do I still need to visit the site later?",
    a: "Yes, but only when it actually matters. Early stage visits are avoided, and every visit is more productive.",
  },
  {
    id: "06",
    q: "Do customers need to install anything?",
    a: "No. Everything runs in the browser, customers just open a link shared by the vendor and start..",
  },
  {
    id: "07",
    q: "Is my data secure?",
    a: "Yes. All rooftop and customer data is securely processed and stored, with strict access control for vendors.",
  },
];

export default function FAQ() {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(null);
  const [hovered, setHovered] = useState(null);

  const answerRefs = useRef([]);
  const arrowRefs = useRef([]);
  const ghostRefs = useRef([]); // big number ghost per row
  const openRef = useRef(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Ghost number: animate in on hover/open, out on leave/close
  const showGhost = useCallback((idx) => {
    const g = ghostRefs.current[idx];
    if (!g) return;
    gsap.to(g, {
      opacity: 1,
      x: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  }, []);

  const hideGhost = useCallback((idx) => {
    const g = ghostRefs.current[idx];
    if (!g) return;
    gsap.to(g, {
      opacity: 0,
      x: -12,
      duration: 0.3,
      ease: "power2.in",
      overwrite: true,
    });
  }, []);

  const toggleItem = useCallback(
    (idx) => {
      const cur = openRef.current;
      const isOpening = cur !== idx;

      // Close current
      if (cur !== null) {
        gsap.to(answerRefs.current[cur], {
          height: 0,
          opacity: 0,
          duration: 0.36,
          ease: "power2.inOut",
          overwrite: true,
        });
        gsap.to(arrowRefs.current[cur], {
          rotation: 0,
          duration: 0.3,
          overwrite: true,
        });
        if (cur !== idx) hideGhost(cur);
      }

      if (isOpening) {
        const ans = answerRefs.current[idx];
        if (ans) {
          gsap.set(ans, { height: "auto", opacity: 1 });
          const h = ans.scrollHeight;
          gsap.fromTo(
            ans,
            { height: 0, opacity: 0 },
            {
              height: h,
              opacity: 1,
              duration: 0.44,
              ease: "power3.out",
              overwrite: true,
            }
          );
        }
        gsap.to(arrowRefs.current[idx], {
          rotation: 45,
          duration: 0.3,
          overwrite: true,
        });
        showGhost(idx);
        setOpen(idx);
      } else {
        hideGhost(idx);
        setOpen(null);
      }
    },
    [showGhost, hideGhost]
  );

  const onEnter = useCallback(
    (idx) => {
      setHovered(idx);
      if (openRef.current !== idx) showGhost(idx);
    },
    [showGhost]
  );

  const onLeave = useCallback(
    (idx) => {
      setHovered(null);
      if (openRef.current !== idx) hideGhost(idx);
    },
    [hideGhost]
  );

  const borderC = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,76,58,0.1)";

  return (
    <section
      className={`relative w-full font-[font3] transition-colors duration-300 overflow-hidden ${
        isDark ? "bg-[#080E0A]" : "bg-[#F8FAF8]"
      }`}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${
            isDark ? "rgba(255,255,255,0.02)" : "rgba(15,76,58,0.045)"
          } 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 md:px-12 lg:px-16 py-24">
        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-20">
          {/* Left: label + heading */}
          <div>
            {/* Eyebrow */}
            <motion.div
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "60px" }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="w-5 h-px bg-[#FACC15]" />
              <span
                className={`font-[font3] text-[10px] font-bold tracking-[0.28em] uppercase ${
                  isDark ? "text-[#5A8A6E]" : "text-[#4A6B58]"
                }`}
              >
                FAQ
              </span>
            </motion.div>

            {/* Line 1 — mask reveal */}
            <motion.h2
              className={`font-[font5] font-light leading-[1.1] tracking-[-0.04em] m-0 ${
                isDark ? "text-[#E2E8F0]" : "text-[#1A2E25]"
              }`}
              style={{ fontSize: "clamp(36px,5.8vw,88px)" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.05 }}
            >
              Frequently asked
              <br />
              questions
            </motion.h2>

            {/* Line 2 — ghost outline, slightly delayed */}
            {/* <div style={{ overflow: "hidden", paddingBottom: "0.18em", marginBottom: "-0.18em" }}>
              <motion.div
                className="font-[font5] font-light leading-[1.0] tracking-[-0.04em]"
                style={{
                  fontSize: "clamp(48px, 6vw, 80px)",
                  color: "transparent",
                  WebkitTextStroke: `1.5px ${isDark ? "#2d5a3d" : "#b8d4c4"}`,
                }}
                initial={{ y: 80 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, ease: EASE, delay: 0.13 }}
              >
                questions.
              </motion.div>
            </div> */}
          </div>

          {/* Right: descriptor — fades in */}
          <motion.p
            className={`font-[font3] text-sm leading-relaxed sm:text-right sm:max-w-[200px] sm:pb-1 ${
              isDark ? "text-[#3d6b56]" : "text-[#8aaa96]"
            }`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "60px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          >
            Everything you need before going live with your first customer.
          </motion.p>
        </div>

        {/* ── ROWS ───────────────────────────────────────── */}
        <div>
          {FAQS.map((faq, idx) => {
            const isOpen = open === idx;
            const isHov = hovered === idx;
            const active = isOpen || isHov;

            return (
              /* Outer mask — clips the row sliding up */
              <div key={faq.id} style={{ overflow: "hidden" }}>
                <motion.div
                  data-faq-row
                  className="relative overflow-hidden"
                  style={{ borderTop: `1px solid ${borderC}` }}
                  initial={{ y: 48, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "40px" }}
                  transition={{ duration: 0.6, ease: EASE, delay: idx * 0.06 }}
                >
                  {/* Ghost number — GSAP controlled, starts hidden */}
                  <div
                    ref={(el) => {
                      ghostRefs.current[idx] = el;
                    }}
                    className={`absolute right-16 top-1/2 -translate-y-1/2 font-[font5] font-light leading-none tracking-[-0.06em] pointer-events-none select-none`}
                    style={{
                      fontSize: "clamp(80px, 10vw, 130px)",
                      color: "transparent",
                      WebkitTextStroke: `1px ${
                        isDark ? "#FACC1522" : "#0F4C3A14"
                      }`,
                      opacity: 0,
                      transform: "translateX(-12px) translateY(-50%)",
                    }}
                  >
                    {faq.id}
                  </div>

                  <button
                    onClick={() => toggleItem(idx)}
                    onMouseEnter={() => onEnter(idx)}
                    onMouseLeave={() => onLeave(idx)}
                    className="relative w-full bg-transparent border-none cursor-pointer py-8 flex items-center gap-6 text-left group"
                  >
                    {/* Number */}
                    <span
                      className={`font-[font3] text-[11px] font-bold tracking-[0.08em] w-8 flex-shrink-0 transition-colors duration-300 ${
                        active
                          ? "text-[#FACC15]"
                          : isDark
                          ? "text-[#5A8A6E]"
                          : "text-[#4A6B58]"
                      }`}
                    >
                      {faq.id}
                    </span>

                    {/* Question */}
                    <span
                      className={`font-[font3] flex-1 font-medium leading-[1.3] transition-colors duration-300 ${
                        active
                          ? isDark
                            ? "text-[#E2E8F0]"
                            : "text-[#0F4C3A]"
                          : isDark
                          ? "text-[#6b9e85]"
                          : "text-[#4A6B58]"
                      }`}
                      style={{ fontSize: "clamp(15px, 1.6vw, 19px)" }}
                    >
                      {faq.q}
                    </span>

                    {/* Arrow — morphs on open */}
                    <div
                      ref={(el) => {
                        arrowRefs.current[idx] = el;
                      }}
                      className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center will-change-transform transition-all duration-300 ${
                        isOpen
                          ? "bg-[#FACC15]"
                          : `border ${
                              isDark ? "border-white/10" : "border-[#0F4C3A]/15"
                            } bg-transparent`
                      }`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={
                          isOpen ? "#1A2E25" : isDark ? "#5A8A6E" : "#4A6B58"
                        }
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                  </button>

                  {/* Answer */}
                  <div
                    ref={(el) => {
                      answerRefs.current[idx] = el;
                    }}
                    className="overflow-hidden will-change-[height,opacity]"
                    style={{ height: 0, opacity: 0 }}
                  >
                    <div className="pb-8 pl-14 pr-16">
                      <p
                        className={`font-[font3] text-[15px] leading-[1.82] max-w-2xl m-0 ${
                          isDark ? "text-[#5A8A6E]" : "text-[#4A6B58]"
                        }`}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}

          {/* Bottom border */}
          <div style={{ borderTop: `1px solid ${borderC}` }} />
        </div>
      </div>
    </section>
  );
}
