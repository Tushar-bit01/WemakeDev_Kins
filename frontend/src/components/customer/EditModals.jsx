// src/components/customer/EditModals.jsx
import { C, useThemeTokens } from "../design/tokens";

// ── Shared: Field input ───────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", prefix, suffix, hint, isDark }) {
  const { text, sub, border } = useThemeTokens(isDark);
  const miniBg = isDark ? "#0a1610" : "#f0f7f2";
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: sub }}>{label}</p>
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: sub }}>{prefix}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl text-sm py-3 outline-none transition-colors"
          style={{
            background: miniBg, border: `1.5px solid ${border}`, color: text,
            paddingLeft: prefix ? "2rem" : "0.875rem",
            paddingRight: suffix ? "3.5rem" : "0.875rem",
          }}
          onFocus={e => e.target.style.borderColor = C.green}
          onBlur={e  => e.target.style.borderColor = border} />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: sub }}>{suffix}</span>}
      </div>
      {hint && <p className="mt-1.5 text-[10px]" style={{ color: sub }}>{hint}</p>}
    </div>
  );
}

// ── Shared: Modal shell ───────────────────────────────────────────────────
function ModalShell({ open, title, onClose, onSave, isDark, children }) {
  const { text, sub, card, border } = useThemeTokens(isDark);
  const shadow = isDark ? "0 2px 16px #00000040" : "0 2px 12px #0F4C3A08";
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: card, border: `1.5px solid ${border}`, boxShadow: shadow }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-base font-bold" style={{ color: text }}>{title}</p>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: sub, border: `1.5px solid ${border}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border;  e.currentTarget.style.color = sub; }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {children}
        <div className="flex justify-end gap-3 pt-5">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
            style={{ background: "transparent", color: sub, border: `1.5px solid ${border}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border;  e.currentTarget.style.color = sub; }}>
            Cancel
          </button>
          <button onClick={onSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
            style={{ background: C.green, color: "#fff", border: `1.5px solid ${C.green}` }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contact Modal ─────────────────────────────────────────────────────────
export function ContactModal({ open, draft, setDraft, onClose, onSave, isDark }) {
  const setD = (k) => (v) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <ModalShell open={open} title="Edit Contact Info" onClose={onClose} onSave={onSave} isDark={isDark}>
      <div className="space-y-4">
      <Field label="Full Name"     value={draft.username    || ""} onChange={setD("username")}    isDark={isDark} />
        <Field label="Mobile Number" value={draft.mobile  || ""} onChange={setD("mobile")}  isDark={isDark} type="tel" />
        <Field label="Address"  value={draft.address || ""} onChange={setD("address")} isDark={isDark} />
        <Field label="State"    value={draft.state   || ""} onChange={setD("state")}   isDark={isDark} />
      </div>
    </ModalShell>
  );
}

// ── Load / Electricity Modal ──────────────────────────────────────────────
export function LoadModal({ open, draft, setDraft, onClose, onSave, isDark }) {
  return (
    <ModalShell open={open} title="Edit Electricity Details" onClose={onClose} onSave={onSave} isDark={isDark}>
      <div className="space-y-4">
        <Field label="DISCOM / Provider" value={draft.discom || ""}
          onChange={v => setDraft(d => ({ ...d, discom: v }))}
          isDark={isDark} hint="e.g. BSES Rajdhani, TPDDL, MSEDCL" />
        <Field label="Connection Type" value={draft.connectionType || ""}
          onChange={v => setDraft(d => ({ ...d, connectionType: v }))}
          isDark={isDark} hint="e.g. LT Domestic, LT Commercial" />
        <Field label="Sanctioned Load" value={String(draft.sanctionedLoad || "")}
  onChange={v => setDraft(d => ({ ...d, sanctionedLoad: parseFloat(v) || 0 }))}
  isDark={isDark} type="number" suffix="kW" hint="From your electricity bill" />
        <Field label="Avg Monthly Bill" value={String(draft.monthlyBill || "")}
          onChange={v => setDraft(d => ({ ...d, monthlyBill: parseInt(v) || 0 }))}
          isDark={isDark} type="number" prefix="₹" hint="Used to estimate savings" />
      </div>
    </ModalShell>
  );
}