import React, { useState, useEffect } from "react";
import { C, fmt, fmtL } from "./tokens";
import solarpanelblack from "../../assets/customer/solarpanelblack.png";
import solarpanelwhite from "../../assets/customer/solarpanelwhite.png";

/**
 * FinalizeModal — confirmation modal before sending to vendor.
 *
 * Props:
 *   isOpen    — boolean
 *   onClose   — () => void
 *   onConfirm — (hudData) => void  ← called when user clicks "Send to Vendor"
 *   hudData   — solar results object
 *   isDark
 */
export default function FinalizeModal({ isOpen, onClose, onConfirm, hudData, isDark }) {
  const [step, setStep]       = useState("confirm"); // "confirm" | "sending" | "done"
  const [visible, setVisible] = useState(false);     // controls CSS animation

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      setStep("confirm");
      // tiny delay so CSS transition triggers properly
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  const handleConfirm = async () => {
    setStep("sending");
    // TODO: replace with real API call
    // await api.post("/vendor/finalize", { hudData })
    await new Promise(r => setTimeout(r, 1800)); // simulate network
    setStep("done");
    if (onConfirm) onConfirm(hudData);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // wait for fade-out animation
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const overlay = {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.3s ease",
  };

  const modal = {
    background: isDark ? "#0d1f16" : "#ffffff",
    border: `1.5px solid ${isDark ? "#1a3525" : "#ddeae2"}`,
    borderRadius: 20,
    width: "100%", maxWidth: 480,
    padding: "32px 28px",
    boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.6)" : "0 24px 60px rgba(15,76,58,0.15)",
    transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(16px)",
    transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
    opacity: visible ? 1 : 0,
  };

  const textColor  = isDark ? "#E2E8F0" : "#1A2E25";
  const subColor   = isDark ? "#6b9e85" : "#5a7a69";
  const divColor   = isDark ? "#1a3525" : "#ddeae2";

  // ── Summary rows ─────────────────────────────────────────────────────────
  const summaryRows = hudData ? [
    { label: "Solar Panels",     value: `${hudData.panelCount} panels (${hudData.orientation})` },
    { label: "System Size",      value: `${hudData.systemKW} kWp`                               },
    { label: "Year 1 Generation",value: `${fmt(hudData.annualKWh)} kWh`                         },
    { label: "Monthly Savings",  value: fmtL(hudData.monthlySavings)                            },
    { label: "PM Subsidy",       value: fmtL(hudData.subsidy)                                   },
    { label: "Payback Period",   value: `${hudData.paybackYears} years`                         },
    { label: "Lifetime Savings", value: fmtL(hudData.lifetimeSavings)                           },
    { label: "CO₂ Offset",       value: `${hudData.co2OffsetTonnes} tonnes`                     },
  ] : [];

  // ── Render states ─────────────────────────────────────────────────────────
  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && step !== "sending" && handleClose()}>
      <div style={modal}>

        {/* ── CONFIRM state ── */}
        {step === "confirm" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <img src={isDark ? solarpanelwhite : solarpanelblack} alt="solar" style={{ width: 24, height: 24, objectFit: "contain" }} />
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: textColor }}>
                    Finalize Solar Design
                  </h2>
                </div>
                <p className="text-[12px]" style={{ color: subColor }}>
                  Review your solar placement before sending to vendor
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{ color: subColor, background: "transparent", border: "none", cursor: "pointer", padding: 4, fontSize: 18, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Summary table */}
            <div
              className="rounded-xl p-4 mb-5 space-y-2.5"
              style={{ background: isDark ? "#081510" : "#f0f7f2", border: `1px solid ${divColor}` }}
            >
              {summaryRows.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[11px] font-medium" style={{ color: subColor }}>{label}</span>
                  <span className="text-[12px] font-bold" style={{ color: textColor }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Satisfaction question */}
            <div
              className="rounded-xl p-4 mb-6"
              style={{ background: isDark ? "#0a1f14" : "#f0fdf4", border: `1.5px solid ${isDark ? "#1a4028" : "#bbf7d0"}` }}
            >
              <p className="text-[12px] font-semibold mb-1" style={{ color: isDark ? "#4ade80" : "#15803d" }}>
                 Are you satisfied with the current solar panel placement?
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: subColor }}>
                Once confirmed, this design will be sent to our vendor team who will conduct
                a site visit and provide you with a final installation quote within 24–48 hours.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-150 hover:opacity-80"
                style={{ background: "transparent", border: `1.5px solid ${divColor}`, color: subColor }}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-150"
                style={{
                  background: `linear-gradient(135deg, ${C.green} 0%, #1a6b4a 100%)`,
                  border: "none", color: "#fff",
                  boxShadow: "0 4px 16px rgba(15,76,58,0.4)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(15,76,58,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,76,58,0.4)"; }}
              >
                Send to Vendor →
              </button>
            </div>

            <p className="text-center text-[10px] mt-4" style={{ color: isDark ? "#1e3d28" : "#c5d9ce" }}>
              Our team will contact you within 24–48 hours with a detailed quote
            </p>
          </>
        )}

        {/* ── SENDING state ── */}
        {step === "sending" && (
          <div className="flex flex-col items-center justify-center py-8 gap-5">
            <div style={{ position: "relative", width: 64, height: 64 }}>
              {/* Spinning ring */}
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: "absolute", top: 0, left: 0, animation: "spin 1s linear infinite" }}>
                <circle cx="32" cy="32" r="28" fill="none" stroke={isDark ? "#1a3525" : "#ddeae2"} strokeWidth="4"/>
                <circle cx="32" cy="32" r="28" fill="none" stroke={C.green} strokeWidth="4"
                  strokeLinecap="round" strokeDasharray="44 132"/>
              </svg>
              <img src={isDark ? solarpanelwhite : solarpanelblack} alt="solar" style={{ position: "absolute", inset: 0, margin: "auto", width: 28, height: 28, objectFit: "contain" }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm" style={{ color: textColor }}>Sending to Vendor…</p>
              <p className="text-[11px] mt-1" style={{ color: subColor }}>Packaging your solar design</p>
            </div>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        )}

        {/* ── DONE state ── */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
            {/* Success checkmark */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 64, height: 64, background: isDark ? "#0a2018" : "#dcfce7", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: textColor }}>Design Sent! </h3>
              <p className="text-[12px]" style={{ color: subColor }}>
                Your solar design has been sent to our vendor team.
              </p>
              <p className="text-[12px] mt-1" style={{ color: subColor }}>
                Expect a call within <strong style={{ color: isDark ? "#4ade80" : "#15803d" }}>24–48 hours</strong>.
              </p>
            </div>

            {/* Summary chip */}
            {hudData && (
              <div
                className="flex gap-3 flex-wrap justify-center mt-1"
                style={{ fontSize: 11 }}
              >
                {[
                  `${hudData.panelCount} panels`,
                  `${hudData.systemKW} kWp`,
                  fmtL(hudData.monthlySavings) + "/mo",
                ].map(s => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full font-bold"
                    style={{ background: isDark ? "#0a2018" : "#dcfce7", color: isDark ? "#4ade80" : "#15803d" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleClose}
              className="mt-3 px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:opacity-85"
              style={{ background: `linear-gradient(135deg, ${C.green}, #1a6b4a)`, color: "#fff", border: "none" }}
            >
              Done
            </button>

            <style>{`@keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }`}</style>
          </div>
        )}

      </div>
    </div>
  );
}