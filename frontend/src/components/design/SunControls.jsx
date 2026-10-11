import React from "react";
import { C, fmt } from "./tokens";
import sunblack from "../../../src/assets/customer/sunblack.png";
import sunwhite from "../../../src/assets/customer/sunwhite.png";
import moonblack from "../../../src/assets/customer/moonblack.png";
import moonwhite from "../../../src/assets/customer/moonwhite.png";

/**
 * SunControls — sun path slider, LIVE button, GHI/POA/Output readouts.
 *
 * Props:
 *   hudData      — full hudData object from RoofCanva callback
 *   sliderVal    — minutes from midnight (controlled)
 *   isRealtime   — boolean
 *   onSlider     — (e) => void
 *   onLive       — () => void
 *   isDark, card, border, text, sub
 */
export default function SunControls({
  hudData, sliderVal, isRealtime, onSlider, onLive,
  isDark, card, border, text, sub,
}) {
  const miniBg = isDark ? "#0a1610" : "#f0f7f2";

  // Track fill — yellow left of thumb, muted right of thumb
  const fillPct = ((sliderVal - 360) / (1080 - 360)) * 100;
  const trackBg = `linear-gradient(to right,
    ${C.yellow} 0%,
    ${C.yellow} ${fillPct}%,
    ${isDark ? "#1a2e20" : "#d4e8db"} ${fillPct}%,
    ${isDark ? "#1a2e20" : "#d4e8db"} 100%)`;

  return (
    <div className="rounded-2xl p-5" style={{ background: card, border: `1.5px solid ${border}` }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: sub }}>
            Sun Position
          </p>
          <p className="text-2xl font-bold mt-0.5 flex items-center gap-2" style={{ color: text }}>
            <img
              src={hudData?.isDay ? (isDark ? sunwhite : sunblack) : (isDark ? moonwhite : moonblack)}
              alt={hudData?.isDay ? "sun" : "moon"}
              style={{ width: 26, height: 26, objectFit: "contain" }}
            />
            {hudData?.timeLabel || "—"}
          </p>
        </div>

        {/* LIVE button */}
        <button
          onClick={onLive}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
          style={{
            background: isRealtime ? C.green : "transparent",
            color:      isRealtime ? "#fff"  : sub,
            border:     `1.5px solid ${isRealtime ? C.green : border}`,
            boxShadow:  isRealtime ? "0 0 14px rgba(15,76,58,0.45)" : "none",
          }}
          onMouseEnter={e => { if (!isRealtime) { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}}
          onMouseLeave={e => { if (!isRealtime) { e.currentTarget.style.borderColor = border;  e.currentTarget.style.color = sub; }}}
        >
          {/* Pulsing dot when live */}
          <span
            style={{
              display: "inline-block",
              width: 6, height: 6,
              borderRadius: "50%",
              background: isRealtime ? "#fff" : "currentColor",
              animation: isRealtime ? "livePulse 1.4s ease-in-out infinite" : "none",
              flexShrink: 0,
            }}
          />
          Live
        </button>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <span className="text-[10px]" style={{ color: sub }}>6 AM</span>
        <input
          type="range" min={360} max={1080} step={5}
          value={sliderVal}
          onChange={onSlider}
          className="sun-slider flex-1"
          style={{
            WebkitAppearance: "none",
            appearance: "none",
            height: 6,
            borderRadius: 999,
            background: trackBg,
            cursor: "pointer",
            outline: "none",
            border: "none",
          }}
        />
        <span className="text-[10px]" style={{ color: sub }}>6 PM</span>
      </div>

      {/* Thumb + pulse keyframe styles */}
      <style>{`
        .sun-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: ${C.yellow};
          border: 2.5px solid #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.28);
          cursor: pointer;
          transition: transform 0.12s ease;
        }
        .sun-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
        .sun-slider::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: ${C.yellow};
          border: 2.5px solid #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.28);
          cursor: pointer;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.75); }
        }
      `}</style>

      {/* GHI / POA / Output tiles */}
      <div className="flex gap-3 mt-4">
        {[
          { label: "GHI",    value: fmt(hudData?.irradiance    || 0), color: C.yellow,  unit: "W/m²" },
          { label: "POA",    value: fmt(hudData?.poaIrradiance || 0), color: C.yellow,  unit: "W/m²" },
          { label: "Output", value: hudData?.isDay ? hudData.currentKW : "—", color: "#22c55e", unit: "kW" },
        ].map(({ label, value, color, unit }) => (
          <div key={label} className="flex-1 rounded-xl p-3 text-center" style={{ background: miniBg }}>
            <p className="text-[9px] tracking-widest uppercase" style={{ color: sub }}>{label}</p>
            <p className="text-sm font-bold mt-0.5" style={{ color }}>{value}</p>
            <p className="text-[9px]" style={{ color: sub }}>{unit}</p>
          </div>
        ))}
      </div>

    </div>
  );
}