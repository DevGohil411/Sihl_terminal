"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, TreePine, BarChart3, Wrench, FileText } from "lucide-react";
import { PRE_BUILT_STRATEGIES, searchStrategies, type StrategyDetail } from "./data";
import StrategyCard from "./components/StrategyCard";
import StrategyDetailPanel from "./components/StrategyDetail";

// ─── DEPLOYED MODELS DATA (PRESERVED) ───

type YearlyData = {
  year: string; netProfit: number; maxDd: number; sharpe: number; sortino: number;
  calmar?: number; totalTrades?: number; totalPoints?: number; winRate?: string;
  profitFactor?: number; expectancy?: number; avgWin?: number; avgLoss?: number;
  tailRisk?: number; var95?: number; cvar95?: number; recoveryTrades?: number;
  recoveryEfficiency?: number; longestWinStreak?: number; longestLossStreak?: number;
};

type DeployedStrategy = {
  id: string; name: string; tag: string; description: string; color: string;
  cagr: string; winRate: string; initialCapital?: number; yearlyData: YearlyData[]; chartData: number[];
};

const DEPLOYED: DeployedStrategy[] = [
  {
    id: "alpha-mean-rev", name: "Alpha Mean Reversion", tag: "LOW RISK",
    description: "Consistent mean-reversion algorithm exploiting intraday over-extensions with strict risk management.",
    color: "#00A7FA", cagr: "24.5%", winRate: "68.2%", initialCapital: 70000,
    yearlyData: [
      { year: "2022", netProfit: 26360.75, maxDd: 2879.50, sharpe: 3.55, sortino: 7.00, totalTrades: 108, totalPoints: 405.5500, winRate: "52.78%", profitFactor: 1.94, expectancy: 244.08, avgWin: 956.47, avgLoss: -552.12 },
      { year: "2023", netProfit: 6015.75, maxDd: 4803.50, sharpe: 0.68, sortino: 1.07, totalTrades: 110, totalPoints: 92.5500, winRate: "42.73%", profitFactor: 1.16, expectancy: 54.69, avgWin: 933.03, avgLoss: -610.27 },
      { year: "2024", netProfit: 28301.00, maxDd: 5733.00, sharpe: 3.49, sortino: 6.20, totalTrades: 83, totalPoints: 435.4000, winRate: "63.86%", profitFactor: 2.35, expectancy: 340.98, avgWin: 928.09, avgLoss: -696.26 },
      { year: "2025", netProfit: 35210.50, maxDd: 2626.00, sharpe: 4.17, sortino: 8.66, totalTrades: 106, totalPoints: 541.7000, winRate: "58.49%", profitFactor: 2.58, expectancy: 332.17, avgWin: 927.61, avgLoss: -506.85 },
      { year: "2026", netProfit: 7146.75, maxDd: 5544.50, sharpe: 1.89, sortino: 3.08, totalTrades: 61, totalPoints: 109.9500, winRate: "50.82%", profitFactor: 1.40, expectancy: 117.16, avgWin: 803.80, avgLoss: -592.37 },
    ],
    chartData: [0, 15, 20, 22, 45, 60, 65, 80, 100],
  },
  {
    id: "hf-titan", name: "High-Frequency Titan", tag: "HIGH REWARD",
    description: "Aggressive momentum breakout system trading high volume assets with statistical edge.",
    color: "#FD23E9", cagr: "112.4%", winRate: "54.1%", initialCapital: 500000,
    yearlyData: [
      { year: "2024", netProfit: 310264.50, maxDd: 53391.00, sharpe: 3.49, sortino: 7.64, calmar: 5.81, totalTrades: 83, totalPoints: 795.5500, winRate: "63.86%", profitFactor: 2.62, expectancy: 3738.13, avgWin: 9471.11, avgLoss: -6390.15 },
      { year: "2025", netProfit: 442435.50, maxDd: 22815.00, sharpe: 3.91, sortino: 9.85, calmar: 19.39, totalTrades: 83, totalPoints: 1146.4500, winRate: "56.63%", profitFactor: 3.10, expectancy: 5330.55, avgWin: 14561.34, avgLoss: -6151.27, tailRisk: -11166.68, var95: -10642.13, cvar95: -11124.75, recoveryTrades: 4, recoveryEfficiency: 110608.88, longestWinStreak: 6, longestLossStreak: 5 },
    ],
    chartData: [0, 5, 25, 20, 50, 45, 75, 85, 100],
  }
];

const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

const generateSvgPath = (data: number[], width: number, height: number) => {
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const stepX = width / (data.length - 1);
  return data.map((val, idx) => { const x = idx * stepX; const y = height - ((val - min) / range) * height; return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`; }).join(" ");
};

// ─── MAIN COMPONENT ───

export default function StrategiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDetail | null>(null);
  const [activeDeployedId, setActiveDeployedId] = useState(DEPLOYED[0].id);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const filteredStrategies = searchQuery ? searchStrategies(searchQuery) : PRE_BUILT_STRATEGIES;

  const activeDeployed = DEPLOYED.find(s => s.id === activeDeployedId) || DEPLOYED[0];

  const calculateOverallWinRate = (yearlyData: YearlyData[], fallback: string) => {
    let totalTrades = 0; let totalWins = 0;
    for (const row of yearlyData) {
      if (row.totalTrades && row.winRate) {
        const wr = parseFloat(row.winRate.replace('%', ''));
        totalTrades += row.totalTrades;
        totalWins += Math.round(row.totalTrades * (wr / 100));
      }
    }
    if (totalTrades === 0) return fallback;
    return ((totalWins / totalTrades) * 100).toFixed(2) + "%";
  };

  const calculateCAGR = (yearlyData: YearlyData[], initialCapital?: number, fallback: string = "") => {
    if (!initialCapital || yearlyData.length === 0) return fallback;
    const numYears = yearlyData.length;
    let totalProfit = 0;
    for (const row of yearlyData) totalProfit += row.netProfit;
    const finalValue = initialCapital + totalProfit;
    const cagr = (Math.pow(finalValue / initialCapital, 1 / numYears) - 1);
    return (cagr * 100).toFixed(1) + "%";
  };

  const dynamicWinRate = calculateOverallWinRate(activeDeployed.yearlyData, activeDeployed.winRate);
  const dynamicCAGR = calculateCAGR(activeDeployed.yearlyData, activeDeployed.initialCapital, activeDeployed.cagr);

  return (
    <div className="min-h-screen text-white font-sans" style={{ background: "#0B1120" }}>
      {/* ─── NAVBAR ─── */}
      <nav className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-40"
        style={{ background: "rgba(11, 17, 32, 0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <TreePine size={22} className="text-[#00D4FF]" />
            <span className="text-[#00D4FF]">Algofy</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Our Strategies", href: "/strategies", active: true },
              { label: "No Code Strategies", href: "/strategy-builder" },
              { label: "Reports", href: "/terminal" },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                    : "text-[#8A95A8] hover:text-white hover:bg-white/5"
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]" />
          </span>
          <span className="text-[11px] font-medium text-[#5A6680]">Live Engine</span>
        </div>
      </nav>

      {/* ─── HERO: PRE-BUILT STRATEGIES ─── */}
      <section className="relative px-6 pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.06), transparent 60%)" }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Pre-Built <span className="text-[#00D4FF]">Option Strategies</span>
            </h1>
            <p className="text-[#8A95A8] text-base max-w-2xl mx-auto">
              Expert-curated option strategies. Backtested. Ready to deploy. Learn, customize, and trade with confidence.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6680]" />
              <input
                type="text"
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-[#5A6680] focus:outline-none focus:border-[#00D4FF]/30 focus:ring-1 focus:ring-[#00D4FF]/20 transition-all"
              />
            </div>
          </motion.div>

          {/* Strategy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStrategies.map((strategy, i) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                index={i}
                onClick={() => setSelectedStrategy(strategy)}
              />
            ))}
          </div>

          {filteredStrategies.length === 0 && (
            <div className="text-center py-12 text-[#5A6680]">
              No strategies found matching "{searchQuery}"
            </div>
          )}
        </div>
      </section>

      <div className="h-px bg-white/[0.06] max-w-7xl mx-auto" />

      {/* ─── DEPLOYED MODELS SECTION ─── */}
      <section className="px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 size={18} className="text-[#00D4FF]" />
            <h2 className="text-xl font-bold text-white">Deployed Models</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Deployed Models List */}
            <aside className="w-full md:w-80 shrink-0">
              <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-[#5A6680] mb-2">Live Strategies</h3>
                {DEPLOYED.map((strategy) => {
                  const isActive = strategy.id === activeDeployedId;
                  return (
                    <button
                      key={strategy.id}
                      onClick={() => setActiveDeployedId(strategy.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 relative ${
                        isActive ? "bg-white/[0.04] border border-white/[0.08]" : "bg-transparent hover:bg-white/[0.02] border border-transparent"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: strategy.color }} />
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-medium transition-colors ${isActive ? "text-white" : "text-[#8A95A8]"}`}>
                          {strategy.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: strategy.color, backgroundColor: `${strategy.color}15` }}>
                          {strategy.tag}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-3">
                        <div>
                          <div className="text-[10px] text-[#5A6680] uppercase tracking-wider mb-0.5">CAGR</div>
                          <div className={`text-sm font-semibold ${isActive ? "text-white" : "text-[#8A95A8]"}`}>
                            {calculateCAGR(strategy.yearlyData, strategy.initialCapital, strategy.cagr)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[#5A6680] uppercase tracking-wider mb-0.5">Win Rate</div>
                          <div className={`text-sm font-semibold ${isActive ? "text-white" : "text-[#8A95A8]"}`}>
                            {calculateOverallWinRate(strategy.yearlyData, strategy.winRate)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right: Dashboard */}
            <main className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDeployed.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: activeDeployed.color }} />
                        <span className="text-[10px] font-mono text-[#5A6680] uppercase tracking-wider">
                          {activeDeployed.id.replace("-", " ")}
                        </span>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">
                        {activeDeployed.name}
                      </h1>
                      <p className="text-[#8A95A8] max-w-2xl text-sm leading-relaxed">
                        {activeDeployed.description}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-5 py-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] rounded-lg text-sm font-medium transition-all text-white">
                        View Logs
                      </button>
                      <button className="px-5 py-2 text-[#0B1120] rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                        style={{ backgroundColor: activeDeployed.color }}>
                        Deploy Node
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "CAGR", value: dynamicCAGR, icon: "📈" },
                      { label: "Win Rate", value: dynamicWinRate, icon: "🎯" },
                      { label: "Max DD Limit", value: "Strict", icon: "🛡️" },
                      { label: "Status", value: "Active", icon: "⚡", color: "#00C853" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <div className="text-[10px] font-mono text-[#5A6680] uppercase tracking-wider mb-2">{kpi.label}</div>
                        <div className="text-xl font-bold" style={{ color: kpi.color || "white" }}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Equity Chart */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-medium text-white">Cumulative Equity</h3>
                      <div className="flex gap-2">
                        {['1M', '3M', '1Y', 'ALL'].map(tf => (
                          <button key={tf} className="px-3 py-1 rounded-md bg-white/[0.03] text-xs font-medium text-[#5A6680] hover:text-white hover:bg-white/[0.06] transition-colors">
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="w-full h-64 relative">
                      <svg width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
                        <defs>
                          <linearGradient id={`grad-${activeDeployed.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeDeployed.color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={activeDeployed.color} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line key={i} x1="0" y1={`${i * 25}%`} x2="100%" y2={`${i * 25}%`} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        ))}
                        <path d={`${generateSvgPath(activeDeployed.chartData, 1000, 256)} L 1000 256 L 0 256 Z`} fill={`url(#grad-${activeDeployed.id})`} />
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                          d={generateSvgPath(activeDeployed.chartData, 1000, 256)}
                          fill="none" stroke={activeDeployed.color} strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Yearly Table */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <div className="p-5 border-b border-white/[0.06] flex justify-between items-center">
                      <h3 className="font-medium text-white">Yearly Comparison</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/[0.02] text-[10px] font-mono text-[#5A6680] uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="py-4 px-6">Year</th>
                            <th className="py-4 px-6 text-right">Net Profit</th>
                            <th className="py-4 px-6 text-right">Max DD</th>
                            <th className="py-4 px-6 text-right">Sharpe</th>
                            <th className="py-4 px-6 text-right">Sortino</th>
                            {activeDeployed.yearlyData.some(d => d.calmar !== undefined) && <th className="py-4 px-6 text-right">Calmar</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDeployed.yearlyData.map((row, idx) => {
                            const isExpanded = expandedYear === row.year;
                            const hasDetails = row.totalTrades !== undefined;
                            return (
                              <React.Fragment key={idx}>
                                <tr onClick={() => hasDetails && setExpandedYear(isExpanded ? null : row.year)}
                                  className={`border-b border-white/[0.04] transition-colors ${hasDetails ? 'hover:bg-white/[0.02] cursor-pointer' : ''} ${isExpanded ? 'bg-white/[0.02]' : ''}`}>
                                  <td className="py-3 px-6 text-sm text-[#8A95A8] flex items-center gap-2">
                                    {hasDetails && <span className={`text-[9px] text-[#5A6680] transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}>▶</span>}
                                    <span className="font-medium">{row.year}</span>
                                  </td>
                                  <td className="py-3 px-6 text-sm text-right text-[#00C853]">{formatCurrency(row.netProfit)}</td>
                                  <td className="py-3 px-6 text-sm text-right text-[#FF5252]">{formatCurrency(row.maxDd)}</td>
                                  <td className="py-3 px-6 text-sm text-right text-[#8A95A8]">{row.sharpe.toFixed(2)}</td>
                                  <td className="py-3 px-6 text-sm text-right text-[#8A95A8]">{row.sortino.toFixed(2)}</td>
                                  {row.calmar !== undefined && <td className="py-3 px-6 text-sm text-right text-[#8A95A8]">{row.calmar.toFixed(2)}</td>}
                                </tr>
                                <AnimatePresence>
                                  {isExpanded && hasDetails && (
                                    <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                      <td colSpan={10} className="p-0">
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-6 text-sm relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/[0.06]" />
                                            {[
                                              { label: "Total Trades", value: row.totalTrades },
                                              { label: "Total Points", value: row.totalPoints?.toFixed(4) },
                                              { label: "Win Rate", value: row.winRate },
                                              { label: "Profit Factor", value: row.profitFactor?.toFixed(2) },
                                              { label: "Expectancy", value: formatCurrency(row.expectancy || 0) },
                                              { label: "Avg Win", value: formatCurrency(row.avgWin || 0), color: "#00C853" },
                                              { label: "Avg Loss", value: formatCurrency(row.avgLoss || 0), color: "#FF5252" },
                                            ].map((item, i) => (
                                              <div key={i} className="space-y-1">
                                                <div className="text-[#5A6680] uppercase text-[10px] tracking-wider font-medium">{item.label}</div>
                                                <div className="font-medium" style={{ color: item.color || "#E8ECF1" }}>{item.value}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </motion.div>
                                      </td>
                                    </tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </section>

      {/* ─── STRATEGY DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedStrategy && (
          <StrategyDetailPanel
            strategy={selectedStrategy}
            onClose={() => setSelectedStrategy(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
