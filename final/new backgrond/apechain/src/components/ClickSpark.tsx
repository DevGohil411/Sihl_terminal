"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Spark {
  id: number;
  x: number;
  y: number;
}

export default function ClickSpark({ children }: { children: React.ReactNode }) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newSpark = { id: Date.now(), x: e.clientX, y: e.clientY };
      setSparks((prev) => [...prev, newSpark]);
      
      setTimeout(() => {
        setSparks((prev) => prev.filter((spark) => spark.id !== newSpark.id));
      }, 500); // Remove after animation
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {sparks.map((spark) => (
          <motion.div
            key={spark.id}
            className="fixed pointer-events-none z-[9999]"
            style={{ left: spark.x, top: spark.y }}
          >
            {/* Core spark flash */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/40 blur-md mix-blend-screen"
            />
            {/* Thin tactical ring */}
            <motion.div
              initial={{ scale: 0.5, opacity: 1, borderWidth: "2px" }}
              animate={{ scale: 3, opacity: 0, borderWidth: "0px" }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-ape-blue"
            />
            {/* Spark particles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  x: (Math.cos(i * Math.PI / 2) * 40), 
                  y: (Math.sin(i * Math.PI / 2) * 40), 
                  opacity: 0,
                  scale: 0
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute w-1 h-1 bg-white rounded-full"
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}
