import { motion } from "motion/react";

export default function BillingToggle({ billed, onChange, savingsPct, isDark }) {
  return (
    <div
      className="flex items-center p-1 rounded-full gap-1 transition-colors duration-300 w-full sm:w-auto sm:inline-flex"
      style={{
        background: isDark ? "#ffffff0a" : "#e8f0eb",
        border: `1.5px solid ${isDark ? "#ffffff10" : "#c4d9c9"}`,
      }}
    >
      {["monthly", "annually"].map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className="relative flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors duration-200 z-10 text-center"
          style={{
            color: billed === tab
              ? isDark ? "#f0faf4" : "#fff"
              : isDark ? "#4a7a62" : "#4a6a56",
          }}
        >
          {tab === "annually" ? (
            <span className="flex items-center justify-center gap-2">
              Annually
              <span
                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                style={{ background: "#FACC15", color: "#1A2E25" }}
              >
                -{savingsPct}%
              </span>
            </span>
          ) : (
            "Monthly"
          )}

          {billed === tab && (
            <motion.div
              layoutId="billing-bg"
              className="absolute inset-0 rounded-full -z-10"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #0F4C3A 0%, #0a3828 100%)"
                  : "#0F4C3A",
                boxShadow: isDark ? "0 2px 12px #0F4C3A60" : "none",
              }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}