// src/components/customer/ProfileHero.jsx
import { C, fmtL, useThemeTokens } from "../design/tokens";
import ProfileAvatar from "./ProfileAvatar";

export default function ProfileHero({ customer, profileImg, est, isDark, onLogout }) {
  const { text, sub, border } = useThemeTokens(isDark);
  const miniBg = isDark ? "#0a1610" : "#f0f7f2";
  const shadow = isDark ? "0 2px 16px #00000040" : "0 2px 12px #0F4C3A08";
  const ms     = { background: miniBg, border: `1.5px solid ${border}`, boxShadow: shadow };

  const StatTile = ({ label, value, unit, color }) => (
    <div className="rounded-2xl p-4" style={ms}>
      <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: sub }}>{label}</p>
      <p className="text-2xl font-bold leading-tight" style={{ color }}>{value}</p>
      {unit && <p className="text-[10px] mt-1" style={{ color: sub }}>{unit}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

      {/* Left — avatar + name + logout */}
      <div className="flex items-center gap-5">
        <ProfileAvatar name={customer.username} profileImg={profileImg} size={80} />
        <div>
          <p className="text-xl font-bold leading-tight" style={{ color: text }}>{customer.username}</p>
          <p className="text-xs font-bold tracking-[0.15em] uppercase mt-1" style={{ color: sub }}>
            {customer.city}, {customer.state} · {customer.pincode}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}/>
            <p className="text-[9px] font-bold tracking-wider uppercase" style={{ color: "#22c55e" }}>
              Active Customer
            </p>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
            style={{ background: "transparent", color: sub, border: `1.5px solid ${border}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border;    e.currentTarget.style.color = sub; }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Right — stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:flex lg:gap-4">
        <StatTile label="Sanctioned Load" value={`${customer.loadKw}`}                               unit="kW"            color={C.green}  />
        <StatTile label="Monthly Bill"    value={`₹${customer.monthlyBill.toLocaleString("en-IN")}`}  unit="avg / month"   color={C.teal}   />
        <StatTile label="Est. Panels"     value={`${est.panels}`}                                    unit="@ 330W each"   color={C.yellow} />
        <StatTile label="Net Cost"        value={fmtL(est.netCost)}                                  unit="after subsidy" color={text}      />
      </div>
    </div>
  );
}