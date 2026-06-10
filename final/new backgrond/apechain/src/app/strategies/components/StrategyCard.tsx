"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Shield, Zap, Wallet, Layers } from "lucide-react";
import type { StrategyDetail } from "../data";

const VIEW_ICONS: Record<string, React.ReactNode> = {
  Bullish: <TrendingUp size={14} className="text-[#00C853]" />,
  Bearish: <TrendingDown size={14} className="text-[#FF5252]" />,
  Neutral: <Minus size={14} className="text-[#FFB300]" />,
};

const RISK_COLORS: Record<string, string> = {
  Low: "bg-[#00C853]/10 text-[#00C853] border-[#00C853]/20",
  Moderate: "bg-[#FFB300]/10 text-[#FFB300] border-[#FFB300]/20",
  High: "bg-[#FF5252]/10 text-[#FF5252] border-[#FF5252]/20",
  "Very High": "bg-[#FF5252]/20 text-[#FF5252] border-[#FF5252]/30",
};

function getViewIcon(marketView: string) {
  return Object.entries(VIEW_ICONS).find(([k]) => marketView.toLowerCase().includes(k.toLowerCase()))?.[1] || VIEW_ICONS.Neutral;
}

export default function StrategyCard({ strategy, index, onClick }: { strategy: StrategyDetail; index: number; onClick: () => void }) {
  const viewIcon = getViewIcon(strategy.marketView);
  const riskClass = RISK_COLORS[strategy.riskLevel] || RISK_COLORS.Moderate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="relative p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] cursor-pointer group overflow-hidden transition-all duration-300 hover:border-[#00D4FF]/20"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.06), transparent 70%)" }}
      />

      <div className="relative z-10">
        {/* Top row: category + risk */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6680]">{strategy.category}</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${riskClass}`}>{strategy.riskLevel} Risk</span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#00D4FF] transition-colors">{strategy.name}</h3>

        {/* Description */}
        <p className="text-xs text-[#8A95A8] leading-relaxed mb-5 line-clamp-2">{strategy.description}</p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">{viewIcon}</div>
            <div><div className="text-[9px] text-[#5A6680] uppercase tracking-wider">View</div><div className="text-xs text-white font-medium">{strategy.marketView}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00B4A6]/10 flex items-center justify-center"><Layers size={14} className="text-[#00B4A6]" /></div>
            <div><div className="text-[9px] text-[#5A6680] uppercase tracking-wider">Legs</div><div className="text-xs text-white font-medium">{strategy.legs}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C8A456]/10 flex items-center justify-center"><Wallet size={14} className="text-[#C8A456]" /></div>
            <div><div className="text-[9px] text-[#5A6680] uppercase tracking-wider">Capital</div><div className="text-xs text-white font-medium">{strategy.capitalRequired}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4ECDC4]/10 flex items-center justify-center"><Zap size={14} className="text-[#4ECDC4]" /></div>
            <div><div className="text-[9px] text-[#5A6680] uppercase tracking-wider">Level</div><div className="text-xs text-white font-medium">{strategy.difficulty}</div></div>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full py-2.5 rounded-lg text-xs font-semibold text-[#0B1120] bg-gradient-to-r from-[#00D4FF] to-[#00B4A6] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
          View Strategy
        </button>
      </div>
    </motion.div>
  );
}
