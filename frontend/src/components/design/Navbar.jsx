import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import whitelogo from "../../assets/logo/Whitelogo.png";
import blacklogo from "../../assets/logo/Blacklogo.png";
import "@theme-toggles/react/css/Expand.css";
import "@theme-toggles/react/css/Around.css";
import { Around } from "@theme-toggles/react";
import UserDropdown from "./UserDropDown"; // adjust path as needed

const Navbar = ({ isDark, toggleMode }) => {
  const [isMediumScreen, setIsMediumScreen] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return (
    <>
      <header
        className="fixed left-0 w-full z-50 h-[72px] flex items-center justify-center"
        style={{ top: "0px" }}
      >
        {/* Backdrop blur */}
        <div
          className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-black/10 to-transparent pointer-events-none"
          style={{ opacity: 1, transition: "opacity 0.3s ease-in-out" }}
        />

        <nav
          style={{ width: "100%" }}
          className="relative h-full px-4 md:px-8 flex items-center justify-between"
        >
          {/* LEFT - Logo */}
          <Link to="/" className="flex items-center gap-2 group overflow-hidden">
            <img
              src={isDark ? blacklogo : whitelogo}
              alt="KINS Logo"
              style={{ height: "40px", width: "48px" }}
              className="transition-transform group-hover:scale-105 flex-shrink-0"
            />
            <h2
              className={`font-[font2] text-4xl font-light pb-4 tracking-tight leading-tight scale-y-[1.30] whitespace-nowrap ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              KINS
            </h2>
          </Link>

          {/* RIGHT - Theme Toggle + User Dropdown */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleMode}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                isDark ? "hover:bg-white/10" : "hover:bg-black/10"
              }`}
            >
              <Around
                duration={750}
                toggled={isDark}
                style={{ fontSize: "22px" }}
                className={isDark ? "text-white" : "text-black"}
              />
            </button>

            {/* Divider */}
            <div className={`h-6 w-px ${isDark ? "bg-white/20" : "bg-black/20"}`} />

            {/* User Dropdown */}
            <UserDropdown isDark={isDark} />
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;