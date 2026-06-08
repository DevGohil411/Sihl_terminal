"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export default function DecryptedText({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!isInView) return;

    let iterations = 0;
    const maxIterations = text.length;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText(() => 
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iterations) return text[index];
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
        );

        if (iterations >= maxIterations) {
          clearInterval(interval);
        }

        iterations += 1/3;
      }, 30);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [text, isInView, delay]);

  return (
    <motion.span ref={ref} className={className}>
      {displayedText}
    </motion.span>
  );
}
