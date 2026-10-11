// ── Brand tokens ─────────────────────────────────────────────
export const C = {
    green:  "#0F4C3A",
    yellow: "#FACC15",
    teal:   "#0E7490",
    light:  "#f7f9f7",
    dark:   "#09100e",
    text:   { light: "#1A2E25", dark: "#E2E8F0" },
    sub:    { light: "#5a7a69", dark: "#6b9e85" },
    card:   { light: "#ffffff", dark: "#0e1812" },
    border: { light: "#ddeae2", dark: "#1a2e20" },
  };
  
  export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  
  export const fmt  = (n) => (n ?? 0).toLocaleString("en-IN");
  export const fmtL = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${fmt(n)}`;
  
  /** Returns { text, sub, card, border } for current theme */
  export function useThemeTokens(isDark) {
    return {
      text:   isDark ? C.text.dark   : C.text.light,
      sub:    isDark ? C.sub.dark    : C.sub.light,
      card:   isDark ? C.card.dark   : C.card.light,
      border: isDark ? C.border.dark : C.border.light,
    };
  }