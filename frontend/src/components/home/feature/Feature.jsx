import React, { useState } from "react";
import CardSwap, { Card } from "./CardSwap";
import DashBoardImg from "./imgcrm.png"
import DashBoardImgSales from "./imgsales.png"
import { useTheme } from "../../../context/ThemeContext";

const Feature = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const {isDark}=useTheme();

  const cardContent = [
    {
      title: "CRM",
      description:
        "Keeps every customer interaction connected, so your team always has clear context and never loses track of conversations, follow-ups, or relationships as your business grows.",
    },
    {
      title: "Sales",
      description:
        "Helps deals move forward smoothly by keeping pipelines organized, next steps clear, and revenue momentum strong without constant manual tracking.",
    },
    {
      title: "Inventory Management",
      description:
        "Keeps inventory in balance by tracking stock in real time and helping teams stay ahead of shortages, overstock, and unexpected demand changes.",
    },
    {
      title: "Accounting & Finance",
      description:
        "Keeps your financial data accurate and organized, giving you a clear picture of cash flow, expenses, and overall business health as you scale.",
    },
    {
      title: "Invoicing & Billing",
      description:
        "Makes billing simple by sending invoices on time, tracking payments automatically, and helping you maintain steady, predictable cash flow.",
    },
    {
      title: "Employee & HR Management",
      description:
        "Helps teams stay aligned by clearly managing roles, access, and responsibilities without adding layers of manual oversight.",
    },
    {
      title: "Reports & Analytics",
      description:
        "Turns live business data into easy-to-understand insights, so you always know how your business is performing and where to focus next.",
    },
    {
      title: "Automation & Workflow",
      description:
        "Reduces busywork by automating routine processes across tools, letting your team focus more on execution and less on coordination.",
    },
  ];

  const images = [DashBoardImg, DashBoardImgSales, DashBoardImg, DashBoardImgSales, DashBoardImg, DashBoardImgSales, DashBoardImg, DashBoardImgSales];
  
  const currentCard = cardContent[activeIndex];

  return (
    <div className={`h-[100svh] overflow-hidden flex flex-row ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="w-2/5 flex flex-col justify-center gap-10 px-10 max-[768px]:w-full max-[768px]:absolute max-[768px]:z-10 max-[768px]:bg-black/80 mt-20">
        <div>
          <h1 className="text-[#8645ff] font-[font5] font-black text-[6vw] leading-tight max-[768px]:text-[10vw]">
            Our AI Manager Handles
          </h1>
        </div>
        
        <div className="relative overflow-hidden min-h-[300px]">
          <div
            key={activeIndex}
            className="animate-slide-in"
          >
            <h3 className={`${isDark ? 'text-white' : 'text-black'} font-[font5] font-bold text-[3vw] mb-4 max-[768px]:text-[8vw]`}>
              {currentCard.title}
            </h3>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-[font5] text-[1.7vw] leading-relaxed max-[768px]:text-[4vw]`}>
              {currentCard.description}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2">
          {cardContent.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? (isDark ? 'bg-white' : 'bg-black') 
                  : (isDark ? 'bg-gray-700' : 'bg-gray-300')
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 relative w-3/5 max-[768px]:w-full">
        <CardSwap
          cardDistance={25}
          verticalDistance={30}
          delay={5000}
          pauseOnHover={false}
          width={800}
          height={550}
          onCardChange={setActiveIndex}
        >
          {cardContent.map((card, index) => (
            <Card key={index} className={`flex flex-col p-0 overflow-hidden [transform-style:preserve-3d] ${isDark ? '!border-white/20' : '!border-black/20'}`}>
              <div className={`${isDark ? 'bg-black' : 'bg-white'} [transform-style:preserve-3d]`}>
                <h3 className={`text-base font-bold p-4 pb-3 m-0 z-10 [transform-style:preserve-3d] ${isDark ? 'text-white' : 'text-black'}`}>{card.title}</h3>
                <div className={`w-full h-[2px] ${isDark ? 'bg-white/50' : 'bg-black/50'}`}></div>
              </div>
              <div className="w-full h-full [transform-style:preserve-3d]">
                <img src={images[index]} alt={`${card.title} Dashboard`} className="w-full h-full object-cover [transform-style:preserve-3d]" />
              </div>
            </Card>
          ))}
        </CardSwap>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Feature;