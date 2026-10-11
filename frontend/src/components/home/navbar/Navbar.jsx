import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import whitelogo from "../../../assets/logo/Whitelogo.png";
import blacklogo from "../../../assets/logo/Blacklogo.png";
import "@theme-toggles/react/css/Expand.css";
import "@theme-toggles/react/css/Around.css";
import { Expand } from "@theme-toggles/react";
import { Around } from "@theme-toggles/react";
import Hamburger from "hamburger-react";
import FullScreenNav from "./FullScreenNav";
import UserDropdown from "../../design/UserDropDown";
import { useUser } from "../../../context/UserContext";
import { useVendor } from "../../../context/VendorContext";

// Reads the JWT from localStorage and returns the role, or null if absent/invalid
const getTokenRole = () => {
  try {
    const token = localStorage.getItem("kins_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.role || null; // "customer" | "vendor" | null
  } catch {
    return null;
  }
};

const Navbar = ({ isDark, toggleMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBlur, setShowBlur] = useState(true);
  const [isOpen, setOpen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(true);
  const navigate = useNavigate();

  const { customer } = useUser();
  const { vendor } = useVendor();

  // Token-based check is the source of truth; context data may still be loading
  const tokenRole = getTokenRole();
  const isAnyoneLoggedIn = !!tokenRole || !!customer?.email || !!vendor?.email;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    const handleScroll = () => {
      if (window.innerWidth >= 768) {
        if (window.scrollY > 50) {
          setIsScrolled(true);
          setShowBlur(false);
        } else {
          setIsScrolled(false);
          setTimeout(() => setShowBlur(true), 800);
        }
      } else {
        setIsScrolled(false);
        setShowBlur(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleSectionNav = (sectionId) => {
    if (window.location.pathname === "/") {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  const navLinkClass = `font-[font3] font-medium transition-all hover:opacity-100 cursor-pointer ${
    isDark ? "hover:text-white" : "hover:text-black"
  }`;

  return (
    <>
      <header
        className="fixed left-0 w-full z-50 h-[72px] flex items-center justify-center"
        style={{
          top: isScrolled && isMediumScreen ? "20px" : "0px",
          transition: "top 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Backdrop blur */}
        {!isScrolled && showBlur && (
          <div
            className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-black/10 to-transparent pointer-events-none"
            style={{ opacity: showBlur ? 1 : 0, transition: "opacity 0.3s ease-in-out" }}
          />
        )}

        <nav
          style={{
            width: isScrolled && isMediumScreen ? "760px" : "90vw",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className={`relative h-full px-3 md:px-5 flex items-center justify-between ${
            isScrolled && isMediumScreen
              ? isDark
                ? "bg-black/40 backdrop-blur-xl rounded-full shadow-lg border border-white/10"
                : "bg-white/40 backdrop-blur-xl rounded-full shadow-lg border border-black/5"
              : ""
          }`}
        >
          {/* LEFT - Logo */}
          <Link to="/" className="flex items-center group overflow-hidden">
            <img
              src={isDark ? blacklogo : whitelogo}
              alt="KINS Logo"
              style={{
                height: "40px",
                width: "48px",
                transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className="transition-transform group-hover:scale-105 flex-shrink-0"
            />
            <div
              style={{
                maxWidth: isScrolled && isMediumScreen ? "0px" : "200px",
                opacity: isScrolled && isMediumScreen ? 0 : 1,
                transform: isScrolled && isMediumScreen ? "translateX(20px)" : "translateX(0)",
                transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
              }}
            >
              <h2
                className={`font-[font2] text-4xl font-light pb-4 tracking-tight leading-tight scale-y-[1.30] whitespace-nowrap ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                KINS
              </h2>
            </div>
          </Link>

          {/* RIGHT - Nav + Buttons */}
          <div className="flex items-center" style={{ gap: "16px" }}>

            {/* Nav Links - md+ only */}
            <div
              className={`hidden md:flex items-center ${isDark ? "text-white/80" : "text-black/80"}`}
              style={{ gap: "28px" }}
            >
              <span
                style={{ fontSize: "14px" }}
                className={navLinkClass}
                onClick={() => handleSectionNav("product-demo")}
              >
                Product
              </span>

              <Link
                to="/pricing"
                style={{ fontSize: "14px" }}
                className={navLinkClass}
              >
                Pricing
              </Link>
            </div>

            {/* Divider */}
            <div
              style={{ height: "24px" }}
              className={`hidden md:block w-px ${isDark ? "bg-white/20" : "bg-black/20"}`}
            />

            {/* Theme Toggle small screens */}
            <Around
              duration={750}
              toggled={isDark}
              toggle={toggleMode}
              style={{ fontSize: "24px" }}
              className={`md:hidden block transition-colors ${isDark ? "text-white" : "text-black"}`}
            />

            {/* AUTH SECTION — md+ only */}
            <div className="hidden md:flex items-center" style={{ gap: "12px" }}>
              {isAnyoneLoggedIn ? (
                /* ── Logged in: show UserDropdown ── */
                <UserDropdown isDark={isDark} />
              ) : (
                /* ── Logged out: show both login buttons ── */
                <>
                  {/* Vendor Login */}
                  <Link
                    to="/vendor/login"
                    style={{
                      padding: "9px 20px",
                      fontSize: "14px",
                      backgroundColor: "#0d4735",
                      color: "#ffffff",
                      border: "1.5px solid #0d4735",
                      boxShadow: "0 4px 14px rgba(13,71,53,0.30)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#0a3527";
                      e.currentTarget.style.borderColor = "#0a3527";
                      e.currentTarget.style.boxShadow = "0 4px 18px rgba(13,71,53,0.40)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#0d4735";
                      e.currentTarget.style.borderColor = "#0d4735";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(13,71,53,0.30)";
                    }}
                    className="rounded-xl font-semibold font-[font3]"
                  >
                    Vendor Login
                  </Link>

                  {/* Customer Login */}
                  <Link
                    to="/login"
                    style={{
                      padding: "9px 20px",
                      fontSize: "14px",
                      backgroundColor: "#FACC15",
                      color: "#0F4C3A",
                      border: "1.5px solid #FACC15",
                      boxShadow: "0 4px 14px rgba(250,204,21,0.30)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#FDE047";
                      e.currentTarget.style.borderColor = "#FDE047";
                      e.currentTarget.style.boxShadow = "0 4px 18px rgba(250,204,21,0.50)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#FACC15";
                      e.currentTarget.style.borderColor = "#FACC15";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(250,204,21,0.30)";
                    }}
                    className="rounded-xl font-semibold font-[font3]"
                  >
                    Customer Login
                  </Link>
                </>
              )}
            </div>

            {/* Theme Toggle md+ screens */}
            <Expand
              duration={750}
              toggled={isDark}
              toggle={toggleMode}
              style={{ fontSize: "24px" }}
              className={`hidden md:block transition-colors ${isDark ? "text-white" : "text-black"}`}
            />

            {/* Hamburger - small screens only */}
            <div className="md:hidden relative z-[60]">
              <Hamburger
                toggled={isOpen}
                toggle={setOpen}
                color={isDark ? "#fff" : "#000"}
                size={22}
              />
            </div>
          </div>
        </nav>
      </header>

      <FullScreenNav
        isOpen={isOpen}
        setOpen={setOpen}
        isDark={isDark}
        toggleMode={toggleMode}
      />
    </>
  );
};

export default Navbar;