// src/pages/customer/Design.jsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import Navbar from "../../components/design/Navbar";
import RoofCanva from "../../components/roof/RoofCanva";
import SunControls from "../../components/design/SunControls";
import LivePerformanceGauge from "../../components/design/LivePerformanceGauge";
import SystemStatCards from "../../components/design/SystemStatCards";
import FinancialKPICards from "../../components/design/FinancialKPICards";
import MonthlyGenerationChart from "../../components/design/MonthlyGenerationChart";
import MonthlySavingsChart from "../../components/design/MonthlySavingsChart";
import LifetimeAnalysisChart from "../../components/design/LifetimeAnalysisChart";
import FinalizeModal from "../../components/design/FinalizeModal";
import SiteEditorModal from "../../components/customer/SiteEditorModal";
import { C, MONTHS, useThemeTokens } from "../../components/design/tokens";
import { useUser } from "../../context/UserContext";
// Add at top:
import api from "../../api/axios";

// ─── RICH MOCK DATA (Jab tak Backend se data nahi aata) ──────────
const RICH_MOCK_DATA = {
  roof_polygon: [ { x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 8 }, { x: 0, z: 8 } ],
  free_space_polygon: [ { x: 0.6, z: 0.6 }, { x: 9.4, z: 0.6 }, { x: 9.4, z: 7.4 }, { x: 0.6, z: 7.4 } ],
  obstacles: [
    { height: 1.5, points: [ { x: 0.8, z: 5.5 }, { x: 2.8, z: 5.5 }, { x: 2.8, z: 7.5 }, { x: 0.8, z: 7.5 } ] },
    { height: null, points: [ { x: 0.8, z: 0.8 }, { x: 2.8, z: 0.8 }, { x: 2.8, z: 3.0 }, { x: 0.8, z: 3.0 } ] }
  ],
  upper_roofs: [
    {
      footprint: [ { x: 6.0, z: 4.0 }, { x: 10.0, z: 4.0 }, { x: 10.0, z: 8.0 }, { x: 6.0, z: 8.0 } ],
      free_space: [ { x: 6.5, z: 4.5 }, { x: 9.4, z: 4.5 }, { x: 9.4, z: 7.4 }, { x: 6.5, z: 7.4 } ],
      obstacles: [ { height: 1.0, points: [ { x: 8.6, z: 6.8 }, { x: 9.4, z: 6.8 }, { x: 9.4, z: 7.4 }, { x: 8.6, z: 7.4 } ] } ]
    }
  ]
};

const ESCALATION_RATE = 0.05;

export default function Design() {
  const { isDark, toggleMode } = useTheme();
  const {
    customer,
    siteData,
    panelOverride,
    setSiteEditorResult,
    loadingProfile,
  } = useUser();

  const [hudData, setHudData] = useState(null);
  const [sliderVal, setSliderVal] = useState(720);
  const [isRealtime, setIsRealtime] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const { text, sub, card, border } = useThemeTokens(isDark);
  const bg = isDark ? C.dark : C.light;

  useEffect(() => {
    document.body.style.overflow = isPreview ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPreview]);

  const handleHudUpdate = useCallback((data) => setHudData(data), []);
  const handleSlider = (e) => {
    setSliderVal(parseInt(e.target.value));
    setIsRealtime(false);
  };
  const handleLive = () => {
    const n = new Date();
    setSliderVal(n.getHours() * 60 + n.getMinutes());
    setIsRealtime(true);
  };

  const handlePreviewOpen = () => {
    setIsPreview(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPreviewActive(true))
    );
  };
  const handlePreviewClose = () => {
    setPreviewActive(false);
    setTimeout(() => setIsPreview(false), 380);
  };
  const handlePreviewToggle = () =>
    isPreview ? handlePreviewClose() : handlePreviewOpen();

  // ── Site editor save (FRONTEND ONLY MODE) ──────────────────────────
  const handleEditorSave = async (result) => {
    try {
      // BACKEND CALL COMMENTED OUT
      await api.patch("/api/customer/me/site", {
        siteData: result.siteData,
        panelOverride: result.panelOverride,
        loadKw: result.loadKw,
      });

      // Direct Frontend State Update
      setSiteEditorResult({
        siteData: result.siteData,
        loadKw: result.loadKw,
        panelOverride: result.panelOverride,
      });
      
      // Modal will successfully close now!
      setShowEditor(false);
    } catch (err) {
      console.error("Error in saving:", err);
      // Fallback close just in case
      setShowEditor(false);
    }
  };

  // ── Finalize (FRONTEND ONLY MODE) ──────────────────────────
  const handleFinalizeSend = async (hudDataSnapshot) => {
    try {
      await api.post("/api/customer/me/finalize", {
        siteData,
        panelOverride,
        hudData: hudDataSnapshot,
      });
      console.log(`siteData:${siteData},paneloverride:${panelOverride} finalizedDesign:${hudDataSnapshot}`)
      alert("Design finalized! You'll receive a call within 24-48 hours.");
      setShowModal(false);
    } catch (err) {
      console.error("Failed to finalize design:", err);
      alert("Failed to send design. Please try again.");
    }
  };

  const externalSlider = useMemo(
    () => ({ val: sliderVal, isRealtime }),
    [sliderVal, isRealtime]
  );

  const roofCanvaKey = useMemo(
    () => JSON.stringify(siteData) + "|" + JSON.stringify(panelOverride),
    [siteData, panelOverride]
  );

  const monthlyChartData =
    hudData?.monthlyData?.map((d) => ({
      name: MONTHS[d.month],
      kWh: d.kWh,
      savings: Math.round(d.kWh * (hudData.unitRate || 5)),
    })) || [];

  const lifetimeChartData =
    hudData?.yearlyGeneration
      ?.filter((_, i) => i % 5 === 0 || i === 0 || i === 24)
      ?.map((d) => ({
        name: `Yr ${d.year}`,
        kWh: d.kWh,
        value: Math.round(
          d.kWh *
            (hudData.unitRate || 5) *
            Math.pow(1 + ESCALATION_RATE, d.year - 1)
        ),
      })) || [];

  const gaugePercent =
    hudData?.systemKW > 0
      ? Math.min(
          ((hudData.isDay ? hudData.currentKW : 0) / hudData.systemKW) * 100,
          100
        )
      : 0;

  const theme = { isDark, card, border, text, sub };

  return (
    <div
      className="min-h-screen font-[font3] transition-colors duration-500"
      style={{ background: bg, color: text }}
    >
      <Navbar isDark={isDark} toggleMode={toggleMode} />
      <div className="pt-[72px]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
            <div className="flex flex-col gap-3">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  height: "520px",
                  border: `1.5px solid ${border}`,
                  boxShadow: isDark
                    ? "0 8px 40px #00000060"
                    : "0 4px 24px #0F4C3A10",
                }}
              >
                <div
                  className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
                  style={{
                    background: "rgba(9,16,14,0.75)",
                    color: "#4fc3f7",
                    border: "1px solid rgba(79,195,247,0.25)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="size-1.5 rounded-full bg-[#4fc3f7] animate-pulse inline-block" />
                  Live 3D Model
                </div>
                {loadingProfile ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: "#050f23",
                      color: "#4fc3f7",
                      fontFamily: "monospace",
                      fontSize: 12,
                      letterSpacing: 3,
                    }}
                  >
                    LOADING SITE DATA...
                  </div>
                ) : (
                  <RoofCanva
                    key={roofCanvaKey}
                    siteData={siteData} // 👈 Added Rich Mock
                    panelOverride={panelOverride}
                    onHudUpdate={handleHudUpdate}
                    externalSlider={externalSlider}
                    sanctionedLoadKW={customer?.sanctionedLoad ? parseFloat(customer.sanctionedLoad) : null}
                  />
                )}
              </div>

              <div
                className="flex flex-wrap items-center justify-center gap-2 rounded-2xl"
                style={{
                  background: card,
                  border: `1.5px solid ${border}`,
                  padding: "10px 8px",
                }}
              >
                <button
                  onClick={() => setShowEditor(true)}
                  className="flex items-center justify-center gap-1.5 flex-1"
                  style={{
                    minWidth: 120,
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "transparent",
                    border: `1.5px solid ${border}`,
                    color: sub,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.green;
                    e.currentTarget.style.color = C.green;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.color = sub;
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Design
                </button>

                <button
                  onClick={handlePreviewToggle}
                  className="flex items-center justify-center gap-1.5 flex-1"
                  style={{
                    minWidth: 100,
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: isPreview
                      ? isDark
                        ? "rgba(14,116,144,0.2)"
                        : "#e0f2fe"
                      : "transparent",
                    border: `1.5px solid ${isPreview ? "#0E7490" : border}`,
                    color: isPreview ? "#0E7490" : text,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {isPreview ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <polyline points="8 3 3 3 3 8" />
                      <polyline points="21 8 21 3 16 3" />
                      <polyline points="3 16 3 21 8 21" />
                      <polyline points="16 21 21 21 21 16" />
                    </svg>
                  ) : (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  )}
                  {isPreview ? "Exit Preview" : "Preview"}
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center justify-center gap-1.5 flex-1"
                  style={{
                    minWidth: 120,
                    padding: "9px 14px",
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, #0F4C3A 0%, #1a6b4a 100%)",
                    border: "1.5px solid transparent",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                    transition: "all 0.15s ease",
                    boxShadow: "0 3px 12px rgba(15,76,58,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(15,76,58,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 3px 12px rgba(15,76,58,0.35)";
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Finalize Draft
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SunControls
                hudData={hudData}
                sliderVal={sliderVal}
                isRealtime={isRealtime}
                onSlider={handleSlider}
                onLive={handleLive}
                {...theme}
              />
              <LivePerformanceGauge
                hudData={hudData}
                gaugePercent={gaugePercent}
                {...theme}
              />
              <SystemStatCards
                hudData={hudData}
                isDark={isDark}
                border={border}
                sub={sub}
              />
            </div>
          </div>

          <FinancialKPICards hudData={hudData} {...theme} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MonthlyGenerationChart data={monthlyChartData} {...theme} />
            <MonthlySavingsChart data={monthlyChartData} {...theme} />
          </div>
          <LifetimeAnalysisChart
            data={lifetimeChartData}
            hudData={hudData}
            {...theme}
          />
          <p
            className="text-center text-[10px] pb-4"
            style={{ color: isDark ? "#1e3d28" : "#c5d9ce" }}
          >
            NASA POWER PSH · PR=0.75 (MNRE/CERC) · DERC 2024-25 tariff · PM
            Surya Ghar subsidy · CEA 2023 CO₂ factor
          </p>
        </div>
      </div>

      {isPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "#050f23",
            overflow: "hidden",
            transform: previewActive ? "scale(1)" : "scale(0.4)",
            transformOrigin: "top left",
            borderRadius: previewActive ? "0px" : "18px",
            opacity: previewActive ? 1 : 0,
            transition:
              "transform 0.38s cubic-bezier(0.4,0,0.2,1), border-radius 0.38s ease, opacity 0.3s ease",
          }}
        >
          <button
            onClick={handlePreviewClose}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 10,
              background: isDark
                ? "rgba(13,31,22,0.82)"
                : "rgba(240,247,242,0.82)",
              border: `1.5px solid ${border}`,
              borderRadius: 10,
              color: text,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="8 3 3 3 3 8" />
              <polyline points="21 8 21 3 16 3" />
              <polyline points="3 16 3 21 8 21" />
              <polyline points="16 21 21 21 21 16" />
            </svg>
            Exit Preview
          </button>
          <RoofCanva
            key={roofCanvaKey + "_preview"}
            siteData={siteData} // 👈 Added Rich Mock
            panelOverride={panelOverride}
            onHudUpdate={handleHudUpdate}
            externalSlider={externalSlider}
            sanctionedLoadKW={customer?.sanctionedLoad ? parseFloat(customer.sanctionedLoad) : null}
          />
        </div>
      )}

      <FinalizeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleFinalizeSend}
        hudData={hudData}
        isDark={isDark}
      />
      
      <SiteEditorModal
        open={showEditor}
        siteData={siteData} // 👈 Added Rich Mock
        loadKw={customer?.loadKw}
        sanctionedLoad={customer?.sanctionedLoad ? parseFloat(customer.sanctionedLoad) : null}
        panelOverride={panelOverride}
        monthlyBill={customer?.monthlyBill}
        isDark={isDark}
        onSave={handleEditorSave}
        onClose={() => setShowEditor(false)}
      />
    </div>
  );
}