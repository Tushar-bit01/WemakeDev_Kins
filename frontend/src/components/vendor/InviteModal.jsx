import { useState, useEffect } from "react";
import { X, Link2, Check, Loader } from "lucide-react";
import { C, useThemeTokens } from "../design/tokens";
import api from "../../api/axios";

export default function InviteModal({ isOpen, onClose, isDark }) {
  const { text, sub, card, border } = useThemeTokens(isDark);
  const miniBg = isDark ? "#0a1610" : "#f0f7f2";
  const shadow = isDark ? "0 8px 40px #00000060" : "0 8px 40px #0F4C3A18";
  const overlay = isDark ? "rgba(0,0,0,0.72)" : "rgba(15,30,20,0.45)";

  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setCopied(false);
    setLink("");
    setExpiresAt("");
    setLoading(true);

    // ✅ Backend mounts vendor routes at /api/vendor
    api
      .get("/api/vendor/me/invite-link")
      .then((res) => {
        console.log("Full response:", res.data);
        const data = res.data?.data;
        setLink(data?.inviteLink || "");
        setExpiresAt(data?.expires_at || "");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not generate invite link. Please try again.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const expiryLabel = expiresAt
    ? `Expires ${new Date(expiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} · One use per customer`
    : "One use per customer";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-[font3]"
      style={{ background: overlay, backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md"
        style={{
          background: card,
          border: `1.5px solid ${border}`,
          boxShadow: shadow,
          borderRadius: "28px",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between"
          style={{
            padding: "24px 24px 20px",
            borderBottom: `1.5px solid ${border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${C.green}22`,
                border: `1.5px solid ${C.green}44`,
              }}
            >
              <Link2 size={18} style={{ color: C.green }} />
            </div>
            <div>
              <h2
                className="text-base font-bold leading-tight"
                style={{ color: text }}
              >
                Invite a Customer
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: sub }}>
                Share this link — they'll be linked to your account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: miniBg, border: `1.5px solid ${border}` }}
          >
            <X size={15} style={{ color: sub }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }} className="space-y-4">
          {/* Link box */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: miniBg,
              border: `1.5px solid ${copied ? C.green : border}`,
              transition: "border-color 0.3s",
            }}
          >
            <div className="px-4 py-3 flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-2 flex-1">
                  <Loader
                    size={14}
                    className="animate-spin flex-shrink-0"
                    style={{ color: sub }}
                  />
                  <p className="text-xs" style={{ color: sub }}>
                    Generating your invite link…
                  </p>
                </div>
              ) : error ? (
                <p className="text-xs flex-1" style={{ color: "#ef4444" }}>
                  {error}
                </p>
              ) : (
                <p
                  className="text-xs flex-1 truncate font-medium"
                  style={{ color: text }}
                >
                  {link || "—"}
                </p>
              )}
              <button
                onClick={handleCopy}
                disabled={!link || loading}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all duration-200 disabled:opacity-40"
                style={{
                  background: copied ? "#16a34a" : C.green,
                  color: "#fff",
                  border: `1.5px solid ${copied ? "#16a34a" : C.green}`,
                }}
                onMouseEnter={(e) => {
                  if (!copied && link) e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {copied ? (
                  <>
                    <Check size={12} /> Copied
                  </>
                ) : (
                  <>
                    <Link2 size={12} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share via */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: border }} />
            <p
              className="text-[10px] font-bold tracking-wider uppercase"
              style={{ color: sub }}
            >
              Share via
            </p>
            <div className="flex-1 h-px" style={{ background: border }} />
          </div>
          <div className="flex gap-3">
            {/* WhatsApp */}
            <button
              onClick={() =>
                link &&
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    "Hi! I'd like to invite you to get a free solar estimate through Kins. Click the link to get started: " +
                      link
                  )}`,
                  "_blank"
                )
              }
              disabled={!link || loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold tracking-wider uppercase transition-all duration-200 disabled:opacity-40"
              style={{
                background: miniBg,
                color: "#25D366",
                border: `1.5px solid ${border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#25D366";
                e.currentTarget.style.background = isDark
                  ? "#0a1f0e"
                  : "#f0fdf4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.background = miniBg;
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>
            {/* Email */}
            <button
              onClick={() =>
                link &&
                window.open(
                  `mailto:?subject=${encodeURIComponent(
                    "Your Free Solar Estimate — Kins"
                  )}&body=${encodeURIComponent(
                    "Hi,\n\nI'd like to invite you to get a free solar estimate through Kins.\n\nClick this link to get started:\n" +
                      link +
                      "\n\nBest,\nYour Solar Vendor"
                  )}`,
                  "_blank"
                )
              }
              disabled={!link || loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold tracking-wider uppercase transition-all duration-200 disabled:opacity-40"
              style={{
                background: miniBg,
                color: sub,
                border: `1.5px solid ${border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.teal;
                e.currentTarget.style.color = C.teal;
                e.currentTarget.style.background = isDark
                  ? "#071a1f"
                  : "#f0f9ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.color = sub;
                e.currentTarget.style.background = miniBg;
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
              Email
            </button>
          </div>
          <p className="text-center text-[11px]" style={{ color: sub }}>
            {expiryLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
