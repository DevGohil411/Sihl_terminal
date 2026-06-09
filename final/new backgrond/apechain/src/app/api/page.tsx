"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ApiComingSoon() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 40;
      const y = (e.clientY / innerHeight - 0.5) * 40;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#0F172A] overflow-hidden flex flex-col items-center justify-center font-sans select-none text-white perspective-[2000px]">
      
      {/* Dynamic Hexagon Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.923' viewBox='0 0 60 103.923' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.981 15v30L30 60 4.019 45V15z' fill-opacity='0' stroke='%2300A7FA' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 103.923px",
            backgroundPosition: "center",
          }}
        />
      </div>

      {/* Floating Animated Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[#8D5BFF] rounded-full blur-[150px] mix-blend-screen pointer-events-none"
      />
      
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-[#00A7FA] rounded-full blur-[180px] mix-blend-screen pointer-events-none"
      />

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center transform-style-3d text-center"
        style={{
          transform: `rotateX(${-mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          transition: "transform 0.1s ease-out"
        }}
      >
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 px-4 py-1.5 rounded-full border border-[#8D5BFF]/30 bg-[#8D5BFF]/10 backdrop-blur-md flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8D5BFF] animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-[#8D5BFF] font-bold uppercase">System Status: Building</span>
        </motion.div>

        {/* Main Glitch/Glow Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-6"
        >
          <h1 className="font-display text-[clamp(4rem,8vw,10rem)] leading-[0.85] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            API <br />
            <span className="text-[#00A7FA]">TERMINAL</span>
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl mix-blend-overlay animate-pulse pointer-events-none" />
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-xl mx-auto flex flex-col items-center"
        >
          <p className="font-mono text-sm md:text-base text-white/50 tracking-wider uppercase leading-relaxed text-center mb-10">
            Institutional-grade DMA endpoints and high-frequency data pipelines are currently under construction.
          </p>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-widest uppercase mb-12">
            Coming <span className="text-[#8D5BFF] animate-pulse">Soon</span>
          </h2>

          <Link href="/">
            <button className="group relative px-8 py-3 rounded-md overflow-hidden bg-white/5 border border-white/10 hover:border-[#00A7FA]/50 transition-colors duration-500">
              <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#00A7FA]/20 to-[#8D5BFF]/20 group-hover:w-full transition-all duration-500 ease-out" />
              <span className="relative z-10 font-mono text-xs tracking-[0.2em] uppercase text-white/80 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                <span className="text-xs">◀</span> Return to Core
              </span>
            </button>
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Bottom Technical Bar */}
      <div className="absolute bottom-6 left-0 w-full flex justify-between px-8 md:px-16 pointer-events-none">
        <span className="font-mono text-[9px] text-white/30 tracking-widest uppercase">
          SECURE_ENCLAVE_ACTIVE
        </span>
        <span className="font-mono text-[9px] text-[#00A7FA]/50 tracking-widest uppercase">
          ETA: COMPUTING...
        </span>
      </div>
    </div>
  );
}
