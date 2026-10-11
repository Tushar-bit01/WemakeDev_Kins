// src/pages/vendor/VendorProfile.jsx
import { useTheme } from "../../context/ThemeContext";
import { C, useThemeTokens } from "../../components/design/tokens";
import { useState } from "react";
import Navbar from "../../components/design/Navbar";
import { useVendor } from "../../context/VendorContext";
import ProfileAvatar from "../../components/customer/ProfileAvatar";
import VendorAvatarPicker from "../../components/vendor/VendorAvatarPicker";
import api from "../../api/axios";

// ── All primitives OUTSIDE VendorProfile so they don't remount on every render ──

const InfoRow = ({ label, value, color, border, sub, text }) => (
  <div className="py-3" style={{ borderBottom: `1px solid ${border}` }}>
    <p
      className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1"
      style={{ color: sub }}
    >
      {label}
    </p>
    <p className="text-sm font-medium" style={{ color: color || text }}>
      {value || "—"}
    </p>
  </div>
);

const EditBtn = ({ onClick, sub, border }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
    style={{
      background: "transparent",
      color: sub,
      border: `1.5px solid ${border}`,
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
    <svg width="11" height="11" viewBox="0 0 18 18" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M15.09 2.78c-.88-.88-2.3-.88-3.18 0L4.58 10.12c-.31.31-.52.7-.61 1.12l-.65 3.09c-.05.25.02.51.2.69.18.18.44.26.69.2l3.09-.65c.43-.09.82-.3 1.13-.61l7.33-7.33c.88-.88.88-2.3 0-3.18l-.67-.65zm-2.12 1.06c.29-.29.77-.29 1.06 0l.66.66c.29.29.29.77 0 1.06l-.65.65-1.72-1.72.65-.65zm-1.71 1.72L5.64 11.18c-.1.1-.17.23-.2.37l-.42 1.97 1.97-.42c.14-.03.27-.1.37-.2l5.62-5.62-1.72-1.72z"
      />
    </svg>
    Edit
  </button>
);

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  suffix,
  hint,
  miniBg,
  border,
  sub,
  text,
}) => (
  <div>
    <p
      className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2"
      style={{ color: sub }}
    >
      {label}
    </p>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl text-sm py-3 px-3.5 outline-none transition-colors"
        style={{
          background: miniBg,
          border: `1.5px solid ${border}`,
          color: text,
          paddingRight: suffix ? "3.5rem" : "0.875rem",
        }}
        onFocus={(e) => (e.target.style.borderColor = C.green)}
        onBlur={(e) => (e.target.style.borderColor = border)}
      />
      {suffix && (
        <span
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
          style={{ color: sub }}
        >
          {suffix}
        </span>
      )}
    </div>
    {hint && (
      <p className="mt-1.5 text-[10px]" style={{ color: sub }}>
        {hint}
      </p>
    )}
  </div>
);

const ModalShell = ({
  open,
  title,
  children,
  onClose,
  onSave,
  border,
  text,
  sub,
  card,
  shadow,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: card,
          border: `1.5px solid ${border}`,
          boxShadow: shadow,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-base font-bold" style={{ color: text }}>
            {title}
          </p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: sub, border: `1.5px solid ${border}` }}
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
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
        <div className="flex justify-end gap-3 pt-5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
            style={{
              background: "transparent",
              color: sub,
              border: `1.5px solid ${border}`,
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
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
            style={{
              background: C.green,
              color: "#fff",
              border: `1.5px solid ${C.green}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, unit, color, miniBg, border, sub }) => (
  <div
    className="rounded-2xl p-4"
    style={{ background: miniBg, border: `1.5px solid ${border}` }}
  >
    <p
      className="text-[10px] font-bold tracking-wider uppercase mb-1"
      style={{ color: sub }}
    >
      {label}
    </p>
    <p className="text-2xl font-bold leading-tight" style={{ color }}>
      {value}
    </p>
    {unit && (
      <p className="text-[10px] mt-1" style={{ color: sub }}>
        {unit}
      </p>
    )}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function VendorProfile() {
  const { isDark, toggleMode } = useTheme();
  const { text, sub, card, border } = useThemeTokens(isDark);
  const bg = isDark ? C.dark : C.light;
  const miniBg = isDark ? "#0a1610" : "#f0f7f2";
  const shadow = isDark ? "0 2px 16px #00000040" : "0 2px 12px #0F4C3A08";
  const cs = {
    background: card,
    border: `1.5px solid ${border}`,
    boxShadow: shadow,
  };

  const {
    vendor,
    setVendor,
    draft,
    setDraft,
    profileImg,
    savingProfile,
    setSavingProfile,
  } = useVendor();

  const [modal, setModal] = useState(null); // "company"|"contact"|"ops"
  const [saved, setSaved] = useState(false);

  const openModal = (m) => {
    setDraft({ ...vendor });
    setModal(m);
  };
  const closeModal = () => setModal(null);
  const saveModal = () => {
    setVendor({ ...draft });
    setModal(null);
  };

  // ── Big Save — commits draft + calls backend ─────────────────────────────
  const handleSave = async () => {
    setVendor({ ...draft });
    setSavingProfile(true);
    try {
      await api.patch("/api/vendor/me", {
        contactName: draft.contactName,
        mobile: draft.phone,
        city: draft.city,
        state: draft.state,
        pincode: draft.pincode,
        serviceArea: draft.serviceArea,
        yearsActive: draft.yearsActive,
        teamSize: draft.teamSize,
        avgInstallKW: draft.avgInstallKW,
        avatar: draft.avatar,
        photo: draft.photo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save vendor profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  // shared props bundles to avoid repetition
  const themeProps = { border, sub, text };
  const fieldProps = { border, sub, text, miniBg };
  const modalProps = { border, sub, text, card, shadow };

  return (
    <div
      className="min-h-screen font-[font3] transition-colors duration-500"
      style={{ background: bg }}
    >
      <Navbar isDark={isDark} toggleMode={toggleMode} />

      <div className="px-5 pb-5 lg:px-8 lg:pb-8 pt-[88px] space-y-6">
        {/* ROW 1 — Hero */}
        <div className="rounded-2xl p-6 lg:p-8" style={cs}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <ProfileAvatar
                name={vendor.companyName}
                profileImg={profileImg}
                size={80}
              />
              <div>
                <p
                  className="text-xl font-bold leading-tight"
                  style={{ color: text }}
                >
                  {vendor.companyName}
                </p>
                <p
                  className="text-xs font-bold tracking-[0.15em] uppercase mt-1"
                  style={{ color: sub }}
                >
                  {vendor.city}, {vendor.state} · {vendor.pincode}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: "#22c55e",
                      boxShadow: "0 0 6px #22c55e",
                    }}
                  />
                  <p
                    className="text-[9px] font-bold tracking-wider uppercase"
                    style={{ color: "#22c55e" }}
                  >
                    Verified Vendor
                  </p>
                </div>
                <button
                  className="flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
                  style={{
                    background: "transparent",
                    color: sub,
                    border: `1.5px solid ${border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ef4444";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.color = sub;
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:flex lg:gap-4">
              <StatTile
                label="State"
                value={vendor.state}
                unit="location"
                color={C.green}
                miniBg={miniBg}
                border={border}
                sub={sub}
              />
              <StatTile
                label="Discom"
                value={vendor.discom}
                unit="utility"
                color={C.teal}
                miniBg={miniBg}
                border={border}
                sub={sub}
              />
              <StatTile
                label="Panel"
                value={vendor.defaultPanelWattage}
                unit="default"
                color={C.yellow}
                miniBg={miniBg}
                border={border}
                sub={sub}
              />
              <StatTile
                label="Portal ID"
                value={vendor.nationalPortalVendorId || "—"}
                unit="MNRE"
                color={text}
                miniBg={miniBg}
                border={border}
                sub={sub}
              />
            </div>
          </div>
        </div>

        {/* ROW 2 — Avatar / Logo Picker */}
        <div className="rounded-2xl p-6" style={cs}>
          <p
            className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6"
            style={{ color: sub }}
          >
            Company Logo / Avatar
          </p>
          <VendorAvatarPicker
            draft={draft}
            setDraft={setDraft}
            isDark={isDark}
            profileImg={profileImg}
            vendorName={vendor.companyName}
          />
        </div>

        {/* ROW 3 — Three info cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Company Info */}
          <div className="rounded-2xl p-6" style={cs}>
            <div className="flex items-center justify-between mb-5">
              <p
                className="text-[10px] font-bold tracking-[0.2em] uppercase"
                style={{ color: sub }}
              >
                Company Info
              </p>
            </div>
            <InfoRow
              label="Company Name"
              value={vendor.companyName}
              {...themeProps}
            />
            <InfoRow
              label="GST Number"
              value={vendor.gstNumber}
              color={C.teal}
              {...themeProps}
            />
            <InfoRow
              label="National Portal ID"
              value={vendor.nationalPortalVendorId}
              color={C.green}
              {...themeProps}
            />
            <InfoRow
              label="Service Area"
              value={vendor.serviceArea}
              color={C.green}
              {...themeProps}
            />
          </div>

          {/* Contact Info */}
          <div className="rounded-2xl p-6" style={cs}>
            <div className="flex items-center justify-between mb-5">
              <p
                className="text-[10px] font-bold tracking-[0.2em] uppercase"
                style={{ color: sub }}
              >
                Contact Info
              </p>
              <EditBtn
                onClick={() => openModal("contact")}
                sub={sub}
                border={border}
              />
            </div>
            <InfoRow
              label="Contact Person"
              value={vendor.contactName}
              {...themeProps}
            />
            <InfoRow
              label="Email Address"
              value={vendor.email}
              {...themeProps}
            />
            <InfoRow
              label="Phone Number"
              value={vendor.phone}
              {...themeProps}
            />
            <InfoRow
              label="City / State"
              value={
                [vendor.city, vendor.state].filter(Boolean).join(", ") || "—"
              }
              {...themeProps}
            />
            <InfoRow label="Pincode" value={vendor.pincode} {...themeProps} />
          </div>

          {/* Operations */}
          <div className="rounded-2xl p-6" style={cs}>
            <div className="flex items-center justify-between mb-5">
              <p
                className="text-[10px] font-bold tracking-[0.2em] uppercase"
                style={{ color: sub }}
              >
                Operations
              </p>
              <EditBtn
                onClick={() => openModal("ops")}
                sub={sub}
                border={border}
              />
            </div>
            <InfoRow
              label="Years Active"
              value={vendor.yearsActive ? `${vendor.yearsActive} years` : "—"}
              {...themeProps}
            />
            <InfoRow
              label="Team Size"
              value={vendor.teamSize ? `${vendor.teamSize} engineers` : "—"}
              color={C.teal}
              {...themeProps}
            />
            <InfoRow
              label="Avg Install Size"
              value={vendor.avgInstallKW ? `${vendor.avgInstallKW} kW` : "—"}
              color={C.green}
              {...themeProps}
            />
            <InfoRow
              label="Service Area"
              value={vendor.serviceArea}
              {...themeProps}
            />
          </div>
        </div>

        {/* ROW 4 — Save */}
        <div className="flex justify-end pb-4">
          <button
            onClick={handleSave}
            disabled={savingProfile}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all duration-200"
            style={{
              background: saved ? "#16a34a" : C.green,
              color: "#fff",
              border: `1.5px solid ${saved ? "#16a34a" : C.green}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {savingProfile ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved!
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Modals ── */}

      <ModalShell
        open={modal === "contact"}
        title="Edit Contact Info"
        onClose={closeModal}
        onSave={saveModal}
        {...modalProps}
      >
        <div className="space-y-4">
          <Field
            label="Contact Person"
            value={draft.contactName || ""}
            onChange={(v) => setDraft((d) => ({ ...d, contactName: v }))}
            {...fieldProps}
          />
          <Field
            label="Phone Number"
            value={draft.phone || ""}
            onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
            type="tel"
            {...fieldProps}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="City"
              value={draft.city || ""}
              onChange={(v) => setDraft((d) => ({ ...d, city: v }))}
              {...fieldProps}
            />
            <Field
              label="State"
              value={draft.state || ""}
              onChange={(v) => setDraft((d) => ({ ...d, state: v }))}
              {...fieldProps}
            />
          </div>
          <Field
            label="Pincode"
            value={draft.pincode || ""}
            onChange={(v) => setDraft((d) => ({ ...d, pincode: v }))}
            {...fieldProps}
          />
        </div>
      </ModalShell>

      <ModalShell
        open={modal === "ops"}
        title="Edit Operations Info"
        onClose={closeModal}
        onSave={saveModal}
        {...modalProps}
      >
        <div className="space-y-4">
          <Field
            label="Years in Business"
            value={draft.yearsActive || ""}
            onChange={(v) => setDraft((d) => ({ ...d, yearsActive: v }))}
            type="number"
            suffix="yrs"
            {...fieldProps}
          />
          <Field
            label="Team Size"
            value={draft.teamSize || ""}
            onChange={(v) => setDraft((d) => ({ ...d, teamSize: v }))}
            type="number"
            suffix="ppl"
            {...fieldProps}
          />
          <Field
            label="Avg Install Size"
            value={draft.avgInstallKW || ""}
            onChange={(v) => setDraft((d) => ({ ...d, avgInstallKW: v }))}
            type="number"
            suffix="kW"
            hint="Average system size you install"
            {...fieldProps}
          />
          <Field
            label="Service Area"
            value={draft.serviceArea || ""}
            onChange={(v) => setDraft((d) => ({ ...d, serviceArea: v }))}
            hint="e.g. Delhi NCR, Haryana, UP West"
            {...fieldProps}
          />
        </div>
      </ModalShell>
    </div>
  );
}
