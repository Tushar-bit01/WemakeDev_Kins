import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser }   from "../../context/UserContext";
import { useVendor } from "../../context/VendorContext";
import ProfileAvatar from "../customer/ProfileAvatar";
import api, { getToken, removeToken } from "../../api/axios";

// Read role from JWT — works anywhere regardless of current route
const getTokenRole = () => {
  try {
    const token = localStorage.getItem("kins_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.role || null; // "customer" | "vendor"
  } catch {
    return null;
  }
};

export default function UserDropdown({ isDark }) {
  const [isOpen,     setIsOpen]     = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  const { customer, profileImg: customerProfileImg, clearProfile: clearCustomer } = useUser();
  const { vendor,   profileImg: vendorProfileImg,   clearProfile: clearVendor }   = useVendor();

  // Use token role as source of truth — not pathname — so it works on home page too
  const tokenRole  = getTokenRole();
  const isVendor   = tokenRole === "vendor";

  const profileImg   = isVendor ? vendorProfileImg   : customerProfileImg;
  const displayName  = isVendor ? vendor.companyName  : customer.username;
  const displayEmail = isVendor ? vendor.email         : customer.email;
  const firstName    = (isVendor ? vendor.companyName : customer.username || "")
    .split(" ")[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const token = getToken();
    removeToken();
    if (isVendor) clearVendor(); else clearCustomer();
    setIsOpen(false);
    try {
      await api.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
      navigate(isVendor ? "/vendor/login" : "/login", { replace: true });
    }
  };

  const profileLink = isVendor ? "/vendor/profile" : "/profile";

  return (
    <div className="relative" ref={dropdownRef}>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group cursor-pointer"
      >
        <ProfileAvatar
          name={isVendor ? vendor.companyName : customer.username}
          profileImg={profileImg}
          size={40}
          border={false}
        />
        <span className={`text-sm font-medium font-[font3] whitespace-nowrap ${
          isDark ? "text-white/90" : "text-black/80"
        }`}>
          {firstName}
        </span>
        <svg
          style={{
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          className={isDark ? "text-white/60" : "text-black/50"}
          width="16" height="16" viewBox="0 0 18 20" fill="none"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-lg p-2 z-50 ${
          isDark
            ? "bg-black/80 backdrop-blur-xl border-white/10 text-white"
            : "bg-white/80 backdrop-blur-xl border-black/10 text-gray-800"
        }`}>

          {/* Name + email header */}
          <div className={`px-3 py-2 mb-1 border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
            <p className={`text-sm font-semibold font-[font3] truncate ${isDark ? "text-white" : "text-gray-800"}`}>
              {displayName}
            </p>
            <p className={`text-xs mt-0.5 truncate ${isDark ? "text-white/50" : "text-gray-500"}`}>
              {displayEmail}
            </p>
          </div>

          {/* Edit Profile */}
          <Link
            to={profileLink}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium font-[font3] transition-colors ${
              isDark
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
                fill="currentColor"
              />
            </svg>
            Edit Profile
          </Link>

          {/* My Dashboard */}
          <Link
            to={isVendor ? "/vendor/dashboard" : "/design"}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium font-[font3] transition-colors ${
              isDark
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M3 5C3 3.89543 3.89543 3 5 3H9C10.1046 3 11 3.89543 11 5V9C11 10.1046 10.1046 11 9 11H5C3.89543 11 3 10.1046 3 9V5ZM5 5H9V9H5V5ZM13 5C13 3.89543 13.8954 3 15 3H19C20.1046 3 21 3.89543 21 5V9C21 10.1046 20.1046 11 19 11H15C13.8954 11 13 10.1046 13 9V15ZM15 5H19V9H15V5ZM3 15C3 13.8954 3.89543 13 5 13H9C10.1046 13 11 13.8954 11 15V19C11 20.1046 10.1046 21 9 21H5C3.89543 21 3 20.1046 3 19V15ZM5 15H9V19H5V15ZM15 13C13.8954 13 13 13.8954 13 15V19C13 20.1046 13.8954 21 15 21H19C20.1046 21 21 20.1046 21 19V15C21 13.8954 20.1046 13 19 13H15ZM15 15H19V19H15V15Z"
                fill="currentColor"
              />
            </svg>
            My Dashboard
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium font-[font3] transition-colors disabled:opacity-50 ${
              isDark
                ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                : "text-red-500 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            {loggingOut ? (
              <div className="w-[18px] h-[18px] border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                  fill="currentColor"
                />
              </svg>
            )}
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}