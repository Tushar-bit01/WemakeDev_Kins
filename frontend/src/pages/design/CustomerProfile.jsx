// src/pages/customer/CustomerProfile.jsx
import { useState }          from "react";
import { useNavigate }       from "react-router-dom";
import { useTheme }          from "../../context/ThemeContext";
import { useUser }           from "../../context/UserContext";
import { C, useThemeTokens } from "../../components/design/tokens";
import Navbar                from "../../components/design/Navbar";
import { getSolarEst }       from "../../components/customer/constants";
import ProfileHero           from "../../components/customer/ProfileHero";
import { CUSTOMER_AVATARS, DEFAULT_SITE_DATA } from "../../context/UserContext";
import AvatarPicker          from "../../components/customer/AvatarPicker";
import { ContactCard, ElectricityCard } from "../../components/customer/InfoCards";
import { ContactModal, LoadModal }      from "../../components/customer/EditModals";
import SiteEditorModal                  from "../../components/customer/SiteEditorModal";
import api from "../../api/axios";

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { isDark, toggleMode } = useTheme();

  const {
    customer,
    setCustomer,
    draft,
    setDraft,
    profileImg,
    siteData,
    panelOverride,
    setPanelOverride,
    setSiteEditorResult,
    savingProfile,
    setSavingProfile,
  } = useUser();

  const { card, border }  = useThemeTokens(isDark);
  const bg     = isDark ? C.dark  : C.light;
  const sub    = isDark ? "#6b9e85" : "#5a7a69";
  const shadow = isDark ? "0 2px 16px #00000040" : "0 2px 12px #0F4C3A08";
  const cs     = { background: card, border: `1.5px solid ${border}`, boxShadow: shadow };

  const [modal,      setModal]      = useState(null);
  const [saved,      setSaved]      = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const openModal = (m) => { setDraft(d => ({ ...d, ...customer })); setModal(m); };
  const closeModal = ()  => setModal(null);
  const saveModal  = ()  => {
    if (draft.loadKw !== customer.loadKw) setPanelOverride(null);
    setCustomer(p => ({ ...p, ...draft }));
    setModal(null);
  };

  // ── Save profile to backend ───────────────────────────────────────────────
  const handleSave = async () => {
    if (draft.loadKw !== customer.loadKw) setPanelOverride(null);
  setCustomer(p => ({ ...p, ...draft }));
    setSavingProfile(true);
    try {
      await api.patch("/api/customer/me", {
        username:       draft.username,
        mobile:         draft.mobile,
        address:        draft.address || draft.locationAddress,
        loadKw:         draft.loadKw,
        sanctionedLoad: draft.sanctionedLoad,
        monthlyBill:    draft.monthlyBill,
        state:          draft.state,
        discom:         draft.discom,
        avatar:         draft.avatar,
        photo: draft.photo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Save site editor result to backend ────────────────────────────────────
  const handleEditorSave = async (result) => {
    try {
      await api.patch("/api/customer/me/site", {
        siteData:      result.siteData,
        panelOverride: result.panelOverride,
        loadKw:        result.loadKw,
      });
      setSiteEditorResult(result);
      setShowEditor(false);
    } catch (err) {
      console.error("Failed to save site:", err);
      alert("Failed to save. Try again.");
    }
  };

  const est = getSolarEst(customer.loadKw, customer.monthlyBill);

  return (
    <div className="min-h-screen font-[font3] transition-colors duration-500" style={{ background: bg }}>

      <Navbar isDark={isDark} toggleMode={toggleMode} />

      <div className="px-5 pb-5 lg:px-8 lg:pb-8 pt-[88px] space-y-6">

        {/* ROW 1 — Hero */}
        <div className="rounded-2xl p-6 lg:p-8" style={cs}>
          <ProfileHero
            customer={customer}
            profileImg={profileImg}
            customerName={customer.username}
            est={est}
            isDark={isDark}
            onLogout={() => { /* wire to auth logout */ }}
          />
        </div>

        {/* ROW 2 — Avatar Picker */}
        <div className="rounded-2xl p-6" style={cs}>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: sub }}>
            Profile Picture
          </p>
          <AvatarPicker
  draft={draft}
  setDraft={setDraft}
  isDark={isDark}
  profileImg={profileImg}
  customerName={customer.username}
/>
        </div>

        {/* ROW 3 — Contact + Electricity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ContactCard     customer={customer} isDark={isDark} onEdit={() => openModal("contact")} />
          <ElectricityCard customer={customer} est={est} isDark={isDark} onEdit={() => openModal("load")} />
        </div>

        {/* ROW 4 — Edit Solar Design CTA */}
        <div className="rounded-2xl p-5" style={cs}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                style={{ background: `${C.green}18`, border: `1.5px solid ${C.green}33` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: isDark ? "#E2E8F0" : "#1A2E25" }}>
                  Solar Roof Design
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: sub }}>
                  Customize obstacle placement, usable roof area, and system load
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold" style={{ color: C.teal }}>{est.panels} panels</span>
                  <span className="text-[9px]" style={{ color: sub }}>·</span>
                  <span className="text-[10px] font-bold" style={{ color: C.green }}>{customer.loadKw} kW load</span>
                  <span className="text-[9px]" style={{ color: sub }}>·</span>
                  <span className="text-[10px] font-bold" style={{ color: "#FACC15" }}>₹{est.netCost.toLocaleString("en-IN")} net cost</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 flex-1 sm:flex-none justify-center"
                style={{ background: C.green, color: "#fff", border: `1.5px solid ${C.green}` }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Design
              </button>
              <button
                onClick={() => navigate("/design")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 flex-1 sm:flex-none justify-center"
                style={{ background: "transparent", color: C.teal, border: `1.5px solid ${C.teal}44` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = isDark ? "rgba(14,116,144,0.12)" : "rgba(14,116,144,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.teal}44`; e.currentTarget.style.background = "transparent"; }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                View 3D
              </button>
            </div>
          </div>
        </div>

        {/* ROW 5 — Save button */}
        <div className="flex justify-end pb-4">
          <button onClick={handleSave} disabled={savingProfile}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all duration-200"
            style={{
              background: saved ? "#16a34a" : C.green,
              color: "#fff",
              border: `1.5px solid ${saved ? "#16a34a" : C.green}`,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            {savingProfile ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Saved!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      <ContactModal  open={modal === "contact"} draft={draft} setDraft={setDraft} onClose={closeModal} onSave={saveModal} isDark={isDark} />
      <LoadModal     open={modal === "load"}    draft={draft} setDraft={setDraft} onClose={closeModal} onSave={saveModal} isDark={isDark} />

      <SiteEditorModal
  open={showEditor}
  siteData={siteData || DEFAULT_SITE_DATA}
  loadKw={customer.loadKw}
  sanctionedLoad={customer.sanctionedLoad}   // ← add this
  panelOverride={panelOverride}
  monthlyBill={customer.monthlyBill}
  isDark={isDark}
  onSave={handleEditorSave}
  onClose={() => setShowEditor(false)}
/>
    </div>
  );
}