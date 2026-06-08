"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { LucideTrendingUp, LucideTrendingDown, LucideActivity, LucidePieChart, LucideShieldAlert, LucideZap } from "lucide-react";

// --- DATA DEFINITIONS ---

type YearlyData = {
  year: string;
  netProfit: number;
  maxDd: number;
  sharpe: number;
  sortino: number;
  calmar?: number;
  // Detailed Institutional Summary metrics
  totalTrades?: number;
  totalPoints?: number;
  winRate?: string;
  profitFactor?: number;
  expectancy?: number;
  avgWin?: number;
  avgLoss?: number;
  // Advanced Risk Metrics
  tailRisk?: number;
  var95?: number;
  cvar95?: number;
  recoveryTrades?: number;
  recoveryEfficiency?: number;
  longestWinStreak?: number;
  longestLossStreak?: number;
};

type Strategy = {
  id: string;
  name: string;
  tag: string;
  description: string;
  color: string;
  cagr: string;
  winRate: string;
  initialCapital?: number;
  yearlyData: YearlyData[];
  chartData: number[]; // Simplified cumulative curve points (0 to 100 scale)
};

const STRATEGIES: Strategy[] = [
  {
    id: "alpha-mean-rev",
    name: "Alpha Mean Reversion",
    tag: "LOW RISK",
    description: "Consistent mean-reversion algorithm exploiting intraday over-extensions with strict risk management.",
    color: "#00A7FA", // Blue
    cagr: "24.5%", // Fallback
    winRate: "68.2%", // Fallback
    initialCapital: 70000,
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
    id: "hf-titan",
    name: "High-Frequency Titan",
    tag: "HIGH REWARD",
    description: "Aggressive momentum breakout system trading high volume assets with statistical edge.",
    color: "#FD23E9", // Pink
    cagr: "112.4%", // Fallback
    winRate: "54.1%", // Fallback
    initialCapital: 500000,
    yearlyData: [
      { 
        year: "2024", netProfit: 310264.50, maxDd: 53391.00, sharpe: 3.49, sortino: 7.64, calmar: 5.81,
        totalTrades: 83, totalPoints: 795.5500, winRate: "63.86%", profitFactor: 2.62, expectancy: 3738.13, avgWin: 9471.11, avgLoss: -6390.15 
      },
      { 
        year: "2025", netProfit: 442435.50, maxDd: 22815.00, sharpe: 3.91, sortino: 9.85, calmar: 19.39,
        totalTrades: 83, totalPoints: 1146.4500, winRate: "56.63%", profitFactor: 3.10, expectancy: 5330.55, avgWin: 14561.34, avgLoss: -6151.27,
        tailRisk: -11166.68, var95: -10642.13, cvar95: -11124.75, recoveryTrades: 4, recoveryEfficiency: 110608.88, longestWinStreak: 6, longestLossStreak: 5
      },
    ],
    chartData: [0, 5, 25, 20, 50, 45, 75, 85, 100], 
  }
];

// --- HELPER COMPONENTS ---

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
};

const generateSvgPath = (data: number[], width: number, height: number) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const stepX = width / (data.length - 1);
  
  return data.map((val, idx) => {
    const x = idx * stepX;
    const y = height - ((val - min) / range) * height;
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(" ");
};

// --- MAIN COMPONENT ---

export default function StrategiesPage() {
  const [activeStrategyId, setActiveStrategyId] = useState(STRATEGIES[0].id);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const calculateOverallWinRate = (yearlyData: YearlyData[], fallback: string) => {
    let totalTrades = 0;
    let totalWins = 0;
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
    for (const row of yearlyData) {
      totalProfit += row.netProfit;
    }
    const finalValue = initialCapital + totalProfit;
    const cagr = (Math.pow(finalValue / initialCapital, 1 / numYears) - 1);
    return (cagr * 100).toFixed(1) + "%";
  };

  const toggleRow = (year: string) => {
    if (expandedYear === year) setExpandedYear(null);
    else setExpandedYear(year);
  };

  const activeStrategy = STRATEGIES.find(s => s.id === activeStrategyId) || STRATEGIES[0];
  const dynamicWinRate = calculateOverallWinRate(activeStrategy.yearlyData, activeStrategy.winRate);
  const dynamicCAGR = calculateCAGR(activeStrategy.yearlyData, activeStrategy.initialCapital, activeStrategy.cagr);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-blue-500/30">
      
      {/* Top Navbar */}
      <nav className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-950 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-xl tracking-tight hover:text-neutral-300 transition-colors">
            SIHL <span className="text-neutral-500 font-normal">TERMINAL</span>
          </Link>
          <div className="h-4 w-[1px] bg-neutral-800 mx-2" />
          <span className="text-xs text-neutral-400">Strategy Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-medium text-neutral-400">Live Engine</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        {/* LEFT SIDEBAR: Strategy Selection */}
        <aside className="w-full md:w-80 border-r border-neutral-800 bg-neutral-950 flex flex-col h-full overflow-y-auto overflow-x-hidden">
          <div className="p-5 border-b border-neutral-800">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Deployed Models</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search strategies..." 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-2 px-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 p-3 space-y-2">
            {STRATEGIES.map((strategy) => {
              const isActive = strategy.id === activeStrategyId;
              return (
                <button
                  key={strategy.id}
                  onClick={() => setActiveStrategyId(strategy.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 relative group ${
                    isActive 
                      ? "bg-neutral-900 shadow-sm" 
                      : "bg-transparent hover:bg-neutral-900/50"
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div 
                      className="absolute top-0 left-0 w-1 h-full rounded-l-lg" 
                      style={{ backgroundColor: strategy.color }}
                    />
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-medium transition-colors ${isActive ? "text-neutral-100" : "text-neutral-400 group-hover:text-neutral-200"}`}>
                      {strategy.name}
                    </h3>
                    <span 
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ 
                        color: strategy.color, 
                        backgroundColor: `${strategy.color}15`
                      }}
                    >
                      {strategy.tag}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end mt-3">
                    <div>
                      <div className="text-[11px] text-neutral-500 font-medium mb-0.5">CAGR</div>
                      <div className={`text-sm font-semibold ${isActive ? "text-neutral-100" : "text-neutral-400"}`}>{calculateCAGR(strategy.yearlyData, strategy.initialCapital, strategy.cagr)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-neutral-500 font-medium mb-0.5">Win Rate</div>
                      <div className={`text-sm font-semibold ${isActive ? "text-neutral-100" : "text-neutral-400"}`}>{calculateOverallWinRate(strategy.yearlyData, strategy.winRate)}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN CONTENT: Dashboard */}
        <main className="flex-1 bg-neutral-950 overflow-y-auto relative">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStrategy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-6 md:p-10 max-w-7xl mx-auto relative z-10"
            >
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-neutral-800 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: activeStrategy.color }}
                    />
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {activeStrategy.id.replace("-", " ")}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-neutral-100">
                    {activeStrategy.name}
                  </h1>
                  <p className="text-neutral-400 max-w-2xl text-sm leading-relaxed">
                    {activeStrategy.description}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button className="px-5 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-md text-sm font-medium transition-all">
                    View Logs
                  </button>
                  <button 
                    className="px-5 py-2 text-black rounded-md text-sm font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: activeStrategy.color, color: "#000" }}
                  >
                    Deploy Node
                  </button>
                </div>
              </div>

              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <LucideTrendingUp size={14} />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">CAGR</span>
                  </div>
                  <div className="text-xl font-bold text-neutral-100">{dynamicCAGR}</div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <LucidePieChart size={14} />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">Win Rate</span>
                  </div>
                  <div className="text-xl font-bold text-neutral-100">{dynamicWinRate}</div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <LucideShieldAlert size={14} />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">Max DD Limit</span>
                  </div>
                  <div className="text-xl font-bold text-neutral-100">Strict</div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <LucideZap size={14} />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">Status</span>
                  </div>
                  <div className="text-xl font-bold text-green-500">Active</div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 mb-8 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="font-medium text-neutral-300">Cumulative Equity</h3>
                  <div className="flex gap-2">
                    {['1M', '3M', '1Y', 'ALL'].map(tf => (
                      <button key={tf} className="px-3 py-1 rounded-md bg-neutral-900 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* SVG Line Chart */}
                <div className="w-full h-64 relative z-10">
                  <svg width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
                    <defs>
                      <linearGradient id={`grad-${activeStrategy.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeStrategy.color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={activeStrategy.color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line 
                        key={i} 
                        x1="0" 
                        y1={`${i * 25}%`} 
                        x2="100%" 
                        y2={`${i * 25}%`} 
                        stroke="rgba(255,255,255,0.03)" 
                        strokeWidth="1" 
                      />
                    ))}

                    <path
                      d={`${generateSvgPath(activeStrategy.chartData, 1000, 256)} L 1000 256 L 0 256 Z`}
                      fill={`url(#grad-${activeStrategy.id})`}
                      transform="scale(1) translate(0,0)" // Scale trick for full width responsive
                      vectorEffect="non-scaling-stroke"
                      className="w-full h-full"
                      style={{ transformOrigin: "0 0", transform: "scaleX(var(--sx)) scaleY(var(--sy))" }}
                    />
                    
                    {/* Animate path drawing */}
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d={generateSvgPath(activeStrategy.chartData, 1000, 256)}
                      fill="none"
                      stroke={activeStrategy.color}
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  
                  {/* SVG resizing fix using absolute trick */}
                  <style jsx>{`
                    svg {
                      width: 100%;
                      height: 100%;
                    }
                    path {
                      --sx: 1;
                      --sy: 1;
                    }
                  `}</style>
                  
                  {/* Interactive Crosshair (Dummy for visuals) */}
                  <div className="absolute top-0 bottom-0 right-[25%] w-[1px] bg-white/20 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity flex items-start justify-center">
                    <div 
                      className="px-2 py-1 bg-black/80 border border-white/10 rounded text-[10px] font-mono mt-[-20px] whitespace-nowrap"
                      style={{ color: activeStrategy.color }}
                    >
                      High: ₹4,12,000
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table Section */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                  <h3 className="font-medium text-neutral-200">Yearly Comparison</h3>
                  <button className="text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1">
                    Export CSV <LucideTrendingDown size={12} className="rotate-[-45deg]" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-900/30 text-[11px] font-semibold text-neutral-500 uppercase border-b border-neutral-800">
                        <th className="py-4 px-6 font-medium">Year</th>
                        <th className="py-4 px-6 font-medium text-right">Net Profit ₹</th>
                        <th className="py-4 px-6 font-medium text-right">Max DD ₹</th>
                        <th className="py-4 px-6 font-medium text-right">Sharpe</th>
                        <th className="py-4 px-6 font-medium text-right">Sortino</th>
                        {activeStrategy.yearlyData.some(d => d.calmar !== undefined) && (
                          <th className="py-4 px-6 font-medium text-right">Calmar</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {activeStrategy.yearlyData.map((row, idx) => {
                        const isExpanded = expandedYear === row.year;
                        const hasDetails = row.totalTrades !== undefined;
                        
                        return (
                          <React.Fragment key={idx}>
                            <tr 
                              onClick={() => hasDetails && toggleRow(row.year)}
                              className={`border-b border-neutral-800 transition-colors group ${hasDetails ? 'hover:bg-neutral-900 cursor-pointer' : ''} ${isExpanded ? 'bg-neutral-900' : ''}`}
                            >
                              <td className="py-3 px-5 text-sm text-neutral-300 flex items-center gap-2">
                                {hasDetails && (
                                  <span className={`text-[9px] text-neutral-500 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}>
                                    ▶
                                  </span>
                                )}
                                {!hasDetails && <span className="w-2" />}
                                <span className="font-medium">{row.year}</span>
                              </td>
                              <td className="py-3 px-5 text-sm text-right text-green-500">
                                {formatCurrency(row.netProfit)}
                              </td>
                              <td className="py-3 px-5 text-sm text-right text-red-400">
                                {formatCurrency(row.maxDd)}
                              </td>
                              <td className="py-3 px-5 text-sm text-right text-neutral-300">
                                {row.sharpe.toFixed(2)}
                              </td>
                              <td className="py-3 px-5 text-sm text-right text-neutral-300">
                                {row.sortino.toFixed(2)}
                              </td>
                              {row.calmar !== undefined && (
                                <td className="py-3 px-5 text-sm text-right text-neutral-300">
                                  {row.calmar.toFixed(2)}
                                </td>
                              )}
                            </tr>
                            
                            {/* Expandable Details Grid */}
                            <AnimatePresence>
                              {isExpanded && hasDetails && (
                                <tr className="bg-neutral-900 border-b border-neutral-800">
                                  <td colSpan={10} className="p-0">
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: "easeInOut" }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-6 text-sm relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neutral-700" />
                                        
                                        <div className="space-y-1">
                                          <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold flex items-center gap-1"><LucideActivity size={10}/> Total Trades</div>
                                          <div className="text-neutral-200 font-medium">{row.totalTrades}</div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Total Points</div>
                                          <div className="text-neutral-200 font-medium">{row.totalPoints?.toFixed(4)}</div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Win Rate</div>
                                          <div className="text-neutral-200 font-medium">{row.winRate}</div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Profit Factor</div>
                                          <div className="text-neutral-200 font-medium">{row.profitFactor?.toFixed(2)}</div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Expectancy</div>
                                          <div className="text-neutral-200 font-medium">{formatCurrency(row.expectancy || 0)}</div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Avg Win</div>
                                          <div className="text-green-500 font-medium">{formatCurrency(row.avgWin || 0)}</div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Avg Loss</div>
                                          <div className="text-red-400 font-medium">{formatCurrency(row.avgLoss || 0)}</div>
                                        </div>
                                        
                                        {/* Advanced Risk Metrics if available */}
                                        {row.var95 !== undefined && (
                                          <>
                                            <div className="col-span-2 md:col-span-4 h-[1px] bg-neutral-800 my-2" />
                                            <div className="space-y-1">
                                              <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">VaR (95%)</div>
                                              <div className="text-red-400 font-medium">{formatCurrency(row.var95)}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">CVaR (95%)</div>
                                              <div className="text-red-400 font-medium">{formatCurrency(row.cvar95 || 0)}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Recovery Trades</div>
                                              <div className="text-neutral-200 font-medium">{row.recoveryTrades}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <div className="text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">Rec. Efficiency</div>
                                              <div className="text-green-500 font-medium">{formatCurrency(row.recoveryEfficiency || 0)}</div>
                                            </div>
                                          </>
                                        )}
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
  );
}
