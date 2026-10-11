// src/components/customer/InfoCards.jsx
import { C, useThemeTokens } from "../design/tokens";

// ── Reused inside both cards ──────────────────────────────────────────────
function InfoRow({ label, value, color, isDark }) {
  const { text, sub, border } = useThemeTokens(isDark);
  return (
    <div className="py-3" style={{ borderBottom: `1px solid ${border}` }}>
      <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: sub }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: color || text }}>{value || "—"}</p>
    </div>
  );
}

function EditBtn({ onClick, isDark }) {
  const { sub, border } = useThemeTokens(isDark);
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
      style={{ background: "transparent", color: sub, border: `1.5px solid ${border}` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border;  e.currentTarget.style.color = sub; }}>
      <svg width="11" height="11" viewBox="0 0 18 18" fill="currentColor">
        <path fillRule="evenodd" d="M15.09 2.78c-.88-.88-2.3-.88-3.18 0L4.58 10.12c-.31.31-.52.7-.61 1.12l-.65 3.09c-.05.25.02.51.2.69.18.18.44.26.69.2l3.09-.65c.43-.09.82-.3 1.13-.61l7.33-7.33c.88-.88.88-2.3 0-3.18l-.67-.65zm-2.12 1.06c.29-.29.77-.29 1.06 0l.66.66c.29.29.29.77 0 1.06l-.65.65-1.72-1.72.65-.65zm-1.71 1.72L5.64 11.18c-.1.1-.17.23-.2.37l-.42 1.97 1.97-.42c.14-.03.27-.1.37-.2l5.62-5.62-1.72-1.72z"/>
      </svg>
      Edit
    </button>
  );
}

// ── Contact Card ──────────────────────────────────────────────────────────
export function ContactCard({ customer, isDark, onEdit }) {
  const { sub, card, border } = useThemeTokens(isDark);
  const shadow = isDark ? "0 2px 16px #00000040" : "0 2px 12px #0F4C3A08";

  return (
    <div className="rounded-2xl p-6"
      style={{ background: card, border: `1.5px solid ${border}`, boxShadow: shadow }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: sub }}>Contact Info</p>
        <EditBtn onClick={onEdit} isDark={isDark} />
      </div>
      <InfoRow label="Full Name"     value={customer.username}    isDark={isDark} />
<InfoRow label="Email Address" value={customer.email}   isDark={isDark} />
<InfoRow label="Mobile Number" value={customer.mobile}  isDark={isDark} />
<InfoRow label="Address"       value={customer.address} isDark={isDark} />
<InfoRow label="State"         value={customer.state}   isDark={isDark} />
    </div>
  );
}

// ── Electricity Card ──────────────────────────────────────────────────────
export function ElectricityCard({ customer, est, isDark, onEdit }) {
  const { sub, card, border } = useThemeTokens(isDark);
  const shadow = isDark ? "0 2px 16px #00000040" : "0 2px 12px #0F4C3A08";

  return (
    <div className="rounded-2xl p-6"
      style={{ background: card, border: `1.5px solid ${border}`, boxShadow: shadow }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: sub }}>Electricity Connection</p>
        <EditBtn onClick={onEdit} isDark={isDark} />
      </div>

      <InfoRow label="DISCOM / Provider" value={customer.discom}           color={C.teal}   isDark={isDark} />
      <InfoRow label="Connection Type"   value={customer.connectionType}                    isDark={isDark} />
      <InfoRow label="Sanctioned Load"  value={customer.sanctionedLoad ? `${customer.sanctionedLoad} kW` : "—"} color={C.green}  isDark={isDark} />
<InfoRow label="Avg Monthly Bill" value={customer.monthlyBill ? `₹${Number(customer.monthlyBill).toLocaleString("en-IN")}` : "—"} color={C.yellow} isDark={isDark} />

      {/* Payback bar */}
      <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${border}` }}>
        <div className="flex justify-between mb-2">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: sub }}>Estimated Payback</p>
          <p className="text-[10px] font-bold" style={{ color: C.yellow }}>{est.payback} of 25 yrs</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: border }}>
          <div className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (est.payback / 25) * 100)}%`,
              background: `linear-gradient(90deg, ${C.green}, ${C.yellow})`,
              boxShadow: `0 0 6px ${C.yellow}55`,
            }}/>
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-[9px]" style={{ color: sub }}>Install</p>
          <p className="text-[9px]" style={{ color: "#22c55e" }}>25yr system life</p>
        </div>
      </div>
    </div>
  );
}