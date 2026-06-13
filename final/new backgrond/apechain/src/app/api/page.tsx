"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Activity, Shield, Zap, Globe, Lock, Server } from "lucide-react";

export default function ApiComingSoon() {
  const features = [
    { icon: Zap, label: "Low-latency DMA", desc: "Direct market access endpoints" },
    { icon: Activity, label: "Live Market Data", desc: "Real-time tick and OHLC streams" },
    { icon: Shield, label: "Secure Enclave", desc: "HMAC-signed requests & IP allowlists" },
    { icon: Globe, label: "Multi-venue", desc: "NSE, BSE, MCX connectivity" },
    { icon: Lock, label: "OAuth 2.0", desc: "Token-based authentication" },
    { icon: Server, label: "WebSocket", desc: "Streaming order & position updates" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden relative">
      {/* subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #1e3a8a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      {/* blue glow orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-400/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[120px] pointer-events-none" />

      {/* top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Algofy" className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
        </Link>
        <Link
          href="/login"
          className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        >
          Login
        </Link>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-semibold tracking-wider uppercase mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            System Status: Building
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Algofy Trading <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">API</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Institutional-grade DMA endpoints and high-frequency data pipelines are currently under construction. Build algos that connect directly to the market.
          </p>

          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-wide mb-12">
            Coming <span className="text-blue-600">Soon</span>
          </h2>

          {/* feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 text-left">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <f.icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{f.label}</h3>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <Link href="/">
            <button className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-gray-200 text-slate-700 text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:shadow-lg transition-all duration-300">
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              Return to Core
            </button>
          </Link>
        </motion.div>
      </main>

      {/* bottom bar */}
      <div className="absolute bottom-6 left-0 w-full flex justify-between px-8 md:px-16 pointer-events-none">
        <span className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">
          SECURE_ENCLAVE_ACTIVE
        </span>
        <span className="font-mono text-[10px] text-blue-500 tracking-widest uppercase">
          ETA: COMPUTING...
        </span>
      </div>
    </div>
  );
}
