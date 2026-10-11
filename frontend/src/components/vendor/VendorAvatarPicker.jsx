// src/components/vendor/VendorAvatarPicker.jsx
// Vendor ka avatar picker — same layout as customer AvatarPicker
// Syncs with VendorContext.profileImg → Navbar + VendorHero + UserDropdown teeno

import { useRef }            from "react";
import { C, useThemeTokens } from "../design/tokens";
import { VENDOR_AVATARS }    from "../../context/VendorContext";
import ProfileAvatar         from "../customer/ProfileAvatar";

export default function VendorAvatarPicker({ draft, setDraft, isDark, profileImg, vendorName }) {
  const { sub, border } = useThemeTokens(isDark);
  const fileRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 200;
      const ratio = Math.min(MAX / img.width, MAX / img.height);
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      setDraft(d => ({ ...d, photo: compressed, avatar: null }));
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

      {/* Left — current preview + upload button */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3 lg:w-32">

        {/* Same ProfileAvatar as hero + navbar — always in sync */}
        <ProfileAvatar name={vendorName} profileImg={profileImg} size={96} key={profileImg} />

        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 w-full justify-center"
          style={{ background: "transparent", color: sub, border: `1.5px solid ${border}` }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = border;  e.currentTarget.style.color = sub; }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Logo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        {draft.photo && (
          <button
            onClick={() => setDraft(d => ({ ...d, photo: null, avatar: "vav1" }))}
            className="text-[10px] font-bold tracking-wider uppercase transition-all"
            style={{ color: sub }}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = sub}>
            Remove
          </button>
        )}
      </div>

      {/* Dividers */}
      <div className="hidden lg:block w-px self-stretch" style={{ background: border }} />
      <div className="block lg:hidden h-px"              style={{ background: border }} />

      {/* Right — 8 vendor avatar grid */}
      <div className="flex-1">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-4" style={{ color: sub }}>
          Choose a Company Avatar
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {VENDOR_AVATARS.map(a => {
            const sel = draft.avatar === a.id && !draft.photo;
            return (
              <button key={a.id}
                onClick={() => setDraft(d => ({ ...d, avatar: a.id, photo: null }))}
                className="relative rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  aspectRatio: "1",
                  background: isDark ? "#0e1812" : "#f0f7f2",
                  border:    sel ? `2.5px solid ${C.green}` : `1.5px solid ${border}`,
                  boxShadow: sel ? `0 0 14px ${C.green}55`  : "none",
                  transform: sel ? "scale(1.07)"             : "scale(1)",
                }}>
                <img src={a.src} alt={`Vendor Avatar ${a.id}`}
                  className="w-full h-full object-cover"
                  onError={e => {
                    // Fallback: show initials tile when image 404s
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.style.background = C.green;
                  }} />
                {sel && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `${C.green}44` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}