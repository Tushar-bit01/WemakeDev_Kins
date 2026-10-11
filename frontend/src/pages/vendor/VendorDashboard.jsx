// src/pages/vendor/VendorDashboard.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { C, useThemeTokens } from "../../components/design/tokens";
import Navbar from "../../components/design/Navbar";
import { useVendor } from "../../context/VendorContext";
import InviteModal from "../../components/vendor/InviteModal";
import energyblack from "../../assets/vendordashboard/energyblack.png";
import energywhite from "../../assets/vendordashboard/energywhite.png";
import activeblack from "../../assets/vendordashboard/activeblack.png";
import activewhite from "../../assets/vendordashboard/activewhite.png";
import customerblack from "../../assets/vendordashboard/customerblack.png";
import customerwhite from "../../assets/vendordashboard/customerwhite.png";
import pendingwhite from "../../assets/vendordashboard/pendingwhite.png";
import pendingblack from "../../assets/vendordashboard/pendingblack.png";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// ─── MOCK DATA COMMENTED OUT ──────────────────────────────────────
// const MOCK_CUSTOMERS = [
//   { id: "c001", name: "Rajesh Kumar", email: "rajesh.kumar@gmail.com", city: "New Delhi", state: "Delhi", load: 3.5, bill: 2800, status: "active", joined: "12 Mar 2025", lastActive: "2 days ago", panels: 11 },
//   { id: "c002", name: "Priya Sharma", email: "priya.s@outlook.com", city: "Gurugram", state: "Haryana", load: 5.0, bill: 4200, status: "active", joined: "18 Mar 2025", lastActive: "5 days ago", panels: 16 },
//   { id: "c003", name: "Vikram Nair", email: "vikramnair@gmail.com", city: "Noida", state: "UP", load: 2.0, bill: 1600, status: "pending", joined: "01 Apr 2025", lastActive: "1 hr ago", panels: 6 },
//   { id: "c004", name: "Sneha Patel", email: "snehap@yahoo.com", city: "Faridabad", state: "Haryana", load: 6.0, bill: 5100, status: "active", joined: "10 Apr 2025", lastActive: "today", panels: 18 },
//   { id: "c005", name: "Amit Joshi", email: "amit.joshi@proton.me", city: "Ghaziabad", state: "UP", load: 4.0, bill: 3300, status: "inactive", joined: "22 Apr 2025", lastActive: "14 days ago", panels: 12 },
//   { id: "c006", name: "Divya Kapoor", email: "divyak@gmail.com", city: "New Delhi", state: "Delhi", load: 3.0, bill: 2400, status: "active", joined: "05 May 2025", lastActive: "3 days ago", panels: 9 },
//   { id: "c007", name: "Rohit Bansal", email: "rohitb@icloud.com", city: "Gurugram", state: "Haryana", load: 8.0, bill: 7200, status: "pending", joined: "14 May 2025", lastActive: "6 hrs ago", panels: 24 },
//   { id: "c008", name: "Meera Iyer", email: "meeraiyer@gmail.com", city: "New Delhi", state: "Delhi", load: 2.5, bill: 2100, status: "active", joined: "20 May 2025", lastActive: "today", panels: 8 },
// ];

const AVATAR_BG = [
  "#0F4C3A",
  "#0E7490",
  "#166534",
  "#0c4a6e",
  "#7c3aed",
  "#b45309",
  "#be123c",
  "#0f766e",
];

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function VendorDashboard() {
  const { isDark, toggleMode } = useTheme();
  const { vendor } = useVendor();
  const { text, sub, card, border } = useThemeTokens(isDark);
  const bg = isDark ? C.dark : C.light;
  const miniBg = isDark ? "#0a1610" : "#f0f7f2";
  const shadow = isDark ? "0 2px 16px #00000040" : "0 2px 12px #0F4C3A08";
  const cs = {
    background: card,
    border: `1.5px solid ${border}`,
    boxShadow: shadow,
  };

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const navigate = useNavigate();

  // ── Fetch customers from backend ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/vendor/me/customers");
        const mapped = res.data.data.map((c) => {
          // Split address into city + state since backend returns one string
          const parts = c.address?.split(",") ?? [];
          const city =
            parts.length >= 2
              ? parts[parts.length - 2].trim()
              : c.address ?? "—";
          const state =
            c.state ??
            (parts.length >= 1 ? parts[parts.length - 1].trim() : "—");
          return {
            ...c,
            city,
            state,
            // Normalize nulls so UI never crashes on math/formatting
            load: c.load ?? 0,
            bill: c.bill ?? 0,
            panels: c.panels ?? 0,
          };
        });
        setCustomers(mapped);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = customers.length;
  const active = customers.filter((c) => c.status === "active").length;
  const pending = customers.filter((c) => c.status === "pending").length;
  const totalKW = customers.reduce((s, c) => s + c.load, 0).toFixed(1);

  // ── sub-components ─────────────────────────────────────────

  const StatusBadge = ({ status }) => {
    const cfg = {
      active: {
        bg: isDark ? "#0f2d1a" : "#dcfce7",
        color: "#22c55e",
        label: "Active",
      },
      pending: {
        bg: isDark ? "#2a2000" : "#fef9c3",
        color: "#ca8a04",
        label: "Pending",
      },
      inactive: {
        bg: isDark ? "#200a0a" : "#fee2e2",
        color: "#ef4444",
        label: "Inactive",
      },
    };
    const s = cfg[status] || cfg.inactive;
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
        style={{ background: s.bg, color: s.color }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }}
        />
        {s.label}
      </span>
    );
  };

  const StatTile = ({
    label,
    value,
    unit,
    color,
    icon,
    iconBg,
    iconBorder,
  }) => (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: miniBg, border: `1.5px solid ${border}` }}
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: iconBg ?? `${color}22`,
          border: `1.5px solid ${iconBorder ?? color + "44"}`,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-[10px] font-bold tracking-wider uppercase mb-0.5"
          style={{ color: sub }}
        >
          {label}
        </p>
        <p className="text-2xl font-bold leading-none" style={{ color }}>
          {value}
        </p>
        {unit && (
          <p className="text-[10px] mt-0.5" style={{ color: sub }}>
            {unit}
          </p>
        )}
      </div>
    </div>
  );

  const FilterBtn = ({ val, label }) => (
    <button
      onClick={() => setStatusFilter(val)}
      className="px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150"
      style={{
        background: statusFilter === val ? C.green : "transparent",
        color: statusFilter === val ? "#fff" : sub,
        border: `1.5px solid ${statusFilter === val ? C.green : border}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="min-h-screen font-[font3] transition-colors duration-500"
      style={{ background: bg }}
    >
      <Navbar isDark={isDark} toggleMode={toggleMode} />

      <div className="px-5 pb-5 lg:px-8 lg:pb-8 pt-[88px] space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: text }}>
              Your Customers
            </h1>
            <p className="text-xs mt-1 font-medium" style={{ color: sub }}>
              {vendor.companyName} · {vendor.serviceArea}
            </p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all duration-200 flex-shrink-0"
            style={{
              background: C.green,
              color: "#fff",
              border: `1.5px solid ${C.green}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Invite Customer
          </button>
        </div>

        {/* STAT TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Total Customers"
            value={total}
            color={C.green}
            icon={
              <img
                src={isDark ? customerwhite : customerblack}
                alt=""
                className="h-[18px] w-[18px] object-contain"
              />
            }
          />
          <StatTile
            label="Active"
            value={active}
            color="#22c55e"
            unit="customers"
            icon={
              <img
                src={isDark ? activewhite : activeblack}
                alt=""
                className="h-[18px] w-[18px] object-contain"
              />
            }
          />
          <StatTile
            label="Pending"
            value={pending}
            color={C.yellow}
            unit="awaiting"
            iconBg={miniBg}
            iconBorder={border}
            icon={
              <img
                src={isDark ? pendingwhite : pendingblack}
                alt=""
                className="h-[18px] w-[18px] object-contain"
              />
            }
          />
          <StatTile
            label="Total Load"
            value={totalKW}
            color={C.teal}
            unit="kW total"
            icon={
              <img
                src={isDark ? energywhite : energyblack}
                alt=""
                className="h-[18px] w-[18px] object-contain"
              />
            }
          />
        </div>

        {/* TABLE CARD */}
        <div className="rounded-2xl overflow-hidden" style={cs}>
          {/* Toolbar */}
          <div
            className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderBottom: `1.5px solid ${border}` }}
          >
            <div className="relative flex-1 max-w-sm">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={sub}
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search name, email, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: miniBg,
                  border: `1.5px solid ${border}`,
                  color: text,
                }}
                onFocus={(e) => (e.target.style.borderColor = C.green)}
                onBlur={(e) => (e.target.style.borderColor = border)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <FilterBtn val="all" label="All" />
              <FilterBtn val="active" label="Active" />
              <FilterBtn val="pending" label="Pending" />
              <FilterBtn val="inactive" label="Inactive" />
            </div>
          </div>

          {/* Column headers */}
          <div
            className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3"
            style={{ borderBottom: `1px solid ${border}` }}
          >
            {[
              "Customer",
              "Email",
              "City",
              "Load / Bill",
              "Status",
              "Joined",
            ].map((h) => (
              <p
                key={h}
                className="text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: sub }}
              >
                {h}
              </p>
            ))}
          </div>

          {/* Loading state */}
          {loadingCustomers && (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: sub }}>
                Loading customers...
              </p>
            </div>
          )}

          {!loadingCustomers && filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: sub }}>
                No customers match your search.
              </p>
            </div>
          )}

          {!loadingCustomers &&
            filtered.map((c, i) => {
              const isLast = i === filtered.length - 1;
              const isExpanded = expandedId === c.id;
              // Backend id is a number, not "c001" string
              const bg_color = AVATAR_BG[(c.id - 1) % AVATAR_BG.length];

              return (
                <div
                  key={c.id}
                  style={{
                    borderBottom: isLast ? "none" : `1px solid ${border}`,
                  }}
                >
                  <div
                    className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center cursor-pointer transition-colors duration-150"
                    style={{
                      background: isExpanded
                        ? isDark
                          ? "#0a1f12"
                          : "#f0faf4"
                        : "transparent",
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    onMouseEnter={(e) => {
                      if (!isExpanded)
                        e.currentTarget.style.background = isDark
                          ? "#0d1f14"
                          : "#f5fbf7";
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: bg_color }}
                      >
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: C.yellow }}
                        >
                          {getInitials(c.name)}
                        </span>
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: text }}
                        >
                          {c.name}
                        </p>
                        <p className="text-[10px]" style={{ color: sub }}>
                          {c.lastActive}
                        </p>
                      </div>
                    </div>

                    <p
                      className="hidden md:block text-xs truncate"
                      style={{ color: sub }}
                    >
                      {c.email}
                    </p>

                    <div className="hidden md:block">
                      <p
                        className="text-xs font-medium"
                        style={{ color: text }}
                      >
                        {c.city}
                      </p>
                      <p className="text-[10px]" style={{ color: sub }}>
                        {c.state}
                      </p>
                    </div>

                    <div className="hidden md:block">
                      <p
                        className="text-sm font-bold"
                        style={{ color: C.green }}
                      >
                        {c.load > 0 ? `${c.load} kW` : "—"}
                      </p>
                      <p className="text-[10px]" style={{ color: sub }}>
                        {c.bill > 0
                          ? `₹${c.bill.toLocaleString("en-IN")}/mo`
                          : "—"}
                      </p>
                    </div>

                    <div className="hidden md:block">
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="hidden md:flex items-center justify-between">
                      <p className="text-[11px]" style={{ color: sub }}>
                        {c.joined}
                      </p>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={sub}
                        strokeWidth="2"
                        style={{
                          transition: "transform 0.2s",
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      className="px-6 pb-5 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-4"
                      style={{
                        borderTop: `1px solid ${border}`,
                        background: isDark ? "#0a1f12" : "#f0faf4",
                      }}
                    >
                      {[
                        {
                          label: "Est. Panels",
                          value:
                            c.panels > 0 ? `${c.panels} panels` : "—",
                          color: C.yellow,
                        },
                        {
                          label: "System Size",
                          value:
                            c.panels > 0
                              ? `${((c.panels * 330) / 1000).toFixed(1)} kWp`
                              : "—",
                          color: C.teal,
                        },
                        {
                          label: "Net Cost Est.",
                          value:
                            c.load > 0
                              ? `₹${(
                                  (c.load * 55000 -
                                    Math.min(c.load * 30000, 78000)) /
                                  100000
                                ).toFixed(1)}L`
                              : "—",
                          color: C.green,
                        },
                        {
                          label: "Monthly Bill",
                          value:
                            c.bill > 0
                              ? `₹${c.bill.toLocaleString("en-IN")}`
                              : "—",
                          color: text,
                        },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          className="rounded-xl p-3"
                          style={{
                            background: isDark ? "#0e2416" : "#e8f5ee",
                            border: `1px solid ${border}`,
                          }}
                        >
                          <p
                            className="text-[9px] font-bold tracking-wider uppercase mb-1"
                            style={{ color: sub }}
                          >
                            {label}
                          </p>
                          <p className="text-sm font-bold" style={{ color }}>
                            {value}
                          </p>
                        </div>
                      ))}

                      <div className="col-span-2 sm:col-span-4 flex gap-3 flex-wrap pt-1">
                        <button
                          onClick={() => navigate(`/vendor/customer/${c.id}`)}
                          className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150"
                          style={{
                            background: C.green,
                            color: "#fff",
                            border: `1.5px solid ${C.green}`,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "0.85")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                        >
                          View Site
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/vendor/customer/${c.id}?print=true`)
                          }
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150"
                          style={{
                            background: "transparent",
                            color: sub,
                            border: `1.5px solid ${border}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = C.teal;
                            e.currentTarget.style.color = C.teal;
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
                            <polyline points="6 9 12 15 18 9" />
                            <path d="M12 3v12M5 20h14" />
                          </svg>
                          Site Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ borderTop: `1.5px solid ${border}` }}
          >
            <p className="text-[11px]" style={{ color: sub }}>
              Showing {filtered.length} of {total} customers
            </p>
            <p className="text-[11px]" style={{ color: sub }}>
              Click any row to expand
            </p>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}