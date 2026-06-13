"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Our Strategies", href: "/strategies", key: "strategies" as const },
  { label: "No Code Strategies", href: "/strategy-builder", key: "builder" as const },
  { label: "Reports", href: "/terminal", key: "reports" as const },
];

export default function AlgofyNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/strategies") {
      return pathname === "/strategies" || pathname.startsWith("/strategies/");
    }
    if (href === "/strategy-builder") {
      return pathname === "/strategy-builder" || pathname.startsWith("/strategy-builder/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 w-full z-[100] transition-all duration-500"
      style={{
        background: scrolled ? "rgba(11, 17, 24, 0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.2)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.2)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-[1536px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center group">
          <img
            src="/logo.png"
            alt="Algofy"
            className="h-10 md:h-12 w-auto object-contain transition-all duration-500 group-hover:scale-[1.05] drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]"
          />
        </Link>

        {/* Centered floating nav */}
        <nav className="hidden md:flex items-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {NAV_LINKS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="relative px-5 py-2 text-[13px] font-medium tracking-wide transition-colors duration-300 rounded-full"
                  style={{ color: active ? "#F1F5F9" : "#94A3B8" }}
                >
                  {active && (
                    <motion.span
                      layoutId="navActivePill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 0 20px rgba(45,212,191,0.12)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </motion.div>
        </nav>

        {/* Right actions */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden md:flex items-center gap-3"
        >
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#8A94A6] hover:text-white hover:bg-white/[0.05] transition-all duration-200">
            <Bell size={17} />
          </button>

          <Link
            href="/login"
            className="px-4 py-2 text-[13px] font-medium text-[#94A3B8] hover:text-white transition-colors duration-200"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="relative group px-5 py-2 rounded-full text-[13px] font-semibold text-[#0B0C10] overflow-hidden transition-all duration-300 hover:shadow-[0_0_28px_rgba(45,212,191,0.35)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#2DD4BF] to-[#3B82F6] opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">Sign Up</span>
          </Link>
        </motion.div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden relative z-10 text-white p-2 hover:opacity-80 transition-opacity"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-[#0B1120]/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden z-40 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {NAV_LINKS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="font-mono text-lg tracking-[0.2em] font-bold text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <div className="flex items-center gap-4 mt-6">
          <Link href="/login" className="text-white/70 hover:text-white transition-colors">Login</Link>
          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2DD4BF] to-[#3B82F6] text-[#0B0C10] font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
