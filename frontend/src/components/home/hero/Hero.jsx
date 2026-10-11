import React, { useRef } from "react";
import Lottie from "lottie-react";
import animationData from "./revenue.json";
import ShaderBackground from "./ShaderBackground";
import Navbar from "../navbar/Navbar";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import NextHero from "./NextHero";
import DissolveCanvas from "./DissolveCanvas";
import { useTheme } from "../../../context/ThemeContext";
import { motion } from "motion/react";

// ─── Solar AI Platform Theme ───────────────────────────────────────────────
// Light mode shader: warm peach/cream (#ffeee8 family)
// Dark mode shader:  deep black with cool grey-blue shimmer
//
// Primary brand:     #0F4C3A  (deep forest green — grounded, premium)
// CTA / Accent:      #FACC15  (solar yellow — pops on both shader modes)
// CTA Hover:         #D97706  (amber — warm, confident)
// Secondary accent:  #0E7490  (teal — echoes dark mode cool shimmer)
// Light text:        #E2E8F0  (on dark shader)
// Dark text:         #1A2E25  (on light shader)
// ──────────────────────────────────────────────────────────────────────────

// ── Shared easing ────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1];

// ── Stagger container for the text column ────────────────────
const textStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

// ── Each child slides up from below its clip line ────────────
const slideUp = {
  hidden: { y: 50, opacity: 0 },
  show:   { y: 0,   opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

// ── Fade + slight rise (body copy, CTA) ──────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y:  0, transition: { duration: 0.7, ease: EASE } },
};

const Hero = () => {
  const { isDark, toggleMode, modeRef, targetModeRef } = useTheme();

  return (
    <div className="hero relative w-full h-[175svh] overflow-hidden">
      <ShaderBackground
        isDark={isDark}
        modeRef={modeRef}
        targetModeRef={targetModeRef}
      />
      <Navbar isDark={isDark} toggleMode={toggleMode} />

      <div className="relative z-[5] h-screen w-[90vw] mx-auto px-2 lg:px-5 flex items-center max-lg:gap-5 lg:flex-row flex-col-reverse max-lg:justify-center max-md:mt-[1vh]">

        {/* ── Text + CTA column ── */}
        <motion.div
          className={`w-1/2 lg:mt-[17vh] max-lg:w-full max-lg:flex max-lg:flex-col max-lg:items-center ${
            isDark ? "text-[#E2E8F0]" : "text-[#1A2E25]"
          }`}
          initial="hidden"
          animate="show"
          variants={textStagger}
        >
          {/* ── Creative Heading Block ── */}
          <div className="mb-8 max-lg:flex max-lg:flex-col max-lg:items-center">

            {/* Main heading — clip reveal so text slides up from baseline */}
            <div>
              <motion.h1
                variants={slideUp}
                className="text-[8vh] lg:text-[7.5vw] font-black leading-[1.2] font-[font5] w-full max-lg:text-center max-md:scale-x-[1.08]"
                style={{ letterSpacing: "-0.02em" }}
              >
                Your AI<br />Solar Engineer
              </motion.h1>
            </div>

            {/* Accent subheading */}
            <div>
              <motion.h2
                variants={slideUp}
                className="mt-2 text-[3.5vh] lg:text-[2.8vw] font-light italic max-lg:text-center font-[font6]"
                style={{
                  fontStyle: "italic",
                  fontWeight: "600",
                  color: "#F59E0B",
                  letterSpacing: "0.01em",
                  lineHeight: "1.3",
                }}
              >
                Expert 3D solar designs in 2 mins
              </motion.h2>
            </div>
          </div>

          {/* Body copy */}
          <motion.p
            variants={fadeUp}
            className="mt-4 text-[2.1vh] max-lg:text-center lg:text-[1.35vw] max-w-md font-[font3] leading-relaxed"
            style={{ opacity: 0.72 }}
          >
           Remote site surveys in seconds. Instantly generate 3D roof models, calculate government subsidies, and turn raw addresses into <br></br>pre-qualified leads.
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={fadeUp}>
          <Link
  className="mt-8 px-4 py-2 lg:px-6 lg:py-3 rounded-xl text-sm md:text-base font-[font3] font-semibold transition-colors max-md:self-center inline-block text-center group"
  style={{
    backgroundColor: "#FACC15",
    color: "#0F4C3A",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "#FDE047";
    e.currentTarget.style.color = "#0F4C3A";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "#FACC15";
    e.currentTarget.style.color = "#0F4C3A";
  }}
  to="/vendor/signup"
>
  Get Started
  <FontAwesomeIcon
    icon={faArrowRight}
    className="ml-2 transition-transform group-hover:translate-x-1"
  />
</Link>
          </motion.div>
        </motion.div>

        {/* ── Lottie animation column ── */}
        <motion.div
          className="w-1/2 max-lg:h-[35%] max-lg:w-full  mt-30 lg:w-[48%] lg:scale-115 lg:translate-x-5"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        >
          <Lottie
            animationData={animationData}
            autoplay
            loop
            style={{ width: "100%", height: "100%" }}
          />
        </motion.div>
      </div>

      <DissolveCanvas />
      <NextHero />
    </div>
  );
};

export default Hero;