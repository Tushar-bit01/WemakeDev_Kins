// src/components/customer/SiteEditorModal.jsx
import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import solarpanelblack from "../../assets/customer/solarpanelblack.png";
import solarpanelwhite from "../../assets/customer/solarpanelwhite.png";

const C = {
  green: "#22c55e",
  teal: "#4fc3f7",
  orange: "#f97316",
  red: "#ef4444",
  yellow: "#facc15",
};

function tok(dark) {
  return {
    text: dark ? "#e2e8f0" : "#0f2419",
    sub: dark ? "#5a8a6e" : "#4a6b58",
    card: dark ? "#080f0a" : "#f8fdf9",
    border: dark ? "rgba(34,197,94,0.10)" : "rgba(15,76,58,0.10)",
    chip: dark ? "rgba(34,197,94,0.04)" : "rgba(15,76,58,0.035)",
    glass: dark ? "rgba(13,24,16,0.96)" : "rgba(248,253,249,0.97)",
  };
}

const PW = 1.65,
  PH = 1.0,
  WPP = 330;
const TILT = (10 * Math.PI) / 180;
const LAT = 28.6139;
const PR = 0.75,
  SAFE = 0.5,
  GAP = 0.06;
const DC_AC_RATIO = 1.2; // 👈 20% Overpaneling logic preserved
const WIN_ALT = ((90 - LAT - 23.45) * Math.PI) / 180;
const ROW_PITCH =
  PH * Math.cos(TILT) + (PH * Math.sin(TILT)) / Math.tan(WIN_ALT);
const ROW_GAP = ROW_PITCH - PH;
const LP = PW * Math.cos(TILT) + (PW * Math.sin(TILT)) / Math.tan(WIN_ALT);
const LG = LP - PW;
const PSH = [
  3.63, 4.93, 6.11, 6.68, 6.87, 6.13, 4.77, 4.83, 5.27, 5.64, 4.31, 3.34,
];
const SOIL = [
  0.94, 0.94, 0.93, 0.92, 0.88, 0.92, 0.96, 0.97, 0.96, 0.94, 0.93, 0.94,
];
const CLIP = [
  0.98, 0.97, 0.95, 0.94, 0.93, 0.94, 0.96, 0.96, 0.95, 0.96, 0.97, 0.98,
];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function sunPos(minFromMidnight) {
  const h = minFromMidnight / 60;
  const hourAngle = (h - 12) * 15 * (Math.PI / 180);
  const decl = 13 * (Math.PI / 180);
  const latRad = LAT * (Math.PI / 180);
  const sinElev =
    Math.sin(latRad) * Math.sin(decl) +
    Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle);
  const elevRad = Math.asin(Math.max(-1, Math.min(1, sinElev)));
  const elevDeg = elevRad * (180 / Math.PI);
  const cosAz =
    (Math.sin(decl) - Math.sin(latRad) * sinElev) /
    (Math.cos(latRad) * (Math.cos(elevRad) + 1e-9));
  let azS = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (h > 12) azS = 2 * Math.PI - azS;
  const azN = (azS + Math.PI) % (2 * Math.PI);
  return {
    elevDeg: Math.max(0, elevDeg),
    elevRad: Math.max(0, elevRad),
    azN,
    isDay: elevDeg > 1,
  };
}

function computeShadows(panels, allObs, sunMins) {
  const sun = sunPos(sunMins);
  if (!sun.isDay) return panels.map(() => false);
  const shadowDir = (sun.azN + Math.PI) % (2 * Math.PI);
  return panels.map((panel) => {
    if (!panel.on) return false;
    return allObs.some((obs) => {
      const h = obs.height ?? 0.8;
      if (h <= 0) return false;
      const xs = obs.points.map((p) => p.x),
        zs = obs.points.map((p) => p.z);
      const ox = (Math.min(...xs) + Math.max(...xs)) / 2,
        oz = (Math.min(...zs) + Math.max(...zs)) / 2;
      const shadowLen = h / Math.tan(Math.max(sun.elevRad, 0.05));
      const obsHalfW = (Math.max(...xs) - Math.min(...xs)) / 2 + 0.25;
      const dx = panel.x - ox,
        dz = panel.z - oz;
      const along = dx * Math.sin(shadowDir) + dz * Math.cos(shadowDir);
      const perp = dx * Math.cos(shadowDir) - dz * Math.sin(shadowDir);
      return (
        along > -0.2 && along < shadowLen + 0.2 && Math.abs(perp) < obsHalfW
      );
    });
  });
}

function inPoly(px, pz, poly) {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      zi = poly[i].z,
      xj = poly[j].x,
      zj = poly[j].z;
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi)
      r = !r;
  }
  return r;
}

function placePanels(fp, obstacles, maxCount = Infinity) {
  const obs = (obstacles || []).map((o) => {
    const xs = o.points.map((p) => p.x),
      zs = o.points.map((p) => p.z);
    return {
      x0: Math.min(...xs) - SAFE,
      x1: Math.max(...xs) + SAFE,
      z0: Math.min(...zs) - SAFE,
      z1: Math.max(...zs) + SAFE,
    };
  });
  const blocked = (px, pz, pw, ph) => {
    const hw = pw / 2,
      hh = ph / 2;
    return obs.some(
      (b) =>
        px - hw < b.x1 && px + hw > b.x0 && pz - hh < b.z1 && pz + hh > b.z0
    );
  };
  const fxs = fp.map((p) => p.x),
    fzs = fp.map((p) => p.z);
  const x0 = Math.min(...fxs),
    z0 = Math.min(...fzs);
  const sw = Math.max(...fxs) - x0,
    sh = Math.max(...fzs) - z0;
  function scan(pw, ph, rg, ox, oz) {
    const cp = pw + GAP,
      rp = ph + rg,
      out = [];
    for (let c = 0; c * cp < sw + pw; c++)
      for (let r = 0; r * rp < sh + ph; r++) {
        const x = x0 + ox + c * cp + pw / 2,
          z = z0 + oz + r * rp + ph / 2;
        const hw = pw / 2,
          hh = ph / 2;
        if (
          ![
            [x - hw, z - hh],
            [x + hw, z - hh],
            [x - hw, z + hh],
            [x + hw, z + hh],
          ].every(([cx, cz]) => inPoly(cx, cz, fp))
        )
          continue;
        if (blocked(x, z, pw, ph)) continue;
        out.push({ x, z, pw, ph });
      }
    return out;
  }
  let best = [];
  [
    { pw: PW, ph: PH, rg: ROW_GAP },
    { pw: PH, ph: PW, rg: LG },
  ].forEach(({ pw, ph, rg }) => {
    for (let si = 0; si < 16; si++)
      for (let sj = 0; sj < 16; sj++) {
        const r = scan(
          pw,
          ph,
          rg,
          (si / 16) * (pw + GAP),
          (sj / 16) * (ph + rg)
        );
        if (r.length > best.length) best = r;
      }
  });
  if (best.length > maxCount) best = best.slice(0, maxCount);
  return best.map((p) => ({ ...p, on: true }));
}

// ── NEW LOGIC: Heuristic Sorting ──
function shadowScore(panel, allObs) {
  let score = 0;
  // This function is kept for fallback, but we use the custom distance heuristic inside optimizePanels
  return score; 
}

function calcFin(n) {
  if (!n)
    return {
      kw: 0,
      monthly: 0,
      netCost: 0,
      payback: 0,
      lifetime: 0,
      co2: 0,
      sub: 0,
      annual: 0,
      rate: 5,
      monthlyArr: Array(12).fill(0),
    };
  const kw = (n * WPP) / 1000;
  let y1 = 0;
  const monthlyArr = [];
  for (let m = 0; m < 12; m++) {
    const days = new Date(2025, m + 1, 0).getDate();
    const mk = PSH[m] * PR * SOIL[m] * CLIP[m] * days * kw;
    monthlyArr.push(Math.round(mk));
    y1 += mk;
  }
  const avg = y1 / 12,
    tr = avg <= 200 ? 3 : avg <= 400 ? 5 : avg <= 800 ? 6.5 : 7;
  const sb =
    kw <= 2
      ? Math.round(kw * 30000)
      : kw <= 3
      ? Math.round(60000 + (kw - 2) * 18000)
      : 78000;
  const nc = Math.round(kw * 55000 - sb),
    as = avg * 12 * tr,
    pb = as > 0 ? +(nc / as).toFixed(1) : 0;
  let life = 0,
    lk = 0;
  for (let y = 1; y <= 25; y++) {
    const d = y === 1 ? 0.98 : 0.98 * Math.pow(0.995, y - 1);
    const yk = y1 * d;
    lk += yk;
    life += yk * tr * Math.pow(1.05, y - 1);
  }
  return {
    kw: +kw.toFixed(2),
    monthly: Math.round(avg * tr),
    netCost: nc,
    payback: pb,
    lifetime: Math.round(life),
    co2: +((lk * 0.708) / 1000).toFixed(1),
    sub: Math.round(sb),
    annual: Math.round(y1),
    rate: tr,
    monthlyArr,
  };
}
const fmtR = (n) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${n.toLocaleString("en-IN")}`;

const PAD = 36;
function w2p(x, z, b, W, H) {
  const s = Math.min(
    (W - PAD * 2) / (b.maxX - b.minX),
    (H - PAD * 2) / (b.maxZ - b.minZ)
  );
  const oX = PAD + (W - PAD * 2 - (b.maxX - b.minX) * s) / 2,
    oZ = PAD + (H - PAD * 2 - (b.maxZ - b.minZ) * s) / 2;
  return { px: oX + (x - b.minX) * s, py: oZ + (z - b.minZ) * s, s };
}
function p2w(px, py, b, W, H) {
  const s = Math.min(
    (W - PAD * 2) / (b.maxX - b.minX),
    (H - PAD * 2) / (b.maxZ - b.minZ)
  );
  const oX = PAD + (W - PAD * 2 - (b.maxX - b.minX) * s) / 2,
    oZ = PAD + (H - PAD * 2 - (b.maxZ - b.minZ) * s) / 2;
  return { x: (px - oX) / s + b.minX, z: (py - oZ) / s + b.minZ };
}

function ArcGauge({ pct, size = 52, color, label, value, dark }) {
  const T = tok(dark);
  const r = 18,
    cx = size / 2,
    cy = size / 2 + 4;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, pct) * circ * 0.75;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} strokeWidth="3" strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.5s ease" }} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="9" fontWeight="800" fontFamily="system-ui">{value}</text>
      </svg>
      <span style={{ fontSize: 7.5, color: T.sub, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function AreaChart({ data, dark, color, height = 64 }) {
  const W = 210,
    H = height;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (W - 2) + 1,
    y: H - 2 - (v / max) * (H - 10),
  }));
  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return acc + ` C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }, "");
  const areaPath =
    linePath + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const gradId = `ag${color.replace("#", "")}${dark ? 1 : 0}`;
  const peakIdx = data.indexOf(Math.max(...data));
  const peakPt = pts[peakIdx];
  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={dark ? 0.28 : 0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" opacity={0.9} />
        <circle cx={peakPt.x} cy={peakPt.y} r="3.5" fill={color} stroke={dark ? "#080f0a" : "#f8fdf9"} strokeWidth="1.5" />
        <line x1="0" y1={H} x2={W} y2={H} stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"} strokeWidth="1" />
        {[0, 3, 6, 9, 11].map((i) => (
          <text key={i} x={pts[i].x} y={H + 9} textAnchor="middle" fontSize="6.5" fill={dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"} fontFamily="system-ui">
            {MONTHS[i]}
          </text>
        ))}
      </svg>
      <div style={{ position: "absolute", left: `calc(${(peakPt.x / W) * 100}% - 18px)`, top: peakPt.y - 22, fontSize: 7, fontWeight: 700, color, background: dark ? "rgba(8,15,10,0.88)" : "rgba(248,253,249,0.92)", border: `1px solid ${color}33`, borderRadius: 5, padding: "1px 5px", pointerEvents: "none", whiteSpace: "nowrap" }}>
        {data[peakIdx].toLocaleString()} kWh
      </div>
    </div>
  );
}

function PaybackBar({ payback, dark }) {
  const T = tok(dark);
  const total = 25;
  const pct = Math.min(payback / total, 1);
  const color = C.green;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 8, color: T.sub, fontWeight: 600 }}>Investment recovery</span>
        <span style={{ fontSize: 8, color: T.text, fontWeight: 700 }}>{payback} yr breakeven</span>
      </div>
      <div style={{ position: "relative", height: 18 }}>
        <div style={{ position: "absolute", inset: "6px 0", borderRadius: 99, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)" }} />
        <div style={{ position: "absolute", top: 6, bottom: 6, left: `${pct * 100}%`, right: 0, borderRadius: "0 99px 99px 0", background: dark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.10)" }} />
        <div style={{ position: "absolute", top: 6, bottom: 6, left: 0, width: `${pct * 100}%`, borderRadius: "99px 0 0 99px", background: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)", transition: "width 0.5s ease" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pct * 100}%`, width: 2, borderRadius: 1, background: color, boxShadow: `0 0 6px ${color}88`, transition: "left 0.5s ease" }} />
        {[5, 10, 15, 20].map((y) => (
          <div key={y} style={{ position: "absolute", top: 6, bottom: 6, left: `${(y / total) * 100}%`, width: 1, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 7, color: T.sub }}>now</span>
        <span style={{ fontSize: 7, color: C.green, fontWeight: 600 }}>profit →</span>
        <span style={{ fontSize: 7, color: T.sub }}>25yr</span>
      </div>
    </div>
  );
}

function SunOutputGauge({ pct, liveKw, elevDeg, dark }) {
  const T = tok(dark);
  const W = 210,
    cx = 105,
    cy = 88,
    R = 68,
    stroke = 9;
  const circ = Math.PI * R;
  const dash = Math.max(0, pct) * circ;
  const color = C.yellow;
  const angleRad = Math.PI * (1 - pct);
  const sx = cx - R * Math.cos(angleRad),
    sy = cy - R * Math.sin(angleRad);
  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <svg width="100%" viewBox={`0 ${cy - R - 16} ${W} ${R + stroke + 24}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="sungrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.yellow} stopOpacity="0.6" />
            <stop offset="100%" stopColor={C.orange} stopOpacity="0.9" />
          </linearGradient>
          <filter id="sunglow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"} strokeWidth={stroke} strokeLinecap="round" />
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="url(#sungrad)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.4s ease" }} />
        {pct > 0.02 && (
          <>
            <circle cx={sx} cy={sy} r={12} fill={color} opacity={0.15} filter="url(#sunglow)" />
            <circle cx={sx} cy={sy} r={5} fill={color} stroke={dark ? "#080f0a" : "#f8fdf9"} strokeWidth={1.5} />
          </>
        )}
        <line x1={cx - R - 8} y1={cy} x2={cx + R + 8} y2={cy} stroke={dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth={1} strokeDasharray="3 4" />
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="22" fontWeight="800" fill={dark ? "#e2e8f0" : "#0f2419"} fontFamily="system-ui" style={{ fontVariantNumeric: "tabular-nums" }}>{liveKw}</text>
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill={dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"} fontFamily="system-ui">kW live output</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="8" fontWeight="600" fill={C.yellow} fontFamily="system-ui">{elevDeg}° elevation</text>
      </svg>
    </div>
  );
}

export default function SiteEditorModal({
  open,
  siteData,
  loadKw,
  sanctionedLoad, // 👈 NEW PROP INCLUDED
  panelOverride: initialOverride,
  isDark,
  onSave,
  onClose,
}) {
  const T = tok(isDark);
  const bdr = `1px solid ${T.border}`;

  // ── Responsive ────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const [panels, setPanels] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [tool, setTool] = useState("panel");
  const [hovIdx, setHovIdx] = useState(null);
  const [sunMins, setSunMins] = useState(720);
  const [sunMode, setSunMode] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [sideTab, setSideTab] = useState("finance");

  const cvRef = useRef(null),
    drag = useRef(null),
    pRef = useRef([]),
    oRef = useRef([]);
  useEffect(() => { pRef.current = panels; }, [panels]);
  useEffect(() => { oRef.current = obstacles; }, [obstacles]);
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 400);
    return () => clearTimeout(t);
  }, [panels]);

  const bounds = useMemo(() => {
    if (!siteData) return { minX: 0, maxX: 10, minZ: 0, maxZ: 8 };
    const xs = siteData.roof_polygon.map((p) => p.x),
      zs = siteData.roof_polygon.map((p) => p.z);
    return { minX: Math.min(...xs) - 2, maxX: Math.max(...xs) + 2, minZ: Math.min(...zs) - 2, maxZ: Math.max(...zs) + 2 };
  }, [siteData]);

  // ── NEW LOGIC: LIMIT CALCULATIONS ──
  const roofMaxPanels = useMemo(() => {
    if (!siteData) return 20;
    const allObs = [
      ...(siteData.obstacles || []),
      ...(siteData.upper_roofs || []).map((ur) => ({ height: 1.2, points: ur.footprint })),
    ];
    const main = placePanels(siteData.free_space_polygon, allObs);
    const up = (siteData.upper_roofs || []).flatMap((ur) => placePanels(ur.free_space, ur.obstacles || []));
    return main.length + up.length;
  }, [siteData]);

  const sancMaxPanels = sanctionedLoad ? Math.floor((sanctionedLoad * DC_AC_RATIO * 1000) / WPP) : Infinity;
  const absoluteMaxPanels = Math.min(roofMaxPanels, sancMaxPanels);
  
  const roofMaxKw = +((roofMaxPanels * WPP) / 1000).toFixed(2);
  const sliderMaxKw = +((absoluteMaxPanels * WPP) / 1000).toFixed(2);

  const activeCount = useMemo(() => panels.filter((p) => p.on).length, [panels]);
  const activeKw = useMemo(() => +((activeCount * WPP) / 1000).toFixed(2), [activeCount]);
  const fin = useMemo(() => calcFin(activeCount), [activeCount]);

  const allObsForShadow = useMemo(
    () => [
      ...(obstacles || []),
      ...(siteData?.upper_roofs || []).map((ur) => ({ height: 2.75, points: ur.footprint })),
    ],
    [obstacles, siteData]
  );

  const shadowMap = useMemo(() => {
    if (!sunMode) return panels.map(() => false);
    return computeShadows(panels, allObsForShadow, sunMins);
  }, [panels, allObsForShadow, sunMins, sunMode]);
  const shadedCount = shadowMap.filter(Boolean).length;

  // ── NEW LOGIC: LAYOUT ENGINE (Auto-Fit) ──
  const buildLayout = useCallback((sd, currentObs, activeN) => {
    if (!sd) return;
    const allObs = [
      ...(currentObs || []),
      ...(sd.upper_roofs || []).map((ur) => ({ height: 2.75, points: ur.footprint })),
    ];
    const main = placePanels(sd.free_space_polygon, allObs);
    const up = (sd.upper_roofs || []).flatMap((ur) => placePanels(ur.free_space, ur.obstacles || []));
    const all = [...main, ...up];
    const want = activeN != null ? Math.min(activeN, all.length) : all.length;
    setPanels(all.map((p, i) => ({ ...p, on: i < want })));
  }, []);

  // ── NEW LOGIC: OPTIMISE ENGINE (Global Score + Upper Roof Bonus) ──
  // ── NEW LOGIC: OPTIMISE ENGINE (Global Score + Respects Slider Value) ──
  const optimizePanels = useCallback(() => {
    const allObs = [
      ...(oRef.current || []).map(o => ({ ...o, isUpperRoof: false })),
      ...(siteData.upper_roofs || []).map((ur) => ({ height: 2.75, points: ur.footprint, isUpperRoof: true })),
    ];

    setPanels(prev => {
       // 👈 FIXED: Pehle current active panels (slider value) count karo
       const currentActiveCount = prev.filter(p => p.on).length;

       const scored = prev.map(p => {
          let minDist = Infinity;
          let isOnUpperRoof = false;

          if (allObs.length === 0) minDist = 1000;
          else {
            allObs.forEach(ob => {
              const inside = inPoly(p.x, p.z, ob.points);
              // Agar ye obstacle ek upper roof hai, aur panel uske upar hai, toh isko obstacle mat maano
              if (ob.isUpperRoof && inside) {
                isOnUpperRoof = true;
                return;
              }

              const xs = ob.points.map((pt) => pt.x), zs = ob.points.map((pt) => pt.z);
              const b = { minX: Math.min(...xs) - SAFE, maxX: Math.max(...xs) + SAFE, minZ: Math.min(...zs) - SAFE, maxZ: Math.max(...zs) + SAFE };
              const dx = Math.max(b.minX - p.x, 0, p.x - b.maxX);
              const dz = Math.max(b.minZ - p.z, 0, p.z - b.maxZ);
              const dist = Math.sqrt(dx*dx + dz*dz);
              if (dist < minDist) minDist = dist;
            });
          }
          
          // Bonus: Upper roof panels get a +10 score because they are physically higher
          const heightBonus = isOnUpperRoof ? 10 : 0;
          return { ...p, _score: minDist + (p.z * 0.1) + heightBonus };
       });
       
       scored.sort((a, b) => b._score - a._score);
       
       // 👈 FIXED: Ab absoluteMaxPanels ki jagah currentActiveCount use hoga
       scored.forEach((p, i) => { p.on = i < currentActiveCount; });
       return scored;
    });
  }, [siteData]);

  // Initial Load & Limit Enforcement
  useEffect(() => {
    if (!open || !siteData) return;
    const obs = JSON.parse(JSON.stringify(siteData.obstacles || []));
    setObstacles(obs);
    setSaved(false);
    setTool("panel");
    setHovIdx(null);
    setSunMode(false);
    setIsLive(false);
    setSunMins(720);
    setSidebarOpen(false);
    
    if (initialOverride && initialOverride.length > 0) {
      let currentActiveCount = 0;
      const smartOverride = initialOverride.map((p) => {
        if (p.on && currentActiveCount < absoluteMaxPanels) {
          currentActiveCount++;
          return { ...p, on: true };
        }
        return { ...p, on: false }; // Turn off excess panels instead of deleting
      });
      setPanels(smartOverride);
    } else { 
      const want = Math.min(Math.round(((loadKw || 3.5) * 1000) / WPP), absoluteMaxPanels);
      buildLayout(siteData, obs, want);
    }
  }, [open, siteData, loadKw, absoluteMaxPanels]);

  const handleLoadSlider = useCallback(
    (newKw) => {
      const want = Math.min(Math.round((newKw * 1000) / WPP), absoluteMaxPanels, panels.length);
      setPanels((prev) => prev.map((p, i) => ({ ...p, on: i < want })));
    },
    [absoluteMaxPanels, panels.length]
  );

  useEffect(() => {
    if (!isLive) return;
    const tick = () => {
      const n = new Date();
      setSunMins(n.getHours() * 60 + n.getMinutes());
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [isLive]);

  const sunInfo = useMemo(() => sunPos(sunMins), [sunMins]);
  const sunH = Math.floor(sunMins / 60),
    sunM = sunMins % 60;
  const timeStr = `${sunH % 12 || 12}:${String(sunM).padStart(2, "0")} ${
    sunH >= 12 ? "PM" : "AM"
  }`;

  const draw = useCallback(() => {
    const cv = cvRef.current;
    if (!cv || !siteData) return;
    const ctx = cv.getContext("2d"),
      W = cv.width,
      H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, isDark ? "#060d07" : "#edf7f0");
    bgG.addColorStop(1, isDark ? "#0a1a0c" : "#e0f0e6");
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = isDark ? "rgba(34,197,94,0.022)" : "rgba(15,76,58,0.032)";
    for (let gx = PAD; gx < W - PAD; gx += 20)
      for (let gy = PAD; gy < H - PAD; gy += 20) {
        ctx.beginPath();
        ctx.arc(gx, gy, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    const { s } = w2p(0, 0, bounds, W, H);
    const rpts = siteData.roof_polygon;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    const rp0 = w2p(rpts[0].x, rpts[0].z, bounds, W, H);
    ctx.moveTo(rp0.px, rp0.py);
    for (let i = 1; i < rpts.length; i++) {
      const p = w2p(rpts[i].x, rpts[i].z, bounds, W, H);
      ctx.lineTo(p.px, p.py);
    }
    ctx.closePath();
    ctx.fillStyle = isDark ? "rgba(0,0,0,0.60)" : "rgba(0,0,0,0.07)";
    ctx.fill("evenodd");
    ctx.restore();
    if (sunMode && sunInfo.isDay) {
      ctx.save();
      ctx.beginPath();
      const sp0 = w2p(rpts[0].x, rpts[0].z, bounds, W, H);
      ctx.moveTo(sp0.px, sp0.py);
      for (let i = 1; i < rpts.length; i++) {
        const p = w2p(rpts[i].x, rpts[i].z, bounds, W, H);
        ctx.lineTo(p.px, p.py);
      }
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = 0.34;
      allObsForShadow.forEach((obs) => {
        const h = obs.height ?? 0.8;
        if (h <= 0) return;
        const xs = obs.points.map((p) => p.x),
          zs = obs.points.map((p) => p.z);
        const ox = (Math.min(...xs) + Math.max(...xs)) / 2,
          oz = (Math.min(...zs) + Math.max(...zs)) / 2;
        const shadowDir = (sunInfo.azN + Math.PI) % (2 * Math.PI);
        const shadowLen = h / Math.tan(Math.max(sunInfo.elevRad, 0.05));
        const oc = w2p(ox, oz, bounds, W, H);
        const tx = ox + Math.sin(shadowDir) * shadowLen,
          tz = oz + Math.cos(shadowDir) * shadowLen;
        const tc = w2p(tx, tz, bounds, W, H);
        const obsHalfW = ((Math.max(...xs) - Math.min(...xs)) / 2 + 0.3) * s;
        const perpDir = shadowDir + Math.PI / 2;
        const ppx = Math.sin(perpDir) * obsHalfW,
          ppy = Math.cos(perpDir) * obsHalfW;
        ctx.beginPath();
        ctx.moveTo(oc.px - ppx, oc.py - ppy);
        ctx.lineTo(tc.px - ppx * 0.15, tc.py - ppy * 0.15);
        ctx.lineTo(tc.px + ppx * 0.15, tc.py + ppy * 0.15);
        ctx.lineTo(oc.px + ppx, oc.py + ppy);
        ctx.closePath();
        const g = ctx.createLinearGradient(oc.px, oc.py, tc.px, tc.py);
        g.addColorStop(0, "rgba(0,0,0,0.68)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fill();
      });
      ctx.restore();
    }
    {
      const pts = siteData.roof_polygon;
      ctx.beginPath();
      const p0 = w2p(pts[0].x, pts[0].z, bounds, W, H);
      ctx.moveTo(p0.px, p0.py);
      for (let i = 1; i < pts.length; i++) {
        const p = w2p(pts[i].x, pts[i].z, bounds, W, H);
        ctx.lineTo(p.px, p.py);
      }
      ctx.closePath();
      const rg = ctx.createLinearGradient(0, 0, W, H);
      rg.addColorStop(0, isDark ? "#172d1b" : "#c5e3cd");
      rg.addColorStop(1, isDark ? "#0f1f12" : "#acd4b6");
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.strokeStyle = isDark ? "rgba(34,197,94,0.20)" : "rgba(15,76,58,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    (siteData.upper_roofs || []).forEach((ur) => {
      const pts = ur.footprint;
      ctx.beginPath();
      const p0 = w2p(pts[0].x, pts[0].z, bounds, W, H);
      ctx.moveTo(p0.px, p0.py);
      pts.slice(1).forEach((p) => {
        const c = w2p(p.x, p.z, bounds, W, H);
        ctx.lineTo(c.px, c.py);
      });
      ctx.closePath();
      ctx.fillStyle = isDark
        ? "rgba(14,116,144,0.17)"
        : "rgba(14,116,144,0.11)";
      ctx.fill();
      ctx.strokeStyle = isDark
        ? "rgba(79,195,247,0.36)"
        : "rgba(14,116,144,0.4)";
      ctx.lineWidth = 1.3;
      ctx.stroke();
      const ux = ur.footprint.map((p) => p.x),
        uz = ur.footprint.map((p) => p.z);
      const lp = w2p(
        (Math.min(...ux) + Math.max(...ux)) / 2,
        (Math.min(...uz) + Math.max(...uz)) / 2,
        bounds,
        W,
        H
      );
      ctx.font = "bold 7px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isDark
        ? "rgba(79,195,247,0.52)"
        : "rgba(14,116,144,0.62)";
      ctx.fillText("Upper", lp.px, lp.py);
    });
    pRef.current.forEach((panel, idx) => {
      const c = w2p(panel.x, panel.z, bounds, W, H);
      const pw = panel.pw * s,
        ph = panel.ph * s;
      const isDrg = drag.current?.type === "panel" && drag.current?.idx === idx;
      const isHov = tool === "panel" && hovIdx === idx;
      const off = !panel.on,
        shd2 = sunMode && shadowMap[idx];
      const rr = Math.min(pw, ph) * 0.09;
      ctx.save();
      ctx.translate(c.px, c.py);
      if (isDrg) {
        ctx.shadowColor = "rgba(0,0,0,0.58)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 4;
      }
      if (off) {
        ctx.fillStyle = isDark
          ? "rgba(18,32,20,0.52)"
          : "rgba(160,185,165,0.33)";
      } else if (shd2) {
        ctx.fillStyle = isDark ? "rgba(12,7,4,0.93)" : "rgba(44,24,14,0.7)";
      } else {
        const g = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
        g.addColorStop(0, isDrg ? "#3b82f6" : "#1e4d90");
        g.addColorStop(0.5, isDrg ? "#2563eb" : "#1a3d7a");
        g.addColorStop(1, isDrg ? "#1d4ed8" : "#0d2558");
        ctx.fillStyle = g;
      }
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, rr);
      ctx.fill();
      if (!off && !shd2 && pw > 10) {
        ctx.strokeStyle = "rgba(79,195,247,0.08)";
        ctx.lineWidth = 0.28;
        for (let ci = 1; ci < 6; ci++) {
          ctx.beginPath();
          ctx.moveTo(-pw / 2 + ci * (pw / 6), -ph / 2);
          ctx.lineTo(-pw / 2 + ci * (pw / 6), ph / 2);
          ctx.stroke();
        }
        for (let ri = 1; ri < 4; ri++) {
          ctx.beginPath();
          ctx.moveTo(-pw / 2, -ph / 2 + ri * (ph / 4));
          ctx.lineTo(pw / 2, -ph / 2 + ri * (ph / 4));
          ctx.stroke();
        }
        const sg = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
        sg.addColorStop(0, "rgba(255,255,255,0.06)");
        sg.addColorStop(0.5, "rgba(255,255,255,0.01)");
        sg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.roundRect(-pw / 2, -ph / 2, pw, ph, rr);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (off)
        ctx.setLineDash([Math.max(2, pw * 0.07), Math.max(2, pw * 0.07)]);
      ctx.strokeStyle = isDrg
        ? "#60a5fa"
        : isHov
        ? "#38bdf8"
        : shd2
        ? "rgba(180,90,50,0.62)"
        : off
        ? isDark
          ? "rgba(42,66,44,0.38)"
          : "rgba(120,148,122,0.33)"
        : isDark
        ? "rgba(79,195,247,0.2)"
        : "rgba(28,78,195,0.22)";
      ctx.lineWidth = isDrg ? 1.8 : isHov ? 1.5 : 0.65;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, rr);
      ctx.stroke();
      ctx.setLineDash([]);
      if ((isHov || isDrg) && !off) {
        ctx.strokeStyle = isDrg
          ? "rgba(96,165,250,0.48)"
          : "rgba(56,189,248,0.34)";
        ctx.lineWidth = isDrg ? 2.5 : 2;
        ctx.beginPath();
        ctx.roundRect(-pw / 2 - 2, -ph / 2 - 2, pw + 4, ph + 4, rr + 1);
        ctx.stroke();
      }
      if (off && pw > 10) {
        const m = 3;
        ctx.strokeStyle = isDark
          ? "rgba(50,75,52,0.26)"
          : "rgba(115,140,117,0.28)";
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(-pw / 2 + m, -ph / 2 + m);
        ctx.lineTo(pw / 2 - m, ph / 2 - m);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pw / 2 - m, -ph / 2 + m);
        ctx.lineTo(-pw / 2 + m, ph / 2 - m);
        ctx.stroke();
      }
      if (shd2 && !off && pw > 8) {
        ctx.fillStyle = "rgba(251,146,60,0.9)";
        ctx.beginPath();
        ctx.arc(pw / 2 - 3.5, -ph / 2 + 3.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // 👈 FIXED: Render both Main Roof AND Upper Roof obstacles in the 2D Editor
    const allObstaclesToDraw = [
      ...oRef.current.map((o, idx) => ({ ...o, originalIndex: idx, isUpper: false })),
      ...(siteData.upper_roofs || []).flatMap(ur => 
        (ur.obstacles || []).map(o => ({ ...o, isUpper: true }))
      )
    ];

    allObstaclesToDraw.forEach((obs, displayIndex) => {
      const xs = obs.points.map((p) => p.x),
        zs = obs.points.map((p) => p.z);
      const cx2 = (Math.min(...xs) + Math.max(...xs)) / 2,
        cz2 = (Math.min(...zs) + Math.max(...zs)) / 2;
      
      // Drag & Hover logic only applies to Main Roof obstacles (as they are editable)
      const isDrg = !obs.isUpper && drag.current?.type === "obs" && drag.current?.idx === obs.originalIndex;
      const isHov = !obs.isUpper && tool === "obstacle" && hovIdx === 1000 + obs.originalIndex;
      
      const unk = obs.height == null;
      const buf = [
        { x: Math.min(...xs) - SAFE, z: Math.min(...zs) - SAFE },
        { x: Math.max(...xs) + SAFE, z: Math.min(...zs) - SAFE },
        { x: Math.max(...xs) + SAFE, z: Math.max(...zs) + SAFE },
        { x: Math.min(...xs) - SAFE, z: Math.max(...zs) + SAFE },
      ];
      
      ctx.beginPath();
      const b0 = w2p(buf[0].x, buf[0].z, bounds, W, H);
      ctx.moveTo(b0.px, b0.py);
      buf.slice(1).forEach((p) => {
        const c = w2p(p.x, p.z, bounds, W, H);
        ctx.lineTo(c.px, c.py);
      });
      ctx.closePath();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = unk ? "rgba(249,115,22,0.2)" : "rgba(239,68,68,0.15)";
      ctx.lineWidth = 0.75;
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.beginPath();
      const o0 = w2p(obs.points[0].x, obs.points[0].z, bounds, W, H);
      ctx.moveTo(o0.px, o0.py);
      obs.points.slice(1).forEach((p) => {
        const c = w2p(p.x, p.z, bounds, W, H);
        ctx.lineTo(c.px, c.py);
      });
      ctx.closePath();
      
      if (isDrg) {
        ctx.shadowColor = "rgba(239,68,68,0.35)";
        ctx.shadowBlur = 10;
      }
      
      ctx.fillStyle = unk
        ? isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.13)"
        : isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.11)";
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = isDrg
        ? "#fb923c"
        : isHov ? "#fca5a5"
        : unk ? "#f97316" : "#ef4444";
      ctx.lineWidth = isDrg || isHov ? 1.8 : 1;
      ctx.stroke();
      
      const lp = w2p(cx2, cz2, bounds, W, H);
      const lbl = unk ? "?m" : `${obs.height}m`;
      ctx.font = "bold 7.5px system-ui";
      ctx.textAlign = "center";
      const tw = ctx.measureText(lbl).width + 8;
      ctx.fillStyle = unk ? "#f97316" : "#ef4444";
      ctx.beginPath();
      ctx.roundRect(lp.px - tw / 2, lp.py - 6, tw, 12, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, lp.px, lp.py);
    });
    if (sunMode) {
      const cx = W - 52,
        cy = 52,
        R = 22;
      ctx.beginPath();
      ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(4,10,6,0.9)" : "rgba(240,252,243,0.93)";
      ctx.fill();
      ctx.strokeStyle = isDark ? "rgba(34,197,94,0.14)" : "rgba(15,76,58,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();
      [
        ["N", 0],
        ["E", Math.PI / 2],
        ["S", Math.PI],
        ["W", -Math.PI / 2],
      ].forEach(([d, a]) => {
        const tx = cx + Math.sin(a) * (R + 3),
          ty = cy - Math.cos(a) * (R + 3);
        ctx.font = "5.5px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.22)";
        ctx.fillText(d, tx, ty);
      });
      if (sunInfo.isDay) {
        const sx = cx + Math.sin(sunInfo.azN) * (R - 6),
          sy = cy - Math.cos(sunInfo.azN) * (R - 6);
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 10);
        sg.addColorStop(0, "rgba(253,224,71,0.88)");
        sg.addColorStop(1, "rgba(253,224,71,0)");
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fde047";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          R * 0.4,
          -Math.PI / 2,
          -Math.PI / 2 + (sunInfo.elevDeg / 90) * Math.PI * 2
        );
        ctx.strokeStyle = `rgba(253,224,71,${
          0.3 + (sunInfo.elevDeg / 90) * 0.55
        })`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = "bold 7.5px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isDark
          ? "rgba(253,224,71,0.82)"
          : "rgba(148,108,0,0.88)";
        ctx.fillText(`${Math.round(sunInfo.elevDeg)}°`, cx, cy);
      } else {
        ctx.font = "13px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.16)";
        ctx.fillText("🌙", cx, cy);
      }
    }
    {
      const p0 = w2p(0, 0, bounds, W, H),
        p5 = w2p(5, 0, bounds, W, H);
      const bp = p5.px - p0.px,
        bx = 12,
        by = H - 12;
      ctx.strokeStyle = isDark ? "rgba(34,197,94,0.22)" : "rgba(15,76,58,0.26)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bp, by);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by - 3);
      ctx.lineTo(bx, by + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + bp, by - 3);
      ctx.lineTo(bx + bp, by + 3);
      ctx.stroke();
      ctx.font = "7px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = isDark ? "rgba(34,197,94,0.32)" : "rgba(15,76,58,0.38)";
      ctx.fillText("5 m", bx + bp / 2, by - 5);
    }
    ctx.font = "bold 8px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = isDark ? "rgba(34,197,94,0.32)" : "rgba(15,76,58,0.38)";
    ctx.fillText("N ↑", 10, 10);
  }, [
    isDark,
    bounds,
    siteData,
    tool,
    hovIdx,
    panels,
    shadowMap,
    sunMode,
    sunInfo,
    allObsForShadow,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!open) return;
    const resize = () => {
      const cv = cvRef.current;
      if (!cv) return;
      const rc = cv.parentElement?.getBoundingClientRect();
      if (!rc) return;
      cv.width = rc.width;
      cv.height = rc.height;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [open, draw]);

  const getXY = (e, cv) => {
    const rc = cv.getBoundingClientRect(),
      sx = cv.width / rc.width,
      sy = cv.height / rc.height;
    const cl = e.touches ? e.touches[0].clientX : e.clientX,
      ct = e.touches ? e.touches[0].clientY : e.clientY;
    return { cx: (cl - rc.left) * sx, cy: (ct - rc.top) * sy };
  };
  const hitPanel = (cx, cy, W, H) => {
    for (let i = pRef.current.length - 1; i >= 0; i--) {
      const p = pRef.current[i];
      const c = w2p(p.x, p.z, bounds, W, H);
      const { s } = c;
      const hw = (p.pw * s) / 2,
        hh = (p.ph * s) / 2;
      if (
        cx >= c.px - hw &&
        cx <= c.px + hw &&
        cy >= c.py - hh &&
        cy <= c.py + hh
      )
        return i;
    }
    return -1;
  };
  const hitObs = (cx, cy, W, H) => {
    for (let i = 0; i < oRef.current.length; i++) {
      const o = oRef.current[i];
      const xs = o.points.map((p) => p.x),
        zs = o.points.map((p) => p.z);
      const tl = w2p(Math.min(...xs), Math.min(...zs), bounds, W, H);
      const br = w2p(Math.max(...xs), Math.max(...zs), bounds, W, H);
      if (
        cx >= tl.px - 10 &&
        cx <= br.px + 10 &&
        cy >= tl.py - 10 &&
        cy <= br.py + 10
      )
        return i;
    }
    return -1;
  };

  const onDown = useCallback(
    (e) => {
      const cv = cvRef.current;
      if (!cv) return;
      const { cx, cy } = getXY(e, cv);
      const W = cv.width,
        H = cv.height;
      if (sunMode) return;
      if (tool === "panel") {
        const i = hitPanel(cx, cy, W, H);
        if (i >= 0) {
          drag.current = {
            type: "panel",
            idx: i,
            moved: false,
            startCx: cx,
            startCy: cy,
            ox: pRef.current[i].x,
            oz: pRef.current[i].z,
          };
          e.preventDefault();
        }
      } else {
        const i = hitObs(cx, cy, W, H);
        if (i >= 0) {
          drag.current = {
            type: "obs",
            idx: i,
            startCx: cx,
            startCy: cy,
            origPts: oRef.current[i].points.map((p) => ({ ...p })),
          };
          e.preventDefault();
        }
      }
    },
    [tool, bounds, sunMode]
  ); // eslint-disable-line

  // ── NEW LOGIC: Obstacle collision blocks dragged panels & vice versa ──
  const onMove = useCallback(
    (e) => {
      const cv = cvRef.current;
      if (!cv) return;
      const { cx, cy } = getXY(e, cv);
      const W = cv.width,
        H = cv.height;
      if (drag.current) {
        e.preventDefault();
        const dx = cx - drag.current.startCx,
          dy = cy - drag.current.startCy;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.current.moved = true;
        const wA = p2w(0, 0, bounds, W, H),
          wB = p2w(dx, dy, bounds, W, H);
        const wdx = wB.x - wA.x,
          wdz = wB.z - wA.z;
        if (drag.current.type === "panel") {
          const i = drag.current.idx,
            nx = drag.current.ox + wdx,
            nz = drag.current.oz + wdz;
          const p = pRef.current[i],
            hw = p.pw / 2,
            hh = p.ph / 2;
          const corners = [
            [nx - hw, nz - hh],
            [nx + hw, nz - hh],
            [nx - hw, nz + hh],
            [nx + hw, nz + hh],
          ];
          const okMain = corners.every(([x, z]) => inPoly(x, z, siteData.roof_polygon));
const okUpper = (siteData.upper_roofs || []).some((ur) =>
  corners.every(([x, z]) => inPoly(x, z, ur.footprint))
);
const ok = okMain || okUpper;
          if (!ok) return;
          const panelCollide = pRef.current.some((other, oi) => {
            if (oi === i) return false;
            const owx = other.x,
              owz = other.z,
              ohw = other.pw / 2 + 0.03,
              ohh = other.ph / 2 + 0.03;
            return (
              nx - hw < owx + ohw &&
              nx + hw > owx - ohw &&
              nz - hh < owz + ohh &&
              nz + hh > owz - ohh
            );
          });
          if (panelCollide) return;
          const allObsWithUpperRoofs = [
            ...oRef.current,
            ...(siteData.upper_roofs || []).map((ur) => ({ points: ur.footprint }))
          ];
          const obsCollide = allObsWithUpperRoofs.some((ob) => {
            const xs = ob.points.map((pt) => pt.x),
              zs = ob.points.map((pt) => pt.z);
            const b = {
              x0: Math.min(...xs) - SAFE,
              x1: Math.max(...xs) + SAFE,
              z0: Math.min(...zs) - SAFE,
              z1: Math.max(...zs) + SAFE,
            };
            return (
              nx - hw < b.x1 &&
              nx + hw > b.x0 &&
              nz - hh < b.z1 &&
              nz + hh > b.z0
            );
          });
          if (obsCollide) return;
          setPanels((prev) => {
            const n = [...prev];
            n[i] = { ...n[i], x: nx, z: nz };
            return n;
          });
        } else {
          const i = drag.current.idx;
          const np = drag.current.origPts.map((pt) => ({
            x: pt.x + wdx,
            z: pt.z + wdz,
          }));
          if (!np.every((p) => inPoly(p.x, p.z, siteData.roof_polygon))) return;
          const nxs = np.map((p) => p.x),
            nzs = np.map((p) => p.z);
          const nb = {
            x0: Math.min(...nxs),
            x1: Math.max(...nxs),
            z0: Math.min(...nzs),
            z1: Math.max(...nzs),
          };
          // 👈 FIXED: Obstacle vs Upper Roof Collision
          const allOtherObs = oRef.current.filter((_, oi) => oi !== i).concat(
            (siteData.upper_roofs || []).map((ur) => ({ points: ur.footprint }))
          );
          const obsObs = allOtherObs.some((ob) => {
            const xs = ob.points.map((p) => p.x), zs = ob.points.map((p) => p.z);
            const obnd = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
            return nb.x0 < obnd.x1 + 0.1 && nb.x1 > obnd.x0 - 0.1 && nb.z0 < obnd.z1 + 0.1 && nb.z1 > obnd.z0 - 0.1;
          });
          if (obsObs) return;

          // Prevent obstacle overlap with ACTIVE panels
          const obsPanel = pRef.current.some((p) => {
            if (!p.on) return false;
            const phw = p.pw / 2, phh = p.ph / 2;
            return p.x - phw < nb.x1 + SAFE && p.x + phw > nb.x0 - SAFE && p.z - phh < nb.z1 + SAFE && p.z + phh > nb.z0 - SAFE;
          });
          if (obsPanel) return;

          setObstacles((prev) => {
            const n = JSON.parse(JSON.stringify(prev));
            n[i].points = np;
            return n;
          });
        }
      } else if (!sunMode) {
        if (tool === "panel") {
          const i = hitPanel(cx, cy, W, H);
          setHovIdx(i >= 0 ? i : null);
          cv.style.cursor = i >= 0 ? "grab" : "default";
        } else {
          const i = hitObs(cx, cy, W, H);
          setHovIdx(i >= 0 ? 1000 + i : null);
          cv.style.cursor = i >= 0 ? "grab" : "default";
        }
      }
    },
    [tool, bounds, siteData, sunMode]
  ); // eslint-disable-line

  const onUp = useCallback(() => {
    if (!drag.current) return;
    if (drag.current.type === "panel" && !drag.current.moved) {
      const i = drag.current.idx;
      setPanels((prev) => {
        const n = [...prev];
        // Enforce Manual Override Limit
        if (!n[i].on) {
          const currentActive = n.filter(p => p.on).length;
          if (currentActive >= absoluteMaxPanels) return n; 
        }
        n[i] = { ...n[i], on: !n[i].on };
        return n;
      });
    }
    drag.current = null;
    if (cvRef.current) cvRef.current.style.cursor = "default";
  }, [absoluteMaxPanels]);

  const handleSave = () => {
    onSave({
      siteData: { ...siteData, obstacles },
      loadKw: activeKw,
      panelOverride: panels.map(({ x, z, pw, ph, on }) => ({
        x,
        z,
        pw,
        ph,
        on,
      })),
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  if (!open || !siteData) return null;

  const atMaxCap = activeCount >= absoluteMaxPanels;
  const utilPct = roofMaxPanels > 0 ? activeCount / roofMaxPanels : 0;
  const liveKwNow = sunInfo.isDay
    ? (
        (((activeCount - shadedCount) * WPP) / 1000) *
        Math.sin(Math.max(sunInfo.elevRad, 0.1)) *
        PR
      ).toFixed(2)
    : "—";

  // ── Sidebar inner content (reused for desktop panel + mobile sheet) ──
  const SidebarInner = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* System size + slider */}
      <div
        style={{ padding: "13px 13px 11px", borderBottom: bdr, flexShrink: 0 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: T.sub,
                marginBottom: 3,
              }}
            >
              System Size
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: T.text,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.025em",
                  animation: pulse ? "metricPop 0.4s ease" : undefined,
                }}
              >
                {activeKw.toFixed(1)}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: T.sub,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  kWp
                </div>
                <div style={{ fontSize: 9, color: T.sub, lineHeight: 1.4 }}>
                  {activeCount} panels
                </div>
              </div>
            </div>
          </div>
          <ArcGauge
            pct={utilPct}
            size={50}
            color={isDark ? "rgba(255,255,255,0.45)" : "rgba(15,76,58,0.45)"}
            label="roof used"
            value={`${Math.round(utilPct * 100)}%`}
            dark={isDark}
          />
        </div>
        {(() => {
          const col = C.yellow;
          const pct2 =
            sliderMaxKw > 0 ? Math.min(activeKw / sliderMaxKw, 1) * 100 : 0;
          return (
            <>
              <div
                style={{
                  position: "relative",
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 4,
                    borderRadius: 3,
                    background: isDark
                      ? "rgba(255,255,255,0.055)"
                      : "rgba(0,0,0,0.075)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    height: 4,
                    borderRadius: 3,
                    width: `${pct2}%`,
                    background: col,
                    transition: "width 0.1s",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `calc(${pct2}% - 8px)`,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: isDark ? "#121e15" : "#fff",
                    border: `2px solid ${col}`,
                    boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
                    transition: "left 0.1s",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={sliderMaxKw}
                  step={+(WPP / 1000).toFixed(3)}
                  value={Math.min(activeKw, sliderMaxKw)}
                  onChange={(e) => handleLoadSlider(parseFloat(e.target.value))}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    margin: 0,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 8, color: T.sub }}>0 kWp</span>
                <span style={{ fontSize: 8, color: T.sub }}>
                  {sliderMaxKw} kWp Limit {atMaxCap && " ⚠"}
                </span>
              </div>
              {atMaxCap && (
                <div
                  style={{
                    padding: "5px 8px",
                    borderRadius: 7,
                    background: `${C.red}0b`,
                    border: `1px solid ${C.red}16`,
                    fontSize: 8,
                    color: C.red,
                    lineHeight: 1.5,
                  }}
                >
                  Load limit reached · {absoluteMaxPanels} panels max
                </div>
              )}
            </>
          );
        })()}
      </div>
      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: bdr, flexShrink: 0 }}>
        {[
          { id: "finance", l: "Finance" },
          { id: "shadow", l: "Shadow" },
        ].map(({ id, l }) => (
          <button
            key={id}
            onClick={() => setSideTab(id)}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              transition: "all 0.15s",
              letterSpacing: "0.04em",
              background: "transparent",
              color: sideTab === id ? T.text : T.sub,
              borderBottom: `2px solid ${
                sideTab === id ? C.green : "transparent"
              }`,
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {/* Finance Tab */}
      {sideTab === "finance" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div style={{ padding: "11px 13px 8px", borderBottom: bdr }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 5,
              }}
            >
              {[
                {
                  l: "Monthly Savings",
                  v: `₹${fin.monthly.toLocaleString("en-IN")}`,
                  s: `₹${fin.rate}/unit`,
                },
                { l: "Payback Period", v: `${fin.payback} yr`, s: "breakeven" },
                {
                  l: "Net Cost",
                  v: fmtR(fin.netCost),
                  s: `–${fmtR(fin.sub)} subsidy`,
                },
                {
                  l: "Lifetime Value",
                  v: fmtR(fin.lifetime),
                  s: "25yr projected",
                },
              ].map(({ l, v, s }) => (
                <div
                  key={l}
                  style={{
                    padding: "8px 9px",
                    borderRadius: 9,
                    background: T.chip,
                    border: bdr,
                  }}
                >
                  <div
                    style={{
                      fontSize: 7.5,
                      color: T.sub,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      marginBottom: 3,
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: T.text,
                      lineHeight: 1,
                      marginBottom: 2,
                      fontVariantNumeric: "tabular-nums",
                      animation: pulse ? "metricPop 0.4s ease" : undefined,
                    }}
                  >
                    {v}
                  </div>
                  <div style={{ fontSize: 7, color: T.sub, lineHeight: 1.3 }}>
                    {s}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              padding: "8px 13px",
              borderBottom: bdr,
              display: "flex",
              gap: 5,
            }}
          >
            {[
              { l: "Annual kWh", v: (fin.annual || 0).toLocaleString("en-IN") },
              { l: "CO₂ Saved", v: `${fin.co2} T` },
            ].map(({ l, v }) => (
              <div
                key={l}
                style={{
                  flex: 1,
                  padding: "7px 8px",
                  borderRadius: 9,
                  background: T.chip,
                  border: bdr,
                }}
              >
                <div
                  style={{
                    fontSize: 7.5,
                    color: T.sub,
                    fontWeight: 700,
                    marginBottom: 2,
                  }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: T.text,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 13px 6px", borderBottom: bdr }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.sub,
                }}
              >
                Monthly Generation
              </span>
              <span style={{ fontSize: 8, color: T.sub }}>
                {((fin.annual || 0) / 1000).toFixed(1)} MWh/yr
              </span>
            </div>
            <AreaChart
              data={fin.monthlyArr || Array(12).fill(0)}
              dark={isDark}
              color={C.green}
              height={60}
            />
          </div>
          <div style={{ padding: "10px 13px", borderBottom: bdr }}>
            <PaybackBar payback={fin.payback} dark={isDark} />
          </div>
          <div style={{ padding: "9px 13px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {[
                { dot: "#1e4d90", l: "Active panel" },
                {
                  dot: isDark ? "rgba(20,35,22,0.8)" : "rgba(158,182,162,0.8)",
                  l: "Off",
                  dash: true,
                },
                { dot: "rgba(239,68,68,0.7)", l: "Obstacle" },
              ].map(({ dot, l, dash }) => (
                <div
                  key={l}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: dot,
                      border: dash
                        ? `1.5px dashed ${
                            isDark
                              ? "rgba(50,75,52,0.7)"
                              : "rgba(118,145,120,0.6)"
                          }`
                        : undefined,
                    }}
                  />
                  <span style={{ fontSize: 8, color: T.sub }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Shadow Tab */}
      {sideTab === "shadow" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {sunMode ? (
            <>
              <div style={{ padding: "12px 13px 8px", borderBottom: bdr }}>
                <SunOutputGauge
                  pct={sunInfo.isDay ? (sunMins - 360) / 720 : 0}
                  liveKw={liveKwNow}
                  totalKw={activeKw}
                  elevDeg={Math.round(sunInfo.elevDeg)}
                  dark={isDark}
                />
              </div>
              <div style={{ padding: "10px 13px", borderBottom: bdr }}>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: T.sub,
                    marginBottom: 8,
                  }}
                >
                  Shadow Analysis · {timeStr}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 5,
                    marginBottom: 8,
                  }}
                >
                  {[
                    {
                      l: "Active",
                      v: `${activeCount - shadedCount}`,
                      c: T.text,
                    },
                    {
                      l: "Shaded",
                      v: shadedCount > 0 ? `${shadedCount}` : "0",
                      c: shadedCount > 0 ? C.orange : T.sub,
                    },
                    {
                      l: "Offline",
                      v: `${panels.length - activeCount}`,
                      c: T.sub,
                    },
                  ].map(({ l, v, c }) => (
                    <div
                      key={l}
                      style={{
                        padding: "7px 6px",
                        borderRadius: 8,
                        background: T.chip,
                        border: bdr,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 7,
                          color: T.sub,
                          fontWeight: 600,
                          marginBottom: 3,
                        }}
                      >
                        {l}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: c,
                          lineHeight: 1,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
                {sunInfo.isDay && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 8, color: T.sub }}>
                        POA Irradiance
                      </span>
                      <span
                        style={{
                          fontSize: 8,
                          color: C.yellow,
                          fontWeight: 700,
                        }}
                      >
                        {Math.round(Math.sin(sunInfo.elevRad) * 850)} W/m²
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        borderRadius: 99,
                        background: isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 99,
                          background: `linear-gradient(90deg,${C.yellow},${C.orange})`,
                          width: `${(Math.sin(sunInfo.elevRad) * 100).toFixed(
                            0
                          )}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 13px", borderBottom: bdr }}>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: T.sub,
                    marginBottom: 8,
                  }}
                >
                  Daily Output Curve
                </div>
                <AreaChart
                  data={Array.from({ length: 13 }, (_, i) => {
                    const mins = 360 + i * 60;
                    const s = sunPos(mins);
                    if (!s.isDay) return 0;
                    return (
                      Math.round(
                        (((activeCount - shadedCount) * WPP) / 1000) *
                          Math.sin(Math.max(s.elevRad, 0)) *
                          PR *
                          10
                      ) / 10
                    );
                  })}
                  dark={isDark}
                  color={C.yellow}
                  height={52}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontSize: 7, color: T.sub }}>6 AM</span>
                  <span style={{ fontSize: 7, color: T.sub }}>6 PM</span>
                </div>
              </div>
              <div style={{ padding: "9px 13px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {[
                    { dot: "#1e4d90", l: "Active" },
                    { dot: "rgba(180,90,50,0.8)", l: "Shaded" },
                    {
                      dot: isDark
                        ? "rgba(20,35,22,0.8)"
                        : "rgba(158,182,162,0.8)",
                      l: "Off",
                      dash: true,
                    },
                  ].map(({ dot, l, dash }) => (
                    <div
                      key={l}
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: dot,
                          border: dash
                            ? `1.5px dashed ${
                                isDark
                                  ? "rgba(50,75,52,0.7)"
                                  : "rgba(118,145,120,0.6)"
                              }`
                            : undefined,
                        }}
                      />
                      <span style={{ fontSize: 8, color: T.sub }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 20px",
                gap: 10,
                opacity: 0.5,
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.sub}
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
              <span
                style={{
                  fontSize: 10,
                  color: T.sub,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                Enable Shadows in the toolbar to see sun simulation data
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 10,
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif",
      }}
    >
      <style>{`
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.25;transform:scale(0.6)}}
        @keyframes metricPop{0%{transform:scale(1)}35%{transform:scale(1.06)}100%{transform:scale(1)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.975) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .sg:hover{border-color:${C.green}!important;color:${
        C.green
      }!important;background:${
        isDark ? "rgba(34,197,94,0.07)" : "rgba(34,197,94,0.05)"
      }!important}
        .st:hover{background:${
          isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.05)"
        }!important;color:${C.green}!important}
        .sss{-webkit-appearance:none;appearance:none;height:5px;border-radius:99px;cursor:pointer;outline:none;border:none;width:100%;background:transparent}
        .sss::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:${
          C.yellow
        };border:2.5px solid ${
        isDark ? "#080f0a" : "#f8fdf9"
      };box-shadow:0 1px 8px rgba(0,0,0,0.28);cursor:pointer;transition:transform 0.12s}
        .sss::-webkit-slider-thumb:hover{transform:scale(1.22)}
        .sss::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:${
          C.yellow
        };border:2.5px solid ${isDark ? "#080f0a" : "#f8fdf9"};cursor:pointer}
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.84)",
          backdropFilter: "blur(18px)",
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: isMobile ? "100%" : 1100,
          height: isMobile ? "100dvh" : "min(820px,calc(100vh - 20px))",
          display: "flex",
          flexDirection: "column",
          borderRadius: isMobile ? 0 : 18,
          overflow: "hidden",
          background: T.glass,
          border: isMobile ? "none" : `1px solid ${T.border}`,
          boxShadow: isDark
            ? "0 50px 150px rgba(0,0,0,0.96),0 0 0 1px rgba(34,197,94,0.07),inset 0 1px 0 rgba(34,197,94,0.05)"
            : "0 50px 130px rgba(15,76,58,0.2),0 0 0 1px rgba(15,76,58,0.07),inset 0 1px 0 rgba(255,255,255,0.95)",
          animation: "modalIn 0.2s ease",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 10,
            padding: isMobile ? "0 10px" : "0 16px",
            height: isMobile ? 50 : 54,
            borderBottom: bdr,
            flexShrink: 0,
            background: isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.55)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 6 : 9,
              paddingRight: isMobile ? 8 : 12,
              borderRight: bdr,
              flexShrink: 0,
            }}
          >
            <img
              src={isDark ? solarpanelwhite : solarpanelblack}
              alt="solar"
              style={{
                width: isMobile ? 22 : 28,
                height: isMobile ? 22 : 28,
                objectFit: "contain",
              }}
            />
            <div
              style={{
                fontSize: isMobile ? 11 : 13,
                fontWeight: 700,
                color: T.text,
                lineHeight: 1,
              }}
            >
              {isMobile ? "Editor" : "Layout Editor"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 6 : 8,
              padding: isMobile ? "4px 8px" : "5px 14px",
              borderRadius: 11,
              background: "transparent",
              border: bdr,
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: 900,
                  color: T.text,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.025em",
                }}
              >
                {activeKw.toFixed(1)}
              </div>
              <div style={{ fontSize: 8.5, color: T.sub, lineHeight: 1 }}>
                kWp
              </div>
            </div>
            <div style={{ width: 1, height: 22, background: T.border }} />
            <div>
              <div
                style={{
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 800,
                  color: T.text,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {activeCount}
              </div>
              <div style={{ fontSize: 8.5, color: T.sub, lineHeight: 1 }}>
                panels
              </div>
            </div>
            {atMaxCap && (
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: 7,
                  background: `${C.red}12`,
                  color: C.red,
                  fontSize: 8,
                  fontWeight: 700,
                  border: `1px solid ${C.red}25`,
                }}
              >
                MAX
              </div>
            )}
          </div>
          {/* Desktop ROI strip */}
          {!isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                borderLeft: bdr,
                marginLeft: 2,
              }}
            >
              {[
                { l: "MONTHLY", v: `₹${fin.monthly.toLocaleString("en-IN")}` },
                { l: "PAYBACK", v: `${fin.payback} yr` },
                { l: "LIFETIME", v: fmtR(fin.lifetime) },
                { l: "CO₂", v: `${fin.co2} T` },
              ].map(({ l, v }, ii) => (
                <div
                  key={l}
                  style={{
                    textAlign: "center",
                    padding: "0 12px",
                    borderRight: ii < 3 ? bdr : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.text,
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {v}
                  </div>
                  <div
                    style={{
                      fontSize: 7,
                      color: T.sub,
                      letterSpacing: "0.08em",
                      marginTop: 2,
                    }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Mobile quick stats */}
          {isMobile && (
            <div
              style={{
                flex: 1,
                fontSize: 9,
                fontWeight: 700,
                color: T.sub,
                display: "flex",
                alignItems: "center",
                gap: 5,
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <span style={{ color: C.green }}>
                ₹{fin.monthly.toLocaleString("en-IN")}/mo
              </span>
              <span>·</span>
              <span>{fin.payback}yr</span>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {/* Mobile stats toggle */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: bdr,
                background: sidebarOpen ? `${C.green}15` : "transparent",
                color: sidebarOpen ? C.green : T.sub,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="sg"
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: bdr,
              background: "transparent",
              color: T.sub,
              cursor: "pointer",
              transition: "all 0.14s",
              flexShrink: 0,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* TOOLBAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: isMobile ? "4px 8px" : "5px 14px",
            borderBottom: bdr,
            flexShrink: 0,
            overflowX: "auto",
            minHeight: isMobile ? 36 : 38,
            background: isDark ? "rgba(0,0,0,0.13)" : "rgba(255,255,255,0.3)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {!sunMode && (
            <div
              style={{
                display: "flex",
                borderRadius: 9,
                overflow: "hidden",
                border: bdr,
                flexShrink: 0,
              }}
            >
              {[
                { id: "panel", l: "Panels" },
                { id: "obstacle", l: "Obstacles" },
              ].map(({ id, l }, ii) => (
                <button
                  key={id}
                  onClick={() => {
                    setTool(id);
                    setHovIdx(null);
                  }}
                  className="st"
                  style={{
                    padding: isMobile ? "4px 10px" : "4px 15px",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.14s",
                    letterSpacing: "0.04em",
                    background: tool === id ? C.green : "transparent",
                    color: tool === id ? "#fff" : T.sub,
                    borderRight: ii === 0 ? bdr : "none",
                    border: "none",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setSunMode((m) => !m);
              setTool("panel");
              setHovIdx(null);
            }}
            className="sg"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: isMobile ? "4px 8px" : "4px 13px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.14s",
              letterSpacing: "0.04em",
              border: `1px solid ${sunMode ? C.green : T.border}`,
              background: sunMode ? `${C.green}13` : "transparent",
              color: sunMode ? C.green : T.sub,
              flexShrink: 0,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            {isMobile
              ? sunMode
                ? "☀"
                : "Sun"
              : sunMode
              ? "Shadows ON"
              : "Shadows"}
          </button>
          {sunMode && (
            <>
              <button
                onClick={() => setIsLive((l) => !l)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 12px",
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  letterSpacing: "0.07em",
                  background: isLive ? C.green : "transparent",
                  color: isLive ? "#fff" : T.sub,
                  border: `1px solid ${isLive ? C.green : T.border}`,
                  boxShadow: isLive ? `0 0 14px ${C.green}40` : "none",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isLive) {
                    e.currentTarget.style.borderColor = C.green;
                    e.currentTarget.style.color = C.green;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLive) {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.color = T.sub;
                  }
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: isLive ? "#fff" : "currentColor",
                    display: "inline-block",
                    animation: isLive
                      ? "livePulse 1.4s ease-in-out infinite"
                      : "none",
                    flexShrink: 0,
                  }}
                />
                LIVE
              </button>
              <span style={{ fontSize: 9, color: T.sub, flexShrink: 0 }}>
                6AM
              </span>
              <input
                type="range"
                min={360}
                max={1080}
                step={5}
                value={sunMins}
                onChange={(e) => {
                  setSunMins(+e.target.value);
                  setIsLive(false);
                }}
                className="sss"
                style={{
                  width: isMobile ? 70 : 130,
                  flexShrink: 0,
                  background: `linear-gradient(to right,${C.yellow} 0%,${
                    C.yellow
                  } ${(((sunMins - 360) / 720) * 100).toFixed(1)}%,${
                    isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"
                  } ${(((sunMins - 360) / 720) * 100).toFixed(1)}%,${
                    isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"
                  } 100%)`,
                }}
              />
              <span style={{ fontSize: 9, color: T.sub, flexShrink: 0 }}>
                6PM
              </span>
              <div
                style={{
                  padding: "3px 7px",
                  borderRadius: 7,
                  flexShrink: 0,
                  border: `1px solid ${
                    sunInfo.isDay ? C.yellow + "33" : T.border
                  }`,
                  background: sunInfo.isDay ? `${C.yellow}0c` : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: sunInfo.isDay ? C.yellow : T.sub,
                  }}
                >
                  {isMobile
                    ? `${Math.round(sunInfo.elevDeg)}°`
                    : `${timeStr} · ${Math.round(sunInfo.elevDeg)}°`}
                </span>
              </div>
              {shadedCount > 0 && (
                <span
                  style={{
                    fontSize: 9,
                    color: C.orange,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ·{shadedCount}
                </span>
              )}
            </>
          )}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 4,
              flexShrink: 0,
            }}
          >
            {(isMobile
              ? [
                  { l: "Auto", fn: () => buildLayout(siteData, oRef.current, activeCount, false) },
                  { l: "↑", fn: optimizePanels },
                  { l: "On", fn: () => setPanels((p) => p.map((x, i) => ({ ...x, on: i < absoluteMaxPanels }))) },
                  { l: "Off", fn: () => setPanels((p) => p.map((x) => ({ ...x, on: false }))) }
                ]
              : [
                  { l: "Auto-Fit", fn: () => buildLayout(siteData, oRef.current, activeCount, false) },
                  { l: "Optimise", fn: optimizePanels },
                  { l: "All On", fn: () => setPanels((p) => p.map((x, i) => ({ ...x, on: i < absoluteMaxPanels }))) },
                  { l: "All Off", fn: () => setPanels((p) => p.map((x) => ({ ...x, on: false }))) }
                ]
            ).map(({ l, fn }) => (
              <button
                key={l}
                onClick={fn}
                className="sg"
                style={{
                  padding: isMobile ? "3px 7px" : "3px 11px",
                  borderRadius: 7,
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  background: "transparent",
                  color: T.sub,
                  border: `1px solid ${T.border}`,
                  transition: "all 0.14s",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            minHeight: 0,
            position: "relative",
          }}
        >
          {/* Canvas */}
          <div
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              userSelect: "none",
            }}
          >
            <canvas
              ref={cvRef}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                touchAction: "none",
              }}
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              onTouchStart={onDown}
              onTouchMove={onMove}
              onTouchEnd={onUp}
            />
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "4px 14px",
                borderRadius: 20,
                pointerEvents: "none",
                whiteSpace: "nowrap",
                background: isDark
                  ? "rgba(8,15,10,0.75)"
                  : "rgba(248,253,249,0.8)",
                border: bdr,
                backdropFilter: "blur(10px)",
                fontSize: 9,
                color: T.sub,
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              {sunMode
                ? "☀ Sun simulation — drag disabled"
                : "Click to toggle · Drag to reposition"}
            </div>
          </div>

          {/* Desktop sidebar */}
          {!isMobile && (
            <div
              style={{
                width: 244,
                display: "flex",
                flexDirection: "column",
                borderLeft: bdr,
                overflowY: "auto",
                flexShrink: 0,
                background: isDark
                  ? "rgba(0,0,0,0.10)"
                  : "rgba(255,255,255,0.35)",
              }}
            >
              {SidebarInner}
            </div>
          )}

          {/* Mobile slide-up sheet */}
          {isMobile && sidebarOpen && (
            <>
              <div
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  zIndex: 10,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "72%",
                  background: T.glass,
                  borderTop: `1px solid ${T.border}`,
                  borderRadius: "16px 16px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  zIndex: 11,
                  animation: "slideUp 0.22s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "10px 0 4px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 4,
                      borderRadius: 99,
                      background: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.12)",
                    }}
                  />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  {SidebarInner}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "8px 12px" : "8px 16px",
            borderTop: bdr,
            flexShrink: 0,
            background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.48)",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: isMobile ? 9 : 10,
              color: T.sub,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            <span style={{ color: C.green, fontWeight: 700 }}>
              {activeCount}
            </span>{" "}
            panels · <span style={{ fontWeight: 600 }}>{activeKw} kWp</span>
            {!isMobile && (
              <>
                {" "}
                ·{" "}
                <span style={{ fontWeight: 600 }}>
                  ₹{fin.monthly.toLocaleString("en-IN")}/mo
                </span>
              </>
            )}
            {sunMode && shadedCount > 0 && (
              <>
                {" "}
                ·{" "}
                <span style={{ color: C.orange, fontWeight: 700 }}>
                  {shadedCount} shaded
                </span>
              </>
            )}
          </span>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {!isMobile && (
              <button
                onClick={onClose}
                className="sg"
                style={{
                  padding: "7px 18px",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "transparent",
                  color: T.sub,
                  border: `1px solid ${T.border}`,
                  transition: "all 0.14s",
                  letterSpacing: "0.03em",
                }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: isMobile ? "8px 20px" : "7px 24px",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.18s",
                letterSpacing: "0.04em",
                border: "none",
                background: saved
                  ? "linear-gradient(135deg,#16a34a,#15803d)"
                  : isDark
                  ? "linear-gradient(135deg,#166534,#14532d)"
                  : "linear-gradient(135deg,#15803d,#166534)",
                color: "#fff",
                boxShadow: saved
                  ? `0 4px 22px ${C.green}55`
                  : `0 3px 14px ${C.green}30`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {saved ? (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Applied!
                </>
              ) : (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                  </svg>
                  Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}