"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ScrollStack({ children, index = 0 }: { children: ReactNode, index?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // The higher the index, the more it pushes back
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -10]);

  return (
    <motion.div
      ref={containerRef}
      className="w-full min-h-screen sticky top-0 flex items-center justify-center transform-style-3d will-change-transform"
      style={{
        scale,
        opacity,
        y,
        rotateX,
        zIndex: index,
        transformPerspective: 1200
      }}
    >
      <div className="w-full h-full bg-[#131C2E]/40 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
        {/* Cinematic edge glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        {children}
      </div>
    </motion.div>
  );
}
