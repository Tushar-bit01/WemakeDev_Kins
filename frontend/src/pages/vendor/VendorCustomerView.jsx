// src/pages/vendor/VendorCustomerView.jsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { C, MONTHS, useThemeTokens, fmt, fmtL } from "../../components/design/tokens";
import Navbar                 from "../../components/design/Navbar";
import RoofCanva              from "../../components/roof/RoofCanva";
import SunControls            from "../../components/design/SunControls";
import LivePerformanceGauge   from "../../components/design/LivePerformanceGauge";
import SystemStatCards        from "../../components/design/SystemStatCards";
import FinancialKPICards      from "../../components/design/FinancialKPICards";
import MonthlyGenerationChart from "../../components/design/MonthlyGenerationChart";
import MonthlySavingsChart    from "../../components/design/MonthlySavingsChart";
import LifetimeAnalysisChart  from "../../components/design/LifetimeAnalysisChart";
import api from "../../api/axios";

const ESCALATION_RATE = 0.05;

// ── MOCK DATA (comment out when backend is ready) ─────────────────────────────
const MOCK_CUSTOMER = {
  username:        "Priya Sharma",
  email:           "priya.s@outlook.com",
  mobileNumber:    "+91 91234 56789",
  locationAddress: "Gurugram, Haryana",
  loadKw:          5.0,
  monthlyBill:     4200,
  state:           "Haryana",
  discom:          "DHBVN",
  status:          "pending",
  submittedAt:     new Date().toISOString(),
  siteData:        null,
  panelOverride:   null,
  finalizedDesign: null,
};
// ──────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status, isDark }) {
  const cfg = {
    active:   { bg: isDark ? "#0f2d1a" : "#dcfce7", color: "#22c55e", label: "Active"   },
    pending:  { bg: isDark ? "#2a2000" : "#fef9c3", color: "#ca8a04", label: "Pending"  },
    inactive: { bg: isDark ? "#200a0a" : "#fee2e2", color: "#ef4444", label: "Inactive" },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style={{ background: s.bg, color: s.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
      {s.label}
    </span>
  );
}

function InfoTile({ label, value, color, sub, border, miniBg }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: miniBg, border: `1.5px solid ${border}` }}>
      <p className="text-[9px] font-bold tracking-wider uppercase mb-1" style={{ color: sub }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: color || "#22c55e" }}>{value ?? "—"}</p>
    </div>
  );
}

export default function VendorCustomerView() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleMode } = useTheme();
  const { text, sub, card, border } = useThemeTokens(isDark);
  const bg     = isDark ? C.dark : C.light;
  const miniBg = isDark ? "#0a1610" : "#f0f7f2";
  const shouldAutoPrint = new URLSearchParams(location.search).get("print") === "true";

  const [customer,      setCustomer]      = useState(null);
  const [hudData,       setHudData]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [sliderVal,     setSliderVal]     = useState(720);
  const [isRealtime,    setIsRealtime]    = useState(true);
  const [isPreview,     setIsPreview]     = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  // ── FETCH CUSTOMER ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!customerId) return;
    setLoading(true);

    // ── BACKEND: GET /api/vendor/me/customers/:customerId ──
    // Response shape:
    // {
    //   success: true,
    //   data: {
    //     username: string,
    //     email: string,
    //     mobileNumber: string,
    //     locationAddress: string,
    //     loadKw: number,
    //     monthlyBill: number,
    //     state: string,
    //     discom: string,
    //     status: 'pending' | 'active' | 'inactive',
    //     submittedAt: ISO date string,
    //     siteData: { obstacles: [...], roofPolygon: [...] } | null,
    //     panelOverride: [{ id, x, y, rotation }] | null,
    //     finalizedDesign: { complete hudData object } | null
    //   }
    // }
    //
    // What backend should return:
    // 1. User profile data (from users table)
    // 2. Submission data (from vendor_customer_submissions table)
    // 3. Finalized design data (hudData, siteData, panelOverride from users table)
    // 4. Join on user_id to get complete customer info
    
    api.get(`/api/vendor/me/customers/${customerId}`)
      .then((res) => {
        const d = res.data?.data;
        setCustomer(d);
        if (d?.finalizedDesign) setHudData(d.finalizedDesign);
      })
      .catch((err) => setError(err?.response?.data?.error || err.message || "Failed to load customer data."))
      .finally(() => setLoading(false));
    
    // ── MOCK DATA (comment out when backend is ready) ──
    // setTimeout(() => {
    //   setCustomer(MOCK_CUSTOMER);
    //   if (MOCK_CUSTOMER.finalizedDesign) setHudData(MOCK_CUSTOMER.finalizedDesign);
    //   setLoading(false);
    // }, 400);
  }, [customerId]);

  // ── AUTO PRINT ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!shouldAutoPrint || loading || !customer) return;
    const timer = setTimeout(() => {
      const style = document.createElement("style");
      style.id = "print-override";
      style.innerHTML = `@media print { #hide-buttons, #hide-print { display: none !important; } .fixed, nav { display: none !important; } body { background: white !important; } }`;
      document.head.appendChild(style);
      window.print();
      setTimeout(() => { document.getElementById("print-override")?.remove(); navigate(-1); }, 1000);
    }, 2000);
    return () => clearTimeout(timer);
  }, [shouldAutoPrint, loading, customer]);

  const handleHudUpdate = useCallback((data) => {
    if (!customer?.finalizedDesign) setHudData(data);
  }, [customer]);

  const handleSlider = (e) => { setSliderVal(parseInt(e.target.value)); setIsRealtime(false); };
  const handleLive   = () => { setSliderVal(new Date().getHours() * 60 + new Date().getMinutes()); setIsRealtime(true); };
  const handlePreviewOpen  = () => { setIsPreview(true);  requestAnimationFrame(() => requestAnimationFrame(() => setPreviewActive(true))); };
  const handlePreviewClose = () => { setPreviewActive(false); setTimeout(() => setIsPreview(false), 380); };

  useEffect(() => { document.body.style.overflow = isPreview ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [isPreview]);

  const externalSlider = useMemo(() => ({ val: sliderVal, isRealtime }), [sliderVal, isRealtime]);
  const roofCanvaKey   = useMemo(() =>
    JSON.stringify(customer?.siteData?.obstacles) + "|" + JSON.stringify(customer?.panelOverride) + "|" + (customer?.loadKw ?? ""),
    [customer]
  );

  const monthlyChartData = hudData?.monthlyData?.map((d) => ({
    name: MONTHS[d.month], kWh: d.kWh, savings: Math.round(d.kWh * (hudData.unitRate || 5)),
  })) || [];

  const lifetimeChartData = hudData?.yearlyGeneration
    ?.filter((_, i) => i % 5 === 0 || i === 0 || i === 24)
    ?.map((d) => ({
      name: `Yr ${d.year}`, kWh: d.kWh,
      value: Math.round(d.kWh * (hudData.unitRate || 5) * Math.pow(1 + ESCALATION_RATE, d.year - 1)),
    })) || [];

  const gaugePercent = hudData?.systemKW > 0 ? Math.min(((hudData.isDay ? hudData.currentKW : 0) / hudData.systemKW) * 100, 100) : 0;
  const theme = { isDark, card, border, text, sub };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-[font3]" style={{ background: bg }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 animate-spin" style={{ borderColor: `${C.green} transparent transparent transparent` }} />
        <p className="text-sm font-medium" style={{ color: sub }}>Loading customer data…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center font-[font3]" style={{ background: bg }}>
      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: C.green, color: "#fff" }}>← Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-[font3] transition-colors duration-500" style={{ background: bg, color: text }}>
      <Navbar isDark={isDark} toggleMode={toggleMode} />
      <div className="pt-[72px]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150"
                style={{ background: miniBg, border: `1.5px solid ${border}`, color: sub }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = sub; }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold" style={{ color: text }}>{customer?.username || "Customer"}'s Solar Design</h1>
                  <StatusBadge status={customer?.status || "pending"} isDark={isDark} />
                </div>
                <p className="text-xs mt-1 font-medium" style={{ color: sub }}>
                  {customer?.address || "Location not set"} · Submitted {customer?.submittedAt ? new Date(customer.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold tracking-wider uppercase flex-shrink-0"
              style={{ background: miniBg, border: `1.5px solid ${border}`, color: sub }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View Only
            </div>
          </div>

          {/* Customer info strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <InfoTile label="Email"        value={customer?.email}                                                                    color={text}    sub={sub} border={border} miniBg={miniBg} />
            <InfoTile label="Mobile"       value={customer?.mobile}                                                             color={text}    sub={sub} border={border} miniBg={miniBg} />
            <InfoTile label="Load"         value={customer?.loadKw ? `${customer.loadKw} kW` : null}                                  color={C.green} sub={sub} border={border} miniBg={miniBg} />
            <InfoTile label="Monthly Bill" value={customer?.monthlyBill ? `₹${Number(customer.monthlyBill).toLocaleString("en-IN")}` : null} color={C.teal} sub={sub} border={border} miniBg={miniBg} />
            <InfoTile label="State"        value={customer?.state}                                                                    color={text}    sub={sub} border={border} miniBg={miniBg} />
            <InfoTile label="DISCOM"       value={customer?.discom}                                                                   color={text}    sub={sub} border={border} miniBg={miniBg} />
          </div>

          {/* 3D canvas + controls */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
            <div className="flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden" style={{ height: "520px", border: `1.5px solid ${border}`, boxShadow: isDark ? "0 8px 40px #00000060" : "0 4px 24px #0F4C3A10" }}>
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
                  style={{ background: "rgba(9,16,14,0.75)", color: "#4fc3f7", border: "1px solid rgba(79,195,247,0.25)", backdropFilter: "blur(8px)" }}>
                  <span className="size-1.5 rounded-full bg-[#4fc3f7] animate-pulse inline-block" />
                  Finalized 3D Model
                </div>
                {customer?.finalizedDesign && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
                    style={{ background: "rgba(15,76,58,0.85)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", backdropFilter: "blur(8px)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Customer Approved
                  </div>
                )}
                <RoofCanva key={roofCanvaKey} siteData={customer?.siteData} panelOverride={customer?.panelOverride} onHudUpdate={handleHudUpdate} externalSlider={externalSlider} readOnly={true} />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl" style={{ background: card, border: `1.5px solid ${border}`, padding: "10px 8px" }} id="hide-buttons">
                <button onClick={() => isPreview ? handlePreviewClose() : handlePreviewOpen()} className="flex items-center justify-center gap-1.5 flex-1"
                  style={{ minWidth: 120, padding: "9px 14px", borderRadius: 10, background: isPreview ? (isDark ? "rgba(14,116,144,0.2)" : "#e0f2fe") : "transparent", border: `1.5px solid ${isPreview ? "#0E7490" : border}`, color: isPreview ? "#0E7490" : text, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                  {isPreview ? "Exit Preview" : "Fullscreen Preview"}
                </button>

                <a href={`mailto:${customer?.email || ""}?subject=Your Solar Installation Quote — Kins`} className="flex items-center justify-center gap-1.5 flex-1"
                  style={{ minWidth: 140, padding: "9px 14px", borderRadius: 10, background: "transparent", border: `1.5px solid ${border}`, color: sub, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s ease", textDecoration: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.teal; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = sub; }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                  Email Customer
                </a>

                <button className="flex items-center justify-center gap-1.5 flex-1"
                  style={{ minWidth: 140, padding: "9px 14px", borderRadius: 10, background: "linear-gradient(135deg, #0F4C3A 0%, #1a6b4a 100%)", border: "1.5px solid transparent", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s ease", boxShadow: "0 3px 12px rgba(15,76,58,0.35)" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  onClick={() => {
                    const style = document.createElement("style");
                    style.id = "print-override";
                    style.innerHTML = `@media print { #hide-buttons, #hide-print { display: none !important; } .fixed, nav { display: none !important; } body { background: white !important; } }`;
                    document.head.appendChild(style);
                    window.print();
                    setTimeout(() => document.getElementById("print-override")?.remove(), 1000);
                  }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/><path d="M12 3v12M5 20h14"/></svg>
                  Download Report
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4" id="hide-print">
              <SunControls hudData={hudData} sliderVal={sliderVal} isRealtime={isRealtime} onSlider={handleSlider} onLive={handleLive} {...theme} />
              <LivePerformanceGauge hudData={hudData} gaugePercent={gaugePercent} {...theme} />
              <SystemStatCards hudData={hudData} isDark={isDark} border={border} sub={sub} />
            </div>
          </div>

          <FinancialKPICards hudData={hudData} {...theme} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MonthlyGenerationChart data={monthlyChartData} {...theme} />
            <MonthlySavingsChart    data={monthlyChartData} {...theme} />
          </div>
          <LifetimeAnalysisChart data={lifetimeChartData} hudData={hudData} {...theme} />

          {hudData && (
            <div className="rounded-2xl p-5" style={{ background: card, border: `1.5px solid ${border}` }}>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-4" style={{ color: sub }}>Finalized Design Summary</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Panels",          value: `${hudData.panelCount} panels`,  color: C.yellow },
                  { label: "Orientation",     value: hudData.orientation,             color: text     },
                  { label: "System Size",     value: `${hudData.systemKW} kWp`,       color: C.teal   },
                  { label: "Annual Output",   value: `${fmt(hudData.annualKWh)} kWh`, color: C.green  },
                  { label: "Monthly Savings", value: fmtL(hudData.monthlySavings),    color: C.green  },
                  { label: "PM Subsidy",      value: fmtL(hudData.subsidy),           color: "#22c55e"},
                  { label: "Payback Period",  value: `${hudData.paybackYears} yrs`,   color: C.yellow },
                  { label: "Lifetime Savings",value: fmtL(hudData.lifetimeSavings),   color: C.green  },
                ].map(({ label, value, color }) => (
                  <InfoTile key={label} label={label} value={value} color={color} sub={sub} border={border} miniBg={miniBg} />
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-[10px] pb-4" style={{ color: isDark ? "#1e3d28" : "#c5d9ce" }}>
            NASA POWER PSH · PR=0.75 (MNRE/CERC) · DERC 2024-25 tariff · PM Surya Ghar subsidy · CEA 2023 CO₂ factor
          </p>
        </div>
      </div>

      {isPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#050f23", overflow: "hidden", transform: previewActive ? "scale(1)" : "scale(0.4)", transformOrigin: "top left", borderRadius: previewActive ? "0px" : "18px", opacity: previewActive ? 1 : 0, transition: "transform 0.38s cubic-bezier(0.4,0,0.2,1), border-radius 0.38s ease, opacity 0.3s ease" }}>
          <button onClick={handlePreviewClose} style={{ position: "absolute", top: 20, right: 20, zIndex: 10, background: isDark ? "rgba(13,31,22,0.82)" : "rgba(240,247,242,0.82)", border: `1.5px solid ${border}`, borderRadius: 10, color: text, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 8, transition: "opacity 0.15s ease" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.6"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></svg>
            Exit Preview
          </button>
          <RoofCanva key={roofCanvaKey + "_preview"} siteData={customer?.siteData} panelOverride={customer?.panelOverride} onHudUpdate={handleHudUpdate} externalSlider={externalSlider} readOnly={true} />
        </div>
      )}
    </div>
  );
}