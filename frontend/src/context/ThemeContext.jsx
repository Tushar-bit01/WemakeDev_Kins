import { createContext, useContext, useState, useRef, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

export const ThemeProvider = ({ children }) => {
  // ── Persist theme across page navigations via localStorage ──
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved !== null) return saved === "dark";
    } catch {}
    return true; // default: dark
  });

  const modeRef = useRef(isDark ? 1.0 : 0.0);
  const targetModeRef = useRef(isDark ? 1.0 : 0.0);

  useEffect(() => {
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
    modeRef.current = isDark ? 1.0 : 0.0;
    targetModeRef.current = isDark ? 1.0 : 0.0;
  }, [isDark]);

  const toggleMode = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleMode, modeRef, targetModeRef }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;