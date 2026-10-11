import React from "react";
import { Link } from "react-router-dom";

const menuItems = [
  { name: "Product", path: "/product", delay: 0.1 },
  { name: "Solutions", path: "/solutions", delay: 0.2 },
  { name: "Pricing", path: "/pricing", delay: 0.3 },
];

const FullScreenNav = ({ isOpen, setOpen, isDark, toggleMode }) => {
  return (
    <div
      className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-in-out ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      {/* Glossy Blur Background */}
      <div
        className={`absolute inset-0 backdrop-blur-2xl ${
          isDark ? "bg-black/60" : "bg-white/60"
        }`}
        style={{
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          opacity: isOpen ? 1 : 0,
          transition: isOpen
            ? "opacity 0.15s ease-in-out"
            : "opacity 0.3s ease-in-out 0.3s",
        }}
      />

      {/* Subtle gradient overlay */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-gradient-to-b from-purple-900/10 via-transparent to-transparent"
            : "bg-gradient-to-b from-purple-100/20 via-transparent to-transparent"
        }`}
        style={{
          opacity: isOpen ? 1 : 0,
          transition: isOpen
            ? "opacity 0.15s ease-in-out"
            : "opacity 0.3s ease-in-out 0.3s",
        }}
      />

      {/* Menu Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        {/* Navigation Links */}
        <nav className="flex flex-col items-center gap-8 mb-12">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`text-5xl font-bold font-[font4] transition-all duration-300 transform hover:scale-110 relative group ${
                isDark
                  ? "text-white hover:text-purple-400"
                  : "text-black hover:text-purple-600"
              }`}
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "translateY(0)" : "translateY(-20px)",
                transition: isOpen
                  ? `all 0.5s ease-in-out ${0.4 + item.delay}s`
                  : "all 0.2s ease-in-out",
              }}
            >
              {item.name}
              <span
                className={`absolute -bottom-2 left-0 w-0 h-1 rounded-full transition-all duration-300 group-hover:w-full ${
                  isDark ? "bg-purple-400" : "bg-purple-600"
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* Login Buttons */}
        <div
          className="flex flex-col items-center gap-4 w-full max-w-[260px]"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0)" : "translateY(10px)",
            transition: isOpen
              ? "all 0.5s ease-in-out 0.85s"
              : "all 0.2s ease-in-out",
          }}
        >
          {/* Vendor Login */}
          <Link
            to="/vendor/login"
            onClick={() => setOpen(false)}
            style={{
              padding: "11px 0",
              fontSize: "15px",
              backgroundColor: "#0d4735",
              color: "#ffffff",
              border: "1.5px solid #0d4735",
              boxShadow: "0 4px 14px rgba(13,71,53,0.30)",
              transition: "all 0.2s",
            }}
            className="w-full text-center rounded-xl font-semibold font-[font3]"
          >
            Vendor Login
          </Link>

          {/* Customer Login */}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            style={{
              padding: "11px 0",
              fontSize: "15px",
              backgroundColor: "#FACC15",
              color: "#0F4C3A",
              border: "1.5px solid #FACC15",
              boxShadow: "0 4px 14px rgba(250,204,21,0.30)",
              transition: "all 0.2s",
            }}
            className="w-full text-center rounded-xl font-semibold font-[font3]"
          >
            Customer Login
          </Link>
        </div>

        {/* Bottom Footer */}
        <div
          className={`absolute bottom-8 text-center ${
            isDark ? "text-white/40" : "text-black/40"
          }`}
          style={{
            opacity: isOpen ? 1 : 0,
            transition: isOpen
              ? "opacity 0.5s ease-in-out 1s"
              : "opacity 0.2s ease-in-out",
          }}
        >
          <p className="text-sm font-[font4] tracking-wider mb-3">
            © 2026 KINS
          </p>
          <div className="flex gap-2 justify-center">
            <div
              className={`w-1 h-1 rounded-full ${
                isDark ? "bg-white/40" : "bg-black/40"
              }`}
            />
            <div
              className={`w-1 h-1 rounded-full ${
                isDark ? "bg-white/60" : "bg-black/60"
              }`}
            />
            <div
              className={`w-1 h-1 rounded-full ${
                isDark ? "bg-white/40" : "bg-black/40"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenNav;
