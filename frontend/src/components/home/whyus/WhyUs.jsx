import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { useTheme } from "../../../context/ThemeContext";
import roofImg from "../../../assets/home/3droof.png";
import editorDark from "../../../assets/home/editorblack.png";
import editorLight from "../../../assets/home/editorwhite.png";
import vendorDashDark from "../../../assets/home/vendordashblack.png";
import vendorDashLight from "../../../assets/home/vendordashwhite.png";

const EASE = [0.22, 1, 0.36, 1];
const Y = "#FACC15";
const T = "#0E7490";

function tk(d) {
  return {
    tx: d ? "#E2E8F0" : "#1A2E25",
    su: d ? "#3d6b56" : "#8aaa96",
    dv: d ? "#1a2e20" : "#ddeae2",
    br: d ? "rgba(255,255,255,0.06)" : "rgba(15,76,58,0.10)",
    bg: d ? "#09100e" : "#f7f9f7",
  };
}
function ac(d) {
  return d ? "#FACC15" : "#0E7490";
}
function ab(d) {
  return d ? "rgba(250,204,21,0.12)" : "rgba(14,116,144,0.1)";
}
function as_(d) {
  return d ? "rgba(250,204,21,0.28)" : "rgba(14,116,144,0.28)";
}

function SvgVendorDash({ isDark, active }) {
  return (
    <motion.div
      role="img"
      aria-label="Vendor dashboard showing customer leads with system size, savings and status"
      style={{
        width: "100%",
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        aspectRatio: "520 / 248",
        background: isDark ? "#0b1610" : "#ffffff",
      }}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <img
        src={isDark ? vendorDashDark : vendorDashLight}
        alt="Vendor dashboard showing customer leads with system size, savings and PDF download"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          display: "block",
        }}
      />
    </motion.div>
  );
}

function SvgVendorInvite({ isDark, active }) {
  const c = tk(isDark);
  const A = "#0E7490";
  const [typed, setTyped] = useState(0);
  const link = "kins.app/invite/sunedge-a8f2k";
  useEffect(() => {
    if (!active) {
      setTyped(0);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(i);
      if (i >= link.length) clearInterval(id);
    }, 44);
    return () => clearInterval(id);
  }, [active]);

  return (
    <svg
      viewBox="0 0 520 248"
      style={{ width: "100%", display: "block" }}
      role="img"
      aria-labelledby="invite-title"
    >
      <title id="invite-title">
        Invite customer via WhatsApp, SMS or Gmail with a unique link
      </title>
      <rect
        width="520"
        height="248"
        rx="14"
        fill={isDark ? "#0b1610" : "#ffffff"}
        stroke={c.br}
        strokeWidth="1"
      />
      <motion.text
        x="260"
        y="32"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="800"
        letterSpacing="0.14em"
        fill={c.su}
        fontFamily="system-ui"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.1 }}
      >
        INVITE CUSTOMER
      </motion.text>
      <line x1="20" y1="40" x2="500" y2="40" stroke={c.br} strokeWidth="0.8" />
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.18, ease: EASE }}
      >
        <rect
          x="20"
          y="50"
          width="440"
          height="34"
          rx="8"
          fill={isDark ? "rgba(255,255,255,0.03)" : "rgba(15,76,58,0.03)"}
          stroke={as_(isDark)}
          strokeWidth="1"
        />
        <text
          x="34"
          y="71"
          fontSize="9.5"
          fontFamily="monospace"
          fill={A}
          letterSpacing="0.02em"
        >
          {link.slice(0, typed)}
          {typed < link.length ? "|" : ""}
        </text>
        <rect
          x="462"
          y="54"
          width="52"
          height="26"
          rx="6"
          fill={ab(isDark)}
          stroke={as_(isDark)}
          strokeWidth="1"
        />
        <text
          x="488"
          y="70.5"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill={A}
          fontFamily="system-ui"
        >
          COPY
        </text>
      </motion.g>
      <motion.text
        x="260"
        y="110"
        textAnchor="middle"
        fontSize="7.5"
        letterSpacing="0.1em"
        fill={c.su}
        fontFamily="system-ui"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.38 }}
      >
        SHARE VIA
      </motion.text>
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.44, ease: EASE }}
      >
        <rect
          x="36"
          y="118"
          width="128"
          height="32"
          rx="9"
          fill={isDark ? "rgba(255,255,255,0.03)" : "rgba(15,76,58,0.03)"}
          stroke={c.br}
          strokeWidth="1"
        />
        <circle cx="58" cy="134" r="9" fill="#25D366" />
        <path
          d="M58 127.5 a6.5 6.5 0 1 1 -3.8 11.8 l-2.7 0.7 0.7-2.6 A6.5 6.5 0 0 1 58 127.5z"
          fill="white"
        />
        <path
          d="M55 132 h6 M55 135 h4"
          stroke="#25D366"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        <text
          x="104"
          y="138"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill={c.tx}
          fontFamily="system-ui"
        >
          WhatsApp
        </text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.53, ease: EASE }}
      >
        <rect
          x="196"
          y="118"
          width="128"
          height="32"
          rx="9"
          fill={isDark ? "rgba(255,255,255,0.03)" : "rgba(15,76,58,0.03)"}
          stroke={c.br}
          strokeWidth="1"
        />
        <rect
          x="209"
          y="126"
          width="18"
          height="13"
          rx="3"
          fill={isDark ? "rgba(255,255,255,0.15)" : "rgba(15,76,58,0.18)"}
        />
        <polygon
          points="212,139 212,143 217,139"
          fill={isDark ? "rgba(255,255,255,0.15)" : "rgba(15,76,58,0.18)"}
        />
        <line
          x1="213"
          y1="130.5"
          x2="223"
          y2="130.5"
          stroke={isDark ? "rgba(255,255,255,0.55)" : "rgba(15,76,58,0.55)"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="213"
          y1="134"
          x2="221"
          y2="134"
          stroke={isDark ? "rgba(255,255,255,0.55)" : "rgba(15,76,58,0.55)"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <text
          x="272"
          y="138"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill={c.tx}
          fontFamily="system-ui"
        >
          SMS
        </text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.62, ease: EASE }}
      >
        <rect
          x="356"
          y="118"
          width="128"
          height="32"
          rx="9"
          fill={isDark ? "rgba(255,255,255,0.03)" : "rgba(15,76,58,0.03)"}
          stroke={c.br}
          strokeWidth="1"
        />
        <rect
          x="368"
          y="127"
          width="20"
          height="14"
          rx="2"
          fill="white"
          stroke="#e0e0e0"
          strokeWidth="0.6"
        />
        <polygon points="368,127 378,134 368,141" fill="#EA4335" />
        <polygon points="388,127 378,134 388,141" fill="#4285F4" />
        <polygon points="368,141 378,134 388,141" fill="#34A853" />
        <polygon points="368,127 378,134 388,127" fill="#FBBC05" />
        <text
          x="426"
          y="138"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill={c.tx}
          fontFamily="system-ui"
        >
          Gmail
        </text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, y: 6 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.82, ease: EASE }}
      >
        <rect
          x="20"
          y="164"
          width="480"
          height="72"
          rx="10"
          fill={isDark ? "rgba(255,255,255,0.025)" : "rgba(15,76,58,0.025)"}
          stroke={c.br}
          strokeWidth="1"
        />
        <circle
          cx="42"
          cy="190"
          r="10"
          fill={isDark ? "rgba(255,255,255,0.06)" : "rgba(15,76,58,0.08)"}
        />
        <text
          x="42"
          y="193.5"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill={c.su}
          fontFamily="system-ui"
        >
          SE
        </text>
        <text
          x="60"
          y="186"
          fontSize="8.5"
          fontWeight="700"
          fill={c.tx}
          fontFamily="system-ui"
        >
          SunEdge Solar
        </text>
        <text x="60" y="198" fontSize="8" fill={c.su} fontFamily="system-ui">
          Namaste! Check your free solar estimate ☀️
        </text>
        <rect
          x="60"
          y="208"
          width="400"
          height="20"
          rx="6"
          fill={ab(isDark)}
          stroke={as_(isDark)}
          strokeWidth="0.8"
        />
        <text
          x="260"
          y="221.5"
          textAnchor="middle"
          fontSize="8"
          fill={A}
          fontFamily="monospace"
        >
          {link}
        </text>
      </motion.g>
    </svg>
  );
}

function SvgVendorClose({ isDark, active }) {
  const c = tk(isDark);
  const A = "#0E7490";
  const [pdfDone, setPdfDone] = useState(false);
  useEffect(() => {
    if (!active) {
      setPdfDone(false);
      return;
    }
    const t = setTimeout(() => setPdfDone(true), 1800);
    return () => clearTimeout(t);
  }, [active]);
  const stats = [
    ["Panels", "12"],
    ["System", "3.96 kWp"],
    ["Monthly", "₹2,100"],
    ["Subsidy", "₹78,000"],
    ["Net Cost", "₹1.40L"],
    ["Payback", "5.6 yr"],
    ["25yr ROI", "₹8.92L"],
    ["CO₂", "89 T"],
  ];
  return (
    <svg
      viewBox="0 0 520 248"
      style={{ width: "100%", display: "block" }}
      role="img"
      aria-labelledby="close-title"
    >
      <title id="close-title">Confirmed solar proposal for Rajesh Kumar</title>
      <rect
        width="520"
        height="248"
        rx="14"
        fill={isDark ? "#0b1610" : "#ffffff"}
        stroke={c.br}
        strokeWidth="1"
      />
      <rect width="520" height="32" rx="14" fill={ab(isDark)} />
      <rect y="18" width="520" height="14" fill={ab(isDark)} />
      <circle cx="16" cy="16" r="4.5" fill={A} />
      <motion.text
        x="28"
        y="20.5"
        fontSize="8"
        fontWeight="800"
        letterSpacing="0.14em"
        fill={A}
        fontFamily="system-ui"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.1 }}
      >
        CONFIRMED · RAJESH KUMAR
      </motion.text>
      <motion.text
        x="504"
        y="20.5"
        textAnchor="end"
        fontSize="7"
        fill={c.su}
        fontFamily="system-ui"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.15 }}
      >
        2 min ago
      </motion.text>
      <line x1="0" y1="32" x2="520" y2="32" stroke={c.br} strokeWidth="1" />
      {stats.map(([k, v], i) => {
        const cx = 14 + (i % 4) * 123,
          cy = 40 + Math.floor(i / 4) * 62;
        return (
          <motion.g
            key={k}
            initial={{ opacity: 0, y: 5 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.18 + i * 0.065, ease: EASE }}
          >
            <rect
              x={cx}
              y={cy}
              width="109"
              height="50"
              rx="7"
              fill={isDark ? "rgba(255,255,255,0.028)" : "rgba(15,76,58,0.035)"}
              stroke={c.br}
              strokeWidth="0.8"
            />
            <text
              x={cx + 9}
              y={cy + 16}
              fontSize="7"
              fill={c.su}
              fontFamily="system-ui"
            >
              {k}
            </text>
            <text
              x={cx + 9}
              y={cy + 37}
              fontSize="13"
              fontWeight="800"
              fill={c.tx}
              fontFamily="system-ui"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {v}
            </text>
          </motion.g>
        );
      })}
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.0, ease: EASE }}
      >
        <rect
          x="14"
          y="172"
          width="238"
          height="40"
          rx="8"
          fill={pdfDone ? A : ab(isDark)}
          stroke={as_(isDark)}
          strokeWidth="1"
        />
        <text
          x="133"
          y="196.5"
          textAnchor="middle"
          fontSize="10"
          fontWeight="800"
          fontFamily="system-ui"
          fill={pdfDone ? (isDark ? "#1A2E25" : "#ffffff") : A}
        >
          {pdfDone ? "✓  PDF Downloaded" : "↓  Download PDF"}
        </text>
        <rect
          x="262"
          y="172"
          width="244"
          height="40"
          rx="8"
          fill="transparent"
          stroke={c.br}
          strokeWidth="1"
        />
        <text
          x="384"
          y="196.5"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill={c.su}
          fontFamily="system-ui"
        >
          View Their 3D Roof →
        </text>
      </motion.g>
    </svg>
  );
}

function SvgCustomerRoof({ isDark, active }) {
  const c = tk(isDark);
  const A = "#0E7490";
  return (
    <motion.div
      role="img"
      aria-label="Live 3D model of your roof with solar panels placed for maximum output, obstacles flagged"
      style={{
        width: "100%",
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        aspectRatio: "520 / 248",
        background: isDark ? "#0b1610" : "#f0f7f1",
      }}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <img
        src={roofImg}
        alt="3D roof view showing 14 solar panels placed for maximum output with obstacles detected"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          display: "block",
        }}
      />
      <motion.div
        style={{
          position: "absolute",
          top: 10,
          left: 12,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "4px 12px 4px 8px",
          borderRadius: 999,
          background: "rgba(4,10,6,0.9)",
          border: "1px solid rgba(79,195,247,0.4)",
        }}
        initial={{ opacity: 0, y: -6 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#4fc3f7",
          }}
        />
        <span
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "#4fc3f7",
            fontFamily: "system-ui",
          }}
        >
          LIVE 3D MODEL
        </span>
      </motion.div>
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: isDark ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.94)",
          borderTop: `1px solid ${c.br}`,
          display: "flex",
          alignItems: "center",
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
      >
        {["14 panels", "₹2,724/mo", "₹78K subsidy", "5.6yr payback"].map(
          (v, i) => (
            <div
              key={v}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "7px 4px",
                borderLeft: i > 0 ? `1px solid ${c.br}` : "none",
              }}
            >
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: A,
                  fontFamily: "system-ui",
                }}
              >
                {v}
              </span>
            </div>
          )
        )}
      </motion.div>
    </motion.div>
  );
}

function SvgCustomerDash({ isDark, active }) {
  const c = tk(isDark);
  const A = "#0E7490";
  const [sunPct, setSunPct] = useState(0.68);
  useEffect(() => {
    if (!active) {
      setSunPct(0.68);
      return;
    }
    let t = 0.68,
      dir = -1;
    const id = setInterval(() => {
      t += 0.004 * dir;
      if (t < 0.12) dir = 1;
      if (t > 0.94) dir = -1;
      setSunPct(t);
    }, 40);
    return () => clearInterval(id);
  }, [active]);
  const liveKw = (
    3.96 *
    Math.sin(Math.max(sunPct * Math.PI, 0)) *
    0.75
  ).toFixed(2);
  const gaugeArc = parseFloat(liveKw) / 3.96;
  const timeH = Math.floor(6 + sunPct * 12);
  const timeStr = `${String(timeH % 12 || 12).padStart(2, "0")}:${
    sunPct > 0.5 ? "35" : "10"
  } ${timeH >= 12 ? "PM" : "AM"}`;
  return (
    <svg
      viewBox="0 0 520 248"
      style={{ width: "100%", display: "block" }}
      role="img"
      aria-labelledby="dash-title"
    >
      <title id="dash-title">Live solar dashboard</title>
      <rect
        width="520"
        height="248"
        rx="14"
        fill={isDark ? "#0b1610" : "#ffffff"}
        stroke={c.br}
        strokeWidth="1"
      />
      <rect
        x="8"
        y="8"
        width="246"
        height="156"
        rx="10"
        fill={isDark ? "rgba(5,12,22,0.85)" : "rgba(210,230,250,0.45)"}
        stroke={c.br}
        strokeWidth="0.8"
      />
      <text
        x="20"
        y="24"
        fontSize="6.5"
        fontWeight="800"
        letterSpacing="0.14em"
        fill={c.su}
        fontFamily="system-ui"
      >
        SUN POSITION
      </text>
      <text
        x="20"
        y="48"
        fontSize="22"
        fontWeight="800"
        fill={c.tx}
        fontFamily="system-ui"
      >
        {timeStr}
      </text>
      <rect
        x="178"
        y="34"
        width="38"
        height="14"
        rx="7"
        fill={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}
        stroke={c.br}
        strokeWidth="1"
      />
      <circle cx="187" cy="41" r="2.5" fill={A} />
      <text
        x="204"
        y="44.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="800"
        fill={A}
        fontFamily="system-ui"
      >
        LIVE
      </text>
      <text x="20" y="62" fontSize="6.5" fill={c.su} fontFamily="system-ui">
        6 AM
      </text>
      <text
        x="234"
        y="62"
        textAnchor="end"
        fontSize="6.5"
        fill={c.su}
        fontFamily="system-ui"
      >
        6 PM
      </text>
      <rect
        x="20"
        y="66"
        width="214"
        height="3"
        rx="1.5"
        fill={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)"}
      />
      <rect x="20" y="66" width={214 * sunPct} height="3" rx="1.5" fill={A} />
      <circle
        cx={20 + 214 * sunPct}
        cy="67.5"
        r="6"
        fill={isDark ? "#111c14" : "#fff"}
        stroke={A}
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="76"
        width="234"
        height="60"
        rx="6"
        fill={isDark ? "rgba(255,255,255,0.02)" : "rgba(200,225,245,0.38)"}
      />
      <path
        d="M 24 124 Q 131 72 238 124"
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(15,76,58,0.08)"}
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <circle
        cx={24 + sunPct * 214}
        cy={124 - Math.sin(sunPct * Math.PI) * 46}
        r="8"
        fill={A}
        opacity="0.92"
      />
      <line
        x1="14"
        y1="124"
        x2="248"
        y2="124"
        stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(15,76,58,0.08)"}
        strokeWidth="0.8"
      />
      <rect
        x="96"
        y="92"
        width="72"
        height="44"
        rx="3"
        fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(15,76,58,0.14)"}
      />
      {[
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ].map(([col, row]) => (
        <g key={`${col}${row}`}>
          <rect
            x={100 + col * 22}
            y={96 + row * 18}
            width="19"
            height="15"
            rx="1"
            fill="#1e4585"
            stroke="rgba(79,195,247,0.38)"
            strokeWidth="0.7"
          />
          <line
            x1={100 + col * 22 + 6}
            y1={96 + row * 18}
            x2={100 + col * 22 + 6}
            y2={96 + row * 18 + 15}
            stroke="rgba(79,195,247,0.2)"
            strokeWidth="0.4"
          />
          <line
            x1={100 + col * 22 + 13}
            y1={96 + row * 18}
            x2={100 + col * 22 + 13}
            y2={96 + row * 18 + 15}
            stroke="rgba(79,195,247,0.2)"
            strokeWidth="0.4"
          />
          <line
            x1={100 + col * 22}
            y1={96 + row * 18 + 7}
            x2={100 + col * 22 + 19}
            y2={96 + row * 18 + 7}
            stroke="rgba(79,195,247,0.2)"
            strokeWidth="0.4"
          />
        </g>
      ))}
      {[
        ["GHI", "126", "W/m²", 14],
        ["POA", "28", "W/m²", 96],
        ["OUTPUT", liveKw, "kW", 178],
      ].map(([l, v, u, x]) => (
        <motion.g
          key={l}
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          <rect
            x={x}
            y="142"
            width="72"
            height="20"
            rx="5"
            fill={isDark ? "rgba(255,255,255,0.03)" : "rgba(15,76,58,0.04)"}
            stroke={c.br}
            strokeWidth="0.7"
          />
          <text
            x={x + 8}
            y="151"
            fontSize="6.5"
            fill={c.su}
            fontFamily="system-ui"
            fontWeight="700"
          >
            {l}
          </text>
          <text
            x={x + 8}
            y="158.5"
            fontSize="8.5"
            fontWeight="800"
            fill={A}
            fontFamily="system-ui"
          >
            {v}{" "}
            <tspan fontSize="6" fill={c.su}>
              {u}
            </tspan>
          </text>
        </motion.g>
      ))}
      <rect
        x="262"
        y="8"
        width="250"
        height="156"
        rx="10"
        fill={isDark ? "rgba(255,255,255,0.02)" : "rgba(15,76,58,0.025)"}
        stroke={c.br}
        strokeWidth="0.8"
      />
      <text
        x="276"
        y="24"
        fontSize="6.5"
        fontWeight="800"
        letterSpacing="0.14em"
        fill={c.su}
        fontFamily="system-ui"
      >
        LIVE PERFORMANCE
      </text>
      <path
        d="M 330 100 A 50 50 0 0 1 450 100"
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 330 100 A 50 50 0 0 1 450 100"
        fill="none"
        stroke={A}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${gaugeArc * 157} 157`}
      />
      <text
        x="390"
        y="94"
        textAnchor="middle"
        fontSize="24"
        fontWeight="900"
        fill={c.tx}
        fontFamily="system-ui"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {liveKw}
      </text>
      <text
        x="390"
        y="110"
        textAnchor="middle"
        fontSize="7.5"
        fill={c.su}
        fontFamily="system-ui"
      >
        kW of 3.96 kWp
      </text>
      {[
        ["Shaded:", "4", 276],
        ["Clip:", "—", 340],
        ["Temp:", "24.9°C", 392],
      ].map(([k, v, x]) => (
        <g key={k}>
          <text x={x} y="128" fontSize="7" fill={c.su} fontFamily="system-ui">
            {k}
          </text>
          <text
            x={x + 32}
            y="128"
            fontSize="8"
            fontWeight="700"
            fill={A}
            fontFamily="system-ui"
          >
            {v}
          </text>
        </g>
      ))}
      <text x="276" y="143" fontSize="7" fill={c.su} fontFamily="system-ui">
        POA Irradiance
      </text>
      <text
        x="504"
        y="143"
        textAnchor="end"
        fontSize="8"
        fontWeight="700"
        fill={A}
        fontFamily="system-ui"
      >
        28 W/m²
      </text>
      <rect
        x="276"
        y="147"
        width="228"
        height="3"
        rx="1.5"
        fill={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}
      />
      <rect
        x="276"
        y="147"
        width={228 * Math.sin(sunPct * Math.PI)}
        height="3"
        rx="1.5"
        fill={A}
      />
      {[
        ["SOLAR PANELS", "14", "panels", 8],
        ["SYSTEM SIZE", "3.96", "kWp", 138],
        ["LIVE OUTPUT", liveKw, "kW", 268],
        ["CELL TEMP", "24.9", "°C", 396],
      ].map(([lbl, val, unit, x]) => (
        <motion.g
          key={lbl}
          initial={{ opacity: 0, y: 4 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.75, ease: EASE }}
        >
          <rect
            x={x}
            y="170"
            width="122"
            height="48"
            rx="8"
            fill={isDark ? "rgba(255,255,255,0.028)" : "rgba(15,76,58,0.035)"}
            stroke={c.br}
            strokeWidth="0.8"
          />
          <text
            x={x + 9}
            y="183"
            fontSize="6.5"
            fontWeight="800"
            letterSpacing="0.1em"
            fill={c.su}
            fontFamily="system-ui"
          >
            {lbl}
          </text>
          <text
            x={x + 9}
            y="206"
            fontSize="18"
            fontWeight="800"
            fill={A}
            fontFamily="system-ui"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {val}
          </text>
          <text
            x={x + 9 + String(val).length * 11}
            y="206"
            fontSize="8"
            fill={c.su}
            fontFamily="system-ui"
          >
            {" "}
            {unit}
          </text>
        </motion.g>
      ))}
      <motion.g
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.9 }}
      >
        <rect
          x="8"
          y="224"
          width="504"
          height="16"
          rx="8"
          fill={isDark ? "rgba(255,255,255,0.02)" : "rgba(15,76,58,0.03)"}
          stroke={c.br}
          strokeWidth="0.8"
        />
        {[
          ["MONTHLY", "₹2,724", 18],
          ["YEAR 1", "5,029 kWh", 140],
          ["SUBSIDY", "₹78,000", 260],
          ["PAYBACK", "4.3 yrs", 376],
          ["CO₂", "82.2 T", 462],
        ].map(([k, v, x], i) => (
          <g key={k}>
            {i > 0 && (
              <line
                x1={x - 8}
                y1="225"
                x2={x - 8}
                y2="239"
                stroke={c.br}
                strokeWidth="0.7"
              />
            )}
            <text
              x={x}
              y="231"
              fontSize="5.5"
              fontWeight="800"
              letterSpacing="0.07em"
              fill={c.su}
              fontFamily="system-ui"
            >
              {k}
            </text>
            <text
              x={x}
              y="239"
              fontSize="8"
              fontWeight="800"
              fill={A}
              fontFamily="system-ui"
            >
              {v}
            </text>
          </g>
        ))}
      </motion.g>
    </svg>
  );
}

function SvgCustomerEditor({ isDark, active }) {
  const c = tk(isDark);
  const A = "#0E7490";
  return (
    <motion.div
      role="img"
      aria-label="Solar panel layout editor showing 11 panels, 3.63 kWp system with drag and toggle controls"
      style={{
        width: "100%",
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        aspectRatio: "520 / 248",
        background: isDark ? "#0b1610" : "#f8fdf9",
      }}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <img
        src={isDark ? editorDark : editorLight}
        alt="Solar panel layout editor with 11 panels generating 3.63 kWp and ₹1,921 monthly savings"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          display: "block",
        }}
      />
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: isDark ? "rgba(0,0,0,0.88)" : "rgba(255,255,255,0.96)",
          borderTop: `1px solid ${c.br}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 14px",
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: c.su,
            fontFamily: "system-ui",
          }}
        >
          11 panels · 3.63 kWp · <span style={{ color: A }}>₹1,921/mo</span>
        </span>
        <div
          style={{
            padding: "5px 14px",
            borderRadius: 7,
            background: isDark ? "#166534" : "#15803d",
            fontSize: 8,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "system-ui",
            letterSpacing: "0.04em",
          }}
        >
          Apply ✓
        </div>
      </motion.div>
    </motion.div>
  );
}

const VENDOR_STEPS = [
  {
    num: "01",
    tag: "Manage",
    headline: "Every lead, tracked.",
    body: "All your customers in one place — system size, savings, status. Download any proposal PDF or open their 3D roof view directly from your dashboard.",
    proof: "Confirmed lead → PDF in one click",
    Svg: SvgVendorDash,
  },
  {
    num: "02",
    tag: "Share",
    headline: "Send a link. They do the rest.",
    body: "Generate a unique invite link and share it on WhatsApp, SMS, or Gmail. The customer opens it, explores their roof design, and fills their details — you never leave your desk.",
    proof: "WhatsApp · SMS · Gmail · zero friction",
    Svg: SvgVendorInvite,
  },
  {
    num: "03",
    tag: "Convert",
    headline: "Approved. Proposal ready.",
    body: "The moment a customer confirms their design, you're notified. Their full proposal PDF is auto-generated — just download it and call to book the install.",
    proof: "₹1.40L net · 5.6yr payback · auto-generated PDF",
    Svg: SvgVendorClose,
  },
];

const CUSTOMER_STEPS = [
  {
    num: "01",
    tag: "Visualise",
    headline: "Your roof. Your panels. Real data.",
    body: "Open the link and see your actual roof — obstacles flagged, panels placed in the highest-output layout. Real satellite data, not a generic illustration.",
    proof: "Live 3D · obstacles detected · max output placed",
    Svg: SvgCustomerRoof,
  },
  {
    num: "02",
    tag: "Analyse",
    headline: "See exactly what you'll earn.",
    body: "Drag the sun across the sky and watch your live kW output update in real time. Monthly savings, government subsidy, payback period, and 25-year projection — all on one screen.",
    proof: "₹2,724/mo · ₹78K subsidy · 4.3yr payback",
    Svg: SvgCustomerDash,
  },
  {
    num: "03",
    tag: "Approve",
    headline: "Adjust, approve, done.",
    body: "Toggle panels off, drag to reposition, or let Auto Layout re-optimise. When the numbers look right — hit Apply. Your vendor gets notified instantly.",
    proof: "Drag · toggle · optimise · confirm in one tap",
    Svg: SvgCustomerEditor,
  },
];

function StepRow({ step, index, isDark, accentColor }) {
  const c = tk(isDark);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-12% 0px -22% 0px" });
  const isLeft = index % 2 === 0;
  const { Svg } = step;
  const bodyColor = isDark ? "#94a3b8" : "#374151";

  const textContent = (
    <div>
      <motion.div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.35, delay: 0.05, ease: EASE }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: accentColor,
            fontFamily: "system-ui",
          }}
        >
          {step.num}
        </span>
        <span
          style={{
            width: 1,
            height: 12,
            background: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(15,76,58,0.15)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accentColor,
            fontFamily: "system-ui",
          }}
        >
          {step.tag}
        </span>
      </motion.div>
      {/* Heading — no overflow-hidden, no clip risk */}
      <motion.h3
        className="font-[font5]"
        style={{
          fontSize: "clamp(22px,3vw,40px)",
          fontWeight: 300,
          letterSpacing: "-0.03em",
          color: c.tx,
          margin: "0 0 18px",
          lineHeight: 1.12,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
      >
        {step.headline}
      </motion.h3>
      <motion.p
        className="font-[font3]"
        style={{
          fontSize: "clamp(13px,1.5vw,14.5px)",
          color: bodyColor,
          lineHeight: 1.75,
          margin: "0 0 26px",
          maxWidth: 400,
        }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
      >
        {step.body}
      </motion.p>
      <motion.div
        style={{ display: "flex", alignItems: "center", gap: 12 }}
        initial={{ opacity: 0, x: -8 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
        transition={{ duration: 0.4, delay: 0.26, ease: EASE }}
      >
        <div
          style={{
            width: 2,
            height: 26,
            background: accentColor,
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
        <span
          className="font-[font3]"
          style={{
            fontSize: "clamp(10px,1.2vw,11px)",
            fontWeight: 600,
            color: accentColor,
            letterSpacing: "0.03em",
          }}
        >
          {step.proof}
        </span>
      </motion.div>
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        padding: "clamp(40px,6vw,88px) 0",
        borderBottom: `1px solid ${c.dv}`,
      }}
    >
      <div className="whyus-row" style={{ gap: "clamp(24px,5vw,80px)" }}>
        <motion.div
          className={isLeft ? "whyus-svg-left" : "whyus-svg-right"}
          style={{
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${c.dv}`,
            boxShadow: isDark
              ? "0 24px 60px rgba(0,0,0,0.5)"
              : "0 16px 48px rgba(15,76,58,0.1)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
        >
          <Svg isDark={isDark} active={isInView} />
        </motion.div>
        <div className={isLeft ? "whyus-text-left" : "whyus-text-right"}>
          {textContent}
        </div>
      </div>
    </div>
  );
}

export default function WhyUs() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("vendor");
  const c = tk(isDark);
  const steps = tab === "vendor" ? VENDOR_STEPS : CUSTOMER_STEPS;
  const accent = isDark ? Y : T;

  return (
    <section
      className={`relative w-full overflow-hidden font-[font3] transition-colors duration-500 ${
        isDark ? "bg-[#09100e]" : "bg-[#f7f9f7]"
      }`}
      style={{
        paddingTop: "clamp(60px,10vw,140px)",
        paddingBottom: "clamp(40px,8vw,100px)",
      }}
      aria-label="Platform features for vendors and customers"
    >
      <style>{`
        .whyus-row{display:flex;flex-direction:column;}
        @media(min-width:1024px){
          .whyus-row{display:grid;grid-template-columns:1fr 1fr;align-items:center;}
          .whyus-svg-left{order:2;} .whyus-text-left{order:1;}
          .whyus-svg-right{order:1;} .whyus-text-right{order:2;}
        }
      `}</style>

      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: c.dv, transformOrigin: "left" }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 108%, #0F4C3A18 0%, transparent 70%)",
            opacity: isDark ? 1 : 0.5,
          }}
        />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle, ${
            isDark ? "rgba(255,255,255,0.016)" : "rgba(15,76,58,0.04)"
          } 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-8 mb-10 lg:mb-14">
          <div>
            <motion.div
              className="flex items-center gap-3 mb-4 lg:mb-6"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <div className="w-5 h-px bg-[#FACC15]" />
              <span className="font-[font3] text-[10px] font-bold tracking-[0.28em] uppercase text-[#FACC15]">
                The Platform
              </span>
            </motion.div>

            {/* Heading — opacity+y fade, NO overflow-hidden wrapper */}
            <motion.h2
              className="font-[font5] font-light leading-none tracking-[-0.04em] m-0 mb-2"
              style={{ fontSize: "clamp(36px,5.8vw,88px)", color: c.tx }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.04 }}
            >
              Built for Both
            </motion.h2>
            <motion.h2
              className="font-[font5] font-light leading-none tracking-[-0.04em] m-0"
              style={{ fontSize: "clamp(36px,5.8vw,88px)", color: c.tx }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
            >
              Vendor and Customer
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.18 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "flex-end",
            }}
            className="max-lg:items-start"
          >
            <p
              className="font-[font3] text-sm max-lg:text-left lg:text-right"
              style={{ color: c.su, maxWidth: 280, lineHeight: 1.65 }}
            >
              Everything both sides need — in one platform.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: 4,
                borderRadius: 999,
                gap: 4,
                background: isDark ? "rgba(255,255,255,0.04)" : "#e8f0eb",
                border: `1.5px solid ${
                  isDark ? "rgba(255,255,255,0.06)" : "#c4d9c9"
                }`,
              }}
            >
              {[
                { id: "vendor", label: "For Vendors" },
                { id: "customer", label: "For Customers" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    position: "relative",
                    padding: "8px 20px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: "transparent",
                    zIndex: 1,
                    color:
                      tab === id
                        ? isDark
                          ? "#f0faf4"
                          : "#ffffff"
                        : isDark
                        ? "#4a7a62"
                        : "#4a6a56",
                    transition: "color 0.2s ease",
                    letterSpacing: "0.04em",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                  {tab === id && (
                    <motion.div
                      layoutId="tab-bg"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 999,
                        zIndex: -1,
                        background: isDark
                          ? "linear-gradient(135deg,#0F4C3A 0%,#0a3828 100%)"
                          : "#0F4C3A",
                        boxShadow: isDark
                          ? "0 2px 12px rgba(15,76,58,0.38)"
                          : "none",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {steps.map((step, i) => (
              <StepRow
                key={step.num}
                step={step}
                index={i}
                isDark={isDark}
                accentColor={accent}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: c.dv, transformOrigin: "left" }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }}
      />
    </section>
  );
}
