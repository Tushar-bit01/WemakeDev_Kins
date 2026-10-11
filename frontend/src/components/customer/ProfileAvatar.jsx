// src/components/customer/ProfileAvatar.jsx
// Single component used in ProfileHero, AvatarPicker, and UserDropdown
// so all three always show the exact same image/initials.

import { C } from "../design/tokens";

export default function ProfileAvatar({ name, profileImg, size = 80, border = true }) {
  const initials = (name || "US")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fontSize = size * 0.28;

  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: C.green,
        border: border ? `2.5px solid ${C.green}` : "none",
        flexShrink: 0,
      }}
    >
      {profileImg ? (
        <img
          src={profileImg}
          alt={name}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <span style={{ color: C.yellow, fontWeight: 800, fontSize, letterSpacing: "0.04em" }}>
          {initials}
        </span>
      )}
    </div>
  );
}