"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    
    // Live ticking UTC clock
    const updateTime = () => {
      const now = new Date();
      const utcString = now.toISOString().slice(11, 19);
      setCurrentTime(utcString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 w-full z-[100] transition-colors duration-700 ${
        isScrolled
          ? "py-3"
          : "py-5"
      }`}
      style={{
        background: isScrolled ? "var(--bg-navbar)" : "transparent",
        backdropFilter: isScrolled ? "blur(24px) saturate(1.3)" : "none",
        WebkitBackdropFilter: isScrolled ? "blur(24px) saturate(1.3)" : "none",
        borderBottom: isScrolled ? "1px solid var(--border-default)" : "none",
        boxShadow: isScrolled ? "var(--shadow-card)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        
        {/* Left Side: Premium Logo Image (Transparent BG) */}
        <Link href="/" className="relative z-10 flex items-center group">
          <div className="relative transition-all duration-500">
            <img 
              src="/logo.png" 
              alt="SIHL Algofy Logo" 
              className="h-12 md:h-16 w-auto object-contain transition-all duration-500 group-hover:scale-[1.05] drop-shadow-[0_0_15px_rgba(255,255,255,0.35)] group-hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.75)]"
            />
          </div>
        </Link>

        {/* Center: Institutional navigation — editorial minimal */}
        <nav className="hidden md:flex items-center gap-7">
          {/* EXPLORE links directly to sihl.in */}
          <motion.a
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            href="https://sihl.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[12.5px] tracking-[0.24em] font-semibold transition-all duration-350 relative group block"
            style={{ color: 'var(--nav-inactive)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--nav-inactive)')}
          >
            EXPLORE
            <span
              className="absolute bottom-[-4px] left-0 w-0 h-[1px] transition-all duration-350 group-hover:w-full"
              style={{ background: "var(--accent-gold)", opacity: 0.50 }}
            />
          </motion.a>

          {[
            { label: "BACKTESTS ENGINE", href: "/terminal", pulse: true },
            { label: "REPLAY BAR", href: "/build" },
            { label: "SIMULATOR", href: "/simulator" },
            { label: "STRATEGIES", href: "/strategies" },
            { label: "API", href: "/api" }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
            >
              <Link
                href={item.href}
                className="font-mono text-[11.5px] tracking-[0.20em] font-medium transition-all duration-300 relative group flex items-center gap-1.5"
                style={{ color: 'var(--nav-inactive)', letterSpacing: '0.18em' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--nav-inactive)')}
              >
              {item.pulse && (
                <span
                  className="w-[5px] h-[5px] rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--positive)', boxShadow: '0 0 5px rgba(78,158,114,0.35)' }}
                />
              )}
              {item.label}
              <span
                className="absolute bottom-[-4px] left-0 w-0 h-[1px] transition-all duration-350 group-hover:w-full"
                style={{ background: item.pulse ? "var(--positive)" : "var(--accent-gold)", opacity: 0.50 }}
              />
              </Link>
            </motion.div>
          ))}
        </nav>


        {/* Mobile Hamburger menu */}
        <button
          className="md:hidden relative z-10 text-white p-2 hover:opacity-80 transition-opacity"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 bg-[#0F172A]/90 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 transition-all duration-500 md:hidden z-40 ${
            mobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Mobile: EXPLORE → sihl.in */}
          <a
            href="https://sihl.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-lg tracking-[0.3em] font-bold text-white/60 hover:text-white transition-colors block"
            onClick={() => setMobileMenuOpen(false)}
          >
            EXPLORE
          </a>
          {[
            { label: "API", href: "/api" },
            { label: "STRATEGIES", href: "/strategies" },
            { label: "BACKTESTS ENGINE", href: "/terminal", pulse: true },
            { label: "REPLAY BAR", href: "/build" },
            { label: "SIMULATOR", href: "/simulator" }
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-mono text-lg tracking-[0.3em] font-bold text-white/60 hover:text-white transition-colors block flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.pulse && (
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--positive)' }} />
              )}
              {item.label}
            </Link>
          ))}

        </div>
      </div>
    </motion.header>
  );
}
