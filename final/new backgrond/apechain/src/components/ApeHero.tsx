"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import "./OrbitImages.css"; // Includes customized card highlight shadows, progress overlays, and curve highlights

// Dapp dataset — premium institutional palette
const dapps = [
  {
    id: 0,
    titleLines: ["SIHL", "EXPLORE"],
    tags: "DISCOVER · PLATFORM",
    desc: "Institutional-grade platform for real-time market data, historical tick data, and seamless trading execution routing.",
    video: "/videos/v_explore_new.mp4",
    color: "#4A7FA8",      // Ocean Blue
    bgColor: "#060910",
    contain: true
  },
  {
    id: 1,
    titleLines: ["SYSTEM", "API"],
    tags: "DATA · INTEGRATION",
    desc: "Low-latency API endpoints engineered for high-frequency and statistical arbitrage workloads.",
    video: "/videos/v_explore_new.mp4",
    color: "#7A68A8",      // Desaturated violet slate
    bgColor: "#0A0810",
    shiftLeft: true
  },
  {
    id: 2,
    titleLines: ["STRATEGY", "PERFORMANCE"],
    tags: "ANALYTICS · BACKTESTING",
    desc: "Rigorous historical simulation with slippage modeling and multi-regime performance attribution.",
    video: "/videos/v3.mp4",
    color: "#5E9E8E",      // Muted Teal
    bgColor: "#060C0B",
  },
  {
    id: 3,
    titleLines: ["MARKET", "INSIGHTS"],
    tags: "INTELLIGENCE · RESEARCH",
    desc: "Advanced market intelligence terminal. Build, test, and optimize complex multi-leg portfolios.",
    video: "/videos/v4.mp4",
    color: "#C2A060",      // Soft Gold
    bgColor: "#0D0904",
  }
];

export default function ApeHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [globalMousePos, setGlobalMousePos] = useState({ x: 0, y: 0 });
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Camera parallax tracking on hero container
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    setGlobalMousePos({ x: clientX, y: clientY });
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 45; 
    const y = (clientY / innerHeight - 0.5) * 45;
    setMousePos({ x, y });
  };

  // Card specific hover tracking (Tactile micro-drift coordinates parallax)
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setHoverOffset({ x, y });
  };

  const handleCardMouseLeave = () => {
    setHoverOffset({ x: 0, y: 0 });
  };

  // Cinematic automatic transition cycle
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % dapps.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isHovered, activeIndex]);

  const activeDapp = dapps[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % dapps.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + dapps.length) % dapps.length);
  };

  useEffect(() => {
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Restart video from 0 when it becomes the center active card
  useEffect(() => {
    const activeVideo = videoRefs.current[activeIndex];
    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.play().catch(e => console.log("Video play error:", e));
    }
  }, [activeIndex]);

  return (
    <motion.section 
      onMouseMove={handleMouseMove}
      animate={{ backgroundColor: activeDapp.bgColor }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden perspective-[2600px] transform-style-3d select-none py-10"
      style={{ cursor: 'none' }}
    >
      
      {/* CUSTOM ANIMATED CURSOR */}
      <motion.div 
        className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
        style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(238,233,223,0.30)' }}
        animate={{
          x: globalMousePos.x - 13,
          y: globalMousePos.y - 13,
          scale: isClicking ? 0.85 : isHovered ? 1.4 : 1,
          borderColor: isClicking ? "rgba(238,233,223,0.90)" : isHovered ? activeDapp.color : "rgba(238,233,223,0.28)"
        }}
        transition={{ type: "tween", ease: "circOut", duration: 0.12 }}
      >
        <motion.div 
          style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#EEE9DF' }}
          animate={{
            scale: isClicking ? 1.8 : 1,
            backgroundColor: isHovered ? activeDapp.color : "#EEE9DF"
          }}
          transition={{ duration: 0.10 }}
        />
      </motion.div>

      {/* 1. BACKGROUND & CANVAS LAYER */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-35">
        <svg 
          viewBox="0 0 1200 1200" 
          className="w-full h-full scale-[2.2] md:scale-[2.8] text-[#00A7FA]/10 topo-drift-class"
        >
          {/* Topographic Contour terrain map vector overlay */}
          {[...Array(24)].map((_, idx) => {
            const rx = 350 + idx * 80;
            const ry = 180 + idx * 36;
            return (
              <ellipse
                key={idx}
                cx="600"
                cy="730"
                rx={rx}
                ry={ry}
                fill="none"
                strokeWidth={1.2}
                strokeDasharray={idx % 4 === 0 ? "4, 10" : "none"}
                style={{
                  stroke: idx % 4 === 0 ? "rgba(194, 160, 96, 0.12)" : "rgba(238, 233, 223, 0.04)",
                }}
              />
            );
          })}
        </svg>

        {/* Ambient bloom — desaturated, large, atmospheric */}
        <motion.div 
          animate={{ backgroundColor: activeDapp.color }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute top-[42%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[520px] rounded-full blur-[280px] opacity-[0.14]" 
        />
        
        {/* Soft edge vignette fades */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-[#020408] opacity-95" />
      </div>

      {/* Spacer to align coverflow center visually */}
      <div className="h-12 md:h-16" />

      {/* 3. CORE VISUAL: 3D CURVED CAROUSEL (z-index: 10) */}
      <div 
        className="relative z-10 w-full h-[65vh] md:h-[80vh] flex items-center justify-center transform-style-3d overflow-visible"
        style={{
          transform: `translate3d(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px, 0) rotateX(${-mousePos.y * 0.04}deg) rotateY(${mousePos.x * 0.04}deg)`,
          transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)",
        }}
      >
        {/* Compact, dense curved Coverflow Container */}
        <div className="orbit-wrapper flex items-center justify-center">
          {dapps.map((dapp, i) => {
            let diff = i - activeIndex;
            const N = dapps.length;

            // Cyclical Coverflow wrapping
            while (diff < -N / 2) diff += N;
            while (diff > N / 2) diff -= N;

            const isActive = diff === 0;
            const isLeft1 = diff === -1;
            const isLeft2 = diff === -2;
            const isRight1 = diff === 1;
            const isRight2 = diff === 2;

            let cardClass = "orbit-card ";
            if (isActive) {
              cardClass += isHovered ? "card-center main-card-hovered" : "card-center";
            } else if (isLeft1) {
              cardClass += "card-left-1";
            } else if (isLeft2) {
              cardClass += "card-left-2";
            } else if (isRight1) {
              cardClass += "card-right-1";
            } else if (isRight2) {
              cardClass += "card-right-2";
            }
            const cardStyle: React.CSSProperties = {
              transformOrigin: "center center",
              transformStyle: "preserve-3d",
              zIndex: isActive ? 30 : (isLeft1 || isRight1 ? 20 : 10),
              border: isActive
                ? `1px solid rgba(255,255,255,0.11)`
                : `1px solid rgba(255,255,255,0.04)`,
              visibility: "visible",
              transform: isActive && isHovered
                ? `translate(-50%, -50%) translateX(0vw) translateZ(320px) rotateY(${hoverOffset.x * 20}deg) rotateX(${-hoverOffset.y * 20}deg) scale(1.025) translateY(-5px)`
                : undefined
            };

            return (
              <div
                key={dapp.id}
                onMouseMove={isActive ? handleCardMouseMove : undefined}
                onMouseEnter={isActive ? () => setIsHovered(true) : undefined}
                onMouseLeave={isActive ? () => {
                  setIsHovered(false);
                  handleCardMouseLeave();
                } : undefined}
                className={`cursor-pointer group will-change-transform ${cardClass}`}
                style={cardStyle}
                onClick={() => setActiveIndex(i)}
              >
                
                {/* Independent Nested Floating body to handle loopable micro-drift transitions */}
                <motion.div
                  animate={isActive ? {
                    y: [0, -4, 0],
                    rotateY: [-0.4, 0.4, -0.4]
                  } : { y: 0, rotateY: 0 }}
                  transition={isActive ? {
                    repeat: Infinity,
                    duration: 8,
                    ease: "easeInOut"
                  } : {}}
                  className="w-full h-full relative transform-style-3d"
                >

                  {/* Specular lighting highlights shifting based on mouse coords */}
                  {isActive && isHovered && (
                    <div 
                      className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay opacity-30 transition-opacity rounded-[24px]"
                      style={{
                        background: `radial-gradient(circle at ${50 + hoverOffset.x * 100}% ${50 + hoverOffset.y * 100}%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)`
                      }}
                    />
                  )}

                  {/* 3D Glass Metallic Curvature Reflection Highlight */}
                  <div className="card-curve-highlight pointer-events-none" />
                  
                  {/* Glass reflection gloss swipe */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/4 to-white/0 z-20 pointer-events-none group-hover:translate-y-[-100%] transition-transform duration-1000" />
                  
                  {/* Background Image Inside Card (Oversized cinematic bleed + tactile parallax) */}
                  <div className="absolute inset-0 z-0 overflow-visible">
                    <motion.div
                      animate={{
                        x: isActive && isHovered ? hoverOffset.x * -42 : 0, // Drifts independently at higher intensity
                        y: isActive && isHovered ? hoverOffset.y * -42 : 0,
                      }}
                      transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                      className="absolute transform-style-3d overflow-hidden rounded-[24px]"
                      style={{
                        width: isActive ? "108%" : "104%",
                        height: isActive ? "108%" : "104%",
                        left: isActive ? "-4%" : "-2%",
                        top: isActive ? "-4%" : "-2%",
                        transform: isActive ? "translateZ(60px)" : "translateZ(0px)" // Pops in front of card borders!
                      }}
                    >
                      <video 
                        ref={(el) => {
                          if (el) videoRefs.current[dapp.id] = el;
                        }}
                        src={dapp.video} 
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`w-full h-full ${dapp.contain ? "object-contain bg-black" : "object-cover scale-[1.08]"} origin-center ${dapp.shiftLeft ? "object-[20%_center]" : ""}`}
                      />
                      
                      {/* Edge Fade overlays to merge artwork seamlessly into background */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-transparent h-1/3 rounded-t-[24px]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent h-1/2 bottom-0 top-auto rounded-b-[24px]" />
                          <div className="absolute inset-0 [background:radial-gradient(circle_at_center,_transparent_40%,_black_90%)] opacity-30 rounded-[24px]" />
                          
                          {/* Premium Asymmetric Shading: Far (right) edge darker and softer */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/40 pointer-events-none rounded-[24px] z-10" />
                          
                          {/* Subtle left-edge shadow to prevent overlap bleed artifacts */}
                          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/90 to-transparent pointer-events-none z-10 rounded-l-[28px]" />
                        </>
                      )}
                    </motion.div>

                    {/* Dynamic Shading mask (Base layer behind image) */}
                    <div 
                      className={`absolute inset-0 transition-all duration-500 z-10 rounded-[24px] ${
                        isActive 
                          ? "bg-gradient-to-t from-black via-black/25 to-transparent opacity-95" 
                          : "bg-black/85"
                      }`} 
                    />
                  </div>

                  {/* Tactical grid background overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:24px_24px] z-10 pointer-events-none" />

                  {/* Tactical Metadata Tags */}
                  <div 
                    className="absolute top-5 left-5 z-20 flex items-center gap-2"
                    style={{
                      transform: isActive ? "translateZ(80px)" : "translateZ(0px)",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    <div 
                      className="w-[5px] h-[5px] rounded-full animate-pulse" 
                      style={{ backgroundColor: dapp.color, boxShadow: `0 0 4px ${dapp.color}` }}
                    />
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '8px', letterSpacing: '0.20em', color: 'rgba(238,233,223,0.35)', textTransform: 'uppercase' }}>
                      SYS · NODE · 0{dapp.id}
                    </span>
                  </div>

                  {/* Card Geographic Coordinates Telemetry */}
                  <div 
                    className="absolute top-5 right-5 z-20 select-none"
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: '7.5px',
                      letterSpacing: '0.14em',
                      color: 'rgba(238,233,223,0.22)',
                      transform: isActive ? "translateZ(80px)" : "translateZ(0px)",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    {(40.7128 + dapp.id * 1.5).toFixed(4)}°N &nbsp;{Math.abs(-74.0060 - dapp.id * 3.1).toFixed(4)}°W
                  </div>

                  {/* Neon bottom glow bar */}
                  <div 
                    className="absolute bottom-0 left-0 w-full h-[4px] z-20 transition-all duration-300"
                    style={{
                      backgroundColor: dapp.color,
                      boxShadow: `0 0 20px ${dapp.color}`,
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateZ(75px)" : "translateZ(0px)"
                    }}
                  />

                  {/* Atmospheric soft gradient backdrop for text readability */}
                  {isActive && (
                    <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-20 rounded-b-[28px]" />
                  )}

                  {/* Floating Text/Content Overlay Directly on the Active Image (ApeChain Style) */}
                  {isActive && (
                    <div 
                      className="absolute bottom-[6%] right-[5%] z-30 flex flex-col items-end text-right select-none max-w-[85%] md:max-w-[50%]"
                      style={{
                        transform: "translateZ(90px)",
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* Tag Badge */}
                      <div className="flex items-center gap-2 mb-4 badge-glow px-3 py-1 rounded-[3px]">
                        <span style={{ color: dapp.color, fontSize: '8px', letterSpacing: '0.22em', fontFamily: 'var(--f-mono)', fontWeight: 500 }}>{dapp.tags}</span>
                      </div>

                      {/* Title display block */}
                      <div className="h-[5rem] md:h-[7.5rem] overflow-hidden relative w-full mb-3 flex flex-col justify-end items-end">
                        <AnimatePresence mode="wait">
                          <motion.div
                             key={dapp.titleLines.join("-")}
                             initial={{ y: 110, opacity: 0 }}
                             animate={{ y: 0, opacity: 1 }}
                             exit={{ y: -110, opacity: 0 }}
                             transition={{ duration: 0.60, ease: [0.16, 1, 0.30, 1] }}
                             className="absolute bottom-0 right-0 flex flex-col items-end whitespace-nowrap"
                             style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2rem,3vw,3.6rem)', lineHeight: 0.88, letterSpacing: '-0.02em', fontWeight: 700 }}
                          >
                            <span style={{ color: '#EEE9DF' }}>{dapp.titleLines[0]}</span>
                            <span style={{ color: 'transparent', WebkitTextStroke: `1px rgba(238,233,223,0.32)`, transition: 'color 0.5s' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#EEE9DF')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'transparent')}
                            >
                              {dapp.titleLines[1]}
                            </span>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Description */}
                      <div className="h-auto overflow-hidden mb-5 max-w-[340px] flex flex-col gap-2 mt-1 items-end text-right">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={dapp.desc}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.50, delay: 0.05 }}
                            className="flex flex-col gap-2 items-end"
                          >
                            <p style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: 'rgba(184,178,167,0.82)', letterSpacing: '0.01em', lineHeight: 1.65, fontWeight: 400 }}>
                              {dapp.desc}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                </motion.div>

              </div>
            );
          })}
        </div>

        {/* Floating sharp tactile navigation buttons with animated countdown timer progress ring */}
        <div className="absolute right-[4%] md:right-[6%] top-[50%] -translate-y-1/2 flex flex-col gap-5 z-30 select-none">
          
          <button 
            onClick={handleNext}
            className="w-11 h-11 flex items-center justify-center backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 active:scale-90 relative"
            style={{ borderRadius: '3px', background: 'rgba(8,10,13,0.60)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Next Dapp"
          >
            {/* Square Progress stroke countdown overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none select-none">
              <rect
                x="2"
                y="2"
                width="40"
                height="40"
                rx="3"
                fill="none"
                stroke="rgba(238, 233, 223, 0.08)"
                strokeWidth="1"
              />
              <motion.rect
                x="2"
                y="2"
                width="40"
                height="40"
                rx="3"
                fill="none"
                stroke={activeDapp.color}
                strokeWidth="1.5"
                strokeDasharray={40 * 4}
                initial={{ strokeDashoffset: 40 * 4 }}
                animate={{ strokeDashoffset: isHovered ? 40 * 4 : 0 }}
                transition={{ duration: 3.5, ease: "linear" }}
                key={activeIndex}
              />
            </svg>
            <span className="text-[10px] tracking-widest relative z-10 opacity-70">▶</span>
          </button>

          <button 
            onClick={handlePrev}
            className="w-11 h-11 flex items-center justify-center backdrop-blur-md text-white/60 hover:text-white transition-all duration-300 active:scale-90"
            style={{ borderRadius: '3px', background: 'rgba(8,10,13,0.60)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Previous Dapp"
          >
            <span className="text-[10px] tracking-widest opacity-70">◀</span>
          </button>
        </div>

      </div>



      {/* Floating mobile app switcher indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex md:hidden items-center gap-3 bg-black/45 backdrop-blur-md border border-white/5 rounded-full px-4 py-2 select-none">
        {dapps.map((dapp, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={dapp.id}
              onClick={() => setActiveIndex(idx)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                backgroundColor: isActive ? dapp.color : "rgba(255, 255, 255, 0.2)",
                transform: isActive ? "scale(1.2)" : "scale(1.0)",
                boxShadow: isActive ? `0 0 8px ${dapp.color}` : "none"
              }}
              aria-label={`Switch to dapp ${idx + 1}`}
            />
          );
        })}
      </div>

    </motion.section>
  );
}
