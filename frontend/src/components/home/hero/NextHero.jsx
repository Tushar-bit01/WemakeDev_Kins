import React from "react";
import { useTheme } from "../../../context/ThemeContext";

const NextHero = () => {
  const { isDark } = useTheme();
  return (
    <div className="hero-content absolute bottom-0 w-full h-[125svh] flex justify-center items-center text-center z-30 pointer-events-none">
      <h2
        className={`${
          isDark ? "text-black" : "text-white"
        }  lg:w-3/4 w-9/10 font-[font4] lg:leading-[1] leading-[1.2] `}
        style={{ fontSize: "clamp(2.5rem, 4.5vw, 5rem)" }}
      >
        <span
          className="text-[#FACC15] font-black "
          style={{ fontSize: "1.15em" }}
        >
          About Kins
        </span>{" "}
        <br />
        <br />
        We turn any rooftop into a detailed 3D solar layout, so customers clearly see their savings, and vendors get serious, ready-to-go leads.
      </h2>
    </div>
  );
};

export default NextHero;
