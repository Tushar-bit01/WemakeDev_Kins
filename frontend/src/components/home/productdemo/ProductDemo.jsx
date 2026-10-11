import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "motion/react";
import lottie from "lottie-web";
import duckJson from "./duck.json";
import { useTheme } from "../../../context/ThemeContext";

gsap.registerPlugin(ScrollTrigger);

const EASE = [0.22, 1, 0.36, 1];
const BP_SM = 640;
const BP_LG = 1024;
const productvideo = "https://res.cloudinary.com/dl8rikigy/video/upload/v1775912259/Screen_Recording_2026-04-11_at_1.18.27_PM_yfwqrj.mov";

function tk(d) {
  return {
    tx: d ? "#E2E8F0" : "#1A2E25",
    su: d ? "#3d6b56" : "#8aaa96",
    dv: d ? "#1a2e20" : "#ddeae2",
    bg: d ? "#09100e" : "#f7f9f7",
  };
}
const ac = (d) => (d ? "#FACC15" : "#0E7490");

function getLayout() {
  const vw = window.innerWidth;
  if (vw < BP_SM)
    return {
      imgW: vw * 0.92,
      minW: vw * 0.5,
      duckSize: 48,
      imgRight: 12,
      gap: -10,
    };
  if (vw < BP_LG)
    return { imgW: vw * 0.78, minW: 260, duckSize: 64, imgRight: 20, gap: -14 };
  return { imgW: vw * 0.72, minW: 320, duckSize: 160, imgRight: 28, gap: -22 };
}

const STEPS = [
  { time: 8, label: "Invite link" },
  { time: 20, label: "optimized 3d panels" },
  { time: 35, label: "panels Editing" },
  { time: 50, label: "Finalize data" },
  { time: 55, label: "pdf quote" },
];

function VideoPlayer({ isDark, onProgress }) {
  const A = ac(isDark);
  const videoRef = useRef(null);
  const contRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const p = v.duration ? v.currentTime / v.duration : 0;
      setProgress(p);
      onProgress?.(v.currentTime, v.duration || 0);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [onProgress]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? (v.play(), setPlaying(true)) : (v.pause(), setPlaying(false));
  };

  const seek = (e) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const v = videoRef.current;
    if (v?.duration)
      v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
  };

  const fullscreen = (e) => {
    e.stopPropagation();
    const el = contRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div
      ref={contRef}
      className="relative w-full h-full cursor-pointer"
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        src={productvideo}
      />

      {/* Bottom gradient */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 42%)",
          opacity: hovered || !playing ? 1 : 0,
        }}
      />

      {/* Centre play/pause */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ opacity: !playing || hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 60,
            height: 60,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
            border: "1.5px solid rgba(255,255,255,0.2)",
          }}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="2" width="4" height="14" rx="1.5" fill="white" />
              <rect x="11" y="2" width="4" height="14" rx="1.5" fill="white" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 3.5L15 9L5 14.5V3.5Z" fill="white" />
            </svg>
          )}
        </div>
      </motion.div>

      {/* Controls bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none"
        animate={{ opacity: hovered || !playing ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Seek bar */}
        <div
          className="relative h-[3px] rounded-full mb-3 cursor-pointer pointer-events-auto"
          style={{ background: "rgba(255,255,255,0.18)" }}
          onClick={seek}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progress * 100}%`, background: A }}
          />
          <div
            className="absolute top-1/2 w-3 h-3 rounded-full"
            style={{
              left: `${progress * 100}%`,
              transform: "translate(-50%,-50%)",
              background: A,
            }}
          />
        </div>

        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <button
              className="text-white/75 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
            >
              {playing ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect
                    x="1"
                    y="1"
                    width="3.5"
                    height="11"
                    rx="1"
                    fill="currentColor"
                  />
                  <rect
                    x="8.5"
                    y="1"
                    width="3.5"
                    height="11"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 1.5L12 6.5L2 11.5V1.5Z" fill="currentColor" />
                </svg>
              )}
            </button>
            <button
              className="text-white/75 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const v = videoRef.current;
                if (v) {
                  v.muted = !v.muted;
                  setMuted(v.muted);
                }
              }}
            >
              {muted ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M2 5h2l3.5-3v9L4 8H2V5z"
                    fill="currentColor"
                    opacity=".35"
                  />
                  <line
                    x1="9.5"
                    y1="4"
                    x2="13"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <line
                    x1="13"
                    y1="4"
                    x2="9.5"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 5h2l3.5-3v9L4 8H2V5z" fill="currentColor" />
                  <path
                    d="M9.5 4.5c1 1 1 3 0 4M11.5 3c2 2 2 5 0 7"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
          <button
            className="text-white/75 hover:text-white transition-colors pointer-events-auto"
            onClick={fullscreen}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M1 4.5V1.5H4M9 1.5H12V4.5M12 8.5V11.5H9M4 11.5H1V8.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Vertical progress bar ─────────────────────────────────────
function ProgressBar({ isDark, currentTime, duration }) {
  const c = tk(isDark);
  const A = ac(isDark);

  const doneCount = STEPS.filter((s) => currentTime >= s.time).length;
  const segProgress = (() => {
    if (doneCount === STEPS.length) return 1;
    const prev = doneCount === 0 ? 0 : STEPS[doneCount - 1].time;
    const next = STEPS[doneCount].time;
    return Math.max(0, Math.min(1, (currentTime - prev) / (next - prev)));
  })();

  return (
    <div
      className="flex flex-col items-center gap-0"
      style={{ height: "100%" }}
    >
      {STEPS.map((step, i) => {
        const done = currentTime >= step.time;
        const active = !done && doneCount === i;

        return (
          <React.Fragment key={step.label}>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div
                className="relative flex items-center justify-center flex-shrink-0"
                style={{ width: 22, height: 22 }}
              >
                <div
                  className="absolute inset-0 rounded-full transition-all duration-500"
                  style={{
                    border: `1.5px solid ${done || active ? A : c.dv}`,
                    background: done
                      ? A
                      : active
                      ? isDark
                        ? "rgba(250,204,21,0.1)"
                        : "rgba(14,116,144,0.08)"
                      : "transparent",
                  }}
                />
                <AnimatePresence>
                  {done && (
                    <motion.svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      className="relative z-10"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <path
                        d="M1 4L3.8 7L9 1"
                        stroke={isDark ? "#09100e" : "#ffffff"}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  )}
                  {active && !done && (
                    <motion.div
                      className="relative z-10 rounded-full"
                      style={{ width: 6, height: 6, background: A }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <motion.span
                className="hidden lg:block font-[font3] whitespace-nowrap"
                style={{
                  fontSize: 11,
                  color: done || active ? c.tx : c.su,
                  transition: "color 0.4s",
                  fontWeight: done ? 600 : 400,
                }}
              >
                {step.label}
              </motion.span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className="relative flex-1 flex-shrink-0"
                style={{ width: 22, minHeight: 20 }}
              >
                <div
                  className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px"
                  style={{ background: c.dv }}
                />
                <motion.div
                  className="absolute left-1/2 top-0 -translate-x-1/2 w-px origin-top"
                  style={{ background: A }}
                  animate={{
                    height: done
                      ? "100%"
                      : active
                      ? `${segProgress * 100}%`
                      : "0%",
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Horizontal progress bar (mobile only) ────────────────────
function HorizontalProgressBar({ isDark, currentTime }) {
  const c = tk(isDark);
  const A = ac(isDark);

  const doneCount = STEPS.filter((s) => currentTime >= s.time).length;
  const segProgress = (() => {
    if (doneCount === STEPS.length) return 1;
    const prev = doneCount === 0 ? 0 : STEPS[doneCount - 1].time;
    const next = STEPS[doneCount].time;
    return Math.max(0, Math.min(1, (currentTime - prev) / (next - prev)));
  })();

  return (
    <div className="flex flex-row items-center w-full">
      {STEPS.map((step, i) => {
        const done = currentTime >= step.time;
        const active = !done && doneCount === i;
        return (
          <React.Fragment key={step.label}>
            {/* Dot + label */}
            <div className="relative flex-shrink-0 flex flex-col items-center">
              <div
                className="relative flex items-center justify-center"
                style={{ width: 18, height: 18 }}
              >
                <div
                  className="absolute inset-0 rounded-full transition-all duration-500"
                  style={{
                    border: `1.5px solid ${done || active ? A : c.dv}`,
                    background: done
                      ? A
                      : active
                      ? isDark
                        ? "rgba(250,204,21,0.1)"
                        : "rgba(14,116,144,0.08)"
                      : "transparent",
                  }}
                />
                <AnimatePresence>
                  {done && (
                    <motion.svg
                      width="8"
                      height="7"
                      viewBox="0 0 10 8"
                      fill="none"
                      className="relative z-10"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <path
                        d="M1 4L3.8 7L9 1"
                        stroke={isDark ? "#09100e" : "#ffffff"}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  )}
                  {active && !done && (
                    <motion.div
                      className="relative z-10 rounded-full"
                      style={{ width: 5, height: 5, background: A }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <span
                className="mt-1 text-center font-[font3]"
                style={{
                  fontSize: 8,
                  lineHeight: 1.2,
                  color: done || active ? c.tx : c.su,
                  fontWeight: done ? 600 : 400,
                  maxWidth: 44,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className="relative flex-1"
                style={{ height: 18, marginBottom: 18 }}
              >
                <div
                  className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-px"
                  style={{ background: c.dv }}
                />
                <motion.div
                  className="absolute top-1/2 left-0 -translate-y-1/2 h-px origin-left"
                  style={{ background: A }}
                  animate={{
                    width: done
                      ? "100%"
                      : active
                      ? `${segProgress * 100}%`
                      : "0%",
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ProductDemo() {
  const { isDark } = useTheme();
  const c = tk(isDark);
  const A = ac(isDark);
  const sectionRef = useRef(null);
  const lottieRef = useRef(null);
  const videoBoxRef = useRef(null);
  const layoutRef = useRef(getLayout());
  const [videoTime, setVideoTime] = useState(0);
  const [videoDur, setVideoDur] = useState(0);

  const onProgress = useCallback((t, d) => {
    setVideoTime(t);
    setVideoDur(d);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", () => {
      layoutRef.current = getLayout();
    });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const lottieEl = lottieRef.current;
    const videoBox = videoBoxRef.current;
    if (!section || !lottieEl || !videoBox) return;

    const anim = lottie.loadAnimation({
      container: lottieEl,
      animationData: duckJson,
      renderer: "svg",
      autoplay: false,
      loop: false,
    });

    let st;
    anim.addEventListener("DOMLoaded", () => {
      anim.goToAndStop(0, true);
      const { imgW, imgRight, gap } = layoutRef.current;
      gsap.set(videoBox, { width: imgW });
      gsap.set(lottieEl, { right: imgW + imgRight + gap });

      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          const {
            imgW: iW,
            minW: mW,
            imgRight: iR,
            gap: g,
          } = layoutRef.current;
          const SHRINK_END = 0.7;
          const shrinkP = Math.min(p / SHRINK_END, 1);
          const currentW = iW - shrinkP * (iW - mW);
          gsap.set(videoBox, { width: currentW });
          if (p <= SHRINK_END)
            gsap.set(lottieEl, {
              right: currentW + iR + g,
              rotateY: self.direction === 1 ? 0 : 180,
            });
          anim.goToAndStop(Math.floor(shrinkP * (anim.totalFrames - 1)), true);
        },
        onLeaveBack: () => {
          const { imgW: iW, imgRight: iR, gap: g } = layoutRef.current;
          gsap.set(videoBox, { width: iW });
          gsap.set(lottieEl, { right: iW + iR + g });
          anim.goToAndStop(0, true);
        },
      });
    });
    return () => {
      st?.kill();
      anim.destroy();
    };
  }, []);

  const L = layoutRef.current;
  const progBarRight = L.imgW + L.imgRight + L.duckSize + 20;

  return (
    <section
      ref={sectionRef}
      className={`relative w-full overflow-hidden font-[font3] transition-colors duration-500 ${
        isDark ? "bg-[#09100e]" : "bg-[#f7f9f7]"
      }`}
      style={{
        height:
          window.innerWidth < 640
            ? `calc(10.5rem + ${(L.imgW * 9) / 16 + 92}px)`
            : "100svh",
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

      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 108%, #0F4C3A18 0%, transparent 70%)",
          opacity: isDark ? 1 : 0.5,
        }}
      />

      {/* ── Heading — top right corner (unchanged) ── */}
      <div
        className="absolute top-0 right-0 z-10 flex flex-col items-end"
        style={{
          paddingTop: "clamp(2rem,4vw,4rem)",
          paddingRight: `${L.imgRight}px`,
        }}
      >
        <motion.div
          className="flex items-center gap-3 mb-4 justify-end"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div className="w-5 h-px" style={{ background: A }} />
          <span
            className="text-[10px] font-bold tracking-[0.28em] uppercase font-[font3]"
            style={{ color: A }}
          >
            See it live
          </span>
        </motion.div>
        <motion.h2
          className="font-[font5] font-light leading-none tracking-[-0.04em] text-right m-0"
          style={{ fontSize: "clamp(28px,5.8vw,88px)", color: c.tx }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.04 }}
        >
          ProductDemo
        </motion.h2>
      </div>

      {/* ── Horizontal progress bar — mobile only ── */}
      {/* Sits just below the heading. Heading = paddingTop(2rem) + eyebrow(~1.2rem) + gap(mb-4=1rem) + h2(~2.5rem) ≈ 6.7rem */}
      <div
        className="absolute z-20 flex sm:hidden"
        style={{
          left: L.imgRight,
          right: L.imgRight,
          top: "7rem",
        }}
      >
        <HorizontalProgressBar isDark={isDark} currentTime={videoTime} />
      </div>

      {/* ── Vertical progress bar — sm+ only (unchanged) ── */}
      <div
        className="absolute z-20 hidden sm:flex"
        style={{
          right: progBarRight,
          top: "50%",
          transform: "translateY(-50%)",
          height: "55%",
          maxHeight: 340,
        }}
      >
        <ProgressBar
          isDark={isDark}
          currentTime={videoTime}
          duration={videoDur}
        />
      </div>

      {/* ── Duck — COMPLETELY UNCHANGED ── */}
      <div
        ref={lottieRef}
        className="absolute z-20"
        style={{
          width: L.duckSize,
          height: L.duckSize,
          bottom: 24,
          right: L.imgW + L.imgRight + L.gap,
        }}
      />

      {/* ── Video — COMPLETELY UNCHANGED ── */}
      <div
        ref={videoBoxRef}
        className="absolute bottom-6 rounded-2xl overflow-hidden z-10"
        style={{
          width: L.imgW,
          aspectRatio: "16/9",
          right: L.imgRight,
          transformOrigin: "right center",
        }}
      >
        <VideoPlayer isDark={isDark} onProgress={onProgress} />
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
