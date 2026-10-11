import React, { useState, useEffect, useRef } from "react";
import { useRive, Layout, Fit, Alignment, useStateMachineInput } from "@rive-app/react-canvas";
import RotatingText from "./RotatingText";

const LeftSide = ({ onRiveReady }) => {
  const [error, setError] = useState(null);
  const controlsSentRef = useRef(false); // Prevent multiple calls
  
  const { rive, RiveComponent } = useRive({
    src: "/login/Bunny.riv",
    stateMachines: "State Machine 1",
    autoplay: true,
    layout: new Layout({
      fit: Fit.FitWidth,
      alignment: Alignment.BottomCenter,
    }),
    onLoadError: (err) => {
      console.error(" Rive loading error:", err);
      setError(err.message);
    },
    onLoad: () => {
      console.log(" Rive loaded successfully");
    },
  });

  const isFocusInput = useStateMachineInput(rive, "State Machine 1", "isFocus");
  const isPasswordInput = useStateMachineInput(rive, "State Machine 1", "IsPassword");
  const loginFailInput = useStateMachineInput(rive, "State Machine 1", "login_fail");
  const loginSuccessInput = useStateMachineInput(rive, "State Machine 1", "login_success");

  // FIXED: Only send controls once, prevent infinite loop
  useEffect(() => {
    if (isFocusInput && isPasswordInput && loginFailInput && loginSuccessInput && onRiveReady && !controlsSentRef.current) {
      console.log(" All inputs ready! Sending controls to parent (once)");
      controlsSentRef.current = true; // Mark as sent
      
      onRiveReady({
        setFocus: (isFocused) => {
          if (isFocusInput) isFocusInput.value = isFocused;
        },
        setPassword: (isPassword) => {
          if (isPasswordInput) isPasswordInput.value = isPassword;
        },
        triggerFail: () => {
          if (loginFailInput) loginFailInput.fire();
        },
        triggerSuccess: () => {
          if (loginSuccessInput) loginSuccessInput.fire();
        },
      });
    }
  }, [isFocusInput, isPasswordInput, loginFailInput, loginSuccessInput]); // REMOVED onRiveReady from deps

  if (error) {
    return (
      <div className="w-1/2 h-full flex items-center justify-center">
        <p className="text-red-500">Error loading animation: {error}</p>
      </div>
    );
  }

  return (
    <div
      className="w-1/2 h-full flex flex-col justify-end items-center bg-[#fafafa]"
      style={{ containerType: "inline-size" }}
    >
      <h1
        className="font-[font3] font-bold "
        style={{ fontSize: "clamp(1rem, 12cqw, 8rem)" }}
      >
        Kins helps you
      </h1>
      <RotatingText
        texts={[
          "grow faster",
          "get Results",
          "avoid Complexity",
          "deliver outcomes",
        ]}
        mainClassName="px-2 sm:px-2 md:px-3 bg-[#FACC15] text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg font-[font3] font-bold text-white"
        style={{ fontSize: "clamp(1rem, 8cqw, 8rem)" }}
        staggerFrom={"last"}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-120%" }}
        staggerDuration={0.025}
        splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        rotationInterval={3000}
      />
      <div className="w-full h-[40vh]">
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="w-full h-[5vh] bg-gradient-to-b from-[#e8d5e3] to-[#d6bfd1] rounded-t-xl shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.3)] relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/40 rounded-t-xl"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10"></div>
      </div>
    </div>
  );
};

export default LeftSide;