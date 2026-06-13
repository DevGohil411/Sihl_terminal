"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Shield, Zap, Wallet, Layers, CheckCircle2, AlertTriangle, BookOpen, Lightbulb, BarChart3, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { StrategyDetail } from "../data";
import { generateStrategyPayoff } from "../data";

const TABS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "how-it-works", label: "How It Works", icon: Lightbulb },
  { id: "pros-cons", label: "Pros & Cons", icon: CheckCircle2 },
  { id: "conditions", label: "Conditions", icon: BarChart3 },
];

const VIEW_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Bullish: { icon: <TrendingUp size={16} />, color: "text-[#00C853]", bg: "bg-[#00C853]/10" },
  Bearish: { icon: <TrendingDown size={16} />, color: "text-[#FF5252]", bg: "bg-[#FF5252]/10" },
  Neutral: { icon: <Minus size={16} />, color: "text-[#FFB300]", bg: "bg-[#FFB300]/10" },
};

function getViewConfig(marketView: string) {
  return Object.entries(VIEW_CONFIG).find(([k]) => marketView.toLowerCase().includes(k.toLowerCase()))?.[1] || VIEW_CONFIG.Neutral;
}

export default function StrategyDetailPanel({ strategy, onClose }: { strategy: StrategyDetail; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const payoffData = generateStrategyPayoff(strategy.id);
  const viewConfig = getViewConfig(strategy.marketView);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7, 12, 24, 0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/[0.08] flex flex-col"
        style={{ background: "linear-gradient(180deg, #0F1A2E, #0B1120)" }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-[#8A95A8] hover:text-white transition-colors">
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl ${viewConfig.bg} flex items-center justify-center`}>
              <span className={viewConfig.color}>{viewConfig.icon}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{strategy.name}</h2>
              <p className="text-sm text-[#8A95A8]">{strategy.description}</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
            {[
              { label: "Market View", value: strategy.marketView, icon: TrendingUp, color: "#00D4FF" },
              { label: "Risk Level", value: strategy.riskLevel, icon: Shield, color: "#00B4A6" },
              { label: "Reward", value: strategy.rewardPotential, icon: Zap, color: "#C8A456" },
              { label: "Legs", value: strategy.legs.toString(), icon: Layers, color: "#4ECDC4" },
              { label: "Difficulty", value: strategy.difficulty, icon: BookOpen, color: "#00C853" },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon size={10} style={{ color: m.color }} />
                  <span className="text-[9px] text-[#5A6680] uppercase tracking-wider">{m.label}</span>
                </div>
                <div className="text-xs font-semibold text-white">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-white/[0.06] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                  : "text-[#5A6680] hover:text-[#8A95A8] hover:bg-white/[0.03]"
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">What is {strategy.name}?</h3>
                    <p className="text-sm text-[#8A95A8] leading-relaxed">{strategy.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="text-[10px] text-[#5A6680] uppercase tracking-wider mb-1">Max Profit</div>
                      <div className="text-sm font-semibold text-[#00C853]">{strategy.maxProfit}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="text-[10px] text-[#5A6680] uppercase tracking-wider mb-1">Max Loss</div>
                      <div className="text-sm font-semibold text-[#FF5252]">{strategy.maxLoss}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="text-[10px] text-[#5A6680] uppercase tracking-wider mb-1">Breakeven</div>
                      <div className="text-sm font-semibold text-[#00D4FF]">{strategy.breakeven}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "how-it-works" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white mb-3">How It Works</h3>
                  <div className="space-y-3">
                    {strategy.howItWorks.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#00D4FF]">{i + 1}</span>
                        </div>
                        <p className="text-sm text-[#8A95A8]">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "pros-cons" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#00C853] mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Advantages</h3>
                    <div className="space-y-2">
                      {strategy.advantages.map((adv, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[#8A95A8]"><span className="text-[#00C853] mt-1">•</span>{adv}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#FF5252] mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Disadvantages</h3>
                    <div className="space-y-2">
                      {strategy.disadvantages.map((dis, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[#8A95A8]"><span className="text-[#FF5252] mt-1">•</span>{dis}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "conditions" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Best Market Conditions</h3>
                    <div className="space-y-2">
                      {strategy.bestConditions.map((cond, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[#8A95A8]"><ArrowRight size={12} className="text-[#00B4A6] mt-1 shrink-0" />{cond}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Example Trade Setup</h3>
                    <div className="p-4 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/[0.03]">
                      {strategy.exampleTrade.map((line, i) => (
                        <div key={i} className="text-sm text-[#8A95A8] font-mono">{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex justify-end">
          <Link
            href={`/strategy-builder?strategy=${encodeURIComponent(strategy.name)}`}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-[#0B1120] bg-gradient-to-r from-[#00D4FF] to-[#00B4A6] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all duration-300 flex items-center gap-2"
          >
            <Zap size={14} />
            Add To Strategy Builder
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
